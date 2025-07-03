import { BrowserObject, CnsLabel, CnsLabelEn, SiIconMapperService, TablesEx, ValueDetails } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { Observable, Subscription } from 'rxjs';

import { VideoManagementService } from '../services/video-management.service';
import { MonitorStatus, VMSMonitorData, VMSMonitorWallData } from '../services/videos/vms.data.model';
import { TraceModules } from '../shared/trace-modules';
import { TemplateStrings } from './data.model';
import { NodeType, NodeUtilities } from './nodes';
import { VideoManagementControlComponent } from './video-management-control.component';

/** class constants */
const cameraObjectType = 600;
const sequenceObjectType = 6800;
const monitorObjectType = 9000;
const monitorGroupObjectType = 9000;
const defaultFrameSpacing = 500;
const notReachable = '*NotReachable';

/** local types */
type Command = { commandName: string; commandParameter: any };

/**
 * SnapinUtilities
 *
 * @export
 * @class SnapinUtilities
 */
export class SnapinUtilities {

  /**
   *Creates an instance of SnapinUtilities.
   * @param {} videoManagementControlComponent
   * @param {} videoManagementService
   * @memberof SnapinUtilities
   */
  constructor(
    private readonly videoManagementControlComponent: VideoManagementControlComponent,
    private readonly videoManagementService: VideoManagementService) {
  }

  /**
   * resizeObserverSubscription
   *
   * @public
   * @type {Subscription}
   * @memberof SnapinUtilities
   */
  public resizeObserverSubscription: Subscription;

  // public data
  public frameSpacing = 0;
  public max8px = 0;

  /**
   * intervalRefreshSnapshot
   *
   * @private
   * @type {NodeJS.Timeout}
   * @memberof SnapinUtilities
   */
  private intervalRefreshSnapshot: NodeJS.Timeout = undefined;

  /**
   * videosourceErrorMsgs
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private readonly videosourceErrorMsgs = new Map<string, string>();

  /**
   * cameraStateErrorMsgs
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private readonly cameraStateErrorMsgs = new Map<string, string>();

  // private data
  private usedFrameSpacing = 0;
  private oldParentClientWidth = 0;
  private isHScrollbarVisible = false;
  private isVScrollbarVisible = false;
  private oldHScrollbarThumbSize = 0;
  private oldVScrollbarThumbSize = 0;
  private oldScrollWidth = 0;
  private oldScrollHeight = 0;

  /**
   * Commands
   *
   * @private
   * @type {Command[]}
   * @memberof SnapinUtilities
   */
  private commands: Command[] = [];

  /**
   * isSameData
   *
   * @param {} d1
   * @param {} d2
   * @returns {}
   * @memberof SnapinUtilities
   */
  public isSameData(d1: VMSMonitorWallData, d2: VMSMonitorWallData): boolean {
    const j1: string = JSON.stringify(d1);
    const j2: string = JSON.stringify(d2);
    return j1 === j2;
  }

  /**
   * getVideosourceErrorMsg
   *
   * @private
   * @param {} state
   * @returns {}
   * @memberof VideoManagementComponent
   */
  public getVideosourceErrorMsg(state: string): string {
    if (this.videosourceErrorMsgs.size === 0) {
      this.videosourceErrorMsgs.set(notReachable, '');
      this.videosourceErrorMsgs.set('*Fault', this.videoManagementControlComponent.templateStrings.videoSourceFault);
      this.videosourceErrorMsgs.set('*Disabled', this.videoManagementControlComponent.templateStrings.videoSourceDisabled);
      this.videosourceErrorMsgs.set('*Unknown', this.videoManagementControlComponent.templateStrings.videoSourceUnknown);
      this.videosourceErrorMsgs.set('*NothingToShow', '');
    }

    if (state === notReachable) {
      this.setCameraErrorMessage();
    }

    return this.videosourceErrorMsgs.get(state);
  }

  /**
   * getFrameSpacing
   *
   * @memberof SnapinUtilities
   */
  public getFrameSpacing(): Observable<void> {
    return new Observable(observer => {
      this.videoManagementService.getFrameSpacing().subscribe(
        (fs: string) => {
          this.frameSpacing = parseInt(fs, 10);
          if ((this.frameSpacing === 0) || (isNaN(this.frameSpacing))) {
            this.frameSpacing = defaultFrameSpacing;
          }
          observer.next();
        },
        (error: any) => {
          this.frameSpacing = defaultFrameSpacing;
          observer.next();
        });
    });
  }

  /**
   * startRefreshSnapshot
   *
   * @memberof SnapinUtilities
   */
  public startRefreshSnapshot(): void {
    this.videoManagementControlComponent.showSnapshot = true;
    this.refreshSnapshotDataCallback();

    if (this.intervalRefreshSnapshot === undefined) {
      const fs = this.frameSpacing !== 0 ? this.frameSpacing : defaultFrameSpacing;
      this.usedFrameSpacing = fs;
      this.intervalRefreshSnapshot = setInterval(() => this.refreshSnapshotDataCallback(), fs);
    }
  }

  /**
   * stopRefreshSnapshot
   *
   * @public
   * @memberof SnapinUtilities
   */
  public stopRefreshSnapshot(): void {
    if (this.intervalRefreshSnapshot !== undefined) {
      clearInterval(this.intervalRefreshSnapshot);
      this.intervalRefreshSnapshot = undefined;
    }

    if (this.resizeObserverSubscription !== undefined) {
      this.resizeObserverSubscription.unsubscribe();
      this.resizeObserverSubscription = undefined;
    }

    this.videoManagementControlComponent.showSnapshot = false;
    this.videoManagementControlComponent.snapshotData.imageData = '';
  }

  /**
   * showSnapshotImage
   *
   * @public
   * @returns {}
   * @memberof SnapinUtilities
   */
  public showSnapshotImage(): void {
    this.videoManagementControlComponent.view = [];
    const img = this.getElementByName('Snapshot') as HTMLImageElement;
    if (isNullOrUndefined(img)) {
      return;
    }
    if (this.videoManagementControlComponent.snapshotData.imageData.endsWith('undefined')) {
      return;
    }

    // set image buffer
    img.src = this.videoManagementControlComponent.snapshotData.imageData;
  }

