/** class imports */
import { ConnectionState, SubscriptionDeleteWsi } from '@gms-flex/services';
import { Observable } from 'rxjs';

import { SubscriptionGmsVMSData, VMSDataChange } from './vmssubscription.data.model';

/**
 * VMSDataSubscriptionProxyServiceBase
 *
 * @export
 * @abstract
 * @class VMSDataSubscriptionProxyServiceBase
 */
export abstract class VMSDataSubscriptionProxyServiceBase {

  /**
   * subscribeVMSDataChanges
   *
   * @abstract
   * @param {string} monitorGroupId
   * @returns {Observable<SubscriptionGmsVMSData[]>}
   * @memberof VMSDataSubscriptionProxyServiceBase
   */
  public abstract subscribeVMSDataChanges(monitorGroupId: string): Observable<SubscriptionGmsVMSData[]>;

  /**
   * unsubscribeVMSDataChanges
   *
   * @abstract
   * @param {number[]} keys
   * @returns {Observable<SubscriptionDeleteWsi[]>}
   * @memberof VMSDataSubscriptionProxyServiceBase
   */
  public abstract unsubscribeVMSDataChanges(keys: number[]): Observable<SubscriptionDeleteWsi[]>;

  /**
   * vmsDataChangeNotification
   *
   * @abstract
   * @returns {Observable<VMSDataChange[]>}
   * @memberof VMSDataSubscriptionProxyServiceBase
   */
  public abstract vmsDataChangeNotification(): Observable<VMSDataChange[]>;

  /**
   * notifyConnectionState
   *
   * @abstract
   * @returns {Observable<ConnectionState>}
   * @memberof VMSDataSubscriptionProxyServiceBase
   */
  public abstract notifyConnectionState(): Observable<ConnectionState>;
}
