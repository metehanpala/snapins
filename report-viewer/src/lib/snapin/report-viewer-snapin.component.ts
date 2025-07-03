/* eslint-disable */
import { AfterContentChecked, Component, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { DeviceType, IHfwMessage, MobileNavigationService, ParamsSendMessage, SnapInBase } from '@gms-flex/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import {
  BrowserObject, GmsMessageData,
  GmsSelectionType,
  ReportHistoryData, ReportDocumentData
} from '@gms-flex/services';
import { SearchedItem } from '@gms-flex/controls';
import { ReportViewerService } from '../services';
import { SearchViewComponent } from '../search';
import { ReportViewerStorageService, SelectedRuleDetails, StateData,MultipleHistoryRowSelectionMapData } from '@gms-flex/report-viewer-root-services';

@Component({
    selector: 'gms-report-viewer-snapin',
    templateUrl: './report-viewer-snapin.component.html',
    styleUrls: ['../gms-report-viewer-snapin.scss'],
    standalone: false
})

export class ReportViewerSnapInComponent extends SnapInBase implements OnInit, AfterContentChecked {

  private readonly traceModule = 'gmsSnapins_ReportViewerSnapInComponent';
  public documentData: ReportDocumentData[] = null;
  public reportHistoryData: ReportHistoryData[];

  public storeObject: StateData;

  public tileView = false;
  public visibleView: 'docuview' | 'tileview' | 'emptyReportView' = 'docuview';
  public emptyReportView = false;
  public tilesData: SearchedItem[];
  public selectedObject: BrowserObject;
  public msgData: any;
  public selectedObjectsData: BrowserObject[] = [];
  public isFromRightPane: boolean;
  public searchPlaceHolder: string;
  public storedData:SelectedRuleDetails;
  public isMobileDevice = false;

  @ViewChild('searchComponent') private readonly searchComponent: SearchViewComponent;
  @ViewChild('docuview', { static: true }) public docuview: TemplateRef<any>;

  public systemId: number;
  public storageService: ReportViewerStorageService;
  private _messageSubscription: Subscription;
  private readonly _subscriptions: Subscription[] = [];
  private readonly _trModule = 'gmsSnapins_ReportViewer';
  private userCulture: string = null;
  public multiselectionData: MultipleHistoryRowSelectionMapData[];

