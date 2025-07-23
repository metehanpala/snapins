import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { FullSnapInId, IPreselectionService } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { TextPreselectService } from './text-preselect.service';

// //////  Tests  /////////////
describe('TextPreselectService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        TextPreselectService,
        IPreselectionService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    })
      .compileComponents();
  }));

  it('should create TextPreselectService',
    inject([TextPreselectService], (textPreselectService: TextPreselectService) => {
      expect(textPreselectService instanceof TextPreselectService).toBe(true);
    }
    ));

});
