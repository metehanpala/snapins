import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AssistedTreatmentService, BrowserObject, CreateDocumentData, DocumentTypes, GmsManagedTypes, GmsMessageData,
  PropertyValuesService,
  RelatedItemsRepresentation,
  ReportContext, ReportDocumentData, ReportExecutionParams, ReportExecutionStatus, ReportHistoryData,
  ReportHistoryResult, ReportStartResult, ServiceRequestInfo, Step, ViewNode, WSIProcedure
} from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { PreviewMasterComponent } from '../components/preview-master/preview-master.component';
import { ALARM_PRINTOUT_MANAGE_TYPE, ReportViewerService } from '../services/report-viewer.service';
import { MultipleHistoryRowSelectionMapData, ParameterRelatedInfo, SelectedRuleDetails, 
  SetActiveReport, ShowReportHistory, StateData } from '../view-model/storage-vm';
import { TranslateService } from '@ngx-translate/core';
import { FullSnapInId, IHfwMessage } from '@gms-flex/core';
import { SiToastNotificationService } from '@simpl/element-ng';
import { ResolveExecutionResult, ResolveExecutionStatus } from '../../events/event-data.model';

const SEARCH_WILDCARD = '.*';
@Component({
  selector: 'gms-report-view',
  templateUrl: './report-view.component.html',
  styleUrl: './report-view.component.scss',
  standalone: false
})

export class ReportViewComponent implements OnInit, OnDestroy, OnChanges {

  @Input() public storeObject: StateData;
  @Input() public selectedObjectsData: BrowserObject[];
  @Input() public fullId: FullSnapInId;
  @Input() public storageService: any;
  @Input() public fromEvents: boolean;
  @Input() public selectedEvent: string;
  @Input() public selectedEventOPId: string;
  @Input() public stepId: string;
  @Input() public step: Step;
  @Input() public selectedEventDesignation: string;
  @Input() public manageType: string;
  @Input() public isFromRightPane: boolean;

  // input and ouputs for the OP step resolve execution
  @Input() public resolveObs: BehaviorSubject<boolean> = new BehaviorSubject(null);
  @Output() public readonly resolveExecutionResult: EventEmitter<ResolveExecutionResult> = new EventEmitter<ResolveExecutionResult>();

  @Output() public readonly storeObjectEmitter = new EventEmitter<StateData>();
  @Output() public readonly sendToOutputEmitter = new EventEmitter<boolean>();
  @Output() public readonly savedSelectedRule = new EventEmitter<SelectedRuleDetails>();
  @Output() public readonly setActiveEvent = new EventEmitter<SetActiveReport>();
  @Output() public readonly showReportEvent = new EventEmitter<ShowReportHistory>();
  @Output() public readonly scrollHandlerEvent = new EventEmitter<number>();
  @Output() public readonly saveTreatmentFormEvent = new EventEmitter<string>();
  @Output() public readonly keydownEventFormultipleHistoryRowSelectionEmitter = new EventEmitter<boolean>();
  @Output() public readonly selectiondocumentMapEmitter = new EventEmitter<Map<string, MultipleHistoryRowSelectionMapData>>();
  @Output() public readonly expandRowEventData = new EventEmitter<number>();

  public originSnapInId: string;
  public isActiveEventsReport = false;
  public isHistoryFirstLoad = true;
  public selectedObject: BrowserObject;
  public selectedReportName: string;
  public reportHistoryData: ReportHistoryData[];
  public isHistoryVisible = false;
  public docName: string;
  public downloadAvailable: boolean;
  public historyLoaded = false;
  public isReportManagerPresent: boolean | undefined = undefined;
  public visibleView: 'docuview' | 'emptyReportView' = 'docuview';
  public isReportManagerPresentPerSystem: Map<number, boolean | undefined> = new Map<number, boolean>();
  public tileView = false;
  public pdf = false;
  public isReportDefault = true;
  public multipleBrowserObjects = false;
  public canHistoryLoaded = false;
  public isEmpty = false;
  public isApprightNotAvailableForAssistedTreatment = false;
  public searchNodesNeeded = true;
  public nodeSearchString = '';
  public expandIndex: number;
  public browserObject: BrowserObject[];
  public systemId: number;
  public service_unavailableErrorTitle = '';
  public service_unavailableErrorMsg = '';
  public createDocumentData: CreateDocumentData = {
    /** WSI response is contradicting with camel case hence need to suspend this rule. */
    /* eslint-disable @typescript-eslint/naming-convention */
    SystemId: null,
    ReportExecutionParams: null
    /* eslint-enable @typescript-eslint/naming-convention */
  };
  public reportDefinitionId: string;
  public relatedItem: RelatedItemsRepresentation[] = [];
  public displayNameMap: Map<string, string> = new Map<string, string>();
  public executionIdMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
  public parameterRelatedInfo: ParameterRelatedInfo;
  public showhistory: ShowReportHistory;
  public setActive: SetActiveReport;
  public isTreamentUpdateFromControl: boolean;
  public runTimeStatus: string;

  private readonly execActivationMap: Map<string, boolean> = new Map<string, boolean>(); // Map<execId, isRowSelected>
  private readonly _trModule = 'gmsSnapinsCommon_ReportPreviewContainer';
  private readonly assistedReportId = '_AT';
  private previousSystemId: number = null;
  private reportServiceNotifSub: Subscription;
  private readonly _userCultureSubscription: Subscription = new Subscription();
  private nodeName: string;
  private StatusType: 'success' | 'info' | 'warning' | 'danger';
  private reportContext: ReportContext = null;
  private execNameForContext = '';
  private isFirstTimeHistoryReceived: boolean;
  private readonly reportNameFilter: string[] = [];
  private callFromExecution = false;
  private isRerportExecutedForControl = false;
  private notificationSubsExecutionCount = 0;
  private isReportViewInitialized: boolean;
  private executionResult: ResolveExecutionResult = {
    status: ResolveExecutionStatus.Failure
  };

  // Subscription variables
  private reportSubscription: Subscription = new Subscription();
  private readonly mainSubs: Subscription = new Subscription();
  private reportNotificationSub: Subscription = null;
  private reportExecutionSub: Subscription;
  private translateSub: Subscription;
  private showReportSub: Subscription;
  private searchNodeSub: Subscription;
  private subscriptions: Subscription[] = [];
  private readonly managedTypeName: string[] = ['Reports', 'ReportDefinition', 'ReportFolder'];

  @ViewChild(PreviewMasterComponent) private readonly previewMasterComponent: PreviewMasterComponent;

