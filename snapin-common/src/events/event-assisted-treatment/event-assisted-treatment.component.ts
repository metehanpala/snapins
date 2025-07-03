import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { AppContextService, TraceService } from '@gms-flex/services-common';

import { FullQParamId, FullSnapInId, IHfwMessage, ISnapInConfig, MessageParameters, ParamsSendMessage, QParam, SnapInBase } from '@gms-flex/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  BrowserObject, CnsHelperService, Event, EventFilter, EventService,
  GmsMessageData, GmsSelectionType, MultiMonitorServiceBase, ObjectMessageType, SearchOption, SystemBrowserServiceBase, ViewInfo
} from '@gms-flex/services';
import { TraceModules } from '../../shared/trace-modules';
import { traceModule } from '../../q-param-services/event-qparam.service';

const INVESTIGATIVE_MODE_ID = 'investigative';
const DEFAULT_MODE_ID = 'default';
const sysMan = 'system-manager';
const changeMode = 'changeMode() completed. result: ';

/**
 * The controller/viewmodel of the Event Details viewer snapin.
 */

@Component({
  selector: 'gms-event-assisted-treatment',
  templateUrl: './event-assisted-treatment.component.html',
  styleUrl: './event-assisted-treatment.component.scss',
  standalone: false
})

export class EventAssistedTreatmentComponent extends SnapInBase implements OnInit, OnDestroy {

  private static readonly systemManagerFrameId: string = sysMan;

  @Input() public eventsSelected: Observable<Event[]>;
  public evSelected = new Event();

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.panel') public guardPanel = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;

  public displaySnapinControls = false;
  public silUnsilCommand = 0;

  public selectedEventsSubject: BehaviorSubject<Event[]> = new BehaviorSubject([]);
  public selectedEvents: Observable<Event[]> = this.selectedEventsSubject.asObservable();

  public selectedBrowserObjects: BrowserObject[] = [];
  public useCause = false;
  public selectedEventDisciplineIcon = '';
  public ackCommandEnabled = false;
  public resCommandEnabled = false;
  public closeCommandEnabled = false;
  public goToSystemCommandEnabled = false;
  public showID = true;

  public resCommandPrimary = false;
  public closeCommandPrimary = false;
  public silUnsilCommandPrimary = false;

  public previousModeId: string;
  public currentModeId: string;
  public isInInvestigativeMode = false;
  public currActiveView: ViewInfo = null;

  public snapInId: FullSnapInId = this.fullId;

  private readonly subscriptions: Subscription[] = [];
  private userLang: string;
  private skipHfwMessage = false; // to skip the first HFW message when related to a closed event

  private readonly availableModes: string[];
  /**
   * Constructor
   * @param traceService The trace service.
   * @param messageBroker
   * @param activatedRoute
   */
  public constructor(
    private readonly traceService: TraceService,
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly eventService: EventService,
    private readonly snapinConfig: ISnapInConfig,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly multiMonitorService: MultiMonitorServiceBase
  ) {

    super(messageBroker, activatedRoute);
  }

