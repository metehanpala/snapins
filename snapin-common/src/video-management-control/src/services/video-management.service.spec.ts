/* eslint-disable @typescript-eslint/naming-convention */
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import {
  BrowserObject, CommandInput, ExecuteCommandServiceBase, GmsSubscription, Page, SearchOption, SystemBrowserServiceBase,
  SystemBrowserSubscription, SystemBrowserSubscriptionServiceBase, ValidationResult, ValidationResultStatus,
  Value, ValueDetails, ValueServiceBase, ValueSubscription2ServiceBase, ViewNode
} from '@gms-flex/services';
import { isNullOrUndefined, MockTraceService, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable } from 'rxjs';

import { VideoManagementService } from './video-management.service';
// import { VideoManagementService } from '.';

describe('VideoManagementService', () => {
  let name = '';

  beforeEach(() => {
    name = 'VideoManagementService';
  });

  describe('set name', () => {
    it('name should be set', () => {
      expect(name).toBe('VideoManagementService');
    });
  });
});

// -------------------------------------------------------------------------------------------------
// Mock classes
//
class MockExecuteCommandServiceBase {
  public executeCommand(propertyId: string, commandId: string, commandInput: CommandInput[]): Observable<void> {
    const ok = propertyId.includes('src1') ||
                   !isNullOrUndefined(commandInput) && commandInput.length === 2 && commandInput[1].Value === '1' ||
                   propertyId.includes('1');
    if (ok) {
      return new Observable(observer => {
        observer.next();
        observer.complete();
      });
    } else {
      return new Observable(observer => {
        observer.error();
        observer.complete();
      });
    }
  }
}

class MockValueServiceBase {
  public readValue(objectOrPropertyId: string): Observable<ValueDetails[]> {
    return new Observable(observer => {
      const value: Value = { Value: '1', DisplayValue: '1', Timestamp: '', QualityGood: true, Quality: '', IsPropertyAbsent: false };
      observer.next([{ DataType: '', ErrorCode: 0, SubscriptionKey: 111, Value: value, IsArray: false }]);
      observer.complete();
    });
  }
}

class MockValueSubscription2ServiceBase {
  public registerClient(clientName: string): string {
    return 'ClientId';
  }

  public disposeClient(clientId: string): void {
    //
  }

  public subscribeValues(objectOrPropertyIds: string[], clientId: string): GmsSubscription<ValueDetails>[] {
    const retVal: GmsSubscription<ValueDetails> = new GmsSubscription<ValueDetails>('gmsId', clientId);
    const retVals: GmsSubscription<ValueDetails>[] = [retVal];
    return retVals;
  }

  public unsubscribeValues(subscriptions: GmsSubscription<ValueDetails>[], clientId: string): void {
    //
  }
}

class MockSystemBrowserServiceBase {
  public getViews(systemId?: number): Observable<ViewNode[]> {
    return new Observable(observer => {
      observer.next([{ Name: 'ApplicationView', Designation: '', Descriptor: '', SystemId: 0, SystemName: 'System22', ViewId: 0, ViewType: 0 }]);
      observer.complete();
    });
  }

  public searchNodes(systemId: number, searchString: string, viewId?: number, searchOption?: SearchOption, caseSensitive?: boolean, groupByParent?: boolean,
    size?: number, page?: number, disciplineFilter?: string, objectTypeFilter?: string, alarmSuppresion?: boolean, aliasFilter?: string): Observable<Page> {
    return new Observable(observer => {
      const browserObject: BrowserObject = {
        Attributes: undefined, Descriptor: '', Designation: '', HasChild: false, Name: searchString,
        Location: '', ObjectId: '', SystemId: 0, ViewId: 0, ViewType: 0
      };
      const pageOut: Page = { Nodes: [browserObject], Page: 0, Size: 0, Total: 0 };
      observer.next(pageOut);
      observer.complete();
    });
  }
}

class MockSystemBrowserSubscriptionServiceBase {
  public registerClient(clientName: string): string {
    return 'ClientId';
  }

  public disposeClient(clientId: string): void {
    //
  }

  public subscribeNodeChanges(designation: string, clientId: string): GmsSubscription<SystemBrowserSubscription> {
    const retVal: GmsSubscription<SystemBrowserSubscription> = new GmsSubscription<SystemBrowserSubscription>('gmsId', clientId);
    return retVal;
  }

  public unsubscribeNodeChanges(subscription: GmsSubscription<SystemBrowserSubscription>, clientId: string): void {
    //
  }
}
//
// -------------------------------------------------------------------------------------------------

