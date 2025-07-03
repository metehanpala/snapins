import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import {
  ConnectionState, HubProxyEvent, HubProxyShared, SignalRService, SubscribeContextChannelized, SubscriptionDeleteWsi, SubscriptionUtility, SubscriptionWsiVal,
  WsiEndpointService, WsiUtilityService
} from '@gms-flex/services';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, Observer, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { VMSDataSubscriptionProxyServiceBase } from '.';
import { TraceModules } from '../../shared/trace-modules';
import { SubscriptionGmsVMSData, VMSDataChange } from './vmssubscription.data.model';

/** class constants */
const videoSubscriptionUrl = '/api/Extensions/VideosSubscriptions/';
const reconnectTimeout = 5000;

const log = false;
const log1 = true;

@Injectable({
  providedIn: 'root'
})
export class Services {
  public constructor(
    public readonly wsiEndpoint: WsiEndpointService,
    public readonly wsiUtilityService: WsiUtilityService,
    public readonly errorService: ErrorNotificationServiceBase
  ) {
  }
}

/**
 * VMSDataSubscriptionProxyService
 *
 * @export
 * @class VMSDataSubscriptionProxyService
 * @extends {VMSDataSubscriptionProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class VMSDataSubscriptionProxyService extends VMSDataSubscriptionProxyServiceBase {

  /**
   * vmsChangeSubscription
   *
   * @type {Observable<VMSDataChange[]>}
   * @memberof VMSDataSubscriptionProxyService
   */
  public vmsChangeSubscription: Map<string, Observable<VMSDataChange[]>> = new Map<string, Observable<VMSDataChange[]>>(); // *****SignalR*****

  /**
   * clientId
   *
   * @type {string}
   * @memberof VMSDataSubscriptionProxyService
   */
  public clientId: string = undefined; // ***SignalR***

  private hubProxyShared: HubProxyShared;
  private hubProxyEventVMSDataChange: HubProxyEvent<VMSDataChange[]>;
  private hubProxyEventSubs: HubProxyEvent<SubscriptionWsiVal>;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelized<SubscriptionGmsVMSData>> =
    new Map<string, SubscribeContextChannelized<SubscriptionGmsVMSData>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelized<SubscriptionGmsVMSData>> =
    new Map<string, SubscribeContextChannelized<SubscriptionGmsVMSData>>();
  private readonly _valueEvents: Subject<VMSDataChange[]> = new Subject<VMSDataChange[]>();

  /**
   * vmsChangeNotifications
   *
   * @type {Observer<VMSDataChange[]>}
   * @memberof VMSDataSubscriptionProxyService
   */
  private readonly vmsChangeNotifications: Map<string, Observer<VMSDataChange[]>> = new Map<string, Observer<VMSDataChange[]>>(); // *****SignalR*****

  /**
   * subscribedObjectId
   *
   * @private
   * @type {string}
   * @memberof VMSDataSubscriptionProxyService
   */
  private readonly subscribedObjectId: Map<string, string> = new Map<string, string>(); // ***SignalR***

  /**
   * requestId
   *
   * @private
   * @type {Map<string, string>}
   * @memberof VMSDataSubscriptionProxyService
   */
  private readonly requestId: Map<string, string> = new Map<string, string>(); // ***SignalR***

  /**
   *Creates an instance of VMSDataSubscriptionProxyService.
   * @param {} traceService
   * @param {} httpClient
   * @param {} authenticationServiceBase
   * @param {} _signalRService
   * @param {} ngZone
   * @param {} services
   * @memberof VMSDataSubscriptionProxyService
   */
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly _signalRService: SignalRService,
    private readonly ngZone: NgZone,
    private readonly services: Services
  ) {
    super();

    this.createEventProxies();
    this.hubProxyShared.hubConnection.connectionState.subscribe(value => this.onSignalRConnectionState(value));
    this.hubProxyShared.hubConnection.disconnected.pipe(delay(reconnectTimeout)).subscribe(
      value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));

    this.traceService.info(TraceModules.videoHubProxyEvent, 'VMSDataSubscriptionProxyService created.');
  }

  /**
   * subscribeVMSDataChanges
   *
   * @param {} monitorGroupId
   * @returns {}
   * @memberof VMSDataSubscriptionProxyService
   */
  public subscribeVMSDataChanges(monitorGroupId: string): Observable<SubscriptionGmsVMSData[]> {
    if (monitorGroupId == null) {
      this.traceService.error(TraceModules.videoHubProxyEvent, 'VMSDataSubscriptionProxyService.subscribeValues() called with invalid arguments!');
      return observableThrowError(new Error('Invalid arguments! (1)'));
    }
    this.subscribedObjectId.set(this.clientId, monitorGroupId); // ***SignalR***
    if (this.traceService.isDebugEnabled(TraceModules.videoHubProxyEvent)) {
      this.traceService.debug(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.subscribeValues(): monitorGroupId to subscribe:\n%s', monitorGroupId);
    }

    this.logHelper(log, '---subscribe()--- %s %s', this.clientId, monitorGroupId);

    const headers: HttpHeaders = this.services.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(monitorGroupId);
    // Initialize Params Object
    // const params: HttpParams = new HttpParams();
    // // Begin assigning parameters
    // params = params.set("detailsRequired", String(details));

    const httpPostProxy: Subject<SubscriptionGmsVMSData[]> = new Subject<SubscriptionGmsVMSData[]>();
    const ctx: SubscribeContextChannelized<SubscriptionGmsVMSData> =
            new SubscribeContextChannelized<SubscriptionGmsVMSData>([monitorGroupId], httpPostProxy);

    if (this.hubProxyShared.hubConnection.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.videoHubProxyEvent,
        `VMSDataSubscriptionProxyService.subscribeValues(): signalr connection not established;
                need to wait (and postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.videoHubProxyEvent,
            'VMSDataSubscriptionProxyService.subscribeValues(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.videoHubProxyEvent,
              'VMSDataSubscriptionProxyService.subscribeValues(); Implementation error, we should not reach this!');
          }

          this.executePost(monitorGroupId, body, headers, httpPostProxy, ctx,
            'VMSDataSubscriptionProxyService.subscribeValues(); http post can be issued now (after connecting)...');

          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.executePost(monitorGroupId, body, headers, httpPostProxy, ctx,
        'VMSDataSubscriptionProxyService.subscribeValues(); http post can be issued immediately...');
    }

    // *****SignalR*****
    this.vmsChangeSubscription.set(this.clientId, new Observable<VMSDataChange[]>(
      (obs: Observer<VMSDataChange[]>) => {
        this.vmsChangeNotifications.set(this.clientId, obs);
        this.logHelper(log, '<<<Set>>> %s %s', this.clientId, obs);
      }));

    this.requestId.set(this.clientId, ctx.id);
    // *****SignalR*****
    return httpPostProxy.asObservable();
  }

  /**
   * unsubscribeVMSDataChanges
   *
   * @param {} keys
   * @returns {}
   * @memberof VMSDataSubscriptionProxyService
   */
  public unsubscribeVMSDataChanges(keys: number[]): Observable<SubscriptionDeleteWsi[]> {
    if (keys == null || keys.length === 0) {
      this.traceService.error(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges() called with invalid arguments!');
      return observableThrowError(new Error('Invalid arguments! (2)'));
    }
    const index: number = keys.findIndex(item => (item === undefined));
    if (index !== -1) {
      this.traceService.error(TraceModules.videoHubProxyEvent, 'Invalid keys!');
      keys = keys.filter(item => (item !== undefined));
    }
    if (keys.length === 0) {
      return observableThrowError(new Error('Invalid arguments! (3)'));
    }

    this.traceService.info(TraceModules.videoHubProxyEvent,
      'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges() called; number of keys:\n%s', keys.length);
    if (this.traceService.isDebugEnabled(TraceModules.videoHubProxyEvent)) {
      this.traceService.debug(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges():\nKeys: %s', keys.toString());
    }

    const headers: HttpHeaders = this.services.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(this.subscribedObjectId.get(this.clientId)); // JSON.stringify(keys);  ***SignalR***
    this.logHelper(log1, '---(body) %s', body);
    // Initialize Params Object
    const params: HttpParams = new HttpParams();
    // Begin assigning parameters

    const httpPostProxy: Subject<SubscriptionDeleteWsi[]> = new Subject<SubscriptionDeleteWsi[]>();

    // Sonar Finding: all code moved there
    this.deleteSubscription(httpPostProxy, body, headers, params, keys);

    // *****SignalR*****
    // this.vmsChangeNotifications = undefined;
    // this.vmsChangeSubscription = undefined;

    this.vmsChangeNotifications.set(this.clientId, undefined);
    this.vmsChangeSubscription.set(this.clientId, undefined);
    this.logHelper(log1, '---unsubscribe()--- %s %s %s', this.clientId, this.vmsChangeNotifications, this.vmsChangeSubscription);
    this._subscribeRequestsInvoked.delete(this.requestId.get(this.clientId));
    this.logHelper(log1, '+++this._subscribeRequestsPending+++ %s', this._subscribeRequestsPending);
    this.logHelper(log1, '+++this._subscribeRequestsInvoked+++ %s', this._subscribeRequestsInvoked);
    // *****SignalR*****

    return httpPostProxy.asObservable();
  }

  /**
   * vmsDataChangeNotification
   *
   * @returns {}
   * @memberof VMSDataSubscriptionProxyService
   */
  public vmsDataChangeNotification(): Observable<VMSDataChange[]> {
    this.logHelper(log, 'vmsDataChangeNotification() %s', this._valueEvents);
    return this._valueEvents;
  }

  /**
   * notifyConnectionState
   *
   * @returns {}
   * @memberof VMSDataSubscriptionProxyService
   */
  public notifyConnectionState(): Observable<ConnectionState> {
    this.logHelper(log, 'notifyConnectionState()');
    return this._notifyConnectionState.asObservable();
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * createEventProxies
   *
   * @private
   * @memberof VMSDataSubscriptionProxyService
   */
  private createEventProxies(): void {
    try {
      this.hubProxyShared = this._signalRService.getNorisHub();

      this.hubProxyEventVMSDataChange = new HubProxyEvent<VMSDataChange[]>(
        this.traceService, this.hubProxyShared, 'notifyVideosValue', this.ngZone, this._signalRService);
      this.hubProxyEventVMSDataChange.eventChanged.subscribe(values => this.onNotifyVideosValue(values));

      this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiVal>(
        this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this._signalRService, 'notifyVideosValue');
      this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));

      this.logHelper(log, '=======(createEventProxies() OK)');
    } catch (error) {
      this.traceService.error(TraceModules.videoVmsDataSubscription, '=======(createEventProxies() error) %s', error);
    }
  }

  /**
   * extractData
   *
   * @private
   * @param {} response
   * @returns {}
   * @memberof VMSDataSubscriptionProxyService
   */
  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    this.logHelper(log, '=======(extractData() OK)');
    return true;
  }

  /**
   * onSubscribeValues
   *
   * @private
   * @param {} success
   * @param {} requestedIds
   * @param {} httpPostProxy
   * @memberof VMSDataSubscriptionProxyService
   */
  private onSubscribeValues(success: boolean, requestedIds: string[], httpPostProxy: Subject<SubscriptionGmsVMSData[]>): void {
    this.traceService.info(TraceModules.videoHubProxyEvent, 'VMSDataSubscriptionProxyService.onSubscribeValues() done: success=%s', success);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  /**
   * onSubscribeValuesError
   *
   * @private
   * @param {} error
   * @param {} ctx
   * @param {} httpPostProxy
   * @memberof VMSDataSubscriptionProxyService
   */
  private onSubscribeValuesError(error: any, ctx: SubscribeContextChannelized<SubscriptionGmsVMSData>,
    httpPostProxy: Subject<SubscriptionGmsVMSData[]>): void {
    this.traceService.warn(TraceModules.videoHubProxyEvent,
      'VMSDataSubscriptionProxyService.onSubscribeValuesError(); http post returned not okay; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  /**
   * onUnsubscribeValues
   *
   * @private
   * @param {} values
   * @param {} requestedKeys
   * @param {} httpPostProxy
   * @memberof VMSDataSubscriptionProxyService
   */
  private onUnsubscribeValues(values: SubscriptionDeleteWsi[], requestedKeys: number[], httpPostProxy: Subject<SubscriptionDeleteWsi[]>): void {
    this.traceService.info(TraceModules.videoHubProxyEvent, 'VMSDataSubscriptionProxyService.onUnsubscribeValues() done!');

    httpPostProxy.next(values);
    httpPostProxy.complete();
  }

  /**
   * onUnsubscribeValuesError
   *
   * @private
   * @param {} error
   * @param {} httpPostProxy
   * @memberof VMSDataSubscriptionProxyService
   */
  private onUnsubscribeValuesError(error: any, httpPostProxy: Subject<SubscriptionDeleteWsi[]>): void {
    this.traceService.warn(TraceModules.videoHubProxyEvent,
      'VMSDataSubscriptionProxyService.onUnsubscribeValuesError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  /**
   * onSignalRDisconnectedError
   *
   * @private
   * @param {} error
   * @memberof VMSDataSubscriptionProxyService
   */
  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.videoHubProxyEvent, 'VMSDataSubscriptionProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  /**
   * onSignalRDisconnected
   *
   * @private
   * @param {} value
   * @memberof VMSDataSubscriptionProxyService
   */
  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared.hubConnection.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.videoHubProxyEvent,
          'VMSDataSubscriptionProxyService.onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared.hubConnection.startHubConnection();
      }
    }
  }

  /**
   * onSignalRConnectionState
   *
   * @private
   * @param {} value
   * @memberof VMSDataSubscriptionProxyService
   */
  private onSignalRConnectionState(value: SignalR.ConnectionState): void {
    if (value === SignalR.ConnectionState.Disconnected) {
      this._subscribeRequestsInvoked.forEach(ctx => {
        ctx.postSubject.error('Notification channel disconnected.');
      });
      this._subscribeRequestsInvoked.clear();
    }
    this._notifyConnectionState.next(SubscriptionUtility.convert(value));
  }

  /**
   * onNotifyVideosValue
   *
   * @private
   * @param {} val
   * @returns {}
   * @memberof VMSDataSubscriptionProxyService
   */
  private onNotifyVideosValue(val: any): void {
    const values: VMSDataChange[] = [val];
    this.logHelper(log1, '===(onNotifyVideosValue) %s', values);
    if (values === undefined) {
      return;
    }

    if (this.traceService.isDebugEnabled(TraceModules.videoHubProxyEvent)) {
      let valStr = 'VMSDataSubscriptionProxyService:onNotifyVideosValue() called:';
      values.forEach(value => {
        valStr = `${valStr}\n` +
                    `SubscriptionKey= ${value.SubscriptionKey}, Value= ${value.objectChangedName}`;
      });
      this.traceService.debug(TraceModules.videoHubProxyEvent, valStr);
    }
    if (log) {
      let valStr = 'VMSDataSubscriptionProxyService:onNotifyVideosValue() called:';
      values.forEach(value => {
        valStr = `${valStr}\n` +
                    `SubscriptionKey= ${value.SubscriptionKey}, Value= ${value.objectChangedName}`;
      });
      this.traceService.debug(TraceModules.videoVmsDataSubscription, valStr);
    }

    this.logHelper(log, '---(_valueEvents)--- %s %s', values, this._valueEvents);
    this._valueEvents.next(values);

    // *****SignalR*****
    this.logHelper(log1, '*****SignalR*****(1a) %s %s', this.vmsChangeNotifications, this.subscribedObjectId);
    const keys = Array.from(this.vmsChangeNotifications.keys());
    const vals = Array.from(this.vmsChangeNotifications.values());
    this.logHelper(log1, '*****SignalR*****(1b) %s %s', keys, vals);
    keys.forEach(key => {
      const vmsChangeNotification = this.vmsChangeNotifications.get(key);
      this.logHelper(log1, '*****SignalR*****(1c) %s %s', key, vmsChangeNotification);
      if (vmsChangeNotification != null) {
        this.traceService.debug(TraceModules.videoVmsDataSubscription, '*****SignalR*****(1d) %s', values);
        vmsChangeNotification.next(values);
      }
    });
    // *****SignalR*****
  }

  /**
   * onNotifySubscriptions
   *
   * @private
   * @param {} subscription
   * @memberof VMSDataSubscriptionProxyService
   */
  private onNotifySubscriptions(subscription: SubscriptionWsiVal): void {
    const gmsSubscription: SubscriptionGmsVMSData = new SubscriptionGmsVMSData(subscription);
    const foundCtx: SubscribeContextChannelized<SubscriptionGmsVMSData> = this._subscribeRequestsInvoked.get(subscription.RequestId);
    this.logHelper(log, 'onNotifySubscriptions() %s %s %s', subscription.RequestId, this._subscribeRequestsInvoked, foundCtx);

    if (foundCtx !== undefined) {
      if (this.traceService.isInfoEnabled) {
        this.traceService.info(TraceModules.videoHubProxyEvent,
          `VMSDataSubscriptionProxyService.onNotifySubscriptions():
               context (requestId): %s; objectOrPropertyId: %s; wsiKey: %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.OriginalObjectOrPropertyId, subscription.Key, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared.hubConnection.connectionStateValueText);
      }

      foundCtx.setReply(subscription.OriginalObjectOrPropertyId, gmsSubscription);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next([gmsSubscription]);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled) {
          this.traceService.debug(TraceModules.videoHubProxyEvent,
            'VMSDataSubscriptionProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s; wsiKey: %s',
        subscription.RequestId, subscription.RequestFor, subscription.Key);
    }

    if (this.traceService.isDebugEnabled) {
      this.traceService.debug(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * logHelper
   *
   * @private
   * @param {} flag
   * @param {} [message]
   * @param {} optionalParams
   * @memberof VMSDataSubscriptionProxyService
   */
  private logHelper(flag: boolean, message?: any, ...optionalParams: any[]): void {
    if (flag) {
      this.traceService.debug(TraceModules.videoVmsDataSubscription, message, optionalParams);
    }
  }
  /**
   * deleteSubscription
   *
   * @private
   * @param {} httpPostProxy
   * @param {} body
   * @param {} headers
   * @param {} params
   * @param {} keys
   * @memberof VMSDataSubscriptionProxyService
   */
  private deleteSubscription(httpPostProxy: Subject<SubscriptionDeleteWsi[]>, body: any, headers: HttpHeaders, params: HttpParams, keys: number[]): void {
    if (this.hubProxyShared.hubConnection.isConnected === false) {
      this.traceService.debug(TraceModules.videoHubProxyEvent,
        `VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges(): signalr connection not established;
                 need to wait (postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.videoHubProxyEvent,
            'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.videoHubProxyEvent,
              'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(TraceModules.videoHubProxyEvent,
            'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges(); http delete can be issued (after connecting)...');
          this.traceService.debug(TraceModules.videoVmsDataSubscription, '+++RequestId+++ %s', this.requestId.get(this.clientId));
          const vsu = videoSubscriptionUrl;
          const url = `${this.services.wsiEndpoint.entryPoint}${vsu}${this.hubProxyShared.connectionId}/${this.requestId.get(this.clientId)}`;

          this.executeDelete(url, body, headers, params, keys, httpPostProxy,
            ['VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges() (1)',
              'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges() (2)']);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges(); http delete can be issued immediately');
      this.traceService.debug(TraceModules.videoVmsDataSubscription, '+++RequestId+++ %s %s',
        this.requestId.get(this.clientId), this._subscribeRequestsInvoked);
      const url = `${this.services.wsiEndpoint.entryPoint}${videoSubscriptionUrl}${this.hubProxyShared.connectionId}/${this.requestId.get(this.clientId)}`;

      this.executeDelete(url, body, headers, params, keys, httpPostProxy,
        ['VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges() (3)',
          'VMSDataSubscriptionProxyService.unsubscribeVMSDataChanges() (4)']);
    }
  }

  /**
   * executeDelete
   *
   * @private
   * @param {} url
   * @param {} body
   * @param {} headers
   * @param {} params
   * @param {} keys
   * @param {} httpPostProxy
   * @param {} msg
   * @memberof VMSDataSubscriptionProxyService
   */
  private executeDelete(url: string, body: any, headers: HttpHeaders, params: HttpParams, keys: number[],
    httpPostProxy: Subject<SubscriptionDeleteWsi[]>, msg: string[]): void {

    const httpDelete: Observable<SubscriptionDeleteWsi[]> =
      this.httpClient.request('DELETE', url, { body, headers, params, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.services.wsiUtilityService.extractData(response, TraceModules.videoHubProxyEvent, msg[0])),
        catchError((response: HttpResponse<any>) =>
          this.services.wsiUtilityService.handleError(response, TraceModules.videoHubProxyEvent, msg[1], this.services.errorService)));

    httpDelete.subscribe(value => this.onUnsubscribeValues(value, keys, httpPostProxy),
      error => this.onUnsubscribeValuesError(error, httpPostProxy));
  }
  /**
   * executePost
   *
   * @private
   * @param {} monitorGroupId
   * @param {} body
   * @param {} headers
   * @param {} httpPostProxy
   * @param {} ctx
   * @param {} msg
   * @memberof VMSDataSubscriptionProxyService
   */
  private executePost(monitorGroupId: string, body: any, headers: HttpHeaders,
    httpPostProxy: Subject<SubscriptionGmsVMSData[]>,
    ctx: SubscribeContextChannelized<SubscriptionGmsVMSData>,
    msg: string): void {

    this.traceService.debug(TraceModules.videoVmsDataSubscription, '+++ctx.id+++ %s', ctx.id);

    const url = `${this.services.wsiEndpoint.entryPoint}${videoSubscriptionUrl}${ctx.id}/${this.hubProxyShared.connectionId}/${monitorGroupId}`;
    const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
      map((response: HttpResponse<any>) => this.extractData(response)),
      catchError((response: HttpResponse<any>) => this.services.wsiUtilityService.handleError(response, TraceModules.videoHubProxyEvent,
        'VMSDataSubscriptionProxyService.subscribeValues()', this.services.errorService)));

    this.traceService.debug(TraceModules.videoHubProxyEvent, msg);

    httpPost.subscribe(value => this.onSubscribeValues(value, [monitorGroupId], httpPostProxy),
      error => this.onSubscribeValuesError(error, ctx, httpPostProxy));
    this._subscribeRequestsInvoked.set(ctx.id, ctx);
  }

}
