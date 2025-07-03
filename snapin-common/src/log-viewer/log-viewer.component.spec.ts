/* eslint-disable @typescript-eslint/naming-convention */
import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DebugElement, ElementRef, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FullSnapInId, IHfwMessage, IStorageService } from '@gms-flex/core';
import {
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  GmsMessageData,
  GmsSelectionType,
  HistLogColumnDescription,
  HistLogEnumValues,
  HistoryLogTable,
  LogViewerService,
  LogViewerServiceBase,
  ObjectAttributes,
  SettingsService,
  SiIconMapperService,
  SystemBrowserService,
  SystemBrowserServiceBase,
  SystemsService,
  SystemsServiceBase,
  ValueDetails, ValueService,
  ValueServiceBase
} from '@gms-flex/services';
import { AppContextService, MockTraceService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ResizeObserverService, SiContentActionBarModule, SiFilteredSearchModule, SiMainDetailContainerModule } from '@simpl/element-ng';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable, of } from 'rxjs';
import { LogViewerSnapinComponent } from 'projects/log-viewer/src/lib/snapin/log-viewer-snapin.component';
import { HistoryLogService } from './services/history-log.service';
import { LogViewerComponent } from './log-viewer.component';
import { EventsCommonServiceBase } from '../events/services/events-common.service.base';

