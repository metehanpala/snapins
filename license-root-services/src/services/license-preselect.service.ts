import { Injectable, Injector } from "@angular/core";
import { FullSnapInId, IHfwMessage, IPreselectionService } from "@gms-flex/core";
import { ApplicationRight, AppRightsService, BrowserObject, GmsManagedTypes, GmsMessageData, Operation } from '@gms-flex/services';
import { HfwUtility, TraceService } from "@gms-flex/services-common";
import { asapScheduler, Observable, of as observableOf, scheduled } from "rxjs";

export const traceModule = 'gmsSnapins_LicenseServices';
const licenseSnapinId = 70;
const showAppRights = 2240;

@Injectable({ providedIn: 'root' })
export class LicenseRootServicesComponent implements IPreselectionService {
  
  public typeId = 'LicenseSnapinType';
  public selectedObject: string;
  private appRightsLicense: ApplicationRight;

  constructor(
    private readonly traceService: TraceService,
    private readonly injector: Injector,
    private readonly appRightsService: AppRightsService
  ) {
    this.traceService.info(traceModule);
  }
  public receivePreSelection(messageTypes: string[], messageBody: any, fullId: FullSnapInId): Observable<boolean> {
    this.traceService.info(traceModule, 'receivePreSelection() called from HFW:\nmessageType=%s; messageBody=%s; fullId=%s',
      messageTypes.join('-'), HfwUtility.serializeObject(messageBody), fullId.fullId());
    const messageBroker: IHfwMessage = this.injector.get(IHfwMessage);

    const messageData: BrowserObject[] = (messageBody as GmsMessageData).data;
    const managedType: any = this.getManagedTypeName(messageData);

    if (managedType === GmsManagedTypes.LICENSE.name) {
      return this.getAppRights();
    } else {
      return scheduled([false], asapScheduler);
    }
  }

  private getAppRights(): Observable<boolean> {
    this.appRightsLicense = this.appRightsService.getAppRights(licenseSnapinId);
    if (this.appRightsLicense != null) {
      const showRightLicense: Operation[] = this.appRightsLicense.Operations.filter(f => f.Id === showAppRights);
      return (showRightLicense.length > 0) ? observableOf(true) : observableOf(false);
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