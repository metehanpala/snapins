import { CommonModule } from '@angular/common';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { ReportServiceBase, ReportSubscriptionServiceBase,
  SystemBrowserService, SystemsServicesServiceBase } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ResizeObserverService,
  SiActionDialogService,
  SiContentActionBarModule,
  SiDropdownModule,
  SiEmptyStateModule,
  SiLoadingSpinnerModule,
  SiMainDetailContainerModule,
  SiResizeObserverModule
} from '@simpl/element-ng';
import { mockCreateDocumentData, mockObject, mockReportDocumentData,
  mockReportHistoryData, mockReportStartExecutionResult } from '../../helpers/test-utilities';
import { ReportViewerService } from '../../services/report-viewer.service';
import { PreviewMasterComponent } from './preview-master.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PreviewMasterComponent', () => {
  let component: any;
  let reportService: any;
  let fixture: ComponentFixture<PreviewMasterComponent>;

  const mockTranslatableString: any = {
    runInContextOf: 'run in context of'
  };

  // Mocks for hfw-services-common dependencies
  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  /* eslint-disable @typescript-eslint/naming-convention */
  const mockSystemBrowserService = jasmine.createSpyObj('SystemBrowserService', ['searchNodes']);
  /* eslint-enable @typescript-eslint/naming-convention */

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PreviewMasterComponent],
      imports: [CommonModule,
        SiContentActionBarModule,
        SiDropdownModule,
        SiEmptyStateModule,
        SiLoadingSpinnerModule,
        SiMainDetailContainerModule,
        SiResizeObserverModule,
        TranslateModule.forRoot()],
      providers: [
        { provide: TraceService, useValue: mockTraceService },
        { provide: SystemBrowserService, useValue: mockSystemBrowserService },
        ReportViewerService,
        ReportServiceBase,
        DomSanitizer,
        ResizeObserverService,
        TranslateService,
        SiActionDialogService,
        ReportSubscriptionServiceBase,
        SystemsServicesServiceBase,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(PreviewMasterComponent);
    component = fixture.componentInstance;
    component.selectedObject = mockObject;
    component.createDocumentData = mockCreateDocumentData;
    reportService = fixture.debugElement.injector.get(ReportViewerService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('showReport() should set docName', () => {
    component.selectedObject = mockObject;
    component.multipleSelectionActive = false;
    component.createDocumentData = mockCreateDocumentData;
    component.showReport(mockReportDocumentData);
    fixture.detectChanges();

    expect(component.docName).toBeDefined();
  });

  it('showReport() should set docName undefined if no document is seleted', () => {
    component.selectedObject = mockObject;
    component.multipleSelectionActive = true;
    component.createDocumentData = mockCreateDocumentData;
    component.showReport(mockReportDocumentData);
    fixture.detectChanges();

    expect(component.docName).toBeUndefined();
  });

  it('showReport() should call getReportFromWSI()', () => {
    spyOn(component, 'getReportFromWSI');

    component.selectedObject = mockObject;
    component.multipleSelectionActive = false;
    component.createDocumentData = mockCreateDocumentData;
    component.showReport(mockReportDocumentData);
    fixture.detectChanges();

    expect(component.getReportFromWSI).toHaveBeenCalled();
  });

  xit('setActive() should apply Deactive style if  execId is empty', () => {
    spyOn(component, 'applyDeactiveStyle');

    component.selectedObject = mockObject;
    component.multipleSelectionActive = false;
    component.createDocumentData = mockCreateDocumentData;
    component.setActive(undefined, '', true);
    fixture.detectChanges();

    expect(component.applyDeactiveStyle).toHaveBeenCalled();
  });

  it('cancelReportExecution() should call cancelReportExecution() from service', () => {
    spyOn((reportService as any), 'cancelReportExecution');
    component.selectedObject = mockObject;
    component.multipleSelectionActive = false;
    component.createDocumentData = mockCreateDocumentData;
    component.cancelReportExecution(mockObject.SystemId, mockReportStartExecutionResult.ReportExecutionId);
    fixture.detectChanges();

    expect(reportService.cancelReportExecution).toHaveBeenCalled();
  });

  it('onResize() should call showHidePreview()', () => {
    spyOn(component, 'showHidePreview');
    component.selectedObject = mockObject;
    component.multipleSelectionActive = false;
    component.createDocumentData = mockCreateDocumentData;
    component.onResize();
    fixture.detectChanges();

    expect(component.showHidePreview).toHaveBeenCalled();
  });

  xit('downloadReportFromPreviewToolbar() should call getDocument() from service', () => {
    spyOn((reportService as any), 'getDocument').and.returnValue(Promise.resolve());
    component.selectedObject = mockObject;
    component.reportHistoryData = [mockReportHistoryData];
    component.createDocumentData = mockCreateDocumentData;
    component.downloadReportFromPreviewToolbar(mockReportHistoryData.ReportExecutionId, mockReportHistoryData.ReportDocumentData[0].DocumentDisplayName);
    fixture.detectChanges();

    expect(reportService.getDocument).toHaveBeenCalledTimes(1);
  });

  xit('getReportFromWSI() should call showHidePreview()', () => {
    spyOn((reportService as any), 'getDocument').and.returnValue(Promise.resolve());
    spyOn(component, 'showHidePreview');
    component.selectedObject = mockObject;
    component.reportHistoryData = [mockReportHistoryData];
    component.createDocumentData = mockCreateDocumentData;
    component.getReportFromWSI(mockReportHistoryData.ReportDocumentData[0], false);
    fixture.detectChanges();

    expect(component.showHidePreview).toHaveBeenCalled();
  });

  xit('downloadReport() should call getDocument() from service', () => {
    spyOn((reportService as any), 'getDocument').and.returnValue(Promise.resolve());
    component.selectedObject = mockObject;
    component.reportHistoryData = [mockReportHistoryData];
    component.createDocumentData = mockCreateDocumentData;
    component.downloadReport([mockReportHistoryData], mockReportHistoryData.ReportExecutionId,
      mockReportHistoryData.ReportDocumentData[0].DocumentDisplayName, true);
    fixture.detectChanges();

    expect(reportService.getDocument).toHaveBeenCalledTimes(1);
  });
});
