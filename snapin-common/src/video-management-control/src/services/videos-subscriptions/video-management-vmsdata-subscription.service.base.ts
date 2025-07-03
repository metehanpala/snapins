/** class imports */
import { GmsSubscription } from '@gms-flex/services';

import { VMSDataChange } from './vmssubscription.data.model';

/**
 * Base class for a VMS data subscription service.
 * See the WSI documentation for details.
 *
 * @export
 * @abstract
 * @class VMSDataSubscriptionServiceBase
 */
export abstract class VMSDataSubscriptionServiceBase {

  /**
   * Registers a client.
   * See also WSI API specification.
   *
   * @abstract
   * @param {string} clientName
   * @returns {string}
   * @memberof VMSDataSubscriptionServiceBase
   */
  public abstract registerClient(clientName: string): string;

  /**
   * Unregisters a client.
   * See also WSI API specification.
   *
   * @abstract
   * @param {string} clientId
   * @memberof VMSDataSubscriptionServiceBase
   */
  public abstract disposeClient(clientId: string): void;

  /**
   * Subscribes for node changes notifications.
   * See also WSI API specification.
   *
   * @abstract
   * @param {string} monitorGroupId
   * @param {string} clientId
   * @returns {GmsSubscription<VMSDataChange>[]}
   * @memberof VMSDataSubscriptionServiceBase
   */
  public abstract subscribeVMSDataChange(monitorGroupId: string, clientId: string): GmsSubscription<VMSDataChange>[];

  /**
   * Unsubscribes from node changes notifications.
   * See also WSI API specification.
   *
   * @abstract
   * @param {GmsSubscription<VMSDataChange>[]} subscriptions
   * @param {string} clientId
   * @memberof VMSDataSubscriptionServiceBase
   */
  public abstract unsubscribeVMSDataChange(subscriptions: GmsSubscription<VMSDataChange>[], clientId: string): void;
}
