/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */

import {
  OperatorTaskInfo,
  OperatorTaskNote,
  OperatorTaskTemplatesResponse,
  SaveOperatorTaskData,
  TaskAction
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';

import { OperatorTaskSnapinDataService } from '../services/operator-task-data.service';
import { TraceModules } from '../shared';
import { Utility } from '../shared/utility';
import { DateOption } from '../types/operator-task-date-options';
import { OperatorTaskStatuses } from '../types/operator-task-status';
import { OperatorTaskTargetCommandStatus } from '../types/operator-task-target-command-status';
import { RevertActionMode } from '../types/revert-action-mode';
import { OperatorTaskTargetViewModel } from '../view-model/operator-task-target-vm';
import { OperatorTaskNoteModel } from './operator-task-note-model';
import { TargetModel } from './target-model';
import {
  WsiOperatorTaskTargetRepresentation
} from './wsi-operator-task-target-representation';

export class OperatorTaskModel {
  public targetViewModels: OperatorTaskTargetViewModel[] = [];
  public cnsPath: string;
  public createdBy: string;
  // StartIn
  public deferDuration = 0;
  // FALSE when start is Immediate
  public deferred: boolean;
  public deferTime: string = Utility.UNSET_DATE_TIME_STRING;
  public deferTimeRun: string = Utility.UNSET_DATE_TIME_STRING;
  // EndIn
  public duration = 0;
  // EndAt
  public expirationTime: string = Utility.UNSET_DATE_TIME_STRING;
  public expirationTimeRun: string = Utility.UNSET_DATE_TIME_STRING;

  // End dateTime to show - changes based on task status
  public expirationTimeDisplay: string = Utility.UNSET_DATE_TIME_STRING;
  public fileContent: string;
  public id: string;

  // EndAt true  when ExpirationTime configured
  // false when Duration configured then ExpirationTime value updates as (Datetime.Now + Duration)
  public isExpirationConfig: boolean;
  public lastModificationTime: string = Utility.UNSET_DATE_TIME_STRING;
  public notesRequired: number = Utility.DEFAULT_NOTES_REQUIRED;
  public objectModelsAllowed: string[];
  public objectModelsNotAllowed: string[];
  public operatorTaskNotes: OperatorTaskNoteModel[];
  public previousStatus: number;
  public removed: boolean;
  public revertActionMode: number = Utility.DEFAULT_REVERT_ACTION;
  public scaledValues: boolean;
  public startedBy: string = Utility.DEFAULT_EMPTY_STRING;
  public startImmediate = '';
  public startAt = '';
  public startIn = '';
  public colonString = ': ';
  public dashString = ' - ';
  private _status: number;
  public get status(): number {
    return this._status;
  }

  public set status(value: number) {
    if (value !== this._status) {
      this._status = value;
    }
  }

  private _clientRemoved: number;
  public get ClientRemoved(): number {
    return this._clientRemoved;
  }

  public set ClientRemoved(value: number) {
    if (value !== this._clientRemoved) {
      this._clientRemoved = value;
    }
  }

  public get HasTargetChanges(): boolean {
    if (this.targetsDeleted) {
      return true;
    }
    return this.targetViewModels?.some(tvm => tvm.parameterValuesChanged === true || tvm.model?.targetIsNew === true);
  }

  public get HasTargetErrors(): boolean {
    return this.targetViewModels?.some(tvm => tvm.hasParameterValidationError === true);
  }

  public hasOverridableParameters: boolean;
  public systemId: number;
  public wsiTargetDpids: any;
  public targetDpIds: TargetModel[];
  public taskActions: TaskAction[];
  public taskDescription: string;
  public taskDescriptionLocalized: string;
  public taskNameLocalized: string;
  public templateNameLocalized: string;
  public timeoutForConditions: number;// The maximum timeout (in seconds) to wait for before checking the conditions, after the execution of the revert commands
  public validationComment: string = Utility.DEFAULT_EMPTY_STRING;
  public validRevertParameters: boolean;
  // Custom members (do not include in saving tasks)
  public isNew = false;// Only for add, not duplicate
  private _statusAndTimeValue: string;
  public get statusAndTimeValue(): string {
    return this._statusAndTimeValue;
  }

  public set statusAndTimeValue(value: string) {
    switch (this._status as OperatorTaskStatuses) {
      case OperatorTaskStatuses.CheckingPreconditions:
      case OperatorTaskStatuses.ExecutingCommands:
      case OperatorTaskStatuses.RevertingCommands:
      case OperatorTaskStatuses.Aborting:
        // These statuses don't have a message containing date/time
        break;
      case OperatorTaskStatuses.WaitingForConditions:
        if (this.timeoutForConditions > 0) {
          if (this.statusUpdateDateTime !== null && this.statusUpdateDateTime!.getTime() !== this.minDateTick) {
            const date = Utility.addSecondsToDate(new Date(this.statusUpdateDateTime), this.timeoutForConditions);
            value += this.colonString + date.toLocaleDateString(Utility.formatLang) + this.dashString + Utility.dateToLocaleTimeString(date);
          }
        }
        break;

      case OperatorTaskStatuses.Deferred:
        value = value + this.parseDateTimeForDisplay(this.deferTimeRun);
        break;
      case OperatorTaskStatuses.ClosedForMissingLicense:
        value = this.getStatusStringHelper(value);
        break;
      case OperatorTaskStatuses.Idle:
        value = this.statusUpdateDateTime.getTime() !== Utility.UNSET_DATE_TIME_DATE.getTime()
          ? Utility.taskStatusTranslated.get(OperatorTaskStatuses.CheckingPreconditions).Name
          : this.emptyString;
        break;
      default:
        value = this.getStatusStringHelper(value);
        break;
    }
    this.traceService.debug(this.modTrace, `${this.taskNameLocalized} | status = ${OperatorTaskStatuses[this.status]} | statusAndTimeValue() = ${value}`);
    this._statusAndTimeValue = value;
  }

  private _statusUpdateDateTime: Date = undefined;
  public statusUpdateDateTime: Date;

  public get StatusUpdateDateTime(): Date {
    if (this._status === OperatorTaskStatuses.Running || this._status === OperatorTaskStatuses.RunningWithException) {
      this._statusUpdateDateTime = new Date(this.expirationTimeRun);
    } else if (this._status === OperatorTaskStatuses.Deferred) {
      this._statusUpdateDateTime = new Date(this.deferTime);
    } else {
      this._statusUpdateDateTime = new Date(this.lastModificationTime);
    }

    return this._statusUpdateDateTime;
  }

  private _startDateType: DateOption;
  public startDateDisplay: string;
  public get startDateType(): DateOption {
    return this._startDateType;
  }

  public set startDateType(value: DateOption) {
    this._startDateType = value;
    this.startDateDisplay = this.parseDateDurationForDisplay(value, true);
  }

  private _endDateType: DateOption;
  public endDateDisplay: string;
  public get endDateType(): DateOption {
    return this._endDateType;
  }

  public set endDateType(value: DateOption) {
    this._endDateType = value;
    this.endDateDisplay = this.parseDateDurationForDisplay(value, false);

    switch (value) {
      case DateOption.DateTime:
        this.isExpirationConfig = true;
        break;
      case DateOption.Duration:
        this.isExpirationConfig = false;
      case DateOption.Immediate:
        break;
      default:
        this.traceService.warn(this.modTrace, `endDateType() unsupported value=${value}`)
        break;

    }
  }

  private _wsiOperatorTaskInfo: OperatorTaskInfo;
  public get wsiOperatorTaskInfo(): OperatorTaskInfo {
    return this._wsiOperatorTaskInfo;
  }

  public set wsiOperatorTaskInfo(value: OperatorTaskInfo) {
    if (value) {
      this._wsiOperatorTaskInfo = value;
    }
  }

  public targetsInitialized = false;
  public taskIsChanged = false;// Flag to denote changes from WSI
  public targetsDeleted = false;
  private readonly minDateTick = new Date(0).getTime();
  private readonly emptyString: string = '';
  private readonly modTrace = TraceModules.modelTrace;

  constructor(public readonly traceService: TraceService,
    public readonly dataService: OperatorTaskSnapinDataService) {

    if (this.dataService.translations === undefined) {
      return;
    }

    this.startImmediate = this.dataService.translations.startImmediateTitle;
    this.startAt = this.dataService.translations.startAtTitle;
    this.startIn = this.dataService.translations.startInTitle;
  }

  public createModelFromWSI(data: OperatorTaskInfo): void {
    try {
      this._wsiOperatorTaskInfo = data;
      this.assignTemplateProperties(data);
      this.createdBy = data.CreatedBy;
      this.deferDuration = data.DeferDuration;
      this.deferred = data.Deferred;
      this.deferTime = data.DeferTime;
      this.deferTimeRun = data.DeferTimeRun;
      this.expirationTime = data.ExpirationTime;
      this.expirationTimeRun = data.ExpirationTimeRun;
      this.id = data.Id;
      this.isExpirationConfig = data.IsExpirationConfig;
      this.lastModificationTime = data.LastModificationTime;
      this.operatorTaskNotes = this.parseNote(data.OperatorTaskNotesRepresentation);
      this.previousStatus = data.PreviousStatus;
      this.removed = data.Removed;
      this.startedBy = data.StartedBy;
      this.status = data.Status;
      this.systemId = data.SystemId;
      this.wsiTargetDpids = data.TargetDpIds;
      this.taskDescription = data.TaskDescriptionLocalized;
      this.taskNameLocalized = data.TaskNameLocalized;
      this.templateNameLocalized = data.TemplateNameLocalized;
      this.validationComment = data.ValidationComment;
      this.validRevertParameters = data.ValidRevertParameters;
      this.startDateType = this.determineStartDateType(data);
      this.endDateType = this.determineEndDateType(data);
      this.statusUpdateDateTime = this.determineStatusUpdateDateTime();
      this.statusAndTimeValue = this.localizedTaskStatusString;
      this.revertActionMode = data.RevertActionMode;

      if (data.Status === OperatorTaskStatuses.Deferred) {

        // end date type set at the task creation time
        // inferred based on the duration value
        if (data.Duration > 0) {
          const deferredTimeRun = new Date(data.DeferTimeRun);
          const parsedDuration = Utility.parseDuration(this.duration);
          deferredTimeRun.setDate(deferredTimeRun.getDate() + parsedDuration.days);

          deferredTimeRun.setHours(deferredTimeRun.getHours() + parsedDuration.hours);

          deferredTimeRun.setMinutes(deferredTimeRun.getMinutes() + parsedDuration.minutes);

          this.expirationTimeDisplay = deferredTimeRun.toISOString();
        } else {
          this.expirationTimeDisplay = this.expirationTime;
        }
      } else if (data.Status === OperatorTaskStatuses.ExecutingCommands && data.Duration > 0) {
        const expirationDateTime = this.statusUpdateDateTime;
        const parsedDuration = Utility.parseDuration(this.duration);
        expirationDateTime.setDate(expirationDateTime.getDate() + parsedDuration.days);

        expirationDateTime.setHours(expirationDateTime.getHours() + parsedDuration.hours);

        expirationDateTime.setMinutes(expirationDateTime.getMinutes() + parsedDuration.minutes);

        this.expirationTimeDisplay = expirationDateTime.toISOString();
      } else {
        this.expirationTimeDisplay = data.ExpirationTimeRun;
      }
    } catch (ex) {
      this.traceService.warn(this.modTrace, `createModelFromWSI() error caught: ${ex}`);
    }
  }

  public createModelFromTemplate(isNew: boolean, data: OperatorTaskTemplatesResponse | any,
    user: string, taskName?: string): void {
    this.assignTemplateProperties(data);
    this.isNew = true;
    this.id = Utility.createGuid();
    this.createdBy = user;
    this.taskNameLocalized = taskName ?? data.templateNameLocalized;
    this.startDateType = DateOption.Immediate;
    this.endDateType = DateOption.Duration;
    this.status = OperatorTaskStatuses.Idle;

    const defaultDeferTime = new Date();
    defaultDeferTime.setMinutes(defaultDeferTime.getMinutes() + 1);
    this.deferTime = defaultDeferTime.toISOString();

    // atleast more than a minute from start or defer date time.
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setMinutes(defaultExpiryDate.getMinutes() + 2);
    this.expirationTime = defaultExpiryDate.toISOString();

    this.startDateDisplay = this.parseDateDurationForDisplay(DateOption.DateTime, true);
    this.endDateDisplay = this.parseDateDurationForDisplay(DateOption.DateTime, false);

    this.operatorTaskNotes = [];
    this.taskDescription = data.TaskDescription;
    this.taskDescriptionLocalized = data.TaskDescriptionLocalized;
    this.targetDpIds = [];
    this.systemId = this.dataService.systemIdSelected;
  }

  public duplicateModel(data: OperatorTaskModel, user: string, name: string, systemIdSelected: number, targetDpIds: TargetModel[]): void {
    try {
      this.wsiOperatorTaskInfo = data._wsiOperatorTaskInfo;
      this.assignTemplateProperties(data.wsiOperatorTaskInfo);
      this.deferDuration = data.deferDuration;
      this.deferred = data.deferred;
      this.deferTime = data.deferTime;
      this.deferTimeRun = data.deferTimeRun;
      this.expirationTime = data.expirationTime;
      this.expirationTimeRun = data.expirationTimeRun;
      this.isExpirationConfig = data.wsiOperatorTaskInfo.IsExpirationConfig;
      this.lastModificationTime = data.lastModificationTime;
      this.previousStatus = data.previousStatus;
      this.removed = data.removed;
      this.startedBy = data.startedBy;
      this.taskDescription = data.taskDescriptionLocalized;
      this.templateNameLocalized = data.templateNameLocalized;
      this.validationComment = data.validationComment;
      this.validRevertParameters = data.validRevertParameters;
      this.revertActionMode = data.revertActionMode;
      // reset properties
      this.duplicate(user, name, systemIdSelected, targetDpIds, data);
    } catch (ex) {
      this.traceService.warn(this.modTrace, `createModelFromWSI() error caught: ${ex}`);
    }
  }

  public duplicate(user: string, taskName: string, system: number, targetDpIds: TargetModel[], data: OperatorTaskModel): void {
    // reset properties
    this.createdBy = user;
    this.taskNameLocalized = taskName;
    this.systemId = system;
    this.id = Utility.createGuid();
    this.statusUpdateDateTime = Utility.UNSET_DATE_TIME_DATE;
    this.status = OperatorTaskStatuses.Idle;
    this.operatorTaskNotes = [];

    // reset start date
    this.deferred = false;
    this.deferDuration = 0;
    this.deferTime = Utility.UNSET_DATE_TIME_STRING;
    this.startDateType = DateOption.Immediate;

    // keep end date selection but change the value
    if (!this.isExpirationConfig) {
      this.expirationTime = new Date().toISOString();
    } else if (new Date(this.expirationTime).getDate() < new Date().getDate()) {
      this.expirationTime = new Date().toISOString();
    }

    if (this.revertActionMode === RevertActionMode.ForcedManual) {
      this.revertActionMode = RevertActionMode.Automatic;
    }
    this.isNew = false;// only when adding
    this.resetTargetsParamsForDuplication(targetDpIds);

    // these properties are cloned, but requires initialization after some properties have been
    // reset
    this.endDateType = this.determineEndDateType(data.wsiOperatorTaskInfo);
    this.statusAndTimeValue = data.statusAndTimeValue;
  }

  public parseDateTimeForDisplay(dt: string | Date): string {
    let result = '';

    if (!isNullOrUndefined(dt)) {
      if (typeof dt === 'string') {
        const date = new Date(dt);
        result = date.toLocaleDateString(Utility.formatLang) + this.dashString + Utility.dateToLocaleTimeString(date);
      } else if (dt instanceof Date) {
        result = dt.toLocaleDateString(Utility.formatLang) + this.dashString + Utility.dateToLocaleTimeString(dt);
      }
    }
    return result;
  }

  // Text from textgroup
  public get localizedTaskStatusString(): string {
    let value: string;
    switch (this._status as OperatorTaskStatuses) {
      // If CheckingPreconditions fails, the status is set back
      // to idle; see statusAndTimeValue()
      case OperatorTaskStatuses.CheckingPreconditions:
      case OperatorTaskStatuses.ExecutingCommands:
      case OperatorTaskStatuses.RevertingCommands:
      case OperatorTaskStatuses.Aborting:
      case OperatorTaskStatuses.WaitingForConditions:
        value = Utility.taskStatusTranslated.get(this._status).Name;
        break;

      case OperatorTaskStatuses.Closed:
      case OperatorTaskStatuses.ClosedForMissingLicense:
      case OperatorTaskStatuses.Expired:
      case OperatorTaskStatuses.ReadyToBeClosed:
      case OperatorTaskStatuses.Failed:
      case OperatorTaskStatuses.Deferred:
        value = `${Utility.taskStatusTranslated.get(this._status).Name}${this.colonString}`;
        break;

      case OperatorTaskStatuses.Running:
      case OperatorTaskStatuses.RunningWithException:
        value = `${Utility.taskStatusTranslated.get(this._status).Name}${this.colonString}`;
        break;

      default:
        value = this.emptyString;
        break;
    }
    return value;
  }

  public toWSITask(): SaveOperatorTaskData {
    try {
      return {
        Id: this.id,
        CnsPath: this.cnsPath,
        Status: this.status.valueOf(),
        CreatedBy: this.createdBy,
        TaskDescriptionLocalized: this.taskDescriptionLocalized,
        TaskNameLocalized: this.taskNameLocalized,
        TemplateNameLocalized: this.templateNameLocalized,
        FileContent: this.fileContent,
        RevertActionMode: this.revertActionMode, // this.revertActionMode.valueOf(),
        SystemId: this.systemId,
        DeferDuration: this.deferDuration,
        DeferTime: Utility.encodeDateTimeFromString(this.deferTime),
        IsExpirationConfig: this.isExpirationConfig,
        Duration: this.duration,
        ExpirationTime: Utility.encodeDateTimeFromString(this.expirationTime),
        ExpirationTimeRun: Utility.encodeDateTimeFromString(this.expirationTimeRun),
        TargetDpIds: this.toWSITarget(),

        // these properties are not snapin responsiblity, but are required by wsi
        DeferTimeRun: Utility.encodeDateTimeFromString(this.deferTimeRun),
        Deferred: this.deferred,
        HasOverridableParameters: this.hasOverridableParameters,
        LastModificationTime: Utility.encodeDateTimeFromString(this.lastModificationTime),
        NotesRequired: this.notesRequired,
        ObjectModelsAllowed: this.objectModelsAllowed,
        ObjectModelsNotAllowed: this.objectModelsNotAllowed,
        OperatorTaskNotesRepresentation: this.toWSINote(),
        PreviousStatus: 0, // this.previousStatus,
        Removed: false,
        ScaledValues: false,
        StartedBy: this.startedBy,
        TimeoutForConditions: this.timeoutForConditions,
        ValidRevertParameters: true,
        ValidationComment: this.validationComment
      };
    } catch (error) {
      this.traceService.error(this.modTrace, 'toWSITask() error', error);
    }

  }

  public resetChangeAndErrorFlags(): void {
    this.targetViewModels?.forEach(tvm => {
      tvm.parameterValuesChanged = false;
      if (!isNullOrUndefined(tvm.parameterRevertModel)) {
        tvm.parameterRevertModel.hasValidationError = false;
      }

      if (!isNullOrUndefined(tvm.paramaterActionModel)) {
        tvm.paramaterActionModel.hasValidationError = false;
      }
    });
    this.targetsDeleted = false;
  }

  private resetTargetsParamsForDuplication(targetDpIds: TargetModel[]): void {
    // values should be persisted
    // status should be reset
    // closed duplicated: original value should display original value
    this.targetDpIds = targetDpIds;
    this.targetsInitialized = false;
    for (const key in this.wsiOperatorTaskInfo.TargetDpIds) {
      const data = this.wsiOperatorTaskInfo.TargetDpIds[key];
      data.Status = OperatorTaskTargetCommandStatus.Unknown;
      data.RevertActionStatus = OperatorTaskTargetCommandStatus.Unknown;
    }

    // reset targets in both raw and model
    this.wsiTargetDpids = this.wsiOperatorTaskInfo.TargetDpIds;
    this.targetDpIds?.forEach(target => {
      // In case of duplication, if a targetKey require a param with
      // original value per the revert command,
      // the runtime value of the revert command parameter must be reset (= null)
      // const x = target.runtimeValueForRevert?._type !== VariantType.Uninitialized;
      if (this.hasRevertActions() && target.useOriginalValueForRevert) {
        target.runtimeValueForRevert = null;
      }
      target.targetStatus = OperatorTaskTargetCommandStatus.Unknown;
      target.revertActionStatus = OperatorTaskTargetCommandStatus.Unknown;
    });
  }

  private parseObjectModel(data: string[] | any): string[] {
    let result: string[];
    // PCR (Product Change Request) 2562707: DCC 8.0 FT2 : in Flex Client datapoints for
    // operator tasks cannot be selected
    // Fix: Allow all object models when a wildcard is present.
    if (data?.includes(Utility.ALLOWW_ALL_OM)) {
      result = [];
    } else {
      result = data;
    }
    return result;
  }

  private determineStartDateType(data: any): DateOption {
    let result = DateOption.DateTime;
    if (this.status === OperatorTaskStatuses.Idle || this.status === OperatorTaskStatuses.Failed) {
      if (!data.Deferred) {
        result = DateOption.Immediate;
      } else if (data.DeferDuration > 0) {
        result = DateOption.Duration;
      } else {
        result = DateOption.DateTime;
      }
    }
    return result;
  }

  private determineEndDateType(data: any): DateOption {
    let result = DateOption.DateTime;
    if (this.status === OperatorTaskStatuses.Idle || this.status === OperatorTaskStatuses.Failed) {
      if (data.IsExpirationConfig) {
        result = DateOption.DateTime;
      } else {
        result = DateOption.Duration;
      }
    }
    return result;
  }

  private parseNote(note: OperatorTaskNote[]): any[] {
    const result = [];
    if (!isNullOrUndefined(note)) {
      note.forEach(val => result.push(new OperatorTaskNoteModel(val, val.User, this.dataService.translations)));
    }
    return result;
  }

  private determineStatusUpdateDateTime(): Date {
    let result;
    if (this._status === OperatorTaskStatuses.Running
      || this._status === OperatorTaskStatuses.RunningWithException) {
      result = new Date(this.expirationTimeRun);
    } else if (this._status === OperatorTaskStatuses.Deferred) {
      result = new Date(this.deferTime);
    } else {
      result = new Date(this.lastModificationTime);
    }

    return result;
  }

  private parseDateDurationForDisplay(dateOption: DateOption, isStart: boolean): string {
    let result: string;
    if (this.status === OperatorTaskStatuses.Idle || this.status === OperatorTaskStatuses.Failed) {
      switch (dateOption) {
        case DateOption.Immediate:
          if (isStart) {
            result = this.startImmediate;
          }
          break;
        case DateOption.DateTime:
          result = isStart
            ? this.startAt + ' ' + this.parseDateTimeForDisplay(this.deferTime)
            : this.startAt + ' ' + this.parseDateTimeForDisplay(this.expirationTime);
          break;
        case DateOption.Duration:
          result = isStart
            ? this.startIn + ' ' + this.formatDurationDisplay(this.deferDuration)
            : this.startIn + ' ' + this.formatDurationDisplay(this.duration);
          break;
        default:
          result = this.emptyString;
          break;
      }
    }
    return result;
  }

  private formatDurationDisplay(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const day = days > 0 ? `${days}d` : '';
    const hour = hours > 0 ? `${hours}h` : '';
    const min = minutes > 0 ? `${minutes}m` : '';

    return `${day} ${hour} ${min}`.trim();

  }

  private getStatusStringHelper(value: string): string {
    return value = value + this.parseDateTimeForDisplay(this.statusUpdateDateTime);
  }

  private assignTemplateProperties(data: any): void {
    // template properties
    this.cnsPath = data.CnsPath;
    this.templateNameLocalized = data.TemplateNameLocalized;
    this.fileContent = data.FileContent;
    this.scaledValues = data.ScaledValues;
    this.taskDescription = data.TaskDescriptionLocalized;
    this.taskDescriptionLocalized = data.TaskDescriptionLocalized;
    this.duration = data.Duration;
    this.revertActionMode = data.RevertActionMode;
    this.timeoutForConditions = data.TimeoutForConditions;
    this.notesRequired = data.NotesRequired;
    this.taskActions = data.TaskActions;
    this.objectModelsAllowed = this.parseObjectModel(data.ObjectModelsAllowed);
    this.objectModelsNotAllowed = this.parseObjectModel(data.ObjectModelsNotAllowed);
    this.hasOverridableParameters = data.HasOverridableParameters;
  }

  private toWSITarget(): any {
    try {
      const wsiTargets: { [key: string]: WsiOperatorTaskTargetRepresentation } = {};
      this.targetDpIds.forEach(target => {
        const t = target.toWsiTarget();
        wsiTargets[t.key] = t.wsiTarget;
      });
      return wsiTargets;
    } catch (e) {
      this.traceService.error(TraceModules.modelTrace, `toWSITargets() error: ${e}`);
    }
  }

  private toWSINote(): OperatorTaskNote[] {
    const wsiNotes: OperatorTaskNote[] = [];
    this.operatorTaskNotes.forEach(note => {
      const wsiNote: OperatorTaskNote = {
        Date: Utility.encodeDateTimeFromString(note.date),
        User: note.user,
        Description: note.description,
        ActionDetailsId: note.actionDetailsId,
        ActionDetailsText: note.actionDetailsText
      };
      wsiNotes.push(wsiNote);
    });
    return wsiNotes;
  }

  public initializeTargets(canConfigureTaskData: boolean): void {
    this.targetDpIds = []
    if (!isNullOrUndefined(this.wsiTargetDpids)) {
      for (const key in this.wsiTargetDpids) {
        if ({}.hasOwnProperty.call(this.wsiTargetDpids, key)) {
          const model = new TargetModel(this.traceService, this, false, undefined, {
            cnsPathDesignation: key,
            wsTargetRep: this.wsiTargetDpids[key]
          }, canConfigureTaskData);

          this.targetDpIds.push(model);
        } else {
          this.traceService.debug(this.modTrace, `parseTargets():${key} doesnt have properties`);
        }
      }
    }

    this.targetsInitialized = true;
  }

  public getActionsByObjectModel(objectModel: string): TaskAction {
    let result: TaskAction;
    if (this.objectModelsAllowed.length === 0) {
      // for wildcarded object models, there should only be one task
      result = this.taskActions[0];
    } else {
      result = this.taskActions.find(t => t.TargetObjectModels.find(om => om === objectModel));
    }

    return result;
  }

  public hasRevertActions(): boolean {
    let result = false;
    if (this.taskActions) {
      for (let i = 0; i <= this.taskActions.length; i++) {
        if (this.taskActions[i]
          && this.taskActions[i].RevertAction) {
          result = true;
          break;
        }
      }
    }
    return result;
  }

  public isDefaultParameterValueSet(objectModel: string): OperatorTaskTargetViewModel {
    const defaultVM = this.targetViewModels.find(vm =>
      vm.model.objectModel === objectModel && vm.isDefaultValue
    );

    return defaultVM;
  }

  public traceData(): string {
    return `status=${this.status} |targetDpIds= ${this.targetDpIds?.length} |revertActionMode= ${this.revertActionMode}
    |statusAndTimeValue= ${this.statusAndTimeValue} |name= ${this.taskNameLocalized} |id= ${this.id}`;
  }
}
