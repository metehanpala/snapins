import * as events from 'events';

import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ViewInfo } from '@gms-flex/controls';
import { FullQParamId, FullSnapInId, IHfwMessage, IPreselectionService, ISnapInConfig, IStorageService, MockSnapInBase, SnapInBase } from '@gms-flex/core';
import { Category, CategoryService, CnsHelperService, EventDateTimeFilterValues, EventFilter, EventService, EventStates,
  GmsMessageData, GmsSelectionType, Page, SearchOption, SystemBrowserServiceBase, SystemInfo, SystemsServiceBase,
  TablesServiceBase } from '@gms-flex/services';
import { AppContextService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { EventContentComponent } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { SiContentActionBarComponent } from '@simpl/element-ng';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Observable, of } from 'rxjs';

import { DialogExitCode } from '../filter-dialog';
import { EventListSnapInComponent } from './event-list-snapin.component';

@Component({
  selector: 'gms-si-content-action-bar',
  template: '<div></div>',
  providers: [
    { provide: SiContentActionBarComponent, useClass: MockSiContentActionBarComponent }
  ],
  standalone: false
})
class MockSiContentActionBarComponent {
  @Input() public primaryActions: any = undefined;
  @Input() public secondaryActions: any = undefined;
  @Input() public back: any = undefined;
  @Input() public viewType: any = undefined;
}

@Component({
  selector: 'gms-event-content',
  template: '<div></div>',
  providers: [
    { provide: EventContentComponent, useClass: MockGmsEventContentComponent }
  ],
  standalone: false
})
class MockGmsEventContentComponent {
  @Input() public showAllEvents: any = undefined;
  @Input() public fullSnapinID: FullSnapInId;
  @Input() public fullQParamID: any = undefined;
  @Input() public fullPaneID: any = undefined;
  @Input() public selectedEventsIds: any = undefined;
  @Input() public showColumnSelectionDlg: any = undefined;
  @Input() public splitPosition: any = undefined;
  @Input() public resizableParts: any = undefined;
  @Input() public coloredRows: any = undefined;
  @Input() public readonly newOnSplitChanges: any = undefined;
  @Input() public readonly selectedEventsEv: any = undefined;
  @Input() public readonly gridEvents: any = undefined;
  @Input() public readonly numEventsChanged: any = undefined;
  @Input() public readonly notifyUpdatedSelectionEv: any = undefined;
  @Input() public readonly minifiedState: any = undefined;
}

class MockAppContextService {
  public get defaultCulture(): Observable<string> {
    return of(undefined);
  }
  public get userCulture(): Observable<string> {
    return of(undefined);
  }
}

class MockCnsHelperService {
  public get activeView(): Observable<ViewInfo> {
    return of(undefined);
  }
}

class MockSystemBrowserService {
  public searchNodes(systemId: number, searchString: string, viewId?: number,
    searchOption?: SearchOption, caseSensitive?: boolean, groupByParent?: boolean,
    size?: number, page?: number, disciplineFilter?: string, objectTypeFilter?: string,
    alarmSuppresion?: boolean, aliasFilter?: string): Observable<Page> {
    return of(undefined);
  }
}

class MockSystemsService {
  public getSystems(): Observable<SystemInfo[]> {
    return of(undefined);
  }
}

