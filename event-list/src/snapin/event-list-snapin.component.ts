'use strict';
import { Component, ElementRef, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HfwFilterPillData, UnsavedDataDialogResult, UnsaveDialogService } from '@gms-flex/controls';
import { DEFAULT_MODE_ID, FullPaneId, FullQParamId, FullSnapInId, IHfwMessage, ISnapInConfig, ParamsSendMessage, QParam,
  SnapInBase, StateService, UnsavedDataReason } from '@gms-flex/core';
import {
  BrowserObject, Category, CategoryService, CnsHelperService, Event, EventColors, EventDateTimeFilterValues, EventFilter,
  EventService, EventSubscription, GmsMessageData, gmsNoSelectionMessageType, GmsSelectionType, MultiMonitorServiceBase, SearchOption,
  SystemBrowserServiceBase, SystemsServiceBase, Tables, TablesServiceBase, TextEntry, ViewInfo } from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { enumEventType, EventsCommonServiceBase, GridEvent } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, TreeItem } from '@simpl/element-ng';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Observer, of, Subject, Subscription } from 'rxjs';

import { checked, DialogData, DialogExitCode } from '../filter-dialog';
import { EventFilterDlgComponent } from '../filter-dialog/filter-dialog.component';
import { TraceModules } from '../shared/trace-modules';
import { EventSelectionMessage, EventUpdateNotificationMessage } from './data.model';
/**
 */

const SND_MSG_COMPLETED = 'sendMessage() completed. result: %s';
const INVESTIGATIVE_MODE = 'investigative';
const cabLable = 'EVENTS.CONTENT-ACTION-FILTER-LABEL';
const unchecked = 'unchecked';
const FILTERS_MAXNUM = 80;

@Component({
  selector: 'gms-event-list-snapin',
  templateUrl: './event-list-snapin.component.html',
  styleUrl: '../gms-event-list-snapin.scss',
  standalone: false
})

export class EventListSnapInComponent extends SnapInBase implements OnInit, OnDestroy {

  // #region filter labels and variables
  public aliasFilterLabel = ''; // "Alias";
  public designationFilterLabel = ''; // "Designation";
  public sourcePropertyIdFilterLabel = ''; // "Designation";
  public nameFilterLabel = ''; // "Name";
  public descriptionFilterLabel = ''; // "Description";
  public dateTimeFilterLabel = ''; // "Date and time";
  public hiddenEventsFilterLabel = ''; // "Hidden Events";
  public hiddenEventsShowLabel = ''; // "Show";
  public timeLastQuarterHourFilterLabel = ''; // "Last quarter of an hour";
  public timeLastHalfHourFilterLabel = ''; // "Last half an hour";
  public timeLastHourFilterLabel = ''; // "Last hour";
  public timeLastNightFilterLabel = ''; // "Last night";
  public timeYesterdayFilterLabel = ''; // "Yesterday";
  public timeTodayFilterLabel = ''; // "Today";
  public filterClearMsg = ''; // "No filters applied.";
  public disciplineFilterLabel = ''; // "Discipline";
  public categoryFilterLabel = ''; // "Category";
  public stateFilterLabel = ''; // "Event State";
  public srcStateFilterLabel = ''; // "Source State";
  public eventStateUnprocessed = ''; // "Unprocessed";
  public eventStateReadyToBeReset = ''; // "Ready to be Reset";
  public eventStateReadyToBeClosed = ''; // "Ready to be Closed";
  public eventStateWaitingForCondition = ''; // "Waiting for Condition";
  public eventStateClosed = ''; // "Closed";
  public sourceStateActive = ''; // "Active";
  public sourceStateQuiet = ''; // "Quiet";
  public contentActionFilterLabel = ''; // "Filter"
  public gridControlCustomizeTitle = ''; // "Customize Columns"
  public frameChangeHeader = ''; // "...Frame change";
  public frameChangeBody = ''; // "... do you wanto proceed?";
  public frameChangeYes = ''; // "Yes";
  public frameChangeNo = ''; // "No";
  public filterCreatedOn = ''; // "Created on";

  public isEventsFilterSelectorOpen = false;
  public disciplineTree: TreeItem[] = [];
  public categoryTree: TreeItem[] = [];
  public stateTree: TreeItem[] = [];
  public srcStateTree: TreeItem[] = [];
  public hiddenEventsTree: TreeItem[] = [];
  public filterPills: HfwFilterPillData[] = [];
  public oneAccordionATime = false;
  public currActiveView: ViewInfo = null;
  public openFilterDlgCommandEnabled = true;
  public supportQparam = true;
  public columnsActions: MenuItem[] = [];
  // #endregion

  public subscribed = false;
  public columnName = 'Description';
  public updateHdrInit: Subject<void> = new Subject<void>();
  public filterWidth: number;
  public hldlFullConfig: any = undefined;
  public cats: number[] = [];
  public selectedEventsIdsSubj: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public selectedEventsIds: Observable<string[]> = this.selectedEventsIdsSubj.asObservable();
  public fullSnapInID: FullSnapInId = this.fullId;
  public fullPaneID: FullPaneId = this.location;
  public fullQParamID: FullQParamId;
  public eventFilter: EventFilter = null;
  public numEventsInGrid: number;

  public showColumnSelectionDlgSubj: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public showColumnSelectionDlg: Observable<boolean> = this.showColumnSelectionDlgSubj.asObservable();

  public splitPosition: number;
  public resizableParts = true;
  public coloredRows = false;

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.panel') public guardPanel = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;

  @ViewChild('filterDiv', { static: false }) public filterView: ElementRef;

  private readonly _dialogDataSubject: Subject<DialogData> = new Subject<DialogData>();
  private readonly subscriptions: Subscription[] = [];
  private eventSubscription: EventSubscription;

  private readonly _reattachInd: Subject<void> = new Subject<void>();
  private _categories: Category[] = [];
  private selectedEvents: Event[] = [];
  private readonly lastSelectionMessage: EventSelectionMessage = { types: undefined, body: undefined };
  private _categoryLamps: number[] = [];
  private userLang: string;
  private frameStore;
  private readonly mmSelectedEventsIdsObs!: Observable<string[]>;
  private currentMode = '';

