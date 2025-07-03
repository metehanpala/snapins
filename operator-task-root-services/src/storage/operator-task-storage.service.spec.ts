import { TestBed } from '@angular/core/testing';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { OperatorTaskStorageService } from './operator-task-storage.service';

describe('OperatorTaskStorageService', () => {
  let service: OperatorTaskStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OperatorTaskStorageService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    });
    service = TestBed.inject(OperatorTaskStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
