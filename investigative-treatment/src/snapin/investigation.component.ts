/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Component, ElementRef, HostBinding, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FrameInfo, IHfwMessage, ISnapInConfig, MobileNavigationService, SnapInBase } from "@gms-flex/core";
import { CnsHelperService, CnsLabel, CnsLabelEn, Event, EventColors,
  EventFilter, EventService, EventStates, EventSubscription, MultiMonitorServiceBase, ValidationInput } from "@gms-flex/services";
import { AppContextService, isNullOrUndefined, TraceService } from "@gms-flex/services-common";
import { EventsValidationHelperServiceBase } from "@gms-flex/snapin-common";
import { TranslateService } from "@ngx-translate/core";
import { ConfirmationDialogResult, MenuItem, ResizeObserverService, SiActionDialogService, SiContentActionBarComponent } from "@simpl/element-ng";
import _ from "lodash";
import { Subscription } from "rxjs";

import { TraceModules } from "../shared/trace-modules";

const INVESTIGATIVE_MODE_ID = "investigative";
const DEFAULT_MODE_ID = "default";

@Component({
  selector: "gms-investigation",
  templateUrl: "./investigation.component.html",
  styleUrl: "./investigation.component.scss",
  standalone: false
})
export class InvestigationComponent extends SnapInBase implements OnInit, OnDestroy {

  @HostBinding("class.hfw-flex-container-column") public guardFrame = true;
  @HostBinding("class.hfw-flex-item-grow") public guardGrow = true;
  @HostBinding("class.snapin-container-overflow-auto") public guardOverflow = true;

  public secondaryActions: MenuItem[] = [];

  public primaryActions: MenuItem[] = [];

  public readonly minimumWidth: number = 1024;
  public isMobile: boolean | undefined;
  public containerWidth: number = 0;
  public contentActionClass = "";
  public contentStartClass = "";
  public investigativeMode = false;
  public currentEventId: string = null;
  public currentEvent: Event = null;
  public frameInfo: FrameInfo = null;
  public commandTexts: Map<string, string>;
  public commandIcons: Map<string, string>;
  public showInEvents = "";
  public showInSystem = "";
  public InvestigationMode1Text = "";
  public LeaveBtnText = "";
  public currCnsLabel: CnsLabel = null;
  public modalTitle = ""; // "Investigative Treatment"
  public modalText = ""; // "The event is not available any longer. Do you want to continue the investigation?"
  public modalBtnConfirm = ""; // "Yes"
  public modalBtnCancel = ""; // "No"

  @ViewChild("infoContainer", { static: true }) public infoContainer: ElementRef;
  @ViewChild("itActionBar") public itActionBar: SiContentActionBarComponent;

  private readonly subscriptions: Subscription[] = [];
  private eventSubscription: EventSubscription = null;
  private availableModes: string[];
  private readonly isLeaveInvestigationDialogOpen: boolean = false;
  private isDialogVisible: boolean = false;
  private confirmationDlg_Obs: any = undefined;

  constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly appContextService: AppContextService,
    private readonly eventValidationService: EventsValidationHelperServiceBase,
    private readonly translateService: TranslateService,
    private readonly snapinConfig: ISnapInConfig,
    private readonly eventService: EventService,
    private readonly traceService: TraceService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly multimonitorService: MultiMonitorServiceBase,
    private readonly ngZone: NgZone,
    private readonly siModal: SiActionDialogService,
    private readonly resizeObserver: ResizeObserverService,
    private readonly mobileNavigationService: MobileNavigationService) {

    super(messageBroker, activatedRoute);
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.resizeObserver.observe(this.infoContainer.nativeElement, 100, true, true).subscribe(() => this.onContainerResize()));
    if (this.multimonitorService.runsInElectron) {
      this.subscriptions.push(this.multimonitorService.onCurrentManagerConfigurationChanged().subscribe(() => {
        this.setContentActions(this.currentEvent);
      }));
    }
    this.availableModes = this.snapinConfig.getAvailableModes();

    if (this.availableModes != null) {
      this.subscriptions.push(this.messageBroker.getCurrentWorkAreaFrameInfo().subscribe(info => {
        this.onGetCurrentWorkAreaFrameInfo(info);
      }));
      this.subscriptions.push(this.messageBroker.getCurrentMode().subscribe(mode => {
        this.onGetCurrentMode(mode);
      }));
    }

    this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(cnsLabel => {
      this.currCnsLabel = cnsLabel;
    }));

    // Auto close investigative treatment when going into mobile view
    this.isMobile = this.mobileNavigationService.mobileOnlyVisibilityLast;
    this.subscriptions.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      this.isMobile = isVisible;
      if (isVisible) {
        if (this.investigativeMode) {
          this.leaveTreatment();
        }
      }
    }));
  }

  public subscribeEvents(): void {
    if (this.eventSubscription === null) {
      const eventFilter: EventFilter = { empty: false, id: this.currentEventId };
      this.eventSubscription = this.eventService.createEventSubscription(eventFilter, true);
      this.eventSubscription.events.subscribe(
        values => this.onEventsNotification(values),
        error => this.traceService.error(TraceModules.snapinName, "subscribeEvents() error: %s", error.toString())
      );
    }
  }
  public switchNextFrame(cmd: string): void {
    this.messageBroker.switchToNextFrame(cmd);
  }

  public onCommandClick(commandName: string, event: Event): void {
    if (commandName !== "") {
      const eventsToCommand: Event[] = [];
      if (!isNullOrUndefined(event)) {
        const eventIds: string[] = [];
        eventIds.push(event.srcPropertyId);
        this.eventValidationService.validateEventCommands(eventIds, TraceModules.snapinName).subscribe((validationInput: ValidationInput) => {
          // Validate the user has the right to edit the event
          if (validationInput) {
            if (event.groupedEvents.length > 0) {
              event.groupedEvents.forEach(subsequentEvent => {
                if (this.hasCommand(subsequentEvent, commandName, true) && !eventsToCommand.find(e => e.id == subsequentEvent.id)) {
                  eventsToCommand.push(subsequentEvent);
                }
              });
            } else if (this.hasCommand(event, commandName, true) && !eventsToCommand.find(e => e.id == event.id)) {
              eventsToCommand.push(event);
            }

            if (eventsToCommand.length > 0) {
              this.eventService.eventCommand(eventsToCommand, commandName, "investigativetreatment", validationInput);
            }
            return;
          }
        }, error => {
          this.traceService.error(TraceModules.snapinName, "onCommandClick(): Validation WSI Error. Details: ", error);
        });
      }
    }
  }

  public unSubscribeEvents(): void {
    if (this.eventSubscription != null) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
      this.eventSubscription = null;
    }
  }

  public onGetCurrentWorkAreaFrameInfo(info) {
    this.frameInfo = info;
    this.setPrimaryAction();
  }

  public onGetCurrentMode(mode: any) {
    this.currentEventId = mode.relatedValue;
    if (mode.id === INVESTIGATIVE_MODE_ID) {
      this.investigativeMode = true;
      this.setupDefaultCulture();
      this.setupUserCulture();
    } else {
      if (this.investigativeMode && this.confirmationDlg_Obs) {
        this.confirmationDlg_Obs.unsubscribe();
        this.confirmationDlg_Obs = undefined;
        this.isDialogVisible = false;
      }
      this.investigativeMode = false;
      this.unSubscribeEvents();
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });
    if (this.eventSubscription != null) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
      this.eventSubscription = null;
    }
  }

  public leaveTreatment(frameId: string = null): void {
    if (!this.multimonitorService.runsInElectron) {
      // in web client
      this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, this.frameInfo.id).subscribe((modeChanged: boolean) => {
        this.traceService.debug(TraceModules.snapinName, "changeMode() completed. result: %s", modeChanged);
        if (frameId) {
          this.switchToNextFrame(frameId);
        }
      });
    } else {
      // In electron
      this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, undefined).subscribe((modeChanged: boolean) => {
        this.traceService.debug(TraceModules.snapinName, "changeMode() completed. result: %s", modeChanged);
      });

      this.multimonitorService.synchronizeUiState({
        sendToItself: true,
        state: {
          mode: {
            currentMode: {
              id: DEFAULT_MODE_ID,
              relatedValue: null
            }
          }
        }
      }
      );
    }

    // Send Close Investigative Treatment Command
    if (this.currentEvent.stateId !== EventStates.Closed) {
      this.eventService.eventCommand([this.currentEvent], "suspend", "investigativetreatment");
      if (this.frameInfo.id === "event-list") {
        this.eventService.eventCommand([this.currentEvent], "select");
      }
    }
  }

  public onEventsNotification(events: Event[]): void {
    if (isNullOrUndefined(this.currentEventId) || events.length <= 0) {
      return;
    }

    let evtWithCmds = events[0];
    events.forEach(e => {
      if (!this.skipEvent(events, e) && e.commands.length > evtWithCmds.commands.length) {
        evtWithCmds = e;
      }
    });

    this.currentEvent = evtWithCmds;
    this.setContentActions(this.currentEvent);

    // dialog to close investigation if event closes
    if (events[0].stateId === EventStates.Closed && this.investigativeMode && !this.isDialogVisible) {
      this.isDialogVisible = true;
      // We must ensure that the dialogs run INTO the ngZone otherwise change detection is not triggerd and they do not show up.
      this.ngZone.run(() => {
        this.confirmationDlg_Obs = this.siModal.showActionDialog({
          type: "confirmation",
          message: this.modalText,
          heading: this.modalTitle,
          confirmBtnName: this.modalBtnConfirm,
          declineBtnName: this.modalBtnCancel
        }).subscribe({
          next: confirmation => {
            switch (confirmation) {
              case ConfirmationDialogResult.Confirm:
                this.leaveTreatment();
                this.isDialogVisible = false;
                break;
              default:
                this.isDialogVisible = false;
                break;
            }
          },
          error: () => { this.isDialogVisible = false; }
        });
      });
    }
  }

  public getEventDisciplineColor(): string {
    return `rgb(${this.currentEvent.category.colors.get(EventColors.ButtonGradientDark)})`;
  }

  public getEventDate(event: Event): string {
    return event.originalCreationTime.toLocaleDateString(this.translateService.currentLang);
  }

  public getEventTime(event: Event): string {
    return event.originalCreationTime.toLocaleTimeString(this.translateService.currentLang);
  }

  public getSrcObjectName(event: Event, currCnsLabel: CnsLabel): string {
    if (currCnsLabel != null) {
      switch (currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
        case CnsLabelEn.DescriptionAndAlias:
        case CnsLabelEn.DescriptionAndName:
          return event.srcDescriptor;
        case CnsLabelEn.Name:
        case CnsLabelEn.NameAndAlias:
        case CnsLabelEn.NameAndDescription:
          return event.srcName;
        default:
          break;
      }
      return "";
    }
  }

  public getSrcObjectDescription(event: Event, currCnsLabel: CnsLabel): string {
    if (currCnsLabel != null) {
      switch (currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
        case CnsLabelEn.Name:
          break;
        case CnsLabelEn.DescriptionAndName:
          return event.srcName;
        case CnsLabelEn.NameAndDescription:
          return event.srcDescriptor;
        case CnsLabelEn.DescriptionAndAlias:
        case CnsLabelEn.NameAndAlias:
          return event.srcAlias;
        default:
          break;
      }
      return "";
    }
  }

  public hasDescription(event: Event, currCnsLabel: CnsLabel): boolean {
    const description = this.getSrcObjectDescription(event, currCnsLabel);

    return typeof description !== "undefined";
  }

  /*
  * Method to handle the following cases:
  * 1. OperatingProcedure with ForceManualClose --> The "Close" is followed by a "ReadyToBeClosed"
  * 2. OperatingProcedure with MandatoryStep    --> The "Close" is followed by a "WaitingOPCompletion"
  */
  private skipEvent(events: Event[], event: Event): boolean {
    if (event.oPId && event.oPId.length > 0 && event.stateId === EventStates.Closed &&
      events.find(ev => (ev.id === event.id && ev.srcState === "Quiet" &&
                        (ev.stateId === EventStates.ReadyToBeClosed ||
                          ev.stateId === EventStates.WaitingOPCompletion)))) {
      return true;
    }
    return false;
  }

  private checkEventClosure(events: Event[], currentEvent: Event, currentEventId: string): boolean {
    if (currentEventId !== null && events.length > 0) {
      const evtToProcess = _.uniqBy(events, "id").find(ev => ev.id === currentEventId);
      if (evtToProcess !== undefined) {
        if (!this.skipEvent(events, evtToProcess) && evtToProcess.stateId === EventStates.Closed) {
          return true;
        }
      }
    }
    return false;
  }

  private setPrimaryAction() {
    const frame = this.frameInfo.id;
    const systemManagerId = "system-manager";
    const eventListId = "event-list";
    let title: string;
    let targetFrame: string;

    if (this.multimonitorService.runsInElectron) { // desktop app
      /* main manager with events attached */
      if (this.multimonitorService.isMainManager() && this.multimonitorService.isManagerWithEvent()) {
        if (frame !== systemManagerId && frame !== eventListId) { // e.g. about frame
          title = this.showInSystem;
          targetFrame = systemManagerId;
        }
        if (frame === systemManagerId) {
          title = this.showInEvents;
          targetFrame = eventListId;
        }
        if (frame === eventListId) {
          title = this.showInSystem;
          targetFrame = systemManagerId;
        }
      }
      /* main manager with events detached */
      if (this.multimonitorService.isMainManager() && !this.multimonitorService.isManagerWithEvent()) {
        if (frame !== systemManagerId) { // e.g. about frame
          title = this.showInSystem;
          targetFrame = systemManagerId;
        } else {
          title = undefined;
        }
      }
      /* additional system manager */
      if (!this.multimonitorService.isMainManager() && !this.multimonitorService.isManagerWithEvent()) {
        if (frame !== systemManagerId) { // e.g. about frame
          title = this.showInSystem;
          targetFrame = systemManagerId;
        } else {
          title = undefined;
        }
      } /* no "show in system" action available on detached event manager window */
    } else { // web client
      title = frame === systemManagerId ? this.showInEvents : this.showInSystem;
      targetFrame = frame === systemManagerId ? eventListId : systemManagerId;
    }

    if (this.currentEvent?.stateId === EventStates.Closed) {
      // Not showing the "Show in Events" button when the event is closed.
      return;
    }

    const menuItem: MenuItem = {
      title: title,
      disabled: false,
      action: (): void => this.switchNextFrame(targetFrame)
    };

    if (menuItem.title) {
      if (this.primaryActions.length > 0) {
        /* add new "show in system/events" entry as first element if ack event is already there */
        if (this.primaryActions[0].title !== this.showInSystem && this.primaryActions[0].title !== this.showInEvents) {
          this.primaryActions.unshift(menuItem);
        } else { /* replace the existing entry if "show in system/events" is the only option */
          this.primaryActions[0] = menuItem;
        }
      } else {
        this.primaryActions.push(menuItem);
      }
    } else { // remove show in system/events btn if it is not a valid option
      const index = this.primaryActions.findIndex(item => item.title === this.showInEvents || this.showInSystem);
      if (index !== -1) {
        this.primaryActions.splice(index, 1);
      }
    }
  }

  private onContainerResize(): void {
    const elem: any = this.infoContainer.nativeElement;
    const width = elem.offsetWidth;
    const isGrowing = (width - this.containerWidth) >= 0;
    this.containerWidth = width;

    if (this.containerWidth < this.minimumWidth) {
      this.contentActionClass = "it-end-minified";
      this.contentStartClass = "it-start-maximized";
    } else {
      if (isGrowing || this.itActionBar?.viewType !== "mobile") {
        this.contentActionClass = "it-end";
        this.contentStartClass = "it-start";
      } else {
        this.contentActionClass = "it-end-minified";
        this.contentStartClass = "it-start-maximized";
      }
    }
  }

  private getSuggestedAction(evt: any): any {
    const cmd = this.commandTexts.get(evt.suggestedAction.toLowerCase());
    const cmdId = Array.from(this.commandTexts.keys()).find(k => evt.suggestedAction.toLowerCase().startsWith(k));
    if (!isNullOrUndefined(cmd)) {
      const title = cmd;
      const icon = this.commandIcons.get(evt.suggestedAction.toLowerCase());
      const action = (): void => { this.onCommandClick(cmdId, evt); };
      return { title: title, icon: icon, action: action };
    }
    return null;
  }

  private initLoadPage(strings: any): void {
    this.commandTexts = new Map([
      ["ack", strings["ACK-COMMAND-TEXT"]],
      ["reset", strings["RESET-COMMAND-TEXT"]],
      ["silence", strings["SILENCE-COMMAND-TEXT"]],
      ["unsilence", strings["UNSILENCE-COMMAND-TEXT"]],
      ["close", strings["CLOSE-COMMAND-TEXT"]]
    ]);

    this.commandIcons = new Map([
      ["ack", "element-alarm-tick"],
      ["reset", "element-undo"],
      ["silence", "element-horn-off"],
      ["unsilence", "element-horn"],
      ["close", "element-cancel"]
    ]);

    this.showInSystem = strings["SHOW-IN-SYSTEM"];
    this.showInEvents = strings["SHOW-IN-EVENTS"];
    this.InvestigationMode1Text = strings["INVESTIGATION-MODE-1-TEXT"];
    this.LeaveBtnText = strings["LEAVE-BTN-TEXT"];
  }

  private hasCommand(event: Event, command: string, ignoreCase: boolean = false): boolean {
    return event.commands.findIndex(cmd => {
      if (ignoreCase) {
        return cmd.Id.toLocaleLowerCase() === command.toLocaleLowerCase();
      }
      return cmd.Id === command;
    }) !== -1;
  }

  private setContentActions(event: Event): void {
    this.primaryActions = [];

    this.setPrimaryAction();

    let primaryCmd = event.commands.find(c => event.suggestedAction?.toLowerCase().startsWith(c.Id.toLowerCase()));
    let primaryActionId = null;

    if (!isNullOrUndefined(primaryCmd)) {
      const primaryAction = {
        title: this.commandTexts.get(primaryCmd.Id.toLowerCase()),
        icon: this.commandIcons.get(primaryCmd.Id.toLowerCase()),
        disabled: false,
        action: (): void => this.onCommandClick(primaryCmd.Id, event)
      };
      primaryActionId = primaryAction.title;
      this.primaryActions.push(primaryAction);
    } else {
      const suggestedAction = this.getSuggestedAction(event);
      if (isNullOrUndefined(suggestedAction)) {
        event.commands.forEach(cmd => {
          if (cmd.Id !== "Select" && cmd.Id !== "Suspend") {
            primaryCmd = cmd;
            if (!isNullOrUndefined(primaryCmd)) {
              const primaryAction = {
                title: this.commandTexts.get(primaryCmd.Id.toLowerCase()),
                icon: this.commandIcons.get(primaryCmd.Id.toLowerCase()),
                disabled: false,
                action: (): void => this.onCommandClick(primaryCmd.Id, event)
              };
              primaryActionId = primaryAction.title;
              this.primaryActions.push(primaryAction);
            }
          }
        });
      } else {
        primaryActionId = suggestedAction.title;
        this.primaryActions.push(suggestedAction);
      }
    }

    // Set secondary actions
    this.secondaryActions = [];
    this.commandTexts.forEach(cmd => {
      const action = {
        title: cmd,
        disabled: false,
        action: (): void => this.onCommandClick(secondaryCmd.Id, event) };

      if (event.groupedEvents.length === 0 && primaryActionId === "Close" && (action.title === "Silence" || action.title === "Unsilence")) {
        action.disabled = true;
      }

      const secondaryCmd = event.commands.find(c => c.Id === cmd);
      if (!isNullOrUndefined(secondaryCmd) && secondaryCmd.Id !== primaryActionId) {
        this.secondaryActions.push(action);
      } else {
        if (cmd !== primaryActionId) {
          action.disabled = true;
          this.secondaryActions.push(action);
        }
      }
    });

    // Clean up secondary actions
    const silence = this.secondaryActions.find(c => c.title === "Silence");
    const unsilence = this.secondaryActions.find(c => c.title === "Unsilence");

    if (!isNullOrUndefined(silence) && !silence.disabled) {
      const indexUnsilence = this.secondaryActions.findIndex(c => c.title === "Unsilence");
      this.secondaryActions.splice(indexUnsilence, 1);
    } else if (!isNullOrUndefined(unsilence) && !unsilence.disabled) {
      const indexSilence = this.secondaryActions.findIndex(c => c.title === "Silence");
      this.secondaryActions.splice(indexSilence, 1);
    } else {
      const indexUnsilence = this.secondaryActions.findIndex(c => c.title === "Unsilence");
      this.secondaryActions.splice(indexUnsilence, 1);
    }
  }

  private setupDefaultCulture() {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe({ next: defaultCulture => {
      this.initTranslateServiceWithDefaultCulture(defaultCulture);
    },
    error: err => {
      this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      this.getTranslationsAndStartInitialJobs();
    }
    }));
  }

  private setupUserCulture() {
    this.subscriptions.push(this.appContextService.userCulture.subscribe({ next: userCulture => {
      this.initTranslateServiceWithUserCulture(userCulture);
    },
    error: err => {
      this.traceService.warn(TraceModules.snapinName, "No user culture set on appContextService!");
    }
    }));
  }

  private initTranslateServiceWithDefaultCulture(defaultCulture: any) {
    if (defaultCulture !== null) {
      this.translateService.setDefaultLang(defaultCulture);
    } else {
      this.traceService.warn(TraceModules.snapinName, "No default culture set on appContextService!");
    }
    this.getTranslationsAndStartInitialJobs();
  }

  private initTranslateServiceWithUserCulture(userCulture: any) {
    if (userCulture !== null) {
      // init translate service with user culture of the logged in user
      this.translateService.use(userCulture).subscribe({ next: _res => {
        this.traceService.info(TraceModules.snapinName, `Use  user culture: ${userCulture}`);
        // Translate strings with userCulture
        this.getTranslationsAndStartInitialJobs();
      },
      error: err => {
        this.traceService.warn(TraceModules.snapinName, "No user culture set on appContextService!");
      } });
    } else {
      this.traceService.warn(TraceModules.snapinName, "No user culture set on appContextService!");
    }
    this.getTranslationsAndStartInitialJobs();
  }

  private getTranslationsAndStartInitialJobs(): void {
    this.translateService.get([
      "ACK-COMMAND-TEXT",
      "RESET-COMMAND-TEXT",
      "SILENCE-COMMAND-TEXT",
      "UNSILENCE-COMMAND-TEXT",
      "CLOSE-COMMAND-TEXT",
      "SHOW-IN-SYSTEM",
      "SHOW-IN-EVENTS",
      "INVESTIGATION-MODE-1-TEXT",
      "LEAVE-BTN-TEXT",
      "MODAL-TITLE",
      "MODAL-TEXT",
      "MODAL-BTN-CONFIRM",
      "MODAL-BTN-CANCEL"
    ]).toPromise().then(strings => {
      this.modalTitle = strings["MODAL-TITLE"];
      this.modalText = strings["MODAL-TEXT"];
      this.modalBtnConfirm = strings["MODAL-BTN-CONFIRM"];
      this.modalBtnCancel = strings["MODAL-BTN-CANCEL"];
      this.initLoadPage(strings);
      this.subscribeEvents();
    });
  }

}
