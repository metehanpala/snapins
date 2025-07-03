import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { FullSnapInId, IPreselectionService } from '@gms-flex/core';
import { AppRightsService } from '@gms-flex/services';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { DocumentPreselectService } from './document-preselect.service';

class MockAppRightsService {
  //
}

// //////  Tests  /////////////
describe('DocumentPreselectService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentPreselectService,
        IPreselectionService,
        { provide: TraceService, useClass: MockTraceService },
        { provide: AppRightsService, useClass: MockAppRightsService }
      ]
    })
      .compileComponents();
  }));

  it('should create DocumentPreselectService',
    inject([DocumentPreselectService], (documentPreselectService: DocumentPreselectService) => {
      expect(documentPreselectService instanceof DocumentPreselectService).toBe(true);
    }
    ));

});
