import { NgZone } from '@angular/core';
import { WsiEndpointService, WsiUtilityService } from '@gms-flex/services';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { Services, VMSDataSubscriptionProxyService } from './video-management-vmsdata-subscription-proxy.service';

describe('Test VMSDataSubscriptionProxyService class', () => {
  // variables to instantiate VMSDataSubscriptionService instance
  let vmsDataSubscriptionProxyService: VMSDataSubscriptionProxyService;

  let errorService: ErrorNotificationServiceBase;
  let ngZone: NgZone;

  // mocks
  const connectionState = new Observable<SignalR.ConnectionState>();
  const disconnected = new Observable<boolean>();
  const hubConnection = jasmine.createSpyObj('hubConnection', {},
    { connectionState, disconnected });
  const httpPost = new Observable<boolean>();
  const httpRequest = new Observable<boolean>();

  const hps = jasmine.createSpyObj('hps', ['get'], { hubConnection });

  const traceService: TraceService = jasmine.createSpyObj('traceService', ['info', 'debug', 'warn', 'error', 'isDebugEnabled']);

  const signalRService = jasmine.createSpyObj('signalRService', ['getNorisHub']);
  signalRService.getNorisHub.and.returnValue(hps);

  const wsiUtilityService: WsiUtilityService = jasmine.createSpyObj('wsiUtilityService', ['httpPostDefaultHeader']);

  const authenticationServiceBase: AuthenticationServiceBase = jasmine.createSpyObj('authenticationServiceBase', [], { userToken: ' ' });

  const wsiEndpoint: WsiEndpointService = jasmine.createSpyObj('wsiEndpoint', [], { entryPoint: ' ' });

  const httpClient = jasmine.createSpyObj('httpClient', ['post', 'request']);
  httpClient.post.and.returnValue(httpPost);
  httpClient.request.and.returnValue(httpRequest);

  // beforeEach UT
  beforeEach(() => {
    vmsDataSubscriptionProxyService = new VMSDataSubscriptionProxyService(
      traceService, httpClient, authenticationServiceBase,
      signalRService, ngZone, new Services(wsiEndpoint, wsiUtilityService, errorService));
  });

  // UTs
  it('should create new VMSDataSubscriptionProxyService', () => {
    expect(vmsDataSubscriptionProxyService instanceof VMSDataSubscriptionProxyService).toBe(true);
    expect(vmsDataSubscriptionProxyService).toBeDefined();
  });

  it('should be OK: subscribeVMSDataChanges()', () => {
    expect(vmsDataSubscriptionProxyService instanceof VMSDataSubscriptionProxyService).toBe(true);
    expect(vmsDataSubscriptionProxyService).toBeDefined();
    expect(vmsDataSubscriptionProxyService.subscribeVMSDataChanges).toBeDefined();

    expect(vmsDataSubscriptionProxyService.subscribeVMSDataChanges('mntr1')).toBeDefined();
    vmsDataSubscriptionProxyService.subscribeVMSDataChanges('mntr1').subscribe(changes => {
      expect(changes).toThrow();
    });
  });

  it('should be OK: unsubscribeVMSDataChanges()', () => {
    expect(vmsDataSubscriptionProxyService instanceof VMSDataSubscriptionProxyService).toBe(true);
    expect(vmsDataSubscriptionProxyService).toBeDefined();
    expect(vmsDataSubscriptionProxyService.unsubscribeVMSDataChanges).toBeDefined();

    expect(vmsDataSubscriptionProxyService.unsubscribeVMSDataChanges([2])).toBeDefined();
    vmsDataSubscriptionProxyService.unsubscribeVMSDataChanges([2, 3, 4]).subscribe(changes => {
      expect(changes).toThrow();
    });
  });

  it('should be OK: vmsDataChangeNotification()', () => {
    expect(vmsDataSubscriptionProxyService instanceof VMSDataSubscriptionProxyService).toBe(true);
    expect(vmsDataSubscriptionProxyService).toBeDefined();
    expect(vmsDataSubscriptionProxyService.vmsDataChangeNotification).toBeDefined();

    expect(vmsDataSubscriptionProxyService.vmsDataChangeNotification()).toBeDefined();
    vmsDataSubscriptionProxyService.vmsDataChangeNotification().subscribe(changes => {
      expect(changes).toThrow();
    });
  });

  it('should be OK: notifyConnectionState()', () => {
    expect(vmsDataSubscriptionProxyService instanceof VMSDataSubscriptionProxyService).toBe(true);
    expect(vmsDataSubscriptionProxyService).toBeDefined();
    expect(vmsDataSubscriptionProxyService.notifyConnectionState).toBeDefined();

    expect(vmsDataSubscriptionProxyService.notifyConnectionState()).toBeDefined();
    vmsDataSubscriptionProxyService.notifyConnectionState().subscribe(changes => {
      expect(changes).toThrow();
    });
  });

  // it('gets user name and ID', () => {
  //     spyOn(_signalRService, 'getNorisHub')
  //         .withArgs('abc').and.returnValue('Jane')
  //         .withArgs('123').and.returnValue(98765);
  // });
});