  /**
   * onSnapshotLoad
   *
   * @memberof SnapinUtilities
   */
  public onSnapshotLoad(event): void {
    const img = event.target;

    this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'showSnapshotImage(1): %s %s %s %s %s',
      img.height, img.width, this.videoManagementControlComponent.snapshotData.imageData.length, img.naturalHeight, img.naturalWidth);

    /*
    code kept RFU... const parent = !this.videoManagementControlComponent.isInAssistedMode
    code kept RFU...   ? (img.parentElement.parentElement.parentElement).parentElement.parentElement.parentElement.parentElement
    code kept RFU...   : (img.parentElement.parentElement.parentElement).parentElement.parentElement.parentElement.parentElement;
    */
    const parent = (img.parentElement.parentElement.parentElement).parentElement.parentElement.parentElement.parentElement;
    let parentClientWidth = parent.clientWidth;
    const parentClientHeight = parent.clientHeight;
    let imgWidth = img.width;
    let imgHeight = img.height;

    if (this.oldParentClientWidth === 0) {
      this.oldParentClientWidth = parentClientWidth;
    } else if (Math.abs(this.oldParentClientWidth - parentClientWidth) < 13) {
      parentClientWidth = this.oldParentClientWidth;
    }

    const zoomFactor = this.videoManagementControlComponent.graphic.zoomFactor;
    [imgWidth, imgHeight] = this.applyZoomFactor(zoomFactor, img, imgWidth, imgHeight, parentClientWidth, parentClientHeight);
    this.videoManagementControlComponent.graphic.oldZoomFactor = this.videoManagementControlComponent.graphic.zoomFactor;

    const isScrollbarVisible = imgHeight - 32 > parentClientHeight || imgWidth - 32 > parentClientWidth;

    [imgWidth, imgHeight] = this.setContainerDiv(img, isScrollbarVisible, imgWidth, imgHeight, parentClientWidth, parentClientHeight);
    img.width = imgWidth;
    img.height = imgHeight;

    this.setImageBorder(img);

