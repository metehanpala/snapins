import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { mockObject, mockReportHistoryData, mockReportStartExecutionResult } from '../../helpers/test-utilities';
import { ReportViewerService } from '../../services/report-viewer.service';

import { HistoryViewComponent } from './history-view.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HistoryViewComponent', () => {
  let component: HistoryViewComponent;
  let mockReportViewerService: ReportViewerService;
  let fixture: ComponentFixture<HistoryViewComponent>;
  let appreportViewerServiceStub: Partial<ReportViewerService>;
  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);

  beforeEach(async () => {
    appreportViewerServiceStub = {
      cancelReportExecution: (): void => {}
    };
    await TestBed.configureTestingModule({
      declarations: [HistoryViewComponent],
      imports: [],
      providers: [
        { provide: ReportViewerService, useValue: appreportViewerServiceStub },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(HistoryViewComponent);
    mockReportViewerService = TestBed.inject(ReportViewerService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cancelReportExecution() should call cancelReportExecution() from service', () => {
    spyOn((mockReportViewerService as any), 'cancelReportExecution');
    component.selectedObject = mockObject;
    component.reportHistoryData = [mockReportHistoryData];
    component.cancelReportExecution(mockObject.SystemId, mockReportStartExecutionResult.ReportExecutionId);
    fixture.detectChanges();

    expect(mockReportViewerService.cancelReportExecution).toHaveBeenCalled();
  });
});
