import { Injectable, Injector } from '@angular/core';
import { FullSnapInId, IHfwMessage, IPreselectionService } from '@gms-flex/core';
import { ApplicationRight, AppRightsService, BrowserObject,
  GmsManagedTypes, GmsMessageData, LicenseOptionsService,
  RelatedItemsRepresentation, RelatedItemsServiceBase, RelatedObjects } from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { asapScheduler, forkJoin, map, Observable, of, scheduled } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { ReportViewerStorageService } from '../storage/report-viewer-storage.service';
export const traceModule = 'gmsSnapins_ReportViewerServices';
const reportViewerSnapinId = 42;
const reportViewerShowOptId = 1344;

@Injectable()
export class ReportViewerPreselectService implements IPreselectionService {

  // This Id must match the 'typeId' of the 'snapInTypes' array specified in the extension HLDL
  // and the 'path' property of the 'Route' object inserted into the 'appRoutes' array
  public typeId = 'ReportViewerSnapInType';
  public preselectionReply = true;
  public preselectionReplyTime = 100; // ms
  public selectedObject: string;
  private readonly currentContext: BrowserObject[];
  private appRightsReports: ApplicationRight;
  private storageService: ReportViewerStorageService;

  constructor(private readonly traceService: TraceService,
    private readonly appRightsService: AppRightsService,
    private readonly licenseOptionsServices: LicenseOptionsService,
    private readonly riService: RelatedItemsServiceBase,
    private readonly injector: Injector) {
    this.traceService.info(TraceModules.reportViewerRootServices, 'ReportViewerPreselectService created');
  }

  public receivePreSelection(messageTypes: string[], messageBody: GmsMessageData, fullId: FullSnapInId): Observable<boolean> {
    this.traceService.info(traceModule, 'receivePreSelection() called from HFW:\nmessageTypes=%s; messageBody=%s; fullId=%s',
      messageTypes.join('-'), JSON.stringify(messageBody), fullId.fullId());
    const messageBroker: IHfwMessage = this.injector.get(IHfwMessage);
    this.storageService = (messageBroker.getStorageService(fullId)) as ReportViewerStorageService;
    const gmsMessageBody: BrowserObject[] = (messageBody as GmsMessageData).data;
    const managedType: string = this.getManagedTypeName(gmsMessageBody);
    let permissionVisible: boolean;
    forkJoin({
      requestOne: this.getAppRights(),
      requestTwo: this.getLicenseOptionsRight()
    })
      .subscribe(({ requestOne, requestTwo }) => {
        permissionVisible = requestOne && requestTwo;
      });

    if (permissionVisible) {
      let designation = messageBody.data[0].Designation;
      designation = designation ?? '';
      this.storageService.setMessageData(fullId, messageBody, designation);
      if (managedType === GmsManagedTypes.REPORTS.name ||
        managedType === GmsManagedTypes.REPORT_FOLDER.name ||
        managedType === GmsManagedTypes.REPORT_DEFINITION.name) {
        this.storageService.setRelatedItemsFromStorage(fullId, [], designation);
        return of(true);
      } else {
        // This section is for Flex Adv Reporting where we do check if we have more than one rule assigned to this node, then show report snapin
        return this.riService.getRelatedItems([gmsMessageBody[0].ObjectId]).pipe(
          map((relatedObject: RelatedObjects) => {
            let webAppsAvaliable = false;
            const relatedItemGroupArr: RelatedItemsRepresentation[] = [];
            if (relatedObject) {
              for (const relatedItem of relatedObject.RelatedResults[0].RelatedItems) {
                if (relatedItem?.GroupDescriptor === 'Web Apps') {
                  webAppsAvaliable = true;
                  relatedItemGroupArr.push(relatedItem);
                }
              }
              //  Add list of rules in storage service
              this.storageService.setRelatedItemsFromStorage(fullId, relatedItemGroupArr, designation);
              return webAppsAvaliable;
            }
          }));
      }
    } else {
      return of(false);
    }
  }

  private getAppRights(): Observable<boolean> {
    this.appRightsReports = this.appRightsService.getAppRights(reportViewerSnapinId);
    // check if show rights are available
    return (this.appRightsReports?.Operations.find(appRight => appRight.Id === reportViewerShowOptId))
      ? of(true)
      : of(false);
  }
  private getManagedTypeName(browserObject: BrowserObject[]): string {
    if (browserObject != null && browserObject.length === 1) {
      return browserObject[0].Attributes.ManagedTypeName;
    }
    return null;
  }

  private getLicenseOptionsRight(): Observable<boolean> {
    const licensOptionsDocument = this.licenseOptionsServices.getLicenseOptionsRights('sbt_gms_opt_report');
    if (!isNullOrUndefined(licensOptionsDocument)) {
      if (licensOptionsDocument.Available === -1) {
        return of(true);
      } else {
        return of(licensOptionsDocument.Required <= (licensOptionsDocument.Available) ? true : false);
      }
    }
  }
}
