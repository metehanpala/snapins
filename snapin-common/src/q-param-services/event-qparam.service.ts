import { Observable, Observer, of } from 'rxjs';
import { Injectable } from '@angular/core';

import { IQParamService, MessageParameters } from '@gms-flex/core';
import { TraceService } from '@gms-flex/services-common';
import {
  Event, GmsMessageData, LightEventService, Page, SearchOption, SystemBrowserServiceBase
} from '@gms-flex/services';

export const traceModule = 'gmsSnapins_EventQParamService';

@Injectable({
  providedIn: 'root'
})
export class EventQParamService implements IQParamService {

  public typeId = 'EventQParamService';

  constructor(private readonly traceService: TraceService,
    private readonly lightEventService: LightEventService,
    private readonly systemBrowserService: SystemBrowserServiceBase) {
    this.traceService.debug(traceModule, 'EventListQParamService created.');
  }

  public getMessageParameters(param: string, paramValue: string): Observable<MessageParameters> {
    this.traceService.info(traceModule, 'getMessageParameters() called from HFW:\nparamValue=%s', paramValue);
    const messageObs: Observable<MessageParameters> = new Observable((observer: Observer<MessageParameters>) => {
      this.onSubscription(observer, param, paramValue);
      return (): void => this.teardownLogic();
    });
    return messageObs;
  }

  public getFirstAutomaticSelection(frameId: string): Observable<MessageParameters> { // eventlist does not have automatic seleciton.
    return of(null);
  }

  private onSubscription(observer: Observer<MessageParameters>, param: string, paramValue: string): void {
    this.lightEventService.getEvent(paramValue).subscribe((event: Event) => {
      if (event != null) {
        this.systemBrowserService.searchNodes(event.srcSystemId, event.srcPropertyId, undefined, SearchOption.objectId).subscribe(
          (page: Page) => {
            if (page?.Nodes?.length > 0) {
              const gmsMessageData: GmsMessageData = new GmsMessageData([page.Nodes[0]]);
              gmsMessageData.customData = [event];
              const messageParameters: MessageParameters = { messageBody: gmsMessageData,
                types: [page.Nodes[0].Attributes.ManagedTypeName],
                // value: event.id
                qParam: { name: param, value: paramValue } };
              this.pushToClientAndDispose(observer, messageParameters);
            } else {
              this.pushToClientAndDispose(observer, null);
            }
          }
        );
      } else {
        this.onSubscription(observer, param, paramValue);
      }
    });
  }

  private pushToClientAndDispose(observer: Observer<MessageParameters>, result: MessageParameters): void {
    observer.next(result);
    observer.complete();
  }

  private teardownLogic(): void {
    this.traceService.debug(traceModule, 'teardownLogic() called for EventListModeService.getMessageParameters');
    this.dispose();
  }

  private dispose(): void {
    //
  }
}
