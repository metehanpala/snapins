import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TraceService } from '@gms-flex/services-common';
import { TraceModules } from '../../shared/trace-modules';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { EventsCommonServiceBase } from './events-common.service.base';
import { CnsHelperService, Event, EventService, GmsMessageData,
  MultiMonitorServiceBase, SearchOption, SystemBrowserServiceBase, ValidationInput, ViewInfo } from '@gms-flex/services';
import { isNullOrUndefined } from '@siemens/ngx-datatable';
import { DEFAULT_MODE_ID, FullPaneId, FullSnapInId, IHfwMessage, MessageParameters, ParamsSendMessage, QParam, StateService } from '@gms-flex/core';
import { EventsValidationHelperService } from './events-validation-helper.service';
import { Observable, Subject } from 'rxjs';
import { NonNullableFormBuilder } from '@angular/forms';

const INVESTIGATIVE_MODE_ID = 'investigative';
const systemManagerFrameId = 'system-manager';

@Injectable({
  providedIn: 'root'
})
export class EventsCommonService implements EventsCommonServiceBase, OnDestroy {

  public currActiveView: ViewInfo = null;
  public resetColumnsToDefault: Subject<boolean> = new Subject<boolean>();
  public isInAssistedMode = false;
  public treatedEvent: any = undefined;
  public autoAssistedEvents: Subject<any> = new Subject<any>();
  public isInInvestigativeMode = false;
  public destinationFrame: string = undefined;
  public mainDetailResizeSubject: Subject<boolean> = new Subject<boolean>();
  public mainDetailResize$ = this.mainDetailResizeSubject.asObservable();

  private readonly traceSvc: TraceServiceDelegate;
  private readonly subscriptions: any[] = [];
  private cachedSelectedEvents: Event[] = [];

  public get commonTranslateService(): TranslateService {
    return this.translateService;
  }

  constructor(
    traceService: TraceService,
    private readonly eventValidationService: EventsValidationHelperService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    private readonly messageBroker: IHfwMessage,
    private readonly stateService: StateService,
    private readonly eventService: EventService,
    private readonly translateService: TranslateService) {

    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.eventsCommon);

