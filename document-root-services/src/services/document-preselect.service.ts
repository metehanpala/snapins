import { Injectable, Injector } from '@angular/core';
import { FullSnapInId, IHfwMessage, IPreselectionService } from '@gms-flex/core';
import { ApplicationRight, AppRightsService, BrowserObject, GmsManagedTypes, GmsMessageData, Operation } from '@gms-flex/services';
import { HfwUtility, TraceService } from '@gms-flex/services-common';
import { asapScheduler, Observable, of as observableOf, scheduled } from 'rxjs';

import { DocumentStorageService } from './document-storage.service';

export const traceModule = 'gmsSnapins_DocumentServices';

const documentSnapinId = 12;
const showAppRights = 384;

@Injectable({ providedIn: 'root' })
export class DocumentPreselectService implements IPreselectionService {

  public typeId = 'DocumentViewerType';
  public selectedObject: string;
  private storageService: DocumentStorageService;
  private appRightsDocument: ApplicationRight;

  constructor(
    private readonly traceService: TraceService,
    private readonly injector: Injector,
    private readonly appRightsService: AppRightsService
  ) {
    this.traceService.info(traceModule, 'DocumentPreselectService created');
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
   * @memberOf TextPreselectService
   */
  public receivePreSelection(messageTypes: string[], messageBody: any, fullId: FullSnapInId): Observable<boolean> {
    this.traceService.info(traceModule, 'receivePreSelection() called from HFW:\nmessageType=%s; messageBody=%s; fullId=%s',
      messageTypes.join('-'), HfwUtility.serializeObject(messageBody), fullId.fullId());

    const messageBroker: IHfwMessage = this.injector.get(IHfwMessage);

    this.storageService = (messageBroker.getStorageService(fullId)) as any;

    const messageData: BrowserObject[] = (messageBody as GmsMessageData).data;
    const managedType: any = this.getManagedTypeName(messageData);

    if (managedType === GmsManagedTypes.EXTERNAL_DOCUMENT.name ||
        managedType === GmsManagedTypes.FILE_VIEWER.name ||
        managedType === GmsManagedTypes.OPSTEP_DOCUMENT_VIEWER.name) {
      return this.getAppRights();
    } else {
      return scheduled([false], asapScheduler);
    }
  }

  private getAppRights(): Observable<boolean> {
    this.appRightsDocument = this.appRightsService.getAppRights(documentSnapinId);
    if (this.appRightsDocument != null) {
      const showRightDocument: Operation[] = this.appRightsDocument.Operations.filter(f => f.Id === showAppRights);
      return (showRightDocument.length > 0) ? observableOf(true) : observableOf(false);
    } else {
      return observableOf(false);
    }
  }

  private getManagedTypeName(messageData: BrowserObject[]): any {
    if (messageData != null && messageData.length === 1) {
      return messageData[0].Attributes.ManagedTypeName;
    }
    return null;
  }
}
