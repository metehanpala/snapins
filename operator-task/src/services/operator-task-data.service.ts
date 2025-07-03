import { Injectable, OnDestroy } from '@angular/core';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import {
  ActivityLogDataRepresentation,
  BrowserObject,
  CnsHelperService,
  CnsLabelEn,
  LogMessage,
  ObjectNode,
  OperatorTaskInfo, OperatorTaskNote,
  OperatorTasksFilter,
  OperatorTasksServiceBase,
  OperatorTasksSubscriptionsService,
  OperatorTaskStatus,
  OperatorTaskTemplatesResponse,
  SaveOperatorTaskData,
  SystemBrowserServiceBase,
  SystemInfo,
  SystemsResponseObject,
  SystemsServiceBase,
  TaskFilterBody,
  TaskTemplateFilter, ValidationInput, ValueServiceBase,
  ViewNode
} from '@gms-flex/services';
import {
  AppContextService,
  isNullOrUndefined,
  TraceService
} from '@gms-flex/services-common';
import {
  AggregateViewId,
  ModalDialogResult,
  ObjectManagerService,
  ObjectManagerServiceModalOptions,
  ValidationDialogService,
  ViewFilter
} from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { SiToastNotificationService, ToastStateName } from '@simpl/element-ng';
import {
  BehaviorSubject,
  forkJoin,
  Observable,
  Subject,
  Subscription,
  throwError
} from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { OperatorTaskModel } from '../model/operator-task-model';
import { TraceModules } from '../shared';
import { OperatorTaskTranslations } from '../shared/operator-task-translations';
import { Utility } from '../shared/utility';
import { OverridableParametersDetails } from '../types/overridable-parameter-types';
import { OperatorTaskRightsService } from './operator-task-rights.service';

/* eslint-disable */
export class TemplateFilterModel implements TaskTemplateFilter {
  SystemNumber: number;
  TemplateCnsPath: string;
  TargetObjectModels: string[];
  TargetDpIds: string[];

  constructor(systemNumber: number, templatePath?:string) {
    this.SystemNumber = systemNumber;

    if(!isNullOrUndefined(templatePath)){
      this.TemplateCnsPath = templatePath;
    }
  }
}

export class TaskFilterModel implements OperatorTasksFilter {
  IsEnabled: boolean = true;// false will ignore other parameters
  SystemId: number;
  TasksId: string[] = [];
  TaskStatus: number[] = [];

  constructor(systemId: number, taskIds?:string | string[]) {
    this.IsEnabled = true;// ignore other parameters
    this.SystemId = systemId;

    if (!isNullOrUndefined(taskIds)) {
      this.TasksId = typeof taskIds === 'string' ? [taskIds] : taskIds;
    }
  }
}
/* eslint-enable */
@Injectable()
export class OperatorTaskSnapinDataService implements OnDestroy {
  public addDataPoint: Subject<BrowserObject[]> = new Subject<BrowserObject[]>();
  public taskChangeNotification: Subject<OperatorTaskInfo[]> = new Subject<OperatorTaskInfo[]>();
  public goToSystemCommand: Subject<BrowserObject> = new Subject<BrowserObject>();
  public selectedObject: BrowserObject;
  public storage: IStorageService;
  public snapId: FullSnapInId;
  public cnsDisplayTypeChanged: Subject<CnsLabelEn> = new Subject<CnsLabelEn>();
  public cnsLabel: CnsLabelEn;
  public systemIdActiveProject: number;
  public systemIdSelected: number;// Note distribution, how to determine if user is local or global
  public readonly translationKey: string = '';// Operator Task
  public systemInfoReadSubject: BehaviorSubject<boolean>;
  public allSystemInfos: SystemInfo[];
  public isDistributed: boolean;

  public user: string;
  public HasChanges: boolean;
  public HasValidationErrors: boolean;
  public initialTaskTemplates: OperatorTaskTemplatesResponse[] = []; // initial list of task templates

  private taskSubSubscription: Subscription;
  private taskNotifSubscription: Subscription;
  private _translations: OperatorTaskTranslations;
  public set translations(translations: OperatorTaskTranslations) {
    this._translations = translations;
  }

  public get translations(): OperatorTaskTranslations {
    return this._translations;
  }