describe('VideoManagementService', () => {
  // for stubbing Observables
  const vrSucc: ValidationResult = new ValidationResult(ValidationResultStatus.Success);
  const vrCanc: ValidationResult = new ValidationResult(ValidationResultStatus.Cancelled);
  const vrErro: ValidationResult = new ValidationResult(ValidationResultStatus.Error);
  const statusObservableSucc: BehaviorSubject<any> = new BehaviorSubject(vrSucc);
  const statusObservableCanc: BehaviorSubject<any> = new BehaviorSubject(vrCanc);
  const statusObservableErro: BehaviorSubject<any> = new BehaviorSubject(vrErro);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        VideoManagementService,
        { provide: TraceService, useClass: MockTraceService },
        { provide: ExecuteCommandServiceBase, useClass: MockExecuteCommandServiceBase },
        { provide: ValueServiceBase, useClass: MockValueServiceBase },
        { provide: ValueSubscription2ServiceBase, useClass: MockValueSubscription2ServiceBase },
        { provide: SystemBrowserServiceBase, useClass: MockSystemBrowserServiceBase },
        { provide: SystemBrowserSubscriptionServiceBase, useClass: MockSystemBrowserSubscriptionServiceBase }
      ]
    }).compileComponents();
  }));

  describe('create and use VideoManagementService', () => {

    it('should create VideoManagementService', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        expect(videoManagementService instanceof VideoManagementService).toBe(true);
      }
    ));

    it('should be OK: subscribe / unsubscribe', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.subscribe).toBeDefined();
        expect(service.unsubscribe).toBeDefined();
        service.subscribe();
        service.unsubscribe();
        expect(service.subscribe).toBeDefined();
        expect(service.unsubscribe).toBeDefined();
      }
    ));

    it('should be OK: getVideoSystem', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getVideoSystem).toBeDefined();
        expect(service.videoSystem === '').toBeTrue();
        service.isUtExecution = true;

        service.getVideoSystem().subscribe(() => {
          expect(service.videoSystem === '').toBeFalse();
          expect(service.videoSystem === 'System22').toBeTrue();
        });
      }
    ));

    it('should be OK: connectStream', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.connectStream).toBeDefined();
        service.isUtExecution = true;

        const mockValidationDialogService = jasmine.createSpyObj('mockValidationDialogService', ['show']);
        mockValidationDialogService.show.and.returnValue(statusObservableSucc);
        service.setValidationDialogData(mockValidationDialogService, 'Error Title', 'Error Message');

        service.connectStream('Monitor_0001', 'src1').subscribe(
          (answer: void) => {
            expect(answer).toBeUndefined();
          },
          (error: any) => {
            fail(error);
          }
        );

        service.connectStream('Monitor_0002', 'src2').subscribe(
          (answer: void) => {
            fail(answer);
          },
          (error: any) => {
            expect(error).toBeUndefined();
          }
        );
      }
    ));

    it('should be OK: connectStreams', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.connectStreams).toBeDefined();
        service.isUtExecution = true;

        const mockValidationDialogService = jasmine.createSpyObj('mockValidationDialogService', ['show']);
        mockValidationDialogService.show.and.returnValue(statusObservableCanc);
        service.setValidationDialogData(mockValidationDialogService, 'Error Title', 'Error Message');

        service.connectStreams('MG 1', 1, 'CG 1').subscribe(
          (answer: void) => {
            expect(answer).toBeUndefined();
          },
          (error: any) => {
            fail(error);
          }
        );

        service.connectStreams('MG 1', 2, 'CG 2').subscribe(
          (answer: void) => {
            fail(answer);
          },
          (error: any) => {
            expect(error).toBeUndefined();
          }
        );
      }
    ));

    it('should be OK: disconnectStream', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.disconnectStream).toBeDefined();
        service.isUtExecution = true;

        const mockValidationDialogService = jasmine.createSpyObj('mockValidationDialogService', ['show']);
        mockValidationDialogService.show.and.returnValue(statusObservableErro);
        service.setValidationDialogData(mockValidationDialogService, 'Error Title', 'Error Message');

        service.disconnectStream('Monitor_0001').subscribe(
          (answer: void) => {
            expect(answer).toBeUndefined();
          },
          (error: any) => {
            fail(error);
          }
        );

        service.disconnectStream('Monitor_0002').subscribe(
          (answer: void) => {
            fail(answer);
          },
          (error: any) => {
            expect(error).toBeUndefined();
          }
        );
      }
    ));

    it('should be OK: startSequence', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.startSequence).toBeDefined();
        service.isUtExecution = true;

        const mockValidationDialogService = jasmine.createSpyObj('mockValidationDialogService', ['show']);
        mockValidationDialogService.show.and.returnValue(statusObservableSucc);
        service.setValidationDialogData(mockValidationDialogService, 'Error Title', 'Error Message');

        service.startSequence('MG 1', 1, 'CG 1').subscribe(
          (answer: void) => {
            expect(answer).toBeUndefined();
          },
          (error: any) => {
            fail(error);
          }
        );

        service.startSequence('MG 1', 2, 'CG 2').subscribe(
          (answer: void) => {
            fail(answer);
          },
          (error: any) => {
            expect(error).toBeUndefined();
          }
        );
      }
    ));

    it('should be OK: stopSequenceMonitor', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.stopSequenceMonitor).toBeDefined();
        service.isUtExecution = true;

        const mockValidationDialogService = jasmine.createSpyObj('mockValidationDialogService', ['show']);
        mockValidationDialogService.show.and.returnValue(statusObservableCanc);
        service.setValidationDialogData(mockValidationDialogService, 'Error Title', 'Error Message');

        service.stopSequenceMonitor('Monitor_0001').subscribe(
          (answer: void) => {
            expect(answer).toBeUndefined();
          },
          (error: any) => {
            fail(error);
          }
        );

        service.stopSequenceMonitor('Monitor_0002').subscribe(
          (answer: void) => {
            fail(answer);
          },
          (error: any) => {
            expect(error).toBeUndefined();
          }
        );
      }
    ));

    it('should be OK: getConnectionStatus', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getConnectionStatus).toBeDefined();
        service.isUtExecution = true;

        service.getConnectionStatus().subscribe(
          (answer: string) => {
            expect(answer).toBeDefined();
            expect(answer === '1').toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));

    it('should be OK: getAlignmentStatus', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getAlignmentStatus).toBeDefined();
        service.isUtExecution = true;

        service.getAlignmentStatus().subscribe(
          (answer: string) => {
            expect(answer).toBeDefined();
            expect(answer === '1').toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));

    it('should be OK: getFrameSpacing', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getFrameSpacing).toBeDefined();
        service.isUtExecution = true;

        service.getFrameSpacing().subscribe(
          (answer: string) => {
            expect(answer).toBeDefined();
            expect(answer === '1').toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));

    it('should be OK: getCameraStatus', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getCameraStatus).toBeDefined();
        service.isUtExecution = true;

        service.getCameraStatus('src1').subscribe(
          (answer: string) => {
            expect(answer).toBeDefined();
            expect(answer === '1').toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: registerValueSubscription2Client', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.registerValueSubscription2Client).toBeDefined();
        service.isUtExecution = true;

        const clientId = service.registerValueSubscription2Client('VideoClientName');
        expect(clientId).toBeDefined();
        expect(clientId === 'ClientId').toBeTrue();
      }
    ));

    it('should be OK: disposeValueSubscription2Client', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.disposeValueSubscription2Client).toBeDefined();
        service.isUtExecution = true;

        expect(service.disposeValueSubscription2Client).toBeDefined();
        service.disposeValueSubscription2Client('VideoClientName');
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: subscribeConnectionStatusNotification', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.subscribeConnectionStatusNotification).toBeDefined();
        service.isUtExecution = true;

        expect(service.subscribeConnectionStatusNotification).toBeDefined();
        const subscription: GmsSubscription<ValueDetails> = service.subscribeConnectionStatusNotification('ClientId');
        expect(subscription).toBeDefined();
        expect(subscription.gmsId === 'gmsId').toBeTrue();
        expect(subscription.clientId === 'ClientId').toBeTrue();
      }
    ));

    it('should be OK: unsubscribeConnectionStatusNotification', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.unsubscribeConnectionStatusNotification).toBeDefined();
        service.isUtExecution = true;

        const subscription: GmsSubscription<ValueDetails> = service.subscribeConnectionStatusNotification('ClientId');

        expect(service.unsubscribeConnectionStatusNotification).toBeDefined();
        service.unsubscribeConnectionStatusNotification(subscription, 'ClientId');
      }
    ));

    it('should be OK: subscribeAlignmentStatusNotification', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.subscribeAlignmentStatusNotification).toBeDefined();
        service.isUtExecution = true;

        expect(service.subscribeAlignmentStatusNotification).toBeDefined();
        const subscription: GmsSubscription<ValueDetails> = service.subscribeAlignmentStatusNotification('ClientId');
        expect(subscription).toBeDefined();
        expect(subscription.gmsId === 'gmsId').toBeTrue();
        expect(subscription.clientId === 'ClientId').toBeTrue();
      }
    ));

    it('should be OK: unsubscribeAlignmentStatusNotification', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.unsubscribeAlignmentStatusNotification).toBeDefined();
        service.isUtExecution = true;

        const subscription: GmsSubscription<ValueDetails> = service.subscribeAlignmentStatusNotification('ClientId');

        expect(service.unsubscribeAlignmentStatusNotification).toBeDefined();
        service.unsubscribeAlignmentStatusNotification(subscription, 'ClientId');
      }
    ));

    it('should be OK: subscribeCameraStatusNotification', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.subscribeCameraStatusNotification).toBeDefined();
        service.isUtExecution = true;

        expect(service.subscribeCameraStatusNotification).toBeDefined();
        const subscription: GmsSubscription<ValueDetails> = service.subscribeCameraStatusNotification('ClientId', 'src1');
        expect(subscription).toBeDefined();
        expect(subscription.gmsId === 'gmsId').toBeTrue();
        expect(subscription.clientId === 'ClientId').toBeTrue();
      }
    ));

    it('should be OK: unsubscribeCameraStatusNotification', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.unsubscribeCameraStatusNotification).toBeDefined();
        service.isUtExecution = true;

        const subscription: GmsSubscription<ValueDetails> = service.subscribeCameraStatusNotification('ClientId', 'src1');

        expect(service.unsubscribeCameraStatusNotification).toBeDefined();
        service.unsubscribeCameraStatusNotification(subscription, 'ClientId');
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: registerSystemBrowserClient', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.registerSystemBrowserClient).toBeDefined();
        service.isUtExecution = true;

        const clientId = service.registerSystemBrowserClient('VideoClientName');
        expect(clientId).toBeDefined();
        expect(clientId === 'ClientId').toBeTrue();
      }
    ));

    it('should be OK: disposeSystemBrowserClient', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.disposeSystemBrowserClient).toBeDefined();
        service.isUtExecution = true;

        expect(service.disposeSystemBrowserClient).toBeDefined();
        service.disposeSystemBrowserClient('VideoClientName');
      }
    ));

    it('should be OK: subscribeSystemBrowserNodeChanges', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.subscribeSystemBrowserNodeChanges).toBeDefined();
        service.isUtExecution = true;

        expect(service.subscribeSystemBrowserNodeChanges).toBeDefined();
        const subscription: GmsSubscription<SystemBrowserSubscription> = service.subscribeSystemBrowserNodeChanges('Designation', 'ClientId');
        expect(subscription).toBeDefined();
        expect(subscription.gmsId === 'gmsId').toBeTrue();
        expect(subscription.clientId === 'ClientId').toBeTrue();
      }
    ));

    it('should be OK: unsubscribeSystemBrowserNodeChanges', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.unsubscribeSystemBrowserNodeChanges).toBeDefined();
        service.isUtExecution = true;

        const subscription: GmsSubscription<SystemBrowserSubscription> = service.subscribeSystemBrowserNodeChanges('Designation', 'ClientId');

        expect(service.unsubscribeSystemBrowserNodeChanges).toBeDefined();
        service.unsubscribeSystemBrowserNodeChanges(subscription, 'ClientId');
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: getApplicationViewDesignation', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getApplicationViewDesignation).toBeDefined();
        service.isUtExecution = true;

        service.getApplicationViewDesignation().subscribe(
          (answer: string) => {
            expect(answer).toBeDefined();
            expect(answer === '').toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: setSelectedObjectData', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.setSelectedObjectData).toBeDefined();
        service.isUtExecution = true;

        expect(service.setSelectedObjectData).toBeDefined();
        service.setSelectedObjectData('SelectedObjectDesignation');
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: refreshCnsDataCache', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.refreshCnsDataCache).toBeDefined();
        service.isUtExecution = true;

        service.refreshCnsDataCache().subscribe(
          (answer: boolean) => {
            expect(answer).toBeDefined();
            expect(answer).toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));

    // -----------------------------------------------------------------------------------------

    it('should be OK: getCnsDescriptionsFromCnsDataCache', inject([VideoManagementService],
      (videoManagementService: VideoManagementService) => {
        const service: VideoManagementService = videoManagementService;
        expect(service).toBeDefined();
        expect(service.getCnsDescriptionsFromCnsDataCache).toBeDefined();
        service.isUtExecution = true;

        const names: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
        service.getCnsDescriptionsFromCnsDataCache(names).subscribe(
          (answer: Map<string, Map<string, string>>) => {
            expect(answer).toBeDefined();
            expect(answer.keys.length === 0).toBeTrue();
            expect(answer.values.length === 0).toBeTrue();
          },
          (error: any) => {
            fail(error);
          }
        );
      }
    ));
  });
});
