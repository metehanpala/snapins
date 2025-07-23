import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { IStorageService } from '@gms-flex/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';

import { TextStorageService } from './text-storage.service';

// //////  Tests  /////////////
describe('TextStorageService', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        TextStorageService,
        IStorageService,
        { provide: TraceService, useClass: MockTraceService }
      ]
    }).compileComponents();
  }));

  it('should create TextStorageService', inject(
    [TextStorageService],
    (textStorageService: TextStorageService) => {
      expect(textStorageService instanceof TextStorageService).toBe(true);
    }
  ));
});