  private readonly modTrace = TraceModules.servicesTrace;
  private readonly cnsLabelChangeSubscription: Subscription;
  private readonly subscriptions: Subscription[] = [];
  private systemServiceSubscription: Subscription;
  private currentSystem: SystemInfo;

  constructor(
    public siToastService: SiToastNotificationService,
    private readonly objectManagerService: ObjectManagerService,
    public readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    public readonly traceService: TraceService,
    private readonly translateService: TranslateService,
    public readonly services: OperatorTasksServiceBase,
    private readonly systemsService: SystemsServiceBase,
    public readonly rightsService: OperatorTaskRightsService,
    private readonly appContextService: AppContextService,
    public readonly validationDialogService: ValidationDialogService,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly subscriptionService: OperatorTasksSubscriptionsService,
    private readonly valueService: ValueServiceBase) {
    if (this.cnsHelperService) {
      this.cnsLabelChangeSubscription = this.cnsHelperService.activeCnsLabel.subscribe(() => {
        if (!isNullOrUndefined(this.cnsHelperService.activeCnsLabelValue)) {
          this.cnsLabel = this.cnsHelperService.activeCnsLabelValue.cnsLabel;
          this.cnsDisplayTypeChanged.next(this.cnsLabel);
        }
      });
    }
    this.allSystemInfos = undefined;
    this.currentSystem = undefined;
    this.systemInfoReadSubject = new BehaviorSubject<boolean>(false);
    this.traceService.debug(this.modTrace, 'Service created');
  }

  public initialize(): void {
    this.HasChanges = false;
    this.HasValidationErrors = false;

    this.getSystemInfo();

    this.user = !Utility.isNullOrWhitespace(this.appContextService.userDescriptorValue)
      ? this.appContextService.userDescriptorValue
      : this.appContextService.userNameValue;
  }

