/* eslint-disable @typescript-eslint/member-ordering */
import { EventEmitter } from '@angular/core';
import {
  ActivityLogDataRepresentation,
  ClientMessageExRepresentation,
  LogMessage,
  OperatorTaskInfo,
  OperatorTaskNote,
  OperatorTaskStatus,
  OperatorTaskTemplatesResponse,
  ValidationEditInfo,
  ValidationInput,
  ValidationResult,
  ValidationResultStatus,
  ValueWithQualityRepresentation
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, Subject, Subscription, switchMap, takeUntil, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { OperatorTaskModel } from '../model/operator-task-model';
import { OperatorTaskSnapinDataService } from '../services/operator-task-data.service';
import { TraceModules } from '../shared';
import { Utility } from '../shared/utility';
import { GmsActions } from '../types/gms-actions';
import { ToastNotificationState } from '../types/operator-task-alert-type';
import { OperatoTaskAuditLogStatus } from '../types/operator-task-auditlog-status';
import { OperatorTaskCommandId } from '../types/operator-task-command-names';
import { OperatorTaskErrorTypes } from '../types/operator-task-error-types';
import { OperatorTaskStatuses } from '../types/operator-task-status';
import { OperatorTaskUserActionType } from '../types/operator-task-user-action-type';

export enum TaskViewMode {
  Add,
  Edit,
  View,
  NoSelection
}

export class TaskSelection {
  public selectedTask: OperatorTaskModel;
  public viewType: TaskViewMode;

  constructor(vm: OperatorTaskModel, view: TaskViewMode) {
    this.selectedTask = vm;
    this.viewType = view;
  }
}

export class OperatorTaskListViewModel {
  public operatorTaskRootNode: string;
  public user: string;
  public selectedTaskChanged: EventEmitter<TaskSelection> = new EventEmitter<TaskSelection>();
  public taskChanged: Subject<void> = new Subject<void>();
  public nodesReadSubject: BehaviorSubject<boolean>;
  private readonly subscriptions: Subscription[] = [];
  private readonly tasksSubject = new BehaviorSubject<any[]>([]);
  public tasks$ = this.tasksSubject.asObservable();
  public unsubscribeInit$ = new Subject<void>();
  private notificationSubscription: Subscription;

  private _tasks: OperatorTaskModel[] = [];
  public get tasks(): OperatorTaskModel[] {
    return this._tasks;
  }

  private selectedTask: OperatorTaskModel;
  private taskViewType: TaskViewMode;
  // Dictionary of task waiting for a command
  private readonly _waitingTasks = new Map<string, OperatorTaskStatuses>();
  private errorFromWsi = '';
  // shared across
  constructor(private readonly dataService: OperatorTaskSnapinDataService,
    private readonly trace: TraceService) {
    this.user = this.dataService.user;
    this.nodesReadSubject = new BehaviorSubject<boolean>(false);
  }

  private _canAbortTask: boolean;
  public get canAbortTask(): boolean {
    return this._canAbortTask;
  }
  private set canAbortTask(value: boolean) {
    if (!this.dataService.rightsService.CanConfigure) {
      this._canAbortTask = false;
      return;
    }
    this._canAbortTask = value;
  }

  private _canCloseTask: boolean;
  public get canCloseTask(): boolean {
    return this._canCloseTask;
  }

  private set canCloseTask(value: boolean) {
    if (!this.dataService.rightsService.CanStopRunningTasks) {
      this._canCloseTask = false;
      return;
    }
    this._canCloseTask = value;
  }

  private _canRevertTask: boolean;
  public get canRevertTask(): boolean {
    return this._canRevertTask;
  }

  private set canRevertTask(value: boolean) {
    if (this.selectedTask?.revertActionMode === 1 && !this.dataService.rightsService.CanAllowAuomaticRevert) {
      this._canRevertTask = false;
      return;
    }
    this._canRevertTask = value;
  }

  private _canStartTask: boolean;
  public get canStartTask(): boolean {
    return this._canStartTask;
  }

  private set canStartTask(value: boolean) {
    this._canStartTask = value;
  }

  private _canEditTask: boolean;
  public get canEditTask(): boolean {
    return this._canEditTask;
  }

  private set canEditTask(value: boolean) {
    if (!this.dataService.rightsService.CanConfigure || isNullOrUndefined(this.selectedTask) || this.isEditing()) {
      this._canEditTask = false;
    } else {
      this._canEditTask = value;
    }
  }

  private _canDuplicateTask: boolean;
  public get canDuplicateTask(): boolean {
    return this._canDuplicateTask;
  }

  private set canDuplicateTask(value: boolean) {
    if (!this.dataService.rightsService.CanConfigure || this.isEditing()) {
      this._canDuplicateTask = false;
    } else {
      this._canDuplicateTask = value;
    }
  }

  private _canAddTask: boolean;
  public get canAddTask(): boolean {
    return this._canAddTask;
  }

  private set canAddTask(value: boolean) {
    if (!this.dataService.rightsService.CanCreateNewTask || this.isEditing()) {
      this._canAddTask = false;
    } else {
      this._canAddTask = value;
    }
  }

  private _canDeleteTask: boolean;
  public get canDeleteTask(): boolean {
    return this._canDeleteTask;
  }

  private set canDeleteTask(value: boolean) {
    if (!this.dataService.rightsService.CanDeleteTask) {
      this._canDeleteTask = false;
      return;
    }

    this._canDeleteTask = value;
  }

  private _canConfigureTaskEndDate: boolean;
  public get canConfigureTaskEndDate(): boolean {
    return this._canConfigureTaskEndDate;
  }

  private set canConfigureTaskEndDate(value: boolean) {
    this._canConfigureTaskEndDate = value;
  }

  // Determines if description or targets are editable
  private _canConfigureTaskName: boolean;
  public get canConfigureTaskData(): boolean {
    return this._canConfigureTaskData;
  }

  public set canConfigureTaskData(value: boolean) {
    this._canConfigureTaskData = value;
  }
  public get canConfigureTaskName(): boolean {
    return this._canConfigureTaskName;
  }

  private set canConfigureTaskName(value: boolean) {
    this._canConfigureTaskName = value;
  }

  private _canConfigureTaskData: boolean;
  private readonly mod = TraceModules.vmListTrace;
  private validationData: any;

  public updateSelectedTaskDataAndStateMachine(newData: TaskSelection): void {
    this.trace.debug(this.mod, `updateSelectedTaskDataAndStateMachine ${newData?.selectedTask?.traceData()}`);
    this.selectedTask = newData?.selectedTask;
    this.taskViewType = newData?.viewType;
    this.updateActionsOnTask();
    this.selectedTaskChanged.emit(newData);
  }

  public taskNames(): string[] {
    let result = [];
    if (!isNullOrUndefined(this._tasks)) {
      result = this._tasks
        .filter(vm => vm.id !== this.selectedTask.id)
        .map(vm => vm.taskNameLocalized);
    }
    return result;
  }

  public unsubscribeReadTask(): void {
    this.unsubscribeInit$.next();
    this.unsubscribeInit$.complete();
  }

  public updateActionsOnTask(): void {
    if (!this.dataService.rightsService.CanConfigure) {
      this.canAddTask = false;
      this.canDuplicateTask = false;
      this.canDeleteTask = false;
      this.canEditTask = false;
      this.canStartTask = false;
      this.canRevertTask = false;
      this.canCloseTask = false;
      this.canAbortTask = false;
      this.canConfigureTaskData = false;
      return;
    }

    if (isNullOrUndefined(this.selectedTask)) {
      this.canAddTask = true;
      this.canDuplicateTask = false;
      this.canDeleteTask = false;
      this.canEditTask = false;
      return;
    }

    const hasRevertAction = this.selectedTask.hasRevertActions();

    switch (this.selectedTask.status as OperatorTaskStatuses) {
      // Transitional statuses --> it is only possible to add new task
      case OperatorTaskStatuses.CheckingPreconditions:
      case OperatorTaskStatuses.WaitingForConditions:
      case OperatorTaskStatuses.Aborting:
        // can only add task
        this.canAddTask = true;
        this.canDuplicateTask = false;
        this.canDeleteTask = false;
        this.canEditTask = false;
        this.canStartTask = false;
        this.canRevertTask = false;
        this.canCloseTask = false;
        this.canAbortTask = false;
        this.canConfigureTaskData = false;
        break;

      case OperatorTaskStatuses.Idle:
        // form can be fully edited
        // Disabled: revert, close, abort and save
        this.canAddTask = true;
        this.canDeleteTask = true;
        this.canDuplicateTask = true;
        this.canEditTask = this.canUpdateAnyTask();
        this.canConfigureTaskName = true;
        this.canConfigureTaskEndDate = true;
        this.canConfigureTaskData = true;

        this.canAbortTask = false;
        this.canStartTask = true;
        this.canRevertTask = false;
        this.canCloseTask = false;
        break;
      case OperatorTaskStatuses.Failed:
        // disabled: duplicate, delete, save, abort
        // enable start, revert, close
        // taskName cannot be edited, everything else can be edited
        this.canAddTask = true;
        this.canConfigureTaskName = false;
        this.canDuplicateTask = false;
        this.canDeleteTask = false;
        this.canCloseTask = true;
        this.canStartTask = true;
        this.canRevertTask = hasRevertAction;
        this.canEditTask = this.canUpdateAnyTask();
        this.canAbortTask = false;
        this.canConfigureTaskData = true;
        break;
      case OperatorTaskStatuses.Closed:
      case OperatorTaskStatuses.ClosedForMissingLicense:
        // Disabled: all task actions, edit, save
        this.canAddTask = true;
        this.canDuplicateTask = true;
        this.canEditTask = false;
        this.canConfigureTaskData = false;
        if (!this.dataService.rightsService.CanUpdateAnyTasks && this.user !== this.selectedTask.createdBy) {
          this.canDeleteTask = false;
        } else {
          this.canDeleteTask = true;
        }

        this.canStartTask = false;
        this.canRevertTask = false;
        this.canCloseTask = false;
        this.canAbortTask = false;
        break;
      case OperatorTaskStatuses.Expired:
        // disabled duplicate, delete, start, abort
        // due date and targets can be modified
        this.canEditTask = this.canUpdateAnyTask();
        this.canAddTask = true;
        this.canDuplicateTask = false;
        this.canDeleteTask = false;

        this.canCloseTask = true;
        this.canStartTask = false;
        this.canRevertTask = hasRevertAction;
        this.canAbortTask = false;

        this.canConfigureTaskName = false;
        this.canConfigureTaskData = false;
        break;
      case OperatorTaskStatuses.ReadyToBeClosed:
        // enabled: add and close
        this.canAddTask = true;
        this.canCloseTask = true;

        this.canDeleteTask = false;
        this.canDuplicateTask = false;
        this.canEditTask = false;
        this.canStartTask = false;
        this.canRevertTask = false;
        this.canAbortTask = false;
        this.canConfigureTaskData = false;
        break;

      case OperatorTaskStatuses.RunningWithException:
      case OperatorTaskStatuses.Running:
        // disabled: duplicate, delete, start, abort
        // due date and targets can be modified
        this.canConfigureTaskEndDate = true;
        this.canConfigureTaskName = false;
        this.canConfigureTaskData = false;

        this.canAddTask = true;
        this.canCloseTask = true;
        this.canDuplicateTask = false;
        this.canDeleteTask = false;
        this.canEditTask = this.canUpdateAnyTask();
        this.canStartTask = false;
        this.canRevertTask = hasRevertAction;
        this.canAbortTask = false;

        break;
      case OperatorTaskStatuses.ExecutingCommands:
      case OperatorTaskStatuses.RevertingCommands:
      case OperatorTaskStatuses.Deferred:
        // disabled: duplicate, delete, edit, save, start, revert, close,
        // only add is enabled and maybe abort (goes away quickly)
        this.canAddTask = true;
        this.canAbortTask = true;
        this.canEditTask = false;
        this.canDuplicateTask = false;
        this.canDeleteTask = false;
        this.canCloseTask = false;
        this.canStartTask = false;
        this.canRevertTask = false;
        this.canConfigureTaskData = false;
        break;
      default:
        break;
    }
  }

  public getStatusClasssFontColor(status: OperatorTaskStatuses): string {
    switch (status as OperatorTaskStatuses) {
      case OperatorTaskStatuses.ClosedForMissingLicense:
      case OperatorTaskStatuses.Expired:
      case OperatorTaskStatuses.ReadyToBeClosed:
        return 'text-emphasis';
      case OperatorTaskStatuses.ExecutingCommands:
      case OperatorTaskStatuses.RevertingCommands:
      case OperatorTaskStatuses.WaitingForConditions:
      case OperatorTaskStatuses.Aborting:
      case OperatorTaskStatuses.RunningWithException:
      case OperatorTaskStatuses.Running:
      case OperatorTaskStatuses.Deferred:
      case OperatorTaskStatuses.Failed:
      case OperatorTaskStatuses.Closed:
      case OperatorTaskStatuses.Idle:
      case OperatorTaskStatuses.CheckingPreconditions:
        return 'text-regular';
      default:
        break;
    }
  }

  public getTaskTargetsForValidation(onlyOperatorTaskRootNode: boolean): string[] | OperatorTaskErrorTypes {
    const result = [];
    if (this.operatorTaskRootNode) {
      //  add the MainSystem:ApplicationView_OperatorTasksRootNode
      result.push(this.operatorTaskRootNode);
    } else {
      this.trace.warn(this.mod, 'getTaskTargetsForValidation(): The operator task' +
        ' root' +
        ' node is undefined.');
      return OperatorTaskErrorTypes.OperatorTaskFolderMissing;
    }

    if (!onlyOperatorTaskRootNode && this.selectedTask?.targetDpIds) {
      for (const t of this.selectedTask.targetDpIds) {
        // If any targets doesn't exist, the task cannot be executed
        if (t.datapointDoesNotExist) {
          return OperatorTaskErrorTypes.TargetDeleted;
        }

        // Note: ValidataionHelper does not return error, nor wsi indicates this is not reachable
        if (this.dataService.isDistributed) {
          if (isNullOrUndefined(t.bo)) {
            this.trace.warn(this.mod, `getTaskTargetsForValidation(): ${t.objectId} is not reachable`);
          }
        }
        result.push(t.objectId);
      }
    }
    return result;
  }

  public showValidationDialog(dps: string[], action: OperatorTaskUserActionType): Observable<any> {
    return new Observable<any >(observer => {
      let validationInput: ValidationInput;
      const validationInfo = new ValidationEditInfo(dps);
      const validationSubscription = this.dataService.validationDialogService.show(validationInfo).subscribe({
        next: (result: ValidationResult) => {
          if (result) {
            switch (result.Status) {
              case ValidationResultStatus.Success:
                validationInput = {
                  Password: result.Password,
                  SuperName: result.SuperName,
                  SuperPassword: result.SuperPassword,
                  Comments: result.Comments,
                  SessionKey: result.SessionKey
                };
                this.validationData = validationInput;
                this.trace.debug(this.mod, `showValidationDialog(): successful on ${action}`);
                break;
              case ValidationResultStatus.Cancelled:
                this.trace.debug(this.mod, `showValidationDialog(): cancelled on ${action}`);
                validationSubscription.unsubscribe();
                break;
              case ValidationResultStatus.Error:
                this.trace.error(this.mod, `showValidationDialog(): errored on ${action}. Status= ${result?.Status} | Error = ${result?.Error}`);
                break;
              default:
                this.trace.info(this.mod, `showValidationDialog(): not suppored on ${action}`);
                break;
            }

            observer.next({ validationInput, result });
            observer.complete();
          }
        },
        error: (error: any) => {
          this.trace.error(this.mod, `showValidationDialog(): errored on ${action}. | Error = ${error}`);
          observer.next({ validationInput, error });
          observer.complete();
        }
      });
    });
  }

  // /////////////////// WSI SERVICES /////////////////////
  public sendDeleteTask(task: OperatorTaskModel): Observable<any> {
    if (task.id) {
      return new Observable(observer => {
        this.dataService.deleteOperatorTask(task.id).subscribe(response => {
          if (response === 0) {
            this.sendAuditLog(observer, LogMessage.DeleteTask, OperatoTaskAuditLogStatus.Succeeded, task);
          }
          observer.next(response);
          observer.complete();
        },
        err => {
          this.sendAuditLog(observer, LogMessage.DeleteTask, OperatoTaskAuditLogStatus.Error, task);
          observer.next(err);
          observer.complete();
        }
        );
      });

    }
  }

  public sendSaveTask(task: any, isDuplicate?: boolean): Observable<any> {
    if (task) {
      const wsiTask = task.toWSITask();
      return new Observable(observer => {
        this.dataService.saveOperatorTasks(wsiTask).subscribe(response => {
          if (response === 0) {
            if (isDuplicate) {
              this.sendAuditLog(observer, LogMessage.DuplicateTask, OperatoTaskAuditLogStatus.Succeeded, task, task.taskNameLocalized);
            } else if (task.isNew) {
              this.sendAuditLog(observer, LogMessage.CreateTask, OperatoTaskAuditLogStatus.Succeeded, task);
            } else {
              // should only use this on duplicate and creating new task
              // use updateTask to modify task
              this.trace.error(this.mod, 'Snapin logic error; save used instead of update');
            }
          }
          observer.next({ response, task });
          observer.complete();
        },
        err => {
          if (isDuplicate) {
            this.sendAuditLog(observer, LogMessage.DuplicateTask, OperatoTaskAuditLogStatus.Error, task, task.taskNameLocalized);
          } else if (task.isNew) {
            this.sendAuditLog(observer, LogMessage.CreateTask, OperatoTaskAuditLogStatus.Error, task);
          }
          this.trace.warn(this.mod, `sendSaveTask(): error= ${err}`);
          observer.next(err);
          observer.complete();
        }
        );
      });
    }
  }

  public sendUpdateTask(task: any, systemId?: number): Observable<any> {
    if (task) {
      const wsiTask = task.toWSITask();
      const taskIsRunning = this.selectedTask.status === OperatorTaskStatuses.Running || this.selectedTask.status === OperatorTaskStatuses.RunningWithException;
      return new Observable(observer => {
        this.dataService.updateTask(wsiTask, systemId).subscribe(
          response => {
            if (response === 0) {
              if (taskIsRunning) {
                this.sendAuditLog(observer, LogMessage.ChangeExpiration, OperatoTaskAuditLogStatus.Succeeded, task)
              } else {
                this.sendAuditLog(observer, LogMessage.SaveTask, OperatoTaskAuditLogStatus.Succeeded, task);
              }
            }
            observer.next(response);
            observer.complete();
          },
          err => {
            this.sendAuditLog(observer, LogMessage.SaveTask, OperatoTaskAuditLogStatus.Error, task);
          }
        );
      });
    }
  }

  public getOperatorTaskNode(systemId: number): void {
    this.dataService.getOperatorTaskNode(systemId).subscribe(
      response => {
        if (response) {
          this.operatorTaskRootNode = response;
          this.trace.debug(this.mod, `getOperatorTaskNode(${systemId}) returned: ${response}`);
        }
      },
      (error: any) => {
        this.trace.warn(this.mod, `getOperatorTaskNode(${systemId}) error: ${error}`);
      },
      () => {
        this.trace.debug(this.mod, `getOperatorTaskNode(${systemId}) completed.`);
      }
    );
  }

  public checkTaskNameForDuplicate(original: OperatorTaskModel): Observable<OperatorTaskModel> {
    if (original) {
      return new Observable(observer => {
        this.sendCheckTaskName(original.taskNameLocalized).subscribe(name => {
          const model = new OperatorTaskModel(this.trace, this.dataService);
          model.duplicateModel(original, this.user, name, this.dataService.systemIdSelected, original.targetDpIds);
          // model.duplicate();
          this.trace.debug(this.mod, `checkTaskNameForDuplicate() ${name}`);
          observer.next(model);
          observer.complete();
        },
        err => {
          this.trace.warn(this.mod, `checkTaskNameForDuplicate(): error ${err}`);
          observer.next(err);
          observer.complete();
        }
        );
      });
    }
  }

  public createNewTask(item: OperatorTaskTemplatesResponse, user: string): Observable<OperatorTaskModel> {
    return new Observable(observer => {
      this.sendCheckTaskName(item.TaskNameLocalized).subscribe(name => {
        const model = new OperatorTaskModel(this.trace, this.dataService);
        model.createModelFromTemplate(true, item, user, name);
        observer.next(model);
        observer.complete();
      },
      err => {
        observer.next(err);
        observer.complete();
      }
      );
    });
  }

  public sendTaskCommand(commandId: OperatorTaskCommandId, note?: string, newTime?: string, task?: OperatorTaskModel): Observable<any> {
    const taskToCommand = isNullOrUndefined(task) ? this.selectedTask : task;

    if (taskToCommand) {
      return new Observable(observer => {
        this.dataService.sendCommand(this.validationData, commandId, taskToCommand.id, newTime).subscribe(
          val => {
            if (val === 0) {
              this.trace.debug(this.mod, `sendTaskCommand(): response= ${val}`);
              this.sendAuditLog(observer, undefined, OperatoTaskAuditLogStatus.Succeeded, taskToCommand, null, note, commandId);
            }
            observer.next(val);
            observer.complete();
          },
          err => {
            this.trace.error(this.mod, `sendTaskCommand(): error ${err}`);
            this.sendAuditLog(observer, undefined, OperatoTaskAuditLogStatus.Error, taskToCommand, null, note, commandId);
            observer.next(err);
            observer.complete();
          }
        );
      });
    } else {
      this.trace.warn(this.mod, `sendTaskCommand(): task is undefined`);
    }
  }

  public sendCloseTaskCommand(note: string, task: OperatorTaskModel): Observable<any> {
    const taskToCommand = isNullOrUndefined(task) ? this.selectedTask : task;

    if (taskToCommand) {
      return new Observable(observer => {
        this.dataService.sendCloseCommand(this.validationData, taskToCommand.id).subscribe(
          val => {
            if (val === 0) {
              this.trace.debug(this.mod, `sendCloseTaskCommand(): response= ${val}`);
              this.sendAuditLog(observer, undefined, OperatoTaskAuditLogStatus.Succeeded, taskToCommand, null, note, OperatorTaskCommandId.Close);
            }
            observer.next(val);
            observer.complete();
          },
          err => {
            this.trace.error(this.mod, `sendCloseTaskCommand(): error ${err}`);
            this.sendAuditLog(observer, undefined, OperatoTaskAuditLogStatus.Error, taskToCommand, null, note, OperatorTaskCommandId.Close);
            observer.next(err);
            observer.complete();
          }
        );
      });
    } else {
      this.trace.warn(this.mod, `sendCloseTaskCommand(): task is undefined`);
    }
  }

  public sendAddNote(taskId: string, note: OperatorTaskNote): Observable<any> {
    return new Observable(observer => {
      this.dataService.addNote(taskId, note).subscribe(response => {
        this.trace.debug(this.mod, `sendAddNote(): response= ${response}`);
        observer.next(response);
        observer.complete();
      },
      err => {
        this.trace.warn(this.mod, `sendAddNote(): error= ${err}`);
        observer.next(err);
        observer.complete();
      }
      );
    });
  }

  public sendReadTask(): Observable<boolean> {
    const taskStatus = this.dataService.getTaskStatus();
    const opTask = this.dataService.getOperatorTasks();

    return new Observable<boolean>(observer => {
      taskStatus.pipe(
        switchMap(statuses => {

          this.initTaskStatusTranslated(statuses);
          return opTask.pipe(
            catchError(error => {
              this.trace.warn(this.mod, `Error in getting tasks: ${error}`);
              // Continue processing even if there's an error
              return Utility.EMPTY_OBSERVABLE;
            })
          );
        }),
        takeUntil(this.unsubscribeInit$)
      ).subscribe(
        tasks => {
          if (tasks) {
            const taskModels: OperatorTaskModel[] = [];
            tasks.forEach(t => {
              const model = new OperatorTaskModel(this.trace, this.dataService);
              model.createModelFromWSI(t);
              taskModels.push(model);
            });
            this._tasks = taskModels;
            this.updateActionsOnTask();
            this.tasksSubject.next(this._tasks);
          }
        },
        error => {
          this.trace.error(this.mod, `TaskList VM initialize error: ${error}`);
          observer.next(false);
        },
        () => {
          // get the operator task root node once, this is used for validation
          this.getOperatorTaskNode(this.dataService.systemIdSelected);
          this.trace.debug(this.mod, 'TaskList VM Initialized');
          observer.next(true);
        }
      );
    });
  }

  public initSingleTask(templatePath: string): Observable<any> {
    return this.dataService.getTaskStatus()
      .pipe(
        catchError(error => {
          return throwError(() => error);
        }),
        switchMap(statuses => {
          this.initTaskStatusTranslated(statuses);
          return this.dataService.getOperatorTaskNode(this.dataService.systemIdSelected)
            .pipe(
              catchError(error => {
                return throwError(() => error);
              })
            );
        }),
        switchMap((rootNode: string) => {
          if (rootNode) {
            this.operatorTaskRootNode = rootNode;
          } else {
            return throwError(new Error('Unable to get Operator Task Root Node'))
          }

          return this.dataService.getOperatorTaskTemplates(templatePath)
            .pipe(
              catchError(error => {
                return throwError(() => error);
              })
            );
        }),
        switchMap((templateRes: OperatorTaskTemplatesResponse[]) => {
          if (isNullOrUndefined(templateRes) || templateRes.length !== 1) {
            return throwError(new Error(`Unable to get Operator Task Template ${templateRes}`));
          }

          const template = templateRes[0];
          return this.createNewTask(template, this.dataService.user)
            .pipe(
              catchError(error => {
                return throwError(() => error);
              })
            );
        })
      );
  }

  public subscribeTaskChangeNotification(taskIds?: string | string[]): void {
    if (this.notificationSubscription === undefined) {
      this.notificationSubscription = this.dataService.taskChangeNotification
        .subscribe(tasks => this.onTaskChangeNotification(tasks));
    }

    this.dataService.subscribeTaskChangeNotification(taskIds);
  }

  public unsubscribeTaskChangeNotification(): void {
    this.dataService.unsubscribeTaskChangeNotification();

    if (this.notificationSubscription !== undefined) {
      this.notificationSubscription.unsubscribe();
      this.notificationSubscription = undefined;
    }

    if (this.taskChanged) {
      this.taskChanged.unsubscribe();
      this.taskChanged = undefined;
    }
  }

  private sendCheckTaskName(taskName: string): Observable<string> {
    return new Observable(observer => {
      this.dataService.checkTaskName(taskName).subscribe(
        response => {
          this.trace.debug(this.mod, `checkTaskName(): response= ${response}`);
          observer.next(response);
          observer.complete();
        },
        err => {
          this.trace.error(this.mod, `checkTaskName(): error ${err}`);
          observer.complete();
        }
      );
    });
  }

  private sendAuditLog(observer: any, log: LogMessage,
    status: OperatoTaskAuditLogStatus, task: OperatorTaskModel,
    addtlMsg?: string, note?: string, commandId?: OperatorTaskCommandId): void {
    const activityLog = this.createDefaultActivityLogData();
    // these are the only properties the snapin is responsible for
    activityLog.UserName = this.user;
    activityLog.Status = status;
    activityLog.MessageText = addtlMsg ?? '';
    activityLog.Comment = note ?? '';
    activityLog.SourceTime = Utility.encodeDateTime(new Date());
    const logMsg: LogMessage = commandId ? this.commandIdToLogMessage(commandId) : log;
    if (isNullOrUndefined(logMsg)) {
      this.trace.warn(this.mod, `sendAuditLog(): LogMessage is undefined, logging is skipped.`);
      return;
    }

    this.dataService.auditLog(logMsg, task.id, activityLog)
      .subscribe(
        response => {
          this.trace.debug(this.mod, `sendAuditLog():for ${LogMessage[logMsg]} = ${response}`);
          observer.next(response);
          observer.complete();
        },
        error => {
          this.errorFromWsi = this.dataService?.translations?.errorFromWsi;
          const msg = Utility.createErrorMessage(error, this.errorFromWsi);
          this.dataService.showToastNotification(ToastNotificationState.Danger,
            'Audit Log',
            msg);
          this.trace.warn(this.mod, `sendAuditLog():for ${LogMessage[logMsg]} = ${msg}`);
          observer.complete();
        }
      );
  }

  private createDefaultActivityLogData(): ActivityLogDataRepresentation {
    const previousValueWithQuality: ValueWithQualityRepresentation = {
      Quality: 0,
      VariantValue: ''
    };

    const valueWithQuality: ValueWithQualityRepresentation = {
      Quality: 0,
      VariantValue: ''
    };

    const errorCode: ClientMessageExRepresentation = {
      AssemblyName: '',
      BaseName: '',
      ResourceId: 0,
      ResourceName: '',
      SubstitutionText: ''
    };

    return {
      AttachmentURL: null,
      Comment: '',
      ErrorCode: errorCode,
      GmsAction: GmsActions.Unknown,
      GmsLogType: GmsActions.Unknown,
      LogUnconditional: false,
      MessageText: '', // the task name for duplicate and null on create task, save
      // task, delete task and commanding.
      MessageTextList: [],
      ObjectVersionNumber: 0,
      PreviousValue: null,
      PreviousValueWithQuality: previousValueWithQuality,
      RefTime: '',
      SourceDpId: null,
      SourceDpId2: null,
      SourceTime: '',
      Status: 0,
      Supervisor: null,
      UserName: '',
      Value: null,
      ValueWithQuality: valueWithQuality,
      WorkStation: ''
    };
  }

  private onTaskChangeNotification(changedTasks: OperatorTaskInfo[]): void {
    if (changedTasks.length > 0) {
      changedTasks.forEach(changedTask => {
        const existingtask = this._tasks.find((task => task.id === changedTask.Id));
        const index: number = this._tasks.findIndex(task => task.id === changedTask.Id);

        this.trace.debug(this.mod, `onTaskChangeNotification():
        count= ${changedTasks.length} | Removed: ${changedTask.Removed}
        | ${changedTask.TaskNameLocalized} | ${changedTask.Id} | ${OperatorTaskStatuses[changedTask.Status]}`)

        if (index === -1 && changedTask.Removed) { return; }

        if (index === -1) {
          const newTask = new OperatorTaskModel(this.trace, this.dataService);
          newTask.createModelFromWSI(changedTask);
          this._tasks.push(newTask);
        } else if (changedTask.Removed) {
          this._tasks.splice(index, 1);

          if (this.selectedTask !== undefined && this.selectedTask.id === changedTask.Id) {
            this.selectedTask = undefined;
            this.selectedTaskChanged.emit(undefined);
          }
        } else if (this.selectedTask === undefined || !this.isEditing() || (this.isEditing() && this.selectedTask.id !== changedTask.Id)) {
          // If the task is being edited is updated
          // Ignore updates.
          existingtask.createModelFromWSI(changedTask);
          if (this.selectedTask?.id === changedTask.Id) {
            // PCR - 2604352 - reassign the changed task to the current selected task
            existingtask.taskIsChanged = true;
            this.trace.debug(this.mod, `onTaskChangeNotification() Selected changed: ${this.selectedTask.taskNameLocalized}
            | Current status =  ${OperatorTaskStatuses[this.selectedTask.status]} | New status =  ${OperatorTaskStatuses[changedTask.Status]}`);
            this.updateSelectedTaskDataAndStateMachine(new TaskSelection(existingtask, TaskViewMode.View))
          } else {
            this.taskChanged.next();
          }
        }
      });

      this.tasksSubject.next(this._tasks);
    }
  }
  public isEditing(): boolean {
    return this.taskViewType === TaskViewMode.Add || this.taskViewType === TaskViewMode.Edit;
  }

  private commandIdToLogMessage(commandId: OperatorTaskCommandId): LogMessage {
    let logMsg;
    switch (commandId) {
      case OperatorTaskCommandId.Start:
        logMsg = LogMessage.StartTask;
        break;
      case OperatorTaskCommandId.Close:
        logMsg = LogMessage.CloseTask;
        break;
      case OperatorTaskCommandId.ChangeTime:
        logMsg = LogMessage.ChangeExpiration;
        break;
      case OperatorTaskCommandId.Revert:
        logMsg = LogMessage.Revert;
        break;
      case OperatorTaskCommandId.Abort:
        logMsg = LogMessage.Abort;
        break;
      default:
        this.trace.warn(this.mod, `commandIdToLogMessage(): unsupported ${commandId}`);
        break;
    }
    return logMsg;
  }

  private canUpdateAnyTask(): boolean {
    // Defect 2546853: Flex - Operator Tasks - user without Update rights can seemingly edit
    // tasks they did not create
    let result = true;
    // If CanUpdateAnyAuth is false, only the task created by the user can be edited
    if (!this.dataService.rightsService.CanUpdateAnyTasks && this.user !== this.selectedTask.createdBy) {
      result = false
    }
    return result;
  }

  private initTaskStatusTranslated(statuses: OperatorTaskStatus[]): void {
    Utility.taskStatusTranslated = new Map<number, OperatorTaskStatus>();
    statuses.forEach(val => {
      Utility.taskStatusTranslated.set(val.Id, val);
    });
  }
}
