/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/naming-convention */
import { Observable, of, Subject } from 'rxjs';
import { DebugElement, ElementRef, EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import {
  CnsHelperService,
  CnsLabel,
  CnsLabelEn,
  DetailPane,
  HistLogColumnDescription,
  HistLogEnumValues,
  HistoryLogTable,
  LogViewerService,
  LogViewerServiceBase,
  SettingsService,
  SystemsResponseObject,
  SystemsService,
  SystemsServiceBase,
  ValueDetails,
  ValueService,
  ValueServiceBase
} from '@gms-flex/services';
import { AppContextService, MockTraceService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ResizeObserverService, SiFilteredSearchModule } from '@simpl/element-ng';
import { NgxDatatableModule } from '@siemens/ngx-datatable';
import { HistoryLogService } from '../services/history-log.service';
import { LogViewerTableComponent } from './log-viewer-table.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { IHfwMessage, IStorageService } from '@gms-flex/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventsCommonServiceBase } from '../../events/services/events-common.service.base';

describe('LogViewerTableComponent', () => {
  let getSystemsExtSpy: jasmine.Spy<any>;
  let mockEventCommonService: any = null;
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

  const myObservable = of(1, 2, 3);
  // Create observer object
  const myObserver = {
    // eslint-disable-next-line no-restricted-syntax
    next: (x: number): void => console.log('Observer got a next value: ' + x),
    // eslint-disable-next-line no-restricted-syntax
    error: (err: Error): void => console.error('Observer got an error: ' + err),
    // eslint-disable-next-line no-restricted-syntax
    complete: (): void => console.log('Observer got a complete notification')
  };

  const expectedResult = {
    tableWidth: 749,
    masterDataContinerSize: 32,
    colSettings: [
      { id: 'Icon', width: 0 },
      { id: 'Activity', width: 0 },
      { id: 'ActivityMessage', width: 239 },
      { id: 'Time', width: 0 },
      { id: 'SourceDescription', width: 0 }
    ]
  };
  let component: LogViewerTableComponent;
  let fixture: ComponentFixture<LogViewerTableComponent>;
  let userCultureSpy: any;
  let defaultCultureSpy: any;
  let translateServiceStub: Partial<TranslateService>;
  let resizeObserverService: Partial<ResizeObserverService>;
  let appContextServiceStub: Partial<AppContextService>;
  let applogViewerServiceStub: Partial<LogViewerService>;
  // let appSystemServiceStub: Partial<SystemsService>;
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
    // resizeObserverService={
    //   observe : () =>{}
    // }
    appContextServiceStub = {
      get defaultCulture(): Observable<string> { return of('passed'); },
      userCulture: of('passed'),
      userLocalizationCulture: of('passed')
    };

    applogViewerServiceStub = {
      getHistoryLogEnumValues: (): Observable<HistLogEnumValues> => of({ EnumValues: ['1', '2'] }),
      getHistoryLogColumnDescripton: (): Observable<HistLogColumnDescription[]> => of([historyColumnDescription]),
      getHistoryLogs: (): Observable<HistoryLogTable> => of(historyLogData),
      getActivityIconJson: (): Observable<DetailPane> => of({}),
      discardSnapshot: (): Observable<any> => new Observable(observer => {
        observer.next('1');
        observer.next('2');
        observer.next('3');
        observer.complete();
      })
    };

    // appSystemServiceStub = {
    //   getSystemsExt: (): Observable<SystemsResponseObject> => of({
    //     Systems: null,
    //     Languages: null,
    //     IsDistributed: true,
    //     IdLocal: 3
    //   })
    // };
    const storageService: IStorageService = { getState: () => '', setState: () => '' } as any;

    appIHfwMessageStub = {
      getStorageService: (): IStorageService => storageService
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

    appSettingsServiceStub = {
      getSettings: (): Observable<string> => of('{"tableWidth":516,"masterDataContinerSize":"1 1 49.9944%","detailsContainerSize":"1 1 50.0056%"}')
    };

    appCnsHelperServiceStub = {
      get activeCnsLabel(): Observable<CnsLabel> { return of(new CnsLabel()); }
    };

    appBsModalServiceStub = {
      show: (): BsModalRef => new BsModalRef()
    };

    const appSystemServiceStub = jasmine.createSpyObj('appSystemServiceStub', ['getSystemsExt']);
    // Make the spy return a synchronous Observable with the test data
    getSystemsExtSpy = appSystemServiceStub.getSystemsExt.and.returnValue(of({
      Systems: null,
      Languages: null,
      IsDistributed: true,
      IdLocal: 3
    }));

    class MockCommonTranslateService {
      public get(key: string | string[], interpolateParams?: object): Observable<string | string[] > {
        return of(key);
      }
      public getBrowserLang(): string {
        return 'en';
      }
    }

    mockEventCommonService = jasmine.createSpyObj('EventsCommonServiceBase', ['commonTranslateService']);
    mockEventCommonService.commonTranslateService = new MockCommonTranslateService();
    TestBed.configureTestingModule(
      {
        imports: [
          SiFilteredSearchModule,
          NgxDatatableModule
        ],
        declarations: [LogViewerTableComponent],
        providers: [
          { provide: AppContextService, useValue: appContextServiceStub },
          { provide: TranslateService, useValue: translateServiceStub },
          { provide: EventsCommonServiceBase, useValue: mockEventCommonService },
          { provide: TraceService, useClass: MockTraceService },
          { provide: LogViewerServiceBase, useValue: applogViewerServiceStub },
          { provide: HistoryLogService, useClass: HistoryLogService },
          { provide: SystemsServiceBase, useValue: appSystemServiceStub },
          { provide: ResizeObserverService, useClass: ResizeObserverService },
          { provide: BsModalService, useValue: appBsModalServiceStub },
          { provide: ValueServiceBase, useValue: appValueServiceStub },
          { provide: SettingsServiceBase, useValue: appSettingsServiceStub },
          { provide: CnsHelperService, useValue: appCnsHelperServiceStub },
          { provide: IHfwMessage, useValue: appIHfwMessageStub },
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

    fixture = TestBed.createComponent(LogViewerTableComponent);
    component = fixture.componentInstance;
    component.storageService = storageService;
    logViewerDe = fixture.debugElement;
    logViewerEl = logViewerDe.nativeElement;
    mockAppContextService = TestBed.inject(AppContextService);
    mockTraceService = TestBed.inject(TraceService);
    mockTranslateService = TestBed.inject(TranslateService);
    mockLogViewerService = TestBed.inject(LogViewerServiceBase);
    mockSystemsService = TestBed.inject(SystemsServiceBase);
    mockStorageService = TestBed.inject(IHfwMessage);
    mockSettingsService = TestBed.inject(SettingsServiceBase);
    mockResizeObserverService = TestBed.inject(ResizeObserverService);
    mockCnsHelperService = TestBed.inject(CnsHelperService);
    mockHistoryLogService = TestBed.inject(HistoryLogService);
    spyOn(mockTranslateService, 'use').and.returnValue(of('passed'));
    fixture.detectChanges();
  }));

  it('should create component', fakeAsync(() => {
    fixture = TestBed.createComponent(LogViewerTableComponent);
    component = fixture.debugElement.componentInstance;
    expect(component).toBeDefined();
  })
  );

  it('should check all the function calls in ngOnint', () => {
    const processSpy = spyOn(component as any, 'process');
    spyOn(mockTraceService, 'info');
    localStorage.setItem(`snapInId`, 'true');
    localStorage.setItem(`snapInId-refreshed`, 'true');
    component.ngOnInit();
    expect(processSpy).toHaveBeenCalled();
    // expect(mockTraceService.info).toHaveBeenCalled();
    expect(getSystemsExtSpy).toHaveBeenCalled();
    expect(component.systems).toEqual({
      views: null,
      IsDistributed: true
    });
    expect(component.firstLoad).toBe(true);
    expect(component.icons).toEqual({});
    expect(processSpy).toHaveBeenCalled();
  });

  // it('should check initTranslationServiceWithDefaultCulture', () => {
  //   fixture.detectChanges();
  //   const spy = spyOnProperty(mockAppContextService as any, 'defaultCulture', 'get').and.returnValue(of('passed'));
  //   const spy1 = spyOn(mockTranslateService as any, 'setDefaultLang');
  //   (component as any).initTranslationServiceWithDefaultCulture();
  //   fixture.detectChanges();
  //   expect(spy).toHaveBeenCalled();
  //   expect(spy1).toHaveBeenCalledOnceWith('passed');
  // });

  it('should check resetTable', () => {
    const processSpy = spyOn(component as any, 'process');
    component.resetTable();
    expect(processSpy).toHaveBeenCalled();
    expect(component.pageLimit).toBe(100);
    expect((component as any).expanded).toBe(false);
  });

  it('should check small screen display on minified table display', () => {
    const handlingColumnWidthSpy = spyOn(component as any, 'handlingColumnWidth');
    (component as any).fromSnapin = true;
    spyOn(mockResizeObserverService, 'observe').and.returnValue(of({ width: 400, height: 200 }));
    (component as any).subscribeContainerWidthChanges();
    fixture.detectChanges();
    const quoteEl = logViewerEl.getElementsByClassName('log-viewer-table-minified');
    component.colResizeEvent.subscribe(val => {
      expect(val).toEqual({});
    });
    expect(quoteEl.length).toBeFalsy();
    expect(handlingColumnWidthSpy).toHaveBeenCalledOnceWith(400);
  });

  it('should check initFilterColumnsStrings with compact table', () => {
    spyOn(component as any, 'initializeFilter');
    spyOn(component as any, 'onUpdateColumns');
    spyOn(component as any, 'updateSourceBasedOnLayout');
    const discardSnashotSpy = spyOn(component as any, 'discardSnapshot');
    const handlingColumnWidthSpy = spyOn(component as any, 'handlingColumnWidth');
    spyOn(mockSettingsService, 'getSettings').
      and.returnValue(of('{"tableWidth":516,"masterDataContinerSize":"1 1 49.9944%","detailsContainerSize":"1 1 50.0056%"}'));
    spyOn(mockResizeObserverService, 'observe').and.returnValue(of({ width: 400, height: 200 }));
    (component as any).defaultColumnsHeaderData = [
      { columnVisible: true, disabled: true, draggable: true, id: 'Icon', title: 'Activity icon' },
      { columnVisible: true, disabled: false, draggable: true, id: 'Activity', title: 'Activity' },
      { columnVisible: true, disabled: false, draggable: true, id: 'ActivityMessage', title: 'Activity Message' },
      { columnVisible: true, disabled: false, draggable: true, id: 'Time', title: 'Date/Time' },
      { columnVisible: true, disabled: false, draggable: true, id: 'DefaultViewDesignation', title: 'Source Designation' }
    ];
    (component as any).initFilterColumnsStrings();
    fixture.detectChanges();
    (component as any).defaultColumnsHeaderData = [];
    (component as any).closedCustomDlgEvent.subscribe(message => {
      expect((component as any).onUpdateColumns).toHaveBeenCalled();
    });
    expect((component as any).updateSourceBasedOnLayout).toHaveBeenCalled();
    expect(component.masterContainerSettings).
      toEqual(JSON.parse('{"tableWidth":516,"masterDataContinerSize":"1 1 49.9944%","detailsContainerSize":"1 1 50.0056%"}'));
    expect(component.logViewerRetainState).toBe('' as any);
    expect(component.columnSettings).toEqual(undefined);
    expect(component.updatedColumns.length).toEqual(5);
    expect(component.tempShowCompact).toEqual(true);
    expect(discardSnashotSpy).toHaveBeenCalled();
    expect((component as any).initializeFilter).toHaveBeenCalled();
  });

  it('should check initFilterColumnsStrings with tabular table', () => {
    spyOn(component as any, 'initializeFilter');
    spyOn(component as any, 'onUpdateColumns');
    spyOn((component as any).closedCustomDlgEvent, 'emit');
    // eslint-disable-next-line max-len
    (component as any).defaultColumnsHeaderData = [
      { columnVisible: true, disabled: true, draggable: true, id: 'Icon', title: 'Activity icon' },
      { columnVisible: true, disabled: false, draggable: true, id: 'Activity', title: 'Activity' },
      { columnVisible: true, disabled: false, draggable: true, id: 'ActivityMessage', title: 'Activity Message' },
      { columnVisible: true, disabled: false, draggable: true, id: 'Time', title: 'Date/Time' },
      { columnVisible: true, disabled: false, draggable: true, id: 'DefaultViewDesignation', title: 'Source Designation' }
    ];
    spyOn(mockSettingsService, 'getSettings').and.returnValue(of(JSON.stringify(expectedResult)));
    fixture.detectChanges();
    (component as any).initFilterColumnsStrings();
    fixture.detectChanges();
    (component as any).logViewerRetainState = true;
    // eslint-disable-next-line max-len
    expect(component.masterContainerSettings).toEqual(expectedResult);
    expect(component.columnSettings.length).toEqual(5);
    expect(component.updatedColumns.length).toEqual(5);
    expect(component.tempShowCompact).toEqual(false);
    expect(component.refreshDataAvailable).toEqual(true);
    expect(component.logViewerRetainState).toEqual(true as any);
    expect((component as any).initializeFilter).toHaveBeenCalled();
    (component as any).closedCustomDlgEvent.subscribe(val => {
      expect((component as any).onUpdateColumns).toHaveBeenCalled();
    });
  });

  it('should check onSearchFilterChanged', () => {
    spyOn(component as any, 'createConditionFilter').and.returnValue(true);
    spyOn(component as any, 'discardSnapshot');
    (component as any).onSearchFilterChanged(true);
    fixture.detectChanges();
    (component as any).defaultColumnsHeaderData = [];
    (component as any).logViewerRetainState = {};
    mockHistoryLogService.logViewRowDetails.subscribe(val => {
      expect(val).toBe(null);
    });
    expect((component as any).searchFilterCriteria).toEqual(true);
    expect((component as any).joinedFilters).toEqual(true);
    expect((component as any).logViewerRetainState).toEqual({});
  });

  it('should check onSearchFilterChanged', () => {
    spyOn(component as any, 'createConditionFilter').and.returnValue(true);
    const discardSnashotSpy = spyOn(component as any, 'discardSnapshot');
    (component as any).onSearchFilterChanged(true);
    fixture.detectChanges();
    (component as any).defaultColumnsHeaderData = [];
    (component as any).logViewerRetainState = {};
    (component as any).nodeReselection = false;
    mockHistoryLogService.logViewRowDetails.subscribe(val => {
      expect(val).toBe(null);
    });
    expect(discardSnashotSpy).toHaveBeenCalled();
    expect((component as any).onfilter).toEqual(true);
    expect((component as any).searchFilterCriteria).toEqual(true);
    expect((component as any).joinedFilters).toEqual(true);
    expect((component as any).logViewerRetainState).toEqual({});
  });

  it('should check onScroll', () => {
    (component as any).onScroll({ offsetY: 1, firstTime: true });
    fixture.detectChanges();
    component.scrollSubject.subscribe(val => {
      expect(val).toBe({ offsetY: 1, firstTime: true });
    });
  });

  it('should check scroll Handler', () => {
    spyOn(component as any, 'readtwoPagesHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).scrollHandler(1, true);
    expect((component as any).pageNumber).toBe(1);
    expect((component as any).loadPage).toHaveBeenCalled();
  });
  it('should check scroll Handler with dual data false part1', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).loading = true;
    (component as any).limit = 100;
    (component as any).histLogResult[0] = {};
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const myObservable = of(1, 2, 3);
    // Create observer object
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const myObserver = {
      next: (x: number): void => console.log('Observer got a next value: ' + x),
      error: (err: Error): void => console.error('Observer got an error: ' + err),
      complete: (): void => console.log('Observer got a complete notification')
    };
    (component as any).historyLogsubscriptions = myObservable.subscribe(myObserver);
    (component as any).scrollHandler(1, false);
    expect((component as any).historyLogsubscriptions).toEqual(myObservable.subscribe(myObserver));
    expect((component as any).pageNumber).toBe(1);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith(100, 2);
  });
  it('should check scroll Handler with dual data false part2', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).loading = true;
    (component as any).limit = 100;
    (component as any).histLogResult[(component as any).limit * 1] = {};
    const myObservable = of(1, 2, 3);
    // Create observer object
    const myObserver = {
      next: (x: number): void => console.log('Observer got a next value: ' + x),
      error: (err: Error): void => console.error('Observer got an error: ' + err),
      complete: (): void => console.log('Observer got a complete notification')
    };
    (component as any).historyLogsubscriptions = myObservable.subscribe(myObserver);
    (component as any).scrollHandler(1, false);
    expect((component as any).historyLogsubscriptions).toEqual(myObservable.subscribe(myObserver));
    expect((component as any).pageNumber).toBe(1);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith(100, 1, true);
  });
  it('should check scroll Handler with dual data false part3', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).limit = 100;
    (component as any).totalElements = 100;
    (component as any).histLogResult[(component as any).limit * 1] = {};
    (component as any).scrollHandler(1, false);
    expect((component as any).pageNumber).toBe(1);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith(100, 1);
  });

  it('should check scroll Handler reverse flag', () => {
    spyOn(component as any, 'readtwoPagesHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).tableOffset = 600;
    const myObservable = of(1, 2, 3);
    // Create observer object
    const myObserver = {
      next: (x: number): void => console.log('Observer got a next value: ' + x),
      error: (err: Error): void => console.error('Observer got an error: ' + err),
      complete: (): void => console.log('Observer got a complete notification')
    };
    (component as any).historyLogsubscriptions = myObservable.subscribe(myObserver);
    (component as any).loading = true;
    (component as any).scrollHandler(500, true);
    expect((component as any).historyLogsubscriptions).toEqual(myObservable.subscribe(myObserver));
    expect((component as any).pageNumber).toBe(1);
    expect((component as any).reverseFlag).toBe(true);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith((component as any).limit, 1, true);
  });
  it('should check scroll Handler with reverse flag and dual data false part1', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).limit = 100;
    (component as any).histLogResult[1 * (component as any).limit] = {};
    (component as any).tableOffset = 6000;
    (component as any).scrollHandler(5000, false);
    expect((component as any).pageNumber).toBe(1);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith(100, 1, true);
  });
  it('should check scroll Handler with reverse flag and dual data false part2', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).limit = 100;
    (component as any).histLogResult[0] = {};
    (component as any).tableOffset = 6000;
    (component as any).scrollHandler(500, false);
    expect((component as any).pageNumber).toBe(1);
  });
  it('should check scroll Handler with reverse flag and dual data false part3', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).limit = 100;
    (component as any).pageNumber = 1;
    (component as any).tableOffset = 16000;
    (component as any).scrollHandler(15000, false);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith(100, (component as any).pageNumber, true);
  });
  it('should check scroll Handler with reverse flag and dual data false part4', () => {
    spyOn(component as any, 'readHistoryLogs');
    spyOn(component as any, 'loadPage');
    (component as any).limit = 100;
    (component as any).tableOffset = 16000;
    (component as any).scrollHandler(15000, false);
    expect((component as any).loadPage).toHaveBeenCalledOnceWith(100, (component as any).pageNumber, true);
  });
});
