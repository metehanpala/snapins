import { TestBed } from '@angular/core/testing';
import { FullSnapInId } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { OperatorTaskPreselectService } from './operator-task-preselect.service';

describe('OperatorTaskPreselectService', () => {
  let service: OperatorTaskPreselectService;
  const fullSnapinId = new FullSnapInId('system-manager', 'central-function');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OperatorTaskPreselectService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    });
    service = TestBed.inject(OperatorTaskPreselectService);
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
