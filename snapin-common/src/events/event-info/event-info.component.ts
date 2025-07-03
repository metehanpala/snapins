/* eslint-disable @typescript-eslint/naming-convention */ // Disabled it because ValidationInput data is structured with uppercase
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { DEFAULT_MODE_ID, FullQParamId, FullSnapInId, IHfwMessage, ISnapInConfig, MessageParameters, MobileNavigationService } from '@gms-flex/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { ConfirmationDialogResult, MenuItem, ResizeObserverService, SiActionDialogService, SiToastNotificationService } from '@simpl/element-ng';
import {
  ApplicationRight,
  AppRightsService,
  AuthenticationService,
  BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn, CommandInput, Event, EventColors, EventCommand, EventDetailsList, EventFilter,
  EventNotesProxyService, EventService, EventStates, EventSubscription,
  GmsMessageData,
  MultiMonitorServiceBase,
  ObjectMessageType,
  Operation,
  SearchOption, SiIconMapperService, SystemBrowserServiceBase, TablesEx, ValidationInput,
  ViewInfo,
  ViewType
} from '@gms-flex/services';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { TraceModules } from '../../shared/trace-modules';
import { EventNote } from './data.model';
import _ from 'lodash';
import { catchError, take } from 'rxjs/operators';
import { EventsValidationHelperService } from '../services/events-validation-helper.service';
import { ValidationDialogService } from '../../validation-dialog/services/validation-dialog.service';

/**
 * The controller/viewmodel of the Event Info component
 */

@Component({
  selector: 'gms-event-info',
  templateUrl: './event-info.component.html',
  styleUrl: './event-info.component.scss',
  standalone: false
})

/**
 * Event info component should receive selected events in order to display their info
 *
 * @params
 *  @Input() public eventsSelected: Observable<Event[]>;
 *  @Input() public IsInInvestigativeMode: boolean = false;
 *  @Input() public IsInPopoverMode: boolean = false;
 *  @Input() public LocationInfoVisible: boolean = true;
 *  @Input() public WhenSectionVisible: boolean = true;
 *  @Input() public WhereSectionVisible: boolean = true;
 *  @Input() public DetailsSectionVisible: boolean = true;
 *  @Input() public NotesSectionVisible: boolean = true;
 *  @Output() public goToSystem: EventEmitter<any> = new EventEmitter<any>();
 *  @Output() public goToInvestigativeTreatment: EventEmitter<any> = new EventEmitter<any>();
 *  @Output() public exitFromInvestigativeTreatment: EventEmitter<any> = new EventEmitter<Event>();
 *
 **/

export class EventInfoComponent implements OnInit, OnDestroy {

  private static readonly systemManagerFrameId: string = 'system-manager';

  @Input() public EventsSelected: Observable<Event[]>;
  @Input() public IsInInvestigativeMode = false;
  @Input() public IsInAssistedMode = false;
  @Input() public IsInPopoverMode = false;
  @Input() public LocationInfoVisible = true;
  @Input() public WhenSectionVisible = true;
  @Input() public WhereSectionVisible = true;
  @Input() public DetailsSectionVisible = true;
  @Input() public NotesSectionVisible = true;
  @Input() public SnapInId: FullSnapInId = null;
  @Input() public EventCommandsDisabled: Observable<boolean>;
  @Output() public readonly goToSystem: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly goToInvestigativeTreatment: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly exitFromInvestigativeTreatment: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly goToAssistedTreatment: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly exitFromAssistedTreatment: EventEmitter<any> = new EventEmitter<Event>();

  public readonly traceModule = 'gmsSnapins_eventInfoComponent: ';

  public eventSelected: string;
  public isMobileView = false;
  public displaySnapinControls = false;
  public displayAssistedCommand = false;
  public accordionNotesOpen = false;
  public silUnsilCommand = 0;
  public selectedEvent: Event;
  public selectedEvents: Event[] = [];
  public selectedBrowserObjects: BrowserObject[] = [];
  public useCause = false;
  public selectedEventDisciplineIcon = '';
  public ackCommandEnabled = false;
  public resCommandEnabled = false;
  public closeCommandEnabled = false;
  public goToSystemCommandEnabled = false;
  public eventFilter: EventFilter;
  public commandsDisabled = false;

  public resCommandPrimary = false;
  public closeCommandPrimary = false;
  public silUnsilCommandPrimary = false;

  public showMsgText = true;
  public showInProcessBy = true;
  public showDesignation = true;
  public showCategory = true;
  public showDiscipline = true;
  public showSystemId = true;
  public showSystemName = true;

  public newEventNote = '';
  public isNewNoteOpen = false;

  public eventNotes: EventNote[] = [];
  public isNewNoteAddMessageVisible = false;
  public isMultipleEventsSelected = false;
  public isLoadingNotes = false;
  public eventGridVisibleColumns = ['state', 'cause', 'creationTime'];

  public sourceStateQuiet = ''; // "Quiet";
  public sourceStateActive = ''; // "Active";

  public eventStateUnprocessed = ''; // "Unprocessed";
  public eventStateReadyToBeReset = ''; // "Ready to be Reset";
  public eventStateReadyToBeClosed = ''; // "Ready to be Closed";
  public eventStateWaitingForCondition = ''; // "Waiting for Condition";
  public eventStateWaitingForCommandExecution = ''; // "WaitingForCommandExecution"
  public eventStateAcked = ''; // "Acked";
  public eventStateClosed = ''; // "Closed";
  public eventStateUnprocessedWithTimer = ''; // "Unprocessed with timer";
  public eventStateReadyToBeResetWithTimer = ''; // "Ready to be Reset with timer";

  public noEventNotesForMultiselection = ''; // "Please select a single event for showing the available notes"
  public newEventNoteAdded = ''; // "New note added, in a few seconds you can view it by pressing the refresh button"
  public noEventNotes = ''; // "No event notes available",
  public eventNotesLoading = ''; // "Loading ..."
  public newMultipleEventsNoteAdded = ''; // "New note added to all the selected events, in a few seconds ..."

  public noEventSelected = '';						// "No event selected"
  public ackCommandText = ''; // "Acknowledge"
  public resetCommandText = ''; // "Reset",
  public silenceCommandText = ''; // "Silence",
  public unsilenceCommandText = ''; // "Unsilence",
  public closeCommandText = ''; // "Close",
  public investigativeSystemCommandText = ''; // "Investigate system",
  public goToSystemCommandText = ''; // "Go to system",
  public eventCauseTitle = ''; // "Event Cause",
  public eventInterventionTextTitle = ''; // "Intervention Text",
  public eventSrcStateTitle = ''; // "Source State",
  public eventStateTitle = ''; // "Event State",
  public eventSrcSourceTitle = ''; // "Source Property",
  public eventSrcLocationTitle = ''; // "Location",
  public eventTimeTitle = ''; // "Time",
  public eventDateTitle = ''; // "Date",
  public eventIdTitle = ''; // "Event ID",
  public eventDisciplineTitle = ''; // "Discipline",
  public eventInProcessByTitle = ''; // "In Process By",
  public eventMessageTextTitle = ''; // "Message Text",
  public eventCategoryTitle = ''; // "Category",
  public eventSrcDesignationTitle = ''; // "Designation",
  public eventSrcSystemIdTitle = ''; // "System ID",
  public eventSrcSystemNameTitle = ''; // "System Name",
  public investigateSystem = ''; // "Investigate system"
  public assistedTreatment = ''; // "AssistedTreatment"
  public leave = ''; // "Leave"
  public detailsAccordion = ''; // "Details"
  public eventNotesAccordion = '';					// "Event Notes"
  public multipleSelection = ''; // "Multiple selection"
  public eventNotesRefresh = '';						// "Refresh"
  public eventNotesNew = ''; // "New Note"
  public showPath = ''; // "Show path"
  public eventGridTitle = ''; // "Events"
  public showMore = ''; // "Show more"
  public showLess = ''; // "Show less"
  public seeMore = ''; // "See more"
  public seeLess = ''; // "See less"
  public eventsSelected = ''; // "Events Selected"
  public atFailDialogTitle = '';
  public atFailDialogMessage = '';
  public atFailDialogConfirm = '';
  public atFailDialogCancel = '';

  public currCnsLabel: CnsLabel = null;
  public currActiveView: ViewInfo = null;
  public srcNameDescription: string[] = [];
  public srcPath = '';

  public whereIcon = '';
  public isContainerEvent = false;
  public srcObjectName = '';
  public srcObjectDescriptor = '';
  public srcObjectAlias = '';
  public isObjInfoOpen = false;
  public containerClass = '';
  @ViewChild('infoContainer', { static: true }) public infoContainer: ElementRef;
  public newNoteContentActions: MenuItem[] = [];

  public containerWidth: number;
  public eventsRowHeight = 50;
  public eventsGridHeight = 130;
  public eventsGridScrollable = false;
  public eventsGridShowText: string = this.showMore;
  public isSubsequentEventSelected = false;
  public showPathAction = { title: this.showPath, icon: 'element-info', action: (): void => { } };
  public navigateToAction = { title: this.eventSrcLocationTitle, icon: 'element-send-to', action: (): void => this.goToSystemCommand() };
  public isSendBtnDisabled = false;
  public showMoreButton = true;
  public containerActions: any;
  public commandIcons: Map<string, string>;
  public commandTexts: Map<string, string>;

