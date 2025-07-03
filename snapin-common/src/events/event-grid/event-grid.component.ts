/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/naming-convention */
'use strict';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AppContextService, isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { FullPaneId, FullQParamId, FullSnapInId, IHfwMessage, ISnapInConfig } from '@gms-flex/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subject, Subscription, switchMap } from 'rxjs';
import {
  AuthenticationService, CnsHelperService, CnsLabel, CnsLabelEn,
  Event, EventDateTimeFilterValues, EventDetailsList, EventFilter, EventService, EventSortingField,
  EventStates, EventSubscription, HdrItem, SortingDirection, ValidationInput, ViewInfo
} from '@gms-flex/services';
import { TraceModules } from '../../shared/trace-modules';
import { enumColumnType, enumEventType, GridData, GridEvent, HeaderData } from '../../events/event-data.model';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { EventUpdateNotificationMessage, FirstEvent } from './data.model';
import {
  Column, ColumnSelectionDialogResult, SiColumnSelectionDialogConfig, SiColumnSelectionDialogService, SiModalService,
  SiToastNotificationService
} from '@simpl/element-ng';
import { TimeoutDialogService } from '@gms-flex/controls';
import { _fixedSizeVirtualScrollStrategyFactory } from '@angular/cdk/scrolling';
import { EventsValidationHelperService } from '../services/events-validation-helper.service';
const categoryDescriptor = 'categoryDescriptor';
const direction = 'InOut';

const enum OnNewEvent {
  DoNothing = 'DoNothing',
  OpenEventList = 'OpenEventList',
  StartFastTreatment = 'StartFastTreatment',
  StartInvestigativeTreatment = 'StartInvestigativeTreatment',
  StartAssistedTreatment = 'StartAssistedTreatment'
}

const enum CloseTreatmentWhen {
  EventAcknowledged = 'EventAcknowledged',
  SourceToNormal = 'SourceToNormal',
  EventReset = 'EventReset',
  EventClosed = 'EventClosed',
  Timeout = 'Timeout'
}

/**
 * The controller/viewmodel of the Event grid.
 */

@Component({
  selector: 'gms-event-grid',
  templateUrl: './event-grid.component.html',
  styleUrl: './_event-grid.component.scss',
  standalone: false
})

export class EventGridComponent implements OnInit, OnDestroy {

  // #region public variables
  public _NoEvents = ''; // No events
  public _EventStateUnprocessed = ''; // "Unprocessed";
  public _EventStateReadyToBeReset = ''; // "Ready to be Reset";
  public _EventStateReadyToBeClosed = ''; // "Ready to be Closed";
  public _EventStateWaitingForCondition = ''; // "Waiting for Condition";
  public _EventStateWaitingForCommandExecution = ''; // "WaitingForCommandExecution"
  public _EventStateAcked = ''; // "Acked";
  public _EventStateClosed = ''; // "Closed";
  public _EventStateUnprocessedWithTimer = ''; // "Unprocessed with timer";
  public _EventStateReadyToBeResetWithTimer = ''; // "Ready to be Reset with timer";
  public _SourceStateActive = ''; // "Active";
  public _SourceStateQuiet = ''; // "Quiet";
  public _SuggestedActionAcknowledge = ''; // "Acknowledge event"
  public _SuggestedActionClose = ''; // "Close event"
  public _SuggestedActionCompleteOP = ''; // "Complete Operating Procedure"
  public _SuggestedActionReset = ''; // "Reset event"
  public _SuggestedActionSilence = ''; // "Silence event"
  public _SuggestedActionSuspend = ''; // "Suspend event"
  public _SuggestedActionWaitForCondition = ''; // "Waiting For Condition"
  public _ColumnNameCause = ''; //  "Event Cause",
  public _ColumnNameCategory = ''; // "Category",
  public _ColumnNameDescription = ''; // "Description",
  public _ColumnNameName = ''; // "Name",
  public _ColumnNameDateTime = ''; // "DateTime",
  public _ColumnNameCommands = ''; // "Commands",
  public _ColumnNameEventStatus = ''; // "Event Status",
  public _ColumnNameInformationalText = ''; // "Informational Text",
  public _ColumnNameSourceStatus = ''; // "Source Status",
  public _ColumnNamePath = ''; // "Path",
  public _ColumnNameSource = ''; // "Source",
  public _ColumnNameBelongsTo = ''; // "Belongs to",
  public _ColumnNameTimer = ''; // "Timer",
  public _ColumnNameSuggestedAction = ''; // "Suggested action",
  public _ColumnNameSrcSystemName = ''; // "System Name",
  public _ColumnNameMessageText = ''; // "Message",
  public _ColumnNameInProcessBy = ''; // "InProcessBy",
  public _ColumnNameSrcAlias = ''; // "Alias",
  public _eventFilter: EventFilter = new EventFilter(false);
  public cnsLabels: CnsLabel[];
  public currCnsLabel: CnsLabel = null;
  public currActiveView: ViewInfo = null;
  public gridItem2select: GridData;

  public selectedGridRowsSubj: BehaviorSubject<GridData[]> = new BehaviorSubject([]);
  public selectedGridRows: Observable<GridData[]> = this.selectedGridRowsSubj.asObservable();

  public previousColSettingsData = '';
  public currentColSettingsData = '';
  public headerTitle = ''; // "Customize columns";
  public bodyTitle = ''; // "Customize view by selecting content or ordering";
  public submitBtnName = ''; // "Applying the changes";
  public cancelBtnName = ''; // "cancellation of changes";
  public visibleLabelName = ''; // "View label name";
  public hiddenLabelName = ''; // "Hide label name";
  public restoreToDefaultBtnName = ''; // "reset of changes";

  public sortingCriteria: EventSortingField[] = [];

  public columnName = 'Description';
  public hdrData: HeaderData[] = [];
  public txtTable: GridData[] = [];
  public newSelectedRows: any[] = [];

  public txtTableSubj: BehaviorSubject<GridData[]> = new BehaviorSubject([]);
  public txtTableObs: Observable<GridData[]> = this.txtTableSubj.asObservable();
  public fullPaneId: FullPaneId;
  public fullQParamId: FullQParamId;
  public allowMultiselection = true; // Multiselection parameter settings to true if not present in hldl
  public pagesSize = 5;
  public pagesVirtualized = 20;
  public updateGridDisplay: Subject<void> = new Subject<void>();
  public reattachIndication: Observable<void>;
  public updateHeaderInitialization: Subject<void> = new Subject<void>();
  public showEventGridHeader = false;
  public columnsSettingsDataSubj: BehaviorSubject<string> = new BehaviorSubject('');
  public columnsSettingsDataObs: Observable<string> = this.columnsSettingsDataSubj.asObservable();
  public showColDlgObs: Observable<boolean>;
  public loading = true;
  public sortable = true; // Sortable parameter settings to true if not present in hldl
  public eventCommandsDisabledSubj: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public eventCommandsDisabledObs: Observable<boolean> = this.eventCommandsDisabledSubj.asObservable();
  public disableEventsCommandOnActiveFilter = false; // if present in hldl disable events commmands in case of active filter
  public columns?: Column[];
  public isEventTableValid = true; // Used to refresh Event Table
  public isULC = false;
  public isULInactivityTimeout = false;
  // #endregion

  @Input() public set pageSizeEG(value: number) {
    this.pagesSize = value;
  }

  @Input() public set pagesVirtualizedEG(value: number) {
    this.pagesVirtualized = value;
  }

  @Input() public set showHeader(showGridHeader: boolean) { // to display grid headers
    this.showEventGridHeader = showGridHeader;
  }

  @Input() public fullSnapinID: FullSnapInId = null;

  @Input() public set fullPaneID(fullPaneID: FullPaneId) { // to pass the consumer fullPaneID
    this.fullPaneId = fullPaneID;
  }

  @Input() public set fullQParamID(fullQParamID: FullQParamId) { // to pass the consumer fullQParamID
    this.fullQParamId = fullQParamID;
  }

  @Input() public set eventFilter(eventFilter: EventFilter) { // to pass the filter to be applied to the event list
    if (eventFilter == null && this._eventFilter == null || eventFilter === this._eventFilter) {
      this.eventCommandsDisabledSubj.next(false);
      return;
    }

    this._eventFilter = eventFilter;
    if (this.disableEventsCommandOnActiveFilter) {
      this.eventCommandsDisabledSubj.next(true);
    }
    if (this.eventSubscription !== undefined) {
      this.eventService.setEventsFilter(this._eventFilter, this.eventSubscription.id);
    }
  }

  @Input() public set supportQparam(supportQparam: boolean) { // to pass the consumer fullPaneID
    this.supportQparamNavigation = supportQparam;
  }

  @Input() public set showColumnSelectionDlg(showDlg: Observable<boolean>) {
    this.showColDlgObs = showDlg;
  }

  @Input() public selectedEventsIds: Observable<string[]>;
  @Input() public compactMode: boolean;
  @Input() public disableGroupEvents = false;
  @Input() public visibleColumns: string[] = [];
  @Input() public scrollable = true;
  @Input() public storeColumnsSettings = false;
  @Input() public isInAssistedTreatment = false;
  @Input() public coloredRows = false;
  @Input() public IsInPopoverMode = false;

  @Output() public readonly selectionChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly columnsSettingsCnfgUpdate: EventEmitter<string> = new EventEmitter<string>();
  @Output() public readonly columnsConfigurationChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly selectedEventsEv: EventEmitter<Event[]> = new EventEmitter<Event[]>();
  @Output() public readonly firstEvent: EventEmitter<FirstEvent> = new EventEmitter<FirstEvent>();
  @Output() public readonly gridEvents: EventEmitter<GridEvent> = new EventEmitter<GridEvent>();
  @Output() public readonly numEventsChanged: EventEmitter<number> = new EventEmitter<number>();
  @Output() public readonly eventsChanged: EventEmitter<GridData[]> = new EventEmitter<GridData[]>();
  @Output() public readonly notifyUpdatedSelectionEv: EventEmitter<EventUpdateNotificationMessage> = new EventEmitter<EventUpdateNotificationMessage>();
  @Output() public readonly rowHeight: EventEmitter<number> = new EventEmitter<number>();
  @Output() public readonly minifiedState: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public readonly eventCommandsDisabled: EventEmitter<boolean> = new EventEmitter<boolean>();

  private readonly subscriptions: Subscription[] = [];
  private eventSubscription: EventSubscription;

  private subscriptionToEvents: Subscription;
  private subscriptionToEventFilter: Subscription;

  private readonly _settingsId: string = 'EventList_GridColumnSettings';
  private readonly _eventSettingsId: string = 'event-settings';
  private readonly _reattachInd: Subject<void> = new Subject<void>();
  private resetSorting = false;
  private selectedEvents: Event[] = [];
  private previouslySelectedEvents: Event[] = [];
  private hldlFullConfig: any = undefined;
  private _hldlFullColumnConfig = '';
  private readonly _hldlColumnSortingSettings: EventSortingField[] = [];
  private isGridInitialized = false;
  private userLang: string;
  private readonly intervals: any[] = [];
  private serverOffset = 0;
  private hasAlreadyReceivedEvents = true;
  private wasAnEventPreviouslySelected: boolean;
  private isProcessingQParamChange = false;
  private pendingQueryParamSel: string;
  private supportQparamNavigation = false;
  private commandToSend = '';
  private lastMessage = '';
  private readonly obsoleteColumns: string[] = ['eventText', 'groupButton', 'arrowButton', 'firstLineSmall', 'secondLineSmall',
    'messageTextCardView', 'srcDescriptor', 'srcName', 'srcLocation', 'srcState', 'eventId', 'srcDesignation',
    'srcDisciplineDescriptor', 'srcSystemId', categoryDescriptor, 'recursation'];
  private skipNotifications = true;
  private readonly updateColumnsCnfgSubj: EventEmitter<ColumnSelectionDialogResult> = new EventEmitter<ColumnSelectionDialogResult>();

  private readonly colLabelList: string[] = ['eventIcon', 'cause', 'state', 'informationalText', 'creationTime',
    'timer', 'srcSource', 'belongsTo', 'srcPath', 'commands', 'suggestedAction', 'srcSystemName', 'messageText', 'inProcessBy', 'srcAlias'];
  private columnsSettingsDataStr = '';
  private readonly defaultConfig: Column[] = [];
  private readonly translateService: TranslateService;
  private readonly modalRef;
  private readonly VERSION_INFO = 'version5.0';
  private hiddenEventsFilterChanged = false;
  private readonly defaultFullSnapInId = new FullSnapInId('event-list', 'el');
  private readonly defaultPaneId = new FullPaneId('event-list', 'el-pane');
  private prevSelected;
  private currentMode: string;
  private initialMode: string;

