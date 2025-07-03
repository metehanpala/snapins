import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { IStorageService } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { DocumentStorageService } from './document-storage.service';

// //////  Tests  /////////////
describe('DocumentStorageService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentStorageService,
        IStorageService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    })
      .compileComponents();
  }));

  it('should create DocumentStorageService',
    inject([DocumentStorageService], (documentStorageService: DocumentStorageService) => {
      expect(documentStorageService instanceof DocumentStorageService).toBe(true);
    }
    ));

});
