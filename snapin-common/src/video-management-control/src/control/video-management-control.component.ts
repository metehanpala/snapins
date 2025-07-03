/** class imports */
import { Component, EventEmitter, Injectable, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TilesViewComponent } from '@gms-flex/controls';
import { FullPaneId, FullSnapInId, IHfwMessage } from '@gms-flex/core';
import {
  BrowserObject, CnsHelperService, CnsLabel, GmsSubscription,
  Page,
  RelatedItemsRepresentation,
  RelatedItemsServiceBase,
  RelatedObjects,
  SiIconMapperService, SystemBrowserServiceBase, SystemBrowserSubscription, ValueDetails
} from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ResizeObserverService, SelectOption, SiSearchBarComponent } from '@simpl/element-ng';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { VideoManagementService } from '../services/video-management.service';
import { VMSDataService } from '../services/videos';
import { VMSDataSubscriptionService } from '../services/videos-subscriptions';
import { VMSDataChange } from '../services/videos-subscriptions/vmssubscription.data.model';
import { MonitorColorsUtilities, MonitorStatus, SequenceStatus, SnapshotData, VMSMonitorData, VMSMonitorWallData } from '../services/videos/vms.data.model';
import { TraceModules } from '../shared/trace-modules';
import { SnapinUtilities } from './control-utilities';
import { TemplateStrings } from './data.model';
import { GmsGraphic } from './gms-graphic';
import { NodeType } from './nodes';
import { ObjectManager } from './object-manager';

/** local types */
type MonitorWallTile = {
  svgobjName: string;
  position: number;
  monitorGroupDescription: string;
  monitorName: string;
  monitorDescription: string;
  monitorTitle: string;
  monitorStatus: MonitorStatus;
  cameraName: string;
  cameraDescription: string;
  cameraTitle: string;
  hasS1Command: boolean; // Sequence 1
  hasSNCommand: boolean; // Sequence N
  hasPlayBack: boolean;
};

enum ResolveExecutionStatus {
  InProgress = -1,
  Failure = 0,
  Success = 1
}

interface ResolveExecutionResult {
  status: ResolveExecutionStatus,
  errorMessage?: string
}
  
/** local variables */
let clientsRunning = false;

/** class constants */
const log = false;
const contentVidView = 'content-vid-view';
const notReachable = '*NotReachable';

@Injectable({
  providedIn: 'root'
})
export class Services {
  public constructor(
    public readonly videoManagementService: VideoManagementService,
    public readonly vmsDataService: VMSDataService,
    public readonly vmsDataSubscriptionService: VMSDataSubscriptionService,
    public readonly objectManager: ObjectManager,
    public readonly cnsHelperService: CnsHelperService,
    public readonly iconMapperService: SiIconMapperService,
    public readonly relatedItemsService: RelatedItemsServiceBase,
    public readonly systemBrowserService: SystemBrowserServiceBase
  ) {
  }
}

/**
 * @Component
 *
 * @export
 * @class VideoManagementComponent
 * @extends {SnapInBase}
 * @implements {OnInit}
 * @implements {OnChanges}
 * @implements {OnDestroy}
 */
@Component({
  selector: 'gms-video-control',
  templateUrl: './video-management-control.component.html',
  styleUrl: './video-management-control.component.scss',
  standalone: false
})

/**
 * VideoManagementComponent
 *
 * @export
 * @class VideoManagementComponent
 * @extends {SnapInBase}
 * @implements {OnInit}
 * @implements {OnChanges}
 */
