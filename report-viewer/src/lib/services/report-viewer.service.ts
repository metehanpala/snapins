/* eslint-disable */
import { Injectable } from '@angular/core';
import {
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  ObjectAttributes,
  Page,
  ServiceRequestSubscriptionModel,
  SystemBrowserServiceBase,
  SystemsServicesServiceBase,
  ViewNode,
} from '@gms-flex/services';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { SiToastNotificationService } from '@simpl/element-ng';
import { ServiceRequestInfo } from '@gms-flex/services';

export declare class DocumentSearchRequest {
  public parameters: any;
  public searchWords: string;
}

export class DocumentInfo {
  public objectId: string;
  public propertyIndex: string;
  public propertyName: string;
  public collectorObjectOrPropertyId: string;
  public trendseriesId: string;
  public trendedPropertyIdentifier: string;
}

export class TileObject implements BrowserObject {
  public Attributes: ObjectAttributes;
  public Descriptor: string;
  public Designation: string;
  public HasChild: boolean;
  public Name: string;
  public Location: string;
  public ObjectId: string;
  public SystemId: number;
  public ViewId: number;
  public ViewType: number;
  constructor(public iconClass: string, public browserObject: BrowserObject) {
    this.Attributes = browserObject.Attributes;
    this.Descriptor = browserObject.Descriptor;
    this.Designation = browserObject.Designation;
    this.HasChild = browserObject.HasChild;
    this.Name = browserObject.Name;
    this.Location = browserObject.Location;
    this.ObjectId = browserObject.ObjectId;
    this.SystemId = browserObject.SystemId;
    this.ViewId = browserObject.ViewId;
    this.ViewType = browserObject.ViewType;

  }
}

@Injectable()
export class ReportViewerService {
  public selectedObject: BrowserObject;
  public objectTypeFilter = '{"2600":[2601]}';
  public reportTileSelectionSub: Subject<any> = new Subject<any>();
  public cnsValue: CnsLabel;

  private readonly _trModule = 'gmsSnapins_ReportViewerService';
  private systemServicesSub: Subscription;

  constructor(
    private readonly traceService: TraceService,
    public siToastService: SiToastNotificationService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private systemsServicesService: SystemsServicesServiceBase
  ) {

    if (this.cnsHelperService) {
      this.cnsHelperService.activeCnsLabel.subscribe(() => {
        if (!isNullOrUndefined(this.cnsHelperService.activeCnsLabelValue)) {
          this.cnsValue = this.cnsHelperService.activeCnsLabelValue;
        }
      });
    }
  }

  public onTileClick(tile: any): void {
    this.reportTileSelectionSub.next(tile);
    this.traceService.debug(this._trModule, 'Tile clicked: ' + tile.Name);
  }

  public setSelectedObject(selectedObject: BrowserObject): void {
    this.selectedObject = selectedObject;
  }

  public getTargetNavigationBrowserObj(tile: any): Observable<Page> {
    const page: Observable<Page> = this.systemBrowserService.searchNodes(tile.SystemId, tile.Designation, tile.ViewId);
    return page;
  }

  public initializeServicesSubscriptions(systemIds: number[]) {
    const reportManagerId = 58; // reportmanager id is default 58, if there is any change in value this need to be updated
    const serviceRequest: ServiceRequestSubscriptionModel[] = [];
    systemIds.forEach((systemId: number) => {
      serviceRequest.push({ SystemId: systemId, Ids: [reportManagerId] } as ServiceRequestSubscriptionModel)
    })
    this.systemServicesSub = this.systemsServicesService.subscribeSystemsServices(serviceRequest).subscribe(s => {
      if (s === true) {
        this.traceService.debug(this._trModule, 'Subscription to ReportManager status successful');
      } else {
        this.traceService.warn(this._trModule, 'Not able to subscribe ReportManager status');
      }
    }, e => this.traceService.error(this._trModule, 'Error while subscribing to ReportManager status', e));
  }

  public disposeServicesSubscriptions(): Observable<boolean> {
    if (!isNullOrUndefined(this.systemServicesSub)) {
      this.systemServicesSub.unsubscribe();
      return this.systemsServicesService.unSubscribeSystemsServices();
    }
    return of(false);
  }

  public serviceNotification() : Observable<ServiceRequestInfo> {
    return this.systemsServicesService.systemsNotification();
  }

  public getAllViews() : Observable<ViewNode[]> { // to extract all available systems in snapins
    return this.systemBrowserService.getViews(null);
  }
}
