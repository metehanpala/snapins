import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { VMSDataService } from './video-management-vmsdata.service';

describe('Test VMSDataService class', () => {

  const httpPost = new Observable<boolean>();
  const httpRequest = new Observable<boolean>();
  let httpGet: any;

  // variables to instantiate VMSDataService instance
  let vmsDataService: VMSDataService;
  let errorService: any;

  // mocks
  const traceService = jasmine.createSpyObj('traceService', ['debug']);

  const wsiUtilityService = jasmine.createSpyObj('wsiUtilityService', ['httpPostDefaultHeader', 'handleError']);

  const authenticationServiceBase = jasmine.createSpyObj('authenticationServiceBase', [], { userToken: ' ' });

  const wsiEndpointService = jasmine.createSpyObj('wsiEndpointService', [], { entryPoint: ' ' });

  const httpClient = jasmine.createSpyObj('httpClient', ['post', 'request', 'get']);
  httpClient.post.and.returnValue(httpPost);
  httpClient.request.and.returnValue(httpRequest);
  httpClient.get.and.returnValue(httpGet);

  // beforeEach UT
  beforeEach(() => {
  });

  // UTs
  it('should create new VMSDataService', () => {
    httpGet = new Observable<boolean>();
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
  });

  it('should be OK: getSelectedNodeData() OK', () => {
    httpGet = of({ ok: true, body: '[{}]' });
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getSelectedNodeData).toBeDefined();

    vmsDataService.getSelectedNodeData('nodeObjectModel', 'nodeName').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeDefined();

      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === '').toBe(true);
    });

    vmsDataService.getSelectedNodeData(undefined, undefined).
      subscribe(() => { },
        error => { });

    vmsDataService.getSelectedNodeData('nodeObjectModel', 'nodeName').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeDefined();

      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === '').toBe(true);
    });
  });

  it('should be OK: getSelectedNodeData() KO', () => {
    httpGet = of({ ok: false, body: '[{}]' });
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getSelectedNodeData).toBeDefined();

    vmsDataService.getSelectedNodeData('nodeObjectModel', 'nodeName').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeUndefined();
    });

    // ------------------------------------------------------------------------

    const error = new HttpErrorResponse({ status: 303 });
    httpClient.get.and.returnValue(throwError(error) as any);

    vmsDataService.getSelectedNodeData('nodeObjectModel', 'nodeName').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeDefined();

      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === null).toBe(true);
    });
  });

  it('should be OK: getOperatingMonitorGroupData() OK', () => {
    httpGet = of({ ok: true, body: '[{}]' });
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getOperatingMonitorGroupData).toBeDefined();

    vmsDataService.getOperatingMonitorGroupData('hostname').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeDefined();

      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === '').toBe(true);
    });

    vmsDataService.getOperatingMonitorGroupData(undefined).
      subscribe(() => { },
        error => { });

    vmsDataService.getOperatingMonitorGroupData('hostname').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeDefined();

      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(false);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === '').toBe(true);
    });
  });

  it('should be OK: getOperatingMonitorGroupData() KO', () => {
    httpGet = of({ ok: false, body: '[{}]' });
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getOperatingMonitorGroupData).toBeDefined();

    vmsDataService.getOperatingMonitorGroupData('hostname').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeUndefined();
    });

    // ------------------------------------------------------------------------

    const error = new HttpErrorResponse({ status: 410 });
    httpClient.get.and.returnValue(throwError(error) as any);

    vmsDataService.getOperatingMonitorGroupData('hostname').subscribe(vmsMonitorWallData => {
      expect(vmsMonitorWallData).toBeDefined();

      expect(vmsMonitorWallData.objectNotFound).toBe(false);
      expect(vmsMonitorWallData.vmsNotReachable).toBe(true);
      expect(vmsMonitorWallData.vmsSynchronizing).toBe(false);
      expect(vmsMonitorWallData.videoManagerNotReachable).toBe(false);
      expect(vmsMonitorWallData.maxClientsNumber).toBe(false);
      expect(vmsMonitorWallData.videoSourceErrorState === '').toBe(true);
    });
  });

  it('should be OK: getSnapshotData() OK', () => {
    httpGet = of({ ok: true, body: 'image' });
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getSnapshotData).toBeDefined();

    vmsDataService.getSnapshotData('videoSourceId', 'clientId', 'crc', 'p4', 'p5').subscribe(snapshotData => {
      expect(snapshotData).toBeDefined();

      expect(snapshotData.objectNotFound).toBe(false);
      expect(snapshotData.videoAPINotReachable).toBe(false);
      expect(snapshotData.videoManagerNotReachable).toBe(false);
      expect(snapshotData.vmsNotReachable).toBe(false);
      expect(snapshotData.vmsSynchronizing).toBe(false);
      expect(snapshotData.maxClientsNumber).toBe(false);
      expect(snapshotData.videoSourceErrorState === '').toBe(true);
      expect(snapshotData.imageData === 'image').toBe(true);
    });

    vmsDataService.getSnapshotData(undefined, undefined, undefined, 'p4', 'p5').
      subscribe(() => {},
        error => { });

    vmsDataService.getSnapshotData('videoSourceId', 'clientId', 'crc', 'p4', 'p5').subscribe(snapshotData => {
      expect(snapshotData).toBeDefined();

      expect(snapshotData.objectNotFound).toBe(false);
      expect(snapshotData.videoAPINotReachable).toBe(false);
      expect(snapshotData.videoManagerNotReachable).toBe(false);
      expect(snapshotData.vmsNotReachable).toBe(false);
      expect(snapshotData.vmsSynchronizing).toBe(false);
      expect(snapshotData.maxClientsNumber).toBe(false);
      expect(snapshotData.videoSourceErrorState === '').toBe(true);
      expect(snapshotData.imageData === 'image').toBe(true);
    });
  });

  it('should be OK: getSnapshotData() KO', () => {
    httpGet = of({ ok: false, body: 'image' });
    httpClient.get.and.returnValue(httpGet);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getSnapshotData).toBeDefined();

    vmsDataService.getSnapshotData('videoSourceId', 'clientId', 'crc', 'p4', 'p5').subscribe(snapshotData => {
      expect(snapshotData).toBeUndefined();
    });

    // ------------------------------------------------------------------------

    const error = new HttpErrorResponse({ status: 412 });
    httpClient.get.and.returnValue(throwError(error) as any);

    vmsDataService = new VMSDataService(httpClient, authenticationServiceBase, wsiEndpointService,
      wsiUtilityService, errorService, traceService);

    expect(vmsDataService instanceof VMSDataService).toBe(true);
    expect(vmsDataService).toBeDefined();
    expect(vmsDataService.getSnapshotData).toBeDefined();

    vmsDataService.getSnapshotData('videoSourceId', 'clientId', 'crc', 'p4', 'p5').subscribe(snapshotData => {
      expect(snapshotData).toBeDefined();

      expect(snapshotData.objectNotFound).toBe(false);
      expect(snapshotData.videoAPINotReachable).toBe(false);
      expect(snapshotData.videoManagerNotReachable).toBe(false);
      expect(snapshotData.vmsNotReachable).toBe(false);
      expect(snapshotData.vmsSynchronizing).toBe(true);
      expect(snapshotData.maxClientsNumber).toBe(false);
      expect(snapshotData.videoSourceErrorState === '').toBe(true);
      expect(snapshotData.imageData).toBeUndefined();
    });
  });
});