    this.subscriptions.push(this.cnsHelperService.activeView.subscribe(view => {
      this.currActiveView = view;
    }));
    this.subscriptions.push(this.stateService.layoutResetObs.subscribe(() => {
      this.resetColumnsToDefault.next(true);
    }));
  }

  public ngOnDestroy(): void {
    this.traceSvc.info('Destroying EventsCommonService instance.');

    this.subscriptions.forEach(sub => {
      if (!isNullOrUndefined(sub)) {
        sub.unsubscribe();
      }
    });
  }

  public subscribeColumnsResetting(): Observable<boolean> {
    return this.resetColumnsToDefault;
  }

  public goToAssistedTreatment(selectedEvents: any): Observable<any> {
    return this.eventService.eventCommand(selectedEvents, 'select', 'assistedtreatment');
  }

  public exitFromAssistedTreatment(selectedEvents: any): Observable<any> {
    return this.eventService.eventCommand(selectedEvents, 'suspend', 'assistedtreatment');
  }

  public goToInvestigativeTreatment(event: Event): void {
    if (event != null) {
      this.isInInvestigativeMode = true;
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
            // const openingFrameId = 'system-manager';
            let openingFrameId;
            if (!this.multiMonitorService.runsInElectron
              || (this.multiMonitorService.isManagerWithEvent()
              && this.multiMonitorService.isMainManager())
            ) {
              openingFrameId = 'system-manager';
            }
            let newQParam: QParam = { name: openingFrameId + '.SystemQParamService.primary', value: page.Nodes[nodesIndex].Designation };
            const newSelectionMessage: MessageParameters = { types: messageTypes, messageBody: body, qParam: newQParam };

            const elSelectionQParam: QParam = { name: 'event-list.EventQParamService.primary', value: this.computeId(event) };
            const elSelectionMessage: MessageParameters = { types: messageTypes, messageBody: body, qParam: elSelectionQParam };

            this.messageBroker.changeView(openingFrameId, "tree-view").subscribe(_changed => {
              setTimeout(() => {
                this.messageBroker.changeMode({
                  id: INVESTIGATIVE_MODE_ID,
                  relatedValue: event.id
                },
                openingFrameId, newSelectionMessage).subscribe((modeChanged: boolean) => {
                  // select treated event in Event List
                  this.messageBroker.selectViaQParamService(elSelectionMessage).subscribe(res => {
                    this.traceSvc.debug(TraceModules.eventInfo, 'Event selected in Event List.');
                  });
  
                  this.traceSvc.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
                  if (this.multiMonitorService.runsInElectron) {
                    // force usage of system-manager in qparam, since is the only one where to send the investigative
                    // otherwise, openingFrameId set to undefined will give us wrong newQParam
                    newQParam = { name: 'system-manager.SystemQParamService.primary', value: page.Nodes[nodesIndex].Designation };
                    const newSelectionMessage_multi = { types: messageTypes, messageBody: body, qParam: newQParam };
  
                    // Sync current mode with other managers
                    this.multiMonitorService.synchronizeUiState({
                      sendToItself: true,
                      state: {
                        mode: {
                          currentMode: {
                            id: INVESTIGATIVE_MODE_ID,
                            relatedValue: event.id
                          },
                          preferredFrameId: this.preferredFrameConfig(),
                          firstSelectionObj: newSelectionMessage_multi
                        }
                      }
                    });
                  }
                });
              }, 1000);
            });

            // Send Enter Assisted Treatment Command
            this.eventService.eventCommand([event], 'select', 'investigativetreatment');
          }
        });
    }
  }

  public exitFromInvestigativeTreatment(event: Event): void {
    if (event != null) {
      this.isInInvestigativeMode = false;
      if (!this.multiMonitorService.runsInElectron
        || (this.multiMonitorService.isManagerWithEvent()
        && this.multiMonitorService.isMainManager())
      ) {
        // Leave if in web client
        this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, undefined).subscribe((modeChanged: boolean) => {
          this.traceSvc.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
        });
      } else {
        // Leave if in electron
        this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, undefined).subscribe((modeChanged: boolean) => {
          this.traceSvc.debug(TraceModules.eventInfo, 'changeMode() completed. result: %s', modeChanged);
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

  // Cache the selected event
  public cacheSelectedEvents(events: Event[]): void {
    this.cachedSelectedEvents = events;
  }

  // Get the cache of selected event
  public getCachedSelectedEvents(): Event[] {
    return this.cachedSelectedEvents;
  }

  // Check if there's a selected event
  public hasCachedSelectedEvents(): boolean {
    return !!this.cachedSelectedEvents;
  }

  public resetCachedSelectedEvents(): void {
    this.cachedSelectedEvents = [];
  }

  public async getNoRightsLabel(): Promise<string> {
    let str = '';
    await this.translateService.get(['NO-APP-RIGHTS']).toPromise().then(string => {
      str = string['NO-APP-RIGHTS'];
    });
    return str;
  }

  private computeId(eventItem: Event): string {
    return (eventItem.groupedEvents.length === 0 ? eventItem.id : eventItem.id + '*');
  }

  /**
 * Determines and returns the preferred frame ID based on the current environment and status.
 * If running in Electron and not the main manager but is a manager with an event, it returns undefined to avoid qParam miscalculations.
 * Otherwise, it returns the systemManagerFrameId.
 */
  private preferredFrameConfig(): string | undefined {
    return (this.multiMonitorService.runsInElectron &&
      !this.multiMonitorService.isMainManager() &&
      this.multiMonitorService.isManagerWithEvent())
      ? undefined // Avoid qParam miscalculations in Electron if the event manager is detached
      : systemManagerFrameId; // Return systemManagerFrameId if it is not detached or it is a web client
  }
}
