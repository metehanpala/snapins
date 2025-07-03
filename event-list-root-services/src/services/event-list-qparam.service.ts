// import { Observable, Observer, of } from "rxjs";
// import { Injectable } from "@angular/core";

// import { FullSnapInId, IQParamService, MessageParameters } from "@gms-flex/core";
// import { TraceService } from "@gms-flex/services-common";
// import {
//   Event, GmsMessageData, LightEventService, Page, SearchOption, SystemBrowserServiceBase
// } from "@gms-flex/services";

// export const traceModule: string = "gmsSnapins_EventListServices";

// @Injectable()
// export class EventListQParamService implements IQParamService {

//   public typeId: string = "EventListType";

//   constructor(private traceService: TraceService,
//               private lightEventService: LightEventService,
//               private systemBrowserService: SystemBrowserServiceBase) {
//     this.traceService.debug(traceModule, "EventListQParamService created.");
//   }

//   public getMessageParameters(paramValue: string): Observable<MessageParameters> {
//     this.traceService.info(traceModule, "getMessageParameters() called from HFW:\paramValue=%s", paramValue);
//     const messageObs: Observable<MessageParameters> = new Observable((observer: Observer<MessageParameters>) => {
//       this.onSubscription(observer, paramValue);
//       return () => this.teardownLogic();
//     });
//     return messageObs;
//   }

//   public getFirstAutomaticSelection(): Observable<MessageParameters> { // eventlist does not have automatic seleciton.
//     return of(null);
//   }

//   private onSubscription(observer: Observer<MessageParameters>, paramValue: string): void {
//     this.lightEventService.getEvent(paramValue).subscribe((event: Event) => {
//       if (event != null) {
//         this.systemBrowserService.searchNodes(event.srcSystemId, event.srcPropertyId, undefined, SearchOption.objectId).subscribe(
//           (page: Page) => {
//             if (page && page.Nodes && page.Nodes.length > 0) {
//               const gmsMessageData: GmsMessageData = new GmsMessageData([page.Nodes[0]]);
//               gmsMessageData.customData = [event];
//               const messageParameters: MessageParameters =
//                      { messageBody: gmsMessageData, types: [page.Nodes[0].Attributes.ManagedTypeName], qParam: event.id };
//               this.pushToClientAndDispose(observer, messageParameters);
//             } else {
//               this.pushToClientAndDispose(observer, null);
//             }
//           }
//         );
//       } else {
//         this.onSubscription(observer, paramValue);
//       }
//     });
//   }

//   private pushToClientAndDispose(observer: Observer<MessageParameters>, result: MessageParameters): void {
//     observer.next(result);
//     observer.complete();
//   }

//   private teardownLogic(): void {
//     this.traceService.debug(traceModule, "teardownLogic() called for EventListModeService.getMessageParameters");
//     this.dispose();
//   }

//   private dispose(): void {
//     //
//   }
// }
