import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FullSnapInId, IHfwMessage, QParam, SnapInBase } from '@gms-flex/core';
import {
  BrowserObject,
  DocumentServiceBase,
  GmsManagedTypes,
  GmsMessageData,
  GmsSelectionType,
  SearchOption,
  SystemBrowserServiceBase
} from '@gms-flex/services';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { SearchViewComponent } from '../search/search.component';
import { DocumentSnapinService } from '../services/document-snapin.service';

export interface ParamsSendMessage {
  messageBody: any;
  preselection: boolean;
  qParam?: QParam;
  broadcast: false;
  applyRuleId?: string;
  secondarySelectionInSinglePane?: boolean;
}

@Component({
  selector: 'gms-document-snapin',
  providers: [],
  templateUrl: './document-snapin.component.html',
  styleUrl: '../gms-document-snapin.scss',
  standalone: false
})

export class DocumentSnapInComponent extends SnapInBase implements OnInit, OnDestroy {

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;
  @HostBinding('class.snapin-container-overflow-auto') public guardOverflow = true;

  public tileView = false;
  public labels: Map<string, string> = new Map<string, string>([
    ['NEW-TAB-BUTTON', ''],
    ['EMPTY-TITLE-FILE', ''],
    ['EMPTY-CONTENT-FILE', ''],
    ['SEARCH-PLACEHOLDER', '']
  ]);
  public selectedObject: BrowserObject;
  public message: any = undefined;
  public fullSnapInID: FullSnapInId = this.fullId;
  @ViewChild('searchComponent') private readonly searchComponent: SearchViewComponent;
  private _messageSubscription: Subscription;
  private readonly _subscriptions: Subscription[] = [];
  private readonly _trModule = 'gmsSnapins_DocumentViewer';

  public constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly traceService: TraceService,
    private readonly documentService: DocumentServiceBase,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly documentSnapinService: DocumentSnapinService,
    private readonly systemBrowserService: SystemBrowserServiceBase) {
    super(messageBroker, activatedRoute);
  }

  public ngOnInit(): void {
    this.traceService.debug(this._trModule, 'Component initialized.');

    this._subscriptions.push(
      this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
        if (defaultCulture != null) {
          this.traceService.info(this._trModule, `Use default culture: ${defaultCulture} `);
          this.translateService.setDefaultLang(defaultCulture);
        } else {
          this.traceService.warn(this._trModule, 'No default culture from appContextService');
          this.translateService.setDefaultLang(this.translateService.getBrowserLang());
        }
      }));

    this._subscriptions.push(
      this.appContextService.userCulture.subscribe((userCulture: string) => {
        if (userCulture != null) {
          this.traceService.info(this._trModule, `Use user culture: ${userCulture} `);
          this.translateService.use(userCulture).subscribe((res: any) => {
            this.traceService.info(this._trModule, `Use user culture loaded: ${userCulture} `);
            this.getTranslations();
          },
          (err: any) => {
            this.traceService.warn(this._trModule, `Use user culture loading failed: ${userCulture}; error: ${err}`);
          });
        } else {
          this.traceService.warn(this._trModule, 'No user culture from appContextService');
        }
      }));

    this._messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(
      (m => {
        this.traceService.debug(this._trModule, 'message arrived.', m);
        this.documentService.stopRequest();
        if (m != null) {
          if (m.data != null) {
            // tile view
            if (m != null && m.data[0].Attributes.ManagedType === GmsManagedTypes.FILE_VIEWER.id) {
              this.createTiles(m);
            } else if (m != null && m.data[0].Attributes.ManagedType === GmsManagedTypes.EXTERNAL_DOCUMENT.id) {
              // document view
              this.message = [m.data[0]];
              this.tileView = false;
            }
            // handle event treatment
          } else {
            this.tileView = false;
            this.systemBrowserService.searchNodes(1, m, null, SearchOption.objectId, false).toPromise().then(res => {
              if (res.Nodes != null) {
                this.message = [res.Nodes[0]];
              }
            });
          }
        }
      })
    );

    // Subscribing to the tile selection in overview page
    this._subscriptions.push(this.documentSnapinService.documentTileSelectionSub.subscribe(tile => {
      this.documentSnapinService.getTargetNavigationBrowserObj(tile).toPromise().then(navigationPage => {
        const navigationBrowserObject: BrowserObject[] = navigationPage.Nodes;
        const messageBody: GmsMessageData = new GmsMessageData(navigationBrowserObject, GmsSelectionType.Cns);
        const types: string[] = navigationBrowserObject.map((browserObject: BrowserObject) => browserObject.Attributes.ManagedTypeName);

        this.traceService.info(this._trModule, 'TrendSnapinComponent.ngOnInit():Selected browser object: ', navigationBrowserObject);
        const isPreselection = true;
        const qParamValue: QParam = null;
        const isBroadcast = false;
        const ruleName = 'new-primary-selection';
        const messageToSend: ParamsSendMessage = {
          messageBody,
          preselection: isPreselection,
          qParam: qParamValue,
          broadcast: isBroadcast,
          applyRuleId: ruleName
        };

        this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
          this.traceService.debug(this._trModule, 'sendMessage() completed. result: %s', res);
        });
      });
    }));

    this.traceService.debug(this._trModule, 'Component initialized.');
  }

  public ngOnDestroy(): void {
    this.documentService.stopRequest();

    this._subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });

    if (this._messageSubscription !== undefined) {
      this._messageSubscription.unsubscribe();
    }

    this.traceService.debug(this._trModule, 'Component destroyed.');
  }

  private getTranslations(): void {
    const translateKeys = Array.from(this.labels.keys());
    this.translateService.get(translateKeys).subscribe(strings => {
      this.labels = strings;
    });
  }

  private createTiles(message: any): void {
    this.traceService.debug(this._trModule, 'Creating tiles...');
    this.selectedObject = message.data[0];
    this.tileView = true;
  }
}
