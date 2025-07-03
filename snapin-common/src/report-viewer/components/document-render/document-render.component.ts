import { Component, ElementRef, EventEmitter,
  Inject,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AssistedTreatmentService, BrowserObject, LogViewerServiceBase,
  MultiMonitorServiceBase, ReportDocumentData, WSIProcedure, WSIStep } from '@gms-flex/services';
import { isNullOrUndefined } from '@siemens/ngx-datatable';
import { MenuItem } from '@simpl/element-ng';
import { Control, EditableTableResult, StateData } from '../../view-model/storage-vm';
import { ReportViewerService } from '../../services/report-viewer.service';
import { Subscription } from 'rxjs';
import { DeviceType, MobileNavigationService } from '@gms-flex/core';
import { TranslateService } from '@ngx-translate/core';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { EditableControlsComponent } from '../editable-controls/editable-controls.component';

@Component({
  selector: 'gms-document-render',
  templateUrl: './document-render.component.html',
  styleUrl: './document-render.component.scss',
  standalone: false
})
export class DocumentRenderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public selectedObject: BrowserObject;
  @Input() public fileUrl: any;
  @Input() public selectedDocuments: any = [];
  @Input() public lastShownDocumentData: ReportDocumentData;
  @Input() public isPreviewed: boolean;
  @Input() public stateDataObject: StateData;
  @Input() public docName: string;
  @Input() public pdf: boolean;
  @Input() public backBtnText: string;
  @Input() public reportPreviewText: string;
  @Input() public isEmpty: boolean;
  @Input() public fromEvents: boolean;
  @Input() public rptDesign: string;
  @Input() public isControlEditable: boolean;
  @Input() public editableControlData: Control[];
  @Input() public selectedEventOPId: string;
  @Input() public stepId: string;
  @Input() public procedureStepType: string;

  @Output() public readonly downloadReportEvent = new EventEmitter();
  @Output() public readonly emptyDownloadReportEvent = new EventEmitter();
  @Output() public readonly showHideReportEvent = new EventEmitter();
  @Output() public readonly storeObjectEmitter = new EventEmitter<StateData>(); // StateData;
  @Output() public readonly sendToOutputEvent = new EventEmitter();
  @Output() public readonly fillFormEvent = new EventEmitter();
  @Output() public readonly saveTreatmentFormEvent = new EventEmitter<string>();

  @ViewChild(EditableControlsComponent) public editableControlComponent!: EditableControlsComponent;

  public expandBtn: Element;
  public expandIndex: number;
  public storeObject: StateData;
  public loadReport = false;
  public multipleSelectionActive = false;
  public page = 1;
  public isElectron = false;
  public sourceUrl: any = undefined;
  public isMobileDevice = false;
  public deviceInfo: DeviceType | null = null;
  public newTabLabel = '';
  public webAppNotSupportedLabel = '';
  public isFormOpen = false;
  public systemId;
  public reportDefinitionId;
  public updatedStepData: any;
  public fetchedTableData: Map<number, EditableTableResult[]> = new Map<number, EditableTableResult[]>();
  public isEditable = new Map<number, any[]>();
  public toolbarPrimaryItems: MenuItem[] = [
    {
      title: 'REPORT-VIEWER.BTN.DOWNLOAD',
      icon: 'element-download',
      action: (): any => this.downloadReportEvent.emit()
    }
  ];

  public hasConfirmedExecution: boolean;
  public isCompleted: boolean;
  public isRepeatable = false;
  public disableFillform;
  public runtimeStatusChange;

  private _zoomSetting: number | string | undefined = 'page-width';
  private readonly currentZoomFactor: number;
  // private firstLoad = true;
  private path: string = undefined;
  private readonly subscriptions: Subscription[] = [];
  private readonly _trModule = 'gmsSnapins_DocumentRender';

  public ngOnChanges(changes: SimpleChanges): void {

    this.path = this.storeObject?.path;
    this.page = this.storeObject?.page;
    if (this.stateDataObject?.multipleHistoryRowSelectionMap?.size > 1) {
      this.selectedDocuments = [];
      for (const [key, value] of this.stateDataObject?.multipleHistoryRowSelectionMap.entries()) {
        if (value.selectedChildNames?.length === 0) {
          this.selectedDocuments.push(value.parentName);
          this.docName = value.parentName;
        } else {
          value.selectedChildNames.forEach(item => {
            this.selectedDocuments.push(item);
            this.docName = item;
          });
          this.isPreviewed = false;
        }
      }
    } else {
      // code is added when we deselect the child documents in the parent document then select parent preview of pdf is shown 
      if (this.stateDataObject?.multipleHistoryRowSelectionMap?.size === 1) {
        this.selectedDocuments = [];
        for (const [key, value] of this.stateDataObject?.multipleHistoryRowSelectionMap.entries()) {
          if (value.selectedChildNames?.length === 0) {
            this.selectedDocuments = [];
            this.selectedDocuments.push(value.parentName);
            this.docName = value.parentName;
          } else {
            value.selectedChildNames.forEach(item => {
              this.selectedDocuments.push(item);
              this.docName = item;
            });
            this.isPreviewed = false;
          }
        }
      }
    }
    this.zoomSetting = (this.storeObject?.zoomSetting as string) ?? 'page-width';
    if (this.fromEvents) {
      this.systemId = this.selectedObject.SystemId;
      this.reportDefinitionId = this.selectedObject.ObjectId;
      // this will get executed only for printout step and step report
      if (this.procedureStepType !== 'OPStepTreatmentForm') {
        this.setPrimaryContentActionsOnEvents(false);
      }
    }
    // getting subscrition after validation of editable control form.
    // It gets valiated in report service and notify.
    this.subscriptions.push(this.reportService.isFormValid.subscribe(data => {
      // If form has prefilled data and user edit or delete unitil one row in table is left the value.
      if (data.isChangeInRuntimeStatus) {
        this.setPrimaryContentActionsOnEvents(true, false)
        this.runtimeStatusChange = true;
        // If form is saved, then we edit but dont want to save again. And click on cancel
        if (this.toolbarPrimaryItems[this.getSendToOutputIndex()]?.disabled) {
          this.runtimeStatusChange = false;
        }
      } else {
        this.runtimeStatusChange = false;
        // if error = true, then we should disable both the buttons
        // if error = false, form is correct, so save button should be enabled and sendtoOutput should as it is, becasue save button is not yet clicked
        this.setPrimaryContentActionsOnEvents(data.error ? true : this.toolbarPrimaryItems[this.getSendToOutputIndex()]?.disabled, data.error);
      }
    }))
    if (!isNullOrUndefined(changes.fileUrl?.currentValue)) {
      const blob = new Response(this.fileUrl.url).text().then(r => {
        if (this.fileUrl.type === 'file' && this.fileUrl.path.split('.').pop() === 'txt') {
          this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(new Blob(['\ufeff', r], { type: 'text/plain' })));
        } else if (this.fileUrl.type === 'file' && this.fileUrl.path.split('.').pop() === 'html') {
          this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(new Blob(['\ufeff', r], { type: 'text/html' })));
        } else {
          if (this.fileUrl.url) {
            this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.fileUrl.url));
            this.sourceUrl = this.fileUrl;
          }
        }
      });
    }
  }

  public ngOnInit(): void {

    // Get device information
    this.deviceInfo = this.mobileNavigationService.getDeviceInfo();

    // If Android Device or iOS open the report in new tab as it is not yet supported by default PDF library
    this.isMobileDevice = this.deviceInfo === DeviceType.Iphone || this.deviceInfo === DeviceType.Ipad || this.deviceInfo === DeviceType.Android;

    // Check If running in Electron
    this.isElectron = this.multiMonitorService.runsInElectron;

    this.storeObject = this.stateDataObject;

    if (this.fromEvents) {
      if (this.procedureStepType !== 'OPStepTreatmentForm') {
        this.setPrimaryContentActionsOnEvents(false);
      } else {
        // In case of OPStepTreatmentForm, to get the details of editable controls present.
        this.getControlsForReportDefination();
      }
    }
    this.subscriptions.push(
      this.appContextService.userCulture.subscribe((cult: string) => {
        if (cult != null) {
          this.translateService.use(cult).subscribe((res: any) => {
            this.traceService.info(this._trModule, 'Use user Culture');
          },
          (err: any) => {
            this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
              if (defaultCulture != null) {
                this.translateService.setDefaultLang(defaultCulture);
              } else {
                this.traceService.warn(this._trModule, 'No default Culture for appContextService');
                this.translateService.setDefaultLang(this.translateService.getBrowserLang());
              }
            }));
          });
        } else {
          this.traceService.warn(this._trModule, 'No user Culture for appContextService');
        }
      })
    );
    this.subscriptions.push(this.reportService.sendToOutputEvent.subscribe(res => {
      if (res) {
        if (this.procedureStepType === 'OPStepTreatmentForm') {
          // enable sendtoOutput and save button also based on state of send to output button.
          // Send to output will be enabled when Save is enabled
          // Send to outout will be disabled when save is disabled.
          this.setPrimaryContentActionsOnEvents(this.toolbarPrimaryItems[this.getSendToOutputIndex()].disabled,
            this.toolbarPrimaryItems[this.getSendToOutputIndex()].disabled);
        } else {
          this.setPrimaryContentActionsOnEvents(false);
        }
      }
    }));

    if (this.procedureStepType === 'OPStepTreatmentForm') {
      this.subscriptions.push(this.assistedTreatmentService.getProcedure(this.selectedEventOPId).subscribe({ next: (data: WSIProcedure) => {
        data.Steps.forEach((res: WSIStep) => {
          if (res.ManagedType === 'OPStepTreatmentForm' && res.Attributes.includes('Unrepeteable') && res.IsCompleted) {
            this.isRepeatable = true;
          }
        });
      }, error: err => {
        this.traceService.warn('document-render', `error occured at getProcedure ${err}`);
      }
      }));
    }

  }

  public ngOnDestroy(): void {
    this.saveStorage();
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });
    this.storeObjectEmitter.emit(this.storeObject);
  }

  constructor(
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    private readonly eleRef: ElementRef,
    private readonly sanitizer: DomSanitizer,
    private readonly reportService: ReportViewerService,
    private readonly logViewerService: LogViewerServiceBase,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    private readonly translateService: TranslateService,
    private readonly traceService: TraceService,
    private readonly appContextService: AppContextService,
    private readonly assistedTreatmentService: AssistedTreatmentService) {}

  public onBackButton(): void {
    this.showHideReportEvent.emit();
  }

  public get zoomSetting(): string {
    return String(this._zoomSetting);
  }

  public set zoomSetting(zoom: string) {
    if (isNaN(Number(zoom))) {
      this._zoomSetting = zoom;
    } else {
      this._zoomSetting = zoom + '%';
    }
  }

  public emptyDownloadButton(): void {
    this.emptyDownloadReportEvent.emit();
  }

  public downloadReportClick(): void {
    this.downloadReportEvent.emit();
  }

  public handleSaveEvent(event): void {
    this.saveTreatmentFormEvent.emit(event);
  }
  // apply storageService scrollbar position into pdfjs on load
  public updateScroll(): void {
    this.storeObject.scrollTop = this.eleRef.nativeElement.querySelector('#viewerContainer').scrollTop;
    this.storeObject.scrollLeft = this.eleRef.nativeElement.querySelector('#viewerContainer').scrollLeft;
  }

  private setPrimaryContentActionsOnEvents(disableSendToOutput: boolean, disableSaveButton: boolean = false,
    cancelButton: boolean = false, disableFillFormBtn: boolean = false): void {
    this.toolbarPrimaryItems = [];

    if (this.procedureStepType === 'OPStepTreatmentForm') {
      if (!this.isFormOpen) {
        this.toolbarPrimaryItems = [{
          title: 'REPORT-VIEWER.BTN.FILL-FORM',
          icon: 'element-send-to',
          action: (): any => this.fillFormActionClick(),
          disabled: disableFillFormBtn
        }];
        if (this.isRepeatable) {
          this.toolbarPrimaryItems[0].disabled = true;
        }
      } else if (this.isFormOpen) {
        this.toolbarPrimaryItems = [{
          title: 'REPORT-VIEWER.BTN.SAVE-FORM',
          icon: 'element-send-to',
          action: (): any => this.saveActionClick(),
          disabled: disableSaveButton
        }];
        // to enable cancel button at the end
        this.toolbarPrimaryItems.unshift({
          title: 'REPORT-VIEWER.BTN.CANCEL',
          icon: 'element-cancel',
          action: (): any => this.cancelTreatmentForm(),
          disabled: cancelButton
        });
      }
    }

    this.toolbarPrimaryItems.push({
      title: 'REPORT-VIEWER.BTN.SEND-TO-OUTPUT',
      icon: 'element-send-to',
      action: (): any => this.sendToOutputActionClick(),
      disabled: disableSendToOutput
    });

  }

  private getSendToOutputIndex(): number {
    const index = this.toolbarPrimaryItems.findIndex(item => {
      // remove first condition once transaltion is fixed
      return item.title === "REPORT-VIEWER.BTN.SEND-TO-OUTPUT" || item.title === 'Save/Print';
    });
    return index;

  }

  private saveStorage(scrollTop?: number, scrollLeft?: number): void {
    this.storeObject.lastShownDocumentData = this.lastShownDocumentData;
    this.storeObject.path = this.path;
    this.storeObject.index = this.expandIndex ?? -1;
    this.storeObject.zoomSetting = this.zoomSetting ?? 'page-width';
    this.storeObject.zoomFactor = this.currentZoomFactor;
    this.storeObject.page = this.page ?? 1;
    if (scrollTop) {
      this.storeObject.scrollTop = scrollTop;
    }
    if (scrollLeft) {
      this.storeObject.scrollLeft = scrollLeft;
    }
    this.storeObject.designation = this.selectedObject.Designation;
    if ((this.storeObject?.multipleHistoryRowSelectionMap?.size > 0) && (this.lastShownDocumentData?.DocumentDisplayName)) {
      this.selectedDocuments = this.lastShownDocumentData.DocumentDisplayName;
    }
  }

  private sendToOutputActionClick(): void {
    if (this.toolbarPrimaryItems.length > 0) {
      this.toolbarPrimaryItems[0].disabled = true;
    }
    this.sendToOutputEvent.emit();
  }

  private fillFormActionClick(): void {
    if (this.fromEvents && this.isControlEditable) {
    // this.fillFormEvent.emit(true);
      this.isFormOpen = true;
      // enable/ disabled sendtoOutput and save button also based on state of send to output button.
      // Send to output will be enabled when Save is enabled
      // Send to outout will be disabled when save is disabled.
      this.setPrimaryContentActionsOnEvents(this.toolbarPrimaryItems[this.getSendToOutputIndex()].disabled,
        this.toolbarPrimaryItems[this.getSendToOutputIndex()].disabled);
    }
  }

  private saveActionClick(): void {
    this.fileUrl = '';
    this.reportService.treatmentFormUpdateEvent.next(true);
    this.editableControlComponent.saveTreatmentForm();
    this.isFormOpen = false;
    // as user is clicking on save button, it means all controls has the data and form is also saved.
    // as form is saved, we should enable the send to output button
    this.setPrimaryContentActionsOnEvents(false, false);
  }

  private cancelTreatmentForm(): void {
    if (this.fromEvents && this.isControlEditable) {
      this.isFormOpen = false;
      this.getTreatmentFormData();

      if (this.runtimeStatusChange) {
        // Send to output should not be disabled
        this.setPrimaryContentActionsOnEvents(true, false);
      } else {
        // on click of cancel button. preview will be shown with previous data
        // Both buttons should be enabled
        this.setPrimaryContentActionsOnEvents(false, false);
      }
    }
  }

  private getTreatmentFormData(): void {
    // To get the procedure details from API
    this.subscriptions.push(this.assistedTreatmentService.getProcedure(this.selectedEventOPId).subscribe({
      next: (data: WSIProcedure) => {
        // Calls the runtimestatus from report service, to check wheter wer have prefilled data in XMl or not.
        this.updatedStepData = this.reportService.getRuntimeStatus(data.Steps, this.stepId, this.procedureStepType, this.editableControlData
          , this.fetchedTableData);
      }, error: err => {
        this.traceService.warn('Treatment form ', `error occured at getProcedure ${err}`);
      }
    }));
  }

  private getControlsForReportDefination(): void {
    // To get the control details only from API.
    // It does not return data of the control
    this.logViewerService.getReportDefination(this.systemId, this.reportDefinitionId).subscribe(
      { next: data => {
        this.editableControlData = data?.ReportDefinationInfo?.layoutDefination?.pageContentSection?.Controls;
        this.isControlEditable = this.editableControlData?.length ? true : false;
        // checking control data is present for treatment
        if (this.isControlEditable) {
          // To check we have valid controls added and based on that enable fillform button.
          this.disableFillform = this.editableControlData.find(control => control.ControlName == 'ElementEditableTextField'
          || control.ControlName == 'ElementCommentTable' || control.ControlName == 'ElementTextGroup' ||
          control.ControlName == 'ElementComboBox') ? false : true;
          // If we have valid editable controls then we will fetch step info
          if (!this.disableFillform) {
            // to get procedure information for treatment step
            this.getTreatmentFormData();
          } else {
            // If we do not have valid editable controls then we will disable fill form button
            this.setPrimaryContentActionsOnEvents(false, true, false, true);
          }
        } else {
          this.setPrimaryContentActionsOnEvents(false, true, false, true);
        }
      }, error: err => {
        this.isControlEditable = false;
        // this.traceService.warn('apllication-rules', `error occured at readPropertiesAndValue ${err}`);
      }
      });
  }
}