  public ngOnDestroy(): void {
    this.traceService.debug(this.modTrace, 'ngOnDestroy(): unsubscribed subscriptions');
    this.cnsLabelChangeSubscription.unsubscribe();
    this.taskChangeNotification.unsubscribe();
    this.goToSystemCommand.unsubscribe();

    this.subscriptions?.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        subscription.unsubscribe();
      }
    });

    if (this.translations !== undefined) {
      this.translations = undefined
    }
  }

  public getObjectManagerConfig(omTypes?: string[]): Observable<ObjectManagerServiceModalOptions> {
    return new Observable(observer => {
      const objConfig: ObjectManagerServiceModalOptions = {
        singleSelection: false,
        hideSearch: true,
        selectableTypes: isNullOrUndefined(omTypes) ? undefined : omTypes
      };

      this.traceService.debug(this.modTrace, `getObjectManagerConfig(): ${objConfig}`);
      this.subscriptions.push(this.getAggregateViews(this.systemIdActiveProject).subscribe((views: AggregateViewId[]) => {
        objConfig.views = this.toViewSpecification(views, null);
        observer.next(objConfig);
        observer.complete();
      }, error => {
        observer.error(error);
        observer.complete();
      }));
    });
  }

  public selectDataPoints(source: string, config: Observable<ObjectManagerServiceModalOptions>): Observable<BrowserObject[]> {
    return new Observable(observer => {
      const configSub: Observable<ObjectManagerServiceModalOptions> = config;
      const translateSub: Observable<string> = this.translateService.get(this.translationKey + source.toString());
      this.subscriptions.push(forkJoin([configSub, translateSub]).subscribe(res => {

        this.traceService.debug(this.modTrace, `selectDataPoints(): ${res}`);

        this.subscriptions.push(this.objectManagerService.show(res[1], res[0]).subscribe(selectedPoints => {
          if (selectedPoints === undefined || selectedPoints.action === ModalDialogResult.Cancelled) {
            observer.next(undefined);
            observer.complete();
          } else if (selectedPoints.action === ModalDialogResult.Ok) {
            observer.next(selectedPoints.selection);
            observer.complete();
          }
        },
        error => {
          this.traceService.debug(this.modTrace, `selectDataPoints(): ${error}`);
          observer.error(error);
          observer.complete();
        }));
      }));
    });
  }

  public searchNodeMultiple(systemId: number, designations: string[]): Observable<ObjectNode[]> {
    return this.systemBrowserService.searchNodeMultiple(systemId, designations);
  }

  public getOperatorTaskTemplates(templatePath?: string): Observable<OperatorTaskTemplatesResponse[]> {
    if (isNullOrUndefined(templatePath)) {
      return this.services.getOperatorTaskTemplateList(new TemplateFilterModel(this.systemIdSelected));
    }

    return this.services.getOperatorTaskTemplateList(new TemplateFilterModel(this.systemIdSelected, templatePath));
  }

  public getOperatorTasks(): Observable<OperatorTaskInfo[]> {
    return this.services.getOperatorTasks(new TaskFilterModel(this.systemIdSelected));
  }

  public getTaskStatus(): Observable<OperatorTaskStatus[]> {
    return this.services.getTaskStatus();
  }

  public subscribeTaskChangeNotification(taskIds?: string | string[]): void {
    this.subscriptions.push(this.systemInfoReadSubject.subscribe((systemInfoRead: boolean) => {
      if (systemInfoRead && this.systemIdActiveProject !== undefined) {
        const ids: string[] = isNullOrUndefined(taskIds)
          ? []
          : typeof taskIds === 'string'
            ? [taskIds]
            : taskIds;

        // IsEnabled: false, the orchestrator will ignore all other filter fields and send notifications for all task changes.
        // IsEnabled: true, the orchestrator will apply filtering based on the values provided
        // and only notify the client about relevant changes.
        // Note: distribution is not supported, we have to set IsEnabled:true so that it will filter the systemId
        const filter: TaskFilterBody = { IsEnabled: true, SystemId: this.systemIdActiveProject, TasksId: ids, TaskStatus: [] };
        this.taskSubSubscription = this.subscriptionService.subscribeOperatorTasks(filter, false).subscribe((subscribed: boolean) => {
          if (subscribed) {
            this.taskNotifSubscription = this.subscriptionService.operatorTasksChangeNotification()
              .subscribe((tasks: OperatorTaskInfo[]) => this.onOperatorTaskChangeNotification(tasks));
          }
        });
      }
    }));
  }

  public onOperatorTaskChangeNotification(operatorTasks: OperatorTaskInfo[]): void {
    if (this.taskChangeNotification?.observed) {
      this.taskChangeNotification.next(operatorTasks);
    }
  }

  public unsubscribeTaskChangeNotification(): void {

    this.subscriptionService.unSubscribeOperatorTasks();

    if (this.taskSubSubscription !== undefined) {
      this.taskSubSubscription.unsubscribe();
      this.taskSubSubscription = undefined;
    }

    if (this.taskNotifSubscription !== undefined) {
      this.taskNotifSubscription.unsubscribe();
      this.taskNotifSubscription = undefined;
    }
  }

  public deleteOperatorTask(taskId: string): Observable<any> {
    return this.services.deleteOperatorTask(taskId, this.systemIdSelected);
  }

  public checkTaskName(taskName: string): Observable<string> {
    return this.services.checkTaskName(taskName, this.systemIdSelected);
  }

  public saveOperatorTasks(modifiedOperatorTask: any): Observable<any> {
    return this.services.saveOperatorTasks(modifiedOperatorTask, this.systemIdSelected);
  }

  public readTask(taskId: string): Observable<OperatorTaskInfo> {
    return this.services.readOperatorTask(taskId, this.systemIdSelected);
  }

  public getOperatorTaskNode(systemId: number): Observable<any> {
    return this.services.getTaskNode(systemId);
  }

  public addNote(taskId: string, note: OperatorTaskNote): Observable<number> {
    return this.services.addNote(note, taskId, this.systemIdSelected);
  }

  public sendCommand(validationDetails: ValidationInput, cmdId: number, taskId: string, newTime?: string): Observable<any> {
    return this.services.sendCommand(validationDetails, cmdId, taskId, newTime, this.systemIdSelected);
  }

  public sendCloseCommand(validationDetails: ValidationInput, taskId: string, systemNumber?: number): Observable<any> {
    const sysNum = !isNullOrUndefined(systemNumber) ? systemNumber : this.systemIdSelected;
    return this.services.sendCloseCommand(validationDetails, taskId, sysNum);
  }

  public updateTask(task: SaveOperatorTaskData, sysId: number): Observable<any> {
    if (isNullOrUndefined(sysId)) {
      sysId = this.systemIdSelected;
    }
    return this.services.updateTask(task, sysId);
  }

  public auditLog(log: LogMessage, taskId: string, activityLogData: ActivityLogDataRepresentation): Observable<number> {
    return this.services.auditLog(taskId, activityLogData, log, this.systemIdSelected);
  }

  public showToastNotification(state: ToastStateName, title: string, msg: string): void {
    this.toastNotificationService.queueToastNotification(state, title, msg, false);
  }

  public getOverridableParameters(selectedTask: OperatorTaskModel, objectIds: string[]): Observable<OverridableParametersDetails[]> {
    const cnsPath = selectedTask.cnsPath;
    if (isNullOrUndefined(cnsPath) || isNullOrUndefined(objectIds)) {
      this.traceService.warn(this.modTrace, 'getOverridableParameters() undefined params,returning empty observable');
      return Utility.EMPTY_OBSERVABLE;
    }

    if (objectIds.length === 0) {
      this.traceService.warn(this.modTrace, 'getOverridableParameters() empty objectIds, returning empty observable.');
      return Utility.EMPTY_OBSERVABLE;
    }

    return this.services.getOverridableParameters(cnsPath, objectIds, this.systemIdSelected, selectedTask.isNew ? undefined : selectedTask.id);
  }

  public readPropertyValues(objectOrPropertyId: string[], booleansAsNumericText?: boolean): Observable<any> {
    if (objectOrPropertyId?.length > 0) {
      return this.valueService.readValues(objectOrPropertyId, booleansAsNumericText);
    } else {
      return Utility.EMPTY_OBSERVABLE;
    }

  }

  private getAggregateViews(systemId: any): Observable<AggregateViewId[]> {
    return this.systemBrowserService.getViews(systemId).pipe(
      map((viewNodes: ViewNode[]) => {
        const viewIds: AggregateViewId[] = [];
        viewNodes.forEach(v => {
          const newId: AggregateViewId = AggregateViewId.createFromViewNode(v);
          if (!viewIds.some(id => AggregateViewId.isEqual(id, newId))) {
            viewIds.push(newId);
          }
        });
        return viewIds;
      }),
      catchError((err: any) => throwError(err))
    );
  }

  private toViewSpecification(ids: AggregateViewId[], sysName?: string): ViewFilter {
    if (ids === undefined || ids.length < 1) {
      return undefined;
    }
    return {
      viewIds: ids,
      systemName: sysName
    } as ViewFilter;
  }

  private getSystemInfo(): void {
    if (!this.systemInfoReadSubject.value) {
      // Note distribution is not supported, there is no facility to determine user
      this.systemServiceSubscription = this.systemsService.getSystemsExt().subscribe(
        systems => this.onReadSystems(systems),
        error => this.onReadSystemsError(error));
    }
  }

  private onReadSystems(systems: SystemsResponseObject): void {
    if (systems) {
      this.isDistributed = systems.IsDistributed;
      this.allSystemInfos = systems.Systems;
      this.currentSystem = systems.Systems.find(sys => sys.Id === systems.IdLocal);
      this.systemIdActiveProject = this.currentSystem.Id;
      this.systemIdSelected = this.systemIdActiveProject;
      this.traceService.debug(this.modTrace, `onReadSystems: distributed= ${this.isDistributed} | ${this.currentSystem.Id}:${this.currentSystem.Name}`);
      this.getInitialTaskTemplates();
      this.systemInfoReadSubject.next(true);
    }
  }

  private getInitialTaskTemplates(): void {
    this.getOperatorTaskTemplates().subscribe(resp => {
      if (resp) {
        this.initialTaskTemplates = resp;
      }

      this.traceService.info(this.modTrace, `getInitialTaskTemplates() completed ${resp?.length}`);
    })
  }

  private onReadSystemsError(error: any): void {
    this.traceService.error(this.modTrace, 'onReadSystemsError(): error: %s', error.message);
    this.allSystemInfos = undefined;
    this.currentSystem = undefined;
    this.systemInfoReadSubject.next(false);
  }
}

// export const parseSystemIdFromSystemName = (
//   systemInfos: SystemInfo[],
//   nameString: string
// ): number => {
//   const match: SystemInfo = systemInfos.find(
//     sysInfo => sysInfo.Name === nameString
//   );
//   return match ? match.Id : -1;
// };
