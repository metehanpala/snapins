import { TestBed } from '@angular/core/testing';

import { ReportViewerRootServicesService } from './report-viewer-root-services.service';

describe('ReportViewerRootServicesService', () => {
  let service: ReportViewerRootServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportViewerRootServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
