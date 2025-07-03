import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {
  AssistedTreatmentService,
  BrowserObject,
  CnsHelperService,
  Event,
  EventFilter,
  EventMessage,
  EventMessageType,
  EventService,
  EventStates,
  GmsManagedTypes,
  GmsMessageData,
  GraphicsCommonTemplateServiceBase,
  MultiMonitorServiceBase,
  Procedure,
  RelatedItemsServiceBase,
  ReportDocumentData,
  SiIconMapperService,
  Step,
  SystemBrowserServiceBase,
  TablesEx,
  WsiError
} from '@gms-flex/services';
import { FullPaneId, FullQParamId, FullSnapInId, IHfwMessage, MessageParameters, MobileNavigationService, QParam } from '@gms-flex/core';
import { BehaviorSubject, lastValueFrom, Observable, Subscription } from 'rxjs';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import {
  BOOTSTRAP_BREAKPOINTS,
  ConfirmationDialogResult,
  MenuItem,
  SiActionDialogService,
  SiToastNotificationService
} from '@simpl/element-ng';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { EventUpdateNotificationMessage, FirstEvent } from '../event-grid/data.model';
import { TraceModules } from '../../shared/trace-modules';
import { EventPopoverHeader } from '../event-popover/data.model';
import { GridData, GridEvent, OperatingProcedure, OPStep, ResolveExecutionResult, ResolveExecutionStatus } from '../event-data.model';
import { BrowserObjectService } from '../services/browser-object.service';
import { HfwFilterPillData } from '@gms-flex/controls';
import { isNullOrUndefined } from '@siemens/ngx-datatable';
import { ReportViewerService } from '../../report-viewer/services/report-viewer.service';
import { SiStepperComponent } from '@simpl/element-ng/stepper';
// import { StepAction, StepState } from '@simpl/element-ng/stepper';

const INVESTIGATIVE_MODE_ID = 'investigative';
const ASSISTED_MODE_ID = 'assisted';
const DEFAULT_MODE_ID = 'default';
const eventList = 'event-list';

export interface StateData {
  path: string;
  index: number;
  lastShownDocumentData: ReportDocumentData;
  scrollTop: number;
  scrollLeft: number;
  skip: number; // the skip for tiles view.
  tilesScrollTop: number;
  zoomFactor: number;
  zoomSetting: number | string | undefined;
  page: number;
  searchString: string;
  designation: string;
}

@Component({
  selector: 'gms-event-content',
  templateUrl: './event-content.component.html',
  styleUrl: './event-content.component.scss',
  standalone: false
})
export class EventContentComponent implements OnInit, OnChanges, OnDestroy {
  // Regular usage inputs
  @Input() public hideButton = false;
  @Input() public showAllEvents = false;
  @Input() public fullSnapinID: FullSnapInId = null;
  @Input() public nodes: BrowserObject[];
  @Input() public designations: string[];
  @Input() public showAssistedTreatment = false;
  @Input() public filterPills: HfwFilterPillData[] = [];

  @Output() public readonly closePopover: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public readonly togglePopover: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public readonly eventsCounterChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() public readonly eventsChange: EventEmitter<GridData[]> = new EventEmitter<GridData[]>();
  @Output() public readonly eventFilterChange: EventEmitter<HfwFilterPillData> = new EventEmitter<HfwFilterPillData>();
  @Output() public readonly filterActions: EventEmitter<MenuItem[]> = new EventEmitter<MenuItem[]>();
  @Output() public readonly columnsActions: EventEmitter<MenuItem[]> = new EventEmitter<MenuItem[]>();

  // Usage within the Event-list snapin
  @Input() public fullPaneID: FullPaneId;
  @Input() public fullQParamID: FullQParamId;
  @Input() public supportQparam: boolean;
  @Input() public showColumnSelectionDlg: Observable<boolean>;
  @Input() public selectedEventsIds: Observable<string[]>;
  @Input() public splitPosition = 80;
  @Input() public resizableParts = true;
  @Input() public coloredRows = false;

  @Output() public readonly selectedEventsEv: EventEmitter<Event[]> = new EventEmitter<Event[]>();
  @Output() public readonly gridEvents: EventEmitter<GridEvent> = new EventEmitter<GridEvent>();
  @Output() public readonly numEventsChanged: EventEmitter<number> = new EventEmitter<number>();
  @Output() public readonly notifyUpdatedSelectionEv: EventEmitter<EventUpdateNotificationMessage> = new EventEmitter<EventUpdateNotificationMessage>();
  @Output() public readonly splitChanges: EventEmitter<number> = new EventEmitter<number>();

  @ViewChild('stepper', { static: false }) public stepper: SiStepperComponent;

  // ----------------------------------
  public showColDlgObs: Observable<boolean>;
  public selectedEventsSubject: BehaviorSubject<Event[]> = new BehaviorSubject(
    []
  );
  public selectedEventsObs: Observable<Event[]> = this.selectedEventsSubject.asObservable();

