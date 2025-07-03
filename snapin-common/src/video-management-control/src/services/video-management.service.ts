/** class imports */
import { Injectable } from '@angular/core';
import {
  CommandInput, ExecuteCommandServiceBase, GmsSubscription, Page, SearchOption, SystemBrowserServiceBase,
  SystemBrowserSubscription, SystemBrowserSubscriptionServiceBase, ValidationCommandInfo, ValidationResult, // US2167680
  ValidationResultStatus, ValueDetails, ValueServiceBase, ValueSubscription2ServiceBase, ViewNode // US2167680
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { SiToastNotificationService } from '@simpl/element-ng'; // US2167680
import { Observable, Subscriber, Subscription } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';

/** class constants */
const videoStream = '.VideoStream';

/**
 * VideoManagementService
 *
 * @export
 * @class VideoManagementService
 */
@Injectable({
  providedIn: 'root'
})
export class VideoManagementService {

  /**
   * Creates an instance of VideoManagementService.
   * @param {} executeCommandService
   * @param {} valueService
   * @param {} valueSubscription2Service
   * @param {} systemBrowserService
   * @param {} systemBrowserSubscriptionService
   * @memberof VideoManagementService
   */
  constructor(
    private readonly executeCommandService: ExecuteCommandServiceBase,
    private readonly valueService: ValueServiceBase,
    private readonly valueSubscription2Service: ValueSubscription2ServiceBase,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly systemBrowserSubscriptionService: SystemBrowserSubscriptionServiceBase,
    // private readonly validationDialogService: ValidationDialogService, // US2167680
    private readonly toastNotificationService: SiToastNotificationService, // US2167680
    private readonly traceService: TraceService) {
  }

  // ---------------------------------------------------------------------------------------------

  // system browser selected object attributes
  public selectedObjectDescription: string; // data
  public selectedObjectLocation: string; // data

  /**
   * isUtExecution
   *
   * @memberof VideoManagementService
   */
  public isUtExecution = false;

  /**
   * videoSystem
   *
   * @memberof VideoManagementService
   */
  public videoSystem = '';

  /**
   * internal subscriptions
   */
  private executeCommandServiceSubscription = new Subscription();
  private systemBrowserServiceGetViewsSubscription = new Subscription();
  private systemBrowserServiceSearchNodesSubscription = new Subscription();
  private readonly valueServiceReadValueSubscription = new Subscription();
  private getCnsDescriptionsSubscription = new Subscription();
  private refreshCnsDataCacheSubscription = new Subscription();

  // US2167680
  /**
   * Validation Dialog Data
   */
  private validationDialogService: any; // ValidationDialogService;
  private errorTitle: string;
  private errorMessage: string;

  /**
   * subscription for validation operations
   *
   * @private
   * @type {}
   * @memberof VideoManagementService
   */
  private validationSubscription: Subscription;
  // US2167680

  private selectedObjectDesignation: string; // key

  /**
   * cnsDataCache
   *
   * @private
   * @type {Map<string, Map<string, string>>}     =>      <Name, <Location, Descriptor>>
   * @memberof VideoManagementService
   */
  private cnsDataCache: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();

  /**
   * subscribe
   *
   * @memberof VideoManagementService
   */
  public subscribe(): void {
    // nothing to do up to now
  }

  /**
   * unsubscribe
   *
   * @memberof VideoManagementService
   */
  public unsubscribe(): void {
    this.checkAndUnsubscribe(this.executeCommandServiceSubscription);
    this.checkAndUnsubscribe(this.systemBrowserServiceGetViewsSubscription);
    this.checkAndUnsubscribe(this.systemBrowserServiceSearchNodesSubscription);
    this.checkAndUnsubscribe(this.valueServiceReadValueSubscription);
    this.checkAndUnsubscribe(this.getCnsDescriptionsSubscription);
    this.checkAndUnsubscribe(this.refreshCnsDataCacheSubscription);
  }

  // ---------------------------------------------------------------------------------------------

  // US2167680
  /**
   * setValidationDialogData
   *
   * @param {} validationDialogService
   * @param {} errorTitle
   * @param {} errorMessage
   * @memberof VideoManagementService
   */
  public setValidationDialogData(validationDialogService: any, /* ValidationDialogService, */
    errorTitle: string,
    errorMessage: string): void {
    this.validationDialogService = validationDialogService;
    this.errorTitle = errorTitle;
    this.errorMessage = errorMessage;
  }
  // US2167680

  /**
   * getVideoSystem
   *
   * @returns {}
   * @memberof VideoManagementService
   */
  public getVideoSystem(): Observable<string> {
    this.traceService.debug(TraceModules.videoService, 'getVideoSystem()');

    return new Observable(observer => {
      const subscription1 = this.systemBrowserService.getViews().subscribe((viewNodes: ViewNode[]) => {
        viewNodes.forEach(viewNode => {
          if (viewNode.Name === 'ApplicationView') {
            const subscription2 = this.systemBrowserService.searchNodes(viewNode.SystemId, 'Video', viewNode.ViewId, SearchOption.designation).
              subscribe((page: Page) => {
                if (page.Nodes.length > 0) {
                  this.videoSystem = viewNode.SystemName;
                  this.traceService.debug(TraceModules.videoService, '===getVideoSystem()=== [%s]', viewNode.SystemName);
                  observer.next(viewNode.SystemName);
                  observer.complete();
                }
                if (!this.isUtExecution) {
                  subscription2.unsubscribe();
                }
              });
          }
        });
        if (!this.isUtExecution) {
          subscription1.unsubscribe();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * connectStream
   *   VideoSinkName   => Monitor_0001
   *   VideoSourceDP   => System1:src27640
   *
   * @param {} monitorName
   * @param {} cameraName
   * @returns {}
   * @memberof VideoManagementService
   */
  public connectStream(monitorName: string, cameraName: string): Observable<any> {
    this.traceService.debug(TraceModules.videoService, '<<<CommandManager>>> ConnectStream: %s %s', monitorName, cameraName);

    return new Observable(observer => {
      this.checkAndUnsubscribe(this.executeCommandServiceSubscription);

      const ci: any = {};
      ci.Name = 'VideoSinkName';
      ci.DataType = 'BasicString';
      ci.Value = monitorName;
      const commandInput: CommandInput[] = [ci];

      // US2167680
      this.executeCommandInternal(`${this.videoSystem}:${cameraName}${videoStream}`, 'Connect', commandInput,
        'ConnectStream', observer);
      // US2167680
    });
  }

  /**
   * connectStreams
   *   VideoSinkGroupName   => MonitorGroup4
   *   VideoSinkToStartAt   => 3
   *   VideoSourceGroupDP   => System1:srgr127
   *
   * @param {} videoSinkGroupName
   * @param {} videoSinkToStartAt
   * @param {} videoSourceGroupDP
   * @returns {}
   * @memberof VideoManagementService
   */
  public connectStreams(videoSinkGroupName: string, videoSinkToStartAt: number, videoSourceGroupDP: string): Observable<any> {
    this.traceService.debug(TraceModules.videoService, '<<<CommandManager>>> ConnectStreams: %s %s %s',
      videoSinkGroupName, videoSinkToStartAt, videoSourceGroupDP);

    return new Observable(observer => {
      this.checkAndUnsubscribe(this.executeCommandServiceSubscription);

      const ci1: any = {};
      ci1.Name = 'VideoSinkGroupName';
      ci1.DataType = 'BasicString';
      ci1.Value = videoSinkGroupName;

      const ci2: any = {};
      ci2.Name = 'VideoSinkToStartAt';
      ci2.DataType = 'ExtendedInt';
      ci2.Value = String(videoSinkToStartAt);

      const commandInput: CommandInput[] = [ci1, ci2];

      // US2167680
      this.executeCommandInternal(`${this.videoSystem}:${videoSourceGroupDP}${videoStream}`, 'Connect', commandInput,
        'ConnectStreams', observer);
      // US2167680
    });
  }

  /**
   * disconnectStream
   *   VideoSinkDP     => System1:mntr126
   *
   * @param {} monitorName
   * @returns {}
   * @memberof VideoManagementService
   */
  public disconnectStream(monitorName: string): Observable<any> {
    return this.executeCommand(monitorName,
      '<<<CommandManager>>> DisconnectStream: %s', '$$$(***DisconnectStream OK***) %s', '$$$(***DisconnectStream KO***) %s',
      videoStream, 'Disconnect');
  }

  /**
   * startSequence
   *   MonitorGroupName  => MonitorGroup4
   *   MonitorPosition   => 3
   *   VideoSequenceDP   => System1:sqnc441
   *
   * @param {} monitorGroupName
   * @param {} monitorPosition
   * @param {} videoSequenceDP
   * @returns {}
   * @memberof VideoManagementService
   */
  public startSequence(monitorGroupName: string, monitorPosition: number, videoSequenceDP: string): Observable<any> {
    this.traceService.debug(TraceModules.videoService, '<<<CommandManager>>> StartSequence: %s %s %s',
      monitorGroupName, monitorPosition, videoSequenceDP);

    return new Observable(observer => {
      this.checkAndUnsubscribe(this.executeCommandServiceSubscription);

      const ci1: any = {};
      ci1.Name = 'MonitorGroupName';
      ci1.DataType = 'BasicString';
      ci1.Value = monitorGroupName;

      const ci2: any = {};
      ci2.Name = 'MonitorPosition';
      ci2.DataType = 'ExtendedInt';
      ci2.Value = String(monitorPosition);

      const commandInput: CommandInput[] = [ci1, ci2];

      // US2167680
      this.executeCommandInternal(`${this.videoSystem}:${videoSequenceDP}.SequenceSession`, 'Start', commandInput,
        'StartSequence', observer);
      // US2167680
    });
  }

  /**
   * stopSequenceMonitor
   *   VideoMonitorDP     => System1:mntr126
   *
   * @param {} monitorName
   * @returns {}
   * @memberof VideoManagementService
   */
  public stopSequenceMonitor(monitorName: string): Observable<any> {
    return this.executeCommand(monitorName,
      '<<<CommandManager>>> StopSequenceMonitor: %s', '$$$(***StopSequenceMonitor OK***) %s', '$$$(***StopSequenceMonitor KO***) %s',
      '.SequenceSession', 'StopAll');
  }

  /**
   * getConnectionStatus
   *
   * @returns {}
   * @memberof VideoManagementService
   */
  public getConnectionStatus(): Observable<string> {
    return this.getStatus(`${this.videoSystem}:Video.VideoConnection`);
  }

  /**
   * getAlignmentStatus
   *
   * @returns {}
   * @memberof VideoManagementService
   */
  public getAlignmentStatus(): Observable<string> {
    return this.getStatus(`${this.videoSystem}:Video.AlignmentStatus`);
  }

  /**
   * getFrameSpacing
   *
   * @returns {}
   * @memberof VideoManagementService
   */
  public getFrameSpacing(): Observable<string> {
    return this.getStatus(`${this.videoSystem}:Video.FrameSpacing`);
  }

  /**
   * getCameraStatus
   *
   * @param {} cameraDpe
   * @returns {}
   * @memberof VideoManagementService
   */
  public getCameraStatus(cameraDpe: string): Observable<string> {
    return this.getStatus(`${this.videoSystem}:${cameraDpe}.Status.SignalLost`);
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * registerValueSubscription2Client
   *
   * @param {} clientName
   * @returns {}
   * @memberof VideoManagementService
   */
  public registerValueSubscription2Client(clientName: string): string {
    return this.valueSubscription2Service.registerClient(clientName);
  }

  /**
   * disposeValueSubscription2Client
   *
   * @param {} clientId
   * @returns {}
   * @memberof VideoManagementService
   */
  public disposeValueSubscription2Client(clientId: string): void {
    return this.valueSubscription2Service.disposeClient(clientId);
  }

  /**
   * subscribeConnectionStatusNotification
   *
   * @param {} clientId
   * @returns {}
   * @memberof VideoManagementService
   */
  public subscribeConnectionStatusNotification(clientId: string): GmsSubscription<ValueDetails> {
    return this.valueSubscription2Service.subscribeValues([`${this.videoSystem}:Video.VideoConnection`], clientId)[0];
  }

  /**
   * unsubscribeConnectionStatusNotification
   *
   * @param {} subscription
   * @param {} clientId
   * @memberof VideoManagementService
   */
  public unsubscribeConnectionStatusNotification(subscription: GmsSubscription<ValueDetails>, clientId: string): void {
    this.valueSubscription2Service.unsubscribeValues([subscription], clientId);
  }

  /**
   * subscribeAlignmentStatusNotification
   *
   * @param {} clientId
   * @returns {}
   * @memberof VideoManagementService
   */
  public subscribeAlignmentStatusNotification(clientId: string): GmsSubscription<ValueDetails> {
    return this.valueSubscription2Service.subscribeValues([`${this.videoSystem}:Video.AlignmentStatus`], clientId)[0];
  }

  /**
   * unsubscribeAlignmentStatusNotification
   *
   * @param {} subscription
   * @param {} clientId
   * @memberof VideoManagementService
   */
  public unsubscribeAlignmentStatusNotification(subscription: GmsSubscription<ValueDetails>, clientId: string): void {
    this.valueSubscription2Service.unsubscribeValues([subscription], clientId);
  }

  /**
   * subscribeCameraStatusNotification
   *
   * @param {} clientId
   * @param {} cameraDpe
   * @returns {}
   * @memberof VideoManagementService
   */
  public subscribeCameraStatusNotification(clientId: string, cameraDpe: string): GmsSubscription<ValueDetails> {
    return this.valueSubscription2Service.subscribeValues([`${this.videoSystem}:${cameraDpe}.Status.SignalLost`], clientId)[0];
  }

  /**
   * unsubscribeCameraStatusNotification
   *
   * @param {} subscription
   * @param {} clientId
   * @memberof VideoManagementService
   */
  public unsubscribeCameraStatusNotification(subscription: GmsSubscription<ValueDetails>, clientId: string): void {
    this.valueSubscription2Service.unsubscribeValues([subscription], clientId);
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * registerSystemBrowserClient
   *
   * @param {} clientName
   * @returns {}
   * @memberof VideoManagementService
   */
  public registerSystemBrowserClient(clientName: string): string {
    return this.systemBrowserSubscriptionService.registerClient(clientName);
  }

  /**
   * disposeSystemBrowserClient
   *
   * @param {} clientId
   * @memberof VideoManagementService
   */
  public disposeSystemBrowserClient(clientId: string): void {
    this.systemBrowserSubscriptionService.disposeClient(clientId);
  }

  /**
   * subscribeSystemBrowserNodeChanges
   *
   * @param {} designation
   * @param {} clientId
   * @returns {}
   * @memberof VideoManagementService
   */
  public subscribeSystemBrowserNodeChanges(designation: string, clientId: string): GmsSubscription<SystemBrowserSubscription> {
    return this.systemBrowserSubscriptionService.subscribeNodeChanges(designation, clientId);
  }

  /**
   * unsubscribeSystemBrowserNodeChanges
   *
   * @param {} subscription
   * @param {} clientId
   * @returns {}
   * @memberof VideoManagementService
   */
  public unsubscribeSystemBrowserNodeChanges(subscription: GmsSubscription<SystemBrowserSubscription>, clientId: string): void {
    return this.systemBrowserSubscriptionService.unsubscribeNodeChanges(subscription, clientId);
  }

  // ---------------------------------------------------------------------------------------------

  /**
   * getApplicationViewDesignation
   *
   * @returns {}
   * @memberof VideoManagementService
   */
  public getApplicationViewDesignation(): Observable<string> {
    return new Observable(observer => {
      this.checkAndUnsubscribe(this.systemBrowserServiceGetViewsSubscription);
      this.systemBrowserServiceGetViewsSubscription =
                this.systemBrowserService.getViews().subscribe((viewNodes: ViewNode[]) => {
                  viewNodes.forEach(viewNode => {
                    if (viewNode.Name === 'ApplicationView') {
                      observer.next(viewNode.Designation);
                    }
                  });
                  observer.complete();
                });
    });
  }

  /**
   * setSelectedObjectData
   *
   * @param {} selectedObjectDesignation
   * @memberof VideoManagementService
   */
  public setSelectedObjectData(selectedObjectDesignation: string): void {
    this.selectedObjectDesignation = selectedObjectDesignation;
    this.selectedObjectDescription = '';
    this.selectedObjectLocation = '';
  }

  /**
   * refreshCnsDataCache
   *
   * @returns {}
   * @memberof VideoManagementService
   */
  public refreshCnsDataCache(): Observable<boolean> {
    return new Observable(observer => {
      this.checkAndUnsubscribe(this.getCnsDescriptionsSubscription);
      this.getCnsDescriptionsSubscription =
                this.getCnsDescriptions(this.cnsDataCache, true).subscribe(cnsData => {
                  this.cnsDataCache = cnsData;
                  this.traceService.debug(TraceModules.videoService, '===(cnsDataCache) %s', this.cnsDataCache);
                  observer.next(true);
                  observer.complete();
                });
    });
  }

  /**
   * getCnsDescriptionsFromCnsDataCache
   *
   * @param {} names
   * @returns {}
   * @memberof VideoManagementService
   */
  public getCnsDescriptionsFromCnsDataCache(names: Map<string, Map<string, string>>): Observable<Map<string, Map<string, string>>> {
    return new Observable(observer => {
      if (this.cnsDataCache.size === 0) {
        this.checkAndUnsubscribe(this.refreshCnsDataCacheSubscription);
        this.refreshCnsDataCacheSubscription =
                    this.refreshCnsDataCache().subscribe((done: boolean) => {
                      observer.next(this.getNames(names));
                      observer.complete();
                    });
      } else {
        observer.next(this.getNames(names));
        observer.complete();
      }
    });
  }

  /**
   * getStatus
   *
   * @private
   * @param {} dpe
   * @returns {}
   * @memberof VideoManagementService
   */
  private getStatus(dpe: string): Observable<string> {
    return new Observable(observer => {
      const valueServiceReadValueSubscription =
        this.valueService.readValue(dpe).subscribe((props: ValueDetails[]) => {
          props.forEach(value => {
            observer.next((value.Value.Value));
          });
          observer.complete();
          if (!this.isUtExecution) {
            valueServiceReadValueSubscription.unsubscribe();
          }
        });
    });
  }
  /**
   * checkAndUnsubscribe
   *
   * @private
   * @param {} subscription
   * @memberof VideoManagementService
   */
  private checkAndUnsubscribe(subscription: Subscription): void {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  /**
   * getCnsDescriptions
   *
   * @private
   * @param {} names
   * @param {} [loadAll=false]
   * @returns {}
   * @memberof VideoManagementService
   */
  private getCnsDescriptions(names: Map<string, Map<string, string>>, loadAll = false): Observable<Map<string, Map<string, string>>> {
    return new Observable(observer => {
      this.checkAndUnsubscribe(this.systemBrowserServiceSearchNodesSubscription);
      this.systemBrowserServiceSearchNodesSubscription =
        this.systemBrowserService.searchNodes(0, '*', 0, 0, false, false, 0, 0, '{"150":[154]}', '{"9000":[9001],"600":[]}').
          subscribe((page: Page) => {
            if (loadAll) {
              names.clear();
            }
            page.Nodes.forEach(node => {
              if (names.has(node.Name) || loadAll) {
                let map = names.get(node.Name);
                if (isNullOrUndefined(map)) {
                  map = new Map<string, string>();
                }
                map.set(node.Location, node.Descriptor);
                names.set(node.Name, map);

                if (node.Designation === this.selectedObjectDesignation) {
                  this.selectedObjectDescription = node.Descriptor;
                  this.selectedObjectLocation = node.Location;
                }
              }
            });
            observer.next(names);
            observer.complete();
          });
    });
  }

  /**
   * getNames
   *
   * @private
   * @param {} names
   * @returns {}
   * @memberof VideoManagementService
   */
  private getNames(names: Map<string, Map<string, string>>): Map<string, Map<string, string>> {
    const keys: string[] = Array.from(this.cnsDataCache.keys());
    keys.forEach(key => {
      if (names.has(key)) {
        names.set(key, this.cnsDataCache.get(key));
      }
    });
    return names;
  }
  /**
   * executeCommand
   *
   * @private
   * @param {} monitorName
   * @param {} msg1
   * @param {} msg2
   * @param {} msg3
   * @param {} propertyId
   * @param {} commandId
   * @returns {}
   * @memberof VideoManagementService
   */
  private executeCommand(monitorName: string, msg1: string, msg2: string, msg3: string, propertyId: string, commandId: string): Observable<any> {
    this.traceService.debug(TraceModules.videoService, msg1, monitorName);

    return new Observable(observer => {
      const subscription1 = this.systemBrowserService.getViews().subscribe((viewNodes: ViewNode[]) => {
        viewNodes.forEach(viewNode => {
          if (viewNode.Name === 'ApplicationView') {
            const subscription2 = this.systemBrowserService.searchNodes(viewNode.SystemId, monitorName, viewNode.ViewId, SearchOption.designation).
              subscribe((page: Page) => {
                if (page.Nodes.length > 0) {
                  this.checkAndUnsubscribe(this.executeCommandServiceSubscription);

                  // US2167680
                  this.executeCommandInternal(`${this.videoSystem}:${page.Nodes[0].Name}${propertyId}`, commandId, undefined,
                    `${msg2}-${msg3}`, observer);
                  // US2167680
                }
                if (!this.isUtExecution) {
                  subscription2.unsubscribe();
                }
              });
          }
        });
        if (!this.isUtExecution) {
          subscription1.unsubscribe();
        }
      });
    });
  }

  // US2167680
  /**
   * executeCommandInternal
   *
   * @private
   * @param {} propertyId
   * @param {} commandId
   * @param {} commandInput
   * @param {} msg
   * @param {} observer
   * @memberof VideoManagementService
   */
  private executeCommandInternal(propertyId: string, commandId: string, commandInput: CommandInput[], msg: string, observer: Subscriber<any>): void {
    const propertyIds: string[] = [propertyId];
    const validationCommandInfo: ValidationCommandInfo = new ValidationCommandInfo(propertyIds, 0);

    if (isNullOrUndefined(commandInput)) {
      const ci: any = {};
      commandInput = [ci];
    }

    this.validationSubscription = this.validationDialogService.show(validationCommandInfo).subscribe((result: ValidationResult) => {
      if (result.Status === ValidationResultStatus.Success || result.Status === ValidationResultStatus.Cancelled) {
        if (!isNullOrUndefined(this.validationSubscription)) {
          this.validationSubscription.unsubscribe();
          this.validationSubscription = undefined;
        }
      }
      if (result.Status === ValidationResultStatus.Success) {
        // Update command input with validation result
        commandInput.forEach(cmdInput => {
          cmdInput.Password = result.Password;
          cmdInput.SuperName = result.SuperName;
          cmdInput.SuperPassword = result.SuperPassword;
          cmdInput.Comments = result.Comments;
        });

        this.executeCommandServiceSubscription =
              this.executeCommandService.executeCommand(propertyId, commandId, commandInput).subscribe(
                (answer: void) => {
                  this.traceService.debug(TraceModules.videoService, '$$$(***%s OK***) %s', msg, answer);
                  observer.next(answer);
                  observer.complete();
                },
                (error: any) => {
                  // Type ToastStateName = 'connection' | 'danger' | 'info' | 'success' | 'warning'
                  // With your imported instance of SiToastNotificationService, call the queueToastNotification method
                  this.toastNotificationService.queueToastNotification('danger', this.errorTitle, this.errorMessage);

                  this.traceService.error(TraceModules.videoService, '$$$(***%s KO***) %s', msg, error);
                  observer.error(error);
                  observer.complete();
                }
              );
      }
    });
  }
  // US2167680
}
