import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { IPreselectionService } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { EventListPreselectService } from './event-list-preselect.service';

// //////  Tests  /////////////
describe('EventListPreselectService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        EventListPreselectService,
        IPreselectionService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    })
      .compileComponents();
  }));

  it('should create EventListPreselectService',
    inject([EventListPreselectService], (eventListPreselectService: EventListPreselectService) => {
      expect(eventListPreselectService instanceof EventListPreselectService).toBe(true);
    }
    ));

});
