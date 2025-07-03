import { Component, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { OwnershipServiceBase, SearchOption, SiIconMapperService, SystemBrowserServiceBase, TablesEx } from '@gms-flex/services';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { SelectionType, TableColumn } from '@siemens/ngx-datatable';
import { ModalRef, SiModalService } from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable';
import { TraceModules } from '../../shared/trace-modules';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { BrowserObjectService } from '../services/browser-object.service';

@Component({
  selector: 'gms-ownership-dialog',
  templateUrl: './ownership-dialog.component.html',
  styleUrl: './ownership-dialog.component.scss',
  standalone: false
})

export class OwnershipDialogComponent implements OnInit {
  @ViewChild('statusCellTempl', { static: true }) public statusCellTempl!: TemplateRef<any>;
  @ViewChild('request', { static: true }) public requestTempl!: TemplateRef<any>;
  @ViewChild('transfer', { static: true }) public transferTempl!: TemplateRef<any>;

  public selectionType = SelectionType.multiClick;
  public selectionTypes = Object.keys(SelectionType);
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public from = '';
  public to = '';
  public interval: any;
  public columns!: TableColumn[];
  public selectedNodes: any[] = [];
  public rows = [];
  public translationStrings: Map<string, string> = new Map<string, string>();
  public timer = 120;
  private ref?: ModalRef<unknown>;

  constructor(
    private readonly modalService: SiModalService,
    private readonly ownershipService: OwnershipServiceBase,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly eventCommonService: EventsCommonServiceBase,
    private readonly iconMapperService: SiIconMapperService,
    private readonly browserObjectService: BrowserObjectService,
    private readonly ngZone: NgZone
  ) {
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnInit(): void {
    this.appContextService.userCulture.subscribe((cult: string) => {
      if (cult != null) {
        this.translateService.use(cult).subscribe((res: any) => {
          this.traceService.info(TraceModules.ownershipDialog, 'Use user Culture');
          this.getTranslations();
        },
        (err: any) => {
          this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
            if (defaultCulture != null) {
              this.translateService.setDefaultLang(defaultCulture);
            } else {
              this.traceService.warn(TraceModules.ownershipDialog, 'No default Culture for appContextService');
              this.translateService.setDefaultLang(this.translateService.getBrowserLang());
            }
            this.getTranslations();
          });
        });
      } else {
        this.traceService.warn(TraceModules.ownershipDialog, 'No user Culture for appContextService');
      }
    });

    this.initColumns();

    // Create WSI subscription
    this.ownershipService.subscribeOwnership().subscribe(res => {
      this.traceService.info(TraceModules.ownershipDialog, 'Subscribed to ownership service correctly.');
    });

    // Subscribe to ownership requests and transfers
    this.ownershipService.ownershipNotification().subscribe((res: any) => {
      this.traceService.info(TraceModules.ownershipDialog, 'New ownership notification: ' + JSON.stringify(res));

      // Search node to retrieve description
      this.browserObjectService.getSystemIdFromSystemName(res.Area.split(':')[0]).then(systemId => {
        this.systemBrowserService.searchNodes(systemId, res.Area.split(':')[1], null, SearchOption.objectId, false).toPromise().then(node => {
          // Populate dialog data
          this.iconMapperService
            .getGlobalIcon(TablesEx.ObjectSubTypes, node.Nodes[0].Attributes.SubTypeId, node.Nodes[0].Attributes.TypeId)
            .toPromise()
            .then(iconString => {
              const row: any = {
                source: node.Nodes[0].Descriptor,
                status: 'success',
                icon: iconString,
                context: res.Context
              };
              this.rows.push(row);
              this.rows = [...this.rows];

              this.from = res.From;
              this.to = res.To;

              // Open modal
              if (this.rows.length === 1) {
                if (res.From === res.Inquired) {
                // Request modal
                  this.openModal('request', this.requestTempl);
                } else {
                // Transfer modal
                  this.openModal('transfer', this.transferTempl);
                }
              }
            });
        });
      });
    });
  }

  public openModal(type: string, template: TemplateRef<any>, modalClass?: string): void {
    this.ref?.hide();
    this.ref = this.modalService.show(template, {
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      class: modalClass,
      ariaLabelledBy: 'sample-modal-title'
    });

    // Start timeout timer
    this.ngZone.runOutsideAngular(() => {
      this.interval = setInterval(() => {
        this.timer -= 1;
        this.translationStrings.set('timeout-request', this.translateService.instant('OWNERSHIP-DIALOG.TIMEOUT-REQUEST', { time: this.timer }));
        this.translationStrings.set('timeout-transfer', this.translateService.instant('OWNERSHIP-DIALOG.TIMEOUT-TRANSFER', { time: this.timer }));
        if (this.timer === 0) {
          if (type === 'request') {
            this.onDialogConfirmation(2);
          } else if (type === 'transfer') {
            this.onDialogConfirmation(0);
          }
        }
      }, 1000);
    });

    this.traceService.info(TraceModules.ownershipDialog, 'Opened ownership modal');
  }

  public onSelect(event: any): void {
    // Select nodes
    this.selectedNodes = event.selected;
    this.traceService.info(TraceModules.ownershipDialog, 'Ownership modal: node selected in table: ' + JSON.stringify(event.selected));
  }

  // Grant 0 = "Deny all"
  // Grant 1 = "Accept selection"
  // Grant 2 = "Accept all (timeout case w/request dialog)"
  public onDialogConfirmation(grant: number): void {
    let body: any = {};
    // If granting request or transfer, set grants to true for nodes selected in the table
    if (grant === 1) {
      const nodes: any = [];
      const grants: boolean[] = [];
      this.rows.forEach(row => {
        nodes.push(row.context);
        if (this.selectedNodes.find(node => node.context === row.context) !== undefined) {
          grants.push(true);
        } else {
          grants.push(false);
        }
      });
      body = {
        RequestIds: nodes,
        Granted: grants
      };
    } else if (grant === 0) {
      // If denying request or transfer, set grants to false for all nodes regardless of selection
      const nodes: any = [];
      const grants: boolean[] = [];
      this.rows.forEach(row => {
        nodes.push(row.context);
        grants.push(false);
      });
      body = {
        RequestIds: nodes,
        Granted: grants
      };
    } else if (grant === 2) {
      // Granting for all nodes, regardless of selection
      const nodes: any = [];
      const grants: boolean[] = [];
      this.rows.forEach(row => {
        nodes.push(row.context);
        grants.push(true);
      });
      body = {
        RequestIds: nodes,
        Granted: grants
      };
    }
    // Update ownership for all nodes
    this.ownershipService.updateOwnership(body).toPromise().then((res: any) => {
      if (res.IsSuccessful === true) {
        this.onDialogClose();
        this.traceService.info(TraceModules.ownershipDialog, 'Succesfully updated ownership for the selected nodes.');
      } else {
        this.traceService.error(TraceModules.ownershipDialog, 'Ownership update failed.');
      }
    });
  }

  public onDialogClose(): void {
    // Close dialog, reset rows and selection
    this.ref?.hide();
    this.rows = [];
    this.selectedNodes = [];
    clearInterval(this.interval);
    this.timer = 120;
    this.translationStrings.set('timeout-request', this.translateService.instant('OWNERSHIP-DIALOG.TIMEOUT-REQUEST', { time: this.timer }));
    this.translationStrings.set('timeout-transfer', this.translateService.instant('OWNERSHIP-DIALOG.TIMEOUT-TRANSFER', { time: this.timer }));
  }

  private initColumns(): void {
    this.columns = [
      {
        prop: 'user',
        name: '',
        width: 105,
        resizeable: false,
        canAutoResize: false,
        cellTemplate: this.statusCellTempl,
        checkboxable: true,
        headerCheckboxable: true,
        frozenLeft: true
      },
      {
        prop: 'source',
        name: 'Source',
        canAutoResize: true
      }
    ];
  }

  private getTranslations(): void {
    this.translateService.get([
      'OWNERSHIP-DIALOG.OWNERSHIP-REQUEST-TITLE',
      'OWNERSHIP-DIALOG.FROM',
      'OWNERSHIP-DIALOG.TO',
      'OWNERSHIP-DIALOG.ACCEPT-SELECTION',
      'OWNERSHIP-DIALOG.DENY-ALL',
      'OWNERSHIP-DIALOG.OWNERSHIP-TRANSFER-TITLE',
      'OWNERSHIP-DIALOG.OK',
      'OWNERSHIP-DIALOG.CANCEL',
      'OWNERSHIP-DIALOG.TIMEOUT-REQUEST',
      'OWNERSHIP-DIALOG.TIMEOUT-TRANSFER'
    ], { time: this.timer }).subscribe(res => {
      this.translationStrings.set('ownership-request-title', res['OWNERSHIP-DIALOG.OWNERSHIP-REQUEST-TITLE']);
      this.translationStrings.set('from', res['OWNERSHIP-DIALOG.FROM']);
      this.translationStrings.set('to', res['OWNERSHIP-DIALOG.TO']);
      this.translationStrings.set('accept-selection', res['OWNERSHIP-DIALOG.ACCEPT-SELECTION']);
      this.translationStrings.set('deny-all', res['OWNERSHIP-DIALOG.DENY-ALL']);
      this.translationStrings.set('ownership-transfer-title', res['OWNERSHIP-DIALOG.OWNERSHIP-TRANSFER-TITLE']);
      this.translationStrings.set('ok', res['OWNERSHIP-DIALOG.OK']);
      this.translationStrings.set('cancel', res['OWNERSHIP-DIALOG.CANCEL']);
      this.translationStrings.set('timeout-request', res['OWNERSHIP-DIALOG.TIMEOUT-REQUEST']);
      this.translationStrings.set('timeout-transfer', res['OWNERSHIP-DIALOG.TIMEOUT-TRANSFER']);
    });
  }
}
