import { LogMessage, OperatorTaskNote } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';

import { OperatorTaskTranslations } from '../shared/operator-task-translations';
import { Utility } from '../shared/utility';

export class OperatorTaskNoteModel {
  public actionDetailsText: string;// i.e. Close task command executed.
  public date: string;
  public description: string;// the user note
  public user: string;
  private _actionDetailsId: LogMessage;// i.e 21
  private taskStartExecuted = '';
  private taskRevertExecuted = '';
  private taskExpirationChanged = '';
  private taskCloseExecuted = '';
  private taskAbortExecuted = '';
  public isNoteValid(text: string): boolean {
    let result;
    if (isNullOrUndefined(text)) {
      result = false;
    } else {
      text = text.trim();
    }
    return result;
  }

  public get actionDetailsId(): LogMessage {
    return this._actionDetailsId;
  }

  public set actionDetailsId(value: LogMessage) {
    // NOTE: this is also used in Logging but only a subset of values are used in Notes
    this._actionDetailsId = value;
    switch (value) {
      case LogMessage.StartTask:
        this.actionDetailsText = this.taskStartExecuted;
        break;
      case LogMessage.CloseTask:
        this.actionDetailsText = this.taskCloseExecuted;
        break;
      case LogMessage.ChangeExpiration:
        this.actionDetailsText = this.taskExpirationChanged;
        break;
      case LogMessage.Revert:
        this.actionDetailsText = this.taskRevertExecuted;
        break;
      case LogMessage.Abort:
        this.actionDetailsText = this.taskAbortExecuted;
        break;
      // Not supported
      case LogMessage.CreateTask:
      case LogMessage.SaveTask:
      case LogMessage.DuplicateTask:
      case LogMessage.DeleteTask:
      case LogMessage.TaskFailed:
      case LogMessage.TaskExpired:
      case LogMessage.TaskReadyToBeClosed:
      case LogMessage.TaskRunning:
      case LogMessage.TaskClosed:
      case LogMessage.TaskAborting:
      case LogMessage.TaskClosedForMissingLicense:
      case LogMessage.TaskWaitingForConditions:
      case LogMessage.TaskRunningWithException:
      case LogMessage.TaskCheckingPreconditions:
      case LogMessage.TaskExecutingCommands:
      case LogMessage.TaskRevertingCommands:
      case LogMessage.TaskWaitingForDeferTime:
      case LogMessage.ExecutingCommand:
      case LogMessage.ExecutingRevertCommand:
      case LogMessage.ExecutingAutomaticRevertCommand:
      case LogMessage.TaskNameLocalized:
      case LogMessage.TaskName:
      case LogMessage.TaskDescriptionLocalized:
      case LogMessage.TaskDescription:
      case LogMessage.StartDate:
      case LogMessage.DueDate:
      case LogMessage.RevertActionMode:
      case LogMessage.TargetsRemoved:
      case LogMessage.TargetsAdded:
      default:        
        break;
    }
  }

  constructor(existingNote: OperatorTaskNote, user: string, translations: OperatorTaskTranslations, detailsId?: number, date?: string) {
    this.setTranslations(translations);
    
    if (!isNullOrUndefined(existingNote)) {
      // PCR (Product Change Request) 2604310: Fix - used property instead of private field
      // (typo) which  sets actionDetailsText
      this.actionDetailsId = existingNote.ActionDetailsId;
      this.user = existingNote.User;
      this.description = existingNote.Description;
      this.date = Utility.decodeDateTimeToString(existingNote.Date);
    } else {
      this.user = user;
      this.date = date;
      this.actionDetailsId = detailsId;
    }  
  }

  public toWsiNote(): OperatorTaskNote {
    return {
      ActionDetailsId: this.actionDetailsId,
      ActionDetailsText: this.actionDetailsText,
      Date: Utility.encodeDateTimeFromString(this.date),
      Description: this.description,
      User: this.user
    };
  }

  private setTranslations(translations: OperatorTaskTranslations): void {
    if (translations === undefined) {
      return;
    }

    this.taskStartExecuted = translations.notesActionStart;
    this.taskRevertExecuted = translations.notesActionRevert;
    this.taskExpirationChanged = translations.notesActionExpirationChanged;
    this.taskCloseExecuted = translations.notesActionClose;
    this.taskAbortExecuted = translations.notesActionAbort;
  }
}