  public eventsCounter = 0;
  public header: EventPopoverHeader;

  public eventCommandsDisabledSubj: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public eventCommandsDisabledObs: Observable<boolean> = this.eventCommandsDisabledSubj.asObservable();
  public onStepGraphicExecuted: EventEmitter<any> = new EventEmitter<any>();

  public icon: string;
  public selectedEvent: Event;
  public selectedEvents: Event[];

  public largeLayoutBreakpoint = BOOTSTRAP_BREAKPOINTS.mdMinimum;
  public detailsActive = false; // this is the default
  public truncateHeading = true;
  public detailsHeading = '';
  public containerMaxWidth: number | undefined;
  public minMasterSize = 380;
  public minDetailSize = 340;

  public eventFilter: EventFilter;
  public operatingProcedure: OperatingProcedure = null;

  public currentModeId: string;
  public isInInvestigativeMode = false;
  public isInAssistedMode = false;
  public isConfirmOpened = false;
  public primaryActions: any[] = [];
  public secondaryActions: any[] = [];
  public steps: OPStep[] = [];
  public multipleFiltersLabel: string;
  public goToEventsTxt: string; // 'go to events'
  public mandatoryStepsLabel: string; // 'show mandatory steps only'
  public mandatoryLabel: string;
  public atNotSupportedStepTitleLabel: string;
  public atNotSupportedStepBodyLabel: string;
  public atStepCompletedAndUnrepeatableLabel: string;
  public opNodes: Map<string, any> = new Map<string, any>();
  public supportedManagedTypes: string[] = [
    'OPStepDocumentViewer',
    'OPStepReport',
    'OPStepAlarmPrintout',
    'OPStepTreatmentForm',
    'OPStepGraphics',
    'OPStepVideo'];

  public storeObject: StateData;
  public fromEvents = true;
  public eventToSend: string;
  public eventToSendDesignation: string;
  public resolveLabel = '';
  public selectedEventOPId: string;
  public treatmentUpdate: boolean;
  public isStepConfirm: boolean;
  public runtimeStatus: string;

  public activeStep: OPStep;
  public resolveObsMap: Map<string, BehaviorSubject<boolean>> = new Map<string, BehaviorSubject<boolean>>();

  public isMobileView = false;

  private firstEvent: Event;
  private systemId: number;
  private readonly subscriptions: Subscription[] = [];
  private translations: Map<string, string> = new Map<string, string>();
  private readonly translateService: TranslateService;
  private operatingProcedureSubscription: Subscription = null;
  private treatmentFormSubs: Subscription;
  private curSplitPosition: number;
  private readonly ATSplitPosition = 25;
  private atExecutionErrorLabel = '';

  public readonly trackByIndex = (index: number): number => index;

  public constructor(
    private readonly eventCommonService: EventsCommonServiceBase,
    private readonly iconMapperService: SiIconMapperService,
    public readonly messageBroker: IHfwMessage,
    public readonly graphicsCommonTemplateServiceBase: GraphicsCommonTemplateServiceBase,
    private readonly eventService: EventService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly traceService: TraceService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly siModal: SiActionDialogService,
    private readonly browserObjectService: BrowserObjectService,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    private readonly assistedTreatmentService: AssistedTreatmentService,
    private readonly appContextService: AppContextService,
    private readonly relatedItemsService: RelatedItemsServiceBase,
    private readonly reportService: ReportViewerService,
    private readonly cdr: ChangeDetectorRef,
    private readonly siToastNotificationService: SiToastNotificationService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService
  ) {
    this.translateService = eventCommonService.commonTranslateService;
    this.assignEmptyValues();
  }

  public ngOnChanges(): void {
    this.initPopover();
  }

