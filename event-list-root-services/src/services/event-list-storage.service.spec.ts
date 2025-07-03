import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { IStorageService } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { EventListStorageService } from './event-list-storage.service';

// //////  Tests  /////////////
describe('EventListStorageService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        EventListStorageService,
        IStorageService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    })
      .compileComponents();
  }));

  it('should create EventListStorageService',
    inject([EventListStorageService], (eventListStorageService: EventListStorageService) => {
      expect(eventListStorageService instanceof EventListStorageService).toBe(true);
    }
    ));

});