export class VideoManagementControlComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('delaytemplate') public delaytemplate: TemplateRef<any>;
  @ViewChild('totaltemplate') public totaltemplate: TemplateRef<any>;
  @ViewChild('tilesizetemplate') public tilesizetemplate: TemplateRef<any>;

  @Input() public selectedControlObject: any; // BrowserObject; // Observable<BrowserObject>
  @Input() public messageBroker: IHfwMessage;
  @Input() public snapInId: FullSnapInId;
  @Input() public location: FullPaneId;
  @Input() public showVideoControl = true;
  @Input() public objectManagerService: any;
  @Input() public validationDialogService: any;
  @Input() public isInAssistedMode = false;

  // input and ouputs for the OP step resolve execution
  @Input() public resolveObs: BehaviorSubject<boolean> = new BehaviorSubject(null);
  @Output() public readonly resolveExecutionResult: EventEmitter<ResolveExecutionResult> = new EventEmitter<ResolveExecutionResult>();

  /** public variables */
  public templateStrings: TemplateStrings = {};

  public view: NodeType[] = [];
  public readonly sizeModel = 'm'; // "l";
  public title = '';
  public cnsLabelObject: CnsLabel = new CnsLabel();

  public errorMessage = '';
  public showErrorMessage = false;
  public errorIcon = '';

  public showSnapshot = false;
  public snapshotData = new SnapshotData();

  public monitorWallTiles: { [key: string]: MonitorWallTile } = {};
  public entries: string[] = [];

  public selectedObjectName: string;
  public selectedObjectOM: string;
  public selectedObjectLocation: string;

  public titleForOpStep = '';
  public contentVidViewClient = contentVidView;

  // video object icons
  public cameraIcon = '';
  public sequenceIcon = '';
  public monitorIcon = '';
  public monitorGroupIcon = '';

  /**
   * vmsDescriptions: needed for some command parameters
   *
   * @public
   * @type {Map<string, string>}
   * @memberof VideoManagementComponent
   */
  public readonly vmsDescriptions: Map<string, string> = new Map<string, string>();

  /**
   * graphic
   *
   * @type {GmsGraphic}
   * @memberof VideoManagementComponent
   */
  public graphic: GmsGraphic = new GmsGraphic();

  /**
   * monitorWallData
   *
   * @public
   * @type {VMSMonitorWallData}
   * @memberof VideoManagementComponent
   */
  public monitorWallData: VMSMonitorWallData = undefined;

  // system browser selected object attributes
  public selectedObjectDescription: string;
  public selectedObjectSystemName: string;
  public selectedObjectDesignation: string;
  public selectedObjectChanged = false;

  public selectedCameraStatus: string;
  public selectedCameraDeleted: boolean;
  public clientIdValueSubscription2 = '';
  public cameraStatusNotificationSubscription: GmsSubscription<ValueDetails> = undefined;
  public scrollHasBeenRestored = false;
  public videoConnected = true;
  public videoAligned = true;
  public maxClientsNumber = false;
  public videoSourceErrorState = '';
  public clientRunning = false;

  // storage service
  public storageService: any; // VideoManagementStorageService;

  // general purpose snapin utilities
  public snapinUtilities: any;

  // data for si-select control
  public optionsList: SelectOption[] = [];
  public disabled = false;
  public readonly = false;
  public formControl: FormControl = new FormControl();
  public currentCameraIndex = 0;

  // data for hfw-panel-navigation
  public showButtons = false;

  // PUBLIC_DATA_END

  @ViewChild('documentTilesView') public tilesView: TilesViewComponent;
  @ViewChild('documentSiSearchBar') private readonly siSearchBar: SiSearchBarComponent;

  /** local variables */
  private monitorWallTitle: string = undefined;
  private monitorWallId: string = undefined;
  private oldMonitorWallId: string = undefined;

  private searchedString = '';
  private restoredScrollTop: number;

  private updateHTML = false;
  private isClientHidden = false;

  private readonly subscriptions: Subscription[] = [];

  // video system (SystemN)
  private videoSystem = '';

  /**
   * selectedControlObjectSubscription
   *
   * @private
   * @memberof VideoManagementControlComponent
   */
  private selectedControlObjectSubscription;

  /**
   * saveDataToStorageService
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private saveDataToStorageService = true;

  /**
   * system browser node changes data
   */
  private clientIdSystemBrowser = '';
  private nodeChangesSubscriptionSystemBrowser: GmsSubscription<SystemBrowserSubscription> = undefined;

  /**
   * value subscription data
   */
  private connectionStatusNotificationSubscription: GmsSubscription<ValueDetails> = undefined;
  private alignmentStatusNotificationSubscription: GmsSubscription<ValueDetails> = undefined;

  // data for UI refresh logic
  private intervalRefresh: NodeJS.Timeout = undefined;
  private selectedObjectMustBeConnected = false;
  private waitingForData = false;
  private counter = 0;

  // subscription related data
  private subscription: GmsSubscription<VMSDataChange>[] = undefined;
  private clientId: string = undefined;

  // data receive error flags
  private objectNotFound = false;
  private videoAPINotReachable = false;
  private videoManagerNotReachable = false;
  private vmsNotReachable = false;
  private vmsSynchronizing = false;
  private operatingMonitorGroupNotFound = false;

  // Video OP Step specific data
  private savedSelectedControlObject: any;
  private stepIndex = 0;
  private cameraList: { camera: BrowserObject; mode: number }[] = undefined;

  private numResolvedPromises = 0;
  private promises: Promise<Page | RelatedObjects>[];
  private modes: number[];

  /**
   * oldMonitorWallData
   *
   * @private
   * @type {VMSMonitorWallData}
   * @memberof VideoManagementComponent
   */
  private oldMonitorWallData: VMSMonitorWallData;

  /**
   * notifyVideosReceived
   *
   * @private
   * @type {boolean}
   * @memberof VideoManagementComponent
   */
  private notifyVideosReceived = false;

  /**
   * cnsDataCacheRefreshed
   *
   * @private
   * @type {boolean}
   * @memberof VideoManagementComponent
   */
  private cnsDataCacheRefreshed = false;

  // PRIVATE_DATA_END

  // ---------------------------------------------------------------------------------------------

  /**
   *Creates an instance of VideoManagementControlComponent.
   * @param {} appContextService
   * @param {} translateService
   * @param {} traceService
   * @param {} resizeObserver
   * @param {} services
   * @memberof VideoManagementControlComponent
   */
  constructor(
    private readonly appContextService: AppContextService,
    private readonly translateService: TranslateService,
    public readonly traceService: TraceService,
    public readonly resizeObserver: ResizeObserverService,
    private readonly services: Services) {

    traceService.debug('constructor');
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * selectionChanged
   *
   * @param {} $event
   * @memberof VideoManagementControlComponent
   */
  public selectionChanged($event): void {
    if (!isNullOrUndefined($event)) {
      this.currentCameraIndex = +$event;
    }
    this.setCurrentCamera(false);
  }

  /**
   * setCurrentCamera
   *
   * @param {} newForm
   * @memberof VideoManagementControlComponent
   */
  public setCurrentCamera(newForm: boolean): void {
    if (this.cameraList.length > 0) {
      const sco: BrowserObject = this.cameraList[this.currentCameraIndex].camera;
      this.contentVidViewClient = contentVidView + sco.Name + this.stepIndex.toString();
      this.selectedControlObject = sco;
      this.selectedControlObjectChanged(this.selectedControlObject);
      if (newForm) {
        this.formControl = new FormControl(this.currentCameraIndex.toString());
      }
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * incrementCamera
   *
   * @memberof VideoManagementControlComponent
   */
  public incrementCamera(): void {
    this.moveCamera(1);
  }

  /**
   * decrementCamera
   *
   * @memberof VideoManagementControlComponent
   */
  public decrementCamera(): void {
    this.moveCamera(-1);
  }

  /**
   * moveCamera
   *
   * @param {} delta
   * @memberof VideoManagementControlComponent
   */
  public moveCamera(delta: number): void {
    if (this.cameraList.length > 0) {
      this.currentCameraIndex = (this.currentCameraIndex + delta + this.cameraList.length) % this.cameraList.length;
      this.setCurrentCamera(true);
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * manageLocalization
   *
   * @private
   * @memberof VideoManagementComponent
   */
  public manageLocalization(): void {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture !== null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.translateService.setDefaultLang(this.translateService.getBrowserLang());
      }
    }));

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture !== null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.videoSnapIn, 'User Culture is OK');
        });
      } else {
        this.traceService.warn(TraceModules.videoSnapIn, 'User Culture is empty');
      }
    }));

    this.subscriptions.push(
      this.translateService.get([
        'MONITOR',
        'MONITOR_GROUP',
        'CAMERA',
        'CAMERA_STATUS',
        'CAMERA_TYPE',
        'OM_DIALOG_TITLE',
        'MAX_CLIENTS_NUMBER',
        'VIDEOSOURCE_NOT_REACHABLE',
        'VIDEOSOURCE_FAULT',
        'VIDEOSOURCE_DISABLED',
        'VIDEOSOURCE_UNKNOWN',
        'VIDEOSOURCE_NO_VMS_LICENSE',
        'VIDEO_OBJECT_DELETED',
        'VIDEO_API_NOT_REACHABLE',
        'VIDEO_MANAGER_NOT_REACHABLE',
        'VMS_NOT_REACHABLE',
        'VMS_SYNCHRONIZING',
        'VIDEO_DISCONNECTED',
        'VIDEO_DISCONNECTED_NOT_ALIGNED',
        'CONNECT_STREAM',
        'CONNECT_CAMERA',
        'CONNECT_CAMERA_GROUP',
        'CONNECT_SEQUENCE',
        'DISCONNECT_STREAM',
        'STOP_SEQUENCE',
        'SEARCH_FILTER_WATERMARK',
        'NOTHING_TO_SHOW',
        'SEQUENCE_FIRST_MONITOR',
        'SEQUENCE_SUBSEQUENT_MONITOR',
        'PLAYBACK',
        'CONNECTED',
        'DISABLED',
        'FAULTY',
        'COMMAND_ERROR',
        'COMMAND_EXECUTION_FAILED',
        'LIVE'
      ]).subscribe(values => this.snapinUtilities.onTranslateStrings(values))
    );
  }

  /**
   * onAfterDettach
   *
   * @memberof VideoManagementComponent
   */
  public onAfterDettach(): void {
    this.traceService.debug(TraceModules.videoSnapIn, '***** onAfterDettach() ***** %s %s', this.snapInId.snapInId, this.location);
    this.oldMonitorWallId = undefined;
  }

  /**
   * onBeforeAttach
   *
   * @memberof VideoManagementComponent
   */
  public onBeforeAttach(): void {
    this.traceService.debug(TraceModules.videoSnapIn, '***** onBeforeAttach() ***** %s %s', this.snapInId.snapInId, this.location);
    this.clientRunning = true;
    this.oldMonitorWallId = undefined;
    this.tilesView.onBeforeAttach();
  }

  /**
   * searchChange
   *
   * @param {} event
   * @memberof VideoManagementComponent
   */
  public searchChange(event: any): void {
    this.searchedString = event;
    if (this.searchedString !== null) {
      this.traceService.debug(TraceModules.videoSnapIn, '***** searchChange() ***** %s', this.searchedString);
      this.forceUIRefresh();
    }
  }

  /**
   * ngOnChanges
   *
   * @param {} changes
   * @memberof VideoManagementControlComponent
   */
  public ngOnChanges(changes: SimpleChanges): void {
    const si = this.getStepIndex();
    if (si >= 0) {
      this.stepIndex = si;
      this.savedSelectedControlObject = this.selectedControlObject;
    }
    this.traceService.debug(TraceModules.videoOpStep, '*** ngOnChanges() ' + this.getStepIndex() + ' ' + si + ' ' + this.selectedControlObject);
    if (!isNullOrUndefined(changes.selectedControlObject) && !isNullOrUndefined(changes.selectedControlObject.currentValue)) {
      this.traceService.debug(TraceModules.videoOpStep, '*** ngOnChanges ' + changes.selectedControlObject.firstChange);
      this.init(!changes.selectedControlObject.firstChange);
    }
  }

  /**
   * ngOnInit
   *
   * @memberof VideoManagementComponent
   */
  public ngOnInit(): void {
    const si = this.getStepIndex();
    if (si >= 0) {
      this.stepIndex = si;
    }
    this.traceService.debug(TraceModules.videoOpStep, '*** ngOnInit() ' + this.getStepIndex() + ' ' + this.stepIndex);

    if (this.isInAssistedMode) {
      // this is needed since the second call to ngOnChanges is not received at Flex Client startup
      setTimeout(() => {
        if (this.cameraList === undefined) {
          this.traceService.debug(TraceModules.videoOpStep, '*** ngOnInit getCameraList');
          this.getCameraList();
        }
      }, 100);
    }
    
    this.resolveObs.subscribe(res => {
      if (res === true) {
        // execute stuff on resolve button pressed
        // here you can also specify an error message to pass to the stepper on failure, it will show in a toast notification
        const resolveResult: ResolveExecutionResult = {
          status: isNullOrUndefined(this.errorMessage) || this.errorMessage === '' ||
                  this.errorMessage === this.templateStrings.nothingToShow
            ? ResolveExecutionStatus.Success
            : ResolveExecutionStatus.Failure,
          errorMessage: this.errorMessage
        }
        this.resolveExecutionResult.next(resolveResult);
      }
    })
  
    this.init(false);
  }

  /**
   * ngOnDestroy
   *
   * @memberof VideoManagementComponent
   */
  public ngOnDestroy(): void {
    this.traceService.debug(TraceModules.videoOpStep, '*** ngOnDestroy() ' + this.getStepIndex());
    if (this.isInAssistedMode) {
      this.cameraList = null;
    }
    this.cleanUp();
  }

  /**
   * forceUIRefresh
   *
   * @public
   * @memberof VideoManagementComponent
   */
  public forceUIRefresh(): void {
    const videoTilesViewControl = this.snapinUtilities.getElementByName('videoTilesViewControl') as HTMLImageElement;
    if (!isNullOrUndefined(videoTilesViewControl)) {
      const containerElement = !this.isInAssistedMode
        ? videoTilesViewControl.parentElement.parentElement.parentElement
        : videoTilesViewControl.parentElement.parentElement;

      let width = containerElement.clientWidth;
      let height = containerElement.clientHeight;
      if (this.isInAssistedMode) {
        width = containerElement.clientWidth; // - 24;
        height = containerElement.clientWidth / 2;
      }
      videoTilesViewControl.style.width = width.toString();
      videoTilesViewControl.style.height = height.toString();

      // subscribe for size changes on this host element
      if (this.snapinUtilities.resizeObserverSubscription === undefined) {
        this.snapinUtilities.resizeObserverSubscription = this.resizeObserver.observe(containerElement, 100, true, true)
          .subscribe(dim => {
            this.forceUIRefresh();
          });
      }
    }

    this.updateHTML = true;
    this.startRefreshLoop();
  }

  /**
   * setRefreshLoop
   *
   * @public
   * @memberof VideoManagementComponent
   */
  public startRefreshLoop(): void {
    this.counter = 0;
    if (this.intervalRefresh === undefined) {
      this.intervalRefresh = setInterval(() => this.refreshMonitorWallDataCallback(), 333);
    }
  }

  /**
   * refreshSnapshotData
   *
   * @memberof VideoManagementComponent
   */
  public refreshSnapshotData(): void {
    const found = !this.isInAssistedMode ? true : document.getElementById(this.contentVidViewClient) != null;
    if (found && this.isClientHidden) {
      this.isClientHidden = false;
      this.graphic.resetZoomToPermScaleToFit();
      this.setCameraSelectionComboData();
    }

    if (this.videoConnected && this.selectedCameraStatus === '1' && found) { // '1' means reachable
      // console.log('---', 'getSnapshotData', this.selectedObjectName, this.contentVidViewClient);
      const snap: Observable<SnapshotData> = this.services.vmsDataService.getSnapshotData(this.selectedObjectName,
        this.storageService.getClientUniqueIdentifierFsid(this.snapInId),
        this.storageService.getSnapshotCrc(this.snapInId),
        '4', '5');
      if (snap !== undefined) {
        snap.subscribe(snapData => {
          // manage error flags
          this.objectNotFound = snapData.objectNotFound;
          this.videoAPINotReachable = snapData.videoAPINotReachable;
          this.videoManagerNotReachable = snapData.videoManagerNotReachable;
          this.vmsNotReachable = snapData.vmsNotReachable;
          this.vmsSynchronizing = snapData.vmsSynchronizing;
          this.maxClientsNumber = snapData.maxClientsNumber;
          this.videoSourceErrorState = snapData.videoSourceErrorState;
          // code kept RFU... if (this.operatingMonitorGroupNotFound) {
          // code kept RFU...   this.objectNotFound = true;
          // code kept RFU... }

          const videoAPIOk = this.checkVideoAPIStatus();
          this.entriesNotFound();

          const imageData = this.storageService.setSnapshotData(this.snapInId, snapData.imageData);
          this.snapshotData.imageData =
            videoAPIOk && !this.objectNotFound && !this.maxClientsNumber && !this.isVideoSourceError()
              ? 'data:image/png;base64,' + imageData : '';
          this.forceUIRefresh();
        });
      }
    } else {
      this.checkVideoAPIStatus();
      this.entriesNotFound();
      this.snapshotData.imageData = '';
      this.videoSourceErrorState = notReachable;
      this.forceUIRefresh();
      if (!found) {
        this.isClientHidden = true;
      }
    }
  }

  /**
   * onSnapshotLoad
   *
   * @memberof VideoManagementControlComponent
   */
  public onSnapshotLoad(event): void {
    this.snapinUtilities.onSnapshotLoad(event);
  }

  /**
   * drawRectangles
   *
   * @returns {}
   * @memberof VideoManagementComponent
   */
  public drawRectangles(): void {
    // check Video Snapin status ==> ngOnDestroy not always called when Secondary Pane is closed!!!
    //  removed...
    // show snapshot image
    if (this.showSnapshot) {
      if (this.videoConnected && this.videoAligned) {
        if (this.snapshotData.imageData.length !== 0) {
          this.snapinUtilities.showSnapshotImage();
        }
      } else {
        this.checkVideoAPIStatus();
        this.entriesNotFound();
        this.snapshotData.imageData = '';
        this.forceUIRefresh();
      }
    }

    // check Video Snapin status ==> ngOnDestroy not always called when Secondary Pane is closed!!!
    if (!this.isInAssistedMode && this.snapinUtilities.getElementByName(contentVidView) == null) {
      this.clientRunning = false;
      this.saveDataToStorageService = false;
      this.cleanUp();
      this.saveDataToStorageService = true;
    }
    if (!this.clientRunning) {
      return;
    }

    if (this.updateHTML) {
      this.traceService.debug(TraceModules.videoSnapIn, '---(drawRectangles-updateHTML)--- %s', this.updateHTML);
      this.updateHTML = false;
      this.updateHTMLFunc();
    }

    this.snapinUtilities.executeCommands();
  }

  /**
   * refreshMonitorWallData
   *
   * @public
   * @memberof VideoManagementComponent
   */
  public refreshMonitorWallData(): void {
    this.traceService.debug(TraceModules.videoSnapIn, `---(refreshMonitorWallData) [${this.notifyVideosReceived}] %s %s %s %s %s`,
      this.videoConnected, this.objectNotFound, this.vmsNotReachable, this.videoManagerNotReachable, this.vmsSynchronizing);
    if (this.monitorWallId === 'Video' && !this.notifyVideosReceived && !this.cnsDataCacheRefreshed &&
      (!this.videoConnected || this.objectNotFound || this.vmsNotReachable || this.videoManagerNotReachable || this.vmsSynchronizing)) {
      this.monitorWallData = null;
      this.waitingForData = false;
      return;
    }
    this.notifyVideosReceived = false;

    if (this.monitorWallData !== undefined) {
      this.oldMonitorWallData = this.monitorWallData;
    }

    let obs: Observable<VMSMonitorWallData>;

    if (this.selectedObjectOM === 'GMS_VIDEO_Monitor') {
      // video monitor & video monitor group
      obs = this.services.vmsDataService.getSelectedNodeData(this.selectedObjectOM, this.selectedObjectName);
    } else {
      this.videoSourceErrorState = '';
    }
    /*
    code kept RFU... else if (!this.showSnapshot || this.selectedObjectOM === 'GMS_VIDEO_Camera') {
    code kept RFU...   // other object types
    code kept RFU...   let fullHostName: string = location.hostname;
    code kept RFU...   if (fullHostName === '127.0.0.1') {
    code kept RFU...     fullHostName = localHostName;
    code kept RFU...   }
    code kept RFU...   const hostname: string = fullHostName.split('.')[0];
    code kept RFU...   obs = this.services.vmsDataService.getOperatingMonitorGroupData(hostname);
    code kept RFU... } */

    if (obs !== undefined) {
      obs.subscribe(monitorWallData => {
        // manage error flags
        this.objectNotFound = monitorWallData.objectNotFound;
        this.operatingMonitorGroupNotFound = this.objectNotFound;
        this.videoAPINotReachable = monitorWallData.videoAPINotReachable;
        this.videoManagerNotReachable = monitorWallData.videoManagerNotReachable;
        this.vmsNotReachable = monitorWallData.vmsNotReachable;
        this.vmsSynchronizing = monitorWallData.vmsSynchronizing;

        if (monitorWallData.objectNotFound || monitorWallData.videoAPINotReachable ||
          monitorWallData.videoManagerNotReachable || monitorWallData.vmsNotReachable ||
          monitorWallData.vmsSynchronizing || monitorWallData.maxClientsNumber ||
          monitorWallData.videoSourceErrorState !== '') {
          // reset the received object
          monitorWallData = undefined;
        }

        // Sonar Finding: all code moved there
        this.setMonitorWallData(monitorWallData);
      });
    } else {
      this.monitorWallData = null;
      this.waitingForData = false;
      this.forceUIRefresh();
    }
  }

  /**
   * buttonClickOM
   *
   * @public
   * @param {} name
   * @param {} svgobjName
   * @memberof VideoManagementComponent
   */
  public buttonClickOM(name: string, svgobjName: string): void {
    this.services.objectManager.
      buttonClickOM(this.objectManagerService, name, this.templateStrings.omDialogTitle, this.selectedObjectSystemName, this.selectedObjectName).
      subscribe(selectedObject => {
        this.traceService.debug(TraceModules.videoSnapIn, '$$$(selectedObject) %s', selectedObject);

        if (selectedObject !== undefined) {
          switch (selectedObject[0]) {
          // video camera selected
            case 'VC':
              this.monitorWallTiles[svgobjName].cameraName = selectedObject[1];
              this.monitorWallTiles[svgobjName].monitorStatus = MonitorStatus.ConnectStream;
              this.monitorWallTiles[svgobjName].hasS1Command = false;
              this.monitorWallTiles[svgobjName].hasSNCommand = false;
              this.forceUIRefresh();

              this.services.videoManagementService.connectStream(this.vmsDescriptions.get(this.monitorWallTiles[svgobjName].monitorDescription),
                selectedObject[2]).subscribe((status: any) => {
                this.traceService.debug(TraceModules.videoSnapIn, 'Status ConnectStream: %s', status);
                this.refreshMonitorWallData();
                this.startRefreshLoop();
              });
              break;

              // video camera group selected
            case 'VCG':
              if (this.monitorWallTiles[svgobjName].monitorGroupDescription !== '') {
                this.services.videoManagementService.connectStreams(this.vmsDescriptions.get(this.monitorWallTiles[svgobjName].monitorGroupDescription),
                  this.monitorWallTiles[svgobjName].position,
                  selectedObject[2]).
                  subscribe((status: any) => {
                    this.traceService.debug(TraceModules.videoSnapIn, 'Status ConnectStreams: %s', status);
                    this.refreshMonitorWallData();
                    this.startRefreshLoop();
                  });
              }
              break;

              // sequence selected
            case 'SEQ':
              if (this.monitorWallTiles[svgobjName].monitorGroupDescription !== '') {
                this.services.videoManagementService.startSequence(this.vmsDescriptions.get(this.monitorWallTiles[svgobjName].monitorGroupDescription),
                  this.monitorWallTiles[svgobjName].position,
                  selectedObject[2]).
                  subscribe((status: any) => {
                    this.traceService.debug(TraceModules.videoSnapIn, 'Status StartSequence: %s', status);
                    this.refreshMonitorWallData();
                    this.startRefreshLoop();
                  });
              }
              break;

              // unknown selected object type
            default:
              this.traceService.error(TraceModules.videoSnapIn,
                '!!!!!!!(buttonClickOM) - Unknown selected object type !!!!!!! %s', selectedObject[0]);
              break;
          }
        } else {
          this.monitorWallTiles[svgobjName].monitorStatus = MonitorStatus.DisconnectStream;
          this.monitorWallTiles[svgobjName].hasS1Command = false;
          this.monitorWallTiles[svgobjName].hasSNCommand = false;
          this.forceUIRefresh();
        }
      });
  }

  /**
   * onCoverageAreaHighlight
   *
   * @param {} event
   * @memberof VideoManagementComponent
   */
  public onCoverageAreaHighlight(event: any): void {
    // This is intentional: method not neede by now
  }

  /**
   * onScaleToFit
   *
   * @param {} event
   * @memberof VideoManagementComponent
   */
  public onScaleToFit(event: any): void {
    this.graphic.isPermScaleToFit = true;
    this.graphic.zoomFactor = 1.0;
    this.forceUIRefresh();
  }

  /**
   * onZoomIn
   *
   * @param {} event
   * @memberof VideoManagementComponent
   */
  public onZoomIn(event: any): void {
    this.graphic.isPermScaleToFit = false;
    if (this.graphic.zoomFactor < this.graphic.maxZoomValue) {
      this.graphic.zoomFactor *= this.graphic.zoomIncrement;
      this.forceUIRefresh();
    }
  }

  /**
   * onZoomOut
   *
   * @param {} event
   * @memberof VideoManagementComponent
   */
  public onZoomOut(event: any): void {
    this.graphic.isPermScaleToFit = false;
    if (this.graphic.zoomFactor > this.graphic.minZoomValue) {
      this.graphic.zoomFactor *= this.graphic.zoomDecrement;
      this.forceUIRefresh();
    }
  }

  /**
   * saveToStorageService
   *
   * @public
   * @param {} designation
   * @memberof VideoManagementComponent
   */
  public saveToStorageService(designation: string): void {
    if (!isNullOrUndefined(this.storageService) && !isNullOrUndefined(designation)) {
      const storageData = this.storageService.getStateEx(this.snapInId, designation);
      if (!isNullOrUndefined(this.tilesView)) {
        storageData.tilesScrollTop = this.tilesView.getScrollTop();
      }
      storageData.searchedString = this.searchedString;
      storageData.selectedObjectDesignation = designation;
      storageData.frameSpacing = this.snapinUtilities.frameSpacing;
      this.storageService.setStateEx(this.snapInId, storageData);
    }
  }

  /**
   * restoreFromStorageService
   *
   * @public
   * @param {} designation
   * @memberof VideoManagementComponent
   */
  public restoreFromStorageService(designation: string): void {
    if (!isNullOrUndefined(this.storageService)) {
      const storageData = this.storageService.getStateEx(this.snapInId, designation);
      if (storageData.selectedObjectDesignation === designation) {
        this.restoredScrollTop = storageData.tilesScrollTop;
      } else {
        this.restoredScrollTop = 0; // undefined;
      }
      this.searchedString = storageData.searchedString;
      if (storageData.frameSpacing !== 0) {
        this.snapinUtilities.frameSpacing = storageData.frameSpacing;
      }
    }
  }

  /**
   * connectSelectedObjectCom
   *
   * @public
   * @returns {}
   * @memberof VideoManagementComponent
   */
  public connectSelectedObjectCom(): void {
    this.logHelper('£££(1) %s %s %s', this.waitingForData, this.selectedObjectMustBeConnected, this.monitorWallData);
    if (!this.selectedObjectMustBeConnected) {
      this.selectedObjectMustBeConnected = true;
      this.waitingForData = true;
      this.refreshMonitorWallData();
    }

    this.logHelper('£££(2)');
    this.startRefreshLoop();

    this.logHelper('£££(3) %s %s %s', this.entries, this.monitorWallTiles, this.monitorWallData);
    if (this.entries === undefined || this.entries.length === 0 ||
            this.monitorWallTiles === undefined || this.monitorWallTiles[this.entries[0]] === undefined ||
            this.waitingForData) {
      return;
    }
    this.selectedObjectMustBeConnected = false;

    this.snapinUtilities.connectSelectedObjectCU();
  }

  /**
   * isVideoSourceError
   *
   * @public
   * @returns {}
   * @memberof VideoManagementComponent
   */
  public isVideoSourceError(): boolean {
    return this.videoSourceErrorState !== '' ||
           this.showSnapshot && this.selectedCameraStatus !== '1'; // '1' means reachable
  }

  // PUBLIC_METHODS_END

  /**
   * getStepIndex
   *
   * @private
   * @returns
   * @memberof VideoManagementControlComponent
   */
  private getStepIndex(): number {
    if (isNullOrUndefined(this.selectedControlObject)) {
      return -1;
    }
    const obj: any = this.selectedControlObject;
    const si = obj.stepIndex;
    return si === undefined ? -1 : si;
  }

  /**
   * selectedControlObjectChanged
   *
   * @private
   * @param {} object
   * @memberof VideoManagementControlComponent
   */
  private selectedControlObjectChanged(browserObject: BrowserObject): void {
    if (browserObject !== null) {
      if (!this.isInAssistedMode && this.errorMessage !== '') {
        this.snapinUtilities.resetHfwPanelNavigationHeight();
      }
      this.errorMessage = '';
      this.showErrorMessage = false;
      this.errorIcon = '';
      this.oldMonitorWallId = undefined;
      this.objectNotFound = false;
      this.showSnapshot = false;
      this.snapinUtilities.processRequest(browserObject);
    }
  }

  /**
   * manageVideoConnectionAndAlignmentStatus
   *
   * @private
   * @param {} videoManagementService
   * @memberof VideoManagementComponent
   */
  private manageVideoConnectionAndAlignmentStatus(videoManagementService: VideoManagementService): void {
    // get initial video connection status
    videoManagementService.getConnectionStatus().subscribe((vc: string) => {
      this.videoConnected = (vc === '1' || vc === '3' || vc === '4' || vc === '5');
    });

    // get initial video alignment status
    videoManagementService.getAlignmentStatus().subscribe((va: string) => {
      this.videoAligned = (va === '1' || va === '2');
    });

    // get snapshot frame spacing
    this.snapinUtilities.getFrameSpacing().subscribe(() => {
      this.forceUIRefresh();
    });

    // subscribe & manage changes to video connection status
    this.clientIdValueSubscription2 = videoManagementService.registerValueSubscription2Client(`VideoSnapIn${this.snapInId.snapInId}`);

    this.snapinUtilities.subscribeAndManageCameraStatus();

    this.connectionStatusNotificationSubscription =
      videoManagementService.subscribeConnectionStatusNotification(this.clientIdValueSubscription2);
    this.connectionStatusNotificationSubscription.changed.subscribe((valueDetails: ValueDetails) => {
      this.videoConnected = (valueDetails.Value.Value === '1' ||
        valueDetails.Value.Value === '3' ||
        valueDetails.Value.Value === '4' ||
        valueDetails.Value.Value === '5');
      if (this.videoConnected) {
        this.storageService.resetSnapshotCrc(this.snapInId);
      }
      this.forceUIRefresh();
    });

    // subscribe & manage changes to video alignment status
    this.alignmentStatusNotificationSubscription =
      videoManagementService.subscribeAlignmentStatusNotification(this.clientIdValueSubscription2);
    this.alignmentStatusNotificationSubscription.changed.subscribe((valueDetails: ValueDetails) => {
      this.videoAligned = (valueDetails.Value.Value === '1' || valueDetails.Value.Value === '2');
      this.forceUIRefresh();
    });
  }

  /**
   * manageLocalCnsDataCache
   *
   * @private
   * @param {} videoManagementService
   * @memberof VideoManagementComponent
   */
  private manageLocalCnsDataCache(videoManagementService: VideoManagementService): void {
    // subscribe to System Browser Service for getting Cns data for local Cns data cache
    this.clientIdSystemBrowser = videoManagementService.registerSystemBrowserClient(`VideoSnapIn${this.snapInId.snapInId}`);
    videoManagementService.getApplicationViewDesignation().subscribe(designation => { // "System1.ApplicationView"
      this.nodeChangesSubscriptionSystemBrowser = videoManagementService.subscribeSystemBrowserNodeChanges(designation, this.clientIdSystemBrowser);
      this.nodeChangesSubscriptionSystemBrowser.changed.subscribe((value: SystemBrowserSubscription) => {

        this.traceService.debug(TraceModules.videoSnapIn, '$$$(nodeChangesSubscription-1) %s', value);
        videoManagementService.setSelectedObjectData(this.selectedObjectDesignation);
        videoManagementService.refreshCnsDataCache().subscribe((done: boolean) => {

          // Cns data cache has been updated
          this.traceService.debug(TraceModules.videoSnapIn, '===(refreshCnsDataCache done(2))');
          if (videoManagementService.selectedObjectDescription !== '') {
            this.selectedObjectDescription = videoManagementService.selectedObjectDescription;
          }
          if (videoManagementService.selectedObjectLocation !== '') {
            this.selectedObjectLocation = videoManagementService.selectedObjectLocation;
          }

          this.waitingForData = true;
          this.updateHTML = true;
          this.cnsDataCacheRefreshed = true;
          this.refreshMonitorWallData();
          this.forceUIRefresh();
          this.cnsDataCacheRefreshed = false;
        });
      });
    });
  }

  /**
   * restoreTileControlPosition
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private restoreTileControlPosition(): void {
    // get the storage service
    const snapInId = !this.isInAssistedMode
      ? this.snapInId
      : new FullSnapInId('system-manager', 'vid-view');
    this.storageService = this.getStorageService(); // as VideoManagementStorageService;
    this.restoreFromStorageService(this.selectedObjectDesignation);
  }

  /**
   * init
   *
   * @private
   * @param {} getCamList
   * @returns
   * @memberof VideoManagementControlComponent
   */
  private init(getCamList: boolean): void {
    this.snapinUtilities = new SnapinUtilities(this, this.services.videoManagementService);

    this.showButtons = this.isInAssistedMode;
    if (isNullOrUndefined(this.selectedControlObject)) {
      return;
    }
    if (this.isInAssistedMode && this.clientRunning) {
      if (getCamList) { this.getCameraList(); }
      return;
    }

    this.traceService.debug(TraceModules.videoSnapIn, '***** ngOnInit() ***** %s %s', this.snapInId.snapInId, this.location);
    this.clientRunning = true;

    // get video system
    this.services.videoManagementService.getVideoSystem().subscribe((vs: string) => {
      this.videoSystem = vs;
      this.manageVideoConnectionAndAlignmentStatus(this.services.videoManagementService);
    });

    this.manageLocalization();

    // subscribe to System Browser Service for getting Cns data for local Cns data cache
    this.manageLocalCnsDataCache(this.services.videoManagementService);
    this.snapinUtilities.getIcons(this.services.iconMapperService);

    if (!this.isInAssistedMode) {
      if (this.selectedControlObject !== undefined && this.selectedControlObjectSubscription === undefined) {
        this.selectedControlObjectSubscription = this.selectedControlObject.subscribe(
          object => (this.selectedControlObjectChanged(object)));
      }
    } else if (getCamList) {
      // get camera list for video OP step and use the most important
      this.getCameraList();
    }

    // get the storage service
    this.storageService = this.getStorageService();

    // initialize all video management service subscriptions
    this.services.videoManagementService.subscribe();

    // first HTML update
    this.updateHTMLFunc();

    // subscribe to CNS mode changes
    this.services.cnsHelperService.activeCnsLabel.subscribe(label => {
      this.cnsLabelObject = label;
      this.snapinUtilities.assignHeading(this.cnsLabelObject);
      this.forceUIRefresh();
    });

    // restore tile control position
    this.restoreTileControlPosition();
  }

  /**
   * getStorageService
   *
   * @private
   * @returns {*}
   * @memberof VideoManagementControlComponent
   */
  private getStorageService(): any {
    // get the storage service
    let snapInId = !this.isInAssistedMode
      ? this.snapInId
      : new FullSnapInId('system-manager', 'vid-view');
    let storageService = (this.messageBroker.getStorageService(snapInId) as any); // as VideoManagementStorageService;
    if (!isNullOrUndefined(storageService)) {
      return storageService;
    }

    snapInId = new FullSnapInId('event-list', 'vid-view');
    storageService = (this.messageBroker.getStorageService(snapInId) as any);
    if (!isNullOrUndefined(storageService)) {
      return storageService;
    }

    snapInId = new FullSnapInId('investigative', 'vid-view');
    storageService = (this.messageBroker.getStorageService(snapInId) as any);
    if (!isNullOrUndefined(storageService)) {
      return storageService;
    }
  }

  /**
   * getCameraList
   *
   * @private
   * @returns {}
   * @memberof VideoManagementControlComponent
   */
  private getCameraList(): BrowserObject {
    if (this.getStepIndex() < 0) {
      this.selectedControlObject = this.savedSelectedControlObject;
    }

    // get configuration data
    const obj: any = this.selectedControlObject;
    const stepIndexLoc: number = obj.stepIndex;
    const alertSource: string = obj.alertSource;
    const runtimeStatus: string = obj.runtimeStatus;
    const configuration: string = isNullOrUndefined(runtimeStatus) || runtimeStatus === '[]' ? obj.configuration : runtimeStatus;
    this.traceService.debug(TraceModules.videoOpStep, '=== ' + this.stepIndex + ' ' + stepIndexLoc + ' ' + alertSource + ' | ' +
      configuration + ' ! ' + runtimeStatus);

    // check if it's OK
    if (isNullOrUndefined(alertSource) || isNullOrUndefined(configuration) || configuration === '') {
      // inject fake camera to display "nothing to show (wrong configuration)" message
      const noCameraWC = this.getNoCamera('NoCameraWC');
      this.contentVidViewClient = contentVidView;
      this.selectedControlObjectChanged(noCameraWC);
      return undefined;
    }

    const config: any[] = JSON.parse(configuration);
    let fixedLinks: any[];
    const filteredFixedLinks = new Map<number, string>();

    let fixedLinkPosition = 1;
    if (!isNullOrUndefined(runtimeStatus)) {
      fixedLinks = JSON.parse(runtimeStatus);
      fixedLinks.forEach(fixedLink => filteredFixedLinks.set(fixedLinkPosition++, '')); // fixedLink.Position
    }

    // const cameraList = new Map<number, { browserObjects: BrowserObject[]; mode: number }>();
    this.cameraList = [];

    this.promises = [];
    this.modes = [];
    // code kept RFU... console.log('<<<>>>', config);

    let numRelated = 0;
    let confPosition = 1;
    config.forEach(conf => {
      const mode = conf.Mode;
      if (conf.LinkDpIdName !== '') {
        if (isNullOrUndefined(runtimeStatus) || filteredFixedLinks.get(confPosition - numRelated) !== undefined) {
          const promise = this.services.systemBrowserService.searchNodes(0, conf.LinkDpIdName, null, 2).toPromise();
          this.promises.push(promise);
          this.modes.push(mode);
        }
      } else {
        const promise = this.services.relatedItemsService.getRelatedItems([alertSource]).toPromise();
        this.promises.push(promise);
        this.modes.push(mode);
        numRelated += 1;
      }
      confPosition += 1;
    });

    this.numResolvedPromises = 0;
    Promise.allSettled(this.promises).
      then(results => results.forEach((result: any) => {
        this.managePromises(result);
      }));
  }

  /**
   * managePromises
   *
   * @private
   * @param result
   * @memberof VideoManagementControlComponent
   */
  private managePromises(result: any): void {
    // code kept RFU... console.log('new<0>', result.value.Nodes, result.value.RelatedResults);

    if (!isNullOrUndefined(result.value.Nodes)) {
      const camera: BrowserObject = result.value.Nodes[0];
      if (camera?.Attributes.ObjectModelName === 'GMS_VIDEO_Camera') {
        // code kept RFU... console.log('???<1><1>', camera?.ObjectId);
        this.cameraList.push({ camera, mode: this.modes[this.numResolvedPromises] });
      }
    }

    if (!isNullOrUndefined(result.value.RelatedResults)) {
      const relatedItems: RelatedItemsRepresentation[] = result.value.RelatedResults[0].RelatedItems;
      relatedItems.forEach(relatedItem => {
        relatedItem.Nodes.forEach(camera => {
          if (camera?.Attributes.ObjectModelName === 'GMS_VIDEO_Camera') {
            // code kept RFU... console.log('???<2><2>', camera?.ObjectId);
            this.cameraList.push({ camera, mode: this.modes[this.numResolvedPromises] });
          }
        });
      });
    }

    if (++this.numResolvedPromises === this.promises.length) {
      // all promises have been resolved:
      // 1. remove repeated cameras
      // 2. get most important camera for Video OP Step
      this.removeRepeatedCameras();
      this.getMostImportantCamera();
      this.showButtons = this.cameraList.length > 1;

      if (this.selectedControlObject !== undefined) {
        // code kept RFU... if (this.optionsList === undefined) {
        // code kept RFU...   this.setCameraSelectionComboData();
        // code kept RFU... }

        // camera found: use it in Video OP Step
        this.titleForOpStep =
                    '[1 / ' + this.cameraList.length + '] ' +
                    this.selectedControlObject.Descriptor +
                    ' [' + this.selectedControlObject.Name + ']';
        // code kept RFU... console.log('<<<1>>>', this.titleForOpStep, this.cameraList.length, numResolvedPromises, this.cameraList);
        const sco: BrowserObject = this.selectedControlObject;
        this.contentVidViewClient = contentVidView + sco.Name + this.stepIndex.toString();
        this.selectedControlObjectChanged(this.selectedControlObject);
      } else {
        // inject fake camera to display "nothing to show" message
        const noCamera = this.getNoCamera('NoCamera');
        this.contentVidViewClient = contentVidView;
        this.selectedControlObjectChanged(noCamera);
        // code kept RFU... console.log('<<<2>>>', this.cameraList.length, numResolvedPromises, this.cameraList);
      }
    }
  }

  /**
   * removeRepeatedCameras
   *
   * @private
   * @memberof VideoManagementControlComponent
   */
  private removeRepeatedCameras(): void {
    const cameras = new Map<string, number>();
    let pos = 0;
    while (pos < this.cameraList.length) {
      const objectId = this.cameraList[pos].camera.Attributes.ObjectId;
      if (cameras.has(objectId)) {
        this.cameraList.splice(pos, 1);
      } else {
        cameras.set(objectId, 0);
        pos += 1;
      }
    }
  }

  /**
   * setCameraSelectionComboData
   *
   * @private
   * @memberof VideoManagementControlComponent
   */
  private setCameraSelectionComboData(): void {
    this.optionsList = [];
    this.cameraList.forEach((obj, index) => {
      const titleForOpStep =
            '[' + (index + 1).toString() + ' / ' + this.cameraList.length + '] ' +
            obj.camera.Descriptor +
            ' [' + obj.camera.Name + ']';

      this.optionsList.push({ id: index.toString(), title: titleForOpStep });
    });

    this.formControl = new FormControl(this.currentCameraIndex.toString());
  }

  /**
   * getNoCamera
   *
   * @private
   * @param {} cameraName
   * @returns {}
   * @memberof VideoManagementControlComponent
   */
  private getNoCamera(cameraName: string): BrowserObject {
    const noCamera: BrowserObject =
        {
          Designation: 'System.' + cameraName, Name: cameraName,
          Attributes: {
            ObjectModelName: 'GMS_VIDEO_Camera',
            Alias: undefined, DefaultProperty: undefined, DisciplineDescriptor: undefined, DisciplineId: undefined,
            FunctionName: undefined, ManagedType: undefined, ManagedTypeName: undefined, ObjectId: undefined,
            SubDisciplineDescriptor: undefined, SubDisciplineId: undefined,
            SubTypeDescriptor: undefined, SubTypeId: undefined, TypeDescriptor: undefined, TypeId: undefined
          },
          HasChild: false, Location: undefined, Descriptor: undefined,
          ObjectId: undefined, SystemId: undefined, ViewId: undefined, ViewType: undefined
        };
    return noCamera;
  }

  /**
   * getMostImportantCamera
   *
   * @private
   * @memberof VideoManagementControlComponent
   */
  private getMostImportantCamera(): void {
    this.selectedControlObject = this.findMostImportantCamera(-1); // -1 = do not check mode
    if (this.selectedControlObject === undefined) {
      this.selectedControlObject = this.findMostImportantCamera(0); // 0 = live
    }
    if (this.selectedControlObject === undefined) {
      this.selectedControlObject = this.findMostImportantCamera(1); // 1 = replay
    }
  }

  /**
   * findMostImportantCamera
   *
   * @private
   * @param {} mode
   * @returns
   * @memberof VideoManagementControlComponent
   */
  private findMostImportantCamera(mode: number): BrowserObject {
    let retVal: BrowserObject;
    let index = 0;
    while (index < this.cameraList.length) {
      const camera: BrowserObject = this.cameraList[index].camera;
      const modeVal: number = this.cameraList[index].mode;
      if (mode === modeVal || mode === -1) {
        retVal = camera;
        this.currentCameraIndex = index;
        break;
      }
      index += 1;
    }
    // code kept RFU... console.log('???(2)', retVal);
    return retVal;
  }

  /**
   * cleanUp
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private cleanUp(): void {
    if (isNullOrUndefined(this.services.videoManagementService)) {
      return; // for UTs
    }

    this.clientRunning = false;

    this.oldMonitorWallId = undefined;
    this.snapinUtilities.stopRefreshSnapshot();

    // clean all video management service subscriptions
    this.services.videoManagementService.unsubscribe();

    // clean system browser node changes stuff
    if (this.nodeChangesSubscriptionSystemBrowser !== undefined && this.clientIdSystemBrowser !== '') {
      this.services.videoManagementService.unsubscribeSystemBrowserNodeChanges(
        this.nodeChangesSubscriptionSystemBrowser, this.clientIdSystemBrowser);
      this.nodeChangesSubscriptionSystemBrowser = undefined;
    }
    if (this.clientIdSystemBrowser !== '') {
      this.services.videoManagementService.disposeSystemBrowserClient(this.clientIdSystemBrowser);
      this.clientIdSystemBrowser = '';
    }

    // clean value subscription stuff
    this.cleanValueSubscriptionData();

    if (this.selectedControlObjectSubscription !== undefined) {
      this.selectedControlObjectSubscription.unsubscribe();
      this.selectedControlObjectSubscription = undefined;
    }

    if (this.intervalRefresh !== undefined) {
      clearInterval(this.intervalRefresh);
      this.intervalRefresh = undefined;
    }

    if (this.subscription !== undefined) {
      this.services.vmsDataSubscriptionService.unsubscribeVMSDataChange(this.subscription, this.clientId);
      this.traceService.debug(TraceModules.videoSnapIn, '=======(unsubscribeVMSDataChange) %s', this.subscription);
      this.subscription = undefined;
    }

    if (!clientsRunning) {
      if (this.clientId !== undefined) {
        this.services.vmsDataSubscriptionService.disposeClient(this.clientId);
        this.traceService.debug(TraceModules.videoSnapIn, '=======(disposeClient) Disposed');
        this.clientId = undefined;
      }
    }

    if (this.saveDataToStorageService) {
      this.saveToStorageService(this.selectedObjectDesignation);
    }
  }

  /**
   * cleanValueSubscriptionData
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private cleanValueSubscriptionData(): void {
    if (this.clientIdValueSubscription2 === '') {
      return;
    }

    if (this.connectionStatusNotificationSubscription !== undefined) {
      this.services.videoManagementService.unsubscribeConnectionStatusNotification(
        this.connectionStatusNotificationSubscription, this.clientIdValueSubscription2);
      this.connectionStatusNotificationSubscription = undefined;
    }

    if (this.alignmentStatusNotificationSubscription !== undefined) {
      this.services.videoManagementService.unsubscribeAlignmentStatusNotification(
        this.alignmentStatusNotificationSubscription, this.clientIdValueSubscription2);
      this.alignmentStatusNotificationSubscription = undefined;
    }

    if (this.cameraStatusNotificationSubscription !== undefined) {
      this.services.videoManagementService.unsubscribeCameraStatusNotification(
        this.cameraStatusNotificationSubscription, this.clientIdValueSubscription2);
      this.cameraStatusNotificationSubscription = undefined;
    }

    this.services.videoManagementService.disposeValueSubscription2Client(this.clientIdValueSubscription2);
    this.clientIdValueSubscription2 = '';
  }

  /**
   * logHelper
   *
   * @private
   * @param {} [message]
   * @param {} optionalParams
   * @memberof VMSDataSubscriptionProxyService
   */
  private logHelper(message?: any, ...optionalParams: any[]): void {
    if (log) {
      this.traceService.debug(TraceModules.videoSnapIn, message, optionalParams);
    }
  }
  // PRIVATE_METHODS_END

  /**
   * refreshMonitorWallDataCallback
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private refreshMonitorWallDataCallback(): void {
    if (this.updateHTML) {
      this.drawRectangles();
    }

    this.counter += 1;
    if (this.counter > 5) {
      clearInterval(this.intervalRefresh);
      this.intervalRefresh = undefined;
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * subscribe2SelectedObject
   *
   * @private
   * @param {} selectedObjectId
   * @memberof VideoManagementComponent
   */
  private subscribe2SelectedObject(selectedObjectId: string): void {
    this.traceService.debug(TraceModules.videoSnapIn, '=======(vmsDataSubscriptionService) %s', this.services.vmsDataSubscriptionService);

    if (this.services.vmsDataSubscriptionService !== undefined) {
      if (this.subscription !== undefined) {
        this.services.vmsDataSubscriptionService.unsubscribeVMSDataChange(this.subscription, this.clientId);
        this.traceService.debug(TraceModules.videoSnapIn, '=======(unsubscribeVMSDataChange) %s', this.subscription);
        this.subscription = undefined;
      }

      if (this.clientId === undefined) {
        this.clientId = this.services.vmsDataSubscriptionService.registerClient(`VideoSnapIn${this.snapInId.snapInId}`);
        this.traceService.debug(TraceModules.videoSnapIn, '=======(registerClient) %s', this.clientId);
        clientsRunning = true;
      }

      if (this.subscription === undefined) {
        this.subscription = this.services.vmsDataSubscriptionService.subscribeVMSDataChange(selectedObjectId, this.clientId);
        this.traceService.debug(TraceModules.videoSnapIn, '=======(subscribeVMSDataChange) %s %s', this.subscription[0], selectedObjectId);

        this.subscription[0].stateChanged.subscribe(value => {
          this.traceService.debug(TraceModules.videoSnapIn, '°°°°°°°(subscription[0].stateChanged.subscribe) %s', value);
          this.forceUIRefresh();
        });

        this.subscription[0].changed.subscribe(value => {
          this.traceService.debug(TraceModules.videoSnapIn, '°°°°°°°(subscription[0].changed.subscribe) %s', value);
          this.forceUIRefresh();
        });

        // *****SignalR*****
        this.services.vmsDataSubscriptionService.getVmsChangeSubscription(this.clientId).subscribe(values => {
          values.forEach(value => {
            this.traceService.debug(TraceModules.videoSnapIn, '*****SignalR*****(2) %s %s %s %s',
              value.NameId, `[${this.snapInId.snapInId}]`, this.clientRunning, clientsRunning);
            const objName: string = value.NameId;
            const objNames: string[] = this.snapinUtilities.getMonitorWallObjects();
            this.traceService.debug(TraceModules.videoSnapIn, '===(ObjectChanged-2)=== %s %s', objName, objNames);

            if (objNames.includes(objName) ||
                            this.vmsNotReachable || this.objectNotFound || this.videoManagerNotReachable || this.vmsSynchronizing) {
              this.traceService.debug(TraceModules.videoSnapIn, '===(ObjectChanged-3)===');
              this.refreshMonitorWallData();
              this.startRefreshLoop();
              this.notifyVideosReceived = true;
            }
          });
        });
        // *****SignalR*****
      }
    }
  }

  /**
   * updateHTMLFunc
   *
   * @private
   * @returns {}
   * @memberof VideoManagementComponent
   */
  private updateHTMLFunc(): void {
    this.traceService.debug(TraceModules.videoSnapIn, '===updateHTML(1)=== %s', this.snapInId.snapInId);

    // get the entries for the selected object
    const data = this.getSelectedEntries(this.selectedObjectDescription, this.entries);
    if (data === undefined) {
      return;
    }
    this.traceService.debug(TraceModules.videoSnapIn, '===updateHTML(2)===');
    this.logHelper('*** preselectionReceived *** %s %s %s', data.preselectionReceived, this.videoConnected, this.videoAligned);

    // check if preselction message has been received
    if (!data.preselectionReceived) {
      return;
    }
    this.traceService.debug(TraceModules.videoSnapIn, '===updateHTML(3)===');

    // if the selected object must be connected, do it
    if (this.selectedObjectMustBeConnected) {
      // code kept RFU... this . connect Selected Object Com ( ) ;
    }

    const entries: string[] = data.selectedEntries;
    this.logHelper('$$$(data) %s %s', this.selectedObjectDescription, entries);

    // Sonar Finding: all code moved there
    if (!this.checkVideoAPIStatus()) {
      return;
    }

    if (entries !== null) {
      // Sonar Finding: all code moved there
      this.entriesFound(entries);
    } else {
      // Sonar Finding: all code moved there
      this.entriesNotFound();
    }
  }

  /**
   * checkVideoAPIStatus
   *
   * @private
   * @returns {}
   * @memberof VideoManagementComponent
   */
  private checkVideoAPIStatus(): boolean {
    // check if message "Video API disconnected" must be displayed
    this.traceService.debug(TraceModules.videoSnapIn, '=*=()=*= %s %s %s %s %s',
      this.videoConnected, this.videoAligned, this.vmsNotReachable, this.videoManagerNotReachable, this.vmsSynchronizing);

    if (!this.vmsNotReachable && !this.videoManagerNotReachable && !this.videoAPINotReachable && !this.vmsSynchronizing &&
            !this.maxClientsNumber /* && !this.isVideoSourceError() */) {
      if (!this.videoConnected) {
        if (this.videoAligned) {
          this.setErrorMessage(this.templateStrings.videoDisconnected);
          return false;
        } else {
          this.setErrorMessage(this.templateStrings.videoDisconnectedNotAligned);
          return false;
        }
      } else {
        this.setNodesData(this.entries);
      }
    }

    return true;
  }

  /**
   * setErrorMessage
   *
   * @private
   * @param {} errorMessage
   * @memberof VideoManagementComponent
   */
  private setErrorMessage(errorMessage: string): void {
    if (errorMessage !== undefined) {
      this.errorMessage = errorMessage;
      this.errorIcon = this.getErrorIcon();
      this.showErrorMessage = true;
      if (!isNullOrUndefined(this.selectedObjectName)) {
        this.snapinUtilities.setHfwPanelNavigationHeight(!this.selectedObjectName.startsWith('NoCamera'));
      }
      this.snapinUtilities.max8px = 0;
      this.view = [];
    } else {
      this.forceUIRefresh();
    }
  }

  /**
   * setNodesData
   *
   * @private
   * @param {} entries
   * @memberof VideoManagementComponent
   */
  private setNodesData(entries: string[]): void {
    this.traceService.debug(TraceModules.videoSnapIn, '*** setNodesData() ***');
    if (this.monitorWallTitle !== undefined) {
      this.title = this.monitorWallTitle;
    }
    const nodes: NodeType[] = [];

    const videoDisconnected = !this.vmsNotReachable && !this.videoManagerNotReachable && !this.videoConnected &&
                              !this.vmsSynchronizing;
    if (!videoDisconnected && !this.maxClientsNumber && !this.isVideoSourceError()) {
      this.errorMessage = '';
      this.snapinUtilities.resetErrorIcon();
      this.showErrorMessage = false;
      for (const entry of entries) {
        this.setEntryData(entry, nodes);
      }
      if (nodes.length === 0) {
        this.view = [];
      }
    } else {
      this.view = [{
        name: null, descriptor: null, title: null, source: null,
        color: null, colorX: null, colorPB: null, colorS1: null, colorS1N: null,
        tooltip: null, actions: null, actionsStatus: 1, location: null, designation: null,
        cameraIcon: null, sequenceIcon: null
      }];
    }
    this.snapinUtilities.copyNodes(nodes);
    this.traceService.debug(TraceModules.videoSnapIn, 'setNodesData %s %s', this.title, this.view);

    this.snapinUtilities.assignHeading(this.cnsLabelObject);

    if (!isNullOrUndefined(this.restoredScrollTop) && !isNullOrUndefined(this.tilesView) &&
            this.scrollHasBeenRestored === false) {
      setTimeout(() => this.restoreScrollTopPosition());
    }
  }

  /**
   * restoreScrollTopPosition
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private restoreScrollTopPosition(): void {
    this.tilesView.scrollTo(this.restoredScrollTop);
    this.scrollHasBeenRestored = true;
  }

  /**
   * setEntryData
   *
   * @private
   * @param {} entry
   * @param {} nodes
   * @memberof VideoManagementComponent
   */
  private setEntryData(entry: string, nodes: NodeType[]): void {
    if (!isNullOrUndefined(this.siSearchBar) &&
            this.searchedString !== '' &&
            this.searchedString !== this.siSearchBar.value) {
      this.siSearchBar.value = this.searchedString;
    }

    const str = this.monitorWallTiles[entry].monitorTitle;
    if (!this.snapinUtilities.isMatch(str, str, this.searchedString) || this.showSnapshot) {
      return;
    }

    const monitorStatus = this.monitorWallTiles[entry].monitorStatus;
    const hasS1Command = this.monitorWallTiles[entry].hasS1Command;
    const hasSNCommand = this.monitorWallTiles[entry].hasSNCommand;
    const hasOCommand = hasS1Command || hasSNCommand;
    const hasPlayBack = this.monitorWallTiles[entry].hasPlayBack && (monitorStatus !== MonitorStatus.DisconnectStream);

    const color = MonitorColorsUtilities.getMonitorColor(monitorStatus);
    const colorX = MonitorColorsUtilities.getCommandColor(color !== 'black', monitorStatus);
    const colorO = MonitorColorsUtilities.getCommandColor(hasOCommand, monitorStatus);
    const colorPB = MonitorColorsUtilities.getCommandColor(hasPlayBack, monitorStatus);

    const connected = color !== 'black';
    const sequenceRunning = (hasS1Command || hasSNCommand) && color !== 'black';

    let tooltip = `${this.monitorWallTiles[entry].monitorDescription} [${this.monitorWallTiles[entry].monitorName}`;
    const cameraName = this.monitorWallTiles[entry].cameraName;
    if (cameraName !== 'src0') {
      tooltip += ` - ${this.monitorWallTiles[entry].cameraName}`;
    }
    tooltip += ']';

    const name = this.monitorWallTiles[entry].monitorName;
    const descriptor = this.monitorWallTiles[entry].monitorDescription;
    const title = this.monitorWallTiles[entry].monitorTitle;
    const source = color !== 'black' ? this.monitorWallTiles[entry].cameraTitle : '';

    const node: NodeType = {
      name,
      descriptor,
      title,
      source,
      color,
      colorX,
      colorPB: hasPlayBack ? colorPB : color,
      colorS1: hasS1Command && sequenceRunning ? colorO : color,
      colorS1N: sequenceRunning ? colorO : color,
      tooltip,
      actions: [],
      actionsStatus: 1,
      location: this.selectedObjectLocation,
      designation: this.selectedObjectDesignation,
      cameraIcon: this.cameraIcon,
      sequenceIcon: this.sequenceIcon
    };

    this.snapinUtilities.setActions(node, name, descriptor, connected, sequenceRunning);

    nodes.push(node);
  }

  /**
   * entriesFound
   *
   * @private
   * @param {} entries
   * @memberof VideoManagementComponent
   */
  private entriesFound(entries: string[]): void {
    this.setNodesData(entries);
  }

  /**
   * entriesNotFound
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private entriesNotFound(): void {
    const msg = this.getMsg();

    if (msg !== undefined) {
      if (msg !== '') {
        this.errorMessage = msg;
      }
      this.errorIcon = this.getErrorIcon();
      this.showErrorMessage = true;
      this.snapinUtilities.setHfwPanelNavigationHeight(!this.selectedObjectName.startsWith('NoCamera'));
      this.snapinUtilities.max8px = 0;
      this.view = [];
    } else {
      this.forceUIRefresh();
    }
  }

  /**
   * getMsg
   *
   * @private
   * @returns {}
   * @memberof VideoManagementControlComponent
   */
  private getMsg(): string {
    let msg: string;

    if (this.videoManagerNotReachable) {
      // priority 1 (highest)
      msg = this.templateStrings.videoManagerNotReachable;
    } else if (this.vmsSynchronizing) {
      // priority 2
      msg = this.templateStrings.vmsSynchronizing;
    } else if (this.vmsNotReachable) {
      // priority 3
      msg = this.templateStrings.vmsNotReachable;
    } else if (this.videoAPINotReachable) {
      // priority 4
      msg = this.templateStrings.videoAPINotReachable;
    } else if (this.objectNotFound) {
      // priority 5 (lowest)
      if (this.selectedObjectOM === 'GMS_VIDEO_Monitor') {
        // video monitor & video monitor group
        const deletedObjectType = this.selectedObjectName.startsWith('mntr')
          ? this.templateStrings.monitor
          : this.templateStrings.monitorGroup;
        msg = this.templateStrings.videoObjectDeleted.replace('{{deletedObjectType}}', deletedObjectType);
      }
      /*
      code kept RFU... else {
      code kept RFU...   // other object types
      code kept RFU...   msg = this.templateStrings.noAssociatedGroup;
      code kept RFU... }
      */
    } else if (this.maxClientsNumber) {
      msg = this.templateStrings.maxClientsNumber;
    } else if (this.isVideoSourceError() && this.videoConnected) {
      msg = this.snapinUtilities.getVideosourceErrorMsg(this.videoSourceErrorState);
    }

    return msg;
  }

  /**
   * getErrorIcon
   *
   * @private
   * @returns {}
   * @memberof VideoManagementComponent
   */
  private getErrorIcon(): string {
    if (!this.selectedCameraDeleted &&
          (this.errorMessage === '' || this.videoSourceErrorState === '*NothingToShow' ||
           this.showSnapshot && this.selectedCameraStatus === undefined)) {
      return '';
    } else {
      switch (this.selectedObjectOM) {
        case 'GMS_VIDEO_Camera':
          return this.cameraIcon;

        case 'GMS_VIDEO_Monitor':
        default:
          return this.monitorIcon;
      }
    }
  }

  /**
   * getSelectedEntries
   *
   * @private
   * @param {} selectedObjectDescription
   * @param {} allEntries
   * @returns {}
   * @memberof VideoManagementComponent
   */
  private getSelectedEntries(selectedObjectDescription: string, allEntries: string[]): { preselectionReceived: boolean; selectedEntries: string[] } {
    if (this.monitorWallData === undefined) {
      return undefined;
    }

    let preselectionReceived = false;
    let selectedEntries: string[] = [];

    if (selectedObjectDescription === undefined) {
      selectedEntries = allEntries;
    } else {
      preselectionReceived = true;
    }

    this.monitorWallTiles = {};
    this.entries = [];
    selectedEntries = [];
    if (this.monitorWallData !== null) {
      const data: VMSMonitorData[] = this.monitorWallData.sinks;
      this.logHelper('£££££() %s', data);
      if (data !== undefined) {
        let pos = 0;
        let seqData = '';
        let monStatus = '';
        data.forEach(entry => {
          pos += 1;
          this.setEntry(entry, selectedEntries, pos, this.monitorWallData.monitorGroupDescription);
          seqData += ` ${entry.sequenceStatus}`;
          monStatus += ` ${entry.monitorStatus}`;
        });
        this.traceService.debug(TraceModules.videoSnapIn, '---(seqData) %s', seqData);
        this.traceService.debug(TraceModules.videoSnapIn, '---(monStatus) %s', monStatus);
        this.monitorWallId = `mngr${this.monitorWallData.monitorGroupId}`;
      } else {
        const entry: VMSMonitorData = JSON.parse(JSON.stringify(this.monitorWallData));
        this.setEntry(entry, selectedEntries, 0, '');
        this.monitorWallId = `mntr${entry.id}`;
      }

      this.traceService.debug(TraceModules.videoSnapIn, '---(change)-- %s %s', this.monitorWallId, this.oldMonitorWallId);
      if (this.monitorWallId !== this.oldMonitorWallId) {
        this.oldMonitorWallId = this.monitorWallId;
        this.subscribe2SelectedObject(this.monitorWallId);
      }

      selectedEntries = this.entries;
    } else {
      selectedEntries = null;
      this.monitorWallId = 'Video';
      this.traceService.debug(TraceModules.videoSnapIn, '---(change-404)-- %s %s', this.monitorWallId, this.oldMonitorWallId);
      if (this.monitorWallId !== this.oldMonitorWallId) {
        this.oldMonitorWallId = this.monitorWallId;
        this.subscribe2SelectedObject(this.monitorWallId);
      }
    }
    return { preselectionReceived, selectedEntries };
  }

  /**
   * setEntry
   *
   * @private
   * @param {} entry
   * @param {} selectedEntries
   * @param {} position
   * @param {} monitorGroupDescription
   * @memberof VideoManagementComponent
   */
  private setEntry(entry: VMSMonitorData, selectedEntries: string[], position: number, monitorGroupDescription: string): void {
    this.logHelper('===(entry) %s', entry);
    const monitorName = `mntr${entry.id}`;
    const cameraName = `src${entry.cameraName}`;
    const svgobjName = monitorName;
    this.monitorWallTiles[svgobjName] = {
      svgobjName, position, monitorGroupDescription, monitorStatus: entry.monitorStatus,
      monitorDescription: entry.monitorDescription, monitorName, monitorTitle: '',
      cameraDescription: entry.cameraDescription, cameraName, cameraTitle: '',
      hasS1Command: false, hasSNCommand: false, hasPlayBack: entry.hasPlayback
    };

    switch (entry.sequenceStatus) {
      case SequenceStatus.NoSequenceActive:
        this.monitorWallTiles[svgobjName].hasS1Command = false;
        this.monitorWallTiles[svgobjName].hasSNCommand = false;
        break;

      case SequenceStatus.SequenceActivePrimaryMonitor:
        this.monitorWallTiles[svgobjName].hasS1Command = false;
        this.monitorWallTiles[svgobjName].hasSNCommand = true;
        break;

      case SequenceStatus.SequenceActiveNotPrimaryMonitor:
        this.monitorWallTiles[svgobjName].hasS1Command = true;
        this.monitorWallTiles[svgobjName].hasSNCommand = false;
        break;

      default:
        // NOP
        break;
    }

    this.entries.push(svgobjName);
    selectedEntries.push(svgobjName);
  }

  /**
   * setMonitorWallData
   *
   * @private
   * @param {} monitorWallData
   * @memberof VideoManagementComponent
   */
  private setMonitorWallData(monitorWallData: VMSMonitorWallData): void {
    if (monitorWallData !== undefined) {
      const isSameData = this.snapinUtilities.isSameData(this.oldMonitorWallData, monitorWallData);
      const objNames = this.snapinUtilities.getObjectNames(monitorWallData);

      if (!isSameData || this.waitingForData) {
        this.oldMonitorWallData = monitorWallData;
        // this.videoManagementService.getCnsDescriptions(objNames).subscribe(cnsData => {
        this.services.videoManagementService.getCnsDescriptionsFromCnsDataCache(objNames).subscribe(cnsData => {
          this.monitorWallTitle = this.snapinUtilities.setObjectNames(monitorWallData, cnsData);
          if (!isSameData || this.waitingForData || this.vmsNotReachable || this.videoManagerNotReachable || this.vmsSynchronizing) {
            this.traceService.debug(TraceModules.videoSnapIn, '$$$() *** monitorWallData data changed *** %s %s %s %s %s',
              !isSameData, this.waitingForData, this.vmsNotReachable, this.videoManagerNotReachable, this.vmsSynchronizing);
            this.forceUIRefresh();
          }
          this.monitorWallData = monitorWallData;
          this.waitingForData = false;
        });
      } else {
        this.monitorWallData = monitorWallData;
        this.waitingForData = false;
      }
    } else {
      this.monitorWallData = null;
      this.waitingForData = false;
      this.forceUIRefresh();
    }
  }
}
