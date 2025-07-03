import { BehaviorSubject, forkJoin, Observable, Observer, Subject, Subscription, throwError } from 'rxjs';
import { Injectable, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ApplicationRight, AppRightsService, BrowserObject, Designation, HistLogColumnDescription, LogViewDefinitionInfo, ObjectNode, 
  RowDetailsDescription, SystemBrowserServiceBase, ViewNode, ViewType } from '@gms-flex/services';
import { SearchCriteria, SiToastNotificationService } from '@simpl/element-ng';
import { TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { TraceModules } from '../shared/trace-modules';
import { LogViewDefinationModel, ModalDialogResult, ObjectManagerService, ObjectManagerServiceModalOptions } from '../../object-manager-service';
import { ObjectManagerSaveActionResult } from '../../object-manager';
import { UnsavedDataDialogResult, UnsaveDialogService } from '@gms-flex/controls';
import { ActivityOriginalEnumValues } from './history-log-view.model';
/**
 * Description:
 * ------------
 * ...
 */
@Injectable({
  providedIn: 'root'
})
export class HistoryLogService {
  public static savePopupTitle: string;
  public static snapinTitle: string;
  public logViewRowDetails = new BehaviorSubject<RowDetailsDescription | null>(null);
  public logViewerColumnDescriptionMap = new BehaviorSubject<HistLogColumnDescription[]>([]);
  public logViewDatahideShowVeryDetailPane = new BehaviorSubject<boolean>(true);
  public detailPaneIsLoaded: Subject<boolean> = new Subject();
  public logViewDefinationDetails = new Subject<LogViewDefinationModel>();
  public getLogViewObservable = this.logViewDefinationDetails.asObservable();
  public deleteLvdResponseSub: Subject<boolean> = new Subject<boolean>();
  public discardChangesSub: Subject<SearchCriteria> = new Subject<SearchCriteria>();
  public deleteLVDSub: Subject<boolean> = new Subject<boolean>();
  public filtersLoaded: Map<number, Map<string, any>> = new Map<number, Map<string, any>>();
  public deleteLvdSub: Subject<void> = new Subject<void>();
  public splitDetailControls = new BehaviorSubject<boolean>(false);
  public selectedObject: BrowserObject;
  public readonly translationKey: string = 'Log_Viewer.';
  public historylogsactivityEnums: Map<string, ActivityOriginalEnumValues> = new Map<string, ActivityOriginalEnumValues>();
  public updateLVDObj = new Subject<BrowserObject>();
  public lvdNameOnCreation: string;
  public orgNameWithSpecialChar: string;
  private readonly subHistoryLogs: Map<Subscription, Subscription> = new Map();
  private readonly LOG_VIEWER_FOLDER_ID: string = 'LogViewer';
  private readonly newFolderKey: string = 'Log_Viewer.NEW_FOLDER'; 
  private readonly subscriptions: Subscription[] = [];
  private appRightsTrend: ApplicationRight;
  private readonly logviewerConfigureOptId: number = 2625; // Configure Operation ID from WSI
  private readonly logviewerSnapinId: number = 82;
  // to tranfer row data from table to details component

  constructor(
    public siToastService: SiToastNotificationService,
    private readonly appRightsService: AppRightsService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly objectManagerService: ObjectManagerService,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService,
    private readonly unsavedDataDialog: UnsaveDialogService
  ) {
  }

  public GetConfigureRights(): boolean {
    this.appRightsTrend = this.appRightsService.getAppRights(this.logviewerSnapinId);
    return this.appRightsTrend.Operations.find(appRight => appRight.Id === this.logviewerConfigureOptId) ? true : false;
  }

  public selectDataPointsWithSave(systemId: number, userLang: string, browserObject: BrowserObject): void {
    try {
      const objectManagerConfig: ObjectManagerServiceModalOptions = {};
      if (browserObject) {
        objectManagerConfig.defaultSaveObjectName = browserObject?.Name;
        objectManagerConfig.defaultSaveObjectDesc = browserObject?.Descriptor;
      }
      objectManagerConfig.hideSearch = false;
      const searchSub: Observable<ObjectNode[]> = this.systemBrowserService.searchNodeMultiple(systemId, [this.LOG_VIEWER_FOLDER_ID]);
      this.translateService.setDefaultLang(userLang);
      this.translateService.currentLang = userLang;
      const translateSub: Observable<string> = this.translateService.get(this.newFolderKey);
      this.subscriptions.push(forkJoin([searchSub, translateSub]).subscribe(res => {
        objectManagerConfig.singleSelection = true;
        const objectNodes: ObjectNode[] = res[0];
        // to handle if there is no nodes due to application rights
        if (objectNodes[0]?.Nodes) {
          const applicationViewNode: BrowserObject = objectNodes[0].Nodes.find(node => node.ViewType === ViewType.Application)!;
          if (applicationViewNode) {
            objectManagerConfig.roots = [applicationViewNode.Designation];
            objectManagerConfig.selectableTypes = objectManagerConfig.creatableTypes =
            [applicationViewNode.Attributes.ObjectModelName, "GMS_LogViewFolder", "LogViewer"];
          }
        }
        this.traceService.debug(TraceModules.logViewer, 'HistoryLogService.selectDataPointsWithSave(): Open object manager');
        const subTranslationService: Subscription = this.translateService.get('Log_Viewer.SAVE_AS_LOG_VIEWER_BUTTON_TITLE').subscribe(title => {
          const saveSubs: Subscription = this.objectManagerService.save(HistoryLogService.savePopupTitle, this.savePopupCallback, objectManagerConfig)
            .subscribe(selectedPoints => {
              if (selectedPoints === undefined || selectedPoints.action === ModalDialogResult.Cancelled) {
                this.unsavedDataDialog.closeDialog();
              } 
              saveSubs.unsubscribe();
            },
            error => {
              this.traceService.info(TraceModules.logViewer, 'HistoryLogService.selectDataPointsWithSave() failed to open OM pop up', error);
              saveSubs.unsubscribe();
            });
        })
      }));
    } catch (error) {
      this.traceService.debug(TraceModules.logViewer, error);
    }
  }

  public setFilterLoaded(filtersLoaded, systemId): void {
    this.filtersLoaded.set(systemId, filtersLoaded);
  }

  public getFilterLoaded(systemId): Map<string, any> {
    if (this.filtersLoaded.get(systemId)) {
      return this.filtersLoaded.get(systemId);
    }
    return null;
  }

  public savePopupCallback = (name: string, description: string, parentDesignation: Designation): Observable<ObjectManagerSaveActionResult> => {
    try {
      this.logViewDefinationDetails.next({
        lvdName: name,
        lvdDescription: description,
        lvdDesignation: parentDesignation.designation.toString()
      });
      this.orgNameWithSpecialChar = description;
      this.lvdNameOnCreation = name;
      return new Observable(observer => {
        const browserObject: BrowserObject = {
          Attributes: undefined,
          Descriptor: description,
          Designation: parentDesignation.designation.toString(),
          HasChild: true,
          Name: this.lvdNameOnCreation,
          Location: parentDesignation.designation.toString(),
          ObjectId: parentDesignation.designationParts[0] + ':' + parentDesignation.designationParts[parentDesignation.designationParts.length - 1],
          SystemId: 1,
          ViewId: 0,
          ViewType: 1
        };
        const actionResult: ObjectManagerSaveActionResult = {
          newObject: browserObject
        };
        observer.next(actionResult);
        observer.complete();
      });
    } catch (error) {
      this.traceService.debug(TraceModules.logViewer, error);
    }
  }
  
  public setSelectedObject(selectedObject: BrowserObject): void {
    this.selectedObject = Object.assign({}, selectedObject);
  }

  public searchNewNode(objectId: string, systemId: number): Observable<ObjectNode[]> {
    return this.systemBrowserService.searchNodeMultiple(systemId, [objectId]);
  }
  
}