    this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'showSnapshotImage(2): %s %s %s %s %s %s %s',
      imgHeight, imgWidth, this.videoManagementControlComponent.snapshotData.imageData.length, img.naturalHeight, img.naturalWidth,
      parentClientHeight, parentClientWidth);

    this.setButtonsPosition(imgHeight, imgWidth, parentClientHeight, parentClientWidth);
  }

  /**
   * getObjectNames
   *
   * @param {} obj
   * @returns {}
   * @memberof SnapinUtilities
   */
  public getObjectNames(obj: VMSMonitorWallData): Map<string, Map<string, string>> {
    const data: VMSMonitorData[] = obj.sinks;
    const names: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    let pos = 0;

    if (data !== undefined) {
      pos += 1;
      names.set(`mngr${obj.monitorGroupId}`, new Map<string, string>());
      data.forEach(element => {
        pos += 1;
        names.set(`mntr${element.id}`, new Map<string, string>());
        pos += 1;
        names.set(`src${element.cameraName}`, new Map<string, string>());
      });
    } else {
      const ob: VMSMonitorData = JSON.parse(JSON.stringify(obj));
      pos += 1;
      names.set(`mntr${ob.id}`, new Map<string, string>());
      pos += 1;
      names.set(`src${ob.cameraName}`, new Map<string, string>());
    }

    return names;
  }

  /**
   * setObjectNames
   *
   * @param {} obj
   * @param {} names
   * @returns {}
   * @memberof SnapinUtilities
   */
  public setObjectNames(obj: VMSMonitorWallData, names: Map<string, Map<string, string>>): string {
    let title: string;

    const data: VMSMonitorData[] = obj.sinks;
    if (data !== undefined) {
      const vmsMonGroupDesc = obj.monitorGroupDescription;
      const cnsMonGroupDesc = this.getCnsDescription(`mngr${obj.monitorGroupId}`, names);
      this.videoManagementControlComponent.vmsDescriptions.set(cnsMonGroupDesc, vmsMonGroupDesc);

      obj.monitorGroupDescription = cnsMonGroupDesc;

      for (let pos = 0; pos < data.length; pos++) {
        const vmsMonDesc = obj.sinks[pos].monitorDescription;
        const cnsMonDesc = this.getCnsDescription(`mntr${obj.sinks[pos].id}`, names);
        this.videoManagementControlComponent.vmsDescriptions.set(cnsMonDesc, vmsMonDesc);

        obj.sinks[pos].monitorDescription = cnsMonDesc;
        obj.sinks[pos].cameraDescription = this.getCnsDescription(`src${obj.sinks[pos].cameraName}`, names);
      }
      title = obj.monitorGroupDescription;
    } else {
      const ob: VMSMonitorData = JSON.parse(JSON.stringify(obj));

      const vmsMonDesc = ob.monitorDescription;
      const cnsMonDesc = this.getCnsDescription(`mntr${ob.id}`, names);
      this.videoManagementControlComponent.vmsDescriptions.set(cnsMonDesc, vmsMonDesc);

      ob.monitorDescription = cnsMonDesc;
      obj.monitorDescription = ob.monitorDescription;
      ob.cameraDescription = this.getCnsDescription(`src${ob.cameraName}`, names);
      obj.cameraDescription = ob.cameraDescription;
      title = ob.monitorDescription;
    }
    return title;
  }

  /**
   * executeXCommand
   *
   * @public
   * @param {} svgobjName
   * @memberof SnapinUtilities
   */
  public executeXCommand(svgobjName: string): void {
    if (this.videoManagementControlComponent.monitorWallTiles[svgobjName].monitorStatus !== MonitorStatus.DisconnectStream) {
      this.videoManagementControlComponent.monitorWallTiles[svgobjName].monitorStatus = MonitorStatus.DisconnectStream;
      this.videoManagementControlComponent.monitorWallTiles[svgobjName].hasS1Command = false;
      this.videoManagementControlComponent.monitorWallTiles[svgobjName].hasSNCommand = false;
      this.commands.push({ commandName: 'X', commandParameter: svgobjName });
      this.videoManagementControlComponent.forceUIRefresh();
    }
  }

  /**
   * executeOCommand
   *
   * @public
   * @param {} svgobjName
   * @memberof SnapinUtilities
   */
  public executeOCommand(svgobjName: string): void {
    if (this.videoManagementControlComponent.monitorWallTiles[svgobjName].monitorStatus !== MonitorStatus.DisconnectStream) {
      this.videoManagementControlComponent.monitorWallTiles[svgobjName].hasS1Command = false;
      this.videoManagementControlComponent.monitorWallTiles[svgobjName].hasSNCommand = false;
      this.commands.push({ commandName: 'O', commandParameter: svgobjName });
      this.videoManagementControlComponent.forceUIRefresh();
    }
  }

  /**
   * executeCommand
   *
   * @public
   * @param {} commandId
   * @param {} svgobjName
   * @memberof SnapinUtilities
   */
  public executeCommand(commandId: string, svgobjName: string): void {
    this.commands.push({ commandName: commandId, commandParameter: svgobjName });
    this.videoManagementControlComponent.forceUIRefresh();
  }

  /**
   * executeCommands
   *
   * @memberof SnapinUtilities
   */
  public executeCommands(): void {
    this.videoManagementControlComponent.traceService.info(TraceModules.videoSnapIn, '<<<<< ExecuteCommands >>>>>');
    let startRefreshLoop = false;

    // execute all pending commands
    this.commands.forEach(value => {
      switch (value.commandName) {
        case 'X':
          this.executeCommandX(value.commandParameter);
          startRefreshLoop = true;
          break;

        case 'O':
          this.executeCommandO(value.commandParameter);
          startRefreshLoop = true;
          break;

        case 'A':
        case 'A_CG':
        case 'A_Se':
        case 'A_Ca':
        case 'A_MR':
          this.executeCommandA(value.commandName, value.commandParameter);
          break;

        default:
          this.videoManagementControlComponent.traceService.error(TraceModules.videoSnapIn, `executeCommands - Unknown command: ${value.commandName}`);
          break;
      }
    });

    // start the refresh loop, if needed
    if (this.commands.length > 0 && startRefreshLoop) {
      this.videoManagementControlComponent.startRefreshLoop();
    }

    // reset the commands list
    this.commands = [];
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * setActions
   *
   * @param {} node
   * @param {} name
   * @param {} descriptor
   * @param {} connected
   * @param {} sequenceRunning
   * @memberof SnapinUtilities
   */
  public setActions(node: NodeType, name: string, descriptor: string, connected: boolean, sequenceRunning: boolean): void {
    node.actions.push({
      title: this.videoManagementControlComponent.templateStrings.connectCamera, action: () => {
        this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Connect Camera clicked: %s %s', name, descriptor);
        this.executeCommand('A_Ca', name);
      }
    });
    node.actions.push({
      title: this.videoManagementControlComponent.templateStrings.connectCameraGroup, action: () => {
        this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Connect Camera Group clicked: %s %s', name, descriptor);
        this.executeCommand('A_CG', name);
      }
    });
    node.actions.push({
      title: this.videoManagementControlComponent.templateStrings.connectSequence, action: () => {
        this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Connect Sequence clicked: %s %s', name, descriptor);
        this.executeCommand('A_Se', name);
      }
    });
    node.actions.push({
      title: this.videoManagementControlComponent.templateStrings.disconnectStream, action: () => {
        this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Disconnect Stream clicked: %s %s', name, descriptor);
        this.executeXCommand(name);
      }
    });
    node.actions.push({
      title: this.videoManagementControlComponent.templateStrings.stopSequence, action: () => {
        this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Stop Sequence clicked: %s %s', name, descriptor);
        this.executeOCommand(name);
      }
    });

    if (!this.isMonitorGroup(this.videoManagementControlComponent.selectedObjectName)) {
      node.actions[1].disabled = true;
      node.actions[2].disabled = true;
    }
    if (!connected) {
      node.actions[3].disabled = true;
    }
    if (!sequenceRunning) {
      node.actions[4].disabled = true;
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * isMatch
   *
   * @param {} name
   * @param {} location
   * @param {} filter
   * @returns {}
   * @memberof SnapinUtilities
   */
  public isMatch(name: string, location: string, filter: string): boolean {
    if (name === null || location === null) {
      return false;
    }
    if (isNullOrUndefined(filter)) {
      filter = '';
    }

    return (RegExp(filter.trim().toLowerCase()).exec(name?.toLowerCase())?.length > 0 ||
            RegExp(filter.trim().toLowerCase()).exec(location?.toLowerCase())?.length > 0);
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * getElementByName
   *
   * @param {} name
   * @returns {}
   * @memberof SnapinUtilities
   */
  public getElementByName(name: string): HTMLElement {
    const elements = document.getElementsByName(name);
    this.videoManagementControlComponent.traceService.info(TraceModules.videoSnapIn, 'getElementByName() %s %s', name, elements);

    if (elements == null || elements.length === 0) {
      return undefined;
    }

    let paneId = this.videoManagementControlComponent.location.paneId;
    if (this.videoManagementControlComponent.isInAssistedMode) {
      paneId = 'primary-pane';
    }
    const isPrimary = paneId.includes('primary-pane') || paneId.includes('single');
    const paneNumber = isPrimary ? 1 : 2;
    let snapInId = this.videoManagementControlComponent.snapInId.snapInId;
    if (this.videoManagementControlComponent.isInAssistedMode) {
      snapInId = 'vid-view-single';
    }
    if ((snapInId === 'vid-view' || snapInId === 'vid-view-single') && paneNumber === 1) {
      return elements[0];
    }
    if (snapInId === 'vid-view-comparison' && paneNumber === 2) {
      return elements[elements.length - 1];
    }
    this.videoManagementControlComponent.traceService.error(
      TraceModules.videoSnapIn, `getElementByName() - Unknown SnapInId: ${this.videoManagementControlComponent.snapInId.snapInId}`);
    return undefined;
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * getIcons
   *
   * @param {} iconMapperService
   * @memberof SnapinUtilities
   */
  public getIcons(iconMapperService: SiIconMapperService): void {
    // get camera and sequence icons
    this.videoManagementControlComponent.cameraIcon = iconMapperService.getGlobalIconSync(TablesEx.ObjectTypes, cameraObjectType);
    this.videoManagementControlComponent.sequenceIcon = iconMapperService.getGlobalIconSync(TablesEx.ObjectTypes, sequenceObjectType);
    if (this.videoManagementControlComponent.sequenceIcon === this.videoManagementControlComponent.cameraIcon) {
      this.videoManagementControlComponent.sequenceIcon = 'element-repeat';
    }

    this.videoManagementControlComponent.monitorIcon = iconMapperService.getGlobalIconSync(TablesEx.ObjectTypes, monitorObjectType);
    this.videoManagementControlComponent.monitorGroupIcon = iconMapperService.getGlobalIconSync(TablesEx.ObjectTypes, monitorGroupObjectType);
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * getMonitorWallObjects
   *
   * @returns {}
   * @memberof SnapinUtilities
   */
  public getMonitorWallObjects(): string[] {
    const monitorWallObjects: string[] = ['Video'];

    if (this.videoManagementControlComponent.monitorWallData !== null && this.videoManagementControlComponent.monitorWallData !== undefined) {
      const data: VMSMonitorData[] = this.videoManagementControlComponent.monitorWallData.sinks;
      if (data !== undefined) {
        data.forEach(entry => {
          monitorWallObjects.push(`mntr${entry.id}`);
        });
        monitorWallObjects.push(`mngr${this.videoManagementControlComponent.monitorWallData.monitorGroupId}`);
      } else {
        const entry: VMSMonitorData = JSON.parse(JSON.stringify(this.videoManagementControlComponent.monitorWallData));
        monitorWallObjects.push(`mntr${entry.id}`);
      }
    }

    return monitorWallObjects;
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * assignHeading
   *
   * @param {} label
   * @returns {}
   * @memberof SnapinUtilities
   */
  public assignHeading(label: CnsLabel): void {
    if (this.videoManagementControlComponent.entries.length === 0) {
      return;
    }

    if (isNullOrUndefined(label)) {
      this.videoManagementControlComponent.entries.forEach(entry => {
        this.videoManagementControlComponent.monitorWallTiles[entry].monitorTitle = this.videoManagementControlComponent.monitorWallTiles[entry].monitorName;
      });
    } else if (label.cnsLabel === CnsLabelEn.Description ||
        label.cnsLabel === CnsLabelEn.DescriptionAndAlias ||
        label.cnsLabel === CnsLabelEn.DescriptionAndName) {
      this.videoManagementControlComponent.entries.forEach(entry => {
        this.videoManagementControlComponent.monitorWallTiles[entry].monitorTitle =
            this.videoManagementControlComponent.monitorWallTiles[entry].monitorDescription;
        this.videoManagementControlComponent.monitorWallTiles[entry].cameraTitle =
            this.videoManagementControlComponent.monitorWallTiles[entry].cameraDescription;
      });
    } else {
      this.videoManagementControlComponent.entries.forEach(entry => {
        this.videoManagementControlComponent.monitorWallTiles[entry].monitorTitle =
           this.videoManagementControlComponent.monitorWallTiles[entry].monitorName;
        this.videoManagementControlComponent.monitorWallTiles[entry].cameraTitle =
           this.videoManagementControlComponent.monitorWallTiles[entry].cameraName;
      });
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * onTranslateStrings
   *
   * @param {} strings
   * @memberof SnapinUtilities
   */
  public onTranslateStrings(strings: Record<string, unknown>): void {
    this.videoManagementControlComponent.templateStrings = {
      monitor: strings.MONITOR,
      monitorGroup: strings.MONITOR_GROUP,
      camera: strings.CAMERA,
      cameraStatus: strings.CAMERA_STATUS,
      cameraType: strings.CAMERA_TYPE,
      omDialogTitle: strings.OM_DIALOG_TITLE,
      maxClientsNumber: strings.MAX_CLIENTS_NUMBER,
      videoSourceNotReachable: strings.VIDEOSOURCE_NOT_REACHABLE,
      videoSourceFault: strings.VIDEOSOURCE_FAULT,
      videoSourceDisabled: strings.VIDEOSOURCE_DISABLED,
      videoSourceUnknown: strings.VIDEOSOURCE_UNKNOWN,
      videoSourceNoVmsLicense: strings.VIDEOSOURCE_NO_VMS_LICENSE,
      videoSourceTimeout: '',
      videoObjectDeleted: strings.VIDEO_OBJECT_DELETED,
      videoAPINotReachable: strings.VIDEO_API_NOT_REACHABLE,
      videoManagerNotReachable: strings.VIDEO_MANAGER_NOT_REACHABLE,
      vmsNotReachable: strings.VMS_NOT_REACHABLE,
      vmsSynchronizing: strings.VMS_SYNCHRONIZING,
      videoDisconnected: strings.VIDEO_DISCONNECTED,
      videoDisconnectedNotAligned: strings.VIDEO_DISCONNECTED_NOT_ALIGNED,
      connectStream: strings.CONNECT_STREAM,
      connectCamera: strings.CONNECT_CAMERA,
      connectCameraGroup: strings.CONNECT_CAMERA_GROUP,
      connectSequence: strings.CONNECT_SEQUENCE,
      disconnectStream: strings.DISCONNECT_STREAM,
      stopSequence: strings.STOP_SEQUENCE,
      searchFilterWatermark: strings.SEARCH_FILTER_WATERMARK,
      nothingToShow: strings.NOTHING_TO_SHOW,
      sequenceFirstMonitor: strings.SEQUENCE_FIRST_MONITOR,
      sequenceSubsequentMonitor: strings.SEQUENCE_SUBSEQUENT_MONITOR,
      playback: strings.PLAYBACK,
      connected: strings.CONNECTED,
      disabled: strings.DISABLED,
      faulty: strings.FAULTY,
      commandError: strings.COMMAND_ERROR,
      commandExecutionFailed: strings.COMMAND_EXECUTION_FAILED,
      live: strings.LIVE
    } as TemplateStrings;

    if (this.videoManagementService.setValidationDialogData !== undefined) {
      this.videoManagementService.setValidationDialogData(
        this.videoManagementControlComponent.validationDialogService,
        this.videoManagementControlComponent.templateStrings.commandError,
        this.videoManagementControlComponent.templateStrings.commandExecutionFailed);
    }
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * connectSelectedObjectCU
   *
   * @memberof SnapinUtilities
   */
  public connectSelectedObjectCU(): void {
    switch (this.videoManagementControlComponent.selectedObjectOM) {
      case 'GMS_VIDEO_Camera':
        const monitorName: string = this.videoManagementControlComponent.monitorWallTiles[this.videoManagementControlComponent.entries[0]].monitorDescription;
        const cameraName: string = this.videoManagementControlComponent.selectedObjectName;

        this.videoManagementService.connectStream(this.videoManagementControlComponent.vmsDescriptions.get(monitorName), cameraName)
          .subscribe((status: any) => {
            this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Status ConnectStream: %s', status);
            this.videoManagementControlComponent.refreshMonitorWallData();
          });
        break;

      case 'GMS_VIDEO_CameraGroup':
        const videoSinkGroupName: string =
         this.videoManagementControlComponent.monitorWallTiles[this.videoManagementControlComponent.entries[0]].monitorGroupDescription;
        const videoSinkToStartAt = 1;
        const videoSourceGroupDP: string = this.videoManagementControlComponent.selectedObjectName;

        this.videoManagementService.connectStreams(
          this.videoManagementControlComponent.vmsDescriptions.get(videoSinkGroupName), videoSinkToStartAt, videoSourceGroupDP).subscribe((status: any) => {
          this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Status ConnectStreams: %s', status);
          this.videoManagementControlComponent.refreshMonitorWallData();
        });
        break;

      case 'GMS_VIDEO_Sequence':
        const monitorGroupName: string =
          this.videoManagementControlComponent.monitorWallTiles[this.videoManagementControlComponent.entries[0]].monitorGroupDescription;
        const monitorPosition = 1;
        const videoSequenceDP: string = this.videoManagementControlComponent.selectedObjectName;
        this.videoManagementService.startSequence(
          this.videoManagementControlComponent.vmsDescriptions.get(monitorGroupName), monitorPosition, videoSequenceDP).subscribe((status: any) => {
          this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Status StartSequence %s', status);
          this.videoManagementControlComponent.refreshMonitorWallData();
        });
        break;

      default:
        // NOP
        break;
    }
  }

  /**
   * subscribeAndManageCameraStatus
   *
   * @private
   * @returns {}
   * @memberof VideoManagementComponent
   */
  public subscribeAndManageCameraStatus(): void {
    if (this.videoManagementControlComponent.selectedObjectOM !== 'GMS_VIDEO_Camera') {
      return;
    }

    if (this.videoManagementControlComponent.selectedObjectName.startsWith('NoCamera')) {
      this.setCameraSelectionComboVisibility(false);
      this.videoManagementControlComponent.selectedCameraStatus = '*';
      this.videoManagementControlComponent.selectedCameraDeleted = true;
      this.videoManagementControlComponent.forceUIRefresh();
      return;
    }

    if (this.videoManagementControlComponent.cameraStatusNotificationSubscription !== undefined) {
      this.videoManagementService.
        unsubscribeCameraStatusNotification(this.videoManagementControlComponent.cameraStatusNotificationSubscription,
          this.videoManagementControlComponent.clientIdValueSubscription2);
      this.videoManagementControlComponent.cameraStatusNotificationSubscription = undefined;
    }

    // subscribe & manage changes to camera status
    if (this.videoManagementControlComponent.clientIdValueSubscription2 !== '') {
      this.videoManagementControlComponent.cameraStatusNotificationSubscription =
                this.videoManagementService.subscribeCameraStatusNotification(this.videoManagementControlComponent.clientIdValueSubscription2,
                  this.videoManagementControlComponent.selectedObjectName);
      this.videoManagementControlComponent.cameraStatusNotificationSubscription.changed.subscribe((valueDetails: ValueDetails) => {
        this.videoManagementControlComponent.selectedCameraStatus = valueDetails.Value.Value;
        this.videoManagementControlComponent.selectedCameraDeleted = valueDetails.ErrorCode !== 0;
        this.videoManagementControlComponent.forceUIRefresh();
      });
    }
  }

  /**
   * processRequest
   *
   * @public
   * @param {} browserObject
   * @returns {}
   * @memberof VideoManagementComponent
   */
  public processRequest(browserObject: BrowserObject): void {
    this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'processRequest: %s', browserObject);

    this.stopRefreshSnapshot();

    // save tile control position for previous selected object and
    // restore for current selected object
    this.videoManagementControlComponent.saveToStorageService(this.videoManagementControlComponent.selectedObjectDesignation);
    this.videoManagementControlComponent.restoreFromStorageService(browserObject.Designation);
    this.videoManagementControlComponent.scrollHasBeenRestored = false;

    // save selected object data
    this.videoManagementControlComponent.selectedObjectName = browserObject.Name;
    this.videoManagementControlComponent.selectedObjectDescription = browserObject.Descriptor;
    this.videoManagementControlComponent.selectedObjectOM = browserObject.Attributes.ObjectModelName;
    this.videoManagementControlComponent.selectedObjectLocation = browserObject.Location;
    this.videoManagementControlComponent.selectedObjectDesignation = browserObject.Designation;
    this.videoManagementControlComponent.selectedObjectSystemName = (browserObject.Designation.split('.'))[0];
    this.videoManagementControlComponent.selectedObjectChanged = true;

    this.videoManagementControlComponent.graphic.resetZoomToPermScaleToFit();

    if (this.videoManagementControlComponent.selectedObjectOM === 'GMS_VIDEO_Camera') {
      this.subscribeAndManageCameraStatus();

      if (this.videoManagementControlComponent.videoConnected) {
        // connect selected object
        // code kept RFU... this . videoManagement Control Component . connect Selected Object Com ( ) ;
      }

      // start refresh snapshot
      this.startRefreshSnapshot();
    } else {
      if (this.videoManagementControlComponent.maxClientsNumber || this.videoManagementControlComponent.isVideoSourceError()) {
        this.videoManagementControlComponent.maxClientsNumber = false;
        this.videoManagementControlComponent.videoSourceErrorState = '';
        this.videoManagementControlComponent.showErrorMessage = false;
        this.videoManagementControlComponent.errorMessage = '';
        this.resetErrorIcon();
      }

      // stop refresh snapshot
      this.stopRefreshSnapshot();

      // connect selected object
      // code kept RFU... this . video Management Control Component . connect Selected Object Com ( ) ;

      // HTML must be updated
      this.videoManagementControlComponent.forceUIRefresh();
    }

    // refresh monitor wall data
    this.videoManagementControlComponent.refreshMonitorWallData();
  }

  /**
   * resetErrorIcon
   *
   * @public
   * @memberof VideoManagementComponent
   */
  public resetErrorIcon(): void {
    if (this.videoManagementControlComponent.errorIcon !== '') {
      this.videoManagementControlComponent.graphic.resetZoomToPermScaleToFit();
    }
    this.videoManagementControlComponent.errorIcon = '';
  }

  /**
   * copyNodes
   *
   * @public
   * @param {} nodes
   * @memberof VideoManagementComponent
   */
  public copyNodes(nodes: NodeType[]): void {
    if (nodes.length > 0) {
      if (this.videoManagementControlComponent.selectedObjectChanged) {
        // reset view data
        this.videoManagementControlComponent.view = [];
        this.videoManagementControlComponent.selectedObjectChanged = false;
      }
      const len = Math.min(this.videoManagementControlComponent.view.length, nodes.length);
      for (let pos = 0; pos < len; pos++) {
        NodeUtilities.copyNode(this.videoManagementControlComponent.view[pos], nodes[pos]);
      }
      if (nodes.length > this.videoManagementControlComponent.view.length) {
        for (let pos = this.videoManagementControlComponent.view.length; pos < nodes.length; pos++) {
          this.videoManagementControlComponent.view.push(nodes[pos]);
        }
      } else if (nodes.length < this.videoManagementControlComponent.view.length) {
        this.videoManagementControlComponent.view.splice(nodes.length, this.videoManagementControlComponent.view.length - nodes.length);
      }
    }
  }

  /**
   * setHfwPanelNavigationHeight
   *
   * @param {} cameraSelectionComboVisible
   * @memberof SnapinUtilities
   */
  public setHfwPanelNavigationHeight(cameraSelectionComboVisible: boolean): void {
    const hpn: HTMLElement = this.getElementByName('hfw-panel-navigation');
    const vtvc: HTMLElement = this.getElementByName('videoTilesViewControl');
    if (!isNullOrUndefined(hpn) && !isNullOrUndefined(vtvc)) {
      hpn.style.height = (+vtvc.style.height.replace('px', '') - 16).toString();
      this.setCameraSelectionComboVisibility(cameraSelectionComboVisible);
    }
  }

  /**
   * resetHfwPanelNavigationHeight
   *
   * @memberof SnapinUtilities
   */
  public resetHfwPanelNavigationHeight(): void {
    const hpn: HTMLElement = this.getElementByName('hfw-panel-navigation');
    if (!isNullOrUndefined(hpn)) {
      hpn.style.height = '';
    }
  }

  /**
   * setCameraSelectionComboVisibility
   *
   * @param {} visible
   * @memberof SnapinUtilities
   */
  public setCameraSelectionComboVisibility(visible: boolean): void {
    if (document.getElementById(this.videoManagementControlComponent.contentVidViewClient) != null) {
      const csc: HTMLElement = this.getElementByName('cameraSelectionCombo');
      if (!isNullOrUndefined(csc)) {
        csc.style.visibility = visible ? 'visible' : 'hidden';
      }
    }
  }

  /**
   *setCameraErrorMessage
   *
   * @private
   * @memberof VideoManagementComponent
   */
  private setCameraErrorMessage(): void {
    // 0    Unknown
    // 1    Reachable
    // 2    Fault
    // 3    Disabled
    // 4    No VMS License
    if (this.cameraStateErrorMsgs.size === 0) {
      this.cameraStateErrorMsgs.set('0', this.videoManagementControlComponent.templateStrings.videoSourceUnknown);
      this.cameraStateErrorMsgs.set('1', this.videoManagementControlComponent.templateStrings.videoSourceTimeout);
      this.cameraStateErrorMsgs.set('2', this.videoManagementControlComponent.templateStrings.videoSourceFault);
      this.cameraStateErrorMsgs.set('3', this.videoManagementControlComponent.templateStrings.videoSourceDisabled);
      this.cameraStateErrorMsgs.set('4', this.videoManagementControlComponent.templateStrings.videoSourceNoVmsLicense);
    }

    this.videoManagementControlComponent.errorMessage = this.cameraStateErrorMsgs.get(this.videoManagementControlComponent.selectedCameraStatus);
    if (this.videoManagementControlComponent.selectedCameraDeleted) {
      this.videoManagementControlComponent.errorMessage =
        this.videoManagementControlComponent.templateStrings.videoObjectDeleted.replace('{{deletedObjectType}}',
          this.videoManagementControlComponent.templateStrings.camera);
      if (this.videoManagementControlComponent.selectedObjectName.startsWith('NoCamera')) {
        this.setCameraSelectionComboVisibility(false);
        this.videoManagementControlComponent.errorMessage = this.videoManagementControlComponent.templateStrings.nothingToShow;
        if (this.videoManagementControlComponent.selectedObjectName === 'NoCameraWC') {
          this.videoManagementControlComponent.errorMessage += ' (Wrong configuration)';
        }
      }
    }
    if (this.videoManagementControlComponent.errorMessage === '') {
      this.videoManagementControlComponent.errorIcon = '';
    }
  }

  /**
   * refreshSnapshotDataCallback
   *
   * @private
   * @memberof SnapinUtilities
   */
  private refreshSnapshotDataCallback(): void {
    if (this.frameSpacing !== this.usedFrameSpacing) {
      this.usedFrameSpacing = this.frameSpacing;
      clearInterval(this.intervalRefreshSnapshot);
      this.intervalRefreshSnapshot = setInterval(() => this.refreshSnapshotDataCallback(), this.frameSpacing);
    }

    this.videoManagementControlComponent.refreshSnapshotData();
  }

  /**
   * applyZoomFactor
   *
   * @private
   * @param {} zoomFactor
   * @param {} img
   * @param {} imgWidth
   * @param {} parentClientWidth
   * @param {} parentClientHeight
   * @returns {}
   * @memberof SnapinUtilities
   */
  private applyZoomFactor(zoomFactor: number, img: HTMLImageElement, imgWidth: number, imgHeight: number,
    parentClientWidth: number, parentClientHeight: number): [number, number] {
    if (this.videoManagementControlComponent.graphic.isPermScaleToFit ||
      Math.abs(zoomFactor - 1.0) < 0.1 && this.videoManagementControlComponent.graphic.oldZoomFactor !== zoomFactor) {
      // image resize  logic
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;

      const imgOk = this.checkImgOk(img, nh, nw);
      imgWidth = img.width;
      imgHeight = img.height;

      const pcw = parentClientWidth * zoomFactor;
      const pch = parentClientHeight * zoomFactor;

      [imgWidth, imgHeight] = this.resizeImage(pcw, pch, imgOk, imgWidth, imgHeight, nw, nh);

      if (imgWidth > pcw) {
        imgHeight = imgHeight * pcw / imgWidth;
        imgWidth = pcw;
      }
      if (imgHeight > pch) {
        imgWidth = imgWidth * pch / imgHeight;
        imgHeight = pch;
      }
    } else if (this.videoManagementControlComponent.graphic.oldZoomFactor !== zoomFactor) {
      const zoom = zoomFactor / this.videoManagementControlComponent.graphic.oldZoomFactor;
      imgWidth *= zoom;
      imgHeight *= zoom;
    }
    return [imgWidth, imgHeight];
  }

  /**
   * resizeImage
   *
   * @private
   * @param {} pcw
   * @param {} pch
   * @param {} imgOk
   * @param {} imgWidth
   * @param {} imgHeight
   * @param {} nw
   * @param {} nh
   * @returns {}
   * @memberof SnapinUtilities
   */
  private resizeImage(pcw: number, pch: number, imgOk: boolean, imgWidth: number, imgHeight: number,
    nw: number, nh: number): [number, number] {
    const d1 = pcw - (imgOk ? imgWidth : nw);
    const d2 = pch - (imgOk ? imgHeight : nh);
    if (d1 < d2) {
      imgWidth = pcw;
      imgHeight = pcw * nh / nw;
    } else {
      imgHeight = pch;
      imgWidth = pch * nw / nh;
    }
    return [imgWidth, imgHeight];
  }

  /**
   * setContainerDiv
   *
   * @private
   * @param {} img
   * @param {} isScrollbarVisible
   * @param {} imgWidth
   * @param {} imgHeight
   * @param {} parentClientWidth
   * @param {} parentClientHeight
   * @returns {}
   * @memberof SnapinUtilities
   */
  private setContainerDiv(img: HTMLImageElement, isScrollbarVisible: boolean, imgWidth: number, imgHeight: number,
    parentClientWidth: number, parentClientHeight: number): [number, number] {
    // code kept RFU... console.log('+++', this.videoManagementControlComponent.graphic.zoomFactor);
    const containerDiv = img.parentElement;
    if (isScrollbarVisible) {
      let height = parentClientHeight;
      let width = parentClientWidth;
      // code kept RFU... if (this.videoManagementControlComponent.isInAssistedMode) {
      height -= 32;
      width -= 32;
      // code kept RFU... }

      containerDiv.style.height = height.toString();
      containerDiv.style.width = width.toString();
      containerDiv.style.top = '0';

      // code kept RFU... if (this.videoManagementControlComponent.isInAssistedMode) {
      containerDiv.style.top = '8';
      const delta = Math.abs(this.videoManagementControlComponent.graphic.zoomFactor - this.videoManagementControlComponent.graphic.zoomIncrement);
      const move = (parentClientWidth - imgWidth) / 2;

      containerDiv.style.left = '';
      containerDiv.style.right = '';
      containerDiv.style.overflowY = '';
      if (delta < 0.1) {
        containerDiv.style.left = (move / 2).toString();
        containerDiv.style.right = (-move / 2).toString();
        containerDiv.style.overflowY = 'scroll';
      }

      containerDiv.style.width = (width - move).toString();
      // code kept RFU... }
    } else {
      if ((this.videoManagementControlComponent.graphic.isPermScaleToFit ||
           Math.abs(this.videoManagementControlComponent.graphic.zoomFactor - 1) < 0.1) &&
          (Math.abs(parentClientWidth - imgWidth) < 32 || Math.abs(parentClientHeight - imgHeight) < 32)) {
        imgHeight -= 32;
        imgWidth -= 32;
      }
      containerDiv.style.height = '';
      containerDiv.style.width = '';
      containerDiv.style.top = ((parentClientHeight - imgHeight) / 2).toString();
      containerDiv.style.left = '';
      containerDiv.style.right = '';
      containerDiv.style.overflowY = '';
    }

    this.setHfwPanelNavigationHeight(!this.videoManagementControlComponent.selectedObjectName.startsWith('NoCamera'));
    return [imgWidth, imgHeight];
  }

  /**
   * setButtonsPosition
   *
   * @private
   * @param {} imgHeight
   * @param {} imgWidth
   * @param {} parentClientHeight
   * @param {} parentClientWidth
   * @returns {}
   * @memberof SnapinUtilities
   */
  private setButtonsPosition(imgHeight: number, imgWidth: number,
    parentClientHeight: number, parentClientWidth: number): void {
    const buttons = this.getElementByName('SnapshotButtons');
    if (isNullOrUndefined(buttons)) {
      return;
    }

    if (this.videoManagementControlComponent.graphic.initialBottom === undefined) {
      this.videoManagementControlComponent.graphic.initialBottom = parseInt(buttons.style.bottom, 10);
      this.max8px = 0;
    }

    this.setScrollbarsPosition();

    /*
    code kept RFU... const isScrollbarVisible = imgHeight - 32 > parentClientHeight || imgWidth - 32 > parentClientWidth;
    code kept RFU... let incr = 32;
    code kept RFU... if (this.videoManagementControlComponent.isInAssistedMode) {
    code kept RFU...   incr = 64;
    code kept RFU... }
    code kept RFU... const bottom = !isScrollbarVisible &&
    code kept RFU...   (!this.videoManagementControlComponent.isInAssistedMode || this.videoManagementControlComponent.graphic.zoomFactor < 1.0)
    code kept RFU...   ? 40 // this.videoManagementControlComponent.graphic.initialBottom - parentClientHeight + incr + imgHeight
    code kept RFU...   : 40;
    */
    const bottom = 40;
    buttons.style.bottom = bottom.toString();
    this.max8px += 1;
    if (buttons.style.bottom !== '8px' || this.max8px > 1) {
      buttons.style.visibility = 'visible';
    }
  }

  /**
   * setScrollbarsPosition
   *
   * @private
   * @memberof SnapinUtilities
   */
  private setScrollbarsPosition(): void {
    const scrollElement = this.getElementByName('SnapshotDiv');

    if (scrollElement.scrollWidth > scrollElement.clientWidth) {
      const hScrollbarThumbSize = this.getScrollbarThumbSize(scrollElement.clientWidth, scrollElement.scrollWidth);
      if (!this.isHScrollbarVisible) {
        scrollElement.scrollLeft = (scrollElement.scrollWidth - scrollElement.clientWidth) / 2;
      } else {
        scrollElement.scrollLeft = (scrollElement.scrollLeft + this.oldHScrollbarThumbSize / 2) *
                    scrollElement.scrollWidth / this.oldScrollWidth - this.oldHScrollbarThumbSize / 2;
      }
      this.isHScrollbarVisible = true;
      this.oldHScrollbarThumbSize = hScrollbarThumbSize;
      this.oldScrollWidth = scrollElement.scrollWidth;
    } else {
      this.isHScrollbarVisible = false;
    }

    if (scrollElement.scrollHeight > scrollElement.clientHeight) {
      const vScrollbarThumbSize = this.getScrollbarThumbSize(scrollElement.clientHeight, scrollElement.scrollHeight);
      if (!this.isVScrollbarVisible) {
        scrollElement.scrollTop = (scrollElement.scrollHeight - scrollElement.clientHeight) / 2;
      } else {
        scrollElement.scrollTop = (scrollElement.scrollTop + this.oldVScrollbarThumbSize / 2) *
                    scrollElement.scrollHeight / this.oldScrollHeight - this.oldVScrollbarThumbSize / 2;
      }
      this.isVScrollbarVisible = true;
      this.oldVScrollbarThumbSize = vScrollbarThumbSize;
      this.oldScrollHeight = scrollElement.scrollHeight;
    } else {
      this.isVScrollbarVisible = false;
    }
  }

  /**
   * getScrollbarThumbSize
   *
   * @private
   * @param {} scrollElementClientSize
   * @param {} scrollElementScrollSize
   * @returns {}
   * @memberof SnapinUtilities
   */
  private getScrollbarThumbSize(scrollElementClientSize: number, scrollElementScrollSize: number): number {
    const arrowSize = 25;
    const viewportSize = scrollElementClientSize;
    const contentSize = scrollElementScrollSize;

    const viewableRatio = viewportSize / contentSize;
    const scrollBarArea = viewportSize - arrowSize * 2;
    return scrollBarArea * viewableRatio;
  }

  /**
   * checkImgOk
   *
   * @private
   * @param {} img
   * @param {} nh
   * @param {} nw
   * @returns {}
   * @memberof SnapinUtilities
   */
  private checkImgOk(img: HTMLImageElement, nh: number, nw: number): boolean {
    let imgOk = img.width !== 0 && img.height !== 0;
    if (!imgOk) {
      if (img.width !== 0) {
        img.height = img.width * nh / nw;
        imgOk = true;
      } else if (img.height !== 0) {
        img.width = img.height * nw / nh;
        imgOk = true;
      }
    }
    return imgOk;
  }

  /**
   * setImageBorder
   *
   * @private
   * @param {} img
   * @memberof SnapinUtilities
   */
  private setImageBorder(img: HTMLImageElement): void {
    img.style.border = '0px white';
  }

  /**
   * getCnsDescription
   *
   * @private
   * @param {} name
   * @param {} names
   * @returns {}
   * @memberof SnapinUtilities
   */
  private getCnsDescription(name: string, names: Map<string, Map<string, string>>): string {
    const location = this.videoManagementControlComponent.selectedObjectLocation;

    let cnsDesc = '';
    const map = names.get(name);
    Array.from(map).forEach(entry => {
      const loc = entry[0].replace(`.${entry[1]}`, '');
      if ((entry[0] === location || loc === location) && cnsDesc === '') {
        cnsDesc = entry[1];
      }
    });

    if (cnsDesc === '') {
      const entry = Array.from(map)[map.size - 1];
      cnsDesc = !isNullOrUndefined(entry) ? entry[1] : '';
    }

    return cnsDesc;
  }
  /**
   * executeCommandX
   *
   * @private
   * @param {} parameter
   * @memberof SnapinUtilities
   */
  private executeCommandX(parameter: any): void {
    const monitorName: string = this.videoManagementControlComponent.monitorWallTiles[parameter].monitorName;
    this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, '<<<<< Command X Executed >>>>> %s %s', parameter, monitorName);

    this.videoManagementService.disconnectStream(monitorName).subscribe((status: any) => {
      this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Status DisconnectStream: %s %s', status, monitorName);
      this.videoManagementControlComponent.refreshMonitorWallData();
    });
  }

  /**
   * executeCommandO
   *
   * @private
   * @param {} parameter
   * @memberof SnapinUtilities
   */
  private executeCommandO(parameter: any): void {
    const monitorName: string = this.videoManagementControlComponent.monitorWallTiles[parameter].monitorName;
    this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, '<<<<< Command O Executed >>>>> %s %s', parameter, monitorName);

    this.videoManagementService.stopSequenceMonitor(monitorName).subscribe((status: any) => {
      this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, 'Status StopSequenceMonitor: %s %s', status, monitorName);
      this.videoManagementControlComponent.refreshMonitorWallData();
    });
  }

  /**
   * executeCommandA
   *
   * @private
   * @param {} name
   * @param {} parameter
   * @memberof SnapinUtilities
   */
  private executeCommandA(name: string, parameter: any): void {
    this.videoManagementControlComponent.traceService.debug(TraceModules.videoSnapIn, '<<<<< Command A Executed >>>>> %s %s', name, parameter);
    this.videoManagementControlComponent.buttonClickOM(name, parameter);
  }

  /**
   * isMonitorGroup
   *
   * @private
   * @param {} selectedObjectName
   * @returns {}
   * @memberof SnapinUtilities
   */
  private isMonitorGroup(selectedObjectName: string): boolean {
    return selectedObjectName.startsWith('mngr');
  }
}