  public ngOnInit(): void {
    this.initPopover();
    this.checkMode();
    this.subscriptions.push(
      this.translateService
        .get([
          'EVENT-POPOVER.EXIT-INVESTIGATIVE-TREATMENT',
          'EVENT-POPOVER.INVESTIGATIVE-TREATMENT',
          'EVENTS.COLUMN-CUSTOMIZE-TITLE',
          'EVENTS.FILTER-ACTION',,
          'EVENT-POPOVER.MODAL-BTN-EXIT',
          'EVENT-POPOVER.MODAL-BTN-CANCEL',
          'OM-FILTER-MULTIPLE-VALUES-LABEL',
          'EVENT-POPOVER.GO-TO-EVENTS',
          'SHOW-MANDATORY-STEPS-ONLY',
          'MANDATORY-LABEL',
          'OP-RESOLVE',
          'EVENTS.AT-EXECUTION-ERROR',
          'EVENTS.AT-NOT-SUPPORTED-STEP-TITLE',
          'EVENTS.AT-NOT-SUPPORTED-STEP-BODY',
          'EVENTS.AT-STEP-UNREPEATABLE-TITLE'
        ])
        .subscribe(values => {
          this.translations = values;
          this.multipleFiltersLabel = this.translations['OM-FILTER-MULTIPLE-VALUES-LABEL'];
          this.goToEventsTxt = this.translations['EVENT-POPOVER.GO-TO-EVENTS'];
          this.mandatoryStepsLabel = this.translations['SHOW-MANDATORY-STEPS-ONLY'];
          this.mandatoryLabel = this.translations['MANDATORY-LABEL'];
          this.resolveLabel = this.translations['OP-RESOLVE'];
          this.atExecutionErrorLabel = this.translations['EVENTS.AT-EXECUTION-ERROR'];
          this.atNotSupportedStepTitleLabel = this.translations['EVENTS.AT-NOT-SUPPORTED-STEP-TITLE'];
          this.atNotSupportedStepBodyLabel = this.translations['EVENTS.AT-NOT-SUPPORTED-STEP-BODY'];
          this.atStepCompletedAndUnrepeatableLabel = this.translations['EVENTS.AT-STEP-UNREPEATABLE-TITLE'];
          this.contentActions();
        })
    );

    const filterCount = !isNullOrUndefined(this.filterPills[0]?.values) ? this.filterPills[0]?.values?.length.toString() : '';
    this.multipleFiltersLabel = this.multipleFiltersLabel.replace('{{filterCount}}', filterCount);
    this.subscriptions.push(
      this.selectedEventsObs.subscribe(selectedEvents => {
        if (Array.isArray(selectedEvents)) {
          this.detailsActive = selectedEvents.length > 0;
          this.selectedEvents = selectedEvents;
        }

        // Close assisted treatment if another tab closes it
        // if (this.operatingProcedureSubscription != undefined && this.selectedEvents[0].inProcessBy === undefined) {
        //   this.onExitFromAssistedTreatment(selectedEvents[0]);
        // }

        // Close assisted treatment if the event is closed
        if (this.operatingProcedureSubscription != undefined && selectedEvents[0]?.stateId === EventStates.Closed) {
          this.onExitFromAssistedTreatment(selectedEvents[0]);
        }
      })
    );

    this.subscriptions.push(
      this.onStepGraphicExecuted.subscribe(resolveResult => {

        const resultExecution: ResolveExecutionResult = { status: resolveResult.status };
        const step = resolveResult.step;
        this.onStepResolveExecutionResult(resultExecution, step)
      })
    )

    this.isMobileView = this.mobileNavigationService.mobileOnlyVisibilityLast;

    // Subscribe to the screen size change event to configure mobile view
    this.subscriptions.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      this.isMobileView = isVisible;
    }));
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });
    if (this.operatingProcedureSubscription != undefined) {
      this.assistedTreatmentService.unSubscribeProcedure();
      this.eventService.eventCommand(this.selectedEvents, 'suspend', 'assistedtreatment');
      this.operatingProcedureSubscription.unsubscribe();
    }
  }

  public onSplitChange(sizes: number): void {
    this.eventCommonService.mainDetailResizeSubject.next(true);
    this.splitChanges.emit(sizes);
  }

  public toggle(): void {
    this.togglePopover.emit(true);
  }
  public close(): void {
    this.closePopover.emit(true);
  }

  public isSupportedManagedType(managedType: string): boolean {
    return this.supportedManagedTypes.includes(managedType);
  }

  public initPopover(): void {
    this.eventFilter = undefined;

    // reset selected event
    this.selectedEvent = undefined;

    this.clearData();
    //    this.selectedEventsSubject.next(null);
    if (this.nodes) {
      if (this.nodes.length > 0) {
        // For multiselect
        const srcDesignations: string[] = [this.nodes[0].Designation];

        for (let i = 1; i < this.nodes.length; i++) {
          srcDesignations.push(this.nodes[i].Designation);
        }

        this.eventFilter = { empty: false, srcDesignations };
      }
      if (this.nodes.length === 1) {
        this.header = {};
        this.setIcon(
          this.nodes[0].Attributes.TypeId,
          this.nodes[0].Attributes.SubTypeId
        );
        this.setLabel(this.nodes[0]);
        this.subscribeLabelsOrder(this.nodes[0]);

        // in case of multiple designations passed as a concatenated string (for nodemap groups)
        const multipleDesignations = this.nodes[0].AdditionalInfo;
        if (!isNullOrUndefined(multipleDesignations) && multipleDesignations.length > 0) {
          this.eventFilter = { empty: false, srcDesignations: multipleDesignations };
        }
      } else {
        this.header = undefined;
      }
    } else if (this.designations) {
      // If designations passed to the component
      if (this.designations.length === 1) {
        this.setBrowserObject(this.designations[0]);
      }

      const srcDesignations: string[] = this.designations;
      this.eventFilter = { empty: false, srcDesignations };
    } else {
      if (this.showAllEvents) {
        this.eventFilter = { empty: true };
        this.header = undefined;
      } else {
        this.eventFilter = undefined;
        this.header = undefined;
      }
    }
  }

  // Set selected event if is only one event
  public eventsLoaded(ev: Event): void {
    // this.selectedEvent = undefined;
  }

  public setEventCounter(ev: number): void {
    this.eventsCounter = ev;
    this.eventsCounterChange.emit(ev);
  }

  public onEventsChange(eventsArr: GridData[]): void {
    this.eventsChange.emit(eventsArr);
  }

  public goToEvents(eventFilter: EventFilter): void {
    this.toggle();

    const popOverSelectedEvents = this.eventCommonService.hasCachedSelectedEvents() ?
      this.eventCommonService.getCachedSelectedEvents() :
      null;

    if (!this.isInInvestigativeMode && this.multiMonitorService.runsInElectron && !this.multiMonitorService.isMainManager()) {
      // In electron with detached event manager, triggering the 'goToEvents' from the system frame
      const evtMessage: EventMessage = {
        type: EventMessageType.EventFiltering,
        data: [eventFilter, popOverSelectedEvents]
      };
      this.multiMonitorService.sendEvent(evtMessage);
    }

    if (this.isInAssistedMode) {
      this.onExitFromAssistedTreatment(popOverSelectedEvents);
    }

    if (this.isInInvestigativeMode) {
      // Open confirm
      // if the investigative mode is on
      const title = this.translations['EVENT-POPOVER.INVESTIGATIVE-TREATMENT'];
      const message = this.translations['EVENT-POPOVER.EXIT-INVESTIGATIVE-TREATMENT'];
      const modalBtnExit = this.translations['EVENT-POPOVER.MODAL-BTN-EXIT'];
      const modalBtnCancel = this.translations['EVENT-POPOVER.MODAL-BTN-CANCEL'];

      this.siModal.showActionDialog(
        { type: 'confirmation',
          heading: title,
          message: message,
          confirmBtnName: modalBtnExit,
          declineBtnName: modalBtnCancel }).subscribe(confirmation => {
        switch (confirmation) {
          case ConfirmationDialogResult.Confirm:
            if (this.multiMonitorService.runsInElectron) {
              this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, undefined).toPromise().then(modeSwitched => {
                // Switched
                this.switchEventList(eventFilter);
              });
              if (this.multiMonitorService.runsInElectron) {
                this.multiMonitorService.synchronizeUiState({
                  sendToItself: true,
                  state: {
                    mode: {
                      currentMode: {
                        id: DEFAULT_MODE_ID,
                        relatedValue: null
                      }
                    }
                  }
                });
              }

            } else {
              this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, eventList).toPromise().then(modeSwitched => {
                // Switched
                this.switchEventList(eventFilter);
              });
            }
            break;
          case ConfirmationDialogResult.Decline:
            break;
          default:
            break;
        }
      });
    } else {
      this.switchEventList(eventFilter);
    }
  }

  public onEventSelected(_eventList: Event[]): void {
    if (_eventList.length > 0) {
      //    this.selectedEventsSubject.next([_eventList[0]]);
      this.selectedEventsSubject.next(_eventList);
    } else {
      this.selectedEvent = null;
      this.selectedEventsSubject.next([]);
    }
  }

  public onEventSelectedRaise(_eventList: Event[]): void {
    this.selectedEventsEv.emit(_eventList);
    this.onEventSelected(_eventList);
  }

  public evaluatePopoverMode(): boolean {
    return isNullOrUndefined(this.fullPaneID);
  }

  /**
   * Receives frist event from the event-grid
   * @param ev
   */
  public onFirstEvent(ev: FirstEvent): void {
    this.firstEvent = ev.event;
    // Line was causing double selection event
    // what created bug of wrong event details on selection
    // this.selectedEventsSubject.next([ev.event]);
  }

  public onGridEvents(ev: GridEvent): void {
    this.gridEvents.emit(ev);
  }

  public onNotifyUpdatedSelection(ev: EventUpdateNotificationMessage): void {
    this.notifyUpdatedSelectionEv.emit(ev);
    //  this.selectedEventsSubject.next([ev.events[0]]);
    this.selectedEventsSubject.next(ev.events);
  }

  public onGridMinifiedState(ev: boolean): void {
    if (ev) {
      // this.primaryActions = [];
      this.primaryActions = [
        {
          title: this.translations['EVENTS.FILTER-ACTION'],
          icon: 'element-filter',
          action: (): void => { this.filterActions.emit(); },
          disabled: false
        }
      ];

      this.secondaryActions = [];
    } else {
      this.contentActions();
    }
  }

  public onEventCommandsDisabled(ev: boolean): void {
    this.eventCommandsDisabledSubj.next(ev);
  }

  public onEventsNumberNotification(ev: number): void {
    this.numEventsChanged.emit(ev);
  }

  public onGotoSystem(ev): void {
  }

  public onGoToInvestigativeTreatment(ev): void {
  }

  public onExitFromInvestigativeTreatment(ev): void {
  }

  public onDeletePill(pillData: HfwFilterPillData): void {
    this.eventFilterChange.emit(pillData);
  }

  public onGoToAssistedTreatment(ev: Event): void {
    this.opNodes.clear();
    this.isInAssistedMode = true;
    this.curSplitPosition = this.splitPosition;
    this.splitPosition = this.ATSplitPosition;
    this.eventToSend = ev.id;
    this.eventToSendDesignation = ev.srcPropertyId;
    this.systemId = ev.srcSystemId;
    this.selectedEventOPId = ev.oPId;
    this.eventCommonService.isInAssistedMode = true;
    this.stepper.showOnlyRequired = false;
    this.subscribeToOperatingProcedure(ev.oPId);
  }

  public onExitFromAssistedTreatment(ev): void {
    this.isInAssistedMode = false;
    if (!isNullOrUndefined(this.curSplitPosition)) {
      this.splitPosition = this.curSplitPosition;
      this.curSplitPosition = undefined;
    }
    this.eventCommonService.isInAssistedMode = false;
    this.opNodes.clear();
    if (!isNullOrUndefined(this.eventCommonService.treatedEvent)) {
      this.eventCommonService.exitFromAssistedTreatment([this.eventCommonService.treatedEvent]);
    } else {
      this.eventCommonService.exitFromAssistedTreatment([ev]);
    }
    this.unsubscribeToOperatingProcedure();
    this.cdr.detectChanges();

    if (this.currentModeId === ASSISTED_MODE_ID) {
      this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, eventList).subscribe((modeChanged: boolean) => {
        // clear resolve observables on exit from AT
        this.resolveObsMap.clear();
        this.traceService.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
      });
    }
  }

  public updateStepButtons(step: OPStep): void {
    if (step === undefined) {
      return;
    }
    if (this.operatingProcedure.sequential) {
      const firstMandatoryNotExecuted = this.steps.findIndex(s => (s.required === true && s.isCompleted === false));
      this.steps.forEach((s, i) => {
        if (s !== undefined) {
          // enable resolve button of the active step, if it's not completed or if it's repeatable
          if (step?.id === s.id && (s.isCompleted === false || s.repeatable === true)) {
            // If no mandatory step in the operating procedure OR the mandatory is step is the current or in the subsequent steps,
            // the resolve button is available for the current step
            if (firstMandatoryNotExecuted === -1 || firstMandatoryNotExecuted >= i) {
              if (step.managedType === 'OPStepAlarmPrintout' || step.managedType === 'OPStepTreatmentForm' || step.managedType === 'OPStepReport') {
                s.primaryAction.disabled = s.hasConfirmedExecution ? false : true;
              } else {
                s.primaryAction.disabled = false;
              }
            } else {
              s.primaryAction.disabled = true;
            }
          } else {
            s.primaryAction.disabled = true;
          }
        }
      });
    } else {
      this.steps.forEach((s, i) => {
        if (s !== undefined) {
          // enable resolve button of the active step, if it's not completed
          if (step?.id === s.id && !s.isCompleted) {
            if (step.managedType === 'OPStepAlarmPrintout' || step.managedType === 'OPStepTreatmentForm' || step.managedType === 'OPStepReport') {
              s.primaryAction.disabled = s.hasConfirmedExecution ? false : true;
            } else {
              s.primaryAction.disabled = false;
            }
          } else {
            s.primaryAction.disabled = true;
          }
        }
      });
    }

  }

  public onActiveStateChange(state: boolean, step: OPStep): void {
    if (state) {
      this.activeStep = step;
      this.updateStepButtons(step);
    }
  }

  public logEvent(ev: any, index?: number): void {
    this.traceService.info(TraceModules.eventInfo, ev);
    if (index !== undefined && !this.operatingProcedure.steps[index].repeatable) {
      this.operatingProcedure.steps[index].disabled = true;
      this.operatingProcedure.steps[index].status = 'checked';
    }
  }

  public getDocumentBrowserMsg(step: any): any {
    this.systemBrowserService.searchNodes(1, step.fixedLink).toPromise().then(res => res);
  }

  public handleStoreObjectData(event: StateData): void {
    this.storeObject = event;
    // this.saveStorage();
  }

  public handleSaveEvent(event: string): void {
    this.runtimeStatus = event;
  }

  public handleSendToOutput(event: boolean, step: OPStep): void {
    const isValidStep = (step.managedType === 'OPStepAlarmPrintout' || step.managedType === 'OPStepTreatmentForm' || step.managedType === 'OPStepReport');

    step.primaryAction = {
      title: this.resolveLabel,
      icon: 'element-download',
      type: 'action',
      disabled: (isValidStep && step.isCompleted) ? step.primaryAction.disabled : event };
  }

  public onConfirmStep(step: OPStep): void {
    // send resolve execution to the step
    this.resolveObsMap.get(step.id)?.next(true);
  }

  public onStepResolveExecutionResult(resolveResult: ResolveExecutionResult, step: OPStep): void {

    if (resolveResult.status === ResolveExecutionStatus.InProgress) {
      return;
    }

    if (this.operatingProcedure === null) {
      return;
    }

    const updatedStep: Step = new Step();
    updatedStep.attachments = step.attachments;
    updatedStep.attributes = step.attributes;
    updatedStep.configuration = step.configuration;
    updatedStep.errorText = step.errorText;
    updatedStep.hasConfirmedExecution = step.hasConfirmedExecution;
    updatedStep.isCompleted = true;
    updatedStep.managedType = step.managedType;
    updatedStep.notes = step.notes;
    updatedStep.operator = this.appContextService.userNameValue;
    updatedStep.runtimeStatus = step.runtimeStatus;
    if (step.managedType === 'OPStepTreatmentForm') {
      updatedStep.runtimeStatus = this.runtimeStatus;
      updatedStep.hasConfirmedExecution = true;
    }
    updatedStep.stepId = step.id;
    updatedStep.stepName = step.name;

    // update the step status according to the success or failure of the step
    if (resolveResult.status === ResolveExecutionStatus.Success) {
      updatedStep.status = 'Succesfull';
    } else if (resolveResult.status === ResolveExecutionStatus.Failure) {
      // create a toast notification to inform the user of the step failure
      if (updatedStep.errorText !== undefined) {
        updatedStep.errorText = resolveResult.errorMessage;
        this.siToastNotificationService.queueToastNotification(
          'danger',
          this.atExecutionErrorLabel,
          step.name + ': ' + step.errorText,
          true
        );
      }

      updatedStep.status = 'Failed';
    }

    this.assistedTreatmentService.updateStep(this.operatingProcedure.id, updatedStep);

    // on resolve click, disable the resolve button
    step.primaryAction.disabled = true;

    // reset resolve observable status
    this.resolveObsMap.get(step.id).next(false);
  }

  public getNodesValues(): any[] {
    return Array.from(this.opNodes.values());
  }

  public formatStepNameLabel(curStep: OPStep): string {
    return curStep.required ? this.mandatoryLabel.replace('{{stepName}}', curStep.name) : curStep.name;
  }

  private assignEmptyValues(): void {
    this.storeObject = {
      lastShownDocumentData: null,
      path: '',
      index: -1,
      scrollTop: 0,
      scrollLeft: 0,
      skip: 0,
      tilesScrollTop: 0,
      zoomFactor: 1,
      zoomSetting: 'page-width',
      page: 1,
      searchString: '',
      designation: ''
    };
  }

  private contentActions(): void {
    this.primaryActions = [
      {
        title: this.translations['EVENTS.FILTER-ACTION'],
        icon: 'element-filter',
        action: (): void => { this.filterActions.emit(); },
        disabled: false
      }
    ];

    this.secondaryActions = [
      {
        title: this.translations['EVENTS.COLUMN-CUSTOMIZE-TITLE'],
        action: (): void => { this.columnsActions.emit(); },
        disabled: false
      }
    ];
  }

  private subscribeToOperatingProcedure(oPId: string): void {
    if (this.operatingProcedureSubscription != null && this.operatingProcedure === null) {
      this.assistedTreatmentService.subscribeProcedure(oPId);
      this.subscribetoOpNotifications();
    } else if (this.operatingProcedureSubscription === null) {
      this.subscribetoOpNotifications();
      if (this.operatingProcedureSubscription != null) {
        this.assistedTreatmentService.subscribeProcedure(oPId);
      }
    }
  }

  private unsubscribeToOperatingProcedure(): void {
    if (this.operatingProcedureSubscription != null && this.operatingProcedure != null) {
      this.assistedTreatmentService.unSubscribeProcedure();
      this.operatingProcedure = null;
      this.steps.length = 0;
    }
  }

  private manageOperatingProcedureSubscriptionError(error: any): void {
    this.traceService.error(TraceModules.eventInfo, 'manageOperatingProcedureSubscriptionError() error: %s', error.toString());
    this.operatingProcedureSubscription = null;
  }

  private onOperatingProcedureNotification(procedure: Procedure): void {
    this.operatingProcedure = new OperatingProcedure();
    this.operatingProcedure.initializeFromOPServiceProcedure(procedure, this.resolveLabel);
    if (!isNullOrUndefined(this.operatingProcedure.steps)) {
      this.steps = this.operatingProcedure.steps.slice(0);
      this.mapStepStatuses();
    }

    this.updateStepButtons(this.activeStep);

    this.populateOpNodes(this.operatingProcedure);

    this.populateResolveObsMap(this.steps);
  }

  private populateResolveObsMap(steps: OPStep[]): void {
    // populate a map of step ids and their 'resolve observables'
    // resolve observables are used to trigger a step action when the user clicks on the 'resolve' button, and are passed to the step as an input
    // one observable for every resolve button (one observable for every step)
    steps.forEach(step => {
      if (!this.resolveObsMap.get(step.id)) {
        const obs: BehaviorSubject<boolean> = new BehaviorSubject(null);
        this.resolveObsMap.set(step.id, obs);
      }
    });
  }

  private populateOpNodes(op: OperatingProcedure): void {
    if (!isNullOrUndefined(this.operatingProcedure.steps)) {
      // this.opNodesForAlarmEvent = new Map<number, BrowserObject[]>();
      this.operatingProcedure.steps.forEach((step, index) => {
        // for report and alarm printout step
        if (step.managedType === 'OPStepReport' ||
            step.managedType === 'OPStepAlarmPrintout' ||
            step.managedType === 'OPStepTreatmentForm') {
          if (op.id === this.selectedEventOPId && !isNullOrUndefined(step.fixedLink)) {
            // get document from fixedLink
            this.systemBrowserService.searchNodes(this.systemId, step.fixedLink, null, 2).toPromise().then(res => {
              this.opNodes.set(step.id, res.Nodes);

              // debug for undefined browserobject
              this.traceService.debug(TraceModules.eventInfo, res.Nodes.toString());
              if (res.Nodes.length === 0) {
                this.traceService.debug(TraceModules.eventInfo, "BrowserObject is empty!");
              }
            });
          }
        }
        // find document url for each document step
        if (step.managedType === 'OPStepDocumentViewer') {
          if (!isNullOrUndefined(step.fixedLink)) {
            // get document from fixedLink
            this.systemBrowserService.searchNodes(1, step.fixedLink, null, 2).toPromise().then(res => {
              this.opNodes.set(step.id, [res.Nodes[0]]);
            });
          } else {
            // get document from related items
            this.relatedItemsService.getRelatedItems([op.alertSource]).toPromise().then(item => {
              const nodes: any = [];
              item.RelatedResults[0].RelatedItems.forEach(i => {
                if (i.Nodes[0].Attributes.ManagedType === GmsManagedTypes.EXTERNAL_DOCUMENT.id) {
                  nodes.push(i.Nodes[0]);
                }
              });
              this.opNodes.set(step.id, nodes);
            });
          }
        } else if (step.managedType === 'OPStepGraphics') {
          if (!isNullOrUndefined(step.fixedLink)) {
            // get document from fixedLink
            this.systemBrowserService.searchNodes(1, step.fixedLink, null, 2).toPromise().then(res => {
              this.opNodes.set(step.id, res.Nodes[0]);
            });
          } else {
            this.systemBrowserService.searchNodes(1, op.alertSource, null, 2).toPromise().then(res => {
              this.opNodes.set(step.id, res.Nodes[0]);
            });
          }
        } else if (step.managedType === 'OPStepVideo') {
          this.opNodes.set(step.id, { stepIndex: index, alertSource: op.alertSource,
            configuration: step.configuration, runtimeStatus: step.runtimeStatus });
        } else {
          // if not supported, create a dummy opNode
          this.opNodes.set(step.id, undefined);
        }
      });
    }
  }

  private mapStepStatuses(): void {
    this.steps.forEach(step => {
      if (step.isCompleted === true) {
        if (step.status === 'Succesfull') {
          step.icon = 'checked';
        } else if (step.status === 'Failed') {
          step.icon = 'failed-checked';

          // create a toast notification to inform the user of the step failure
          if (!isNullOrUndefined(step.errorText) &&
            this.siToastNotificationService.activeToasts.findIndex(t => t.message === step.name + ': ' + step.errorText) === -1) {
            this.siToastNotificationService.queueToastNotification(
              'danger',
              'Assisted treatment step execution failed',
              step.name + ': ' + step.errorText,
              true
            );
          }
        }
      } else {
        if (step.status === 'Succesfull') {
          step.icon = 'not-checked';
        } else if (step.status === 'Failed') {
          step.icon = 'failed';

          // create a toast notification to inform the user of the step failure
          if (!isNullOrUndefined(step.errorText) &&
            this.siToastNotificationService.activeToasts.findIndex(t => t.title === step.name + ': ' + step.errorText) === -1) {
            this.siToastNotificationService.queueToastNotification(
              'danger',
              'Assisted treatment step execution failed',
              step.name + ': ' + step.errorText,
              true
            );
          }
        }
      }
    });
  }

  private subscribetoOpNotifications(): void {
    this.treatmentFormSubs?.unsubscribe();
    this.treatmentFormSubs = this.reportService.treatmentFormUpdateEvent.subscribe(treatmentUpdate => {
      this.treatmentUpdate = treatmentUpdate;
    });

    this.operatingProcedureSubscription = this.assistedTreatmentService.subscribedOperatingProcedure.subscribe(
      (values: Procedure) => {
        values?.steps?.forEach(res => {
          if (res.managedType === 'OPStepTreatmentForm') {
            this.isStepConfirm = res.isCompleted;
          }
        })
        // If treatment form is saved, it should not load the snapin again.
        // If step is resolved, it should update the procedure, then resolved status can be seen in standard client
        if (!this.treatmentUpdate || this.isStepConfirm) {
          this.onOperatingProcedureNotification(values);
          this.isStepConfirm = false;
        } else {
          this.reportService.treatmentFormUpdateEvent.next(false);
        }
      },
      error => this.manageOperatingProcedureSubscriptionError(error)
    );
  }

  private switchEventList(eventFilter: EventFilter): void {
    if (this.multiMonitorService.runsInElectron && !this.multiMonitorService.isMainManager() && this.multiMonitorService.isManagerWithEvent()) {
      // In electron with detached event manager
      const evtMessage: EventMessage = {
        type: EventMessageType.EventFiltering,
        data: [eventFilter, this.selectedEvents]
      };
      this.multiMonitorService.sendEvent(evtMessage);
    } else {
      // web app or electron with the events list

      /**
       * Jump to the event-list
       * filter events-list
       * select a first event
       */

      this.switchToEventFrame(eventFilter);
    }
  }

  private switchToEventFrame(eventFilter: EventFilter): void {
    const message = this.setEventSelectionMsg();
    if (message) {
      this.messageBroker.switchToNextFrame(eventList, message).pipe(take(1)).subscribe((frameChanged: boolean) => {
        // Filter events-list
        this.eventService.setEventsFilter(eventFilter, 0, true);
      });
    } else {
      this.messageBroker.switchToNextFrame(eventList).pipe(take(1)).subscribe((frameChanged: boolean) => {
        // Filter events-list
        this.eventService.setEventsFilter(eventFilter, 0, true);
      });
    }
  }

  private setEventSelectionMsg(): MessageParameters | null {
    if (!this.firstEvent?.id) { return null; }
    const messageBody: GmsMessageData = new GmsMessageData([]);
    const types = [];
    const fullQParamId = new FullQParamId(eventList, 'EventQParamService', 'primary');
    const isGroupedEvent = this.firstEvent?.groupedEvents?.length > 0;
    const qParam: QParam = {
      name: this.firstEvent?.id + (isGroupedEvent ? '*' : ''),
      // Gropued events quesry has to contain "*" at the end
      value: this.firstEvent?.id + (isGroupedEvent ? '*' : '')
    };

    const message: MessageParameters = {
      messageBody,
      qParam,
      types
    };

    return message;
  }

  private clearData(): void {
    this.eventFilter = undefined;
    this.header = undefined;
    this.icon = undefined;
  }

  private setIcon(objTypeId: number, objSubtypeId: number): void {
    this.iconMapperService
      .getGlobalIcon(TablesEx.ObjectSubTypes, objSubtypeId, objTypeId)
      .toPromise()
      .then(iconString => {
        this.icon = iconString;
        this.header.icon = iconString;
      });
  }

  private async setBrowserObject(search: string): Promise<void> {
    let searchOption: any;

    const systemView = search.split(':')[0];
    const systemName = systemView.split('.')[0];

    const systemId = await this.browserObjectService.getSystemIdFromSystemName(systemName);
    const page = await lastValueFrom(this.systemBrowserService.searchNodes(systemId, search, undefined, searchOption));
    this.searchNodesCallback(page);
  }

  private searchNodesCallback(page): void {
    if (page?.Nodes?.length > 0) {
      this.header = {};
      this.setIcon(
        page.Nodes[0].Attributes.TypeId,
        page.Nodes[0].Attributes.SubTypeId
      );
      this.setLabel(page.Nodes[0]);
      this.subscribeLabelsOrder(page.Nodes[0]);
    } else {
      this.traceService.error(
        TraceModules.eventInfo,
        'Object related to selected event not found!'
      );
    }
  }

  private setLabel(bo: BrowserObject): void {
    if (!bo) {
      return;
    }
    const labelArr: string[] =
      this.cnsHelperService.getCnsLabelsOrdered(bo) || [];
    this.header.primary = labelArr[0];
    this.header.secondary = labelArr[1];
  }

  private subscribeLabelsOrder(bo: BrowserObject): void {
    this.subscriptions.push(
      this.cnsHelperService.activeCnsLabel.subscribe(cnsLabel => {
        this.setLabel(bo);
      })
    );
  }

  private checkMode(): void {
    this.subscriptions.push(
      this.messageBroker.getCurrentMode().subscribe(mode => {
        const previousModeId = this.currentModeId;
        this.currentModeId = mode.id;
        if (previousModeId === ASSISTED_MODE_ID && this.currentModeId === DEFAULT_MODE_ID) {
          this.unsubscribeToOperatingProcedure();
          this.isInAssistedMode = false;
        }
        this.isInInvestigativeMode = this.currentModeId === INVESTIGATIVE_MODE_ID;
      })
    );
  }
}
