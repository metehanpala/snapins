import { Component, HostBinding, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FullPaneId,
  FullQParamId,
  FullSnapInId,
  IHfwMessage,
  ISnapInConfig,
  MessageParameters,
  SnapInBase,
  UnsavedDataReason
} from '@gms-flex/core';
import {
  BrowserObject, CnsHelperService, GmsMessageData, MultiMonitorServiceBase,
  ObjectMessageType, SearchOption, SystemBrowserService, ViewInfo
} from '@gms-flex/services';
import { AppContextService, HfwUtility, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, Subscription } from 'rxjs';

import { OperatorTaskSnapinDataService } from '../services/operator-task-data.service';
import { OperatorTaskRightsService } from '../services/operator-task-rights.service';
import { TraceModules } from '../shared';
import { OperatorTaskTranslations } from '../shared/operator-task-translations';
import { Utility } from '../shared/utility';
import { OperatorTaskContentComponent } from '../views/operator-task-content/operator-task-content.component';

@Component({
  selector: 'gms-operator-task-snapin',
  templateUrl: './operator-task-snapin.component.html',
  styleUrl: './operator-task-snapin.component.scss',
  standalone: false
})
export class OperatorTaskSnapinComponent extends SnapInBase implements OnInit, OnDestroy {

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.panel') public guardPanel = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;
  @ViewChild('contentComponent') public content: OperatorTaskContentComponent;
  public gmsMessageData: GmsMessageData = null;
  public fullSnapInID: FullSnapInId = this.fullId;
  public fullPaneID: FullPaneId = this.location;
  public fullQParamID: FullQParamId;
  public showSnapin: Observable<boolean> = undefined;
  public currActiveView: ViewInfo = null;
  private readonly subscriptions: Subscription[] = [];
  private messageSubscription!: Subscription;
  private snapInId: string;
  private readonly _reattachInd: Subject<void> = new Subject<void>();
  private translations: OperatorTaskTranslations = undefined;

  private readonly systemManagerFrameId: string = 'system-manager';