  constructor(private readonly traceService: TraceService,
    private readonly cd: ChangeDetectorRef,
    private readonly reportService: ReportViewerService,
    private readonly propertyService: PropertyValuesService,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly assistedTreatmentService: AssistedTreatmentService) { }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!isNullOrUndefined(changes.selectedObjectsData) && this.selectedObjectsData?.length && !isNullOrUndefined(this.selectedObjectsData[0])) {
      if (changes.selectedObjectsData.currentValue?.[0]?.Designation !== this.selectedObject?.Designation) {
        if (this.storageService?.getRelatedItemsFromStorage(this.fullId)) {
          this.relatedItem = [...this.storageService.getRelatedItemsFromStorage(this.fullId)].sort((a, b) =>
            a.ItemDescriptor.localeCompare(b.ItemDescriptor, undefined, { sensitivity: 'base' }));
        } else {
          this.relatedItem = [];
          if (this.previewMasterComponent?.isParameterOpen) {
            this.previewMasterComponent.isParameterOpen = false;
          }
        }
        this.checkReportRights();

        if (!this.isEmpty) {
          // restrict duplicate call to method, if already executed from ngOnInit()
          // need to call when we have this.selectedObjectsData object for assisted treatment execution
          if (!this.isReportViewInitialized) {
            this.initializationForAsistedTreatement();
          }
          this.processRequest(this.selectedObjectsData);
        }
      }
      if (changes?.storeObject) {
        this.showhistory = changes?.storeObject?.currentValue?.showReportHistory;
        this.setActive = changes?.storeObject?.currentValue?.setActiveReport;
      }
    }
  }

  public ngOnInit(): void {
    this.getTranslations();
    this.originSnapInId = this.fullId?.fullId();
    this.traceService.debug(this._trModule, 'Component initialization started.');
    this.reportService.isSpinnerInEditableControl.subscribe(res => {
      this.historyLoaded = res;
    })

    this.checkReportRights();
    this.setupDefaultCulture();
    this.setupUserCulture();
    if (!this.isEmpty) {
      if (this.selectedObjectsData.length && !this.isReportViewInitialized) {
        this.initializationForAsistedTreatement();
      }
      this.subscriptions.push(this.reportService.paramatersRelatedInfo.subscribe({
        next: (paramatersRelatedInfo: ParameterRelatedInfo) => {
          this.parameterRelatedInfo = paramatersRelatedInfo;
          if (paramatersRelatedInfo
            && !!paramatersRelatedInfo.ruleObjectId && !!paramatersRelatedInfo.selectionContext) {
            // call report history inedependent of rptDesign and paramter list
            // restrict duplicate call to getHistory Api, this should call in case of advanced reporting only
            if (!paramatersRelatedInfo.rptdesign && paramatersRelatedInfo.parametersLoading
              && this.reportDefinitionId !== this.selectedObject.ObjectId + '$' + paramatersRelatedInfo.ruleObjectId
              && !this.managedTypeName.includes(this.selectedObjectsData[0]?.Attributes?.ManagedTypeName)) {
              this.reportDefinitionId = this.selectedObject.ObjectId + '$' + paramatersRelatedInfo.ruleObjectId;
              this.getReportHistory(this.reportDefinitionId, true);
              this.subscribeToWsi();
            }
          }
        }
      }));

      this.subscriptions.push(this.reportService.reportExecutionId.subscribe({
        next: (reportExecutionId: string) => {
          if (!!reportExecutionId && reportExecutionId != '') {
            this.subcribeAdvancedReportExecutionStatus(reportExecutionId);
          }
        }
      }));
    }
    this.traceService.debug(this._trModule, 'Component initialized.');
  }

  public ngOnDestroy(): void {
    this.reportService.disposeServicesSubscriptions();
    this.reportService.unsubscribeReportNotificationSubscriptions(this.systemId, this.reportDefinitionId);
    this.unSubscribeLocalSubscriptions();
    this.traceService.debug(this._trModule, 'Component destroyed.');
  }

  public getTranslations(): void {
    this.subscriptions.push(this.translateService.get([
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR_MESSAGE'

    ]).subscribe(values => {
      this.service_unavailableErrorTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR'];
      this.service_unavailableErrorMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR_MESSAGE'];
    }));
  }

  public getUpdatedProcedure(): void {
    this.subscriptions.push(this.assistedTreatmentService.getProcedure(this.selectedEventOPId).subscribe(
      { next: (data: WSIProcedure) => {
        data?.Steps?.forEach(step => {
          if (step?.ManagedType === 'OPStepTreatmentForm' && step?.RuntimeStatus && step?.StepId == this.stepId) {
            // to format date time in runtime status according to browser language
            this.runTimeStatus = this.reportService.updateFormatedDateInXML(step?.RuntimeStatus);
            this.handleSaveTreatmentForm(this.runTimeStatus);
          } else if (step?.ManagedType === 'OPStepTreatmentForm' && !step?.RuntimeStatus && step?.StepId == this.stepId) {
            this.startReportExecution(0);
          }
        });
      }, error: err => {
        this.traceService.warn('Treatment form ', `error occured at getProcedure ${err}`);
      }
      }));
  }

  public subcribeAdvancedReportExecutionStatus(reportExecutionId: string): void {
    this.subscribeToWsi();
    this.reportNotificationSub = this.reportService.subscribeWSIReportNotification().subscribe({
      next: (value: ReportHistoryResult) => this.onSubscribeNotificationReport(value)
    });
    this.isHistoryVisible = true;
    this.execActivationMap.set(reportExecutionId, false);
    this.reportService.subscribeWSIReport(this.createDocumentData.SystemId, this.reportDefinitionId, reportExecutionId
    );
    this.previewMasterComponent.isParameterOpen = false;
  }

  public startReportExecution(documentType: DocumentTypes): void {
    // Unsubscribe from report execution sub, this allows each report manager to work independently
    // by avoiding conflicts when multiple systems are available.
    this.reportExecutionSub?.unsubscribe();

    if (isNullOrUndefined(this.fromEvents)) {
      this.fromEvents = false;
    }

    if (this.fromEvents) {
      this.historyLoaded = false;
      this.callFromExecution = true;
    }

    this.subscribeToWsi();

    this.reportNotificationSub = this.reportService.subscribeWSIReportNotification().subscribe({
      next: (value: ReportHistoryResult) => this.onSubscribeNotificationReport(value)
    });

    this.isHistoryVisible = true;
    // based on report manager status we show message for report manager status
    if (this.selectedObjectsData?.length <= 0) {
      return;
    }

    // If case is Assisted Treatment then apply FilterITem on every request
    // selectedEventDesignation = Event srcPropertyId
    let filterItems: string[] = [];
    if (this.selectedObjectsData?.length > 1 || this.fromEvents) {
      filterItems = !this.fromEvents
        ? this.selectedObjectsData
          .splice(1, this.selectedObjectsData.length)
          .map(entry => entry.Designation + SEARCH_WILDCARD)
        : [this.selectedEventDesignation];
    }

    if (this.selectedObjectsData) {
      if (this.selectedObjectsData?.length > 2) { // open report from ri with multiple selected sysbrow nodes
        this.reportContext = ReportContext.MultiSelection;
        this.translateService.get('REPORT-VIEWER.MULTI_SELECTION').subscribe(localText => {
          this.execNameForContext = localText;
        });
        this.searchNodesNeeded = false;
      } else { // open report from ri with single selected sysbrow node
        this.reportContext = ReportContext.Single;
        this.nodeSearchString = this.selectedObjectsData[0]?.Designation;
      }
    } else {
      this.reportContext = ReportContext.Template;
      this.nodeSearchString = this.selectedObjectsData[0]?.Designation;
    }
    this.handleSearchNodes();
    this.createDocumentData.ReportExecutionParams = {
      /** WSI response is contradicting with camel case hence need to suspend this rule. */
      /* eslint-disable @typescript-eslint/naming-convention */

      // '_AT' will be appended to ReportDefinitionId in case of AssistedTreatment
      // with this it will not show these executions in history in case if user comes from system browser
      ReportDefinitionId:
        this.fromEvents ?
          this.selectedObjectsData.slice(0, 1)[0].ObjectId + this.assistedReportId :
          this.selectedObjectsData.slice(0, 1)[0].ObjectId,
      DocumentType: documentType,
      ContextType: this.reportContext,
      NameFilter: filterItems,
      IsAssistedTreatment: this.fromEvents,
      EventId: this.fromEvents ? this.selectedEvent : undefined
      /* eslint-enable @typescript-eslint/naming-convention */
    };

    const objectIdStandard = this.selectedObjectsData.slice(0, 1)[0].ObjectId + '.IsStandard';
    this.createDocumentData.SystemId = this.selectedObjectsData.slice(0, 1)[0].SystemId;

    this.reportExecutionSub = this.IsStandard(objectIdStandard).pipe(
      switchMap((isStandard: boolean) => {
        // If report is standard and accessed from right pane and is not from events, then adjust the name filter
        if (isStandard && this.isFromRightPane && !this.fromEvents) {
          this.createDocumentData.ReportExecutionParams.NameFilter = this.reportNameFilter.slice();
          this.traceService.debug(this._trModule, 'IsStandard is true, default name filter is adjusted.');
        }
        return this.reportService.startReportExecution(this.createDocumentData);
      }),
      switchMap((response: ReportStartResult) => {
        if (response) {
          this.execActivationMap.set(response.ReportExecutionId, false);
          return this.reportService.subscribeWSIReport(
            this.createDocumentData.SystemId,
            this.reportDefinitionId,
            response.ReportExecutionId
          ) as unknown as Observable<null>; // Casting the return type to Observable<null> to avoid eslint type error
        } else {
          this.traceService.error(this._trModule, 'Report generation failed.');
          return of(null);
        }
      })
    ).subscribe(result => {
      this.traceService.debug(this._trModule, 'Report generation completed.');
    });
  }

  public IsStandard(objectId: string): Observable<boolean> {
    return this.propertyService.readPropertiesAndValue(objectId, false).pipe(
      map(prop => prop.Properties.slice(0, 1)[0].Value.Value === 'True')
    );
  }
  // added so that through this function we get the latest data from the preview master to this component after deletion of report
  public handlereportHistoryData(reportHistoryData: ReportHistoryData[]): void {
    {
      this.reportHistoryData = reportHistoryData;
    }
  }

  public handleSendToOutput(): void {
    this.notificationSubsExecutionCount = 0;
    this.subscribeToWsi();
    /**
    1. When event open from assisted treatment
      IsAssistedTreatment = true
    2.On initial load of report from assisted treatment
      IsAssistedTreatment = true
      IsSendToOutput = false
    3.On SendToOutput click
      IsAssistedTreatment = true
      IsSendToOutput = true
     */
    this.createDocumentData.ReportExecutionParams.IsForSendToOutput = true;
    if (this.reportNotificationSub) {
      this.reportNotificationSub.unsubscribe();
    }
    this.reportNotificationSub = this.reportService.subscribeWSIReportNotification().subscribe({
      next: (value: ReportHistoryResult) => this.onSubscribeNotificationReportForSendToOutput(value)
    });

    if (this.reportExecutionSub) {
      this.reportExecutionSub.unsubscribe();
    }
    this.reportExecutionSub = this.reportService.startReportExecution(this.createDocumentData).subscribe(response => {
      this.reportService.subscribeWSIReport(
        this.createDocumentData.SystemId,
        this.reportDefinitionId,
        response.ReportExecutionId
      );
      const step = new Step();
      step.attachments = this.step.attachments;
      step.attributes = this.step.attributes;
      step.configuration = this.step.configuration;
      step.errorText = this.step.errorText;
      step.fixedLink = this.step.fixedLink;
      step.hasConfirmedExecution = true;
      step.isCompleted = this.step.isCompleted;
      step.managedType = this.step.managedType;
      step.notes = this.step.notes;
      step.operator = this.step.operator;
      step.status = this.step.status;
      step.stepId = this.stepId;
      step.runtimeStatus = this.createDocumentData.ReportExecutionParams.FormData;
      this.assistedTreatmentService.updateStep(this.selectedEventOPId, step);
      this.sendToOutputEmitter.emit(false);
      this.executionResult = {
        status: ResolveExecutionStatus.Success,
        errorMessage: ""
      };
    });
  }

  public handleSaveTreatmentForm(xmlString: string): void {
    this.subscribeToWsi();
    this.createDocumentData.ReportExecutionParams.FormData = xmlString;
    if (this.reportNotificationSub) {
      this.reportNotificationSub.unsubscribe();
    }
    // Pipe is added to listen to only change of the ReportExecutionStatus.
    // If the same status is received multiple times, We will ignore that.
    this.reportNotificationSub = this.reportService.subscribeWSIReportNotification().pipe(
      distinctUntilChanged((prev, curr) => prev?.Result[0]?.ReportExecutionStatus === curr?.Result[0]?.ReportExecutionStatus)).subscribe({
      next: (value: ReportHistoryResult) => {
        this.onSubscribeNotificationReport(value);
        const status = value.Result[0].ReportExecutionStatus;
        // Once the status is Succeeded or PartiallySucceeded, we can unsubscribe from the notification.
        if (status === ReportExecutionStatus.Succeeded || status === ReportExecutionStatus.PartiallySucceeded) {
          this.reportNotificationSub.unsubscribe();
        }
      }
    });
    if (this.reportExecutionSub) {
      this.reportExecutionSub.unsubscribe();
    }
    this.reportExecutionSub = this.reportService.startReportExecution(this.createDocumentData).subscribe(response => {
      this.reportService.subscribeWSIReport(
        this.createDocumentData.SystemId,
        this.reportDefinitionId,
        response.ReportExecutionId
      );
      this.callFromExecution = false;
      this.isRerportExecutedForControl = true;
      // this.saveTreatmentFormEvent.emit();
    });
    this.saveTreatmentFormEvent.emit(xmlString);
  }

  private initializationForAsistedTreatement(): void {
    this.systemId = this.selectedObjectsData[0].SystemId;
    this.isReportManagerPresent = true;

    // Only for handling of assisted treatement report execution
    if (this.fromEvents) {
      this.resolveObs.subscribe(res => {
        if (res === true) {
          // execute stuff on resolve button pressed, in case of the document viewer, nothing is done, and the execution is always a success
          // here you can also specify an error message to pass to the stepper on failure, it will show in a toast notification
          // this.step.hasConfirmedExecution indidates that user has clicked on sendToOutput. It means step is executed successfully but not yet resolved
          if (this.step.hasConfirmedExecution) {
            this.executionResult.status = ResolveExecutionStatus.Success; 
            this.resolveExecutionResult.next(this.executionResult);
          } else {
            this.resolveExecutionResult.next(this.executionResult);
          }
        }
      })

      // fix for defect 2474290: Flex Client - alarm printout and report step is not displaying report output in flex client
      // if it is alarm printout step, then
      if (this.manageType === ALARM_PRINTOUT_MANAGE_TYPE) {
        // 1. if report is already generated, then dont generate it again. i.e do nothing
        // 2. if report is not generated (added !) then generate it again
        // 3. else of this if: report is already generated, then we should show existing pdf file,
        //    this is handled from getReportHistory
        if (!this.getEventMapForSpecificEvent()) {
          setTimeout(() => {
            this.startReportExecution(0);
          }, 0);
        }
      // OPStepReport, generate report always
      } else if (this.manageType === "OPStepReport") {
        setTimeout(() => {
          this.startReportExecution(0);
        }, 0);
        // OPStepReport, generate report internally always
      } else if (this.manageType === "OPStepTreatmentForm") {
        this.getUpdatedProcedure(); // this internally calls execute report
      }
    }
    this.isReportViewInitialized = true;
  }

  private checkReportRights(): void {
    // check app rights in context of control launched from Events.
    if (this.fromEvents) {
      this.isEmpty = !this.reportService.getReportRights();
      this.isApprightNotAvailableForAssistedTreatment = !this.reportService.getReportRights();
      this.historyLoaded = this.isEmpty;
    }
  }

  private unSubscribeLocalSubscriptions(): void {
    this._userCultureSubscription.unsubscribe();
    this.reportServiceNotifSub?.unsubscribe();
    this.mainSubs.unsubscribe();
    this.reportSubscription?.unsubscribe();
    if (this.reportNotificationSub !== null) {
      this.reportNotificationSub.unsubscribe();
      this.reportNotificationSub = null;
    }
    this.reportExecutionSub?.unsubscribe();
    this.translateSub?.unsubscribe();
    this.showReportSub?.unsubscribe();
    this.searchNodeSub?.unsubscribe();
    this.subscriptions?.forEach(sub => {
      sub?.unsubscribe();
    });
    this.subscriptions = [];
  }

  private formatUTCDateTime(dateTime: string): string {
    let userCulture = this.translateService.getBrowserLang();
    // add 'UTC' to the dateTime string coming from wsi to make it UTC format
    if (!dateTime.includes('UTC')) {
      dateTime = dateTime + ' UTC';
    }
    if (isNullOrUndefined(userCulture)) {
      this.traceService.debug(this._trModule, 'user culture not found, fallback to "en-US"');
      userCulture = 'en-US';
    }
    // create and return local date from UTC string
    return new Date(dateTime).toLocaleString(userCulture);
  }

  // This function processes the incoming message from HFW
  private processRequest(selectedObjectsData: BrowserObject[]): void {
    this.pdf = false;
    this.historyLoaded = false;
    this.nodeName = selectedObjectsData[0].Name;
    this.reportNameFilter.splice(0, this.reportNameFilter.length); // Reset name-filter arr

    this.reportNotificationSub = this.reportService.subscribeWSIReportNotification().subscribe({
      next: (value: ReportHistoryResult) => this.onSubscribeNotificationReport(value)
    });

    // In case of invalid message condition , just return
    if (selectedObjectsData == null || selectedObjectsData?.length <= 0) {
      return;
    }

    this.selectedObject = selectedObjectsData[0];
    this.multipleBrowserObjects = selectedObjectsData?.length > 2; // 1 slot is reserved for the report object

    let receivedBrowserObjects: BrowserObject[] = [];

    this.isReportDefault = !(selectedObjectsData?.length > 1);

    if (!this.multipleBrowserObjects) {
      // Assign report name-filter for show in related items
      if (selectedObjectsData?.length > 1) {
        this.reportNameFilter.push(selectedObjectsData[1].Designation + SEARCH_WILDCARD);
      } else {
        this.reportNameFilter.push(selectedObjectsData[0].Designation + SEARCH_WILDCARD);
      }
    }

    if (!this.isReportDefault && !this.multipleBrowserObjects) {
      this.selectedReportName = selectedObjectsData[selectedObjectsData.length - 1].Name;
    } else if (this.multipleBrowserObjects) {
      // Assign report name-filter for show in related items
      for (let i = 1; i < this.selectedObjectsData.length; i++) {
        this.reportNameFilter.push(selectedObjectsData[i].Designation);
      }
      this.translateService.get('REPORT-VIEWER.MULTI_SELECTION').subscribe(localText => {
        this.selectedReportName = localText;
      });
    }

    if (selectedObjectsData[0].Attributes.ManagedType === GmsManagedTypes.REPORTS.id) {
      if (selectedObjectsData?.length > 0) {
        receivedBrowserObjects = Object.assign([], selectedObjectsData.splice(1, selectedObjectsData.length));
      } else {
        this.traceService.info(this._trModule, 'Selected Object Managed Type does not match to Reports');
      }
    } else {
      // Remove splice to have multiselect behaviour for normal workflow as well.
      receivedBrowserObjects = Object.assign([], selectedObjectsData.slice(0, 1));
    }

    // If case is Assisted Treatment then apply FilterITem on every request
    // selectedEventDesignation = Event srcPropertyId
    let filterItems: string[] = [];
    if (this.selectedObjectsData?.length > 1 || this.fromEvents) {
      filterItems = !this.fromEvents
        ? this.selectedObjectsData
          .splice(1, this.selectedObjectsData.length)
          .map(entry => entry.Designation + SEARCH_WILDCARD)
        : [this.selectedEventDesignation];
    }

    // Get the selected browser object
    if (receivedBrowserObjects?.length && receivedBrowserObjects[0].ObjectId && receivedBrowserObjects[0].Attributes) {
      // '_AT' will be appended to ReportDefinitionId in case of AssistedTreatment
      // with this it will not show these executions in history in case if user comes from system browser
      if (this.fromEvents) {
        this.reportDefinitionId = receivedBrowserObjects[0].ObjectId + this.assistedReportId;
      } else {
        this.reportDefinitionId = receivedBrowserObjects[0].ObjectId;
      }
      const reportParams: ReportExecutionParams = {
        /** WSI response is contradicting with camel case hence need to suspend this rule. */
        /* eslint-disable @typescript-eslint/naming-convention */
        ReportDefinitionId: this.reportDefinitionId,
        DocumentType: DocumentTypes.Pdf,
        ContextType: ReportContext.Template,
        NameFilter: filterItems,
        IsAssistedTreatment: this.fromEvents,
        EventId: this.fromEvents ? this.selectedEvent : undefined
        /* eslint-enable @typescript-eslint/naming-convention */
      };
      this.createDocumentData.ReportExecutionParams = reportParams;
      this.createDocumentData.SystemId = receivedBrowserObjects[0].SystemId;
      // this.deleteDocumentData.SystemId = receivedBrowserObjects[0].SystemId;

      // during initial load when reportManager status is unknown,
      // initiate the subscription of reportManager status, once the subscription is done
      // based response of manager status call the this.getReportHistory(this.reportDefinitionId);
      if (!!this.previousSystemId && this.previousSystemId !== receivedBrowserObjects[0].SystemId) {
        // need to check
        this.isReportManagerPresentPerSystem.set(receivedBrowserObjects[0].SystemId, undefined);
        this.mainSubs.unsubscribe();
        this.reportSubscription?.unsubscribe();
        this.reportService.disposeServicesSubscriptions();
        this.assignVisibleView(receivedBrowserObjects);
        this.subscribeToWsi();
      } else {
        this.assignVisibleView(receivedBrowserObjects);
        this.subscribeToWsi();
      }
    } else {
      this.subscribeToWsi();
    }
  }

  private assignVisibleView(receivedBrowserObjects: BrowserObject[]): void {
    const systemId: number = receivedBrowserObjects[0].SystemId;
    this.isFirstTimeHistoryReceived = true;
    if (!this.isReportManagerPresentPerSystem.get(systemId)) {
      this.visibleView = 'docuview';
      const systemIds: number[] = [];
      this.reportService.getAllViews().subscribe((views: ViewNode[]) => {
        views.forEach((view: ViewNode) => {
          if (!systemIds.includes(view.SystemId)) {
            systemIds.push(view.SystemId);
          }
        });
        this.registerReportManagerStatus(systemIds);
      });
    } else if (this.isReportManagerPresentPerSystem.get(systemId)) {
      this.visibleView = 'docuview';
      this.getReportHistory(this.reportDefinitionId);
    } else {
      this.isReportManagerPresent = false;
      this.visibleView = 'emptyReportView';
    }
    this.previousSystemId = systemId;
  }

  private subscribeToWsi(): void {
    if (this.fromEvents) {
      this.createDocumentData.SystemId = this.systemId;
      // '_AT' will be appended to ReportDefinitionId in case of AssistedTreatment
      // with this it will not show these executions in history in case if user comes from system browser
      this.reportDefinitionId = this.selectedObjectsData[0].ObjectId + this.assistedReportId;
    }
    // subscribe to the subscription services to receive notification
    if (this.createDocumentData.SystemId && this.reportDefinitionId) {
      this.mainSubs.add(this.reportService.subscribetoWSI(this.createDocumentData.SystemId, this.reportDefinitionId));
    }
    if (this.selectedObject == null) {
      return;
    }
  }

  private getReportHistory(reportId: string, isHistoryForAdvancedReport: boolean = false): void {
    this.isFirstTimeHistoryReceived = false;
    // checks to handle unnecessary duplicate calls in case of advanced reporting
    if (this.managedTypeName.includes(this.selectedObjectsData[0]?.Attributes?.ManagedTypeName) || this.fromEvents || isHistoryForAdvancedReport) {
      this.reportSubscription?.unsubscribe();

      // remove _AT to get report history for assisted treatement printout step
      if (this.fromEvents && this.manageType === ALARM_PRINTOUT_MANAGE_TYPE) {
        reportId = reportId.replace("_AT", "");
      }

      this.reportSubscription =
        this.reportService
          .getReportHistory(this.selectedObject.SystemId, reportId)
          .subscribe({
            next: response => {
              if (!isNullOrUndefined(response)) {
                this.isHistoryFirstLoad = true;
                this.reportHistoryData = response.Result;
                if (this.parameterRelatedInfo) {
                  this.parameterRelatedInfo.parametersLoading = false;
                  this.reportService.paramatersRelatedInfo.next(this.parameterRelatedInfo);
                }
                if (this.reportHistoryData?.length > 0) {
                  this.isHistoryVisible = true;
                  // reverse data to have the newest execution as first entry
                  // by default, the newest execution is the last element
                  this.reportHistoryData.reverse();
                  // show only not completed report executions and the ones with existing report documents
                  this.reportHistoryData = this.reportHistoryData.filter(data => (
                    data.ReportDocumentData.length > 0 ||
                          data.ReportExecutionStatus === ReportExecutionStatus.Pending ||
                          data.ReportExecutionStatus === ReportExecutionStatus.Cancelling ||
                          data.ReportExecutionStatus === ReportExecutionStatus.Failed
                  ));
                  // sort each execution's children (if exist) to have pdfs on top and xlsx on bottom
                  // by default, xlsx is the first child of execution
                  this.reportHistoryData.forEach((exec, index) => {
                    this.reportHistoryData[index] = this.sortChildren(exec);
                  });

                  // for assisted treatment, dont generate report again, just show existing report
                  if (!this.fromEvents || this.getEventMapForSpecificEvent()) {
                    this.manageHistory(this.reportHistoryData);
                  }
                } else {
                  // for assisted treatment, dont generate report again, just show existing report
                  if (this.manageType === ALARM_PRINTOUT_MANAGE_TYPE) {
                    if (!this.fromEvents && this.getEventMapForSpecificEvent()) {
                      this.manageHistory(this.reportHistoryData);
                    }
                  } else {
                    this.previewMasterComponent?.showReport(undefined);
                  }
                  this.historyLoaded = !this.fromEvents;
                  this.previewMasterComponent.isEmpty = true;
                  this.docName = null;
                  this.downloadAvailable = false;
                  this.isHistoryVisible = false;
                }
              }
            },
            error: err => {
              this.historyLoaded = this.fromEvents === undefined;
              this.previewMasterComponent.isEmpty = true;
              this.docName = null;
              this.downloadAvailable = false;
              this.isHistoryVisible = false;
              this.traceService.error(this._trModule, `${err}`);
              return null;
            }
          });
    } else {
      setTimeout(() => {
        this.reportSubscription?.unsubscribe();
        this.isHistoryFirstLoad = true;
        this.reportHistoryData = [];
        if (this.parameterRelatedInfo) {
          this.parameterRelatedInfo.parametersLoading = false;
          this.reportService.paramatersRelatedInfo.next(this.parameterRelatedInfo);
        }
        this.previewMasterComponent?.showReport(undefined);
        // this.fromEvents === false is added because if we generate standard report 
        // and then if we goto Managed Meters Node , then history section(application)
        // rules sections was not loading.
        this.historyLoaded = this.fromEvents === undefined || this.fromEvents === false;
        this.previewMasterComponent.isEmpty = true;
        this.docName = null;
        this.downloadAvailable = false;
        this.isHistoryVisible = false;
      }, 100);
    }
  }

  private registerReportManagerStatus(systemIds: number[]): void {
    this.reportService.initializeServicesSubscriptions(systemIds);
    // Wait for a bit before calling reportManagerStatus() as values are not updated If called instantly
    setTimeout(() => {
      this.reportManagerStatus();
    }, 200);
  }

  private async reportManagerStatus(): Promise<void> {
    const serviceReqInfo: ServiceRequestInfo[] | any = await new Promise(resolve => {
      this.reportServiceNotifSub = this.reportService.serviceNotification().subscribe((data: ServiceRequestInfo | any) => {
        resolve(data);

        if (data) {
          let serviceInfos: ServiceRequestInfo[];
          if (data.length) {
            serviceInfos = data;
          } else {
            serviceInfos = [data];
          }
          if (serviceInfos?.length) {
            serviceInfos.forEach((info: ServiceRequestInfo) => {
              if (this.visibleView !== 'docuview') {
                if (info?.IsConnected) {
                  this.getReportHistory(this.reportDefinitionId);
                  this.isReportManagerPresent = true;
                  this.visibleView = 'docuview';
                } else {
                  this.isReportManagerPresent = false;
                  this.visibleView = 'emptyReportView';
                  this.cd.detectChanges();
                }
              } else if (this.isFirstTimeHistoryReceived) {
                // avoid calling get api for the report in primary pane when sending to secondary pane a different report
                if (info?.IsConnected) {
                  if (this.fromEvents) {
                    // Because we don't require history in case of traetment form and step report.
                    if (this.manageType == ALARM_PRINTOUT_MANAGE_TYPE) {
                      this.getReportHistory(this.reportDefinitionId);
                    } else {
                      // This is added because in onSubscribeNotificationReport when we receive notifications If we don't set it , 
                      // it will be undefined due to which further logic will not be implemented.
                      this.reportHistoryData = [];
                    }
                  } else {
                    this.getReportHistory(this.reportDefinitionId);
                  }
                  this.isReportManagerPresent = true;
                  this.visibleView = 'docuview';
                  this.isFirstTimeHistoryReceived = false;
                } else {
                  this.isReportManagerPresent = false;
                  this.visibleView = 'emptyReportView';
                  this.cd.detectChanges();
                }
              } else if (!info?.IsConnected) {
                this.isReportManagerPresent = false;
                this.visibleView = 'emptyReportView';
                this.cd.detectChanges();
              }
              this.isReportManagerPresentPerSystem.set(info?.SystemId, info?.IsConnected || false);
            }
            );
          }
        }

      });
    });
  }

  private manageHistory(historyData: ReportHistoryData[]): void {
    this.historyLoaded = true;
    this.cd.detectChanges();
    const savedDoc: any = this.findSavedDocument(historyData);
    if (savedDoc != null) {
      if (this.fromEvents && savedDoc.ReportDocumentData.length > 0) {
        this.previewMasterComponent.showReport(savedDoc.ReportDocumentData[0]);
        this.previewMasterComponent.setActive(savedDoc.ReportExecutionId, savedDoc.ReportExecutionDisplayName, true);
        this.canHistoryLoaded = savedDoc.ReportDocumentData.length > 1;
      } else {
        this.showReportSub?.unsubscribe();
        this.showReportSub = this.previewMasterComponent.showReport(savedDoc.ReportDocumentData).subscribe(() => {
          if (this.storeObject.index >= 0 && historyData.find(elem => elem.ReportExecutionId == savedDoc.ReportExecutionId).ReportDocumentData.length > 1) {
            this.previewMasterComponent.onExpandRow(this.storeObject.index);
            this.previewMasterComponent.setActive(savedDoc.ReportExecutionId, savedDoc.ReportDocumentData.DocumentDisplayName, false);
          } else {
            if (this.showhistory !== undefined && this.setActive !== undefined) {
              this.previewMasterComponent.setActive(this.setActive.execId,
                this.setActive.displayName, this.setActive.isParent);
            // eslint-disable-next-line @typescript-eslint/brace-style
            }
            // below code is added for the  multiselection use case in retain state for the reporting 
            else if (this.previewMasterComponent.stateDataObject?.multipleHistoryRowSelectionMap?.size > 0) {
              for (const [key, value] of this.storeObject?.multipleHistoryRowSelectionMap?.entries()) {
                const execIdOfSelectedDocument = this.storeObject.multipleHistoryRowSelectionMap?.get(key);
                const isSelectedDocumentparent = execIdOfSelectedDocument?.isDocumentParent;
                if (isSelectedDocumentparent && execIdOfSelectedDocument?.selectedChildNames.length === 0) {
                  const parentname = execIdOfSelectedDocument?.parentName;
                  this.previewMasterComponent.setActiveMultiple(key, parentname, this.fullId, isSelectedDocumentparent);
                }
                if (execIdOfSelectedDocument?.selectedChildNames.length >= 1) {
                  value.selectedChildNames.forEach(data => {
                    const childDisplayName = data;
                    this.previewMasterComponent.setActiveMultiple(key, childDisplayName, this.fullId, isSelectedDocumentparent);
                  });
                }
              }
            } else {
              // below code is executed when we run single report in reporting 
              // added the code because when we select the 1st document with is generated with both 1st document is not active that time
              this.previewMasterComponent.setActive(savedDoc.ReportExecutionId, savedDoc.ReportExecutionDisplayName, true);

            }
          }
        });
      }
    } else {
      const execsWithDocuments: ReportHistoryData[] = [];
      historyData.forEach(data => {
        if (data.ReportDocumentData.length > 0 ||
          data.ReportExecutionStatus === ReportExecutionStatus.Pending) {
          execsWithDocuments.push(data);
        }
        data.ReportExecutionDateTime = this.formatUTCDateTime(data.ReportExecutionDateTime);
      });
      if (execsWithDocuments.length > 0) {
        // below code will execute when we select single report 
        if (this.showhistory !== undefined && this.setActive !== undefined) {
          this.previewMasterComponent.setActive(this.setActive.execId,
            this.setActive.displayName, this.setActive.isParent);
          this.previewMasterComponent.showReport(this.showhistory.documentData, this.showhistory.isManualSelection);
          this.showhistory = undefined;
          this.setActive = undefined;
        } else {
          // below for loop  is added to set Active the documents in case of multisection in advanced reports 
          if (this.previewMasterComponent.stateDataObject?.multipleHistoryRowSelectionMap?.size > 0) {
            for (const [key, value] of this.storeObject.multipleHistoryRowSelectionMap.entries()) {
              const execIdOfSelectedDocument = this.storeObject.multipleHistoryRowSelectionMap?.get(key);
              const isSelectedDocumentparent = execIdOfSelectedDocument?.isDocumentParent;
              if (isSelectedDocumentparent && execIdOfSelectedDocument.selectedChildNames.length === 0) {
                const parentname = execIdOfSelectedDocument?.parentName;
                this.previewMasterComponent.setActiveMultiple(key, parentname, this.fullId, isSelectedDocumentparent);
              }
              if (execIdOfSelectedDocument?.selectedChildNames.length >= 1) {
                execIdOfSelectedDocument.selectedChildNames.forEach(data => {
                  const childDisplayName = data;
                  this.previewMasterComponent.setActiveMultiple(key, childDisplayName, this.fullId, isSelectedDocumentparent);
                });
              }
            }
          } else {
            this.previewMasterComponent.showReport(execsWithDocuments[0].ReportDocumentData[0]);
            this.previewMasterComponent.setActive(execsWithDocuments[0].ReportExecutionId, execsWithDocuments[0].ReportExecutionDisplayName, true);
          }
        }
      } else {
        this.previewMasterComponent.showReport(undefined);
      }
    }
    this.isHistoryFirstLoad = false;
  }

  private onSubscribeNotificationReport(val: ReportHistoryResult): void {
    this.traceService.debug(this._trModule, 'onSubscribeNotificationReport received');

    if (this.manageType === 'OPStepTreatmentForm' && this.createDocumentData?.ReportExecutionParams?.IsForSendToOutput) {
      this.createDocumentData.ReportExecutionParams.IsForSendToOutput = false;
    }
    /* This check is added for the scenario where there are multiple instances of report-viewer snapin.
      Each snapin is subscribed for report notifications without passing report definition id.
      So, any notification for any report definiton will arrive to all available snapin instances.
      That's why the notifications should match with the related report definiton.
    */
    if (val.ReportSubscriptionAdditionalValues.ReportDefinitionId === this.reportDefinitionId &&
      !this.createDocumentData.ReportExecutionParams.IsForSendToOutput) {

      // unsubscribe subscriptions first if exists.
      this.searchNodeSub?.unsubscribe();
      this.translateSub?.unsubscribe();

      const resultExecution = val.Result[0];
      const exec = this.reportHistoryData?.find(data => data.ReportExecutionId === resultExecution.ReportExecutionId);
      const notifContext = val.ReportSubscriptionAdditionalValues.ContextTypeOrNameFilter;
      if (notifContext === ReportContext.Template.toString()) {
        this.searchNodeSub = this.reportService.getSearchNode(this.systemId, this.selectedObjectsData[0].Designation).subscribe(res => {
          if (res) {
            this.execNameForContext = res.Nodes.length > 0 ? res.Nodes[0].Descriptor : '';
          }
        });
      } else if (notifContext === ReportContext.MultiSelection.toString()) {
        this.translateSub = this.translateService.get('REPORT-VIEWER.MULTI_SELECTION').subscribe(localText => {
          this.execNameForContext = localText;
        });
      } else { // in case of ReportContext.Single, nameFilter will be received
        if (val.ReportSubscriptionAdditionalValues.ContextTypeOrNameFilter !== '') {
          this.searchNodeSub = this.reportService.getSearchNode(this.systemId,
            val.ReportSubscriptionAdditionalValues.ContextTypeOrNameFilter.split(SEARCH_WILDCARD)[0]
          ).subscribe(res => {
            if (res?.Nodes) {
              this.execNameForContext = res.Nodes.length > 0 ? res.Nodes[0].Descriptor : '';
            }
          });
        } else if (this.fromEvents && val.ReportSubscriptionAdditionalValues.ContextTypeOrNameFilter === '') {
          this.searchNodeSub = this.reportService.getSearchNode(this.systemId, this.selectedObjectsData[0].Designation).subscribe(res => {
            if (res?.Nodes) {
              this.execNameForContext = res.Nodes.length > 0 ? res.Nodes[0].Descriptor : '';
            }
          });
        }
      }
      const execStatus = resultExecution.ReportExecutionStatus;
      if (exec && execStatus === ReportExecutionStatus.Cancelled) {
        exec.ReportExecutionStatus = ReportExecutionStatus.Cancelled;
      }
      if (exec && execStatus === ReportExecutionStatus.Failed) {
        exec.ReportExecutionStatus = ReportExecutionStatus.Failed;
        this.toastNotificationService.queueToastNotification('danger', this.service_unavailableErrorTitle, this.service_unavailableErrorMsg);
      }
      if (resultExecution.ReportExecutionStatus === ReportExecutionStatus.Pending) {
        if (resultExecution.ReportExecutionDisplayName == '') {
          resultExecution.ReportExecutionDisplayName = this.nodeName;
        } // initially displayName does not exist
        // add entry to UI data only once
        if (this.reportHistoryData && !this.reportHistoryData?.find(data => data.ReportExecutionId === resultExecution.ReportExecutionId)) {
          this.isHistoryVisible = true;
          this.reportHistoryData.unshift(resultExecution);
          // assign display name for unshifted data since the response doesn't have yet the ReportExecutionDisplayName
          this.reportHistoryData[0].ReportExecutionDisplayName = resultExecution.ReportExecutionDisplayName ?? this.execNameForContext;
        }
        
        // do not try to activate the same entry multiple times
        if (!this.execActivationMap.get(resultExecution.ReportExecutionId)) {
          this.previewMasterComponent.showReport(undefined);
          this.previewMasterComponent.setActive(resultExecution.ReportExecutionId, resultExecution.ReportExecutionDisplayName, true);
          this.execActivationMap.set(resultExecution.ReportExecutionId, true);
        }
      }
      if (execStatus === ReportExecutionStatus.PartiallySucceeded || execStatus === ReportExecutionStatus.Succeeded) {
        if (exec) {
          exec.ReportExecutionDisplayName = resultExecution.ReportExecutionDisplayName ?? this.execNameForContext;
          exec.ReportExecutionStatus = resultExecution.ReportExecutionStatus;
          exec.ReportExecutionDateTime = this.formatUTCDateTime(resultExecution.ReportExecutionDateTime);
          exec.ReportDocumentData = resultExecution.ReportDocumentData.slice();
          this.sortChildren(exec);
          this.previewMasterComponent.showReport(exec.ReportDocumentData[0]);
          this.previewMasterComponent.setActive(exec.ReportExecutionId, exec.ReportExecutionDisplayName, true);
          // this.reportService.unsubscribeReport(exec.ReportExecutionId);
          if (this.fromEvents && this.callFromExecution) {
            this.canHistoryLoaded = exec.ReportDocumentData.length > 1;
            if (this.manageType === ALARM_PRINTOUT_MANAGE_TYPE) {
              this.reportService.setEventIdAndExecutionIdMap(exec.ReportExecutionId, this.selectedEvent);
            }
            this.historyLoaded = true;
          }
        }
      }
    }
  }

  private onSubscribeNotificationReportForSendToOutput(val: ReportHistoryResult): void {
    this.traceService.debug(this._trModule, 'onSubscribeNotificationReportForSendToOutput received');
    if (val.ReportSubscriptionAdditionalValues.ReportDefinitionId === this.reportDefinitionId && val.Result.length > 0) {
      const resultExecution = val.Result[0];
      let actionText;
      switch (resultExecution.ReportExecutionStatus) {
        case ReportExecutionStatus.Cancelled:
          this.notificationSubsExecutionCount++;
          this.StatusType = 'warning';
          actionText = 'REPORT-VIEWER.TOAST_MESSAGE.CANCELLED';
          break;
        case ReportExecutionStatus.Failed:
          this.StatusType = 'danger';
          actionText = 'REPORT-VIEWER.TOAST_MESSAGE.FAILED';
          this.notificationSubsExecutionCount++;
          break;
        case ReportExecutionStatus.PartiallySucceeded:
        case ReportExecutionStatus.Succeeded:
          this.StatusType = 'success';
          this.notificationSubsExecutionCount++;
          actionText = 'REPORT-VIEWER.TOAST_MESSAGE.SUCCESS';
          break;
        default:
          break;
      }

      // show toast only once on execution not every time
      if (actionText && this.notificationSubsExecutionCount === 1) {
        if (this.translateSub) {
          this.translateSub.unsubscribe();
        }
        this.reportService.sendToOutputEvent.next(true);
        this.translateSub = this.translateService.get(actionText).subscribe(lclTxt => {
          this.reportService.siToastService.queueToastNotification(this.StatusType, lclTxt, '');
        });
      }
    }
  }

  private sortChildren(exec: ReportHistoryData): ReportHistoryData {
    const pdfPageSize = exec.PdfPageSize;
    let addition = 0;
    const pdfFiles: ReportDocumentData[] = [];
    const xlsxFiles: ReportDocumentData[] = [];
    exec.ReportDocumentData.forEach(doc => {
      if (doc.DocumentDisplayName.split('.')[1] === 'Xlsx') {
        xlsxFiles.push(doc);
      } else {
        pdfFiles.push(doc);
      }
    });
    pdfFiles.forEach(pdf => {
      if (pdfFiles[pdfFiles.length - 1] !== pdf) {
        // to show text of "All pages" only in case of advance reports when both excel and pdf is generated together
        if (this.relatedItem.length > 0) {
          this.translateService.get('REPORT-VIEWER.ALL_PAGES').subscribe(localAllPagesText => {
            this.displayNameMap.set(pdf.DocumentDisplayName, localAllPagesText);
          });
        } else {
          this.displayNameMap.set(pdf.DocumentDisplayName, `Pages ${1 + addition} to ${pdfPageSize + addition}`);
        }
        this.executionIdMap.set(exec.ReportExecutionId, this.displayNameMap);
      } else {
        if (pdfFiles.length === 1) {
          this.translateService.get('REPORT-VIEWER.ALL_PAGES').subscribe(localAllPagesText => {
            this.displayNameMap.set(pdf.DocumentDisplayName, localAllPagesText);
          });
          this.executionIdMap.set(exec.ReportExecutionId, this.displayNameMap);
        } else {
          this.displayNameMap.set(pdf.DocumentDisplayName, `Pages from ${1 + addition}`);
          this.executionIdMap.set(exec.ReportExecutionId, this.displayNameMap);
        }
      }
      addition += pdfPageSize;
    });
    exec.ReportDocumentData = [...pdfFiles, ...xlsxFiles];
    return exec;
  }

  private findSavedDocument(historyData: ReportHistoryData[]): any | null {
    if (historyData?.length > 0) {
      const event = this.reportService.getExecutionIdFromMap(this.selectedEvent);
      // test if we have a saved document
      for (const element of historyData) {
        if (this.fromEvents && event && element.ReportExecutionId === event) {
          return {
            /** WSI response is contradicting with camel case hence need to suspend this rule. */
            /* eslint-disable @typescript-eslint/naming-convention */
            ReportExecutionDisplayName: element.ReportExecutionDisplayName,
            ReportDocumentData: element.ReportDocumentData,
            ReportExecutionId: element.ReportExecutionId
            /* eslint-enable @typescript-eslint/naming-convention */
          };
        } else if (!this.fromEvents && this.storeObject?.lastShownDocumentData != null) {
          const currElem = element.ReportDocumentData.find(elem => elem.DocumentPath.includes(this.storeObject.lastShownDocumentData.DocumentPath));
          if (currElem != null) {
            return {
              /** WSI response is contradicting with camel case hence need to suspend this rule. */
              /* eslint-disable @typescript-eslint/naming-convention */
              ReportExecutionDisplayName: element.ReportExecutionDisplayName,
              ReportDocumentData: currElem,
              ReportExecutionId: element.ReportExecutionId
              /* eslint-enable @typescript-eslint/naming-convention */
            };
          }
        }
      }
    }
    return null;
  }

  private setupDefaultCulture(): void {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe({
      next: defaultCulture => {
        this.initTranslateServiceWithDefaultCulture(defaultCulture);
      },
      error: err => {
        this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      }
    }));
  }

  private setupUserCulture(): void {
    this.subscriptions.push(this.appContextService.userCulture.subscribe({
      next: userCulture => {
        this.initTranslateServiceWithUserCulture(userCulture);
      },
      error: err => {
        this.traceService.debug(this._trModule, 'No user Culture for appContextService');
      }
    }));
  }

  private initTranslateServiceWithDefaultCulture(defaultCulture: any): void {
    if (defaultCulture !== null) {
      this.translateService.setDefaultLang(defaultCulture);
    } else {
      this.traceService.debug(this._trModule, 'No default culture set on appContextService!');
    }
  }

  private initTranslateServiceWithUserCulture(userCulture: any): void {
    if (userCulture !== null) {
      // init translate service with user culture of the logged in user
      this.translateService.use(userCulture).subscribe({
        next: _res => {
          this.traceService.debug(this._trModule, `Use  user culture: ${userCulture}`);
        },
        error: err => {
          this.traceService.debug(this._trModule, 'No user culture set on appContextService!');
        }
      });
    } else {
      this.traceService.debug(this._trModule, 'No user culture set on appContextService!');
    }
  }

  // will return true if report is already generated
  // will return false, if report is not generated or if it is not alarm printout step
  private getEventMapForSpecificEvent(): boolean {
    if (this.manageType === ALARM_PRINTOUT_MANAGE_TYPE) {
      const event = this.reportService.getExecutionIdFromMap(this.selectedEvent);
      return event !== undefined;
    }
    return false;
  }

  /**
   * Handles the logic for searching nodes.
   * If `searchNodesNeeded` is true, it subscribes to the `getSearchNode` service.
   * Before subscribing, it ensures any existing subscription is unsubscribed.
   * On receiving a response, it updates `execNameForContext` with the descriptor of the first node.
   */
  private handleSearchNodes(): void {
    if (this.searchNodesNeeded) {
      this.unsubscribeSearchNode(); // Ensure any previous subscription is cleaned up
      this.searchNodeSub = this.reportService.getSearchNode(this.systemId, this.nodeSearchString).subscribe(res => {
        if (res && res.Nodes && res.Nodes.length > 0) {
          this.execNameForContext = res.Nodes[0].Descriptor;
        }
      });
    }
  }

  /**
   * Unsubscribes from the current `searchNodeSub` if it exists.
   */
  private unsubscribeSearchNode(): void {
    if (this.searchNodeSub) {
      this.searchNodeSub.unsubscribe(); // Unsubscribe from the existing subscription
      this.searchNodeSub = undefined; // Clear the subscription reference
    }
  }
}