  public constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly traceService: TraceService,
    private readonly renderer: Renderer2,
    private readonly reportService: ReportViewerService,
    private readonly translateService: TranslateService,
    private readonly mobileNavigationService: MobileNavigationService,
    private readonly appContextService: AppContextService) {
    super(messageBroker, activatedRoute);
    this.assignEmptyValues();
  }

  public ngOnInit(): void {
    this.traceService.debug(this._trModule, 'Component initialized.');
    const deviceInfo = this.mobileNavigationService.getDeviceInfo()
    this.isMobileDevice = deviceInfo === DeviceType.Android || deviceInfo === DeviceType.Iphone;
    this.storageService = <ReportViewerStorageService>((<any>this.messageBroker.getStorageService(this.fullId)));

    this._subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      this.userCulture = userCulture;
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info('use  user Culture');
          this._subscriptions.push(this.translateService.get('REPORT-VIEWER.SEARCH-PLACEHOLDER').subscribe(value => {
            this.searchPlaceHolder = value;
          }));
        },
        (err: any) => {
          this._subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
            if (defaultCulture != null) {
              this.translateService.setDefaultLang(defaultCulture);
            } else {
              this.traceService.warn('No default Culture for appContextService');
              this.translateService.setDefaultLang(this.translateService.getBrowserLang());
            }
            this._subscriptions.push(this.translateService.get('REPORT-VIEWER.SEARCH-PLACEHOLDER').subscribe(value => {
              this.searchPlaceHolder = value;
            }));
          }));
        });
      } else {
        this.traceService.warn('No user Culture for appContextService');
      }
    }));

    this._messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(
      (m => {
        this.msgData = m;
        this.systemId = this.msgData.data.slice(0, 1)[0].SystemId;
        if (m != null) {
          if (m.data != null) {
            if (m != null && ((m.data[0].Attributes.ManagedType === 50) || (m.data[0].Attributes.ManagedType === 51))) {
              this.createTiles(m);
            } else {
             this.storageService.compareStateDesignation(this.msgData.data[0].Designation, this.fullId);
              this.storeObject = this.storageService.getState(this.fullId);
              this.visibleView = 'docuview';
              if (this.msgData.data?.length > 0 && this.msgData.customData?.length > 0) {
                this.selectedObjectsData = [];
                this.selectedObjectsData.push(this.msgData.data[0]);
                this.msgData.customData.forEach((dataItem) => { this.selectedObjectsData.push(dataItem); });
                // Implemented a flag to indicate when a report is accessed via the right pane.
                this.isFromRightPane = true;
              } else {
                if (this.msgData.customData?.length > 0) {
                  this.selectedObjectsData = this.msgData.customData;
                  // Implemented a flag to indicate when a report is accessed via the right pane.
                  this.isFromRightPane = true;
                }
                else {
                  this.selectedObjectsData = [];
                  this.selectedObjectsData.push(this.msgData.data[0]);
                  // isFromRightPane is set to "false" as the report is accessed via the system browser.
                  this.isFromRightPane = false;
                }
              }
            }
          }
        }
      })
    );

    // Subscribing to the tile selection in overview page
    this._subscriptions.push(this.reportService.reportTileSelectionSub.subscribe(tile => {
      this.reportService.getTargetNavigationBrowserObj(tile).toPromise().then(navigationPage => {
        const navigationBrowserObject: BrowserObject[] = navigationPage.Nodes;
        const messageBody: GmsMessageData = new GmsMessageData(navigationBrowserObject, GmsSelectionType.Cns);
        const types: string[] = navigationBrowserObject.map((browserObject: BrowserObject) => browserObject.Attributes.ManagedTypeName);

        this.traceService.info(this._trModule, 'TrendSnapinComponent.ngOnInit():Selected browser object: ', navigationBrowserObject);
        const messageToSend: ParamsSendMessage = {
          messageBody: messageBody,
          preselection: true,
          qParam: null,
          broadcast: false,
          applyRuleId: 'new-primary-selection'
        }

        this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
          this.traceService.debug(this._trModule, 'sendMessage() completed. result: %s', res);
        });
      });
    }));
    
    this.traceService.debug(this._trModule, 'Component initialized.');
  }

   public ngAfterContentChecked(): void {
    if(this.isMobileDevice){
      const gmsSnapinRef = this.docuview?.elementRef?.nativeElement?.parentElement;
      if(gmsSnapinRef){
        this.renderer.setStyle(gmsSnapinRef, 'overflow', 'hidden');
      }
    }
  }

  public ngOnDestroy(): void {
    this._subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });

    if (this._messageSubscription != undefined) {
      this._messageSubscription.unsubscribe();
    }
    this.handleStoreObjectData(this.storeObject);
    this.traceService.debug(this._trModule, 'Component destroyed.');
  }

  public onBeforeAttach(): void {
    super.onBeforeAttach();
    if (this.searchComponent) {
      this.searchComponent.onBeforeAttach();
    }
    if (!this.storeObject.storedselectedRule) {
      const storageData: any = this.storageService.getState(this.fullId);
      this.storeObject = { ...storageData };
    }
  }

   public searchChange(searchString: any): void {
    if (searchString !== null) {
      const storageData: any = this.storageService.getState(this.fullId);
      storageData.searchString = searchString;
      this.storeObject = storageData;
      this.storageService.setState(this.fullId, storageData);
  }
}

  public getReports(documentsData: ReportDocumentData[]) {
    this.documentData = documentsData;
    this.tileView = false;
  }

  public handleStoreObjectData(state: StateData): void {
    //To get the current value of the showReportHistory documentData value as the previous one was getting loaded in the event .
    if (state.storedselectedRule) {
      if (state.lastShownDocumentData && (state.lastShownDocumentData) != (state.showReportHistory?.documentData)) {
        state.setActiveReport = undefined;
        if (state.showReportHistory) {
          state.showReportHistory.documentData = state.lastShownDocumentData;
        }
      }
    }
    if (state?.multipleHistoryRowSelectionMap?.size > 0) {
      state.setActiveReport = undefined;
      state.showReportHistory = undefined;
    }

    // as child state is old with few values we need to use parent state and get latest values from child so that all the properties correctly gets stored in storage
    this.storeObject.lastShownDocumentData = state.lastShownDocumentData;
    this.storeObject.path = state.path;
    this.storeObject.index = state.index;
    this.storeObject.zoomSetting = state.zoomSetting;
    this.storeObject.zoomFactor = state.zoomFactor;
    this.storeObject.page = state.page;
    if (state.scrollTop) {
      this.storeObject.scrollTop = state.scrollTop;
    }
    if (state.scrollLeft) {
      this.storeObject.scrollLeft = state.scrollLeft;
    }
   
    if (!this.tileView) {
      if (this.storeObject === undefined) {
        this.storageService.setState(this.fullId, this.storeObject)
      } else {
        state.storedselectedRule = this.storeObject.storedselectedRule;
        this.storageService.setState(this.fullId, this.storeObject);
      }
    }
  }

  public savedSelectedRule(storedData: SelectedRuleDetails): void {
    this.storeObject = this.storageService.getState(this.fullId);
    //With the Rule change the setActive and DocumentData should be saved with the current value .
    if (this.storeObject?.setActiveReport && storedData?.ruleObjectId) {
      if (this.storeObject.storedselectedRule.ruleObjectId !== storedData.ruleObjectId) {
        this.storeObject.setActiveReport = undefined;
      }
    }
    this.storeObject.storedselectedRule = storedData;
    if (this.storeObject?.lastShownDocumentData) {
      if (this.storeObject.showReportHistory) {
        this.storeObject.showReportHistory.documentData = this.storeObject.lastShownDocumentData;
      }
    }
    this.storeObject.designation = storedData.selectionContext;
    this.storageService?.setState(this.fullId, this.storeObject);
  }

  

  //Below method is added to add the selected items to the list in case of multiselection and save in the state .
  public selectiondocumentMapEmitter(MultipleHistoryRowSelectionMap: Map<string, MultipleHistoryRowSelectionMapData>): void {
    const state = this.storageService.getState(this.fullId);
    if (state.multipleHistoryRowSelectionMap.size > 0) {
      if (state.setActiveReport || state.showReportHistory) {
        state.setActiveReport = undefined;
        state.showReportHistory = undefined;
        state.lastShownDocumentData = undefined;
        state.path = undefined
      }
    }
    this.storeObject = state;
    this.storageService.setState(this.fullId, state);
  }

  public expandRowEvent(event: number[]): void {
    const state = this.storageService.getState(this.fullId);
    state.expandedRow = event;
    this.storeObject = state;
    this.storageService.setState(this.fullId, state);
  }

  public handleSetActiveEvent(event: any): void {
    const state = this.storageService.getState(this.fullId);
    state.setActiveReport = event;
    this.storeObject = state;
    this.storageService.setState(this.fullId, state);
  }
 
  public handleShowReportEvent(event: any): void {
    const state = this.storageService.getState(this.fullId);
    state.showReportHistory = event;
    this.storeObject = state;
    this.storageService.setState(this.fullId, state);
    }
 
  public scrollHandlerEvent(event: number): void {
    const state = this.storageService.getState(this.fullId);
    state.scrollPosition = event;
    this.storeObject = state;
    this.storageService.setState(this.fullId, state);
    }

  private createTiles(message: any): void {
    this.traceService.debug(this._trModule, 'Creating tiles...');
    this.selectedObject = message.data[0];
    this.visibleView = 'tileview';
    this.tileView = true;
    this.storageService.compareStateDesignation(this.selectedObject.Designation, this.fullId);
  }

  
  
  private assignEmptyValues(): void {
    this.storeObject = {
      lastShownDocumentData: null,
      path: '',
      index: -1,
      scrollTop: 0,
      scrollLeft: 0,
      skip: 0,
      tilesScrollTop: 0,
      zoomFactor: 1,
      zoomSetting: 'page-width',
      page: 1,
      searchString: '',
      designation: '',
      storedselectedRule: null,
      showReportHistory: null,
      setActiveReport: null,
      scrollPosition: 0,
      relatedItems: [],
      multipleHistoryRowSelectionMap: null,
      expandedRow: []
    };

  }
}