describe('EventListSnapInComponent', () => {
  let fixture;
  let component;
  let enumEventType: any;

  const strings: any = {
    'aliasFilterLabel': 'alias filter label',
    'designationFilterLabel': 'designation filter label',
    'sourcepropertyidFilterLabel': 'source property id filter label',
    'nameFilterLabel': 'name filter label',
    'descriptionFilterLabel': 'description filter label',
    'dateTimeFilterLabel': 'date time filter label',
    'timeEmptyFilterLabel': 'time empty filter label',
    'timeLastQuarterHourFilterLabel': 'time last quarter hour filter label',
    'timeLastHalfHourFilterLabel': 'time last half hour filter label',
    'timeLastHourFilterLabel': 'time last hour filter label',
    'timeLastNightFilterLabel': 'time last night filter label',
    'timeYesterdayFilterLabel': 'time yesterday filter label',
    'timeTodayFilterLabel': 'time today filter label',
    'filterClearMsg': 'filter clear msg',
    'searchFilterWatermark': 'search filter watermark',
    'disciplineFilterLabel': 'discipline filter label',
    'categoryFilterLabel': 'category filter label',
    'stateFilterLabel': 'state filter label',
    'srcStateFilterLabel': 'src state filter label',
    'srcSystemFilterLabel': 'src system filter label',
    'hiddenEventsFilterLabel': 'hidden events filter label',
    'hiddenEventsShowLabel': 'hidden events show label',
    'eventStateUnprocessed': 'event state unprocessed',
    'eventStateReadyToBeReset': 'event state ready to be reset',
    'eventStateReadyToBeClosed': 'event state ready to be closed',
    'eventStateWaitingForCondition': 'event state waiting for condition',
    'eventStateAcked': 'event state acked',
    'eventStateClosed': 'event state closed',
    'eventStateUnprocessedWithTimer': 'event state unprocessed with timer',
    'eventStateReadyToBeResetWithTimer': 'event state ready to be reset with timer',
    'eventStateWaitingForCommandExecution': 'event state waiting for command execution',
    'sourceStateActive': 'source state active',
    'sourceStateQuiet': 'source state quiet',
    'contentActionFilterLabel': 'content action filter label',
    'gridControlCustomizeTitle': 'grid control customize title'
  };

  const eventList: any = [{
    categoryDescriptor: 'category descriptor'
  }];

  const pillDataArr: any = [{
    filterId: 0,
    title: 'title',
    icons: true
  }];

  const gridEvent: any = {
    eventType: enumEventType,
    eventData: undefined,
    totalWidth: 0
  };

  const data: any = {
    exitCode: DialogExitCode,
    eventFilter: EventFilter
  };

  const values: any = ['values1', 'values2', 'values3'];

  const eventDateTimeFilterValues: any = {
    none: 0,
    lastQuarterHour: 1,
    lastHalfHour: 2,
    lastHour: 3,
    lastNight: 4,
    yesterday: 5,
    today: 6,
    custom: 7
  };

  const disciplines: any = [{
    get value(): number { return 0; },
    get text(): string { return 'get text test'; }
  }];

  const eventColors: any = {
    textButtonNormal: 1,
    textButtonPressed: 2,
    textEventSelected: 3,
    textEventNormal: 4,
    textEventHover: 5,
    buttonGradientBright: 6,
    buttonGradientDark: 7,
    buttonPressedGradientBright: 8,
    buttonPressedGradientDark: 9,
    buttonBlinkingBright: 10,
    buttonBlinkingDark: 11,
    eventDescriptorSelected: 12,
    eventDescriptorNormal: 13
  };

  const traceModule: any = {
    eventList: 'event list',
    eventListPerformance: 'event list performance'
  };

  const event: any = {
    webClientString: 'web client string',
    categoryDescriptor: 'category descriptor',
    categoryId: 0,
    cause: 'cause',
    commands: undefined,
    creationTime: 'creation time',
    deleted: false,
    descriptionList: undefined,
    descriptionLocationsList: undefined,
    designationList: undefined,
    direction: 'direction',
    eventId: 0,
    id: 'id',
    infoDescriptor: 'info descriptor',
    inProcessBy: 'in process by',
    messageText: ['messageText1', 'messageText2', 'messageText3'],
    messageTextToDisplay: 'message text to display',
    nextCommand: 'next command',
    sourceDesignationList: undefined,
    srcDescriptor: 'src descriptor',
    srcDesignation: 'src designation',
    srcDisciplineDescriptor: 'src discipline descriptor',
    srcDisciplineId: 0,
    srcLocation: 'src location',
    srcName: 'src name',
    srcObservedPropertyId: 'src observed property id',
    srcPropertyId: 'src property id',
    srcState: 'src state',
    srcSubDisciplineId: 0,
    srcSystemId: undefined,
    srcViewDescriptor: 'src view descriptor',
    srcViewName: 'src view name',
    srcSource: ['srcSource1', 'srcSource2', 'srcSource3'],
    sourceFltr: 'source fltr',
    state: 'state',
    suggestedAction: 'suggested action',
    srcSystemName: 'src system name',
    srcAlias: 'src alias',
    oPId: 'o pId',
    treatmentType: 'treatment type',
    informationalText: 'informational text',
    eventText: 'event text',
    container: Event,
    category: Category,
    icon: 'icon',
    groupId: 'group id',
    originalCreationTime: Date,
    originalState: 'original state',
    statePriority: 'state priority',
    stateId: EventStates,
    suggestedActionId: 0,
    srcStateId: 0,
    closedForFilter: false,
    timerUtc: 'timer utc',
    belongsTo: 'belongs to',
    belongsToFltr: 'belongs to fltr',
    groupedEvents: []
  };

  const objectAttributes: any = {
    alias: 'alias',
    defaultProperty: 'default property',
    disciplineDescriptor: 'discipline descriptor',
    disciplineId: 0,
    functionDefaultProperty: 'function default property',
    functionName: 'function name',
    managedType: 0,
    managedTypeName: 'managed type name',
    objectId: 'object id',
    subDisciplineDescriptor: 'sub discipline descriptor',
    subDisciplineId: 0,
    subTypeDescriptor: 'sub type descriptor',
    subTypeId: 0,
    typeDescriptor: 'type descriptor',
    typeId: 0,
    objectModelName: 'object model name'
  };

  const nodes: any = {
    Attributes: objectAttributes, // eslint-disable-line
    descriptor: 'descriptor',
    designation: 'designation',
    hasChild: true,
    name: 'name',
    location: 'location',
    objectId: 'object id',
    systemId: 0,
    viewId: 0,
    viewType: 0
  };

  const gmsMessageData: any = {
    data: nodes,
    selectionType: GmsSelectionType,
    customData: undefined
  };

  const updatedEventMsg: any = {
    events: [1],
    isClosed: true
  };

  const mockFullQParamId: any = jasmine.createSpyObj('MymockFullQParamId', ['fullId']);
  mockFullQParamId.fullId.and.returnValue('full id');

  const mockModalService: any = jasmine.createSpyObj('MymockModalService', ['show']);
  mockModalService.show.and.returnValue('show');

  const mockTraceService: any = jasmine.createSpyObj('MyMockTraceService', ['warn', 'info', 'error', 'debug', 'isDebugEnabled']);
  mockTraceService.warn.and.returnValue(undefined);
  mockTraceService.info.and.returnValue(undefined);
  mockTraceService.error.and.returnValue(undefined);
  mockTraceService.debug.and.returnValue(undefined);
  mockTraceService.isDebugEnabled.and.returnValue(undefined);

  const mockEventService: any = jasmine.createSpyObj('MymockEventService', ['destroyEventSubscription', 'setHiddenEvents', 'setEventsFilter',
    'createEventSubscription', 'realignEventsWithFilter'], ['visibleCategoryLamps']);
  mockEventService.destroyEventSubscription.and.returnValue(undefined);
  mockEventService.setHiddenEvents.and.returnValue(undefined);
  mockEventService.setEventsFilter.and.returnValue(undefined);
  mockEventService.createEventSubscription.and.returnValue(undefined);
  mockEventService.realignEventsWithFilter.and.returnValue(undefined);

  const mockMessageBroker: any = jasmine.createSpyObj('MymockMessageBroker', ['getCurrentMode']);
  mockMessageBroker.getCurrentMode.and.returnValue(of(null));

  const mockTranslateService: any = jasmine.createSpyObj('MymockTranslateService', ['setDefaultLang', 'getBrowserLang', 'use', 'get']);
  mockTranslateService.setDefaultLang.and.returnValue(undefined);
  mockTranslateService.getBrowserLang.and.returnValue(undefined);
  mockTranslateService.use.and.returnValue(of(undefined));
  mockTranslateService.get.and.returnValue(of(strings));

  const mockCategoryService: any = jasmine.createSpyObj('MymockCategoryService', ['getCategories']);
  mockCategoryService.getCategories.and.returnValue(of([{
    id: 4,
    descriptor: '',
    colors: {
      get: (): any => {
        return undefined;
      }
    }
  }]));

  const mocktablesService: any = jasmine.createSpyObj('MymocktablesService', ['getGlobalText']);
  mocktablesService.getGlobalText.and.returnValue(of([{
    value: (): number => {
      return 3;
    },
    text: (): string => {
      return 'text_test';
    }
  }]));

  const mockISnapInConfig: any = jasmine.createSpyObj('MymockISnapInConfig', ['getAvailableModes', 'getSnapInHldlConfig']);
  mockISnapInConfig.getAvailableModes.and.returnValue(undefined);
  mockISnapInConfig.getSnapInHldlConfig.and.returnValue(undefined);

  const mockSettingsService: any = jasmine.createSpyObj('MymockSettingsService', ['deleteSettings', 'getSettings', 'putSettings']);
  mockSettingsService.deleteSettings.and.returnValue(of(true));
  mockSettingsService.getSettings.and.returnValue(of('get Settings'));
  mockSettingsService.putSettings.and.returnValue(of(true));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        EventListSnapInComponent,
        MockSiContentActionBarComponent,
        MockGmsEventContentComponent
      ],
      providers: [
        { provide: SnapInBase, useValue: MockSnapInBase },
        IPreselectionService,
        IStorageService,
        { provide: ActivatedRoute, useValue: {
          'snapshot': {
            'data': {
              'frameId': 'frameId_Test',
              'paneId': 'paneId_Test',
              'snapInId': 'snapInId_Test'
            }
          }

        }
        },
        { provide: BsModalService, useValue: mockModalService },
        { provide: TraceService, useValue: mockTraceService },
        { provide: IHfwMessage, useValue: mockMessageBroker },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: AppContextService, useClass: MockAppContextService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: EventService, useValue: mockEventService },
        { provide: TablesServiceBase, useValue: mocktablesService },
        { provide: CnsHelperService, useClass: MockCnsHelperService },
        { provide: SystemBrowserServiceBase, useClass: MockSystemBrowserService },
        { provide: ISnapInConfig, useValue: mockISnapInConfig },
        { provide: SystemsServiceBase, useClass: MockSystemsService },
        { provide: FullQParamId, useValue: mockFullQParamId },
        { provide: SettingsServiceBase, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventListSnapInComponent);
    component = fixture.componentInstance;

    component.fullSnapInID = {
      frameId: 'frame id',
      snapInId: 'snapin id'
    };

    component.eventFilter = {
      hiddenEvents: undefined,
      from: new Date(),
      to: new Date()
    };

    component.eventListFilterFormStyle = {
      isEventsFilterSelectorOpen: undefined
    };

    component.EventUpdateNotificationMessage = {
      events: event,
      isClosed: false
    };

    fixture.detectChanges();

  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should show EventListSnapInComponent when ngOnInit() is called', async () => {
    mockTranslateService.setDefaultLang.calls.reset();

    component.userLang = undefined;

    const defaultCulture: any = spyOnProperty(component.appContextService, 'defaultCulture', 'get');
    defaultCulture.and.returnValue(of(null));

    (Object.getOwnPropertyDescriptor(mockEventService, 'visibleCategoryLamps')?.get as jasmine.Spy<() => number[]>).and.returnValue([9, 8, 0]);
    component.ngOnInit();
    expect(component._categoryLamps).toEqual([9, 8, 0]);

    expect(mockTranslateService.setDefaultLang).toHaveBeenCalledTimes(1);
    mockTranslateService.setDefaultLang.calls.reset();

    defaultCulture.and.returnValue(of('default culture'));
    component.ngOnInit();
    expect(mockTranslateService.setDefaultLang).toHaveBeenCalledTimes(1);

    expect(component.subscriptions.length).toBeGreaterThan(0);

    mockTraceService.warn.calls.reset();
    const userCulture: any = spyOnProperty(component.appContextService, 'userCulture', 'get');
    userCulture.and.returnValue(of(null));
    component.ngOnInit();
    expect(mockTraceService.warn).toHaveBeenCalledTimes(1);

    mockTranslateService.use.calls.reset();
    userCulture.and.returnValue(of('user culture'));
    component.ngOnInit();
    expect(mockTranslateService.use).toHaveBeenCalledTimes(1);
  });

  it('should destroy EventListSnapInComponent when ngOnDestroy() is called', () => {
    mockEventService.destroyEventSubscription.calls.reset();
    component.eventSubscription = '' as any;
    component.eventSubscription = 'event subscription';
    component.ngOnDestroy();

    expect(component.subscriptions.length).toBeGreaterThan(0);
    expect(mockEventService.destroyEventSubscription).toHaveBeenCalledTimes(1);
  });

  it('should activate onShowEventsFilter() if we open the filter in flexClient', () => {
    const openFilterDialog: any = spyOn(component, 'openFilterDialog');
    component.onShowEventsFilter();
    expect(openFilterDialog).toHaveBeenCalledTimes(1);
  });

  it('should activate onShowColumnSelectionDlg() if we open the column filter in flexClient and isEventsFilterSelectorOpen is true', () => {
    component.isEventsFilterSelectorOpen = true;
    component.onShowColumnSelectionDlg();
    expect(component.isEventsFilterSelectorOpen).toBeFalsy();
  });

  it('should activate onShowColumnSelectionDlg() if we open the column filter in flexClient and isEventsFilterSelectorOpen is false', () => {
    component.isEventsFilterSelectorOpen = false;
    component.onShowColumnSelectionDlg();
    expect(component.isEventsFilterSelectorOpen).toBeFalsy();
  });

  it('should open Filter Dialog when openFilterDialog() is called', () => {
    mockModalService.show.calls.reset();
    component.openFilterDialog();
    expect(mockModalService.show).toHaveBeenCalledTimes(1);
  });

  it('should close Filter Dialog when hiddenFilterRefresh() is called', () => {
    mockEventService.setHiddenEvents.calls.reset();
    component.hiddenFilterRefresh();
    expect(mockEventService.setHiddenEvents).toHaveBeenCalledTimes(1);
  });

  it('should execute onClearEventsFilter() when is called', () => {
    mockEventService.setEventsFilter.calls.reset();
    component.onClearEventsFilter();
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should activate onSelectEvent() if an Event is selected', () => {
    component.selectedEvents = [event];
    const notifyEventsSelection: any = spyOn(component, 'notifyEventsSelection');
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.openFilterDlgCommandEnabled = true;
    component.onSelectEvent(events);
    expect(notifyEventsSelection).toHaveBeenCalledTimes(1);
  });

  it('should activate onEventsNumberNotification() for each action in Events on FlexClient', () => {
    component.onEventsNumberNotification(1);
    expect(component.numEventsInGrid).toBe(1);
  });

  it('should activate sendmsg() for each events selected', () => {
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.computeId = 'compute id';
    component.sendmsg([nodes]);
    expect(component.computeId).not.toBeNull();
    expect(component.broadcast).toBeFalsy();
  });

  it('should activate computeId() for each events selected', () => {
    const eventId: any = component.computeId(event);
    expect(eventId).toEqual(event.id);
  });

  it('should activate computeId() for each events selected {else condition}', () => {
    const eventElse: any = {
      id: 'id',
      groupedEvents: ['*']
    };
    const eventId: any = component.computeId(eventElse);
    expect(eventId).toEqual(eventElse.id + '*');
  });

  it('should activate onNotifyUpdatedSelection() if an Event is selected', () => {
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    const notifyNoSelection: any = spyOn(component, 'notifyNoSelection').and.returnValue(undefined);
    component.onNotifyUpdatedSelection(updatedEventMsg);
    expect(notifyNoSelection).toHaveBeenCalledTimes(1);
  });

  it('should activate onNotifyUpdatedSelection() if an Event is selected {first else condition}', () => {
    const updatedEventMsgFElse: any = {
      events: [],
      isClosed: true
    };
    component.lastSelectionMessage = { body: GmsMessageData };
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    const notifyEventsSelection: any = spyOn(component, 'notifyEventsSelection').and.returnValue(undefined);
    component.onNotifyUpdatedSelection(updatedEventMsgFElse);
    expect(notifyEventsSelection).toHaveBeenCalledTimes(1);
  });

  it('should activate onNotifyUpdatedSelection() if an Event is selected {second else condition}', () => {
    const updatedEventMsgSElse: any = {
      events: [],
      isClosed: false
    };
    component.lastSelectionMessage = { body: GmsMessageData };
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.onNotifyUpdatedSelection(updatedEventMsgSElse);
    expect(component.broadcast).toBeFalsy();
  });

  it('should activate onSelectEvent() if an Event is selected {else solution}', () => {
    component.selectedEvents.length = 0;
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.onSelectEvent(events);
    expect(component.openFilterDlgCommandEnabled).toBeTruthy();
  });

  it('should delete disciplines filter if the case 1 passes', () => {
    const pillData: any = {
      filterId: 1,
      title: 'title1',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete categories filter if the case 2 passes', () => {
    const pillData: any = {
      filterId: 2,
      title: 'title2',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete states filter if the case 3 passes', () => {
    const pillData: any = {
      filterId: 3,
      title: 'title3',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete srcState filter if the case 4 passes', () => {
    const pillData: any = {
      filterId: 4,
      title: 'title4',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete srcAlias filter if the case 5 passes', () => {
    const pillData: any = {
      filterId: 5,
      title: 'title5',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete srcAlias filter if the case 6 passes', () => {
    mockEventService.setEventsFilter.calls.reset();
    const pillData: any = {
      filterId: 6,
      title: 'title6',
      icons: false
    };
    component.eventFilter = { srcDesignations: ['title1', 'title2', 'title3'] };
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete srcAlias filter if the other case 6 passes', () => {
    mockEventService.setEventsFilter.calls.reset();
    const pillData: any = {
      filterId: 6,
      title: 'title6',
      icons: false
    };
    component.eventFilter = { srcPropertyIds: ['title1', 'title2', 'title3'] };
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete srcDescriptor filter if the case 7 passes', () => {
    const pillData: any = {
      filterId: 7,
      title: 'title7',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete srcName filter if the case 8 passes', () => {
    const pillData: any = {
      filterId: 8,
      title: 'title8',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete creationDateTime filter if the case 9 passes', () => {
    const pillData: any = {
      filterId: 9,
      title: 'title9',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete the srcSystem filter if the case 10 passes', () => {
    const pillData: any = {
      filterId: 10,
      title: 'title10',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should delete the hiddenEvents filter if the case 11 passes', () => {
    const pillData: any = {
      filterId: 11,
      title: 'title11',
      icons: false
    };
    mockEventService.setEventsFilter.calls.reset();
    component.onDeletePill(pillData);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should select and open event when onEventSelected() is called', () => {
    component.selectedEvents.length = 0;
    const onSelectEvent: any = spyOn(component, 'onSelectEvent');
    component.onEventSelected(eventList);
    expect(component.selectedEvents.findIndex(item => item.categoryDescriptor === 'category descriptor')).not.toBe(-1);
    expect(onSelectEvent).toHaveBeenCalledTimes(1);
  });

  it('should return Events when catchEvents() is called', () => {
    mockTraceService.info.calls.reset();
    component.catchEvents(gridEvent);
    expect(mockTraceService.info).toHaveBeenCalledTimes(1);
  });

  it('should be enabled onDialogData() when the radio button in the filter is selected', () => {
    mockEventService.setEventsFilter.calls.reset();
    data.exitCode = DialogExitCode;
    component.onDialogData(data);
    expect(mockEventService.setEventsFilter).toHaveBeenCalledTimes(1);
  });

  it('should activate selectEvents() for each action in the Events flexClient', () => {
    mockTraceService.debug.calls.reset();
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.selectEvents(events);
    expect(mockTraceService.debug).toHaveBeenCalledTimes(1);
  });

  it('should open Events on flexClient when setFilter() is called and customData is Unprocessed', () => {
    component.setFilter(false);

    expect(component.stateTree.findIndex(item => item.customData[0] === 'Unprocessed')).not.toEqual(-1);
  });

  it('should be trigger onTraslateStrings() when called', () => {
    mockISnapInConfig.getAvailableModes.and.returnValue(true);
    mockMessageBroker.getCurrentMode.and.returnValue(of(0));
    spyOn(component, 'setFilter').and.returnValue(undefined);
    component._categoryLamps = [];
    component.onTraslateStrings(strings);
    expect(mockMessageBroker.getCurrentMode).toHaveBeenCalledTimes(1);
  });

  it('should activate pillDataForFilterDiscipline() for each filter action', async () => {
    component.disciplineTree = [{ checked: true, label: 'label1' }];
    component.eventFilter = { disciplines: [1, 2, 3] };
    expect(component.pillDataForFilterDiscipline(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate notifyNoSelection() when we do not select any filters in the filter', () => {
    mockTraceService.debug.calls.reset();
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.notifyNoSelection();
    expect(mockTraceService.debug).toHaveBeenCalledTimes(1);
  });

  it('should activate filterToPillDataArr() when we add and remove filter', () => {
    component.eventFilter.categories = [0, 1, 2];
    component._categoryLamps = [0, 3, 4];
    component._categories = [{ id: 0, colors: { get: (): any => { return 'get'; } } }];
    component.eventFilter.creationDateTime = { none: 0 };
    component.filterToPillDataArr();
    expect(eventColors.buttonGradientDark).toBe(7);
  });

  it('should activate pillDataForFilterState() for each filter action', async () => {
    component.stateTree = [{ checked: true, label: 'label_1' }];
    component.eventFilter = { states: ['states1', 'states2', 'states3'] };
    expect(component.pillDataForFilterState(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate pillDataForFilterLabel() for each filter action', async () => {
    component.srcStateTree = [{}] as any;
    component.srcStateTree = [{ checked: true, label: 'label__1' }];
    component.eventFilter = { srcState: ['srcState1', 'srcState2', 'srcState3'] };
    expect(component.pillDataForFilterLabel(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate pillDataForHiddenEvents() for each filter action', async () => {
    component.eventFilter = {};
    component.eventFilter = { hiddenEvents: true };
    expect(component.pillDataForHiddenEvents(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.LastQuarterHour passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.LastQuarterHour };
    component.timeLastQuarterHourFilterLabel = 'time last quarter hour filter label';
    component.pushValueForVariousFilter(values);
    expect(component.timeLastQuarterHourFilterLabel).toBe('time last quarter hour filter label');
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.LastHalfHour passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.LastHalfHour };
    component.timeLastHalfHourFilterLabel = 'time last half hour filter label';
    component.pushValueForVariousFilter(values);
    expect(component.timeLastHalfHourFilterLabel).toBe('time last half hour filter label');
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.LastHour passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.LastHour };
    component.timeLastHourFilterLabel = 'time last hour filter label';
    component.pushValueForVariousFilter(values);
    expect(component.timeLastHourFilterLabel).toBe('time last hour filter label');
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.LastNight passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.LastNight };
    component.timeLastNightFilterLabel = 'time last night filter label';
    component.pushValueForVariousFilter(values);
    expect(component.timeLastNightFilterLabel).toBe('time last night filter label');
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.Today passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.Today };
    component.timeTodayFilterLabel = 'time today filter label';
    component.pushValueForVariousFilter(values);
    expect(component.timeTodayFilterLabel).toBe('time today filter label');
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.Yesterday passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.Yesterday };
    component.timeYesterdayFilterLabel = 'time yesterday filter label';
    component.pushValueForVariousFilter(values);
    expect(component.timeYesterdayFilterLabel).toBe('time yesterday filter label');
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.Custom passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.Custom, from: new Date(), to: new Date() };
    expect(component.pushValueForVariousFilter(values)).not.toBeNull();
  });

  it('should activate pushValueForVariousFilter() if EventDateTimeFilterValues.Custom passed', () => {
    component.eventFilter = { creationDateTime: EventDateTimeFilterValues.Custom, from: new Date(), to: null };
    expect(component.pushValueForVariousFilter(values)).not.toBeNull();
  });

  it('should activate pushPillDataForVariousFilter() when srcAlias is not undefined and greater than 0', () => {
    component.eventFilter = { srcAlias: 'src alias' };
    expect(component.pushPillDataForVariousFilter(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate pushPillDataForVariousFilter() when srcDesignations is not undefined and greater than 0', () => {
    component.eventFilter = { srcDesignations: ['srcDesignations1', 'srcDesignations2', 'srcDesignations3'] };
    expect(component.pushPillDataForVariousFilter(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate pushPillDataForVariousFilter() when srcDescriptor is not undefined and greater than 0', () => {
    component.eventFilter = { srcDescriptor: 'srcDescriptor' };
    expect(component.pushPillDataForVariousFilter(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate pushPillDataForVariousFilter() when srcName is not undefined and greater than 0', () => {
    component.eventFilter = { srcName: 'srcName' };
    expect(component.pushPillDataForVariousFilter(pillDataArr).length).toBeGreaterThan(0);
  });

  it('should activate onGetDisciplines() if we move to Events on FlexClient', async () => {
    mockEventService.createEventSubscription.calls.reset();
    mockTraceService.error.calls.reset();
    component.pushPillDataForVariousFilter(disciplines);
    expect(component.disciplineTree.findIndex(item => item.state === 'leaf')).not.toBe(-1);
    expect(mockEventService.createEventSubscription).toHaveBeenCalledTimes(0);
    expect(mockTraceService.error).not.toHaveBeenCalled();
  });

  it('should not activate unselectAllEvents() because is not called', () => {
    mockTraceService.debug.calls.reset();
    component.selectedEvents.length = 0;
    spyOn(component, 'sendMessage').and.returnValue(of(undefined));
    component.unselectAllEvents();
    expect(mockTraceService.debug).toHaveBeenCalledTimes(1);
  });

  it('should trigger realignEventListData() for each filter action', () => {
    mockEventService.realignEventsWithFilter.calls.reset();
    component.realignEventListData();
    expect(mockEventService.realignEventsWithFilter).toHaveBeenCalledTimes(1);
  });

});
