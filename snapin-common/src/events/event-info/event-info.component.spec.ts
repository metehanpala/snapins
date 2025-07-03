/* eslint-disable @typescript-eslint/naming-convention */
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { EventsValidationHelperService } from '../services/events-validation-helper.service';
import { EventInfoComponent } from './event-info.component';
import {
  AssistedTreatmentService,
  BrowserObject,
  Category,
  CnsHelperService,
  ErrorNotificationService,
  EventService, EventStates, GmsSelectionType, MultiMonitorServiceBase, SiIconMapperService, SystemBrowserServiceBase, ValidationCredentialRepresentation,
  ValidationEditInfo, ValidationInput,
  ValidationResult,
  ValidationResultStatus,
  ViewInfo,
  WsiEndpointService
} from '@gms-flex/services';
import { ValidationDialogService } from '../../validation-dialog/services/validation-dialog.service';
import { ValidationCredentialType } from '../../validation-dialog/utilities/validation-dialog.response';
import {
  AppContextService, AuthenticationServiceBase, ErrorNotificationServiceBase, MockAuthenticationService,
  MockTraceService, MockWsiEndpointService, TraceService
} from '@gms-flex/services-common';
import { BsModalService } from 'ngx-bootstrap/modal';
import { HttpClient } from '@angular/common/http';
import {} from '@angular/common/http/testing';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { EventsCommonServiceBase } from '../services';
import { SiActionDialogService } from '@simpl/element-ng';
import { TranslateService } from '@ngx-translate/core';
import { FullSnapInId, IHfwMessage } from '@gms-flex/core';
import { By } from '@angular/platform-browser';

class MockCommonTranslateService {
  public get(key: string | string[], interpolateParams?: object): Observable<string | string[]> {
    return of(key);
  }
  public getBrowserLang(): string {
    return 'en';
  }
}

@Component({
  selector: 'gms-event-info',
  template: '<div></div>',
  providers: [
    { provide: EventInfoComponent, useClass: MockGmsEventInfoComponent }
  ],
  standalone: false
})
class MockGmsEventInfoComponent {
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
  @Input() public goBack: Observable<boolean> = new Observable<boolean>();
  @Output() public readonly containerPage: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly goToSystem: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly goToInvestigativeTreatment: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly exitFromInvestigativeTreatment: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly goToAssistedTreatment: EventEmitter<any> = new EventEmitter<Event>();
  @Output() public readonly exitFromAssistedTreatment: EventEmitter<any> = new EventEmitter<Event>();
}