  private readonly filterSettingsId: string = 'EventList_FilterSettings';
  private readonly _settingsId: string = 'EventList_LayoutSettings';
  private checkUnsavedData = true;
  private allFilters: EventFilter[] = [];
  private readonly filtersSubj: BehaviorSubject<EventFilter[]> = new BehaviorSubject(this.allFilters);
  private filterNotFound = false;

  /**
   * Constructor
   * @param traceService The trace service.
   * @param messageBroker
   * @param activatedRoute
   */
  public constructor(
    private readonly modalService: BsModalService,
    private readonly traceService: TraceService,
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly categoryService: CategoryService,
    private readonly eventService: EventService,
    private readonly tablesService: TablesServiceBase,
    public cnsHelperService: CnsHelperService,
    private readonly settingsService: SettingsServiceBase,
    private readonly _systemBrowserService: SystemBrowserServiceBase,
    private readonly snapinConfig: ISnapInConfig,
    private readonly mMSB: MultiMonitorServiceBase,
    private readonly systemsService: SystemsServiceBase,
    private readonly stateService: StateService,
    private readonly uds: UnsaveDialogService,
    private readonly eventsCommonService: EventsCommonServiceBase) {
    super(messageBroker, activatedRoute);
  }

  public ngOnInit(): void {
    this._categoryLamps = this.eventService.visibleCategoryLamps;

    setTimeout(() => {
      this.subscriptions.push(this.settingsService.getSettings(this.filterSettingsId).subscribe({
        next: val => this.onGetFilterSettings(val),
        error: err => this.onGetFilterSettingsError(err)
      }));
    }, 50);

    if (isNullOrUndefined(this.splitPosition)) {
      this.settingsService.getSettings(this._settingsId).subscribe({
        next: val => this.onGetSettings(val),
        error: err => this.onGetSettingsError(err)
      });
    }

    this.frameStore = this.stateService.currentState.getFrameStoreViaId('event-list');

    if (this.frameStore != null) {
      this.subscriptions.push(this.frameStore.isLocked.subscribe(
        res => {
          this.resizableParts = !res;
        }));
    }

    this.subscriptions.push(this.eventsCommonService.subscribeColumnsResetting().subscribe(res => {
      this.splitPosition = 25;
      this.settingsService.putSettings(this._settingsId, this.splitPosition.toString()).subscribe(
        val => this.onPutSettings(val),
        err => this.onPutSettingsError(err)
      );
    }));

    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture !== null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.traceService.warn(TraceModules.eventList, 'No default Culture for appContextService');
        this.translateService.setDefaultLang(this.userLang === undefined ? this.translateService.getBrowserLang() :
          this.userLang);
      }
    }));

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture !== null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.eventList, 'use  user Culture');
        });
      } else {
        this.traceService.warn(TraceModules.eventList, 'No user Culture for appContextService');
      }
    }));

    this.subscriptions.push(this.cnsHelperService.activeView.subscribe(view => this.activeViewChange(view),
      error => { this.traceService.error(TraceModules.eventList, 'Error in activeView CNSHelper subscription: %s', error.tostring()); }));

    this.subscriptions.push(this._dialogDataSubject.subscribe(data => this.onDialogData(data)));

    this.subscriptions.push(this.translateService.get([
      // #region string list
      'EVENTS.ALIAS-FILTER-LABEL',
      'EVENTS.DESIGNATION-FILTER-LABEL',
      'EVENTS.SOURCEPROPERTYID-FILTER-LABEL',
      'EVENTS.NAME-FILTER-LABEL',
      'EVENTS.DESCRIPTION-FILTER-LABEL',
      'EVENTS.DATE-TIME-FILTER-LABEL',
      'EVENTS.TIME-EMPTY-FILTER-LABEL',
      'EVENTS.TIME-LAST-QUARTER-HOUR-FILTER-LABEL',
      'EVENTS.TIME-LAST-HALF-HOUR-FILTER-LABEL',
      'EVENTS.TIME-LAST-HOUR-FILTER-LABEL',
      'EVENTS.TIME-LAST-NIGHT-FILTER-LABEL',
      'EVENTS.TIME-YESTERDAY-FILTER-LABEL',
      'EVENTS.TIME-TODAY-FILTER-LABEL',
      'EVENTS.FILTER-CLEAR-MSG',
      'EVENTS.SEARCH-FILTER-WATERMARK',
      'EVENTS.DISCIPLINE-FILTER-LABEL',
      'EVENTS.CATEGORY-FILTER-LABEL',
      'EVENTS.STATE-FILTER-LABEL',
      'EVENTS.SRC-STATE-FILTER-LABEL',
      'EVENTS.SRC-SYSTEM-FILTER-LABEL',
      'EVENTS.HIDDEN-EVENTS-FILTER-LABEL',
      'EVENTS.HIDDEN-EVENTS-SHOW-LABEL',
      'EVENTS.EVENT-STATE-UNPROCESSED',
      'EVENTS.EVENT-STATE-READY-TO-BE-RESET',
      'EVENTS.EVENT-STATE-READY-TO-BE-CLOSED',
      'EVENTS.EVENT-STATE-WAITING-FOR-CONDITION',
      'EVENTS.EVENT-STATE-CLOSED',
      'EVENTS.EVENT-STATE-WAITING-FOR-COMMAND-EXECUTION',
      'EVENTS.SOURCE-STATE-ACTIVE',
      'EVENTS.SOURCE-STATE-QUIET',
      'EVENTS.CONTENT-ACTION-FILTER-LABEL',
      'EVENTS.GRID-CONTROL-CUSTOMIZE-TITLE',
      'EVENTS.FRAME-CHANGE-HEADER',
      'EVENTS.FRAME-CHANGE-BODY',
      'EVENTS.FRAME-CHANGE-YES',
      'EVENTS.FRAME-CHANGE-NO',
      'EVENTS.FILTER-CONTROL.CREATED-ON'
      // #endregion
    ]).subscribe(values => this.onTraslateStrings(values)));

    this.fullQParamID = new FullQParamId(this.fullSnapInID.frameId, 'EventQParamService', 'primary');
  }

  public ngOnDestroy(): void {

    this.subscriptions.forEach((subscription: Subscription) => {
      if (!isNullOrUndefined(subscription)) {
        subscription.unsubscribe();
      }
    });

    if (!(isNullOrUndefined(this.eventSubscription))) {
      this.eventService.destroyEventSubscription(this.eventSubscription.id);
    }
    if (!(isNullOrUndefined(this.splitPosition))) {
      this.settingsService.putSettings(this._settingsId, this.splitPosition.toString()).subscribe(
        val => this.onPutSettings(val),
        err => this.onPutSettingsError(err)
      );
    }
  }

  public onBeforeAttach(): void {
    super.onBeforeAttach();
    this._reattachInd.next();
  }

  public openFilterDialog(): void {
    this.filterNotFound = false;
    const currFilter = this.evaluateFilter();

    const initialState: any = {
      eventFilter: currFilter,
      dialogDataSubject: this._dialogDataSubject,
      disciplineTree: this.disciplineTree,
      categoryTree: this.categoryTree,
      stateTree: this.stateTree,
      srcStateTree: this.srcStateTree,
      hiddenEventsTree: this.hiddenEventsTree,
      disableFilterSaving: this.filterNotFound && !currFilter.empty,
      filtersObs: this.filtersSubj.asObservable()
    };

    const modalOptions: ModalOptions = { ignoreBackdropClick: true, keyboard: true, animated: true, initialState };

    this.modalService.show(EventFilterDlgComponent, modalOptions);
  }

  public hiddenFilterRefresh(): void {
    this.eventService.setHiddenEvents(this.eventFilter.hiddenEvents);
  }

  public get hiddenFilterPill(): boolean {
    return this.eventFilter.hiddenEvents;
  }

  public set hiddenFilterPill(value: boolean) {
    this.eventFilter.hiddenEvents = value;
    if (this.eventFilter.hiddenEvents) {
      this.eventFilter.empty = false;
    }
    this.filterPills = this.filterToPillDataArr();
  }

  // #region public filter related methods
  public get reattachInd(): Observable<void> {
    return this._reattachInd;
  }

  public eventListFilterFormStyle(): any {
    if (this.isEventsFilterSelectorOpen) {
      return {
        'display': 'inherit',
        'overflow': 'auto'
      };
    }
    return { 'display': 'none' };
  }

  public onShowEventsFilter(): void {
    this.openFilterDialog();
  }

  public onShowColumnSelectionDlg(): void {
    if (this.isEventsFilterSelectorOpen === true) {
      this.isEventsFilterSelectorOpen = false;
      this.showColumnSelectionDlgSubj.next(true);
    } else {
      this.showColumnSelectionDlgSubj.next(true);
      this.showColumnSelectionDlgSubj.next(false);
    }
  }

  public onClearEventsFilter(): void {
    this.eventFilter.disciplines = [];
    this.eventFilter.categories = [];
    this.eventFilter.states = [];
    this.eventFilter.srcState = [];
    this.eventFilter.srcAlias = '';
    this.eventFilter.srcDescriptor = '';
    this.eventFilter.srcName = '';
    this.eventFilter.srcSystem = [];
    this.eventFilter.creationDateTime = EventDateTimeFilterValues.None;
    this.eventService.setEventsFilter(this.eventFilter);
    this.hiddenFilterRefresh();
  }
  // #endregion

  public onSelectEvent(events: Event[], unselectDueAnIncomingSelection: boolean): void {
    this.selectEvents(events, unselectDueAnIncomingSelection);

    if (this.selectedEvents && this.selectedEvents.length > 0) {
      this.notifyEventsSelection();
    } else {
      this.openFilterDlgCommandEnabled = true;
    }
  }

  public notifyEventsSelection(): void {
    const nodes: BrowserObject[] = [];
    const sources: Event[] = [];

    this.selectedEvents.forEach(event => {
      if (sources.findIndex(source =>
        source.srcPropertyId.substr(0, source.srcPropertyId.lastIndexOf(':') + 1) ===
        event.srcPropertyId.substr(0, event.srcPropertyId.lastIndexOf(':') + 1)) === -1) {
        sources.push(event);
      }
    });
    this.searchRecursive(sources, nodes);
    this.openFilterDlgCommandEnabled = false;
  }

  public sendmsg(nodes: BrowserObject[]): void {
    const types: string[] = [];
    const gmsMessageData: GmsMessageData = new GmsMessageData(nodes);
    const messageBody: GmsMessageData = gmsMessageData;

    nodes?.forEach(node => {
      types.push(node.Attributes.ManagedTypeName);
    });
    gmsMessageData.customData = this.selectedEvents;

    this.lastSelectionMessage.body = messageBody;
    this.lastSelectionMessage.types = types;
    const qParamValue = (this.selectedEvents !== null && this.selectedEvents.length > 0) ? this.computeId(this.selectedEvents[0]) : null;
    const qParam: QParam = { name: this.fullQParamID.fullId(), value: qParamValue };
    const paramsMessage: ParamsSendMessage = {
      messageBody,
      preselection: true,
      qParam,
      broadcast: false
    };
    this.sendMessage(types, paramsMessage).subscribe((res: boolean) => {
      this.traceService.debug(TraceModules.eventList, SND_MSG_COMPLETED, res);
    });
  }

  public computeId(eventItem: Event): string {
    return (eventItem.groupedEvents.length === 0 ? eventItem.id : eventItem.id + '*');
  }

  public searchRecursive(toProcess: Event[], nodes: BrowserObject[]): void {
    const searchString = toProcess[0].srcObservedPropertyId ?? toProcess[0].srcPropertyId;
    this._systemBrowserService.searchNodes(toProcess[0].srcSystemId, searchString, undefined, SearchOption.objectId)
      .toPromise()
      .then(page => {
        const designationList = toProcess[0]?.designationList;

        if (page?.Nodes?.length > 0) {
          if (designationList.length > 0) {
            let index = -1;
            for (let i = 0; i < designationList.length; i++) {
              if (this.currActiveView?.cnsViews != null &&
                this.currActiveView.cnsViews.length > 0 &&
                designationList[i].ViewId === this.currActiveView.cnsViews[0].viewId) {
                index = i;
                break;
              }
            }
            if (index >= 0) {
              const node = page.Nodes.find(n => n.Designation === designationList[index].Descriptor);
              nodes.push(node);
            } else {
              const node = page.Nodes.find(n => n.Designation === designationList[0].Descriptor);
              nodes.push(node);
            }
          }
        }

        toProcess = toProcess.slice(1);
        if (toProcess.length === 0) {
          this.sendmsg(nodes);
        } else {
          this.searchRecursive(toProcess, nodes);
        }
      }, () => {
        this.sendmsg([]);
      });
  }

  public onEventsNumberNotification(numEvents: number): void {
    this.numEventsInGrid = numEvents;
  }

  public onNotifyUpdatedSelection(updatedEventMsg: EventUpdateNotificationMessage): void {
    if (updatedEventMsg.isClosed === true) {
      if (updatedEventMsg.events.length === 1) { // no selected events
        // this.selectedEvents.length = 0;
        this.notifyNoSelection();
      } else { // update and send updated selected events
        // this.selectedEvents = updatedEventMsg.events;
        if (this.lastSelectionMessage?.body) {
          this.lastSelectionMessage.body.customData = updatedEventMsg.events;
          this.notifyEventsSelection();
        }
      }
    } else {
      if (this.lastSelectionMessage?.body) {
        this.lastSelectionMessage.body.customData = updatedEventMsg.events;
        const paramsMessage: ParamsSendMessage = {
          messageBody: this.lastSelectionMessage.body,
          preselection: false,
          broadcast: false
        };
        this.sendMessage(this.lastSelectionMessage.types, paramsMessage).subscribe((res: boolean) => {
          this.traceService.debug(TraceModules.eventList, 'sendMessage() of updated EG event completed. result: %s', res);
        });
      }
    }
  }

  public onDeletePill(pillData: HfwFilterPillData): void {
    switch (pillData.filterId) {
      case 1:
        this.eventFilter.disciplines = [];
        break;
      case 2:
        this.eventFilter.categories = [];
        break;
      case 3:
        this.eventFilter.states = [];
        break;
      case 4:
        this.eventFilter.srcState = [];
        break;
      case 5:
        this.eventFilter.srcAlias = '';
        break;
      case 6:
        if (this.eventFilter.srcDesignations) {
          this.eventFilter.srcDesignations = [];
        } else {
          this.eventFilter.srcPropertyIds = [];
        }
        break;
      case 7:
        this.eventFilter.srcDescriptor = '';
        break;
      case 8:
        this.eventFilter.srcName = '';
        break;
      case 9:
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.None;
        break;
      case 10:
        this.eventFilter.srcSystem = [];
        break;
      case 11:
        this.eventFilter.hiddenEvents = false;
        this.hiddenFilterRefresh();
        break;
      default:
        break;
    }
    this.eventService.setEventsFilter(this.eventFilter);
  }

  /**
   * Handles the selection of events.
   * @param eventList An array of Event objects representing the selected events.
   */
  public onEventSelected(eventList: Event[]): void {

    if (this.eventsCommonService.hasCachedSelectedEvents()) {
      this.eventsCommonService.resetCachedSelectedEvents();
    }

    switch (true) {
      // Case: If the lengths of selectedEvents and eventList are different no need to compare IDs as they're different
      case this.selectedEvents.length !== eventList.length && eventList.length !== 0:
        // Update selectedEvents to match eventList
        this.selectedEvents = [...eventList];
        break;

      // Case: Do nothing when eventList is empty (no new selection)
      case eventList.length === 0:
        break;

      // Default case: If eventList is not empty and lengths match, check for ID mismatches to determine
      // if current selections and new selections are same
      default:
        // Check if all IDs match between selectedEvents and eventList
        const allIdsMatch = this.selectedEvents.every((selectedEvent, index) => selectedEvent.id === eventList[index].id);
        // If any ID doesn't match, update selectedEvents to match eventList
        if (!allIdsMatch) {
          this.selectedEvents = [...eventList];
        }
        break;
    }

    // Cache the selected events for future use
    this.eventsCommonService.cacheSelectedEvents(this.selectedEvents);

    // Call onSelectEvent method with selectedEvents and flag indicating no event addition
    this.onSelectEvent(this.selectedEvents, false);
  }
  public catchEvents(event: GridEvent): void {
    this.traceService.info(TraceModules.eventList, 'Event emitted...');

    if (event.eventType === enumEventType.EmitEvent) {
      if (event.eventData === null) {
        this.notifyNoSelection();
        return;
      }

      this.selectedEvents.length = 0;
      this.selectedEvents.push(event.eventData);
      this.onSelectEvent([event.eventData], false);
    }
  }

  public onSplitChange(sizes: number): void {
    this.splitPosition = sizes;
  }

  public onUnsavedDataCheck(reason: UnsavedDataReason): Observable<boolean> {
    if (this.eventsCommonService.isInAssistedMode &&
      this.currentMode === 'assisted' &&
      reason === UnsavedDataReason.FrameChange &&
      this.checkUnsavedData) {
      const messageToSend: ParamsSendMessage = {
        messageBody: null,
        preselection: true,
        broadcast: false
      };
      this.sendMessage([gmsNoSelectionMessageType], messageToSend).subscribe((res: boolean) => {
        this.traceService.debug(TraceModules.eventList, SND_MSG_COMPLETED, res);
      });
      this.checkUnsavedData = false;

      return new Observable((observer: Observer<boolean>) => { this.onUnsavedDataSubs(observer); });
    }
    return of(true);
  }

  private onUnsavedDataSubs(observer: Observer<boolean>): void {
    this.uds.showDialog('event-list', { header: this.frameChangeHeader, body: this.frameChangeBody, yes: this.frameChangeYes, no: this.frameChangeNo })
      .subscribe((res: UnsavedDataDialogResult) => {
        this.checkUnsavedData = true;
        switch (res) {
          case UnsavedDataDialogResult.Yes:
            this.messageBroker.changeMode({ id: DEFAULT_MODE_ID, relatedValue: null }, this.fullSnapInID.frameId).subscribe((modeChanged: boolean) => {
              this.traceService.debug(TraceModules.eventList, 'changeMode() completed. result: %s', modeChanged);
              this.eventsCommonService.exitFromAssistedTreatment(this.selectedEvents);

              const destinationFrame = this.eventsCommonService.destinationFrame || 'system-manager';
              this.messageBroker.switchToNextFrame(destinationFrame).subscribe(switched => {
                this.traceService.debug(TraceModules.eventList, 'Frame switched to: ' + destinationFrame);
                this.eventsCommonService.destinationFrame = undefined;
              });
            });
            this.uds.closeDialog();
            observer.next(true);
            observer.complete();
            break;
          case UnsavedDataDialogResult.No:
          case UnsavedDataDialogResult.Cancel:
          default:
            observer.next(false);
            observer.complete();
            break;
        }
      });
  }

  private evaluateFilter(): EventFilter {
    let tmpFilter: EventFilter = null;

    this.filtersSubj?.value.forEach(filter => {
      if (filter.filterName === this.eventFilter.filterName) {
        tmpFilter = { ...filter };
      }
    });
    
    if (isNullOrUndefined(tmpFilter)) {
      this.filterNotFound = true;
      return this.eventFilter;
    }
    this.filterNotFound = false;
    // BTQ2710438:a custom filter is applied, changed in EL and the filter dialog is opened again ---> save as is now enabled
    if (!this.filterUnchanged(tmpFilter)) {
      tmpFilter = { ...this.eventFilter }
      tmpFilter.filterName = '';
      this.filterNotFound = true;
    }
    return tmpFilter; 
  }
  
  private filterUnchanged(tmpFilter: EventFilter): boolean {
    return JSON.stringify(tmpFilter.categories) === JSON.stringify(this.eventFilter.categories) &&
      JSON.stringify(tmpFilter.disciplines) === JSON.stringify(this.eventFilter.disciplines) &&
      JSON.stringify(tmpFilter.states) === JSON.stringify(this.eventFilter.states) &&
      JSON.stringify(tmpFilter.srcState) === JSON.stringify(this.eventFilter.srcState) &&
      tmpFilter.creationDateTime === this.eventFilter.creationDateTime &&
      tmpFilter.hiddenEvents === this.eventFilter.hiddenEvents &&
      tmpFilter.srcAlias === this.eventFilter.srcAlias &&
      tmpFilter.srcDescriptor === this.eventFilter.srcDescriptor &&
      tmpFilter.srcName === this.eventFilter.srcName;
  }

  private manageHldlConfig(): void {
    const hldlConfig = this.snapinConfig.getSnapInHldlConfig(new FullSnapInId('event-list', 'el'), new FullPaneId('event-list', 'el-pane'));

    if (hldlConfig?.coloredRows === true) {
      this.coloredRows = true;
    }

    if ((isNullOrUndefined(this.splitPosition) || this.splitPosition === 0) && hldlConfig?.splitPosition) {
      const paramVal = hldlConfig.splitPosition;
      this.splitPosition = (paramVal >= 50 && paramVal <= 80) ? paramVal : 80;
    }

    if (hldlConfig?.disableEventsFrameSplitter === true) {
      this.resizableParts = false;
    }
  }

  private onPutSettings(isSuccess: boolean): void {
    this.traceService.info(TraceModules.eventList, 'onPutSettings - isSuccess: ' + isSuccess);
  }

  private onPutSettingsError(error: any): void {
    this.traceService.warn(TraceModules.eventList, 'onPutSettingsError - error: ' + error);
  }

  private onGetSettings(splitPosition: string): void {
    this.splitPosition = +splitPosition;
    this.manageHldlConfig();
    this.traceService.info(TraceModules.eventList, 'onGetSettings - splitPosition: ' + this.splitPosition);
  }

  private onGetSettingsError(error: any): void {
    this.traceService.warn(TraceModules.eventList, 'onGetSettingsError - error: ' + error);
  }

  private onGetFilterSettings(filterSettings: any): void {
    filterSettings = filterSettings ?? '[]';
    this.allFilters = JSON.parse(filterSettings);
    this.filtersSubj.next(this.allFilters);
    this.traceService.info(TraceModules.eventList, 'onGetFilterSettings - FilterSettings: ' + filterSettings);
  }

  private onGetFilterSettingsError(error: any): void {
    this.traceService.warn(TraceModules.eventList, 'Error retrieving the filter settings - error: ' + error);
  }

  private onPutFilterSettingsError(error: any): void {
    this.traceService.warn(TraceModules.eventList, 'Error saving the filter settings - error: ' + error);
  }

  private onDialogData(data: DialogData): void {
    this.eventFilter = data.eventFilter;

    switch (data.exitCode) {
      case DialogExitCode.APPLY: // creation and saving of default filters has been commented
        // if (isNullOrUndefined(this.eventFilter.filterName)) { // save new unnamed filter
        //   this.eventFilter.filterName = this.filterCreatedOn + ' ' + new Date().toLocaleString();
        //   this.updateFiltersArray();
        // } else {
        const index = this.allFilters.findIndex(filter => filter.filterName === this.eventFilter.filterName);
        if (index >= 0) { // update the existing filter
          this.allFilters[index] = JSON.parse(JSON.stringify(this.eventFilter));
          // }
          // if (index === -1 && this.eventFilter.filterName.length > 0) { // the selected filter has been deleted :-( create a new one on the fly
          //   this.eventFilter.filterName = this.filterCreatedOn + ' ' + new Date().toLocaleString();
          //   this.updateFiltersArray(); 
          // } else { // save the updated filter
          //   this.allFilters[index] = JSON.parse(JSON.stringify(this.eventFilter));
          // }
        }
        this.storeFilters();
        break;
      case DialogExitCode.NEW: // save new filter
        this.updateFiltersArray();
        this.storeFilters();
        break;
      case DialogExitCode.REMOVE: // remove existing filter
        const pos = this.allFilters.findIndex(item => item.filterName === data.eventFilter.filterName);
        if (pos >= 0) {
          this.allFilters.splice(pos, 1);
          this.storeFilters();
        }
        break;
      case DialogExitCode.DELETEALL: // clear all existing filters
        this.allFilters.length = 0;
        this.storeFilters();
        break;
      default:
        this.filterPills = this.filterToPillDataArr();
        this.hiddenFilterRefresh();
        this.eventService.setEventsFilter(this.eventFilter);
        break;
    }
  }

  private updateFiltersArray(): void {
    this.allFilters.unshift(structuredClone(this.eventFilter));
    if (this.allFilters.length > FILTERS_MAXNUM) {
      this.allFilters.pop();
    }
  }

  private storeFilters(): void {
    this.settingsService.putSettings(this.filterSettingsId, JSON.parse(JSON.stringify(this.allFilters))).subscribe({
      next: val => this.onPutSettings(val),
      error: err => this.onPutFilterSettingsError(err)
    });
  }

  private activeViewChange(view: ViewInfo): void {
    if (view !== null) {
      const firstTime = (this.currActiveView === null);
      this.currActiveView = view;
      if (!firstTime) {
        this.realignEventListData();
      }
    }
  }

  private notifyNoSelection(): void {
    const qParam: QParam = { name: this.fullQParamID.fullId(), value: null };
    const paramsMessage: ParamsSendMessage = {
      messageBody: new GmsMessageData([], GmsSelectionType.None),
      preselection: true,
      qParam,
      broadcast: false
    };
    this.sendMessage([gmsNoSelectionMessageType], paramsMessage).subscribe((res: boolean) => {
      this.traceService.debug(TraceModules.eventList, SND_MSG_COMPLETED, res);
    });
  }

  private selectEvents(events: Event[], unselectDueAnIncomingSelection: boolean): void {
    const eventIds: string[] = [];

    if (events) {
      if (events.length === 0 && !unselectDueAnIncomingSelection) {
        const qParam: QParam = { name: this.fullQParamID.fullId(), value: null };
        const paramsMessage: ParamsSendMessage = {
          messageBody: new GmsMessageData([], GmsSelectionType.None),
          preselection: true,
          qParam,
          broadcast: false
        };
        this.sendMessage([gmsNoSelectionMessageType], paramsMessage).subscribe((res: boolean) => {
          this.traceService.debug(TraceModules.eventList, SND_MSG_COMPLETED, res);
        });
        return;
      }
    }
  }

  private onTraslateStrings(strings: Map<string, string>): void {
    this.aliasFilterLabel = strings['EVENTS.ALIAS-FILTER-LABEL'];
    this.designationFilterLabel = strings['EVENTS.DESIGNATION-FILTER-LABEL'];
    this.sourcePropertyIdFilterLabel = strings['EVENTS.SOURCEPROPERTYID-FILTER-LABEL'];
    this.nameFilterLabel = strings['EVENTS.NAME-FILTER-LABEL'];
    this.descriptionFilterLabel = strings['EVENTS.DESCRIPTION-FILTER-LABEL'];
    this.dateTimeFilterLabel = strings['EVENTS.DATE-TIME-FILTER-LABEL'];
    this.timeLastQuarterHourFilterLabel = strings['EVENTS.TIME-LAST-QUARTER-HOUR-FILTER-LABEL'];
    this.timeLastHalfHourFilterLabel = strings['EVENTS.TIME-LAST-HALF-HOUR-FILTER-LABEL'];
    this.timeLastHourFilterLabel = strings['EVENTS.TIME-LAST-HOUR-FILTER-LABEL'];
    this.timeLastNightFilterLabel = strings['EVENTS.TIME-LAST-NIGHT-FILTER-LABEL'];
    this.timeYesterdayFilterLabel = strings['EVENTS.TIME-YESTERDAY-FILTER-LABEL'];
    this.timeTodayFilterLabel = strings['EVENTS.TIME-TODAY-FILTER-LABEL'];
    this.filterClearMsg = strings['EVENTS.FILTER-CLEAR-MSG'];
    this.disciplineFilterLabel = strings['EVENTS.DISCIPLINE-FILTER-LABEL'];
    this.categoryFilterLabel = strings['EVENTS.CATEGORY-FILTER-LABEL'];
    this.stateFilterLabel = strings['EVENTS.STATE-FILTER-LABEL'];
    this.srcStateFilterLabel = strings['EVENTS.SRC-STATE-FILTER-LABEL'];
    this.hiddenEventsFilterLabel = strings['EVENTS.HIDDEN-EVENTS-FILTER-LABEL'];
    this.hiddenEventsShowLabel = strings['EVENTS.HIDDEN-EVENTS-SHOW-LABEL'];
    this.eventStateUnprocessed = strings['EVENTS.EVENT-STATE-UNPROCESSED'];
    this.eventStateReadyToBeReset = strings['EVENTS.EVENT-STATE-READY-TO-BE-RESET'];
    this.eventStateReadyToBeClosed = strings['EVENTS.EVENT-STATE-READY-TO-BE-CLOSED'];
    this.eventStateWaitingForCondition = strings['EVENTS.EVENT-STATE-WAITING-FOR-CONDITION'];
    this.eventStateClosed = strings['EVENTS.EVENT-STATE-CLOSED'];
    this.sourceStateActive = strings['EVENTS.SOURCE-STATE-ACTIVE'];
    this.sourceStateQuiet = strings['EVENTS.SOURCE-STATE-QUIET'];
    this.gridControlCustomizeTitle = strings['EVENTS.GRID-CONTROL-CUSTOMIZE-TITLE'];
    this.frameChangeHeader = strings['EVENTS.FRAME-CHANGE-HEADER'];
    this.frameChangeBody = strings['EVENTS.FRAME-CHANGE-BODY'];
    this.frameChangeYes = strings['EVENTS.FRAME-CHANGE-YES'];
    this.frameChangeNo = strings['EVENTS.FRAME-CHANGE-NO'];
    this.filterCreatedOn = strings['EVENTS.FILTER-CONTROL.CREATED-ON'];
    this.contentActionFilterLabel = strings[cabLable];

    this.userLang = this.translateService.getBrowserLang();

    this.subscriptions.push(this.tablesService.getGlobalText(Tables.Disciplines, true).subscribe(response => this.onGetDisciplines(response)));
    this.subscriptions.push(this.categoryService.getCategories().subscribe(response => this.onGetCategories(response)));

    if (this.snapinConfig.getAvailableModes()) {
      this.subscriptions.push(this.messageBroker.getCurrentMode().subscribe(mode => {
        this.setFilter();
        this.currentMode = mode.id;
      }));
    }
  }

  private setFilter(): void {

    // Event State Tree
    let item: TreeItem =
    {
      label: this.eventStateUnprocessed,
      state: 'leaf',
      customData: ['Unprocessed']
    };
    this.stateTree.push(item);
    item =
    {
      label: this.eventStateReadyToBeReset,
      state: 'leaf',
      customData: ['ReadyToBeReset']
    };

    this.stateTree.push(item);
    item =
    {
      label: this.eventStateReadyToBeClosed,
      state: 'leaf',
      customData: ['ReadyToBeClosed']
    };
    this.stateTree.push(item);
    item =
    {
      label: this.eventStateWaitingForCondition,
      state: 'leaf',
      customData: ['Acked', 'WaitingOPCompletion']
    };
    this.stateTree.push(item);
    item =
    {
      label: this.eventStateClosed,
      state: 'leaf',
      customData: ['Closed']
    };
    this.stateTree.push(item);

    // Source State
    item =
    {
      label: this.sourceStateActive,
      state: 'leaf',
      customData: ['Active']
    };
    this.srcStateTree.push(item);
    item =
    {
      label: this.sourceStateQuiet,
      state: 'leaf',
      customData: ['Quiet']
    };
    this.srcStateTree.push(item);

    // Hidden Events
    this.hiddenEventsTree = [];
    item =
    {
      label: this.hiddenEventsShowLabel,
      state: 'leaf',
      customData: ['Active']
    };
    this.hiddenEventsTree.push(item);
  }

  private filterToPillDataArr(): HfwFilterPillData[] {
    let pillDataArr: HfwFilterPillData[] = [];

    if (this.eventFilter !== undefined && !this.eventFilter.empty) {
      pillDataArr = this.pillDataForFilterDiscipline(pillDataArr);
      if (this.eventFilter.categories !== undefined && this.eventFilter.categories.length > 0) {
        const values: string[] = [];

        pillDataArr.push(new HfwFilterPillData(2, this.categoryFilterLabel, values, true));
        this.eventFilter.categories.forEach(id => {
          if (this._categoryLamps.includes(id) || this._categoryLamps.length === 0) {
            this._categories.forEach((item, indexItem) => {
              if (item.id === id) {
                values.push(`rgb(${item.colors.get(EventColors.ButtonGradientDark)})`);
              }
            });
          }
        });
      }
      pillDataArr = this.pillDataForFilterState(pillDataArr);
      pillDataArr = this.pillDataForFilterSrcState(pillDataArr);
      pillDataArr = this.pillDataForHiddenEvents(pillDataArr);
      if (this.eventFilter.creationDateTime !== undefined && this.eventFilter.creationDateTime !== EventDateTimeFilterValues.None) {
        pillDataArr.push(new HfwFilterPillData(9, this.dateTimeFilterLabel, this.getString()));
      }
      pillDataArr = this.pushPillDataForVariousFilter(pillDataArr);
    }

    return pillDataArr;
  }

  private pillDataForFilterDiscipline(pillDataArr: HfwFilterPillData[]): HfwFilterPillData[] {
    if (this.eventFilter.disciplines !== undefined && this.eventFilter.disciplines.length > 0) {
      const values: string[] = [];
      pillDataArr.push(new HfwFilterPillData(1, this.disciplineFilterLabel, values));
      this.disciplineTree.forEach(val => {
        if (val.checked === checked) {
          values.push(val.label);
        }
      });
    }
    return pillDataArr;
  }

  private pillDataForFilterState(pillDataArr: HfwFilterPillData[]): HfwFilterPillData[] {
    if (this.eventFilter.states !== undefined && this.eventFilter.states.length > 0) {
      const values: string[] = [];
      pillDataArr.push(new HfwFilterPillData(3, this.stateFilterLabel, values));
      this.stateTree.forEach(treeItem => {
        if (treeItem.checked === checked) {
          values.push(treeItem.label);
        }
      });
    }
    return pillDataArr;
  }

  private pillDataForFilterSrcState(pillDataArr: HfwFilterPillData[]): HfwFilterPillData[] {
    if (this.eventFilter.srcState !== undefined && this.eventFilter.srcState.length > 0) {
      const values: string[] = [];
      pillDataArr.push(new HfwFilterPillData(4, this.srcStateFilterLabel, values));
      this.srcStateTree.forEach(val => {
        if (val.checked === checked) {
          values.push(val.label);
        }
      });
    }
    return pillDataArr;
  }

  private pillDataForHiddenEvents(pillDataArr: HfwFilterPillData[]): HfwFilterPillData[] {
    if (this.eventFilter.hiddenEvents !== undefined && this.eventFilter.hiddenEvents === true) {
      const values: string[] = [];
      pillDataArr.push(new HfwFilterPillData(11, this.hiddenEventsFilterLabel, values));
      if (this.eventFilter.hiddenEvents) {
        values.push(this.hiddenEventsShowLabel);
      }
    }
    return pillDataArr;
  }

  private getString(): string[] {
    const values: string[] = [];

    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastQuarterHour) {
      values.push(this.timeLastQuarterHourFilterLabel);
    } else if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastHalfHour) {
      values.push(this.timeLastHalfHourFilterLabel);
    } else if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastHour) {
      values.push(this.timeLastHourFilterLabel);
    } else if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastNight) {
      values.push(this.timeLastNightFilterLabel);
    } else if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.Today) {
      values.push(this.timeTodayFilterLabel);
    } else if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.Yesterday) {
      values.push(this.timeYesterdayFilterLabel);
    } else if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.Custom) {
      if (this.eventFilter.to) {
        values.push(this.eventFilter.from.toLocaleString(this.userLang) + ' - ' + this.eventFilter.to.toLocaleString(this.userLang));
      } else {
        values.push(this.eventFilter.from.toLocaleString(this.userLang));
      }
    }
    return values;
  }

  private pushPillDataForVariousFilter(pillDataArr: HfwFilterPillData[]): HfwFilterPillData[] {
    if (this.eventFilter.srcAlias !== undefined && this.eventFilter.srcAlias.length > 0) {
      const values: string[] = [];
      values.push(this.eventFilter.srcAlias);
      pillDataArr.push(new HfwFilterPillData(5, this.aliasFilterLabel, values));
    }
    if (this.eventFilter.srcDesignations !== undefined && this.eventFilter.srcDesignations.length > 0 ||
      this.eventFilter.srcPropertyIds !== undefined && this.eventFilter.srcPropertyIds.length > 0) {
      const values: string[] = [];
      values.push(this.eventFilter.srcDesignations ? this.eventFilter.srcDesignations[0] : this.eventFilter.srcPropertyIds[0]);
      pillDataArr.push(new HfwFilterPillData(6, this.eventFilter.srcDesignations ? this.designationFilterLabel : this.sourcePropertyIdFilterLabel, values));
    }
    if (this.eventFilter.srcDescriptor !== undefined && this.eventFilter.srcDescriptor.length > 0) {
      const values: string[] = [];
      values.push(this.eventFilter.srcDescriptor);
      pillDataArr.push(new HfwFilterPillData(7, this.descriptionFilterLabel, values));
    }
    if (this.eventFilter.srcName !== undefined && this.eventFilter.srcName.length > 0) {
      const values: string[] = [];
      values.push(this.eventFilter.srcName);
      pillDataArr.push(new HfwFilterPillData(8, this.nameFilterLabel, values));
    }
    return pillDataArr;
  }

  private onGetDisciplines(disciplines: TextEntry[]): void {

    disciplines.forEach(value => {
      this.disciplineTree.push(
        {
          label: value.text,
          state: 'leaf',
          customData: value.value
        });
    });

    this.eventSubscription = this.eventService.createEventSubscription(null);
    this.systemsService.getSystems().toPromise().then(
      response => {
        this.subscriptions.push(this.eventSubscription.filter.subscribe(values => this.onEventsFilterNotification(values)));
      },
      error => {
        this.traceService.error(TraceModules.eventList, 'Error in getSystems()');
        this.subscriptions.push(this.eventSubscription.filter.subscribe(values => this.onEventsFilterNotification(values)));
      }
    );
  }

  private onGetCategories(cats: Category[]): void {
    this._categories = cats;
    this._categories.forEach(value => {
      const treeItem: TreeItem =
      {
        label: value.descriptor,
        state: 'leaf',
        customData: value.id
      };
      treeItem.stateIndicatorColor = `rgb(${value.colors.get(EventColors.ButtonGradientDark)})`;
      if (this._categoryLamps.includes(value.id) || this._categoryLamps.length === 0) {
        this.categoryTree.push(treeItem);
      }
    });
  }

  private unselectAllEvents(): void {
    this.selectedEvents.length = 0;
    const qParam: QParam = { name: this.fullQParamID.fullId(), value: null };
    const sendMessage: ParamsSendMessage = {
      messageBody: new GmsMessageData([], GmsSelectionType.None),
      preselection: false,
      qParam,
      broadcast: false
    };
    this.sendMessage([gmsNoSelectionMessageType], sendMessage).subscribe((res: boolean) => {
      this.traceService.debug(TraceModules.eventList, SND_MSG_COMPLETED, res);
    });
  }

  private onEventsFilterNotification(eventFilter: EventFilter): void {
    const startTime: number = this.performanceTrace(0, 'Starting to filter');

    this.eventFilter = eventFilter;

    this.categoryTree.forEach((item, indexItem) => {
      this.categoryTree[indexItem].checked = unchecked;
    });
    if (this.eventFilter.categories !== undefined && this.eventFilter.categories.length > 0) {
      this.eventFilter.categories.forEach((id, indexId) => {
        this.categoryTree.forEach((item, indexItem) => {
          if (item.customData === id) {
            this.categoryTree[indexItem].checked = checked;
          }
        });
      });
    }

    this.disciplineTree.forEach((item, indexItem) => {
      this.disciplineTree[indexItem].checked = unchecked;
    });
    if (this.eventFilter.disciplines !== undefined && this.eventFilter.disciplines.length > 0) {
      this.eventFilter.disciplines.forEach((id, indexId) => {
        this.disciplineTree.forEach((item, indexItem) => {
          if (item.customData === id) {
            this.disciplineTree[indexItem].checked = checked;
          }
        });
      });
    }

    this.stateTree.forEach((item, indexItem) => {
      this.stateTree[indexItem].checked = unchecked;
    });
    if (this.eventFilter.states !== undefined && this.eventFilter.states.length > 0) {
      this.eventFilter.states.forEach((id, indexId) => {
        this.stateTree.forEach((item, indexItem) => {
          if (item.customData.find(x => x === id)) {
            this.stateTree[indexItem].checked = checked;
          }
        });
      });
    }

    this.srcStateTree.forEach((item, indexItem) => {
      this.srcStateTree[indexItem].checked = unchecked;
    });

    this.setSourceSteTreeToChecked();

    this.hiddenEventsTree.forEach((item, indexItem) => {
      this.hiddenEventsTree[indexItem].checked = this.eventFilter.hiddenEvents ? checked : unchecked;
    });

    this.filterPills = this.filterToPillDataArr();
    this.realignEventListData();

    this.performanceTrace(startTime, 'Filtering complete');
  }

  private setSourceSteTreeToChecked(): void {
    if (this.eventFilter.srcState !== undefined && this.eventFilter.srcState.length > 0) {
      this.eventFilter.srcState.forEach((id, indexId) => {
        this.srcStateTree.forEach((item, indexItem) => {
          if (item.customData.find(x => x === id)) {
            this.srcStateTree[indexItem].checked = checked;
          }
        });
      });
    }
  }

  private realignEventListData(): void {
    this.eventService.realignEventsWithFilter();
  }

  private performanceTrace(startTime?: number, message?: string, ...optionalParams: string[]): number {
    let retVal: number;

    if (this.traceService.isDebugEnabled(TraceModules.eventListPerformance)) {
      if (startTime > 0) {
        retVal = performance.now() - startTime;
        this.traceService.debug(TraceModules.eventListPerformance, message + ' - time spent %s [ms]', optionalParams, retVal);
      } else {
        this.traceService.debug(TraceModules.eventListPerformance, message, optionalParams);
        retVal = performance.now();
      }
    }
    return retVal;
  }
}