  public constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly appContextService: AppContextService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly systemBrowserService: SystemBrowserService,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    private readonly rightsService: OperatorTaskRightsService,
    private readonly translateService: TranslateService,
    private readonly traceService: TraceService,
    private readonly snapinConfig: ISnapInConfig,
    private readonly dataService: OperatorTaskSnapinDataService) {

    super(messageBroker, activatedRoute);
  }

  public ngOnInit(): void {
    this.translations = new OperatorTaskTranslations(this.translateService);
    this.dataService.translations = this.translations;
    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.translations.initializeTranslation();
          this.traceService.info(TraceModules.snapinTrace, 'use user Culture');
        },
        (err: any) => {
          this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
            if (defaultCulture != null) {
              this.translateService.setDefaultLang(defaultCulture);
              this.translations.initializeTranslation();
            } else {
              this.traceService.warn(TraceModules.snapinTrace, 'No default Culture for appContextService');
              this.translateService.setDefaultLang(this.translateService.getBrowserLang());
              this.translations.initializeTranslation();
            }
          }));
        });
      } else {
        this.traceService.warn(TraceModules.snapinTrace, 'No user Culture for appContextService');
      }
    }));

    this.subscriptions.push(this.appContextService.userLocalizationCulture.subscribe((userLocalizationCulture: string) => {
      if (userLocalizationCulture) {
        Utility.formatLang = userLocalizationCulture;
      } else {
        Utility.formatLang = this.translateService.getBrowserCultureLang() ?? 'en';
      }
    }));

    this.dataService.initialize();

    this.messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(msg => {
      const message: GmsMessageData = msg as GmsMessageData;
      this.gmsMessageData = message;

      const snapin = `${this.fullId.snapInId} | ${this.fullId.frameId} | | ${this.fullId.fullId()}`;
      if (isNullOrUndefined(message) || message.data === undefined || message.data.length <= 0) {
        // message will be null when selecting task frame
        this.traceService.debug(TraceModules.snapinTrace, `getMessage() Message is undefined. ${snapin} `);
      } else {
        this.traceService.debug(TraceModules.snapinTrace, `getMessage():${snapin} | ${HfwUtility.serializeObject(message)}`);
      }
    });

    this.subscriptions.push(this.cnsHelperService.activeView.subscribe(view => {
      this.currActiveView = view;
    }));
    this.subscriptions.push(this.dataService.goToSystemCommand.subscribe((targetBo: BrowserObject) => this.goToSystem(targetBo)));

    this.fullQParamID = new FullQParamId(this.fullSnapInID.frameId, 'OperatorTaskQParamService', 'primary');
    this.snapInId = this.fullId.fullId();

    this.manageHldlConfig();

    this.showSnapin = this.rightsService.canShowSnapIn.asObservable();
    this.rightsService.initialize();
  }

  public onBeforeAttach(): void {
    super.onBeforeAttach();
    this._reattachInd.next();
  }

  public ngOnDestroy(): void {
    if (this.translations !== undefined) {
      this.translations.clear();
      this.translations = undefined;
    }

    this.subscriptions.forEach((subscription: Subscription) => { if (subscription !== undefined) { subscription.unsubscribe(); } });

    if (this.messageSubscription !== undefined) {
      this.messageSubscription.unsubscribe();
    }
  }

  public onUnsavedDataCheck(reason: UnsavedDataReason): Observable<boolean> {
    const unsavedDataObservable = new Observable<boolean>(observer => {

      if (this.content.selectedEntity === undefined) {
        observer.next(true);
        return;
      }

      const selectedTask = this.content.selectedEntity;
      if (this.dataService.HasChanges === true || this.dataService.HasValidationErrors === true
        || selectedTask.HasTargetChanges || selectedTask.HasTargetErrors) {
        this.content.showUnsavedDataDialog(selectedTask).subscribe({
          next: (value: boolean) => {
            if (value === true) {
              this.dataService.HasChanges = false;
              this.dataService.HasValidationErrors = false;
              selectedTask.resetChangeAndErrorFlags();
            }

            observer.next(value);
          }
        });
      } else {
        observer.next(true);
      }
    });

    return unsavedDataObservable;
  }

  private processRequest(message: GmsMessageData): void {
    // In case of invalid message condition, just return
    if (message === undefined || message.data === undefined || message.data.length <= 0) {
      this.traceService.info(TraceModules.snapinTrace, `Message arrived; invalid data received`);
      return;
    }
    this.traceService.info(TraceModules.snapinTrace, `Message arrived; Number of objects retrieved: ${message.data.length}`);
  }

  private manageHldlConfig(): void {
    const hldlConfig = this.snapinConfig.getSnapInHldlConfig(new FullSnapInId('operator-task', 'otl'), new FullPaneId('operator-task', 'otl-pane'));
  }

  private goToSystem(targetBo: BrowserObject): void {
    if (event != null) {
      this.systemBrowserService.searchNodes(targetBo.SystemId, targetBo.ObjectId, undefined, SearchOption.objectId)
        .toPromise()
        .then(page => {
          if (page.Nodes.length > 0) {
            let msgBody: GmsMessageData;
            let types: string[];
            const numInstances: number = page.Nodes.length;

            page.Nodes.sort(CnsHelperService.compareBrowserObjects);
            msgBody = new GmsMessageData([page.Nodes[0]]);
            types = [page.Nodes[0].Attributes.ManagedTypeName];

            for (let i = 1; numInstances > 1 && i < numInstances; i++) {
              if (this.currActiveView?.containsObject(page.Nodes[i])) {
                msgBody = new GmsMessageData([page.Nodes[i]]);
                types = [page.Nodes[i].Attributes.ManagedTypeName];
                break;
              }
            }
            const fullQParamId = new FullQParamId(this.systemManagerFrameId, 'SystemQParamService', 'primary');
            const qParam = { name: fullQParamId.fullId(), value: page.Nodes[0].Designation };
            const message: MessageParameters = {
              messageBody: msgBody,
              qParam,
              types
            };
            if (!this.multiMonitorService.runsInElectron) {
              this.switchToNextFrame(this.systemManagerFrameId, message).subscribe((frameChanged: boolean) => {
                this.traceService.debug(TraceModules.snapinTrace, 'goToSystem() completed. result: %s', frameChanged);
              });
            } else {
              this.multiMonitorService.sendObjectToMainManager({
                type: ObjectMessageType.SwitchFrame,
                data: { frame: this.systemManagerFrameId, msg: message }
              });
            }
          }
        });
    }
  }
}