  public ngOnInit(): void {
    this.snapInId = this.fullId;

    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture != null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.traceService.warn(TraceModules.eventAssistedTreatment, 'No default Culture for appContextService');
        this.translateService.setDefaultLang(this.userLang === undefined ? this.translateService.getBrowserLang() :
          this.userLang);
      }
    }));

    this.subscriptions.push(this.cnsHelperService.activeView.subscribe(view => {
      this.currActiveView = view;
    }));

    this.subscriptions.push(this.messageBroker.getCurrentMode().subscribe(mode => {
      this.previousModeId = this.currentModeId;
      this.currentModeId = mode.id;
      if (this.previousModeId === undefined && this.currentModeId !== INVESTIGATIVE_MODE_ID) {
        this.skipHfwMessage = true;
      }
      this.isInInvestigativeMode = this.currentModeId === INVESTIGATIVE_MODE_ID;
    }));

    this.subscriptions.push(this.messageBroker.getMessage(this.fullId).subscribe(mesg => {
      this.onHfwMessage(mesg);
    }));

    this.subscriptions.push(this.eventsSelected.subscribe(value => {
      if (value) { // jhgihuvgvc
        this.evSelected = value[0];
      }
    })); // gfgcctr

    this.userLang = this.translateService.getBrowserLang();
  }

  public onHfwMessage(mesg: any): void {
    if (mesg == null) {
      this.selectedEventsSubject.next(null);
      this.skipHfwMessage = false;
      return;
    }

    if (this.skipHfwMessage && this.checkEventAvailability(mesg)) {
      this.skipHfwMessage = false;
      return;
    }
    this.skipHfwMessage = false;

    if (mesg.data && mesg.selectionType === GmsSelectionType.None) {
      this.selectedEventsSubject.next(null);
      this.displaySnapinControls = false;
      return;
    }
    const eventItems: Event[] = mesg.customData as Event[];

    if (eventItems == null || eventItems.length === 0) {
      return;
    }

    let i = 0;
    for (const eventItem of eventItems) {
      if (eventItem.state === 'Closed') {
        eventItems.splice(i);
      }
      i++;
    }

    if (eventItems.length === 0) {
      return;
    }

    this.displaySnapinControls = true;
    this.selectedEventsSubject.next(eventItems);
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });
  }

  public goToSystem(event: Event): void {
    if (event != null) {
      this.systemBrowserService.searchNodes(event.srcSystemId, event.srcPropertyId, undefined, SearchOption.objectId)
        .toPromise()
        .then(page => {
          if (page.Nodes.length > 0) {
            let msgBody: GmsMessageData;
            let types: string[];
            const numInstances: number = page.Nodes.length;

            page.Nodes.sort(CnsHelperService.compareBrowserObjects);
            msgBody = new GmsMessageData([page.Nodes[0]]);
            types = [page.Nodes[0].Attributes.ManagedTypeName];

            for (let i = 1; numInstances > 1 && i < numInstances; i++) {
              if (this.currActiveView?.containsObject(page.Nodes[i])) {
                msgBody = new GmsMessageData([page.Nodes[i]]);
                types = [page.Nodes[i].Attributes.ManagedTypeName];
                break;
              }
            }
            const fullQParamId = new FullQParamId(sysMan, 'SystemQParamService', 'primary');
            const qParam = { name: fullQParamId.fullId(), value: page.Nodes[0].Designation };
            const message: MessageParameters = {
              messageBody: msgBody,
              qParam,
              types
            };
            if (!this.multiMonitorService.runsInElectron) {
              this.switchToNextFrame(EventAssistedTreatmentComponent.systemManagerFrameId, message).subscribe((frameChanged: boolean) => {
                this.traceService.debug(TraceModules.eventAssistedTreatment, 'goToSystem() completed. result: %s', frameChanged);
              });

              // send switchframe object to main window if running in Electron
            } else {
              this.multiMonitorService.sendObjectToMainManager({
                type: ObjectMessageType.SwitchFrame,
                data: { frame: EventAssistedTreatmentComponent.systemManagerFrameId, msg: message }
              });
            }
          }
        });
    }
  }

  public goToInvestigativeTreatment(event: Event): void {
    if (event != null) {
      this.systemBrowserService.searchNodes(event.srcSystemId, event.srcObservedPropertyId, undefined, SearchOption.objectId)
        .toPromise()
        .then(page => {
          if (page.Nodes.length > 0) {
            let body: GmsMessageData;
            let messageTypes: string[];
            const numInstances: number = page.Nodes.length;
            let nodesIndex = 0;

            page.Nodes.sort(CnsHelperService.compareBrowserObjects);
            body = new GmsMessageData([page.Nodes[nodesIndex]]);
            messageTypes = [page.Nodes[nodesIndex].Attributes.ManagedTypeName];

            for (let i = 1; numInstances > 1 && i < numInstances; i++) {
              if (this.currActiveView?.containsObject(page.Nodes[i])) {
                body = new GmsMessageData([page.Nodes[i]]);
                messageTypes = [page.Nodes[i].Attributes.ManagedTypeName];
                nodesIndex = i;
                break;
              }
            }
            // const openingFrameId = sysMan;
            let openingFrameId;
            if (!this.multiMonitorService.runsInElectron
              || (this.multiMonitorService.isManagerWithEvent()
              && this.multiMonitorService.isMainManager())
            ) {
              openingFrameId = sysMan;
            }
            const newQParam: QParam = { name: openingFrameId + '.SystemQParamService.primary', value: page.Nodes[nodesIndex].Designation };
            const newSelectionMessage: MessageParameters = { types: messageTypes, messageBody: body, qParam: newQParam };

            this.messageBroker.changeMode({
              id: INVESTIGATIVE_MODE_ID,
              relatedValue: event.id
            },
            openingFrameId, newSelectionMessage).subscribe((modeChanged: boolean) => {
              this.traceService.debug(TraceModules.eventAssistedTreatment, changeMode + '%s', modeChanged);
            });

            if (this.multiMonitorService.runsInElectron) {
              // Sync current mode with other managers
              this.multiMonitorService.synchronizeUiState({
                sendToItself: true,
                state: {
                  mode: {
                    currentMode: {
                      id: INVESTIGATIVE_MODE_ID,
                      relatedValue: event.id
                    },
                    preferredFrameId: openingFrameId,
                    firstSelectionObj: newSelectionMessage
                  }
                } });
            }

            // Send Enter Assisted Treatment Command
            this.eventService.eventCommand([event], 'select', 'investigativetreatment');
          }
        });
    }
  }

  public exitFromInvestigativeTreatment(event: Event): void {
    if (event != null) {
      if (!this.multiMonitorService.runsInElectron
        || (this.multiMonitorService.isManagerWithEvent()
        && this.multiMonitorService.isMainManager())
      ) {
        // Leave if in web client
        this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, this.fullId.frameId).subscribe((modeChanged: boolean) => {
          this.traceService.debug(TraceModules.eventAssistedTreatment, changeMode + '%s', modeChanged);
        });
      } else {
        // Leave if in electron
        this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, undefined).subscribe((modeChanged: boolean) => {
          this.traceService.debug(TraceModules.eventAssistedTreatment, changeMode + '%s', modeChanged);
        });

        this.multiMonitorService.synchronizeUiState({
          sendToItself: true,
          state: {
            mode: {
              currentMode: {
                id: DEFAULT_MODE_ID,
                relatedValue: null
              }
            }
          } });
      }

      // Send Close Assisted Treatment Command
      const eventIds: string[] = [];
      eventIds.push(event.id);
      this.eventService.eventCommand([event], 'suspend', 'investigativetreatment');
    }
  }

  private checkEventAvailability(mesg: any): boolean {
    const customData: any = mesg?.customData as Event[];

    if (customData && customData.length > 0) {
      return this.eventService.getAllEventsFilteredByCategory().find(ev => ev.eventId === customData[0].eventId) === undefined;
    }
    return false;
  }
}