describe('EventInfoComponent', () => {
  let component;
  let fixture: ComponentFixture<EventInfoComponent>;
  let myService: EventsValidationHelperService;
  let authenticationServiceSpy: jasmine.SpyObj<AuthenticationServiceBase>;

  // #BEGIN DATA CONSTRUCTION
  const strings: any = {
    'sourceStateActive': 'source state active',
    'sourceStateQuiet': 'EVENTS.SOURCE-STATE-QUIET',
    'eventStateUnprocessed': 'EVENTS.EVENT-STATE-UNPROCESSED',
    'eventStateReadyToBeReset': 'EVENTS.EVENT-STATE-READY-TO-BE-RESET',
    'eventStateReadyToBeClosed': 'EVENTS.EVENT-STATE-READY-TO-BE-CLOSED',
    'eventStateWaitingForCommandExecution': 'EVENTS.EVENT-STATE-WAITING-FOR-COMMAND-EXECUTION',
    'eventStateWaitingForCondition': 'EVENTS.EVENT-STATE-WAITING-FOR-CONDITION',
    'eventStateAcked': 'EVENTS.EVENT-STATE-ACKED',
    'eventStateClosed': 'EVENTS.EVENT-STATE-CLOSED',
    'eventStateUnprocessedWithTimer': 'EVENTS.EVENT-STATE-UNPROCESSED-WITH-TIMER',
    'eventStateReadyToBeResetWithTimer': 'EVENTS.EVENT-STATE-READY-TO-BE-RESET-WITH-TIMER',
    'suggestedActionAcknowledge': 'EVENTS.SUGGESTED-ACTION-ACKNOWLEDGE',
    'suggestedActionClose': 'EVENTS.SUGGESTED-ACTION-CLOSE',
    'suggestedActionCompleteOP': 'EVENTS.SUGGESTED-ACTION-COMPLETE-OP',
    'suggestedActionReset': 'EVENTS.SUGGESTED-ACTION-RESET',
    'suggestedActionSilence': 'EVENTS.SUGGESTED-ACTION-SILENCE',
    'suggestedActionSuspend': 'EVENTS.SUGGESTED-ACTION-SUSPEND',
    'suggestedActionWaitForCondition': 'EVENTS.SUGGESTED-ACTION-WAIT-FOR-CONDITION',
    'numberOfSelectedEventsLabel': 'EVENTS.NUMBER-OF-SELECTED-EVENTS',
    'noEventNotesForMultiselection': 'EVENTS.EVENT-NOTES-FOR-MULTISELECTION',
    'newEventNoteAdded': 'EVENTS.EVENT-NOTES-ADDED',
    'eventNotesLoading': 'EVENTS.EVENT-NOTES-LOADING',
    'noEventNotes': 'EVENTS.NO-EVENT-NOTES-AVAILABLE',
    'newMultipleEventsNoteAdded': 'EVENTS.MULTIPLE-EVENTS-NOTES-ADDED',
    'noEventSelected': 'EVENTS.NO-EVENT-SELECTED',
    'ackCommandText': 'EVENTS.ACK-COMMAND-TEXT',
    'resetCommandText': 'EVENTS.RESET-COMMAND-TEXT',
    'silenceCommandText': 'EVENTS.SILENCE-COMMAND-TEXT',
    'unsilenceCommandText': 'EVENTS.UNSILENCE-COMMAND-TEXT',
    'closeCommandText': 'EVENTS.CLOSE-COMMAND-TEXT',
    'goToSystemCommandText': 'EVENTS.GO-TO-SYSTEM-COMMAND-TEXT',
    'eventCauseTitle': 'EVENTS.EVENT-CAUSE-TITLE',
    'eventInterventionTextTitle': 'EVENTS.EVENT-INTERVENTION-TEXT-TITLE',
    'eventSrcStateTitle': 'EVENTS.EVENT-SRC-STATE-TITLE',
    'eventStateTitle': 'EVENTS.EVENT-STATE-TITLE',
    'eventSrcSourceTitle': 'EVENTS.EVENT-SRC-SOURCE-TITLE',
    'eventSrcLocationTitle': 'EVENTS.EVENT-SRC-LOCATION-TITLE',
    'eventTimeTitle': 'EVENTS.EVENT-TIME-TITLE',
    'eventDateTitle': 'EVENTS.EVENT-DATE-TITLE',
    'eventIdTitle': 'EVENTS.EVENT-ID-TITLE',
    'eventDisciplineTitle': 'EVENTS.EVENT-DISCIPLINE-TITLE',
    'eventInProcessByTitle': 'EVENTS.EVENT-IN-PROCESS-BY-TITLE',
    'eventMessageTextTitle': 'EVENTS.EVENT-MESSAGE-TEXT-TITLE',
    'eventCategoryTitle': 'EVENTS.EVENT-CATEGORY-TITLE',
    'eventSrcDesignationTitle': 'EVENTS.EVENT-SRC-DESIGNATION-TITLE',
    'eventSrcSystemIdTitle': 'EVENTS.EVENT-SRC-SYSTEM-ID-TITLE',
    'eventSrcSystemNameTitle': 'EVENTS.EVENT-SRC-SYSTEM-NAME-TITLE',
    'investigateSystem': 'EVENTS.INVESTIGATE-SYSTEM',
    'assistedTreatment': 'EVENTS.ASSISTED-TREATMENT',
    'leave': 'EVENTS.LEAVE',
    'detailsAccordion': 'EVENTS.DETAILS-ACCORDION',
    'eventNotesAccordion': 'EVENTS.EVENT-NOTES-ACCORDION',
    'multipleSelection': 'EVENTS.MULTIPLE-SELECTION',
    'eventNotesRefresh': 'EVENTS.EVENT-NOTES-REFRESH',
    'eventNotesNew': 'EVENTS.EVENT-NOTES-NEW',
    'belongsToTitle': 'EVENTS.BELONGS-TO-TITLE',
    'showPath': 'EVENTS.SHOW-PATH',
    'eventGridTitle': 'EVENTS.EVENTS-GRID-TITLE',
    'showMore': 'EVENTS.SHOW-MORE',
    'showLess': 'EVENTS.SHOW-LESS',
    'modalTitle': 'EVENTS.MODAL-TITLE',
    'modalText': 'EVENTS.MODAL-TEXT'
  };

  const validationInput: any = {
    message: '',
    comments: 'Comment',
    password: '12345',
    superName: 'SuperAdmin',
    superPassword: '123456'
  };

  const event: any = {
    webClientString: 'web client string',
    categoryDescriptor: 'category descriptor',
    categoryId: 0,
    cause: 'cause',
    commands: ['ack', 'reset', 'silence', 'close'],
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
    customData: ['customData1', 'customData2', 'customData3'],
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

  const viewModel: any = [{
    name: 'name',
    designation: 'designation',
    descriptor: 'descriptor',
    systemId: 1,
    systemName: 'system name',
    viewId: 1,
    viewType: 1
  }];

  const objectAttributes: any = {
    alias: 'alias',
    defaultProperty: 'defaultProperty',
    disciplineDescriptor: 'disciplineDescriptor',
    disciplineId: 1,
    functionDefaultProperty: 'function default property',
    functionName: 'function name',
    managedType: 1,
    managedTypeName: 'managed type name',
    objectId: 'object id',
    subDisciplineDescriptor: 'sub discipline descriptor',
    subDisciplineId: 1,
    subTypeDescriptor: 'sub type descriptor',
    subTypeId: 1,
    typeDescriptor: 'type descriptor',
    typeId: 1,
    objectModelName: 'object model name',
    customData: undefined
  };

  const browserObject: any[] = [{
    attributes: objectAttributes,
    descriptor: 'descriptor',
    designation: 'designation',
    hasChild: false,
    name: 'name',
    location: 'location',
    objectId: 'objectId',
    systemId: 0,
    viewId: 0,
    viewType: 0
  }];

  const page: any = {
    Nodes: ['nodes1', 'nodes2', 'nodes3'], // eslint-disable-line
    page: 1,
    size: 1,
    total: 1
  };

  const objectNode: any = [{
    objectId: 'objectId',
    errorCode: 0,
    nodes: ['nodes']
  }];

  const systemBrowserSubscriptionKey: any = {
    key: 1,
    designations: ['designations 1', 'designations 2', 'designations 3'],
    errorCode: 1,
    requestId: 'request id',
    rvequestFor: 'request for'
  };

  const viewNode: any = {
    name: 'name',
    designation: 'designation',
    descriptor: 'descriptor',
    systemId: 1,
    systemName: 'systemName',
    viewId: 1,
    viewType: 1
  };

  const systemBrowserSubscription: any = {
    action: 0,
    change: 0,
    node: browserObject,
    view: viewNode,
    subscriptionKey: 0
  };

  const viewInfo: any = {
    description: 'description',
    viewType: undefined,
    toString: (): any => 'toString',
    containsDesignationString: (): any => false,
    containsDesignation: (): any => false,
    containsObject: (bo: BrowserObject): any => true,
    containsViewNode: (): any => false,
    isEqual: (): any => false
  };

  const modeData: any = {
    id: 'id',
    relatedValue: undefined
  };

  const mesg: any = {
    data: 'data',
    selectionType: GmsSelectionType.None,
    customData: ['customData1', 'customData2']
  };
  // #END DATA CONSTRUCTION

  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);

  // Mock eventService and eventsCommonServiceBase
  // Mock serverClientDiff for events
  const mockEventService = jasmine.createSpyObj('EventService', ['serverClientTimeDiff']);
  mockEventService.serverClientTimeDiff.and.returnValue(new Promise((resolve, reject) => {
    resolve(1);
  }));
  let mockEventsCommonServiceBase: any = {};
  mockEventsCommonServiceBase = jasmine.createSpyObj('EventsCommonServiceBase', ['commonTranslateService']);
  mockEventsCommonServiceBase.commonTranslateService = new MockCommonTranslateService();

  // Mock eventsValidationHelperService
  const mockEventsValidationHelperService = jasmine.createSpyObj(['eventDetailsValidationService']);

  // Mock ValidationDialogService
  const mockValidationDialogService = jasmine.createSpyObj(['processValidationEditObject', 'processValidationCommandObject', 'show', 'showModal',
    'processInvalidObject', 'fillUserComments', 'handleSuccess', 'handleCancel', 'ngOnDestroy']);

  // Mock BsModal
  const mockModalService: any = jasmine.createSpyObj('MymockModalService', ['show']);
  mockModalService.show.and.returnValue('show');

  // Mock httpClient
  const httpPost = new Observable<boolean>();
  const httpRequest = new Observable<boolean>();
  let httpGet: any;
  const httpClient = jasmine.createSpyObj('httpClient', ['post', 'request', 'get']);
  httpClient.post.and.returnValue(httpPost);
  httpClient.request.and.returnValue(httpRequest);
  httpClient.get.and.returnValue(httpGet);

  // Mock Authentication
  authenticationServiceSpy = jasmine.createSpyObj('AuthenticationServiceBase', ['get']);
  authenticationServiceSpy = {
    ...authenticationServiceSpy,
    userNameEvent: of(undefined),
    userDescriptorEvent: of(undefined),
    userProfileEvent: of(undefined)
  } as jasmine.SpyObj<AuthenticationServiceBase>;

  // Mock ActionDialogService
  const mockSiActionDialogService: any = null;

  // Mock ErrorService
  const mockErrorNotificationService: any = null;

  // Mock AppContextService
  class MockAppContextService {
    public get defaultCulture(): Observable<string> {
      return of(undefined);
    }
    public get userCulture(): Observable<string> {
      return of(undefined);
    }
  }

  // Mock SystemBrowserServiceBase
  const mockSystemBrowserServiceBase: any = jasmine.createSpyObj('MyMockSystemBrowserServiceBase', ['getViews', 'getNodes', 'searchNodes', 'searchNodeMultiple',
    'subscribeNodeChanges', 'nodeChangeNotification', 'searchViewNodeMultiple']);
  mockSystemBrowserServiceBase.getViews.and.returnValue(of(viewModel));
  mockSystemBrowserServiceBase.getNodes.and.returnValue(of(browserObject));
  mockSystemBrowserServiceBase.searchNodes.and.returnValue(of(page));
  mockSystemBrowserServiceBase.searchNodeMultiple.and.returnValue(of(objectNode));
  mockSystemBrowserServiceBase.subscribeNodeChanges.and.returnValue(of(systemBrowserSubscriptionKey));
  mockSystemBrowserServiceBase.nodeChangeNotification.and.returnValue(of(systemBrowserSubscription));
  mockSystemBrowserServiceBase.searchViewNodeMultiple.and.returnValue(of(undefined));

  // Mock CnsHelperService for TranslateService
  class MockCnsHelperService {
    public get activeCnsLabel(): Observable<ViewInfo> {
      return of(undefined);
    }
    public get activeView(): Observable<ViewInfo> {
      return of(undefined);
    }
  }

  // Mock TranslateService
  const mockTranslateService: any = jasmine.createSpyObj('MyMockTranslateService', ['setDefaultLang', 'getBrowserLang', 'use', 'get']);
  mockTranslateService.setDefaultLang.and.returnValue(undefined);
  mockTranslateService.getBrowserLang.and.returnValue('get browser culture lang');
  mockTranslateService.get.and.returnValue(of(strings));

  //  Mock IconMapperService
  let mockSiIconMapperService: any = null;
  mockSiIconMapperService = jasmine.createSpyObj('SiIconMapperService', ['getGlobalIcon']);
  mockSiIconMapperService.getGlobalIcon.and.returnValue(of(''));

  // Mock MultiMonitorService
  const mockMultiMonitorServiceBase: any = jasmine.createSpyObj('MyMockMultiMonitorServiceBase', ['isMainManager', 'isSingleSystemManager',
    'onCurrentMultiMonitorConfigurationChanged', 'isManagerWithEvent', 'saveCurrentConfigurationAsDefault', 'sendObjectToWindow', 'sendObjectToMainManager',
    'sendObjectToAllWindows', 'sendEvent', 'resetToDefaultConfiguration', 'synchronizeUiState'], ['runsInElectron']);
  mockMultiMonitorServiceBase.isMainManager.and.returnValue(false);
  mockMultiMonitorServiceBase.isSingleSystemManager.and.returnValue(Promise.resolve(undefined));
  mockMultiMonitorServiceBase.onCurrentMultiMonitorConfigurationChanged.and.returnValue(of(undefined));
  mockMultiMonitorServiceBase.isManagerWithEvent.and.returnValue(false);
  mockMultiMonitorServiceBase.saveCurrentConfigurationAsDefault.and.returnValue(undefined);
  mockMultiMonitorServiceBase.sendObjectToWindow.and.returnValue(undefined);
  mockMultiMonitorServiceBase.sendObjectToMainManager.and.returnValue(undefined);
  mockMultiMonitorServiceBase.sendObjectToAllWindows.and.returnValue(undefined);
  mockMultiMonitorServiceBase.sendEvent.and.returnValue(undefined);
  mockMultiMonitorServiceBase.resetToDefaultConfiguration.and.returnValue(Promise.resolve(false));
  mockMultiMonitorServiceBase.synchronizeUiState.and.returnValue(undefined);

  // Mock HfwMessage
  const mockIHfwMessage: any = jasmine.createSpyObj('MyMockIHfwMessage', ['changeMode', 'getCurrentMode', 'getMessage']);
  mockIHfwMessage.changeMode.and.returnValue(of(false));
  mockIHfwMessage.getCurrentMode.and.returnValue(of(modeData));
  mockIHfwMessage.getMessage.and.returnValue(of(undefined));

  // Mock Event Assisted treatment
  const mockAssistedTreatmentService = jasmine.createSpyObj('AssistedTreatmentService', ['subscribeProcedure', 'unSubscribeProcedure']);
  mockAssistedTreatmentService.subscribeProcedure(of(''));
  mockAssistedTreatmentService.unSubscribeProcedure(of(''));

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [EventInfoComponent, MockGmsEventInfoComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: ErrorNotificationServiceBase, useClass: mockErrorNotificationService },
        { provide: EventsValidationHelperService, useValue: { mockEventsValidationHelperService } },
        { provide: ValidationDialogService, useValue: { mockValidationDialogService } },
        { provide: EventService, useValue: mockEventService },
        { provide: TraceService, useClass: MockTraceService },
        { provide: BsModalService, useValue: mockModalService },
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        { provide: HttpClient, useValue: httpClient },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: EventsCommonServiceBase, useValue: mockEventsCommonServiceBase },
        { provide: SiActionDialogService, useValue: mockSiActionDialogService },
        { provide: AppContextService, useClass: MockAppContextService },
        { provide: CnsHelperService, useClass: MockCnsHelperService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: SiIconMapperService, useValue: mockSiIconMapperService },
        { provide: MultiMonitorServiceBase, useValue: mockMultiMonitorServiceBase },
        { provide: IHfwMessage, useValue: mockIHfwMessage },
        { provide: AssistedTreatmentService, useValue: mockAssistedTreatmentService },
        { provide: SystemBrowserServiceBase, useValue: mockSystemBrowserServiceBase }
      ],
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(EventInfoComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    component.strings = strings;
    mockTranslateService.setDefaultLang.calls.reset();
    component.translateService = mockTranslateService;
    component.userLang = undefined;
    const defaultCulture: any = spyOnProperty(component.appContextService, 'defaultCulture', 'get');
    defaultCulture.and.returnValue(of('default culture'));

    const activeView: any = spyOnProperty(component.cnsHelperService, 'activeView', 'get');
    activeView.and.returnValue(of(null));

  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should create event-info component', async () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  it('should destroy the event-info component', async () => {
    component.ngOnDestroy();
    expect(component.subscriptions.length).toBeGreaterThan(0);
  });

  it('should call the selectCommand and validate', async () => {
    component.ngOnInit();
    const spy = spyOn(component, 'onSelectCommand');
    component.onSelectCommand('ack', event);
    expect(spy).toHaveBeenCalled();
    expect(mockEventsValidationHelperService.eventDetailsValidationService.and.returnValue(of(validationInput)));
  });

  it('should check if goToSystemCommand works', async () => {
    component.ngOnInit();
    const spy = spyOn(component, 'goToSystemCommand');
    component.goToSystemCommand(event);
    expect(spy).toHaveBeenCalled();
  });

  it('should check if source state is set correctly', async () => {
    component.ngOnInit();
    const spy = spyOn(component, 'getSourceState');
    component.goToSystemCommand('Active');
    fixture.detectChanges();
    expect(spy.and.returnValue(component.sourceStateActive));
    component.goToSystemCommand('Quiet');
    fixture.detectChanges();
    expect(spy.and.returnValue(component.sourceStateQuiet));
  });

});
