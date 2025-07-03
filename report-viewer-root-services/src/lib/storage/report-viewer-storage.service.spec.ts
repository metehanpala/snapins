import { TestBed } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { ReportViewerStorageService } from './report-viewer-storage.service';

describe('ReportViewerStorageService', () => {
  let service: ReportViewerStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportViewerStorageService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    });
    service = TestBed.inject(ReportViewerStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