describe('LogViewerComponent', () => {
  let component: LogViewerComponent;
  let fixture: ComponentFixture<LogViewerComponent>;
  let mockEventCommonService: any = null;
  let mockSiIconMapperService: any;
  const historyColumnDescription: HistLogColumnDescription =
    {
      Name: 'Time',
      Descriptor: 'string',
      DataType: 'string',
      ErrorSupport: true,
      IsArray: true,
      IsDefault: true,
      IsHidden: true,
      IsSortable: true,
      IsEnum: true,
      IsFilterable: true
    };
  const logViewResult = [
    {
      Id: 1,
      EventId: 1,
      Time: '2021-09-22T18:54:56.443Z',
      LogType: 'LogType',
      RecordType: 'RecordType',
      AuditFlag: 'AuditFlag',
      UserName: 'UserName',
      Workstation: 'Workstation',
      Action: 'Action',
      Status: 'string',
      Name: 'string',
      Description: 'string',
      InternalName: 'string',
      HiddenInternalName: 'string',
      DefaultViewDesignation: 'string',
      DefaultViewLocation: 'string',
      CurrentViewDesignation: 'string',
      CurrentViewLocation: 'string',
      ManagementDesignation: 'string',
      ManagementLocation: 'string',
      SystemName: 'string',
      Discipline: 'string',
      SubDiscipline: 'string',
      Type: 'string',
      SubType: 'string',
      ValProf: 'string',
      EventCatPrio: 11,
      EventCause: 'string',
      AlertId: 'string',
      AlarmCategory: 'string',
      AlertMode: 'string',
      EventMessageText: 'string',
      AlertTime: 'string',
      AlertState: 'string',
      ObjectPropertyLogView: 'string',
      ObserverObjectPropertyLogView: 'string',
      LogicalDesignation: 'string',
      LogicalLocation: 'string',
      ObserverName: 'string',
      ObserverDescription: 'string',
      ObserverNameInternal: 'string',
      ObserverDefaultHierarchyDesignation: 'string',
      ObserverDefaultHierarchyLocation2: 'string',
      DeviceEventText: 'string',
      ValueDurationTicks: 11,
      Value: 'string',
      ApplicationDesignation: 'string',
      ApplicationLocation: 'string',
      PrevValueDurationTicks: 11,
      PrevValue: 'string',
      MessageText: 'string',
      Error: 'string'
    }];

  const linkLog = [{
    Rel: 'rel',
    Href: 'href',
    IsTemplated: false
  }];

  const historyLogData = {
    TableName: 'tableName',
    Size: 1,
    Page: 1,
    Result: logViewResult,
    SnapshotId: 'snapshotId',
    Total: 1,
    ErrorInfo: ['string'],
    _links: linkLog
  };

  const objAttrs: ObjectAttributes = {
    Alias: '',
    DefaultProperty: 'StatusPropagation.AggregatedSummaryStatus',
    DisciplineDescriptor: 'Management System',
    DisciplineId: 0,
    FunctionName: '',
    ManagedType: 166,
    ManagedTypeName: 'LogViewer',
    ObjectId: 'System1:LogViewer',
    SubDisciplineDescriptor: 'Unassigned',
    SubDisciplineId: 0,
    SubTypeDescriptor: 'System Folder',
    SubTypeId: 8014,
    TypeDescriptor: 'View Element',
    TypeId: 8000,
    ObjectModelName: ''
  };

  // Valid BrowserObjects
  const browserObject: BrowserObject = {
    Attributes: objAttrs,
    Descriptor: 'Log Viewer',
    Designation: 'System1.ApplicationView:ApplicationView.LogViewer',
    HasChild: false,
    Name: 'LogViewer',
    Location: 'System1.Application View:Applications.Log Viewer',
    ObjectId: 'System1:LogViewer',
    SystemId: 1,
    ViewId: 10,
    ViewType: 1
  };

  const customDataDummy: any = [{
    label: 'Object Location',
    name: 'Description',
    value: 'System1.Application View:Applications.Graphics'
  }
  ];

  const gmsDummyData: GmsMessageData = {
    data: [browserObject],
    selectionType: 1,
    customData: customDataDummy
  };

  const gmsDummyDataUndefined: GmsMessageData = {
    data: [browserObject],
    selectionType: 1,
    customData: undefined
  };

  const messageBody = {
    appliedFilter: {
      criteria: [{
        label: 'Source Information',
        name: 'Description',
        options: [],
        value: 'System1.Application View:Applications.Graphics'
      }],
      value: ''
    }
  };

  let userCultureSpy: any;
  let defaultCultureSpy: any;
  let translateServiceStub: Partial<TranslateService>;
  let resizeObserverService: Partial<ResizeObserverService>;
  let appContextServiceStub: Partial<AppContextService>;
  let applogViewerServiceStub: Partial<LogViewerService>;
  let appSystemBrowserServiceStub: Partial<SystemBrowserService>;
  let appValueServiceStub: Partial<ValueService>;
  let appIHfwMessageStub: Partial<IHfwMessage>;
  let appSettingsServiceStub: Partial<SettingsService>;
  let appCnsHelperServiceStub: Partial<CnsHelperService>;
  let appBsModalServiceStub: Partial<BsModalService>;
  let mockTranslateService: TranslateService;
  let mockCnsHelperService: CnsHelperService;
  let mockHistoryLogService: HistoryLogService;
  let mockResizeObserverService: ResizeObserverService;
  let mockAppContextService: AppContextService;
  let mockLogViewerService: LogViewerServiceBase;
  let mockSystemsService: SystemsServiceBase;
  let mockSettingsService: SettingsServiceBase;
  let mockTraceService: TraceService;
  let mockStorageService: IHfwMessage;
  let logViewerDe: DebugElement;
  let logViewerEl: HTMLElement;
  let originalTimeout: number;
  beforeEach(waitForAsync(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    appContextServiceStub = {
      get defaultCulture(): Observable<string> { return of('passed'); },
      userCulture: of('passed'),
      userLocalizationCulture: of('passed')
    };

    translateServiceStub = {
      onLangChange: new EventEmitter(),
      onTranslationChange: new EventEmitter(),
      onDefaultLangChange: new EventEmitter(),
      defaultLang: 'langs',
      get: (): Observable<string> => of('passed'),
      use: (lang: string): Observable<string> => of('passed'),
      setDefaultLang: (lang: string): void => { translateServiceStub.defaultLang = lang; },
      getBrowserLang: (): string => ''
    };

    applogViewerServiceStub = {
      getHistoryLogEnumValues: (): Observable<HistLogEnumValues> => of({ EnumValues: ['1', '2'] }),
      getHistoryLogColumnDescripton: (): Observable<HistLogColumnDescription[]> => of([historyColumnDescription]),
      getHistoryLogs: (): Observable<HistoryLogTable> => of(historyLogData),
      discardSnapshot: (): Observable<boolean> => of(true),
      getActivityIconJson: (): Observable<any> => of({})
    };

    const storageServiceStub: IStorageService = {
      getState: () => '',
      setState: () => ''
    } as any;

    appIHfwMessageStub = {
      getMessage: (): Observable<any> => of()
    };

    appValueServiceStub = {
      readValue: (): Observable<ValueDetails[]> => of(
        [{
          DataType: 'string',
          ErrorCode: 1,
          SubscriptionKey: 1,
          Value: {
            Value: 'string',
            DisplayValue: 'string',
            Timestamp: 'string',
            QualityGood: true,
            Quality: 'string',
            IsPropertyAbsent: true
          },
          IsArray: true
        }])
    };

    appCnsHelperServiceStub = {
      get activeCnsLabel(): Observable<CnsLabel> { return of(new CnsLabel()); }
    };

    appBsModalServiceStub = {
      show: (): BsModalRef => new BsModalRef()
    };

    appSettingsServiceStub = {
      getSettings: (): Observable<string> => of('{"tableWidth":516,"masterDataContinerSize":"1 1 49.9944%","detailsContainerSize":"1 1 50.0056%"}')
    };

    appSystemBrowserServiceStub = jasmine.createSpyObj('appSystemBrowserServiceStub', ['searchNodeMultiple']);

    const appSystemServiceStub = jasmine.createSpyObj('appSystemServiceStub', ['getSystemsExt']);
    // Make the spy return a synchronous Observable with the test data
    const getSystemsExtSpy = appSystemServiceStub.getSystemsExt.and.returnValue(of({
      Systems: null,
      Languages: null,
      IsDistributed: true,
      IdLocal: 3
    }));

    class MockCommonTranslateService {
      public get(key: string | string[], interpolateParams?: object): Observable<string | string[]> {
        return of(key);
      }
      public getBrowserLang(): string {
        return 'en';
      }
      public use(lang: string): Observable<any> {
        return of('passed');
      }
    }

    mockEventCommonService = jasmine.createSpyObj('EventsCommonServiceBase', ['commonTranslateService']);
    mockEventCommonService.commonTranslateService = translateServiceStub;

    mockSiIconMapperService = jasmine.createSpyObj('SiIconMapperService', ['getGlobalIcon']);
    mockSiIconMapperService.getGlobalIcon.and.returnValue(of(''));

    TestBed.configureTestingModule({
      imports: [
        SiMainDetailContainerModule,
        SiFilteredSearchModule,
        SiContentActionBarModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [LogViewerSnapinComponent],
      providers: [
        { provide: AppContextService, useValue: appContextServiceStub },
        { provide: TranslateService, useValue: translateServiceStub },
        { provide: TraceService, useClass: MockTraceService },
        { provide: LogViewerServiceBase, useValue: applogViewerServiceStub },
        { provide: HistoryLogService, useClass: HistoryLogService },
        { provide: SystemBrowserServiceBase, useValue: appSystemBrowserServiceStub },
        { provide: SystemsServiceBase, useValue: appSystemServiceStub },
        { provide: ResizeObserverService, useClass: ResizeObserverService },
        { provide: BsModalService, useValue: appBsModalServiceStub },
        { provide: ValueServiceBase, useValue: appValueServiceStub },
        { provide: SettingsServiceBase, useValue: appSettingsServiceStub },
        { provide: CnsHelperService, useValue: appCnsHelperServiceStub },
        { provide: IHfwMessage, useValue: appIHfwMessageStub },
        { provide: EventsCommonServiceBase, useValue: mockEventCommonService },
        { provide: SiIconMapperService, useValue: mockSiIconMapperService },
        { provice: ElementRef, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data:
                            {
                              snapinId: { frameId: 'frameId ', snapInId: 'snapInId' },
                              paneId: { frameId: 'frameId ', paneId: 'paneId' }
                            }
            }
          }
        }]
    }).compileComponents();
    fixture = TestBed.createComponent(LogViewerComponent);
    component = fixture.debugElement.componentInstance;
    (component as any).storageService = storageServiceStub;
    mockStorageService = TestBed.inject(IHfwMessage);
    mockAppContextService = TestBed.inject(AppContextService);
    mockTranslateService = TestBed.inject(TranslateService);
    mockTraceService = TestBed.inject(TraceService);
    spyOn(mockTranslateService, 'use').and.returnValue(of('passed'));
    fixture.detectChanges();

  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(LogViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeDefined();
    fixture.detectChanges();
  });

  it('should check if message broker does not have custom data', () => {
    const spy = spyOn(mockStorageService, 'getMessage').and.returnValue(of(gmsDummyDataUndefined));
    const processSpy = spyOn(component as any, 'process');
    component.fromSnapin = true;
    component.ngOnInit();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
    expect(processSpy).toHaveBeenCalled();
    fixture.detectChanges();
  });

  it('should check if message broker have custom data', () => {
    const spy = spyOn(mockStorageService, 'getMessage').and.returnValue(of(gmsDummyData));
    component.fromSnapin = true;
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
    fixture.detectChanges();
  });

  it('should check setState for applying filter when navigate from detail pane', () => {
    gmsDummyData.customData = customDataDummy;
    const spy = spyOn(mockStorageService, 'getMessage').and.returnValue(of(gmsDummyData));
    const spySet = spyOn((component as any).storageService, 'setState');
    component.fromSnapin = true;
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
    expect(spySet).toHaveBeenCalled();
    fixture.detectChanges();
  });

  it('should check retainLogViewerState for applying filter when navigate from detail pane', () => {
    gmsDummyData.customData = customDataDummy;
    const spy = spyOn(mockStorageService, 'getMessage').and.returnValue(of(gmsDummyData));
    const spySet = spyOn((component as any).storageService, 'setState');
    const spyRetain = spyOn(component as any, 'retainLogViewerState');
    component.fromSnapin = true;
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
    expect(spySet).toHaveBeenCalled();
    expect(spyRetain).toHaveBeenCalled();
    fixture.detectChanges();
  });

  it('should check for applying filter when navigate from detail pane when log-viewer object is selected', () => {
    gmsDummyData.customData = customDataDummy;
    const spy = spyOn(mockStorageService, 'getMessage').and.returnValue(of(gmsDummyData));
    const spySet = spyOn((component as any).storageService, 'setState');
    const spyRetain = spyOn(component as any, 'retainLogViewerState');
    const processSpy = spyOn(component as any, 'process');
    component.fromSnapin = true;
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
    expect(spySet).toHaveBeenCalled();
    expect(spyRetain).toHaveBeenCalled();
    expect(processSpy).toHaveBeenCalled();
    fixture.detectChanges();
  });

});
