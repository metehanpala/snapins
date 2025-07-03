/** class imports */
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WsiEndpointService, WsiUtilityService } from '@gms-flex/services';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../../shared/trace-modules';
import { VMSDataServiceBase } from './video-management-vmsdata.service.base';
import { SnapshotData, VMSMonitorWallData } from './vms.data.model';

/** class constants */
const getSelectedNodeDataUrl = '/api/Videos/';
const getOperatingMonitorGroupDataUrl = '/api/Videos/station/';
const getSnapshotDataUrl = '/api/Videos/snapshot/';

// HttpErrorNotFound = HttpStatusCode.NotFound;                                  => 404  Object Not Found
// HttpErrorNotAcceptable = HttpStatusCode.NotAcceptable;                        => 406  Video API Not Reachable
// HttpErrorForbidden = HttpStatusCode.Forbidden;                                => 403  Video Manager Not Reachable
// HttpErrorGone = HttpStatusCode.Gone;                                          => 410  VMS Not Reachable
// HttpErrorPreconditionFailed = HttpStatusCode.PreconditionFailed;              => 412  VMS Synchronizing
// HttpErrorSeeOther = HttpStatusCode.SeeOther;                                  => 303  Videosource Errors

/**
 * GMS WSI VMS data implementation.
 *
 * @export
 * @class VMSDataService
 * @extends {VMSDataServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class VMSDataService extends VMSDataServiceBase {

  /** class private data */
  private isPendingGetSnapshotData = false;

  /**
   * Creates an instance of VMSDataService.
   * @memberof VMSDataService
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly traceService: TraceService
  ) {
    super();
  }

  /**
   * Gets selected node data.
   * See also WSI API specification.
   *
   * @param {} nodeObjectModel
   * @param {} nodeName
   * @returns {}
   * @memberof VMSDataService
   */
  public getSelectedNodeData(nodeObjectModel: string, nodeName: string): Observable<VMSMonitorWallData> {
    this.traceService.debug(TraceModules.videoVmsDataService, '$$$(getSelectedNodeData-1) %s %s', nodeObjectModel, nodeName);

    if (nodeObjectModel === undefined || nodeName === undefined) {
      return observableThrowError(() => new Error('getSelectedNodeData - Invalid arguments!'));
    }

    const nodeNameDoubleEncoded: string = encodeURIComponent(encodeURIComponent(nodeName));
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${getSelectedNodeDataUrl}${nodeObjectModel}/${nodeNameDoubleEncoded}`;
    this.traceService.debug(TraceModules.videoVmsDataService, 'getSelectedNodeData - $$$(getSelectedNodeData-2) %s %s', headers, url);

    return this.httpClient.get(url, { headers, observe: 'response' }).
      pipe(
        map((response: HttpResponse<any>) =>
          this.extractData(response)), // this.wsiUtilityService.extractData(response, "VideoViewer", "getSelectedNodeData()")),
        catchError((response: HttpResponse<any>) =>
          this.manageErrorGetSelectedNodeData(response)));
  }

  /**
   * Gets operating monitor group data.
   * See also WSI API specification.
   *
   * @param {} hostname
   * @returns {}
   * @memberof VMSDataServiceBase
   */
  public getOperatingMonitorGroupData(hostname: string): Observable<VMSMonitorWallData> {
    this.traceService.debug(TraceModules.videoVmsDataService, '$$$(getOperatingMonitorGroupData-1) %s', hostname);

    if (hostname === undefined) {
      return observableThrowError(() => new Error('getOperatingMonitorGroupData - Invalid arguments!'));
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${getOperatingMonitorGroupDataUrl}/${hostname}`;
    this.traceService.debug(TraceModules.videoVmsDataService, 'getOperatingMonitorGroupData - $$$(getSelectedNodeData-2) %s %s', headers, url);

    return this.httpClient.get(url, { headers, observe: 'response' }).
      pipe(
        map((response: HttpResponse<any>) =>
          this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.manageErrorGetOperatingMonitorGroupData(response)
        ));
  }

  /**
   * getSnapshotData
   *
   * @param {} videoSourceId
   * @param {} clientId
   * @param {} crc
   * @param {} p4
   * @param {} p5
   * @returns {}
   * @memberof VMSDataService
   */
  public getSnapshotData(videoSourceId: string, clientId: string, crc: string, p4: string, p5: string): Observable<SnapshotData> {
    this.traceService.debug(TraceModules.videoVmsDataService, '$$$(getSnapshotData-1) %s %s %s %s %s', videoSourceId, clientId, crc, p4, p5);

    if (videoSourceId === undefined || clientId === undefined || crc === undefined || p4 === undefined || p5 === undefined) {
      return observableThrowError(() => new Error('getSnapshotData - Invalid arguments!'));
    }
    if (this.isPendingGetSnapshotData) {
      return undefined;
    }

    this.isPendingGetSnapshotData = true;

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${getSnapshotDataUrl}/${videoSourceId}/${clientId}/${crc}/${p4}/${p5}`;
    this.traceService.debug(TraceModules.videoVmsDataService, 'getOperatingMonitorGroupData - $$$(getSelectedNodeData-2) %s %s', headers, url);

    return this.httpClient.get(url, { headers, observe: 'response' }).
      pipe(
        map((response: HttpResponse<any>) =>
          this.extractSnapshotData(response)),
        catchError((response: HttpErrorResponse) =>
          this.manageErrorSnapshotData(response)
        ));
  }

  // --------------------------------------------------------------------------------------------

  /**
   * Extract data from HTPP response
   *
   * @private
   * @param {} response
   * @returns {}
   * @memberof VMSDataService
   */
  private extractData(response: HttpResponse<any>): VMSMonitorWallData {
    this.traceService.debug(TraceModules.videoVmsDataService, 'extractData - response: %s', response);
    if (response.ok) {
      const obj: any[] = JSON.parse(String(this.preprocessResponse(response.body)));

      // note: object's constructor is NOT called
      obj[0].objectNotFound = false;
      obj[0].vmsNotReachable = false;
      obj[0].vmsSynchronizing = false;
      obj[0].videoManagerNotReachable = false;
      obj[0].maxClientsNumber = false;
      obj[0].videoSourceErrorState = '';

      return obj[0];
    } else {
      // no data
      return undefined;
    }
  }

  /**
   * preprocessResponse
   *
   * @private
   * @param {} resp
   * @returns {}
   * @memberof VMSDataService
   */
  private preprocessResponse(resp: string): string {
    resp = resp.split('"Sinks":').join('"sinks":');
    resp = resp.split('"Id":').join('"id":');
    resp = resp.split('"CameraStatus":').join('"cameraStatus":');
    resp = resp.split('"SequenceStatus":').join('"sequenceStatus":');
    resp = resp.split('"HasPlayback":').join('"hasPlayback":');
    return resp;
  }

  /**
   * Extract data from HTPP response
   *
   * @private
   * @param {} response
   * @returns {}
   * @memberof VMSDataService
   */
  private extractSnapshotData(response: HttpResponse<any>): SnapshotData {
    this.isPendingGetSnapshotData = false;
    this.traceService.debug(TraceModules.videoVmsDataService, 'extractSnapshotData - response: %s', response);
    if (response.ok) {
      const obj = new SnapshotData();
      obj.imageData = String(response.body);
      return obj;
    } else {
      // no data
      return undefined;
    }
  }

  /**
   * manageErrorGetSelectedNodeData
   *
   * @private
   * @param {} response
   * @returns {}
   * @memberof VMSDataService
   */
  private manageErrorGetSelectedNodeData(response: any): Observable<any> {
    return this.manageError(response, 'getSelectedNodeData()');
  }

  /**
   * manageErrorGetOperatingMonitorGroupData
   *
   * @private
   * @param {} response
   * @returns {}
   * @memberof VMSDataService
   */
  private manageErrorGetOperatingMonitorGroupData(response: any): Observable<any> {
    return this.manageError(response, 'getOperatingMonitorGroupData()');
  }

  /**
   * manageErrorSnapshotData
   *
   * @private
   * @param {} response
   * @returns {}
   * @memberof VMSDataService
   */
  private manageErrorSnapshotData(response: HttpErrorResponse): Observable<any> {
    this.isPendingGetSnapshotData = false;
    return this.manageError(response, 'getSnapshotData()');
  }

  /**
   * manageError
   *
   * @private
   * @param {} response
   * @param {} msg
   * @returns {}
   * @memberof VMSDataService
   */
  private manageError(response: HttpErrorResponse, msg: string): Observable<any> {
    this.traceService.debug(TraceModules.videoVmsDataService, 'manageError - response: %s', response);
    if (response.status === HttpStatusCode.NotFound || response.status === HttpStatusCode.NotAcceptable ||
            response.status === HttpStatusCode.Forbidden || response.status === HttpStatusCode.Gone ||
            response.status === HttpStatusCode.PreconditionFailed || response.status === HttpStatusCode.RangeNotSatisfiable ||
            response.status === HttpStatusCode.SeeOther) {
      return new Observable(observer => {
        observer.next(this.getErrorObject(response.status, response.error));
        observer.complete();
      });
    } else {
      return this.wsiUtilityService.handleError(response, 'VideoViewer', msg, this.errorService);
    }
  }

  /**
   * getErrorObject
   *
   * @private
   * @param {} httpErrorCode
   * @param {} error
   * @returns {}
   * @memberof VMSDataService
   */
  private getErrorObject(httpErrorCode: number, error: string): VMSMonitorWallData {
    // all flags are reset inside constructor
    const vmsMonitorWallData = new VMSMonitorWallData();

    // check the current error and set the corresponding flag
    switch (httpErrorCode) {
      case HttpStatusCode.NotFound: // Object Not Found
        vmsMonitorWallData.objectNotFound = true;
        break;

      case HttpStatusCode.NotAcceptable: // Video API Not Reachable
        vmsMonitorWallData.videoAPINotReachable = true;
        break;

      case HttpStatusCode.Forbidden: // Video Manager Not Reachable
        vmsMonitorWallData.videoManagerNotReachable = true;
        break;

      case HttpStatusCode.Gone: // VMS Not Reachable
        vmsMonitorWallData.vmsNotReachable = true;
        break;

      case HttpStatusCode.PreconditionFailed: // VMS Synchronizing
        vmsMonitorWallData.vmsSynchronizing = true;
        break;

      case HttpStatusCode.RangeNotSatisfiable: // Max Clients Number Reached
        vmsMonitorWallData.maxClientsNumber = true;
        break;

      case HttpStatusCode.SeeOther: // Videosource Errors
        vmsMonitorWallData.videoSourceErrorState = error;
        break;

      default:
        // NOP
        break;
    }

    // done
    return vmsMonitorWallData;
  }
}
