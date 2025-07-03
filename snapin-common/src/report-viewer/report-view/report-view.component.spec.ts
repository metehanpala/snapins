import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { BrowserObject, CnsHelperService, DocumentTypes, ReportServiceBase,
  ReportSubscriptionServiceBase, SystemBrowserService, SystemsServicesServiceBase } from '@gms-flex/services';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { PreviewMasterComponent } from '../components/preview-master/preview-master.component';
import { mockGetReportHistoryResponse, mockObject, mockReportHistoryData,
  mockReportStartExecutionResult, mockServiceReqInfoObject, TranslateServiceStub } from '../helpers/test-utilities';
import { ReportViewerService } from '../services/report-viewer.service';
import { ReportViewComponent } from './report-view.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ReportViewComponent', () => {
  let component: any;
  let fixture: ComponentFixture<ReportViewComponent>;
  let reportService: any;
  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);

  // Mocks for hfw-services-common dependencies
  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  const mockCnsHelperService: any = jasmine.createSpyObj('CnsHelperService', ['activeCnsLabel']);
  mockCnsHelperService.activeCnsLabel = of('');

  const mockAppContextService: any = jasmine.createSpyObj('mockAppContextService', ['getBrowserLang']);
  mockAppContextService.defaultCulture = nullObservable;
  mockAppContextService.userCulture = nullObservable;
  mockAppContextService.getBrowserLang.and.returnValue(nullObservable);

  const mockSystemBrowserService = jasmine.createSpyObj('SystemBrowserService', ['searchNodes']);

  let mockProcessDataInput: BrowserObject[] = [];

  const mockDocumentType: DocumentTypes = DocumentTypes.Pdf;

  const mockPreviewMasterComponent = jasmine.createSpyObj(PreviewMasterComponent, ['showReport', 'setActive']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportViewComponent],
      imports: [],
      providers: [{ provide: AppContextService, useValue: mockAppContextService },
        { provide: TraceService, useValue: mockTraceService },
        { provide: TranslateService, useClass: TranslateServiceStub },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: SystemBrowserService, useValue: mockSystemBrowserService },
        ReportServiceBase,
        ReportViewerService,
        ReportSubscriptionServiceBase,
        SystemsServicesServiceBase, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    })
      .compileComponents();
  });

  beforeEach(inject([ReportViewerService], service => {
    reportService = service;
    fixture = TestBed.createComponent(ReportViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('processRequest() should set AssignVisibleViews and Subscribe to WSI', fakeAsync(() => {

    spyOn((reportService as any), 'subscribetoWSI');
    spyOn((reportService as any), 'subscribeWSIReportNotification').and.returnValue(of());
    spyOn((reportService as any), 'getAllViews').and.returnValue(of());
    spyOn((reportService as any), 'initializeServicesSubscriptions');

    spyOn(component, 'assignVisibleView');
    spyOn(component, 'subscribeToWsi');

    component.storeObject = mockReportHistoryData;
    component.processRequest([mockObject]);
    tick(100);
    fixture.detectChanges();

    expect(component.assignVisibleView).toHaveBeenCalled();
    expect(component.subscribeToWsi).toHaveBeenCalled();
  }));

  it('startReportExecution() should call service StartReportExecution', fakeAsync(() => {

    spyOn((reportService as any), 'subscribeWSIReportNotification').and.returnValue(of(mockGetReportHistoryResponse));
    spyOn((reportService as any), 'getAllViews').and.returnValue(of());
    spyOn((reportService as any), 'getSearchNode').and.returnValue(of());
    spyOn((reportService as any), 'startReportExecution').and.returnValue(of(mockReportStartExecutionResult));
    spyOn((reportService as any), 'subscribeWSIReport');
    spyOn(component, 'subscribeToWsi');

    const mockexecActivationMap: Map<string, boolean> = new Map<string, boolean>();
    mockexecActivationMap.set('59deb757-8339-462c-8097-f8c33bf38546-26082022112722790', false);

    component.mainSubs = new Subscription();
    component.selectedObjectsData = [mockObject];
    component.storeObject = mockReportHistoryData;
    component.startReportExecution(mockDocumentType);
    tick(100);
    fixture.detectChanges();

    expect(reportService.startReportExecution).toHaveBeenCalled();
    expect(component.execActivationMap).toEqual(mockexecActivationMap);
  }));

  it('reportManagerStatus() should set isReportManagerPresent ', fakeAsync(() => {
    spyOn((reportService as any), 'serviceNotification').and.returnValue(of(mockServiceReqInfoObject));
    component.reportManagerStatus();
    tick(100);
    fixture.detectChanges();
    expect(component.reportManagerStatus).toBeDefined();
  }));

  it('assignVisibleView() should set systemId ', fakeAsync(() => {
    spyOn((reportService as any), 'getAllViews').and.returnValue(of());
    spyOn((reportService as any), 'initializeServicesSubscriptions');

    tick(100);
    fixture.detectChanges();
    mockProcessDataInput = [];
    mockProcessDataInput.push(mockObject);
    component.assignVisibleView(mockProcessDataInput);

    tick(100);
    fixture.detectChanges();

    expect(component.previousSystemId).toBeDefined();
  }));

  it('registerReportManagerStatus() should call reportManagerStatus ', fakeAsync(() => {
    spyOn((reportService as any), 'initializeServicesSubscriptions').and.returnValue(of());
    spyOn(component, 'reportManagerStatus');

    const systemIds: number[] = [];
    systemIds.push(mockObject.SystemId);

    component.registerReportManagerStatus(systemIds);

    tick(100);
    fixture.detectChanges();

    expect(component.reportManagerStatus).toHaveBeenCalled();
  }));

  it('getReportHistory() should call manageHistory', fakeAsync(() => {
    spyOn((reportService as any), 'getReportHistory').and.returnValue(of(mockGetReportHistoryResponse));
    spyOn(component, 'manageHistory');
    component.selectedObject = mockObject;
    component.reportHistoryData = [mockReportHistoryData];

    component.getReportHistory(mockObject.ObjectId, true);

    tick(100);
    fixture.detectChanges();

    expect(component.manageHistory).toHaveBeenCalled();
  }));

  it('manageHistory() should call previewMaster component showReport() ', fakeAsync(() => {
    component.previewMasterComponent = mockPreviewMasterComponent;
    component.storeObject = mockReportHistoryData;
    component.manageHistory([mockReportHistoryData]);
    tick(100);
    fixture.detectChanges();

    expect(mockPreviewMasterComponent.showReport).toHaveBeenCalled();
  }));

  it('manageHistory() should call previewMaster component setActive() ', fakeAsync(() => {
    component.storeObject = [];
    component.previewMasterComponent = mockPreviewMasterComponent;
    // case: when document if not present. i.e., savedDoc = null
    component.manageHistory([mockReportHistoryData]);
    tick(100);
    fixture.detectChanges();
    expect(mockPreviewMasterComponent.setActive).toHaveBeenCalled();
  }));

  it('sortChildren() should sort pdf and xlxs files from report history data ', fakeAsync(() => {
    component.storeObject = mockReportHistoryData;
    component.sortChildren(mockReportHistoryData);
    tick(100);
    fixture.detectChanges();
    expect(component.displayNameMap).not.toBeNull();
    expect(component.executionIdMap).not.toBeNull();
  }));

  it('formatUTCDateTime() should Format input date as per the userCulture', fakeAsync(() => {
    const date = new Date();
    const mockDate = component.formatUTCDateTime(date.toLocaleDateString());
    tick(100);
    const mockUTCDate = date.toLocaleDateString() + 'UTC';
    fixture.detectChanges();
    expect(mockDate).toEqual(new Date(mockUTCDate).toLocaleString('en'));
  }));
});
