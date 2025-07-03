import { TestBed } from '@angular/core/testing';
import { FullSnapInId } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { ReportViewerPreselectService } from './report-viewer-preselect.service';

describe('ReportViewerPreselectService', () => {
  let service: ReportViewerPreselectService;
  const fullSnapinId = new FullSnapInId('system-manager', 'central-function');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportViewerPreselectService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    });
    service = TestBed.inject(ReportViewerPreselectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('receivePreSelection shall return success', () => {
    const managedTypes = ['managed-type']; // setup the correct types for the test
    const messageBody = undefined; // setup the correct messageBody for the test

    service.receivePreSelection(managedTypes, messageBody, fullSnapinId).subscribe(
      result => expect(result).toBeTrue(),
      error => fail('No error expected: ' + error)
    );
    expect(service).toBeTruthy();
  });
});
