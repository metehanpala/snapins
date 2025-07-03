import { Injectable } from '@angular/core';
import { FullSnapInId, IPreselectionService } from '@gms-flex/core';
import { HfwUtility, TraceService } from '@gms-flex/services-common';
import { asapScheduler, Observable, scheduled } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';

@Injectable(
  { providedIn: 'root' }
)
export class OperatorTaskPreselectService implements IPreselectionService {

  // This Id must match the 'typeId' of the 'snapInTypes' array specified in the extension HLDL
  // and the 'path' property of the 'Route' object inserted into the 'appRoutes' array
  public typeId = 'OperatorTaskSnapinType';

  constructor(private readonly traceService: TraceService) {
    this.traceService.info(TraceModules.operatorTaskRootServices, 'OperatorTaskPreselectService created');
  }

  /*
   * This method is called by HFW in order to allow snapins evaluate if it can handle the corresponding message.
   * The snapin shall return an observable 'immediately'!
   * On the returned observable, the snapin shall push the evaluated result; true if it can handle the message, else false.
   * In order to support good user experience that timespan used for evaluation shall be < 100ms.
   * HLDL defines a timeout of 5000ms (configurable). After that time, the result of the callback is not considered anymore.
   * Important: The returned observable must support 'teardownLogic'!!
   * => Any client subscribing to the observable can call 'unsubscribe' on the correponding subscription. This causes the disposal of all underlying resources.
   *
   * @param {Array<string>} messageTypes, the messageTypes.
   * @param {*} messageBody, the messageBody.
   * @param {FullSnapInId} fullId, the snapinId for which the preselection is invoked.
   * @returns {Observable<boolean>}, true if the specified snapin can handle the message, else false.
   *
   * @memberOf OperatorTaskPreselectService
   */
  public receivePreSelection(messageTypes: string[], messageBody: any, fullId: FullSnapInId): Observable<boolean> {
    this.traceService.info(TraceModules.operatorTaskRootServices, 'receivePreSelection() called from HFW:\nmessageType=%s; messageBody=%s; fullId=%s',
      messageTypes.join('-'), HfwUtility.serializeObject(messageBody), fullId.fullId());

    return scheduled([true], asapScheduler);
  }
}