  private interval: any;

  private readonly translateService: TranslateService;
  private subscriptions: Subscription[] = [];
  private eventSubscription: EventSubscription = null;
  private isEventSelected = false;
  private readonly multipleStringValue = '*';
  private userLang: string;
  private serverOffset = 0;
  private containerEventSelected: Event = null;
  private currentMode = '';
  private assistedTreatmentRights = true;
  private appRightsAT: ApplicationRight;
  private readonly ATRightsId = 74;
  private readonly ATShowRights = 2368;
  private readonly disableCommands = false;
  private subsequentEventSelected: Event;
  private initialMode;

  /**
   * Constructor
   * @param traceService The trace service.
   * @param activatedRoute
   */
  public constructor(
    private readonly validationDialogService: ValidationDialogService,
    private readonly eventValidationService: EventsValidationHelperService,
    private readonly traceService: TraceService,
    private readonly eventCommonService: EventsCommonServiceBase,
    private readonly siModal: SiActionDialogService,
    private readonly appContextService: AppContextService,
    private readonly eventService: EventService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cd: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly cnsHelperService: CnsHelperService,
    private readonly eventNotesService: EventNotesProxyService,
    private readonly iconMapperService: SiIconMapperService,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly resizeObserver: ResizeObserverService,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    private readonly messageBroker: IHfwMessage,
    private readonly snapinConfig: ISnapInConfig,
    private readonly authenticationService: AuthenticationService,
    private readonly appRightsService: AppRightsService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService
  ) {
    this.translateService = eventCommonService.commonTranslateService;
  }
  public readonly trackByIndex = (index: number): number => index;
  public ngOnInit(): void {
    this.subscriptions.push(this.resizeObserver.observe(this.infoContainer.nativeElement, 100, true, true).subscribe(() => this.onContainerResize()));

    this.subscriptions.push(
      this.getATAppRights().subscribe(res => {
        this.assistedTreatmentRights = res;
      })
    );

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.eventGrid, 'use  user Culture');
        },
        (err: any) => {
          this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
            if (defaultCulture != null) {
              this.translateService.setDefaultLang(defaultCulture);
            } else {
              this.traceService.warn(TraceModules.eventGrid, 'No default Culture for appContextService');
              this.translateService.setDefaultLang(this.translateService.getBrowserLang());
            }
          }));
        });
      } else {
        this.traceService.warn(TraceModules.eventGrid, 'No user Culture for appContextService');
      }
    }));

    this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(cnsLabel => {
      this.currCnsLabel = cnsLabel;
      if (this.selectedEvent) {
        this.mergeEvents(this.selectedEvents);
      }
    }));

    this.subscriptions.push(this.cnsHelperService.activeView.subscribe(view => {
      this.currActiveView = view;
      if (this.selectedEvent) {
        this.mergeEvents(this.selectedEvents);
      }
    }));

    this.isMobileView = this.mobileNavigationService.mobileOnlyVisibilityLast;

    // Subscribe to automatic assisted treatment
    this.subscriptions.push(this.eventCommonService.autoAssistedEvents.subscribe((res: Event[]) => {
      if (res && res.length > 0) {
        this.selectedEvent = res[0];
        this.selectedEvents = res;
        this.IsInAssistedMode = true;
        this.showMoreButton = false;
        this.goToAssistedTreatment.emit(this.selectedEvent);
      } else {
        this.IsInAssistedMode = false;
        this.showMoreButton = true;
        if (!isNullOrUndefined(this.selectedEvent) && this.selectedEvent.stateId !== EventStates.Closed) {
          this.exitFromAssistedTreatment.emit(this.selectedEvent);
          this.executeCommand([this.selectedEvent], 'select', null);
        }
        this.selectedEvent = undefined;
        this.selectedEvents = [];
      }
    }));

    // Subscribe to the screen size change event to configure mobile view
    this.subscriptions.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      this.isMobileView = isVisible;
    }));

    if (this.EventCommandsDisabled != undefined) {
      this.subscriptions.push(this.EventCommandsDisabled.subscribe(value => {
        this.commandsDisabled = value;
      }));
    }

    this.subscriptions.push(this.translateService.get([
      'EVENTS.SOURCE-STATE-ACTIVE',
      'EVENTS.SOURCE-STATE-QUIET',
      'EVENTS.EVENT-STATE-UNPROCESSED',
      'EVENTS.EVENT-STATE-READY-TO-BE-RESET',
      'EVENTS.EVENT-STATE-READY-TO-BE-CLOSED',
      'EVENTS.EVENT-STATE-WAITING-FOR-COMMAND-EXECUTION',
      'EVENTS.EVENT-STATE-WAITING-FOR-CONDITION',
      'EVENTS.EVENT-STATE-ACKED',
      'EVENTS.EVENT-STATE-CLOSED',
      'EVENTS.EVENT-STATE-UNPROCESSED-WITH-TIMER',
      'EVENTS.EVENT-STATE-READY-TO-BE-RESET-WITH-TIMER',
      'EVENTS.EVENT-NOTES-FOR-MULTISELECTION',
      'EVENTS.EVENT-NOTES-ADDED',
      'EVENTS.EVENT-NOTES-LOADING',
      'EVENTS.NO-EVENT-NOTES-AVAILABLE',
      'EVENTS.MULTIPLE-EVENTS-NOTES-ADDED',
      'EVENTS.NO-EVENT-SELECTED',
      'EVENTS.ACK-COMMAND-TEXT',
      'EVENTS.RESET-COMMAND-TEXT',
      'EVENTS.SILENCE-COMMAND-TEXT',
      'EVENTS.UNSILENCE-COMMAND-TEXT',
      'EVENTS.CLOSE-COMMAND-TEXT',
      'EVENTS.GO-TO-SYSTEM-COMMAND-TEXT',
      'EVENTS.EVENT-CAUSE-TITLE',
      'EVENTS.EVENT-INTERVENTION-TEXT-TITLE',
      'EVENTS.EVENT-SRC-STATE-TITLE',
      'EVENTS.EVENT-STATE-TITLE',
      'EVENTS.EVENT-SRC-SOURCE-TITLE',
      'EVENTS.EVENT-SRC-LOCATION-TITLE',
      'EVENTS.EVENT-TIME-TITLE',
      'EVENTS.EVENT-DATE-TITLE',
      'EVENTS.EVENT-ID-TITLE',
      'EVENTS.EVENT-DISCIPLINE-TITLE',
      'EVENTS.EVENT-IN-PROCESS-BY-TITLE',
      'EVENTS.EVENT-MESSAGE-TEXT-TITLE',
      'EVENTS.EVENT-CATEGORY-TITLE',
      'EVENTS.EVENT-SRC-DESIGNATION-TITLE',
      'EVENTS.EVENT-SRC-SYSTEM-ID-TITLE',
      'EVENTS.EVENT-SRC-SYSTEM-NAME-TITLE',
      'EVENTS.INVESTIGATE-SYSTEM',
      'EVENTS.ASSISTED-TREATMENT',
      'EVENTS.LEAVE',
      'EVENTS.DETAILS-ACCORDION',
      'EVENTS.EVENT-NOTES-ACCORDION',
      'EVENTS.EVENT-NOTES-NEW',
      'EVENTS.MULTIPLE-SELECTION',
      'EVENTS.EVENT-NOTES-REFRESH',
      'EVENTS.SHOW-PATH',
      'EVENTS.EVENTS-GRID-TITLE',
      'EVENTS.SHOW-MORE',
      'EVENTS.SHOW-LESS',
      'EVENTS.SEE-MORE',
      'EVENTS.SEE-LESS',
      'EVENTS.MODAL-TITLE',
      'EVENTS.MODAL-TEXT',
      'EVENTS.EVENTS-SELECTED',
      'EVENTS.AT-FAILURE-DIALOG-TITLE',
      'EVENTS.AT-FAILURE-DIALOG-MESSAGE',
      'EVENTS.AT-FAILURE-DIALOG-CONFIRM',
      'EVENTS.AT-FAILURE-DIALOG-CANCEL'
    ]).subscribe(values => this.onTraslateStrings(values)));

    if (!this.IsInPopoverMode) {
      this.eventService.serverClientTimeDiff().then(res => {
        this.serverOffset = res;
      });
    }

    if (this.EventsSelected !== undefined) {
      this.subscriptions.push(this.EventsSelected.subscribe(events => (this.onSelectedEventNotification(events))));
    }

    const isEventMgrDetached =
      this.multiMonitorService.runsInElectron &&
      !this.multiMonitorService.isMainManager() &&
      this.multiMonitorService.isManagerWithEvent();
    this.isSendBtnDisabled = isEventMgrDetached;
  }

  public onRowHeight(height: number): void {
    this.eventsRowHeight = height;
  }

  public onEventSelected(events: Event[]): void {
    if (!this.IsInAssistedMode && events.length === 1) {
      this.isSubsequentEventSelected = true;
      events[0].groupedEvents = [];
      this.onSelectedEventNotification(events);
      this.subscribeEvents();
    }
  }

  public subscribeEvents(): void {
    if (this.eventSubscription === null) {
      this.eventSubscription = this.eventService.createEventSubscription(this.eventFilter, true);
      this.eventSubscription.events.subscribe(
        values => this.onEventsNotification(values),
        error => this.traceService.error(TraceModules.eventInfo, 'subscribeEvents() error: %s', error.toString())
      );
      this.eventService.addConsumer();
    }
  }

  public getSrcObjectName(): string {
    if (this.currCnsLabel != null) {
      switch (this.currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
        case CnsLabelEn.DescriptionAndAlias:
        case CnsLabelEn.DescriptionAndName:
          return this.srcObjectDescriptor;
        case CnsLabelEn.Name:
        case CnsLabelEn.NameAndAlias:
        case CnsLabelEn.NameAndDescription:
          return this.srcObjectName;
        default:
          break;
      }
      return '';
    }
  }

  public getSrcObjectDescription(): string {
    if (this.currCnsLabel != null) {
      switch (this.currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
        case CnsLabelEn.Name:
          break;
        case CnsLabelEn.DescriptionAndName:
          return this.srcObjectName;
        case CnsLabelEn.NameAndDescription:
          return this.srcObjectDescriptor;
        case CnsLabelEn.DescriptionAndAlias:
        case CnsLabelEn.NameAndAlias:
          if (isNullOrUndefined(this.srcObjectAlias)) {
            break;
          }
          return this.srcObjectAlias;
        default:
          break;
      }
      return '';
    }
  }

  public onShowMore(event: any): void {
    this.showMoreButton = !this.showMoreButton;
    if (this.showMoreButton) {
      this.onRefreshNotes();
    }
    event.stopPropagation();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });
    if (this.eventSubscription != null) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
      this.eventService.removeConsumer();
      this.eventSubscription = null;
    }
    this.subscriptions = [];
  }

  public onDeselectSubsequent(): void {
    let skipNotification = false;
    const events: Event[] = [this.subsequentEventSelected];
    this.isSubsequentEventSelected = false;

    if (this.containerEventSelected?.groupedEvents[0]?.eventId === this.subsequentEventSelected?.eventId) {
      // Skip deselection to preserve inProcessBy information coherent with the selection on the table
      // By unskipping this case will lead to have the container event selected in event list with no inProcessBy set
      skipNotification = true;
    } else if (this.containerEventSelected?.groupedEvents[0]?.eventId !== this.subsequentEventSelected?.eventId &&
      this.containerEventSelected.groupedEvents.find(e => e.eventId === this.subsequentEventSelected.eventId)
    ) {
      // When you unselect a subsequent which is not the first one, we need to suspend it
      this.eventService.eventCommand(events, 'suspend');

      // At the same time we need to keep the selection on the container and the first subsequent
      this.subsequentEventSelected = this.containerEventSelected.groupedEvents[0]
      this.eventService.eventCommand([this.subsequentEventSelected], 'select');
      skipNotification = true;
    } else {
      this.containerEventSelected = null
      this.subsequentEventSelected = null;
    }

    if (!skipNotification) {
      this.eventService.eventCommand(events, 'suspend');
      this.onSelectedEventNotification(events);
    } else {
      this.onSelectedEventNotification([this.containerEventSelected]);
    }

    if (this.eventSubscription != null) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
      this.eventService.removeConsumer();
      this.eventSubscription = null;
    }
  }

  public onNewNote(selected: Event): void {
    this.isNewNoteOpen = !this.isNewNoteOpen;
  }

  public onCancelNewNote(selected: Event): void {
    this.isNewNoteOpen = false;
    this.newEventNote = '';
  }

  public onConfirmNewNote(selected: Event): void {
    if (this.newEventNote.trim().length > 0) {
      this.onEventNotesManagement('setNotes');
      this.newEventNote = '';
      this.isNewNoteOpen = false;
      this.isNewNoteAddMessageVisible = true;
    }
  }

  public onRefreshNotes(): void {
    this.eventNotes = [];
    this.isNewNoteAddMessageVisible = false;
    this.onEventNotesManagement('getNotes');
  }

  public onEventNotesManagement(commandName: string): void {
    if (commandName === 'setNotes') {
      this.selectedEvents.forEach(event => {
        if (event.groupedEvents && event.groupedEvents.length > 0) {
          event.groupedEvents.forEach(subsequent => {
            this.eventNotesService.setEventNote(encodeURIComponent(encodeURIComponent(encodeURIComponent(subsequent.id))), this.newEventNote);
          });
        } else {
          this.eventNotesService.setEventNote(encodeURIComponent(encodeURIComponent(encodeURIComponent(event.id))), this.newEventNote);
        }
      });
    } else {
      this.isMultipleEventsSelected = false;
      if (this.selectedEvents.length > 1 ||
        (this.selectedEvents.length === 1 && this.selectedEvents[0].groupedEvents && this.selectedEvents[0].groupedEvents.length > 0)) {
        this.eventNotes = [];
        this.isMultipleEventsSelected = true;
        return;
      }
      this.isLoadingNotes = true;
      this.eventNotesService.getEventNotes(encodeURIComponent(encodeURIComponent(encodeURIComponent(this.selectedEvents[0].id)))).toPromise().then(
        response => {
          this.onGetEventNotes(response);
          this.isLoadingNotes = false;
        },
        error => {
          this.eventNotes = [];
          this.isLoadingNotes = false;
        }
      );
    }
    return;
  }
  // #endregion Event Notes management

  /**
  * Handles the selection of a command for the selected events.
  *
  * @param {string} commandName - The name of the command to execute.
  * @param {Event} selected - The event indicating if the command was selected.
  */
  public onSelectCommand(commandName: string, selected: Event): void {
    const eventIds: string[] = [];

    // Collect IDs of multi-selected events
    for (const eventItem of this.selectedEvents) {
      eventIds.push(eventItem.srcPropertyId);
    }

    if (selected) {
      // Validate the selected events before executing the command
      this.eventValidationService.validateEventCommands(eventIds, this.traceModule).subscribe(
        (validationInput: ValidationInput) => {
          const eventsToCommand: Event[] = [];

          // Check each selected event for permission and command applicability
          this.selectedEvents.forEach(event => {
            if (validationInput) {
              if (event.groupedEvents && event.groupedEvents.length > 0) {
                event.groupedEvents.forEach(subsequentEvent => {
                  if (this.hasCommand(subsequentEvent, commandName) &&
                    !eventsToCommand.find(e => e.id === subsequentEvent.id)) {
                    eventsToCommand.push(subsequentEvent);
                  }
                });
              } else if (this.hasCommand(event, commandName) &&
                !eventsToCommand.find(e => e.id === event.id)) {
                eventsToCommand.push(event);
              }
            } else {
              this.traceService.error(this.traceModule, 'onSelectCommand(): Validation input is not valid!');
            }
          }, error => {
            this.traceService.error(this.traceModule, 'onSelectCommand(): Event in selectedEvents error. Details: ', error);
          });

          // Execute the command if there are valid events to command
          if (eventsToCommand.length > 0) {
            if (commandName === 'close' && this.IsInAssistedMode) {
              // Handle special case for closing in assisted mode
              this.eventCommonService.exitFromAssistedTreatment(this.selectedEvents).subscribe(res => {
                if (!isNullOrUndefined(res.name) && (res.name === 'WsiError')) {
                  this.traceService.info(TraceModules.eventInfo, 'Failed to open assisted treatment for event ' + this.selectedEvents, ' reason: ', res);
                } else {
                  this.exitFromAssistedTreatment.emit(this.selectedEvent);
                  this.IsInAssistedMode = false;
                  this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, this.SnapInId.frameId).subscribe((modeChanged: boolean) => {
                    if (this.selectedEvents.length === eventsToCommand.length) {
                      this.selectedEvents.length = 0;
                    } else {
                      // Send command to select the event when leaving the treatment
                      this.eventService.eventCommand([this.selectedEvent], 'select');
                    }
                    this.traceService.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
                  });
                  this.showMoreButton = true;
                  this.eventCommonService.treatedEvent = undefined;
                  this.executeCommand(eventsToCommand, commandName, validationInput);
                }
              });
            } else {
              // Execute the command for valid events
              this.executeCommand(eventsToCommand, commandName, validationInput);
            }
          }
        },
        error => {
          this.traceService.error(this.traceModule, 'onSelectCommand(): Validation WSI Error. Details: ', error);
        }
      );
    } else {
      this.traceService.info(this.traceModule, 'onSelectCommand(): Something wrong with selected event.');
    }
  }

  public hasCommand(event: Event, command: string): boolean {
    return event.commands.findIndex(cmd => (cmd.Id.toLocaleLowerCase() === command.toLocaleLowerCase())) !== -1;
  }

  public goToSystemCommand(): void {
    this.goToSystem.emit(this.selectedEvent);
    this.onGoToSystem(this.selectedEvent);
  }

  public goToInvestigativeCommand(): void {
    if (this.IsInInvestigativeMode) {
      this.exitFromInvestigativeTreatment.emit(this.selectedEvent);
      this.onExitFromInvestigativeTreatment(this.selectedEvent);
    } else {
      this.goToInvestigativeTreatment.emit(this.selectedEvent);
      this.onGoToInvestigativeTreatment(this.selectedEvent);
    }
  }

  public goToAssistedCommand(): void {
    let destinationMode = 'assisted';

    if (this.IsInAssistedMode) {
      this.eventCommonService.exitFromAssistedTreatment(this.selectedEvents).subscribe(res => {
        if (!isNullOrUndefined(res.name) && (res.name === 'WsiError')) {
          this.traceService.info(TraceModules.eventInfo, 'Failed to open assisted treatment for event ' + this.selectedEvents, ' reason: ', res);
        } else {
          this.exitFromAssistedTreatment.emit(this.selectedEvent);
          destinationMode = DEFAULT_MODE_ID;
          this.IsInAssistedMode = false;
          this.messageBroker.changeMode({ id: destinationMode, relatedValue: null }, this.SnapInId.frameId).subscribe((modeChanged: boolean) => {
            // Send command to select the event when leaving the treatment
            this.eventService.eventCommand([this.selectedEvent], 'select');
            this.traceService.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
          });
          this.showMoreButton = true;
          this.eventCommonService.treatedEvent = undefined;
        }
      });
    } else {
      this.eventCommonService.goToAssistedTreatment(this.selectedEvents).subscribe(res => {
        if (!isNullOrUndefined(res.name) && (res.name === 'WsiError')) {
          this.traceService.info(TraceModules.eventInfo, 'Failed to open assisted treatment for event ' + this.selectedEvents, ' reason: ', res);
          this.openATErrorModal();
        } else {
          this.goToAssistedTreatment.emit(this.selectedEvent);
          this.IsInAssistedMode = true;
          this.messageBroker.changeMode({ id: destinationMode, relatedValue: null }, this.SnapInId.frameId).subscribe((modeChanged: boolean) => {
            this.traceService.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
          });
          this.showMoreButton = false;
          this.eventCommonService.treatedEvent = this.selectedEvent;
        }
      }, err => {
        catchError(err);
        this.traceService.info(TraceModules.eventInfo, 'Failed to open assisted treatment for event ' + this.selectedEvents, ' reason: ', err);
        this.openATErrorModal();
      });
    }
  }

  public openATErrorModal(): void {
    const tmpEvent: Event = new Event();
    tmpEvent.originalInProcessBy = this.selectedEvent.originalInProcessBy;

    // We must ensure that the dialogs run INTO the ngZone otherwise change detection is not triggerd and they do not show up.
    this.ngZone.run(() => {
      this.subscriptions.push(
        this.siModal.showActionDialog(
          {
            type: 'confirmation',
            message: this.atFailDialogMessage.replace('{{otherClient}}', tmpEvent.getAssistedTreatmentInProcessBy()),
            title: this.atFailDialogTitle,
            confirmBtnName: this.atFailDialogConfirm,
            declineBtnName: this.atFailDialogCancel
          }).subscribe(confirmation => {
          switch (confirmation) {
            case ConfirmationDialogResult.Confirm:
              this.goToInvestigativeCommand();
              break;
            case ConfirmationDialogResult.Decline:
              break;
            default:
              break;
          }
        })
      );
    })
  }

  public onGoToSystem(event: Event): void {
    if (event != null) {
      this.systemBrowserService.searchNodes(event.srcSystemId, event.srcPropertyId, undefined, SearchOption.objectId)
        .toPromise()
        .then(page => {
          if (page.Nodes.length > 0) {
            let msgBody: GmsMessageData;
            let designation = '';
            const types = [page.Nodes[0].Attributes.ManagedTypeName];

            // Search node belonging to current view (if it is present)
            let foundedNode = this.findNodeInView(page.Nodes, this.currActiveView?.viewType);

            if (foundedNode) {
              msgBody = new GmsMessageData([foundedNode]);
              designation = foundedNode.Designation;
            } else if (event.designationList?.length > 0) {
              // Search node by designation (in fallback view):
              // 1) the searched designation is the first one inside designation list and
              // 2) designation list here is already ordered and filled by alarm orch.:
              //   - if a node is belonging to Application View (or Management view) and to user defined view,
              //      then the first designation is under user defined view.
              //   - if a node is belonging only to Application view (or Management view),
              //      then the designation list is made of only one item (under Application or Management view)
              // 3) the view of first designation is the fallback view
              foundedNode = this.findNodeByDesignation(page.Nodes, event.designationList[0].Descriptor);

              if (foundedNode) {
                msgBody = new GmsMessageData([foundedNode]);
                designation = foundedNode.Designation;
              }
            }

            if (!isNullOrUndefined(designation) && !isNullOrUndefined(msgBody.data?.length > 0)) {
              const fullQParamId = new FullQParamId('system-manager', 'SystemQParamService', 'primary');
              const qParam = { name: fullQParamId.fullId(), value: designation };
              const message: MessageParameters = {
                messageBody: msgBody,
                qParam,
                types
              };
              if (!this.multiMonitorService.runsInElectron) {
                // this.switchToNextFrame(EventDetailsSnapInComponent.systemManagerFrameId, message).subscribe((frameChanged: boolean) => {
                //   this.traceService.debug(TraceModules.eventInfo, 'goToSystem() completed. result: %s', frameChanged);
                // });
                this.messageBroker.switchToNextFrame(fullQParamId.frameId, message).pipe(take(1)).subscribe((frameChanged: boolean) => {
                  this.traceService.debug(TraceModules.eventInfo, 'goToSystem() completed. result: %s', frameChanged);
                });
              } else {
                // send switchframe object to main window if running in Electron
                this.multiMonitorService.sendObjectToMainManager({
                  type: ObjectMessageType.SwitchFrame,
                  data: { frame: fullQParamId.frameId, msg: message }
                });
              }
            }
          }
        });
    }
  }

  public onGoToInvestigativeTreatment(event: Event): void {
    this.eventCommonService.goToInvestigativeTreatment(event);
    this.IsInAssistedMode = false;
    this.IsInInvestigativeMode = true;
  }

  public onExitFromInvestigativeTreatment(event: Event): void {
    this.eventCommonService.exitFromInvestigativeTreatment(event);
    // Send new selection to populate inProcessBy
    this.eventService.eventCommand([event], 'select');
    this.IsInInvestigativeMode = false;
  }

  public getEventDisciplineColor(): string {
    return `rgb(${this.selectedEvent.category.colors.get(EventColors.ButtonGradientDark)})`;
  }

  public getSourceState(state: string): string {
    switch (state) {
      case 'Active': {
        return this.sourceStateActive;
      }
      case 'Quiet': {
        return this.sourceStateQuiet;
      }
      default: {
        return this.multipleStringValue;
      }
    }
  }

  public getEventSrcPath(eventObj: Event): string {
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

  public getSrcNameDescription(event: Event): string[] {
    let srcNameDescription: string[] = [];

    if (this.currCnsLabel != null) {
      switch (this.currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
          srcNameDescription = [event.srcDescriptor];
          break;
        case CnsLabelEn.DescriptionAndAlias:
          srcNameDescription = [event.srcDescriptor, event.srcAlias];
          break;
        case CnsLabelEn.DescriptionAndName:
          srcNameDescription = [event.srcDescriptor, event.srcName];
          break;
        case CnsLabelEn.Name:
          srcNameDescription = [event.srcName];
          break;
        case CnsLabelEn.NameAndAlias:
          srcNameDescription = [event.srcName, event.srcAlias];
          break;
        case CnsLabelEn.NameAndDescription:
          srcNameDescription = [event.srcName, event.srcDescriptor];
          break;
        default:
          break;
      }
    }
    return srcNameDescription;
  }

  public getEventState(event: Event): string {

    this.selectedEvent = event;

    switch (event.state) {
      case 'Unprocessed': {
        return this.eventStateUnprocessed;
      }
      case 'ReadyToBeReset': {
        return this.eventStateReadyToBeReset;
      }
      case 'ReadyToBeClosed': {
        return this.eventStateReadyToBeClosed;
      }
      case 'WaitingOPCompletion': {
        return this.eventStateWaitingForCondition;
      }
      case 'Acked': {
        return this.eventStateAcked;
      }
      case 'Closed': {
        return this.eventStateClosed;
      }
      case 'UnprocessedWithTimer': {
        return this.eventStateUnprocessedWithTimer + this.calculateTimer(event);
      }
      case 'ReadyToBeResetWithTimer': {
        return this.eventStateReadyToBeResetWithTimer + this.calculateTimer(event);
      }
      default: {
        return this.multipleStringValue;
      }
    }
  }

  public getEventSrcSource(): string {
    if (this.srcNameDescription !== undefined) {
      return this.srcNameDescription[0].includes('.') ? this.srcNameDescription[0].split('.', 2)[1] : '';
    }
  }

  public isEventAcked(eventState: string): boolean {
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

  public isEventReadyToBeReset(eventState: string): boolean {
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

  public getSourceStateIconClass(sourceState: string, eventState: string): string {
    if (this.isEventReadyToBeReset(eventState)) {
      return 'status-source-no-icon';
    } else {
      if (sourceState === 'Quiet') {
        if (this.isEventAcked(eventState)) {
          return 'source-icon event-info-source-icon-quiet-color element-alarm-background';
        } else {
          return 'source-icon event-info-source-icon-quiet-color element-alarm';
        }
      } else {
        if (this.isEventAcked(eventState)) {
          return 'source-icon event-info-source-icon-active-color element-alarm-background-filled';
        } else {
          return 'source-icon event-info-source-icon-active-color element-alarm-filled';
        }
      }
    }
  }

  public adjustGridHeight(event: Event): void {
    if (this.eventsGridShowText === this.showLess) {
      if (event.groupedEvents.length > 5) {
        this.eventsGridHeight = this.eventsRowHeight * 5 + 80;
        this.eventsGridScrollable = true;
      } else {
        this.eventsGridHeight = this.eventsRowHeight * event.groupedEvents.length + 80;
        this.eventsGridScrollable = false;
      }
    } else {
      this.eventsGridHeight = this.eventsRowHeight + 80;
      this.eventsGridScrollable = false;
    }
  }

  public onToggleEventsGrid(): void {
    if (this.eventsGridShowText === this.showMore) {
      this.eventsGridShowText = this.showLess;
    } else {
      this.eventsGridShowText = this.showMore;
    }
    this.adjustGridHeight(this.selectedEvent);
  }

  public getEventDate(event: Event): string {
    return event.originalCreationTime.toLocaleDateString(this.userLang);
  }

  public getEventTime(event: Event): string {
    return event.originalCreationTime.toLocaleTimeString(this.userLang);
  }

  public isUlUlcProfile(): boolean {
    const userProfile = this.authenticationService.userProfile;
    if (userProfile === 'ul' || userProfile === 'ulc' || userProfile === 'fs_en' || userProfile === 'tbs_en') {
      return true;
    } else {
      return false;
    }
  }

  public eventContainDoubleCommand(): boolean {
    if ((!this.silUnsilCommandPrimary && this.ackCommandEnabled) || (!this.silUnsilCommandPrimary && this.resCommandPrimary)) {
      return true;
    }
  }

  public onPrimaryClick(action: any): void {
    action.call(this);
  }

  private onTraslateStrings(strings: string[]): void {
    this.sourceStateActive = strings['EVENTS.SOURCE-STATE-ACTIVE'];
    this.sourceStateQuiet = strings['EVENTS.SOURCE-STATE-QUIET'];
    this.eventStateUnprocessed = strings['EVENTS.EVENT-STATE-UNPROCESSED'];
    this.eventStateReadyToBeReset = strings['EVENTS.EVENT-STATE-READY-TO-BE-RESET'];
    this.eventStateReadyToBeClosed = strings['EVENTS.EVENT-STATE-READY-TO-BE-CLOSED'];
    this.eventStateWaitingForCommandExecution = strings['EVENTS.EVENT-STATE-WAITING-FOR-COMMAND-EXECUTION'];
    this.eventStateWaitingForCondition = strings['EVENTS.EVENT-STATE-WAITING-FOR-CONDITION'];
    this.eventStateAcked = strings['EVENTS.EVENT-STATE-ACKED'];
    this.eventStateClosed = strings['EVENTS.EVENT-STATE-CLOSED'];
    this.eventStateUnprocessedWithTimer = strings['EVENTS.EVENT-STATE-UNPROCESSED-WITH-TIMER'];
    this.eventStateReadyToBeResetWithTimer = strings['EVENTS.EVENT-STATE-READY-TO-BE-RESET-WITH-TIMER'];
    this.noEventNotesForMultiselection = strings['EVENTS.EVENT-NOTES-FOR-MULTISELECTION'];
    this.newEventNoteAdded = strings['EVENTS.EVENT-NOTES-ADDED'];
    this.eventNotesLoading = strings['EVENTS.EVENT-NOTES-LOADING'];
    this.noEventNotes = strings['EVENTS.NO-EVENT-NOTES-AVAILABLE'];
    this.newMultipleEventsNoteAdded = strings['EVENTS.MULTIPLE-EVENTS-NOTES-ADDED'];
    this.noEventSelected = strings['EVENTS.NO-EVENT-SELECTED'];
    this.ackCommandText = strings['EVENTS.ACK-COMMAND-TEXT'];
    this.resetCommandText = strings['EVENTS.RESET-COMMAND-TEXT'];
    this.silenceCommandText = strings['EVENTS.SILENCE-COMMAND-TEXT'];
    this.unsilenceCommandText = strings['EVENTS.UNSILENCE-COMMAND-TEXT'];
    this.closeCommandText = strings['EVENTS.CLOSE-COMMAND-TEXT'];
    this.goToSystemCommandText = strings['EVENTS.GO-TO-SYSTEM-COMMAND-TEXT'];
    this.eventCauseTitle = strings['EVENTS.EVENT-CAUSE-TITLE'];
    this.eventInterventionTextTitle = strings['EVENTS.EVENT-INTERVENTION-TEXT-TITLE'];
    this.eventSrcStateTitle = strings['EVENTS.EVENT-SRC-STATE-TITLE'];
    this.eventStateTitle = strings['EVENTS.EVENT-STATE-TITLE'];
    this.eventSrcSourceTitle = strings['EVENTS.EVENT-SRC-SOURCE-TITLE'];
    this.eventSrcLocationTitle = strings['EVENTS.EVENT-SRC-LOCATION-TITLE'];
    this.eventTimeTitle = strings['EVENTS.EVENT-TIME-TITLE'];
    this.eventDateTitle = strings['EVENTS.EVENT-DATE-TITLE'];
    this.eventIdTitle = strings['EVENTS.EVENT-ID-TITLE'];
    this.eventDisciplineTitle = strings['EVENTS.EVENT-DISCIPLINE-TITLE'];
    this.eventInProcessByTitle = strings['EVENTS.EVENT-IN-PROCESS-BY-TITLE'];
    this.eventMessageTextTitle = strings['EVENTS.EVENT-MESSAGE-TEXT-TITLE'];
    this.eventCategoryTitle = strings['EVENTS.EVENT-CATEGORY-TITLE'];
    this.eventSrcDesignationTitle = strings['EVENTS.EVENT-SRC-DESIGNATION-TITLE'];
    this.eventSrcSystemIdTitle = strings['EVENTS.EVENT-SRC-SYSTEM-ID-TITLE'];
    this.eventSrcSystemNameTitle = strings['EVENTS.EVENT-SRC-SYSTEM-NAME-TITLE'];
    this.investigateSystem = strings['EVENTS.INVESTIGATE-SYSTEM'];
    this.assistedTreatment = strings['EVENTS.ASSISTED-TREATMENT'];
    this.leave = strings['EVENTS.LEAVE'];
    this.detailsAccordion = strings['EVENTS.DETAILS-ACCORDION'];
    this.eventNotesAccordion = strings['EVENTS.EVENT-NOTES-ACCORDION'];
    this.multipleSelection = strings['EVENTS.MULTIPLE-SELECTION'];
    this.eventNotesRefresh = strings['EVENTS.EVENT-NOTES-REFRESH'];
    this.eventNotesNew = strings['EVENTS.EVENT-NOTES-NEW'];
    this.showPath = strings['EVENTS.SHOW-PATH'];
    this.eventGridTitle = strings['EVENTS.EVENTS-GRID-TITLE'];
    this.showMore = strings['EVENTS.SHOW-MORE'];
    this.showLess = strings['EVENTS.SHOW-LESS'];
    this.seeMore = strings['EVENTS.SEE-MORE'];
    this.seeLess = strings['EVENTS.SEE-LESS'];
    this.eventsSelected = strings['EVENTS.EVENTS-SELECTED'];
    this.atFailDialogTitle = strings['EVENTS.AT-FAILURE-DIALOG-TITLE'];
    this.atFailDialogMessage = strings['EVENTS.AT-FAILURE-DIALOG-MESSAGE'];
    this.atFailDialogConfirm = strings['EVENTS.AT-FAILURE-DIALOG-CONFIRM'];
    this.atFailDialogCancel = strings['EVENTS.AT-FAILURE-DIALOG-CANCEL'];
    this.eventsGridShowText = this.showMore;
    this.userLang = this.translateService.getBrowserLang();

    this.commandTexts = new Map([
      ['ack', strings['EVENTS.ACK-COMMAND-TEXT']],
      ['reset', strings['EVENTS.RESET-COMMAND-TEXT']],
      ['silence', strings['EVENTS.SILENCE-COMMAND-TEXT']],
      ['unsilence', strings['EVENTS.UNSILENCE-COMMAND-TEXT']],
      ['close', strings['EVENTS.CLOSE-COMMAND-TEXT']]
    ]);

    this.commandIcons = new Map([
      ['acknowledge', 'element-alarm-tick'],
      ['reset', 'element-undo'],
      ['silence', 'element-horn-off'],
      ['unsilence', 'element-horn'],
      ['close', 'element-cancel']
    ]);

    const item: MenuItem = {};
    item.action = (): void => { this.isNewNoteOpen = !this.isNewNoteOpen; };
    item.title = this.eventNotesNew;
    item.icon = 'element-plus';
    // this.newNoteContentActions.push(item);

    const refreshItem: MenuItem = {};
    refreshItem.action = (): void => { this.onRefreshNotes(); };
    refreshItem.title = this.eventNotesRefresh;
    refreshItem.icon = 'element-refresh';
    // this.newNoteContentActions.push(refreshItem);

    this.newNoteContentActions = [item, refreshItem];
    if (this.snapinConfig.getAvailableModes()) {
      this.subscriptions.push(this.messageBroker.getCurrentMode().subscribe(mode => {
        if (isNullOrUndefined(this.initialMode) && mode.id === 'assisted') {
          this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, this.SnapInId?.frameId).subscribe((modeChanged: boolean) => {
            this.traceService.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
          });
          this.initialMode = '';
          this.IsInAssistedMode = false;
        }
        if (mode.id === DEFAULT_MODE_ID) {
          this.IsInAssistedMode = false;
          this.IsInInvestigativeMode = false;
          this.showMoreButton = true;
        } else if (mode.id === 'assisted') {
          let qParamId = '';
          this.subscriptions.push(this.messageBroker.getQueryParam(new FullQParamId('event-list', 'SystemQParamService', 'primary')).subscribe(qParam => {
            this.traceService.debug(TraceModules.eventGrid, 'New qParam received qParam=%s', qParam);
            qParamId = qParam;
          }));

          if (this.currentMode === '' && qParamId === null) {
            this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, this.SnapInId.frameId).subscribe((modeChanged: boolean) => {
              this.traceService.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
            });
          } else {
            this.IsInAssistedMode = true;
            this.IsInInvestigativeMode = false;
          }
        } else {
          this.IsInAssistedMode = false;
          this.IsInInvestigativeMode = true;
        }
        this.currentMode = mode.id;
      }));
    }
  }

  private executeCommand(eventsToCommand: Event[], commandName: string, validationInput: ValidationInput): void {
    this.eventService.eventCommand(eventsToCommand, commandName, undefined, validationInput)
      .subscribe(error => {
        if (!isNullOrUndefined(error?.message)) {
          this.traceService.error(TraceModules.eventInfo, error.message);
          this.toastNotificationService.queueToastNotification('danger', 'EVENTS.EVENT-COMMANDING-FAILURE', error.message);
        }
      });
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

  private updateTimer(event: Event): void {
    if (!isNullOrUndefined(event) && !isNullOrUndefined(event.timerUtc)) {
      const expiration: number = Date.parse(event.timerUtc);
      const now: number = new Date().getTime() + this.serverOffset;
      const timer: number = Math.floor((expiration - now) / 1000);
      let timerString = '';

      if (timer > 0) {
        const minutes: string = String(Math.floor(timer / 60)).padStart(2, '0');
        const seconds: string = String(timer % 60).padStart(2, '0');
        timerString = ': ' + minutes + ':' + seconds;
      } else {
        timerString = ': 00:00';
      }

      if (this.selectedEvent) {
        this.selectedEvent.state = this.selectedEvent.state.split(':')[0] + timerString;
      }
    }
  }

  private setBrowserObject(event: Event): void {
    this.systemBrowserService.searchNodes(event.srcSystemId, event.srcPropertyId, undefined, SearchOption.objectId)
      .toPromise()
      .then(page => {
        if (page.Nodes.length > 0) {
          page.Nodes.sort(CnsHelperService.compareBrowserObjects);

          let index: number;
          for (index = 0; index < page.Nodes.length; index++) {
            if (this.currActiveView?.containsObject(page.Nodes[index])) {
              break;
            }
          }
          if (index === page.Nodes.length) {
            index = 0;
          }

          this.getObjectIcon(page.Nodes[index].Attributes.TypeId);
          this.srcObjectName = page.Nodes[index].Name;
          this.srcObjectDescriptor = page.Nodes[index].Descriptor;
          this.srcObjectAlias = page.Nodes[index].Attributes.Alias;

          this.selectedBrowserObjects = page.Nodes.slice(0, 1);
          this.isContainerEvent = (!isNullOrUndefined(this.selectedEvent) &&
            !isNullOrUndefined(this.selectedEvent.groupedEvents) && this.selectedEvent.groupedEvents.length > 0);
        } else {
          this.traceService.error(TraceModules.eventInfo, 'Object related to selected event not found!');
        }
      });
  }

  private onEventsNotification(events: Event[]): void {
    if (this.selectedEvents) {
      for (const event of events) {
        for (const eventItem of this.selectedEvents) {
          if (eventItem.id === event.id) {
            this.selectedEvents.splice(this.selectedEvents.indexOf(eventItem));
            const newEventItem: Event = new Event();
            newEventItem.updateEvent(event, false, false);
            this.selectedEvents.push(newEventItem);
            this.onSelectedEventNotification(this.selectedEvents);
            return;
          }
        }
      }
    }
  }

  private getObjectIcon(objectIconId: number): void {
    this.iconMapperService.getGlobalIcon(TablesEx.ObjectTypes, objectIconId).toPromise()
      .then(iconString => this.whereIcon = iconString);
  }

  private onGetEventNotes(evNotesResponse: any): void {
    if (evNotesResponse?.Notes) {
      this.eventNotes = [];
      const userLang: string = this.translateService.getBrowserLang();

      evNotesResponse.Notes.forEach(element => {
        const note: EventNote = new EventNote();
        note.messageText = element.MessageText;
        note.time = new Date(element.Time).toLocaleString(userLang);
        note.userName = element.UserName;
        this.eventNotes.push(note);
      });
    }
  }

  private getATAppRights(): Observable<boolean> {
    this.appRightsAT = this.appRightsService.getAppRights(this.ATRightsId);
    if (this.appRightsAT != null) {
      const showRightAT: Operation[] = this.appRightsAT.Operations.filter(f => f.Id === this.ATShowRights);
      return (showRightAT.length > 0) ? observableOf(true) : observableOf(false);
    } else {
      return observableOf(false);
    }
  }

  private setContainerActions(el: Event): any {
    if (this.selectedEvents.length === 1) {
      const actions = { primary: [], secondary: [] };
      const commands = el.commands.map(e => e.Id);

      const evt = el;
      const cmds = el.commands;

      // Set primary action
      let primaryCmd = commands.find(c =>
        evt.suggestedAction?.toLowerCase().startsWith(c.toLowerCase())
      );

      if (primaryCmd === "Silence" || primaryCmd === "Unsilence") {
        if (this.resCommandEnabled) {
          primaryCmd = "Reset";
        } else if (this.ackCommandEnabled) {
          primaryCmd = "Ack";
        }
      }

      if (commands.length > 0 && primaryCmd === undefined) {
        primaryCmd = commands.find(c => c !== "Empty" && c !== "Select" && c !== "Suspend");
      }

      const primaryAction = this.setPrimaryActions(
        primaryCmd,
        cmds,
        commands,
        evt
      );
      const primaryActionId = primaryAction.primaryActionId;

      actions.primary = primaryAction.actions;

      // Set secondary actions
      const secondaryActions = this.setSeconadyActions(
        evt,
        primaryActionId,
        cmds
      );

      actions.secondary = this.cleanSecondaryActions(secondaryActions);

      return actions;
    } else {
      // in case of a multiple selection, merge all primary actions of the selected events
      // sort actions by suggested action id
      const actions = { primary: [], secondary: [] };
      const primaryActions = [];

      this.selectedEvents.forEach(ev => {
        const commands = ev.commands.map(e => e.Id);

        const evt = ev;
        const cmds = ev.commands;

        const primaryCmd = commands.find(c =>
          evt.suggestedAction?.toLowerCase().startsWith(c.toLowerCase())
        );
        const primaryAction = this.setPrimaryActions(
          primaryCmd,
          cmds,
          commands,
          evt
        );
        if (primaryActions.findIndex(a => a.id === evt.suggestedActionId) === -1) {
          primaryAction.actions.id = evt.suggestedActionId;
          primaryActions.push(primaryAction.actions);
        }
      });

      primaryActions.sort((a, b) => a.id - b.id);
      actions.primary = primaryActions[0];
      primaryActions.slice(1).forEach(ac => {
        if (ac.length > 0) {
          ac[0].icon = undefined;
          actions.secondary.push(ac[0]);
        }
      });

      return actions;
    }
  }

  private onCommandClick(cmd: string, event: Event): void {
    this.onSelectCommand(cmd.toLowerCase(), event);
  }

  private setPrimaryActions(primaryCmd, cmds, commands, evt): any {
    let actions = [];
    let primaryActionId = null;
    if (!isNullOrUndefined(primaryCmd)) {
      const primaryAction = {
        title: this.commandTexts.get(primaryCmd.toLowerCase()),
        icon: this.commandIcons.get(primaryCmd === 'Ack' ? 'acknowledge' : primaryCmd.toLowerCase()),
        disabled: this.disableCommands,
        action: (): void => this.onCommandClick(primaryCmd, evt)
      };
      primaryActionId = primaryAction.title;
      actions = [primaryAction];
    } else {
      const suggestedAction = this.getSuggestedAction(evt);
      if (isNullOrUndefined(suggestedAction)) {
        cmds.forEach(cmd => {
          if (cmd.Id !== 'Select' && cmd.Id != 'Suspend') {
            const primaryCommand = commands.find(
              c => cmd.Id.toLowerCase() == c
            );
            if (!isNullOrUndefined(primaryCommand)) {
              const primaryAction = {
                title: this.commandTexts.get(primaryCommand.Id),
                icon: primaryCommand.glyphicon,
                disabled: this.disableCommands,
                action: (): void => this.onCommandClick(primaryCommand, evt)
              };
              primaryActionId = primaryAction.title;
              actions = [primaryAction];
            }
          }
        });
      } else {
        primaryActionId = suggestedAction.title;
        actions = [suggestedAction];
      }
    }

    return { actions, primaryActionId };
  }

  private setSeconadyActions(evt, primaryActionId, cmds): any[] {
    const secondaryActions = [];

    if (this.disableCommands) {
      return secondaryActions;
    }

    this.commandTexts.forEach(cmd => {
      const action = {
        title: cmd,
        disabled: this.checkAllClosed(cmd, evt, primaryActionId),
        action: (): void => this.onCommandClick(secondaryCmd.Id, evt)
      };

      const secondaryCmd = cmds.find(c => c.Id === cmd);
      if (
        !isNullOrUndefined(secondaryCmd) &&
        secondaryCmd.Id !== primaryActionId
      ) {
        secondaryActions.push(action);
      } else {
        if (cmd != primaryActionId) {
          action.disabled = true;
          secondaryActions.push(action);
        }
      }
    });

    return secondaryActions;
  }

  private checkAllClosed(title: string, evt, primaryActionId: string): boolean {
    if (
      evt.groupedEvents.length === 0 &&
      primaryActionId === 'Close' &&
      (title === 'Silence' || title === 'Unsilence')
    ) {
      return true;
    } else if (
      evt.groupedEvents.length > 0 &&
      primaryActionId === 'Close' &&
      (title === 'Silence' || title === 'Unsilence')
    ) {
      let allClose = true;
      evt.groupedEvents.forEach(child => {
        if (child.commands.findIndex(x => x.Id === 'Close') === -1) {
          allClose = false;
        }
      });
      if (allClose === true) {
        return true;
      }
    }
    return false;
  }
  private cleanSecondaryActions(actions): any[] {
    const secondaryActions = actions.map(a => a);
    let idx;
    // Clean up secondary actions
    const silence = secondaryActions.find(c => c.title == 'Silence');
    const unsilence = secondaryActions.find(c => c.title == 'Unsilence');

    if (!isNullOrUndefined(silence) && !silence.disabled) {
      idx = secondaryActions.findIndex(c => c.title == 'Unsilence');
    } else if (!isNullOrUndefined(unsilence) && !unsilence.disabled) {
      idx = secondaryActions.findIndex(c => c.title == 'Silence');
    } else {
      idx = secondaryActions.findIndex(c => c.title == 'Unsilence');
    }

    if (idx > -1) {
      secondaryActions.splice(idx, 1);
    }

    return secondaryActions;
  }

  private getSuggestedAction(evt: any): any {
    const cmd = this.commandTexts.get(evt.suggestedAction.toLowerCase());
    const cmdId: string = Array.from(this.commandTexts.keys()).find(k =>
      evt.suggestedAction.toLowerCase().startsWith(k)
    );
    if (!isNullOrUndefined(cmd)) {
      const title = cmd;
      const icon = this.commandIcons.get(evt.suggestedAction.toLowerCase());
      const action = (): void => {
        this.onCommandClick(cmdId, evt);
      };
      return { title, icon, action };
    }
    return null;
  }

  private mergeEvents(events: Event[]): Event {
    if (events.length > 0 && !isNullOrUndefined(events[0])) {
      const retEvent: Event = jQuery.extend(true, {}, events[0]);
      this.setSrcDesignationAndLocation(retEvent);

      this.srcNameDescription = this.getSrcNameDescription(retEvent);
      this.srcPath = this.getEventSrcPath(retEvent);

      if (events.length === 1) {
        return retEvent;
      }

      events.forEach(event => {
        this.setSrcDesignationAndLocation(event);
        if (this.srcNameDescription[0] !== this.multipleStringValue &&
          this.srcNameDescription[0] !== this.getSrcNameDescription(event)[0]) {
          this.srcNameDescription[0] = this.multipleStringValue;
          if (this.srcNameDescription.length > 1) {
            this.srcNameDescription[1] = this.multipleStringValue;
          }
        }

        if (this.srcPath !== this.multipleStringValue &&
          this.srcPath !== this.getEventSrcPath(event)) {
          this.srcPath = this.multipleStringValue;
        }

        if (retEvent.infoDescriptor !== this.multipleStringValue &&
          retEvent.infoDescriptor !== event.infoDescriptor) {
          retEvent.infoDescriptor = this.multipleStringValue;
        }

        if (retEvent.infoDescriptor !== this.multipleStringValue &&
          retEvent.infoDescriptor !== event.infoDescriptor) {
          retEvent.infoDescriptor = this.multipleStringValue;
        }
        if (retEvent.state !== this.multipleStringValue && retEvent.state !== event.state) {
          retEvent.state = this.multipleStringValue;
        }
        if (retEvent.srcState !== this.multipleStringValue && retEvent.srcState !== event.srcState) {
          retEvent.srcState = this.multipleStringValue;
        }
        if (retEvent.suggestedAction !== this.multipleStringValue && (retEvent.suggestedAction !== event.suggestedAction)) {
          retEvent.suggestedAction = this.multipleStringValue;
        }
        if (retEvent.srcState !== this.multipleStringValue && retEvent.srcLocation !== event.srcLocation) {
          retEvent.srcLocation = this.multipleStringValue;
        }
        if (retEvent.srcState !== this.multipleStringValue && retEvent.srcDesignation !== event.srcDesignation) {
          retEvent.srcDesignation = this.multipleStringValue;
        }
        if (retEvent.eventId !== event.eventId) {
          retEvent.eventId = -1;
        }
        if (retEvent.creationTime !== this.multipleStringValue && retEvent.creationTime !== event.creationTime) {
          retEvent.creationTime = this.multipleStringValue;
        }
        if (retEvent.srcDisciplineDescriptor !== this.multipleStringValue && retEvent.srcDisciplineDescriptor !== event.srcDisciplineDescriptor) {
          retEvent.srcDisciplineDescriptor = this.multipleStringValue;
        }
        if (retEvent.inProcessBy !== this.multipleStringValue && retEvent.inProcessBy !== event.inProcessBy) {
          retEvent.inProcessBy = this.multipleStringValue;
        }
        if (retEvent.eventText !== this.multipleStringValue && retEvent.eventText !== event.eventText) {
          retEvent.eventText = this.multipleStringValue;
        }
        if (retEvent.cause !== this.multipleStringValue && retEvent.cause !== event.cause) {
          retEvent.cause = this.multipleStringValue;
        }
        if (retEvent.messageTextToDisplay !== this.multipleStringValue && retEvent.messageTextToDisplay !== event.messageTextToDisplay) {
          retEvent.messageTextToDisplay = this.multipleStringValue;
        }
        if (retEvent.categoryDescriptor !== this.multipleStringValue && retEvent.categoryDescriptor !== event.categoryDescriptor) {
          retEvent.categoryDescriptor = this.multipleStringValue;
        }
        if (retEvent.srcSystemId !== event.srcSystemId) {
          retEvent.srcSystemId = -1;
        }
        if (retEvent.srcSystemName !== this.multipleStringValue && retEvent.srcSystemName !== event.srcSystemName) {
          retEvent.srcSystemName = this.multipleStringValue;
        }
        if (retEvent.oPId !== '' && retEvent.oPId !== event.oPId) {
          retEvent.oPId = '';
        }

        event.commands.forEach(command => {
          if (!this.hasCommand(retEvent, command.Id)) {
            retEvent.commands.push(command);
          }
        });
      });
      return retEvent;
    }
    return undefined;
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
    } else {
      if (this.currActiveView === null) {
        this.traceService.error(TraceModules.eventInfo, 'The current active View is null!');
        if (designations !== null && designations.length > 0) {
          eventItem.srcLocation = eventItem.descriptionLocationsList[0].Descriptor;
          eventItem.srcDesignation = eventItem.designationList[0].Descriptor;
        }
      } else {
        this.traceService.error(TraceModules.eventInfo, 'The designation list of the event with id: %s is null', eventItem.id);
      }
    }
  }

  private onSelectedEventNotification(events: Event[]): void {
    if (events === null || events.length === 0 || events[0] === null) {
      this.isSubsequentEventSelected = false;
      this.subsequentEventSelected = null;
      this.containerEventSelected = null;
      this.selectedEvents = [];
      this.selectedEvent = null;
      if (this.eventSubscription != null) {
        this.eventService.destroyEventSubscription(this.eventSubscription.id);
        this.eventService.removeConsumer();
        this.eventSubscription = null;
      }
      return;
    }

    if (events[0].eventId === this.selectedEvent?.eventId &&
       events[0].eventId === this.subsequentEventSelected?.eventId &&
       events[0].groupedEvents?.length === this.selectedEvent.groupedEvents?.length) {
      return;
    }
    if (events[0].stateId === EventStates.Closed) {
      if (!isNullOrUndefined(this.containerEventSelected) && this.isSubsequentEventSelected) {
        this.selectedEvents = [this.containerEventSelected];
        this.selectedEvent = this.containerEventSelected;
        this.isContainerEvent = (!isNullOrUndefined(this.selectedEvent) &&
        !isNullOrUndefined(this.selectedEvent.groupedEvents) && this.selectedEvent.groupedEvents.length > 0);

        if (this.containerEventSelected.groupedEvents?.length > 0) {
          this.subsequentEventSelected = this.containerEventSelected.groupedEvents[0];
          this.executeCommand([this.subsequentEventSelected], 'select', null); // Select the first subsequent everytime another subsequent is closed
          return;
        }

        this.isSubsequentEventSelected = false;
      } else {
        this.selectedEvents = [];
        this.selectedEvent = null;
      }
      return;
    }

    if (this.containerEventSelected != null && this.isSubsequentEventSelected) {
      if (events[0].categoryId === this.containerEventSelected.categoryId && events[0].srcPropertyId === this.containerEventSelected.srcPropertyId) {
        if (this.containerEventSelected.groupedEvents.filter(e => e.state !== 'Closed').length === 1) {
          this.onDeselectSubsequent();
          return;
        }
        if (events[0].groupedEvents.length > 0) {
          this.containerEventSelected = jQuery.extend(true, {}, events[0]);
          if (isNullOrUndefined(this.subsequentEventSelected)) {
            this.subsequentEventSelected = events[0].groupedEvents[0]; // Select the first subsequent
          }
          return;
        }
        if (this.subsequentEventSelected?.eventId != events[0].eventId && events[0].groupId === events[0].eventId + "#1") {
          if (!isNullOrUndefined(this.subsequentEventSelected)) {
            this.executeCommand([this.subsequentEventSelected], 'suspend', null); // Unselect previous subsequent
          }
          this.subsequentEventSelected = events[0]; // Select the subsequent event
        }
      } else {
        this.isSubsequentEventSelected = false;
        this.containerEventSelected = null;
        if (this.eventSubscription != null) {
          this.eventService.destroyEventSubscription(this.eventSubscription.id);
          this.eventService.removeConsumer();
          this.eventSubscription = null;
        }
      }
    } else if (events[0].container && events[0].groupedEvents?.length === 0 &&
      this.containerEventSelected != null && !this.isSubsequentEventSelected) {
      this.containerEventSelected = events[0].container;
      this.isSubsequentEventSelected = true;
      this.subsequentEventSelected = this.containerEventSelected.groupedEvents[0];
    }

    this.isNewNoteOpen = false;
    this.isEventSelected = false;

    let prevSelectedEvent;
    if (!isNullOrUndefined(this.selectedEvent)) {
      prevSelectedEvent = Object.assign(this.selectedEvent);
    }

    if (events.length > 0 && !isNullOrUndefined(events[0])) {
      this.selectedEvents = events;
      this.selectedEvent = this.mergeEvents(events);

      this.eventsSelected = this.translateService.instant('EVENTS.EVENTS-SELECTED', { eventNumber: this.selectedEvents.length });

      if (!this.IsInInvestigativeMode) {
        if (this.assistedTreatmentRights) {
          if (this.selectedEvent.oPId == null) {
            this.displayAssistedCommand = false;
          } else {
            this.displayAssistedCommand = true;
          }
        } else {
          this.displayAssistedCommand = false;
        }
      } else {
        this.displayAssistedCommand = false;
      }

      if (events.length === 1 && events[0].groupedEvents != null && events[0].groupedEvents.length > 0) {
        this.eventFilter = undefined;
        this.containerEventSelected = events[0];

        const categories: number[] = [events[0].categoryId];
        const srcPropertyIds: string[] = [events[0].srcPropertyId];
        this.eventFilter = { empty: false, categories, srcPropertyIds };

        this.adjustGridHeight(events[0]);
      } else if (events[0]?.groupedEvents?.length === 0 && // case in which a subsequent is received while a different event is selected in EL
        !isNullOrUndefined(events[0].container) &&
        !this.isSubsequentEventSelected) {  
        this.subsequentEventSelected = events[0]
        this.isSubsequentEventSelected = true;
        this.containerEventSelected = events[0].container;
      }

      clearInterval(this.interval);
      this.ngZone.runOutsideAngular(() => {
        if (this.selectedEvent.state.includes('WithTimer')) {
          this.interval = setInterval(() => {
            this.updateTimer(this.selectedEvent);
            this.cd.detectChanges();
          }, 1000);
        }
      });

      this.setBrowserObject(this.selectedEvent);

      if (NgZone.isInAngularZone()) {
        this.updateDisplayedData(prevSelectedEvent);
      } else {
        this.ngZone.run(() => {
          this.updateDisplayedData(prevSelectedEvent);
        });
      }
    }
  }

  private updateDisplayedData(prevSelectedEvent: Event): void {
    this.selectedEvent.state = this.getEventState(this.selectedEvent);
    this.selectedEventDisciplineIcon = this.selectedEvent.icon;
    this.isEventSelected = true;
    this.useCause = this.selectedEvent.messageText.length === 0;

    if (this.showMoreButton && prevSelectedEvent?.id !== this.selectedEvent?.id) {
      this.onRefreshNotes();
    }

    this.manageCommandVisibility();

    if (this.selectedEvent) {
      this.containerActions = this.setContainerActions(this.selectedEvent);
    }
  }

  private manageCommandVisibility(): void {
    this.displaySnapinControls = false;
    if (this.isEventSelected === true) {
      this.displaySnapinControls = true;
    }

    this.silUnsilCommand = 0;
    this.closeCommandEnabled = false;
    this.ackCommandEnabled = false;
    this.resCommandEnabled = false;
    this.goToSystemCommandEnabled = false;

    this.closeCommandPrimary = false;
    this.resCommandPrimary = false;
    this.silUnsilCommandPrimary = false;

    if (this.commandsDisabled) {
      return;
    }

    if (this.selectedEvent?.commands != null) {
      this.selectedEvent.commands.forEach((eventCommand: EventCommand) => {
        if (eventCommand != null) {
          if (eventCommand.Id === 'Ack') {
            this.ackCommandEnabled = true;
            this.resCommandPrimary = false;
            this.silUnsilCommandPrimary = false;
          }

          if (eventCommand.Id === 'Reset') {
            this.resCommandEnabled = true;
            if (this.ackCommandEnabled === false) {
              this.resCommandPrimary = true;
              this.silUnsilCommandPrimary = false;
            }
          }
          if (eventCommand.Id === 'Silence') {
            this.silUnsilCommand = 1;
            if (this.ackCommandEnabled === false && this.resCommandEnabled === false) {
              this.silUnsilCommandPrimary = true;
            }
          } else if (eventCommand.Id === 'Unsilence') {
            this.silUnsilCommand = 2;
            if (this.ackCommandEnabled === false && this.resCommandEnabled === false) {
              this.silUnsilCommandPrimary = true;
            }
          } else if (eventCommand.Id === 'Close') {
            if (this.ackCommandEnabled === false && this.resCommandEnabled === false) {
              if (this.selectedEvent.groupedEvents.length === 0) {
                this.silUnsilCommand = 0;
              } else {
                let allClose = true;
                this.selectedEvent.groupedEvents.forEach(child => {
                  if (child.commands.findIndex(x => x.Id === 'Close') === -1) {
                    allClose = false;
                  }
                });
                if (allClose === true) {
                  this.silUnsilCommand = 0;
                }
              }
              this.closeCommandPrimary = true;
              this.silUnsilCommandPrimary = false;
            }
            this.closeCommandEnabled = true;
          }
        }
      });

      // Check commands availability or rights
      if (this.selectedEvent.commands.length == 1 &&
        (this.selectedEvent.commands.find(c => c.Id == 'Select') || this.selectedEvent.commands.find(c => c.Id == 'Suspend'))) {
        this.ackCommandEnabled = false;
        this.resCommandPrimary = false;
        this.silUnsilCommandPrimary = false;
        this.closeCommandPrimary = false;
        return;
      }

      switch (this.selectedEvent.suggestedAction) {
        case 'Acknowledge':
          this.ackCommandEnabled = true;
          this.resCommandPrimary = false;
          this.silUnsilCommandPrimary = false;
          this.closeCommandPrimary = false;
          break;
        case 'Reset':
          this.ackCommandEnabled = false;
          this.resCommandPrimary = true;
          this.silUnsilCommandPrimary = false;
          this.closeCommandPrimary = false;
          break;
        case 'Close':
          this.closeCommandPrimary = true;
          this.resCommandPrimary = false;
          this.silUnsilCommandPrimary = false;
          break;
        default:
          break;
      }

      // if(this.selectedEvent.nextCommand !== "NoActionsPossible") {
      //     switch (this.selectedEvent.nextCommand) {
      //         case "Reset":
      //             this.ackCommandEnabled = false;
      //             this.resCommandPrimary = true;
      //             this.silUnsilCommandPrimary = false;
      //             this.closeCommandPrimary = false;
      //             break;
      //         case "Silence":
      //         case "Unsilence":
      //             this.silUnsilCommandPrimary = true;
      //             this.closeCommandPrimary = false;
      //             this.resCommandPrimary = false;
      //             break;
      //         case "Close":
      //             this.closeCommandPrimary = true;
      //             this.resCommandPrimary = false;
      //             this.silUnsilCommandPrimary = false;
      //             break;
      //         default:
      //             break;
      //     }
      // }
    }
  }

  private onContainerResize(): void {
    const elem: any = this.infoContainer.nativeElement;
    this.containerWidth = elem.offsetWidth;

    if (this.containerWidth < 360) {
      this.containerClass = 'minified';
    } else {
      this.containerClass = '';
    }
  }

  private findNodeInView(browserObjs: BrowserObject[], viewType: ViewType): BrowserObject {
    for (let i = 0; i < browserObjs.length; i++) {
      if (browserObjs.at(i).ViewType == viewType) {
        return browserObjs.at(i);
      }
    }

    return undefined;
  }

  private findNodeByDesignation(browserObjs: BrowserObject[], designation: string): BrowserObject {
    if (!isNullOrUndefined(designation)) {
      for (let i = 0; i < browserObjs.length; i++) {
        if (browserObjs.at(i).Designation == designation) {
          return browserObjs.at(i);
        }
      }
    }

    return undefined;
  }
}