  // #region Buttons
  private readonly emptyButton: string = 'empty';
  private readonly ackButton: string = 'ack';
  private readonly resetButton: string = 'reset';
  private readonly resetButtonPrimary: string = 'reset';
  private readonly silenceButton: string = 'silence';
  private readonly silenceButtonPrimary: string = 'silence';
  private readonly unsilenceButton: string = 'unsilence';
  private readonly closeButton: string = 'close';
  private readonly closeButtonPrimary: string = 'close';
  private firstReload = true;
  private ulSorting = false;
  // #endregion
  /**
   * Constructor
   * @param traceService The trace service.
   * @param messageBroker
   * @param activatedRoute
   */
  public constructor(
    private readonly traceService: TraceService,
    private readonly appContextService: AppContextService,
    private readonly eventService: EventService,
    public cnsHelperService: CnsHelperService,
    private readonly settingsService: SettingsServiceBase,
    private readonly snapinConfig: ISnapInConfig,
    private readonly messageBroker: IHfwMessage,
    private readonly eventCommonService: EventsCommonServiceBase,
    private readonly cd: ChangeDetectorRef,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly siColumnModal: SiColumnSelectionDialogService,
    private readonly timeoutDialogService: TimeoutDialogService,
    private readonly authenticationService: AuthenticationService,
    private readonly eventsCommonService: EventsCommonServiceBase,
    private readonly eventValidationService: EventsValidationHelperService
  ) {
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnInit(): void {
    this.loading = true;
    this.eventService.addConsumer();
    this.selectedEvents.length = 0;

    this.getHldlConfigs();

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.eventGrid, 'use  user Culture');
          this.getTranslations();
        },
        (err: any) => {
          this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
            if (defaultCulture != null) {
              this.translateService.setDefaultLang(defaultCulture);
            } else {
              this.traceService.warn(TraceModules.eventGrid, 'No default Culture for appContextService');
              this.translateService.setDefaultLang(this.translateService.getBrowserLang());
            }
            this.getTranslations();
          }));
        });
      } else {
        this.traceService.warn(TraceModules.eventGrid, 'No user Culture for appContextService');
      }
    }));

    this.subscriptions.push(this.updateColumnsCnfgSubj.subscribe((value: ColumnSelectionDialogResult) => {
      this.onUpdateColumns(value);
    }));

    this.subscriptions.push(this.eventCommonService.subscribeColumnsResetting().subscribe(res => {
      if (res === true) {
        this.onDefaultLayoutButton();
      }
    }));

    if (this.selectedEventsIds !== undefined) {
      this.selectedEventsIds.subscribe(eventIds => {
        eventIds.forEach(eventId => {
          this.onQueryParamChange(eventId);
        });
      });
    }

    if (this.showColDlgObs !== undefined) {
      this.subscriptions.push(this.showColDlgObs.subscribe(showDlg => {
        if (showDlg) {
          this.showColumnDialog();
        }
      }));
    }

    this.cnsLabels = this.cnsHelperService.cnsLabels;
    this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe((cnsLabel => this.activeCnsLabelChanged(cnsLabel))));
    this.subscriptions.push(this.cnsHelperService.activeView.subscribe(view => this.activeViewChange(view),
      error => {
        this.traceService.error(TraceModules.eventGrid, 'Error in activeView CNSHelper subscription: %s', error.tostring());
      }));

    if (isNullOrUndefined(this.fullPaneID)) {
      this.fullPaneId = this.defaultPaneId;
    }

    if (this.visibleColumns.length === 0) {
      this._hldlFullColumnConfig = this.formatHldlDefaultColumnSettings();
    } else {
      this.skipNotifications = false;
    }

    this.initializeGridHeader();

    this.subscriptions.push(this.messageBroker.getCurrentMode().subscribe(mode => {
      if (isNullOrUndefined(this.initialMode)) {
        this.initialMode = mode.id;
      }
      this.currentMode = mode.id;
      if (this.currentMode === 'investigative') {
        this.eventsCommonService.isInInvestigativeMode = true;
      } else {
        this.eventsCommonService.isInInvestigativeMode = false;
      }
    }));

    if (this.supportQparamNavigation) {
      this.subscriptions.push(this.messageBroker.getQueryParam(this.fullQParamId).subscribe(qParam => {
        if (qParam !== this.lastMessage) {
          this.traceService.debug(TraceModules.eventGrid, 'New qParam received qParam=%s', qParam);
          this.onQueryParamChange(qParam);
          this.lastMessage = qParam;
        }
      }));
    }

    if (!this.IsInPopoverMode) {
      this.eventService.serverClientTimeDiff().then(res => {
        this.serverOffset = res;
      });
    }

    if (this.isULInactivityTimeout) {
      if (this.timeoutDialogService.getInstances() !== 0) {
        this.timeoutDialogService.logOutAction.subscribe(
          (doRefresh: boolean) => {
            this.ReloadEventList(doRefresh);
          },
          (error: any) => {
            this.traceService.info(TraceModules.eventGrid, 'TimeoutDialog logOutAction error %s. Replying TimeoutDialog subscribe.', error);
          });
      }
    }
  }

  public ngOnDestroy(): void {
    this.eventService.removeConsumer();

    if (this.eventSubscription) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
    }

    // this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });

    if (this.subscriptionToEvents != null) {
      this.subscriptionToEvents.unsubscribe();
    }

    if (this.subscriptionToEventFilter != null) {
      this.subscriptionToEventFilter.unsubscribe();
    }

    if (this.selectedEvents.length === 1) {
      if (this.compactMode) {
        this.suspendEvents();
      } else if (!this.eventsCommonService.isInInvestigativeMode) {
        this.suspendEvents(this.selectedEvents);
      }
    }

    this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });
  }

  public get reattachInd(): Observable<void> {
    return this._reattachInd;
  }

  public onSelectEvent(events: Event[], unselectDueAnIncomingSelection: boolean): void {
    this.selectEvents(events, unselectDueAnIncomingSelection);

    if (this.selectedEvents && this.selectedEvents.length > 0) {
      this.selectedEventsEv.emit(this.selectedEvents);
    }
  }

  public computeId(eventItem: Event): string {
    return (eventItem.groupedEvents.length === 0 ? eventItem.id : eventItem.id + '*');
  }

  public executeCommand(commandName: string, eventsToCommand: Event[]): void {
    if (commandName === 'select' || commandName === 'suspend') {
      this.eventService.eventCommand(eventsToCommand, commandName)
        .subscribe(error => {
          if (!isNullOrUndefined(error?.message)) {
            this.traceService.error(TraceModules.eventInfo, error.message);
            this.toastNotificationService.queueToastNotification('danger', 'EVENTS.EVENT-COMMANDING-FAILURE', error.message);
          }
        });
    } else {
      // Multi-selected events
      const eventIds: string[] = [];
      for (const eventItem of eventsToCommand) {
        eventIds.push(eventItem.srcPropertyId);
      }

      this.eventValidationService
        .validateEventCommands(eventIds, TraceModules.eventGrid)
        .pipe(
          switchMap((validationInput: ValidationInput) => this.eventService.eventCommand(
            eventsToCommand,
            commandName,
            undefined,
            validationInput
          ))
        )
        .subscribe(
          error => {
            if (!isNullOrUndefined(error?.message)) {
              this.traceService.error(TraceModules.eventInfo, error.message);
              this.toastNotificationService.queueToastNotification(
                'danger',
                'EVENTS.EVENT-COMMANDING-FAILURE',
                error.message
              );
            }
          },
          error => {
            this.traceService.error(
              TraceModules.eventGrid,
              'onSelectCommand(): Validation WSI Error. Details: ',
              error
            );
          }
        );
    }
  }

  public onEventsSortBy(fieldId: string, sortingDir: SortingDirection = null, isSingleCriterium: boolean = false): void {
    const indexVal: number = this.sortingCriteria.findIndex(evSortingField => evSortingField.id === fieldId);

    if (indexVal === -1) {
      if (sortingDir) {
        this.sortingCriteria.unshift(new EventSortingField(fieldId, 1, sortingDir));
      } else {
        this.sortingCriteria.unshift(new EventSortingField(fieldId, 1, SortingDirection.DESCENDING));
      }
    } else {
      const eventField: EventSortingField = this.sortingCriteria[indexVal];

      this.sortingCriteria.splice(indexVal, 1);

      if (sortingDir != null) {
        eventField.sortingDir = sortingDir;
      } else {
        if (eventField.sortingDir === SortingDirection.NONE ||
          eventField.sortingDir === SortingDirection.ASCENDING && isSingleCriterium) {
          eventField.sortingDir = SortingDirection.DESCENDING;
        } else {
          eventField.sortingDir = eventField.sortingDir === SortingDirection.DESCENDING ? SortingDirection.ASCENDING : SortingDirection.NONE;
        }
      }
      this.sortingCriteria.splice(0, 0, eventField);
    }
  }

  public onConfigurationChanged(hdrData: any): void {
    this.columnsConfigurationChanged.emit(hdrData);

    if (this.resetSorting) {
      this.resetSorting = false;

      this.sortingCriteria.forEach(value => {
        value.sortingDir = SortingDirection.NONE;
      });

      const arrayLen: number = this._hldlColumnSortingSettings.length;
      for (let i: number = arrayLen - 1; i >= 0; i--) {
        this.onEventsSortBy(this._hldlColumnSortingSettings[i].id, +this._hldlColumnSortingSettings[i].sortingDir);
      }

      this.eventsSortReset();
      this.RealignEventListData();
    }
    this.storeColumnConfiguration();
    this.createHeaderConfiguration();
  }

  public showColumnDialog(): void {
    if (this.defaultConfig.length === 0) {
      this.createColumnDialogDefaultSettings(this.hldlFullConfig.columns);
    }
    const colHeaderData = this.createCurrentColumnDialogConfig(this.currentColSettingsData);

    const config: SiColumnSelectionDialogConfig = {
      heading: this.headerTitle,
      bodyTitle: this.bodyTitle,
      submitBtnName: this.submitBtnName,
      cancelBtnName: this.cancelBtnName,
      restoreToDefaultBtnName: this.restoreToDefaultBtnName,
      hiddenText: this.hiddenLabelName,
      visibleText: this.visibleLabelName,
      restoreEnabled: true,
      columns: colHeaderData,
      translationParams: {}
    };

    this.siColumnModal.showColumnSelectionDialog(config).subscribe((result: ColumnSelectionDialogResult) => {
      this.onUpdateColumns(result);
    });
  }

  // #region *********  Events from event-table  *********

  public onSelectedEvent(events: GridData[]): void {
    this.selectedEvents.length = 0;
    events.forEach(element => {
      if (!isNullOrUndefined(element)) {
        this.selectedEvents.push(element.customData.eventItem);
      }
    });
    this.onSelectEvent(this.selectedEvents, false);
  }

  public onUnselectedEvent(gridEvents: GridData[]): void {
    const events: Event[] = [];

    if (gridEvents !== null) {
      gridEvents.forEach(element => {
        events.push(element.customData.eventItem);
      });
    }

    // Unselect all the previously selectedEvents, not only the ones coming from the table unselection.
    this.selectedEvents.forEach(e => {
      if (!events.find(ev => ev.eventId === e.eventId)) {
        events.push(e);
      }
    });

    this.suspendEvents(events);
  }

  public onCommandClick(params: any): void {
    this.commandToSend = params.cmd;

    if (this.commandToSend !== '') {
      const eventsToCommand: Event[] = [];
      const commandName: string = this.commandToSend;
      const evt: Event = params.event;

      if (!isNullOrUndefined(evt)) {
        if (evt.groupedEvents.length > 0) {
          evt.groupedEvents.forEach(subsequentEvent => {
            if (this.hasCommand(subsequentEvent, commandName, true) && !eventsToCommand.find(e => e.id == subsequentEvent.id)) {
              eventsToCommand.push(subsequentEvent);
            }
          });
        } else if (this.hasCommand(evt, commandName, true) && !eventsToCommand.find(e => e.id == evt.id)) {
          eventsToCommand.push(evt);
        }

        // in case of multiselection
        if (this.selectedEvents.length > 1) {
          this.selectedEvents.forEach(multiEvent => {
            if (this.hasCommand(multiEvent, commandName, true) && !eventsToCommand.find(e => e.id === multiEvent.id)) {
              eventsToCommand.push(multiEvent);
            }
          });
        }

        if (eventsToCommand.length > 0) {
          this.executeCommand(commandName, eventsToCommand);
        }
        this.commandToSend = '';
        return;
      }

      this.pushEventsToCommand(eventsToCommand, commandName);
    }
  }

  public onSortColumn(colData: any): void {
    this.onEventsSortBy(colData.colName, colData.dir, true);
    this.RealignEventListData();

    const updatedConfig: string = this.currentColSettingsData.substr(0, this.currentColSettingsData.lastIndexOf('-') + 1) +
      this.sortingCriteriaAsString();

    this.previousColSettingsData = this.currentColSettingsData;
    this.currentColSettingsData = updatedConfig;
    if (this.compactMode === undefined) {
      this.settingsService.putSettings(this._settingsId, updatedConfig).subscribe(
        val => this.onPutSettings(val),
        err => this.onPutSettingsError(err)
      );
    }
  }

  public onResize(colVisibConfig: string): void {
    const sections: string[] = this.currentColSettingsData.split('-');

    this.previousColSettingsData = this.currentColSettingsData;
    this.currentColSettingsData = colVisibConfig + '-' + sections[2];

    this.settingsService.putSettings(this._settingsId, this.currentColSettingsData).subscribe(
      val => this.onPutSettings(val),
      err => this.onPutSettingsError(err)
    );
  }

  public onRowHeight(height: number): void {
    this.rowHeight.emit(height);
  }

  public onTableMinifiedState(state: boolean): void {
    this.minifiedState.emit(state);
  }

  public onDefaultLayoutButton(): void {
    this.columnsSettingsDataStr = this.VERSION_INFO + '-' + this._hldlFullColumnConfig + '-'
      + this.sortingCriteriaAsString(this._hldlColumnSortingSettings);
    this.columnsSettingsDataSubj.next(this.columnsSettingsDataStr);
    this.eventsSortReset();
    this.storeColumnConfiguration(this.columnsSettingsDataStr);
  }

  // #endregion

  private getTranslations(): void {
    this.subscriptions.push(this.translateService.get([
      'EVENTS.EVENT-STATE-UNPROCESSED',
      'EVENTS.EVENT-STATE-READY-TO-BE-RESET',
      'EVENTS.EVENT-STATE-READY-TO-BE-CLOSED',
      'EVENTS.EVENT-STATE-WAITING-FOR-CONDITION',
      'EVENTS.EVENT-STATE-ACKED',
      'EVENTS.EVENT-STATE-CLOSED',
      'EVENTS.SOURCE-STATE-QUIET',
      'EVENTS.SOURCE-STATE-ACTIVE',
      'EVENTS.EVENT-STATE-UNPROCESSED-WITH-TIMER',
      'EVENTS.EVENT-STATE-READY-TO-BE-RESET-WITH-TIMER',
      'EVENTS.EVENT-STATE-WAITING-FOR-COMMAND-EXECUTION',
      'EVENTS.COLUMN-NAME-CAUSE',
      'EVENTS.COLUMN-NAME-DESCRIPTION',
      'EVENTS.COLUMN-NAME-NAME',
      'EVENTS.COLUMN-NAME-LOCATION',
      'EVENTS.COLUMN-NAME-DATE-TIME',
      'EVENTS.COLUMN-NAME-COMMANDS',
      'EVENTS.COLUMN-NAME-EVENT-STATUS',
      'EVENTS.COLUMN-NAME-SOURCE-STATUS',
      'EVENTS.COLUMN-CUSTOMIZE-TITLE',
      'EVENTS.COLUMN-CUSTOMIZE-DESCRIPTION',
      'EVENTS.COLUMN-NAME-CATEGORY',
      'EVENTS.COLUMN-NAME-SOURCE',
      'EVENTS.COLUMN-NAME-BELONGSTO',
      'EVENTS.COLUMN-NAME-TIMER',
      'EVENTS.COLUMN-NAME-INFORMATIONAL-TEXT',
      'EVENTS.COLUMN-NAME-PATH',
      'EVENTS.COLUMN-NAME-SUGGESTED-ACTION',
      'EVENTS.COLUMN-NAME-SYSTEM-NAME',
      'EVENTS.COLUMN-NAME-MESSAGE-TEXT',
      'EVENTS.COLUMN-NAME-IN-PROCESS-BY',
      'EVENTS.COLUMN-NAME-ALIAS',
      'EVENTS.SUGGESTED-ACTION-ACKNOWLEDGE',
      'EVENTS.SUGGESTED-ACTION-CLOSE',
      'EVENTS.SUGGESTED-ACTION-COMPLETE-OP',
      'EVENTS.SUGGESTED-ACTION-RESET',
      'EVENTS.SUGGESTED-ACTION-SILENCE',
      'EVENTS.SUGGESTED-ACTION-SUSPEND',
      'EVENTS.SUGGESTED-ACTION-WAIT-FOR-CONDITION',
      'EVENTS.NO-EVENTS-FOUND',
      'HFW_CONTROLS.GRID_COL_DIALOG_YESBTN',
      'HFW_CONTROLS.GRID_COL_DIALOG_CANCELBTN',
      'HFW_CONTROLS.GRID_COL_DIALOG_VISIBLE',
      'HFW_CONTROLS.GRID_COL_DIALOG_HIDDEN',
      'HFW_CONTROLS.GRID_COL_DIALOG_RESTOREBTN'
    ]).subscribe(values => this.onTraslateStrings(values)));
  }

  private onUpdateColumns(columnSelectionData: ColumnSelectionDialogResult): void {
    const selection = columnSelectionData.type;
    switch (selection) {
      case 'instant':
        const versionSect: string = this.currentColSettingsData.split('-')[0];
        const sortingSect: string = this.currentColSettingsData.split('-')[2];

        const columnCnfgData: Column[] = columnSelectionData.columns;
        let column: HeaderData;
        let colCnfgSect = '';

        for (const columnCnfgDataItem of columnCnfgData) {
          column = this.hdrData.find(col => col.id === columnCnfgDataItem.id);
          colCnfgSect += column.id + ',' + columnCnfgDataItem.visible + ',' + column.minColWidth + ';';
        }

        this.columnsSettingsDataStr = versionSect + '-' + colCnfgSect + '-' + sortingSect;
        this.columnsSettingsDataSubj.next(this.columnsSettingsDataStr);
        break;

      case 'ok':
        this.currentColSettingsData = this.columnsSettingsDataStr;
        this.storeColumnConfiguration(this.currentColSettingsData);
        this.traceService.info(TraceModules.eventGrid, 'ok');
        this.modalRef?.hide();
        break;

      case 'restoreDefault':
        const defConf = this.defaultConfig.map(x => Object.assign({}, x));
        columnSelectionData.updateColumns(defConf);
        this.columnsSettingsDataStr = this.VERSION_INFO + '-' + this._hldlFullColumnConfig + '-'
          + this.sortingCriteriaAsString(this._hldlColumnSortingSettings);
        this.columnsSettingsDataSubj.next(this.columnsSettingsDataStr);
        this.eventsSortReset();
        this.traceService.info(TraceModules.eventGrid, 'restoreDefault');
        break;

      default: // cancel
        this.columnsSettingsDataSubj.next(this.currentColSettingsData);
        this.manageColumnsSorting(this.currentColSettingsData.split('-')[2].split(';').slice(0, -1));
        this.traceService.info(TraceModules.eventGrid, 'Cancel');
        this.modalRef?.hide();
    }
  }

  private pushEventsToCommand(eventsToCommand: Event[], commandName: string): void {
    this.selectedEvents.forEach(item => {
      if (item.groupedEvents.length > 0) {
        item.groupedEvents.forEach(subsequentEvent => {
          if (this.hasCommand(subsequentEvent, commandName, true) && !eventsToCommand.find(e => e.id == subsequentEvent.id)) {
            eventsToCommand.push(subsequentEvent);
          }
        });
      } else if (this.hasCommand(item, commandName, true) && !eventsToCommand.find(e => e.id == item.id)) {
        eventsToCommand.push(item);
      }
    });

    if (eventsToCommand.length > 0) {
      this.executeCommand(commandName, eventsToCommand);
    }
    this.commandToSend = '';
  }

  private createColumnDialogDefaultSettings(columns: any): void {
    let userColumnString = '';
    let columnsLabels: string[] = [];

    if (this.isULC) {
      columns.forEach(label => {
        columnsLabels.push(label.name);
      });

      this.colLabelList.forEach(label => {
        if (!columnsLabels.includes(label)) {
          columnsLabels.push(label);
        }
      });
    } else {
      columnsLabels = this.colLabelList.slice(0);
    }

    columnsLabels.forEach(id => {
      const foundHdrData = this.hdrData.find(c => c.id == id);
      const foundColumn = columns.find(c => c.name == id);
      if (foundHdrData != null) {
        const visibility = foundColumn === undefined ? false : true;
        const colHeaderData = {
          id: foundHdrData.id,
          title: foundHdrData.label,
          visible: visibility,
          draggable: this.isDraggable(foundHdrData.id),
          disabled: this.isDisabled(foundHdrData.id)
        };
        this.defaultConfig.push(colHeaderData);
        const visibilityString = visibility ? 'true' : 'false';
        userColumnString += foundHdrData.id + ',' + visibilityString + ',' + foundHdrData.widthPercentage + ';';
      }
    });
    this._hldlFullColumnConfig = userColumnString;
  }

  private createColHeaderData(hdrData: HeaderData): any {
    const result = {
      id: hdrData.id,
      title: hdrData.label,
      visible: hdrData.columnVisible,
      draggable: this.isDraggable(hdrData.id),
      disabled: this.isDisabled(hdrData.id)
    };
    return result;
  }

  private createCurrentColumnDialogConfig(userSettings: string): Column[] {
    const colHeaderData: Column[] = [];
    const columnSettings = userSettings.split('-')[1].split(';').slice(0, -1);

    columnSettings.forEach(setting => {
      const id = setting.split(',')[0];
      const headerData = this.hdrData.find(h => h.id == id);
      if (headerData !== undefined) {
        headerData.columnVisible = (setting.split(',')[1] == 'true');
        colHeaderData.push(this.createColHeaderData(headerData));
      }
    });
    this.defaultConfig.forEach(col => {
      const id = col.id;
      const conf = colHeaderData.find(c => c.id === id);
      if (isNullOrUndefined(conf)) {
        colHeaderData.push(col);
      }
    });

    return colHeaderData;
  }

  private isDraggable(id: string): boolean {
    return this.isULC && (id === 'srcSource' || id === 'cause') ? false : id != 'eventIcon';
  }

  private isDisabled(id: string): boolean {
    return this.isULC && (id === 'srcSource' || id === 'cause') ? true : id == 'eventIcon';
  }

  private onQueryParamChange(eventId: string): void {
    if (eventId != null && eventId.length > 0) {
      if (this.initialMode === 'assisted') {
        this.eventService.eventCommandById(eventId, 'suspend', 'assistedtreatment');
        this.initialMode = '';
      }
      this.wasAnEventPreviouslySelected = true;
      if (this.hasAlreadyReceivedEvents && this.selectedEvents.length < 2) {
        this.selectEventFromQParam(eventId);
      } else {
        this.pendingQueryParamSel = eventId;
      }
    } else {
      if (this.wasAnEventPreviouslySelected) {
        this.isProcessingQParamChange = true;
        this.unselectAllEvents();
      }
    }
  }

  private selectEventFromQParam(qParamId: string): void {
    if (this.txtTable.length === 0) {
      this.pendingQueryParamSel = qParamId;
      this.unselectAllEvents();
      return;
    }

    const isContainer: boolean = qParamId.endsWith('*');

    const eventId: string = isContainer ? qParamId.slice(0, -1) : qParamId;
    const alreadySelected: Event = isContainer ? this.selectedEvents.find(e => eventId === e.id && e.groupedEvents.length > 0) :
      this.selectedEvents.find(e => eventId === e.id && e.groupedEvents.length === 0);

    if (isNullOrUndefined(alreadySelected)) {
      let selectedEventRow: GridData = qParamId.endsWith('*') ? this.txtTable.find(gridNode =>
        gridNode.customData.eventItem.id === eventId) :
        this.txtTable.find(gridNode =>
          gridNode.customData.eventItem.id === eventId && gridNode.customData.eventItem.groupedEvents.length === 0);

      if (selectedEventRow === undefined) { // from single event to container
        let subseqIndex = -1;
        let evItem: any;
        const containerIndex: number = this.txtTable.findIndex(gridNode => {
          evItem = gridNode.customData.eventItem;
          subseqIndex = evItem.groupedEvents.findIndex(currEv => currEv.id === eventId);
          if (subseqIndex > -1) {
            return true;
          }
        });
        if (containerIndex > -1) {
          selectedEventRow = this.txtTable[containerIndex];
        } else {
          return;
        }
        if (selectedEventRow.customData.eventItem.groupedEvents[0].id === qParamId) {
          this.selectedEvents.length = 0;
          this.selectedEvents.push(selectedEventRow.customData.eventItem);
          this.selectItemsInGridControl([selectedEventRow, null]);
          this.selectedEventsEv.emit([selectedEventRow.customData.eventItem.groupedEvents[0]]);
          return;
        }        
      }

      if (selectedEventRow?.customData != null) {
        this.selectPreviousEvent(selectedEventRow);
        const rowEvent: GridEvent = {
          eventType: enumEventType.EmitEvent,
          eventData: selectedEventRow.customData.eventItem
        };
        this.pendingQueryParamSel = null;
        this.gridEvents.emit(rowEvent);
      } else {
        this.traceService.debug(TraceModules.eventGrid, 'The event specified as query parameter cannot be found in the event list.' +
          ' Event selection will be skipped. EventId: ' + eventId);
      }
    } else {
      this.pendingQueryParamSel = null;
      this.alreadySelectExist(isContainer, eventId, qParamId);
    }
  }

  private alreadySelectExist(isContainer: boolean, eventId: string, qParamId: string): void {
    if (this.selectedEvents.length > 1) {
      const alreadySelectedEvent: Event = isContainer ? this.selectedEvents.find(e => eventId === e.id && e.groupedEvents.length > 0) :
        this.selectedEvents.find(e => eventId === e.id && e.groupedEvents.length === 0);

      if (alreadySelectedEvent !== null) {
        const selectedEventRow: GridData = qParamId.endsWith('*') ? this.txtTable.find(gridNode =>
          gridNode.customData.eventItem.id === eventId && gridNode.customData.eventItem.groupedEvents.length > 0) :
          this.txtTable.find(gridNode =>
            gridNode.customData.eventItem.id === eventId && gridNode.customData.eventItem.groupedEvents.length === 0);
        this.selectPreviousEvent(selectedEventRow);
      }
    }
  }

  private selectPreviousEvent(selectedEventRow: GridData): void {
    this.isProcessingQParamChange = true;
    this.selectedEvents.length = 0;

    this.suspendEvents();
    this.selectedEvents.push(selectedEventRow.customData.eventItem);
    this.selectItemsInGridControl([selectedEventRow]);
    this.onSelectEvent([selectedEventRow.customData.eventItem], false);
  }

  private checkPendingQueryParameters(): void {
    if (this.pendingQueryParamSel && this.hasAlreadyReceivedEvents && this.isGridInitialized && this.selectedEvents.length < 2) {
      this.selectEventFromQParam(this.pendingQueryParamSel);
    }
  }

  private manageSubscriptions(): void {
    this.subscriptionToEventFilter = this.eventSubscription.filter.subscribe(
      values => this.onEventFilterNotification(values),
      error => this.clearEvents(error.toString()));

    this.subscriptionToEvents = this.eventSubscription.events.subscribe(
      values => this.onEventsNotification(values),
      error => this.clearEvents(error.toString()));

    if (!this._eventFilter.empty) {
      this.unselectAllEvents();
    }

    this.subscriptions.push(this.eventSubscription.connectionState.subscribe((connState: string) => {
      if (connState === 'disconnected') {
        this.previouslySelectedEvents = this.selectedEvents.slice(0);
        this.clearEvents(connState);
      }
      this.traceService.info(TraceModules.eventGrid, 'Connection message: ' + connState);
    }));
  }

  private activeCnsLabelChanged(cnsLabel: CnsLabel): void {
    if (cnsLabel != null) {
      const firstTime: boolean = (this.currCnsLabel === null);
      this.currCnsLabel = cnsLabel;
      if (!firstTime) {
        this.RealignEventListData();
      }
    }
  }

  private activeViewChange(view: ViewInfo): void {
    if (view != null) {
      const firstTime: boolean = (this.currActiveView === null);
      this.currActiveView = view;
      if (!firstTime) {
        this.RealignEventListData();
      }
    }
  }

  private getEventSrcPath(eventObj: Event): string {
    let srcPath: string = eventObj.srcLocation;
    if (this.currCnsLabel != null) {
      switch (this.currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
        case CnsLabelEn.DescriptionAndAlias:
        case CnsLabelEn.DescriptionAndName:
          srcPath = eventObj.srcLocation;
          break;
        case CnsLabelEn.Name:
        case CnsLabelEn.NameAndAlias:
        case CnsLabelEn.NameAndDescription:
          srcPath = eventObj.srcDesignation;
          break;
        default:
          break;
      }
    }
    return srcPath;
  }

  private getEventSrcSource(eventObj: Event): string[] {
    let srcSource: string[] = [eventObj.srcDescriptor, eventObj.srcName];

    if (this.currCnsLabel != null) {
      switch (this.currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
          srcSource = [eventObj.srcDescriptor];
          break;
        case CnsLabelEn.DescriptionAndAlias:
          srcSource = [eventObj.srcDescriptor, eventObj.srcAlias];
          break;
        case CnsLabelEn.Name:
          srcSource = [eventObj.srcName];
          break;
        case CnsLabelEn.NameAndAlias:
          srcSource = [eventObj.srcName, eventObj.srcAlias];
          break;
        case CnsLabelEn.NameAndDescription:
          srcSource = [eventObj.srcName, eventObj.srcDescriptor];
          break;
        default:
          break;
      }
    }

    if (srcSource[0] != null && eventObj.sourceFltr === undefined) {
      eventObj.sourceFltr = srcSource[0].toUpperCase().replace('.', '').split(' ').join('');
    } else if (srcSource[0] === null) {
      this.traceService.error(TraceModules.eventGrid, 'Error in getEventSrcSource(): null filter value --> %s ', srcSource.toString());
    }

    return srcSource;
  }

  // #region header management
  private createHeaderConfiguration(): HdrItem[] {
    const hdrConfiguration: HdrItem[] = [];

    for (let i = 2; i < this.hdrData.length; i++) {
      hdrConfiguration.push(new HdrItem(this.hdrData[i].id, this.hdrData[i].columnVisible));
    }
    return hdrConfiguration;
  }

  private initializeGridHeader(): void {
    this.hdrData.length = 0;
    let newHeaderEntry: HeaderData = null;
    const setVisibility: boolean = this.visibleColumns.length > 0;

    newHeaderEntry = {
      id: 'eventIcon',
      label: this._ColumnNameCategory,
      columnType: enumColumnType.EventIcon,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('eventIcon') : true,
      minColWidth: 90,
      isFixedSize: true,
      widthPercentage: 10,
      allowSorting: false
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'cause',
      label: this._ColumnNameCause,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('cause') : true,
      minColWidth: this.compactMode ? 80 : this.isULC ? 400 : 230,
      isFixedSize: this.isULC,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'state',
      label: this._ColumnNameEventStatus,
      columnType: enumColumnType.State,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('state') : true,
      minColWidth: this.compactMode ? 55 : 130,
      isFixedSize: true,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'creationTime',
      label: this._ColumnNameDateTime,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('creationTime') : true,
      minColWidth: this.compactMode ? 90 : 160,
      isFixedSize: true,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'timer',
      label: this._ColumnNameTimer,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('timer') : false,
      minColWidth: 120,
      isFixedSize: true,
      widthPercentage: 10,
      allowSorting: false
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'srcSource',
      label: this._ColumnNameSource,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('srcSource') : true,
      minColWidth: this.isULC ? 250 : 100,
      isFixedSize: this.isULC ? true : false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'belongsTo',
      label: this._ColumnNameBelongsTo,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('belongsTo') : true,
      minColWidth: 100,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'informationalText',
      label: this._ColumnNameInformationalText,
      columnType: enumColumnType.ScrollableText,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('informationalText') : true,
      minColWidth: 100,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'srcPath',
      label: this._ColumnNamePath,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('srcPath') : false,
      minColWidth: this.isULC ? 300 : 100,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'commands',
      label: this._ColumnNameCommands,
      columnType: enumColumnType.Buttons,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('commands') : false,
      minColWidth: 180,
      isFixedSize: true,
      widthPercentage: 10,
      allowSorting: false
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'suggestedAction',
      label: this._ColumnNameSuggestedAction,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('suggestedAction') : false,
      minColWidth: 150,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: false
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'srcSystemName',
      label: this._ColumnNameSrcSystemName,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('srcSystemName') : false,
      minColWidth: 75,
      isFixedSize: false,
      widthPercentage: 5,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'messageText',
      label: this._ColumnNameMessageText,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('messageText') : false,
      minColWidth: 150,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'inProcessBy',
      label: this._ColumnNameInProcessBy,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('inProcessBy') : false,
      minColWidth: 150,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);

    newHeaderEntry = {
      id: 'srcAlias',
      label: this._ColumnNameSrcAlias,
      columnType: enumColumnType.Text,
      columnVisible: setVisibility === true ? this.visibleColumns.includes('srcAlias') : false,
      minColWidth: 150,
      isFixedSize: false,
      widthPercentage: 10,
      allowSorting: true
    };
    this.hdrData.push(newHeaderEntry);
  }
  // #endregion

  private onTraslateStrings(strings: object): void {
    this._NoEvents = strings['EVENTS.NO-EVENTS-FOUND'];
    this._EventStateUnprocessed = strings['EVENTS.EVENT-STATE-UNPROCESSED'];
    this._EventStateReadyToBeReset = strings['EVENTS.EVENT-STATE-READY-TO-BE-RESET'];
    this._EventStateReadyToBeClosed = strings['EVENTS.EVENT-STATE-READY-TO-BE-CLOSED'];
    this._EventStateWaitingForCommandExecution = strings['EVENTS.EVENT-STATE-WAITING-FOR-COMMAND-EXECUTION'];
    this._EventStateWaitingForCondition = strings['EVENTS.EVENT-STATE-WAITING-FOR-CONDITION'];
    this._EventStateAcked = strings['EVENTS.EVENT-STATE-ACKED'];
    this._EventStateClosed = strings['EVENTS.EVENT-STATE-CLOSED'];
    this._EventStateUnprocessedWithTimer = strings['EVENTS.EVENT-STATE-UNPROCESSED-WITH-TIMER'];
    this._EventStateReadyToBeResetWithTimer = strings['EVENTS.EVENT-STATE-READY-TO-BE-RESET-WITH-TIMER'];
    this._SourceStateActive = strings['EVENTS.SOURCE-STATE-ACTIVE'];
    this._SourceStateQuiet = strings['EVENTS.SOURCE-STATE-QUIET'];
    this._ColumnNameCause = strings['EVENTS.COLUMN-NAME-CAUSE'];
    this._ColumnNameCategory = strings['EVENTS.COLUMN-NAME-CATEGORY'];
    this._ColumnNameDescription = strings['EVENTS.COLUMN-NAME-DESCRIPTION'];
    this._ColumnNameName = strings['EVENTS.COLUMN-NAME-NAME'];
    this._ColumnNameDateTime = strings['EVENTS.COLUMN-NAME-DATE-TIME'];
    this._ColumnNameCommands = strings['EVENTS.COLUMN-NAME-COMMANDS'];
    this._ColumnNameEventStatus = strings['EVENTS.COLUMN-NAME-EVENT-STATUS'];
    this._ColumnNameSourceStatus = strings['EVENTS.COLUMN-NAME-SOURCE-STATUS'];
    this._ColumnNameInformationalText = strings['EVENTS.COLUMN-NAME-INFORMATIONAL-TEXT'];
    this._ColumnNameBelongsTo = strings['EVENTS.COLUMN-NAME-BELONGSTO'];
    this._ColumnNameTimer = strings['EVENTS.COLUMN-NAME-TIMER'];
    this._ColumnNamePath = strings['EVENTS.COLUMN-NAME-PATH'];
    this._ColumnNameSource = strings['EVENTS.COLUMN-NAME-SOURCE'];
    this._ColumnNameSuggestedAction = strings['EVENTS.COLUMN-NAME-SUGGESTED-ACTION'];
    this._ColumnNameSrcSystemName = strings['EVENTS.COLUMN-NAME-SYSTEM-NAME'];
    this._ColumnNameMessageText = strings['EVENTS.COLUMN-NAME-MESSAGE-TEXT'];
    this._ColumnNameInProcessBy = strings['EVENTS.COLUMN-NAME-IN-PROCESS-BY'];
    this._ColumnNameSrcAlias = strings['EVENTS.COLUMN-NAME-ALIAS'];

    this._SuggestedActionAcknowledge = strings['EVENTS.SUGGESTED-ACTION-ACKNOWLEDGE'];
    this._SuggestedActionClose = strings['EVENTS.SUGGESTED-ACTION-CLOSE'];
    this._SuggestedActionCompleteOP = strings['EVENTS.SUGGESTED-ACTION-COMPLETE-OP'];
    this._SuggestedActionReset = strings['EVENTS.SUGGESTED-ACTION-RESET'];
    this._SuggestedActionSilence = strings['EVENTS.SUGGESTED-ACTION-SILENCE'];
    this._SuggestedActionSuspend = strings['EVENTS.SUGGESTED-ACTION-SUSPEND'];
    this._SuggestedActionWaitForCondition = strings['EVENTS.SUGGESTED-ACTION-WAIT-FOR-CONDITION'];

    this.headerTitle = strings['EVENTS.COLUMN-CUSTOMIZE-TITLE'];
    this.bodyTitle = strings['EVENTS.COLUMN-CUSTOMIZE-DESCRIPTION'];

    this.submitBtnName = strings['HFW_CONTROLS.GRID_COL_DIALOG_YESBTN'];
    this.cancelBtnName = strings['HFW_CONTROLS.GRID_COL_DIALOG_CANCELBTN'];
    this.restoreToDefaultBtnName = strings['HFW_CONTROLS.GRID_COL_DIALOG_RESTOREBTN'];

    this.visibleLabelName = strings['HFW_CONTROLS.GRID_COL_DIALOG_VISIBLE'];
    this.hiddenLabelName = strings['HFW_CONTROLS.GRID_COL_DIALOG_HIDDEN'];

    this.userLang = this.translateService.getBrowserLang();

    this.subscriptions.push(this.cnsHelperService.activeView.subscribe((view => this.activeViewChange(view))));
    // this.initializeGridHeader();
    if (this.visibleColumns.length > 0) {
      this.processColumnSettings(null);
    } else {
      // TODO: only do if not in popover mode
      if (!this.IsInPopoverMode) {
        this.getEventSettings();
      }
      if (!this.hldlFullConfig) {
        this.subscribeToEvents();
      } else {
        this.getColumnSettings();
      }
      this.eventSubscription = this.eventService.createEventSubscription(this._eventFilter);
      this.manageSubscriptions();
    }
  }

  private subscribeToEvents(): void {
    if (this.eventSubscription && (this.subscriptionToEvents === undefined || this.subscriptionToEvents.closed === false)) {
      this.subscriptionToEvents = this.eventSubscription.events.subscribe(
        values => this.onEventsNotification(values),
        error => this.clearEvents(error.toString()));
    } else if (this.eventSubscription && this.subscriptionToEvents.closed) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
      if (this.subscriptionToEvents != null) {
        this.subscriptionToEvents.unsubscribe();
      }

      if (this.subscriptionToEventFilter != null) {
        this.subscriptionToEventFilter.unsubscribe();
      }

      this.eventSubscription = this.eventService.createEventSubscription(null);
      this.manageSubscriptions();
    }
  }

  private onEventFilterNotification(eventFilter: EventFilter): void {
    if (this._eventFilter && eventFilter && (this._eventFilter.hiddenEvents !== eventFilter.hiddenEvents)) {
      this.hiddenEventsFilterChanged = true;
    }
    this._eventFilter = eventFilter;

    if (this.subscriptionToEvents === undefined) {
      return;
    }

    let disableCommands = false;
    if (eventFilter) {

      if (!this._eventFilter.empty) {
        if (this.disableEventsCommandOnActiveFilter) {
          disableCommands = true;
        }
      }
    }
    this.eventCommandsDisabledSubj.next(disableCommands);
    this.eventCommandsDisabled.emit(disableCommands);

    if (!this._eventFilter.empty || this.hiddenEventsFilterChanged) {
      if (this._eventFilter.empty && this.hiddenEventsFilterChanged) {
        this.hiddenEventsFilterChanged = false;
      }
      this.RealignEventListData();
    }
  }

  // #region column settings mngmt
  private getColumnSettings(): void {
    this.settingsService.getSettings(this._settingsId).subscribe(
      val => this.processColumnSettings(val),
      err => this.onGetColumnSettingsError(err)
    );
  }

  private getEventSettings(): void {
    this.settingsService.getSettings(this._eventSettingsId).subscribe(
      val => this.onGetEventSettings(val),
      err => this.onGetEventSettingsError(err)
    );
  }

  private onGetEventSettings(settings?: any): void {
    let autoRemoveFilter = false;

    if (!isNullOrUndefined(settings) && settings !== '') {
      const eventSettings = JSON.parse(settings);
      autoRemoveFilter = eventSettings.autoRemoveFilter;
    } else {
      const hldlconfig = this.snapinConfig.getSnapInHldlConfig(this.defaultFullSnapInId, this.fullPaneId);
      autoRemoveFilter = hldlconfig?.autoRemoveFilterOnNewEvents;
    }
    this.eventService.setAutoRemoveEventFilter(autoRemoveFilter);
  }

  private onGetEventSettingsError(error?: any): void {
    this.traceService.error(TraceModules.eventGrid, 'Error while reading user-settings: %s', error.toString());
  }

  private processColumnSettings(settings?: string): void {
    if (isNullOrUndefined(settings) || (settings?.length > 0 && !settings.includes('version'))) {
      settings = this._hldlFullColumnConfig;
    }

    if (settings !== null) {
      settings = this.processColumnsSettingsVersioning(settings);
    }

    if (settings != null && settings.length > 0) {
      this.currentColSettingsData = settings;
      this.columnsSettingsDataSubj.next(settings);
      this.initHdrCnfg(settings);
    } else {
      this.initHdrCnfg();
      this.subscribeToEvents();
    }

    if (this.visibleColumns.length > 0) {
      settings = this.VERSION_INFO + '-';
      this.visibleColumns.forEach(col => {
        const hdrData = this.hdrData.find(h => h.id == col);
        if (hdrData !== undefined) {
          settings += col + ',true,' + hdrData.minColWidth + ';';
        }
      });

      settings += '-';

      this.columnsSettingsDataSubj.next(settings);

      this.eventSubscription = this.eventService.createEventSubscription(this._eventFilter);
      this.manageSubscriptions();
    }
  }

  private processColumnsSettingsVersioning(settings: string): string {
    const splittedSections: string[] = settings.split('-');

    if (settings.startsWith('version')) {
      switch (splittedSections[0]) {
        case 'version5.0': {
          return settings;
        }
        default: {
          break;
        }
      }
    } else {
      const splittedColumns: string[] = this._hldlFullColumnConfig.split('-')[0].split(';').slice(0, -1);
      let newSettings: string = this.VERSION_INFO + '-';

      let totWidth = 0;

      splittedColumns.forEach(col => {
        const colDataSplit: string[] = col.split(',');
        const column: HeaderData = this.hdrData.find(hdr => hdr.id === colDataSplit[0]);

        if (column === undefined) {
          this.traceService.error(TraceModules.eventGrid, 'Error in processColumnsSettingsVersioning(): column is undefined');
        } else if (column.columnVisible === true) {
          totWidth += +colDataSplit[2];
        }
      });

      splittedColumns.forEach(col => {
        const colDataSplit: string[] = col.split(',');

        if (this.hdrData.find(hdr => hdr.id === colDataSplit[0]).columnVisible) {
          colDataSplit[2] = (Math.round((+colDataSplit[2] / totWidth) * 100) / 100).toString();
        }
        newSettings += colDataSplit[0] + ',' + colDataSplit[1] + ',' + colDataSplit[2] + ';';
      });
      return newSettings + '-' + splittedSections[1];
    }
  }

  private onGetColumnSettingsError(error: any): void {
    this.traceService.error(TraceModules.eventGrid, 'onGetColumnSettingsError() error: %s', error.toString());
    this.initHdrCnfg();

    this.subscribeToEvents();
  }

  private initHdrCnfg(settings?: string): void {
    if (this.compactMode) {
      this.initializeGridHeader();
      return;
    }
    if (settings != undefined || this._hldlFullColumnConfig != undefined && this._hldlFullColumnConfig.length > 0) {
      try {
        const settingsString: string =
          (settings != undefined && !settings.includes('undefined') && !settings.includes('NaN')) ? settings : this._hldlFullColumnConfig;

        if (this.processColumnConfiguration(settingsString)) {
          return;
        }
      } catch (e) {
        this.traceService.error(TraceModules.eventGrid, 'unable to restore stored column settings: %s', e.toString());
      }
    }
    this.initializeGridHeader();
    this.storeColumnConfiguration();
  }

  private processColumnConfiguration(settings: string): boolean {
    if (isNullOrUndefined(settings) || settings === '') {
      return true;
    }
    const splittedSections: string[] = settings.split('-');
    let splittedColumns: string[] = splittedSections[0].split(';').slice(0, -1);
    let splittedSortingCriteria: string[] = splittedSections[1].split(';').slice(0, -1);

    if (settings.includes('version')) {
      splittedColumns = splittedSections[1].split(';').slice(0, -1);
      splittedSortingCriteria = splittedSections[2].split(';').slice(0, -1);
    }

    let index = -1;

    for (const colId of this.obsoleteColumns) {
      if ((index = splittedColumns.findIndex(columnSetting => (columnSetting.startsWith(colId)))) > -1) {
        splittedColumns.splice(index, 1);
      }

      if (colId !== categoryDescriptor && colId !== direction &&
        (index = splittedSortingCriteria.findIndex(columnSetting => (columnSetting.startsWith(colId)))) > -1) {
        splittedSortingCriteria.splice(index, 1);
      }
    }

    for (const splittedColumnsItem of splittedColumns) {
      const splittedColumnsFields: string[] = splittedColumnsItem.split(',');
      const headerData: HeaderData = this.hdrData.find(col => col.id === splittedColumnsFields[0]);

      if (headerData !== undefined) {
        headerData.widthPercentage = +splittedColumnsFields[2];
      }
    }
    this.manageColumnsSorting(splittedSortingCriteria);
    this.RealignEventListData();
    return this.manageColumnVisibilityCnfg(splittedColumns);
  }

  private manageColumnVisibilityCnfg(splittedColumns: string[]): boolean {
    if (splittedColumns.length > 0) {
      for (const splittedColumnsItem of splittedColumns) {
        const columnSplittedSettings: string[] = splittedColumnsItem.split(',');
        if (columnSplittedSettings.length < 3) {
          this.traceService.warn(TraceModules.eventGrid, 'Incomplete configuration of column: ' + columnSplittedSettings[0]);
          continue;
        }
        const columnIndex: number = this.hdrData.findIndex(col => col.id === columnSplittedSettings[0]);
        if (columnIndex >= 0) {
          this.hdrData[columnIndex].columnVisible = columnSplittedSettings[1].toUpperCase() === 'TRUE';
        } else {
          this.traceService.warn(TraceModules.eventGrid, 'Error in configuration of column: ' + columnSplittedSettings[0]);
        }
      }
      return true;
    }
    return false;
  }

  private manageColumnsSorting(splittedSortingCriteria: string[]): void {
    this.sortingCriteria.forEach(value => {
      value.sortingDir = SortingDirection.NONE;
    });

    this.hdrData.forEach(value => {
      value.sortingDirection = 0;
    });

    if (splittedSortingCriteria.length !== 0) {
      splittedSortingCriteria.reverse();
      splittedSortingCriteria.forEach(value => {
        const splittedEventSortingFields: string[] = value.split(',');
        this.onEventsSortBy(splittedEventSortingFields[0], +splittedEventSortingFields[2]);

        if (splittedEventSortingFields[0] !== categoryDescriptor && splittedEventSortingFields[0] !== direction) {
          const headerData: HeaderData = this.hdrData.find(col => col.id === splittedEventSortingFields[0]);
          headerData.sortingDirection = +splittedEventSortingFields[2] === SortingDirection.ASCENDING ? 2 : 1;
        }
      });
    }
    if (this.ulSorting) {
      this.sortingCriteria.unshift(new EventSortingField('processing', 1, SortingDirection.ASCENDING));
    }
  }

  private storeColumnConfiguration(userSettings: string = null): void {
    if (!this.storeColumnsSettings) {
      return;
    }

    let storedConfig = userSettings;

    if (userSettings == null) {
      storedConfig = this.VERSION_INFO + '-';

      // for (let i: number = 0; i < this.hdrData.length; i++) {
      for (const hdrDataItem of this.hdrData) {
        storedConfig = storedConfig + (hdrDataItem.id + ',' + hdrDataItem.columnVisible.toString() + ',' +
          hdrDataItem.minColWidth + ';');
      }

      storedConfig += '-' + this.sortingCriteriaAsString();
    }

    this.columnsSettingsCnfgUpdate.emit(storedConfig);
    this.settingsService.putSettings(this._settingsId, storedConfig).subscribe(
      val => this.onPutSettings(val),
      err => this.onPutSettingsError(err)
    );
    this.currentColSettingsData = storedConfig;
  }

  private onPutSettings(isSuccess: boolean): void {
    this.traceService.info(TraceModules.eventGrid, 'onPutSettings() : %s', isSuccess.valueOf.toString());
  }

  private onPutSettingsError(error: any): void {
    this.traceService.error(TraceModules.eventGrid, 'onPutSettingsError() error: %s', error.toString());
    this.currentColSettingsData = this.previousColSettingsData;
  }

  private sortingCriteriaAsString(columnsSortingSettings?: EventSortingField[]): string {
    let sortingCriteriaAsStr = '';
    const sortingCriteria: EventSortingField[] = columnsSortingSettings ?? this.sortingCriteria;

    sortingCriteria.forEach(value => {
      if (value.sortingDir !== SortingDirection.NONE) {
        sortingCriteriaAsStr += value.toString();
      }
    });

    return sortingCriteriaAsStr;
  }

  private getHldlConfigs(): void {
    if (this.hldlFullConfig === undefined) {
      this.hldlFullConfig = this.snapinConfig.getSnapInHldlConfig(this.defaultFullSnapInId, this.fullPaneId);
    }

    if (!this.hldlFullConfig) {
      const sorting_criteria = (this.snapinConfig.getSnapInHldlConfig(this.defaultFullSnapInId, this.defaultPaneId)).sorting_criteria;
      sorting_criteria.forEach(value => {
        const sortingDir: SortingDirection = (value.direction).toUpperCase() === 'ASCENDING' ? SortingDirection.ASCENDING : SortingDirection.DESCENDING;
        this.sortingCriteria.push(new EventSortingField(value.column_name, 0, sortingDir));
      });
      return;
    }

    if (this.hldlFullConfig?.disableGroupEvents) {
      this.disableGroupEvents = this.hldlFullConfig.disableGroupEvents;
    }

    if (this.hldlFullConfig?.disableEventsCommandOnActiveEventFilter) {
      this.disableEventsCommandOnActiveFilter = this.hldlFullConfig.disableEventsCommandOnActiveEventFilter;
    }

    if (this.hldlFullConfig?.disableMultiselection) {
      this.allowMultiselection = !this.hldlFullConfig.disableMultiselection;
    }

    if (this.hldlFullConfig?.disableSorting) {
      this.sortable = !this.hldlFullConfig.disableSorting;
    }

    if (this.authenticationService?.userProfile) {
      const userprofile = this.authenticationService.userProfile;

      this.isULC = userprofile === 'ulc';
      this.ulSorting = this.isULC || userprofile === 'ul' ? true : false;
    }

    if (this.hldlFullConfig?.isULInactivityTimeout) {
      this.isULInactivityTimeout = this.hldlFullConfig.isULInactivityTimeout;
    }
  }

  private formatHldlDefaultColumnSettings(): string {
    let hldlColumnSettings = '';

    if (!(this.hldlFullConfig?.columns && this.hldlFullConfig.sorting_criteria)) {
      if (this.fullSnapinID && this.fullSnapinID.snapInId == 'el') {
        this.traceService.error(TraceModules.eventGrid, 'The columns settings in the Event List section of the HLDL file is malformed');
      }
      return hldlColumnSettings;
    }

    if (this.hdrData.length === 0) {
      this.initializeGridHeader();
    }

    this.hldlFullConfig.columns.forEach(col => {
      const hdrData = this.hdrData.find(h => h.id === col.name);
      if (hdrData !== undefined) {
        hldlColumnSettings += col.name + ',true,' + hdrData.minColWidth + ';';
      }
    });

    this._hldlColumnSortingSettings.length = 0;
    this.hldlFullConfig.sorting_criteria.forEach(value => {
      const sortingDir: SortingDirection = (value.direction).toUpperCase() === 'ASCENDING' ? SortingDirection.ASCENDING : SortingDirection.DESCENDING;
      this._hldlColumnSortingSettings.push(new EventSortingField(value.column_name, 0, sortingDir));
    });

    return hldlColumnSettings + '-' + this.sortingCriteriaAsString(this._hldlColumnSortingSettings);
  }

  // #endregion

  private clearEvents(errorStr: string): void {
    this.txtTable.length = 0;
    this.unselectAllEvents();
    this.txtTableSubj.next(this.txtTable);
    this.traceService.error(TraceModules.eventGrid, 'Connection error: ' + errorStr);
  }

  private unselectAllEvents(): void {
    // Send the unselection command first
    this.suspendEvents(this.selectedEvents);
    this.selectedEvents.length = 0;

    if (!this.isProcessingQParamChange) {
      this.notifyNoSelection();
    } else {
      this.isProcessingQParamChange = false;
    }
    this.selectedGridRowsSubj.next(null);
    this.selectedEventsEv.emit(this.selectedEvents);
  }

  private updateTextTable(index: number, event: Event): void {
    if (index < 0 || index >= this.txtTable.length) {
      return;
    }

    const eventRow: GridData = this.txtTable[index];
    eventRow.customData.eventItem = event;

    const cellData: Map<string, any> = eventRow.cellData;

    cellData.set('eventId', String(event.eventId));
    cellData.set('creationTime', new Date(event.originalCreationTime).toLocaleString(this.userLang));
    cellData.set('messageText', event.messageTextToDisplay);
    cellData.set('cause', event.cause);
    cellData.set('commands', this.evaluateCmdBtnsVisibility(event));
    cellData.set('state', this.getStateData(event));
    cellData.set('srcState', this.getSourceStateString(event.srcState));
    cellData.set('inProcessBy', event.inProcessBy);
    cellData.set('suggestedAction', this.getSuggestedActionString(event.suggestedAction));
    cellData.set('recursation', this.evaluateGroupButtonVisibility(event));
    cellData.set('timer', event.timerUtc);
    cellData.set('informationalText', event.informationalText);
    cellData.set('srcAlias', event?.srcAlias);
  }

  private addNewEventToTable(event: Event): void {
    const startTime: number = this.performanceTrace(0, 'INSERT STARTED');

    const gridData: GridData = this.createGridData(event);
    this.performanceTrace(startTime, 'GRIDDATA OVER');

    this.insertElement(gridData);
    this.performanceTrace(startTime, 'INSERT OVER');
  }

  private selectItemsInGridControl(gridItems: GridData[]): void {
    this.selectedGridRowsSubj.next(gridItems);
  }

  private clearSelectedGroupedEvents(groupId: string): void {
    const selectedSubsequentIndexes: number[] = [];

    if (this.selectedEvents && this.selectedEvents.length > 0) {
      this.selectedEvents.forEach((element, index) => {
        if (element.groupId === groupId && element.groupedEvents.length === 0) {
          selectedSubsequentIndexes.push(index);
        }
      });

      if (selectedSubsequentIndexes.length > 0) {
        selectedSubsequentIndexes.reverse();
        selectedSubsequentIndexes.forEach(element => {
          this.selectedEvents.splice(element, 1);
        });

        this.onSelectEvent(this.selectedEvents, false);
      }
    }
  }

  private createGridData(eventItem: Event): GridData {
    const customData: any = {
      eventItem,
      srcSystemId: eventItem.srcSystemId,
      srcSystemName: eventItem.srcSystemName,
      srcPropertyId: eventItem.srcPropertyId
    };

    eventItem.srcSource = this.getEventSrcSource(eventItem);

    const rowData: GridData = {
      cellData: new Map([
        ['recursation', this.evaluateGroupButtonVisibility(eventItem)],
        ['messageText', eventItem.messageTextToDisplay],
        ['cause', eventItem.cause],
        ['creationTime', new Date(eventItem.originalCreationTime).toLocaleString(this.userLang)],
        ['commands', this.evaluateCmdBtnsVisibility(eventItem)],
        ['state', this.getStateData(eventItem)],
        ['srcState', this.getSourceStateString(eventItem.srcState)],
        [categoryDescriptor, eventItem.categoryDescriptor],
        ['srcPath', this.getEventSrcPath(eventItem)],
        ['srcSource', eventItem.srcSource],
        ['belongsTo', this.setBelongsToPropertyValue(eventItem)],
        ['timer', eventItem.timerUtc],
        ['informationalText', eventItem.informationalText],
        ['suggestedAction', this.getSuggestedActionString(eventItem.suggestedAction)],
        ['srcSystemName', eventItem.srcSystemName],
        ['inProcessBy', eventItem.inProcessBy],
        ['srcAlias', eventItem?.srcAlias]
      ]),
      customData,
      isDisabled: false
    };

    if (this.selectedEvents && this.selectedEvents.length > 0) {
      const itemIndex: number = this.selectedEvents.findIndex(event => event.id === eventItem.id &&
        event.groupedEvents.length === eventItem.groupedEvents.length);

      if (itemIndex !== -1 &&
        (this.newSelectedRows === null ||
          (this.newSelectedRows.findIndex(row => row.customData.eventItem.id === eventItem.id &&
            row.customData.eventItem.groupedEvents.length === eventItem.groupedEvents.length)) === -1 &&
          ((this.selectedEvents[itemIndex].container !== undefined) === (eventItem.container !== undefined)))) {
        this.newSelectedRows.push(rowData);
      }
    }

    return rowData;
  }

  private insertElement(gridData: GridData): number {
    let newIndex = 0;
    if (this.txtTable.length > 0) {
      try {
        newIndex = this.findNewPosition(gridData);
      } catch (error) {
        this.traceService.error(TraceModules.eventGrid, 'Error in findNewPosition: %s', error.toString());
      }
    }

    if (this.compactMode) {
      this.txtTable.push(gridData);
      return 0;
    }
    const indexInsert: number = this.addToTextTable(newIndex, gridData);
    return indexInsert;
  }

  private hasContainer(index: number): Event {
    const tableRow: GridData = this.txtTable[index];
    if (tableRow) {
      const gridEvent: Event = tableRow.customData.eventItem;
      return gridEvent.container;
    }
    return undefined;
  }

  private findEventIndexInTable(eventItem: Event): number {
    const eventIndexInTable: number = this.txtTable.findIndex(gridData =>
      gridData.customData.eventItem.id === eventItem.id &&
      !(gridData.customData.eventItem.groupedEvents.length !== 0 && eventItem.groupedEvents.length === 0));
    return eventIndexInTable;
  }

  private containerSize(container: Event): number {
    if (container.groupedEvents) {
      return container.groupedEvents.length;
    }
    return 0;
  }

  private findNewPosition(element: GridData, start: number = undefined, end: number = undefined): number {
    start = start || 0;
    if (end === undefined) {
      end = this.txtTable.length;
    }
    let pivot: number = Math.floor(start + (end - start) / 2);
    const pivotContainer: Event = this.hasContainer(pivot);
    let pivotContainerElements = 0;
    if (pivotContainer) {
      pivot = this.findEventIndexInTable(pivotContainer);
      pivotContainerElements = this.containerSize(pivotContainer);
    }
    const compare: number = this.compareGridData(this.txtTable[pivot], element);

    if (end - pivotContainerElements - start <= 1) {
      return compare > 0 ? pivot + pivotContainerElements + 1 : pivot;
    }

    if (compare === 0) {
      return pivot;
    } else if (compare > 0) {
      return this.findNewPosition(element, pivot + pivotContainerElements, end);
    } else {
      return this.findNewPosition(element, start, pivot);
    }
  }

  private addToTextTable(newIndex: number, element: GridData): number {
    if (this.traceService.isDebugEnabled(TraceModules.eventGrid)) {
      this.traceService.debug(TraceModules.eventGrid, '[ADDING] id %s at position %s',
        element.customData.eventItem.eventId, newIndex);
    }
    if (newIndex >= this.txtTable.length) {
      this.txtTable.push(element);
      return this.txtTable.length - 1;
    } else {
      this.txtTable.splice(newIndex, 0, element);
      return newIndex;
    }
  }

  private removeEventFromTable(index: number): GridData[] {
    if (index < 0 || index >= this.txtTable.length) {
      return;
    }

    return this.txtTable.splice(index, 1);
  }

  private getKey(event: Event): string {
    let key: string;
    if (!this.disableGroupEvents) {
      key = event.srcPropertyId.substr(0, event.srcPropertyId.lastIndexOf(':') + 1) + event.categoryId;
    } else {
      key = event.id;
    }
    return key;
  }

  private updateContainer(container: Event, eventRow: GridData, eventIndexInTable: number, addNewSubsequent: boolean = false): void {
    this.updateCommandsOnContainer(container);
    this.updatePropertiesOnContainer(container);
    this.updateTextTable(eventIndexInTable, container);

    if (this.sortingCriteria.length === 0) {
      return;
    }

    // const removedEvents: GridData[] = this.removeEventFromTable(eventIndexInTable);
    // if (removedEvents === undefined || removedEvents.length === 0) {
    //   return;
    // }

    // const indexIntable: number = this.insertElement(removedEvents[0]);

    // if (removedEvents.length > 1 && removedEvents[1] && removedEvents[1].customData) {
    //   const removedGroupedEvents: GridData[] = removedEvents.slice(1);
    //   const firstEvCustomData: any = removedEvents[0].customData;

    //   if (addNewSubsequent && firstEvCustomData.eventItem &&
    //     firstEvCustomData.eventItem.groupedEvents && firstEvCustomData.eventItem.groupedEvents[0]) {
    //     removedGroupedEvents.unshift(this.createGridData(firstEvCustomData.eventItem.groupedEvents[0]));
    //   }
    //   this.txtTable.splice(indexIntable + 1, 0, ...removedGroupedEvents);
    // }
  }

  private addToNewContainer(newSubsequent: Event, previousContainer: Event): Event {
    const newContainer: Event = new Event();
    newContainer.sourceFltr = previousContainer.sourceFltr;
    newContainer.srcSource = previousContainer.srcSource;
    newContainer.groupedEvents = previousContainer.groupedEvents.slice(0);
    if (newContainer.groupedEvents.length === 0) {
      newContainer.groupedEvents.unshift(previousContainer);
    }
    newContainer.groupedEvents.unshift(newSubsequent);
    newContainer.groupedEvents.sort(this.compareGroupedEvents.bind(this));
    newContainer.updateEvent(newContainer.groupedEvents[0]);
    newContainer.groupedEvents.forEach(subsequent => subsequent.container = newContainer);

    if (this.selectedEvents?.includes(previousContainer)) {
      this.selectedEvents.splice(this.selectedEvents.findIndex(item => (item === previousContainer)), 1, newContainer);
      // if a single element is selected and becomes a container || a container is selected
      // if what was selected is the container to be replaced
      // update the selection with the new container
      // keep selection on container
    }

    return newContainer;
  }

  private onEventsNotification(events: Event[]): void {
    // First event
    if (events.length > 0) {
      this.firstEvent.emit({
        event: events[0],
        isSingleEvent: this.txtTable.length === 1
      });
    }

    if (this.skipNotifications) {
      return;
    }

    let singleClosedEvent: Event;
    const start: number = this.performanceTrace(0, 'EventList.onEventsNotification:\n' +
      'Create/update event model for new/changed events: %s; Total no. of current events: %s',
    events.length.toString(), this.txtTable.length.toString());

    if (this.compactMode && events.length > 1) {
      events.sort(this.compareGroupedEvents.bind(this));
    }

    events.forEach(event => {
      const key: string = this.getKey(event);
      if (this.traceService.isDebugEnabled(TraceModules.eventGrid)) {
        this.traceService.debug(TraceModules.eventGrid, '[ONEVENT] received event %s with state %s',
          event.eventId, event.state);
      }
      const eventIndexInTable: number = this.disableGroupEvents ? this.txtTable.findIndex(gridData =>
        gridData.customData.eventItem.id === key) : this.txtTable.findIndex(gridData =>
        gridData.customData.eventItem.groupId === key);
      // const eventIndexInTable: number = this.txtTable.findIndex(gridData =>
      //   gridData.customData.eventItem.groupId === key);

      const isEventInTable: boolean = eventIndexInTable >= 0;
      this.setSrcDesignationAndLocation(event);
      this.setBelongsToPropertyValue(event);

      if (isEventInTable) { // event found in table
        const eventRow: GridData = this.txtTable[eventIndexInTable];
        const eventItem: Event = eventRow.customData.eventItem;
        eventItem.srcSource = this.getEventSrcSource(eventItem);

        if (eventItem.groupedEvents.length > 0 || event.id !== eventItem.id) { // found container or new group to form
          const subsequentIndex: number = eventItem.groupedEvents.findIndex(subseqEvent => subseqEvent.id === event.id);

          if (subsequentIndex < 0) { // new subsequent
            const newSubsequent: Event = new Event();

            newSubsequent.updateEvent(event, false, !this.disableGroupEvents); // this.eventService.manageGroupedEvents);
            if (newSubsequent.stateId === EventStates.Closed) {
              return;
            }
            const newContainer: Event = this.addToNewContainer(newSubsequent, eventItem);

            // previously selected subsequents need to be cleared when (due to a grid rebuild) its container is created (collapsed)
            if (newContainer.groupedEvents.length === 2) {
              this.clearSelectedGroupedEvents(newContainer.groupId);
            }

            this.updateContainer(newContainer, eventRow, eventIndexInTable, true);
            this.notifyUpdatedSelection([newContainer]);
            const selectedContainerInd: number = this.selectedEvents.findIndex(value => (value.id === newContainer.id));

            // management of a previously selected event container when, due to a grid rebuild, the selection needs to be restored
            if (this.selectedEvents && this.selectedEvents.length > 0 && selectedContainerInd >= 0) {
              const selectedEvent: GridData = this.txtTable.find(gridNode =>
                gridNode.customData.eventItem.id === this.selectedEvents[selectedContainerInd].id &&
                gridNode.customData.eventItem.groupedEvents.length === this.selectedEvents[selectedContainerInd].groupedEvents.length);

              this.newSelectedRows.push(selectedEvent);
            }
          } else {
            const subsequentItem: Event = eventItem.groupedEvents[subsequentIndex];

            subsequentItem.updateEvent(event, false);
            subsequentItem.srcSource = this.getEventSrcSource(subsequentItem);
            if (subsequentItem.stateId === EventStates.Closed) {
              this.newSelectedRows.length = 0;
              const container: Event = this.removeItemFromContainer(eventRow, eventIndexInTable, eventItem, subsequentIndex);
              this.notifyUpdatedSelection([container, subsequentItem]);
            } else {
              this.updateContainer(eventItem, eventRow, eventIndexInTable);
              this.notifyUpdatedSelection([eventItem, subsequentItem]);
            }
          }
        } else {
          if (this.skipEvent(events, event)) {
            return;
          }

          this.updateValues(event, eventItem, singleClosedEvent, eventRow, eventIndexInTable);
        }
      } else { // event not present - to be added
        this.addNewEvent(event);
      }
    });

    this.onEventNotificationsConclusion(events, start);
  }

  private updateValues(event: Event, eventItem: Event, singleClosedEvent: Event, eventRow: GridData, eventIndexInTable): void {
    eventItem.updateEvent(event, false);
    if (eventItem.stateId === EventStates.Closed) {
      if (!this.compactMode && this.selectedEvents.length > 0 && this.selectedEvents[0].id === event.id) { // )this.txtTable.length === 1) {
        singleClosedEvent = eventItem;
      }
      this.removeEventFromTable(eventIndexInTable);
    } else {
      this.updateTextTable(eventIndexInTable, eventItem);
    }
    this.notifyUpdatedSelection([eventItem]);
  }

  private addNewEvent(event: Event): void {
    if (event.stateId !== EventStates.Closed) {
      const eventItem: Event = new Event();
      eventItem.updateEvent(event, false, !this.disableGroupEvents);
      eventItem.srcSource = this.getEventSrcSource(eventItem);
      this.addNewEventToTable(eventItem);
    }

    // reload EL on new event using fs profile
    if (this.isULInactivityTimeout && this.firstReload) {
      this.ReloadEventList(true);
      this.firstReload = false;
    }
  }

  private onEventNotificationsConclusion(events: Event[], start: number): void {
    const newTxtTable: GridData[] = this.txtTable.slice(0);

    this.txtTableSubj.next(newTxtTable);
    this.isGridInitialized = true;

    if (this.lastMessage && this.selectedEvents.length < 2) {
      this.selectEventFromQParam(this.lastMessage);
    }

    if (this.previouslySelectedEvents.length > 0) {
      this.selectEventFromQParam(this.previouslySelectedEvents[0].id);
      this.previouslySelectedEvents.length = 0;
    }

    if (events.length > 0) {
      this.hasAlreadyReceivedEvents = true;
      this.checkPendingQueryParameters();
    }

    if (this.newSelectedRows != undefined && this.newSelectedRows.length > 0) {
      this.manageStandardSelectedEvents();
      this.selectItemsInGridControl(this.newSelectedRows);
      this.newSelectedRows.length = 0;
    }

    this.intervals.forEach(interval => {
      clearInterval(interval);
    });

    this.numEventsChanged.emit(this.txtTable.length);
    this.eventsChanged.emit(this.txtTable);

    this.performanceTrace(start, 'onEventsNotification(): create/update event model done');
    this.loading = false;
  }

  /*
  * Method to handle the following cases:
  * 1. OperatingProcedure with ForceManualClose --> The "Close" is followed by a "ReadyToBeClosed"
  * 2. OperatingProcedure with MandatoryStep    --> The "Close" is followed by a "WaitingOPCompletion"
  */
  private skipEvent(events: Event[], event: Event): boolean {
    if (event.oPId && event.oPId.length > 0 && event.state === 'Closed' &&
      events.find(ev => (ev.id === event.id && ev.srcState === 'Quiet' && (ev.state === 'ReadyToBeClosed' || ev.state === 'WaitingOPCompletion')))) {
      return true;
    }
    return false;
  }

  // return event timer in seconds
  private calculateTimer(event: Event): string {
    const expiration: number = Date.parse(event.timerUtc);
    const now: number = new Date().getTime() + this.serverOffset;
    const timer: number = Math.floor((expiration - now) / 1000);

    if (timer > 0) {
      const minutes: string = String(Math.floor(timer / 60)).padStart(2, '0');
      const seconds: string = String(timer % 60).padStart(2, '0');
      return ': ' + minutes + ':' + seconds;
    } else {
      return ': 00:00';
    }
  }

  private manageStandardSelectedEvents(): void {
    this.newSelectedRows.length = 0;

    this.selectedEvents.forEach(currEvent => {
      const txtTableIndex: number = this.txtTable.findIndex(gridData =>
        gridData.customData.eventItem.id === currEvent.id &&
        gridData.customData.eventItem.groupedEvents.length === currEvent.groupedEvents.length);
      this.newSelectedRows.push(this.txtTable[txtTableIndex]);
    });

  }

  private notifyUpdatedSelection(eventItems: Event[]): void {
    if (eventItems) {
      eventItems.forEach(eventItem => {
        const itemIndex: number = this.selectedEvents.findIndex(value => (value.id === eventItem.id));

        eventItem.srcSource = this.getEventSrcSource(eventItem);
        if ((this.selectedEvents && itemIndex !== -1) &&
          (this.selectedEvents[itemIndex].container !== undefined) === (eventItem.container !== undefined)) {

          if (eventItem.stateId === EventStates.Closed) {
            if (this.selectedEvents.length === 1) { // no selected events
              this.notifyUpdatedSelectionEv.emit(new EventUpdateNotificationMessage(this.selectedEvents, true));
              this.selectedEvents.length = 0;
            } else { // update and send updated selected events
              this.selectedEvents.splice(itemIndex, 1);
              this.notifyUpdatedSelectionEv.emit(new EventUpdateNotificationMessage(this.selectedEvents, true));
            }
          } else {
            this.selectedEvents[itemIndex] = eventItem;
            this.notifyUpdatedSelectionEv.emit(new EventUpdateNotificationMessage(this.selectedEvents, false));
          }
        }
        this.prevSelected = { ...eventItem };
      });
    }
  }

  private removeItemFromContainer(eventRow: GridData, eventInTableIndex: number, container: Event, subsequentIndex: number): Event {
    const containerClone: Event = new Event();
    const preserveSelection = false;
    containerClone.groupedEvents = container.groupedEvents.slice(0); // clone grouped events
    containerClone.groupedEvents.splice(subsequentIndex, 1);
    containerClone.updateEvent(containerClone.groupedEvents[0]);

    if (containerClone.groupedEvents.length === 1) { // If there is only another subsequent, close the group
      containerClone.groupedEvents.length = 0;
    } else {
      containerClone.groupedEvents.forEach(subsequent => subsequent.container = containerClone);
    }

    // update selectedEvent when the container is selected
    const itemIndex: number = this.selectedEvents.findIndex(value => (value.id === container.id));
    const itemIndexClone: number = this.selectedEvents.findIndex(value => (value.id === containerClone.id));

    if (this.selectedEvents &&
      // if the container is selected || the container with only two children (now a single event) is selected
      (((itemIndex !== -1) && this.selectedEvents[itemIndex].container === undefined) ||
        (itemIndexClone !== -1 && containerClone.id === this.selectedEvents[itemIndexClone].id) && containerClone.groupedEvents.length === 0)) {

      // preserve grid selection and update the list selection with the new container
      this.selectedEvents[itemIndex] = containerClone;
    }

    this.removeEventFromTable(eventInTableIndex);
    if (containerClone.groupedEvents.length > 0) {
      this.updateCommandsOnContainer(containerClone);
    }
    this.updatePropertiesOnContainer(containerClone);
    this.addNewEventToTable(containerClone);
    return containerClone;
  }

  private compareGroupedEvents(ev1: Event, ev2: Event): number {
    if (ev1.originalCreationTime > ev2.originalCreationTime ||
      (ev1.originalCreationTime.getTime() === ev2.originalCreationTime.getTime() && ev1.eventId > ev2.eventId)) {
      return -1;
    }
    return 1;
  }

  private updateCommandsOnContainer(container: Event): void {
    container.commands = [];

    container.groupedEvents.forEach(subsequent => {
      subsequent.commands.forEach(command => {
        const comInd: number = container.commands.findIndex(cmd => (command.Id === cmd.Id));
        if (comInd === -1) {
          container.commands.push(command);
        }
      });
    });

    // Remove Silence if Unsilence is present
    const sil = container.commands.findIndex(cmd => (cmd.Id === 'Silence'));
    const unsil = container.commands.findIndex(cmd => (cmd.Id === 'Unsilence'));

    if (sil !== -1 && unsil !== -1) {
      container.commands.splice(sil, 1);
    }
  }

  private updatePropertiesOnContainer(container: Event): void {
    let mostImportantSuggestedAction = 100;
    let mostImportantState = 100;
    let mostImportantSrcState = 100;

    container.groupedEvents.forEach(groupedEvent => {
      if (groupedEvent.suggestedActionId < mostImportantSuggestedAction) {
        mostImportantSuggestedAction = groupedEvent.suggestedActionId;
        container.suggestedAction = groupedEvent.suggestedAction;
        container.suggestedActionId = groupedEvent.suggestedActionId;
      }
      // Prioritize ids > 6 (states WithTimers)
      if (groupedEvent.stateId > 6) {
        groupedEvent.stateId -= 20;
      }
      if (groupedEvent.stateId < mostImportantState) {
        mostImportantState = groupedEvent.stateId;
        container.state = groupedEvent.state;
        if (groupedEvent.stateId < 0) {
          container.stateId = groupedEvent.stateId + 20;
        } else {
          container.stateId = groupedEvent.stateId;
        }
        container.statePriority = groupedEvent.statePriority;
      }
      if (groupedEvent.srcStateId < mostImportantSrcState) {
        mostImportantSrcState = groupedEvent.srcStateId;
        container.srcState = groupedEvent.srcState;
        container.srcStateId = groupedEvent.srcStateId;
      }
    });

    let inProcessByFromSubsequents = '';
    container.groupedEvents.forEach(e => {
      if (!isNullOrUndefined(e.inProcessBy) && !inProcessByFromSubsequents.includes(e.inProcessBy)) {
        inProcessByFromSubsequents += e.inProcessBy + ', ';
      }
    });

    if (inProcessByFromSubsequents !== ', ') {
      inProcessByFromSubsequents = inProcessByFromSubsequents.slice(0, inProcessByFromSubsequents.length - 2)
      container.inProcessBy = inProcessByFromSubsequents;
    }

    // Update container message text
    if (container.groupedEvents.length > 0) {
      container.messageTextToDisplay = container.groupedEvents[0].messageTextToDisplay;
    }

    // update container event cause
    if (container.groupedEvents.length > 0) {
      container.cause = container.groupedEvents[0].cause;
    }
  }

  // #region state, srcState and suggestedAction mngmt
  private getStateData(event: Event): string[] {
    const srcState: string = event.srcState;
    const evState: string = event.state;
    const stateData: string[] = [];

    switch (evState) {
      case 'Unprocessed': {
        stateData.push(this._EventStateUnprocessed);
        break;
      }
      case 'ReadyToBeReset': {
        stateData.push(this._EventStateReadyToBeReset);
        break;
      }
      case 'ReadyToBeClosed': {
        stateData.push(this._EventStateReadyToBeClosed);
        break;
      }
      case 'WaitingOPCompletion': {
        stateData.push(this._EventStateWaitingForCondition);
        break;
      }
      case 'Acked': {
        stateData.push(this._EventStateAcked);
        break;
      }
      case 'Closed': {
        stateData.push(this._EventStateClosed);
        break;
      }
      case 'UnprocessedWithTimer': {
        stateData.push(this._EventStateUnprocessedWithTimer + this.calculateTimer(event));
        break;
      }
      case 'ReadyToBeResetWithTimer': {
        stateData.push(this._EventStateReadyToBeResetWithTimer + this.calculateTimer(event));
        break;
      }
      default: {
        stateData.push('');
      }
    }
    return stateData.concat(this.getSourceStateIcons(srcState, evState));
  }

  private getSourceStateString(state: string): string {
    switch (state) {
      case 'Active': {
        return this._SourceStateActive;
      }
      case 'Quiet': {
        return this._SourceStateQuiet;
      }
      default: {
        return '';
      }
    }
  }

  private isEventAcked(eventState: string): boolean {
    switch (eventState) {
      case 'Unprocessed':
      case 'UnprocessedWithTimer': {
        return false;
      }
      default: {
        return true;
      }
    }
  }

  private isEventReadyToBeReset(eventState: string): boolean {
    switch (eventState) {
      case 'ReadyToBeReset':
      case 'ReadyToBeResetWithTimer': {
        return true;
      }
      default: {
        return false;
      }
    }
  }

  private getSourceStateIcons(sourceState: string, eventState: string): string[] {
    if (sourceState === 'Quiet') {
      if (this.isEventAcked(eventState)) {
        return ['element-alarm-background', 'element-ui-3', 'element-alarm-tick', 'element-ui-2'];
      } else {
        return ['element-alarm', 'element-ui-3'];
      }
    } else {
      if (this.isEventAcked(eventState)) {
        return ['element-alarm-background-filled', 'element-status-danger', 'element-alarm-tick', 'element-ui-2'];
      } else {
        return ['element-alarm-filled', 'element-status-danger'];
      }
    }
  }

  private setSrcDesignationAndLocation(eventItem: Event): void {
    const designations: EventDetailsList[] = eventItem.designationList;

    if (!this.IsInPopoverMode && this.currActiveView && designations !== null) {
      for (let i = 0; i < designations.length; i++) {
        if (this.currActiveView.containsDesignationString(designations[i].Descriptor)) {
          eventItem.srcLocation = eventItem.descriptionLocationsList[i].Descriptor;
          eventItem.srcDesignation = eventItem.designationList[i].Descriptor;
        }
      }
    }
  }

  private getSuggestedActionString(state: string): string {
    switch (state) {
      case 'Acknowledge': {
        return this._SuggestedActionAcknowledge;
      }
      case 'Close': {
        return this._SuggestedActionClose;
      }
      case 'CompleteOP': {
        return this._SuggestedActionCompleteOP;
      }
      case 'Reset': {
        return this._SuggestedActionReset;
      }
      case 'Silence': {
        return this._SuggestedActionSilence;
      }
      case 'Suspend': {
        return this._SuggestedActionSuspend;
      }
      case 'WaitforCondition': {
        return this._SuggestedActionWaitForCondition;
      }
      default: {
        return '';
      }
    }
  }

  private evaluateGroupButtonVisibility(event: Event): any {
    if (event.groupedEvents.length === 0) {
      return undefined;
    }
    const gbutton: any[] = [
      {
        id: event.id,
        text: event.groupedEvents.length.toString()
      }
    ];

    return gbutton;
  }

  private hasCommand(event: Event, command: string, ignoreCase: boolean = false): boolean {
    return event.commands.findIndex(cmd => {
      if (ignoreCase) {
        return cmd.Id.toLocaleLowerCase() === command.toLocaleLowerCase();
      }
      return cmd.Id === command;
    }
    ) !== -1;
  }

  private setBelongsToPropertyValue(ev: Event): string[] {
    const values: string[] = [];
    const desSplit: string[] = ev.srcDesignation?.split('.');
    const locSplit: string[] = ev.srcLocation?.split('.');
    const srcDescrSplit: string = this.escapeAllSpecialChars(ev.srcDescriptor?.split('.')[0]);
    const srcNameSplit: string = this.escapeAllSpecialChars(ev.srcName?.split('.')[0]);
    const isInLocation: boolean = locSplit?.includes(srcDescrSplit);
    const isInDesignation: boolean = desSplit?.includes(srcNameSplit);

    switch (this.currCnsLabel.cnsLabel) {
      case CnsLabelEn.Description:
      case CnsLabelEn.DescriptionAndAlias:
        values.push(isInLocation ?
          (locSplit?.length >= 2 ? locSplit[locSplit.length - 2] : (locSplit?.length === 1 ? locSplit[0] : '')) :
          locSplit[locSplit.length - 1]);
        break;
      case CnsLabelEn.DescriptionAndName:
        values.push(isInLocation ?
          (locSplit?.length >= 2 ? locSplit[locSplit.length - 2] : (locSplit?.length === 1 ? locSplit[0] : '')) :
          locSplit[locSplit.length - 1]);
        values.push(isInDesignation ?
          (desSplit?.length >= 2 ? desSplit[desSplit.length - 2] : (desSplit?.length === 1 ? desSplit[0] : '')) :
          desSplit[desSplit.length - 1]);
        break;
      case CnsLabelEn.Name:
      case CnsLabelEn.NameAndAlias:
        values.push(isInDesignation ?
          (desSplit?.length >= 2 ? desSplit[desSplit.length - 2] : (desSplit?.length === 1 ? desSplit[0] : '')) :
          desSplit[desSplit.length - 1]);
        break;
      case CnsLabelEn.NameAndDescription:
        values.push(isInDesignation ?
          (desSplit?.length >= 2 ? desSplit[desSplit.length - 2] : (desSplit?.length === 1 ? desSplit[0] : '')) :
          desSplit[desSplit.length - 1]);
        values.push(isInLocation ?
          (locSplit?.length >= 2 ? locSplit[locSplit.length - 2] : (locSplit?.length === 1 ? locSplit[0] : '')) :
          locSplit[locSplit.length - 1]);
        break;
      default:
        break;
    }
    ev.belongsToFltr = values[0];
    return values;
  }

  private escapeAllSpecialChars(text: string): string {
    return text?.replace(/[[]{}*?.,\\$]/g, '\\$&');
  }

  private evaluateCmdBtnsVisibility(sevent: Event): string[] {
    const cmdButtons: string[] = [];

    if (this.hasCommand(sevent, 'Silence') === true ||
      this.hasCommand(sevent, 'Unsilence') === true ||
      this.hasCommand(sevent, 'Close') === true) {
      cmdButtons.push(this.emptyButton, this.emptyButton);
    } else if (this.hasCommand(sevent, 'Reset') === true) {
      cmdButtons.push(this.emptyButton);
    }

    if (sevent.commands.findIndex(cmd => (cmd.Id === 'Ack')) !== -1) {
      cmdButtons[0] = this.ackButton;
    }
    if (this.hasCommand(sevent, 'Reset') === true) {
      if (this.hasCommand(sevent, 'Ack') === true || this.hasCommand(sevent, 'Silence') === true) {
        cmdButtons[1] = this.resetButton;
      } else {
        cmdButtons[1] = this.resetButtonPrimary;
      }
    }
    if (this.hasCommand(sevent, 'Silence') === true) {
      if (this.hasCommand(sevent, 'Ack') === true) {
        cmdButtons[2] = this.silenceButton;
      } else {
        cmdButtons[2] = this.silenceButtonPrimary;
      }
    } else if (this.hasCommand(sevent, 'Unsilence') === true) {
      cmdButtons[2] = this.unsilenceButton;
    }
    if (this.hasCommand(sevent, 'Close') === true) {
      if (this.hasCommand(sevent, 'Ack') === true ||
        this.hasCommand(sevent, 'Reset') === true) {
        cmdButtons[2] = this.closeButton;
      } else {
        cmdButtons[2] = this.closeButtonPrimary;
      }
      if (sevent.groupedEvents && sevent.groupedEvents.length > 0) {
        if (this.hasCommand(sevent, 'Silence') === true) {
          cmdButtons[2] = this.silenceButton;
        } else if (this.hasCommand(sevent, 'Unsilence') === true) {
          cmdButtons[2] = this.unsilenceButton;
        }
      }
    }
    return cmdButtons;
  }

  private RealignEventListData(): void {
    this.txtTable.length = 0;
    this.skipNotifications = false;
    this.eventService.realignEventsWithFilter(this.eventSubscription ? this.eventSubscription.id : 0);
  }

  // #region sorting functionality
  private compareGridData(data1: GridData, data2: GridData): number {
    if (data1 === undefined) {
      if (data2 === undefined) {
        return 0;
      }
      return -1;
    } else if (data2 === undefined) {
      return 1;
    }
    const event1: Event = data1.customData.eventItem;
    const event2: Event = data2.customData.eventItem;
    return this.compareEvents(event1, event2);
  }

  private compareEvents(ev1: Event, ev2: Event): number {
    if (this.sortingCriteria.length === 0) {
      return 0;
    }

    let ret = 0;

    for (const sorting of this.sortingCriteria) {
      if (sorting.sortingDir === SortingDirection.NONE) {
        continue;
      }
      switch (sorting.id) {
        case 'processing':
          if (ev1.stateId !== ev2.stateId) {
            if (ev1.stateId === EventStates.Unprocessed || ev1.stateId === EventStates.UnprocessedWithTimer) {
              ret = 1;
              break;
            }
            if (ev2.stateId === EventStates.Unprocessed || ev2.stateId === EventStates.UnprocessedWithTimer) {
              ret = -1;
              break;
            }
          }
          break;
        case 'state':
          if (ev1.statePriority > ev2.statePriority) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.statePriority < ev2.statePriority) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case categoryDescriptor:
          if (ev1.categoryId > ev2.categoryId) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.categoryId < ev2.categoryId) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'creationTime':
          if (ev1.originalCreationTime > ev2.originalCreationTime) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.originalCreationTime < ev2.originalCreationTime) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'messageText':
          if (ev1.messageTextToDisplay > ev2.messageTextToDisplay) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.messageTextToDisplay < ev2.messageTextToDisplay) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'cause':
          if (ev1.cause > ev2.cause) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.cause < ev2.cause) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'srcPath':
          if (this.getEventSrcPath(ev1) > this.getEventSrcPath(ev2)) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (this.getEventSrcPath(ev1) < this.getEventSrcPath(ev2)) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'srcSource':
          if (ev1.sourceFltr > ev2.sourceFltr) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.sourceFltr < ev2.sourceFltr) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'belongsTo':
          if (ev1.belongsToFltr > ev2.belongsToFltr) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.belongsToFltr < ev2.belongsToFltr) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'informationalText':
          if (ev1.informationalText > ev2.informationalText) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.informationalText < ev2.informationalText) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'suggestedAction':
          if (ev1.suggestedAction > ev2.suggestedAction) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.suggestedAction < ev2.suggestedAction) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'srcSystemName':
          if (ev1.srcSystemName > ev2.srcSystemName) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if (ev1.srcSystemName < ev2.srcSystemName) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          break;
        case 'inProcessBy':
          if ((ev1.inProcessBy ?? "") > (ev2.inProcessBy ?? "")) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if ((ev1.inProcessBy ?? "") < (ev2.inProcessBy ?? "")) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          if (isNullOrUndefined(ev1.inProcessBy) !== isNullOrUndefined(ev2.inProcessBy)) {
            if (isNullOrUndefined(ev1.inProcessBy)) {
              ret = sorting.sortingDir === SortingDirection.DESCENDING ? -1 : 1;
            } else {
              ret = sorting.sortingDir === SortingDirection.DESCENDING ? 1 : -1;
            }
          }
          break;
        case 'srcAlias':
          if ((ev1.srcAlias ?? "") > (ev2.srcAlias ?? "")) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
            break;
          }
          if ((ev1.srcAlias ?? "") < (ev2.srcAlias ?? "")) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
            break;
          }
          if (isNullOrUndefined(ev1.srcAlias) !== isNullOrUndefined(ev2.srcAlias)) {
            if (isNullOrUndefined(ev1.srcAlias)) {
              ret = sorting.sortingDir === SortingDirection.DESCENDING ? -1 : 1;
            } else {
              ret = sorting.sortingDir === SortingDirection.DESCENDING ? 1 : -1;
            }
          }
          break;
        case direction:
          if (ev1.direction > ev2.direction) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? 1 : -1;
          } else if (ev1.direction < ev2.direction) {
            ret = (sorting.sortingDir === SortingDirection.DESCENDING) ? -1 : 1;
          }
          break;
        default: {
          break;
        }
      }
      if (ret !== 0) {
        break;
      }
    }
    if (ret === 0 && ev1.eventId !== ev2.eventId) {
      ret = ev1.eventId > ev2.eventId ? 1 : -1;
    }
    return ret;
  }

  private eventsSortReset(): void {
    this.sortingCriteria.length = 0;

    this.buildSortingCriteriaArray();
    if (this._hldlColumnSortingSettings.length > 0) {
      const arrayLen: number = this._hldlColumnSortingSettings.length;
      let currEventSortingField: EventSortingField;
      let index = 0;

      for (let i: number = arrayLen - 1; i >= 0; i--) {
        currEventSortingField = this._hldlColumnSortingSettings[i];
        index = this.sortingCriteria.findIndex(value => (value.id === this._hldlColumnSortingSettings[i].id));

        if (index > 0) {
          const sortingCriterium: EventSortingField = this.sortingCriteria[index];

          this.sortingCriteria.splice(index, 1);
          sortingCriterium.sortingDir = currEventSortingField.sortingDir;
          this.sortingCriteria.unshift(sortingCriterium);
        } else if (index === 0) {
          this.sortingCriteria[0].sortingDir = currEventSortingField.sortingDir;
        }
      }
    }
  }

  private buildSortingCriteriaArray(): void {
    this.sortingCriteria.push(new EventSortingField('state', 0));
    this.sortingCriteria.push(new EventSortingField(categoryDescriptor, 0));
    this.sortingCriteria.push(new EventSortingField('creationTime', 0));
    this.sortingCriteria.push(new EventSortingField('messageText', 0));
    this.sortingCriteria.push(new EventSortingField('cause', 0));
    this.sortingCriteria.push(new EventSortingField('srcPath', 0));
    this.sortingCriteria.push(new EventSortingField('srcSource', 0));
    this.sortingCriteria.push(new EventSortingField('belongsTo', 0));
    this.sortingCriteria.push(new EventSortingField('informationalText', 0));
    this.sortingCriteria.push(new EventSortingField('suggestedAction', 0));
    this.sortingCriteria.push(new EventSortingField('srcSystemName', 0));
    this.sortingCriteria.push(new EventSortingField('inProcessBy', 0));
    this.sortingCriteria.push(new EventSortingField('srcAlias', 0));
  }
  // #endregion

  private suspendEvents(events?: Event[]): void {
    const eventsToCommand: Event[] = [];
    let events2Suspend: Event[] = this.selectedEvents.slice();

    if (isNullOrUndefined(events)) {
      return;
    }

    events2Suspend = events.slice();

    if (isNullOrUndefined(events2Suspend)) {
      return;
    }

    events2Suspend.forEach(element => {
      if (element.groupedEvents.length > 0) {
        element.groupedEvents.forEach(subseq => {
          eventsToCommand.push(subseq);
        });
      } else {
        eventsToCommand.push(element);
      }
    });

    if (eventsToCommand.length > 0) {
      this.executeCommand('suspend', eventsToCommand);
    }
  }

  private selectEvents(events: Event[], unselectDueAnIncomingSelection: boolean): void {
    const eventsToCommand: Event[] = [];

    if (isNullOrUndefined(events)) {
      return;
    }

    if (events.length === 0 && !unselectDueAnIncomingSelection) {
      this.notifyNoSelection();
      return;
    }

    events.forEach(element => {
      eventsToCommand.push(element);
    });

    if (eventsToCommand.length > 0) {
      this.executeCommand('select', eventsToCommand);
    }
  }

  private notifyNoSelection(): void {
    const rowEvent: GridEvent = {
      eventType: enumEventType.EmitEvent,
      eventData: null
    };
    this.gridEvents.emit(rowEvent);
  }

  private performanceTrace(startTime?: number, message?: string, ...optionalParams: string[]): number {
    let retVal: number;

    if (this.traceService.isDebugEnabled(TraceModules.eventGridPerformance)) {
      if (startTime > 0) {
        retVal = performance.now() - startTime;
        this.traceService.debug(TraceModules.eventGridPerformance, message + ' - time spent %s [ms]', optionalParams, retVal);
      } else {
        this.traceService.debug(TraceModules.eventGridPerformance, message, optionalParams);
        retVal = performance.now();
      }
    }
    return retVal;
  }

  private ReloadEventList(doRefresh: boolean): void {
    if (doRefresh) {
      this.isEventTableValid = false;
      this.cd.detectChanges();
      this.isEventTableValid = true;
    }
  }
}
