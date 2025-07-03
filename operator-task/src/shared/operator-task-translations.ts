import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';

export class OperatorTaskTranslations {

  public snapInTitle = '';

  // Content
  public emptyStateContent = '';
  public emptyHeading = '';
  public ownerTitle: string;
  public statusDetailsTitle: string;
  public statusIconTitle: string;
  public nameTitle: string;

  public duplicateTitle: any | string;
  public deleteTitle: any | string;
  public editTitle: any | string;
  public saveTitle: any | string;
  public duplicateMessage = '';
  public deleteMessage1 = '';
  public deleteMessage2 = '';
  public cancelMessage = '';
  public discardHeading = '';
  public discardTitle = '';
  public duplicateErrorTarget = '';
  public duplicateError = '';
  public errorFromWsi = '';
  public taskSavedTitle = '';
  public taskSavedMsg = '';
  public changesSaved = '';
  public hasBeenDeleted = '';
  public selectedTaskDeleted = '';

  // Info
  public headingNotes = '';
  public headingTarget = '';
  public emptyTargetsHeading: string;
  public statusHeading = '';
  public revertWarningTitle = '';
  public startCommandText = '';
  public revertCommandText = '';
  public closeCommandText = '';
  public abortCommandText = '';
  public addTargetTitle = '';
  public deleteTargetTitle = '';
  public infoColumnTitle = '';
  public targetColumnTitle = '';
  public commandParameterColumnTitle = '';
  public revertParameterColumnTitle = '';
  public defaultColumnTitle = '';
  public resultsColumnTitle = '';
  public omSourceTitle: string;
  public manualRevertNote = '';
  public noteModalTitle?: string;
  public noTaskHeading: string;
  public selectTaskToShowDetails: string;
  public startImmediateTitle = '';
  public startAtTitle = '';
  public startInTitle = '';
  public taskNameTitle = '';
  public taskIdCopyTooltip = ''
  public descriptionTitle = '';
  public startDateTitle = '';
  public endDateTitle = '';
  public manualModeLabel = '';
  public automaticModeLabel = '';
  public revertTitle = '';
  public changeTimeText: '';
  public alreadyExists = '';
  public characterMin = '';
  public dateTimeInvalid = '';
  public dateFormatInvalid = '';
  public characterMinSpaceOkay = '';
  public durationInvalid = '';
  public required = '';
  public startRangeInvalid = '';
  public endRangeInvalid = '';
  public targetInvalid = '';
  public notesActionStart = '';
  public notesActionClose = '';
  public notesActionExpirationChanged = '';
  public notesActionRevert = '';
  public notesActionAbort = '';
  public textForcedManual = '';
  public textForcedManualValidated = '';
  public textNoRevert = '';
  public textEnterYourNote = '';
  public abortWarning = '';
  public closeWarning = '';
  public dueDateExpiredWarning = '';
  public deferredDueDateIncorrect = '';
  public noAutoRevertWarning = '';
  public errorTargetNotPresent = '';
  public errorCommandValidation = '';
  public targetWarningDefaultEmptyParameter = '';
  public targetChangeDefaultValuesForAll = '';
  public commandFailed = '';
  public commandSuccessful = '';
  public addNoteText = '';
  public addNoteTitle = '';
  public originalTitle = '';

  public targetNoneText = '';
  public targetMissingValues = '';
  // shared
  public cancelTitle: string;
  public addTitle: string;
  public initialized = false;
  public unSavedDataTaskSave = '';
  public todayText = '';

  public failedToAssign = '';
  public close = '';
  public taskDuplicatedHeading = ''
  public taskDeletedHeading = '';
  public keepSource = '';
  public deleteSource = '';
  public startTask = '';
  public taskDeleted = '';
  public manualRevertShort = '';

  public translationsChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.initialized);

  private readonly subscriptions: Subscription[] = [];

  constructor(private readonly translateService: TranslateService) {
  }

  public clear(): void {
    this.subscriptions.forEach((subscription: Subscription) => { if (subscription !== undefined) { subscription.unsubscribe(); } });
    if (this.translationsChanged !== undefined) {
      this.translationsChanged.unsubscribe();
    }
  }

  public initializeTranslation(): void {
    this.subscriptions.push(this.translateService.get(
      [
        'SNAPIN-TITLE',

        'MASTER-EMPTY-STATE-HEADING',
        'MASTER-EMPTY-STATE-INFO',
        'MASTER-ACTION-ADD',
        'MASTER-ACTION-CREATE',
        'MASTER-ACTION-DUPLICATE',
        'MASTER-ACTION-DELETE',
        'MASTER-COLUMN-NAME-STATUS',
        'MASTER-COLUMN-NAME-TASKNAME',
        'MASTER-COLUMN-NAME-STATUS-DETAILS',
        'MASTER-COLUMN-NAME-CREATED-BY',

        'DETAIL-EMPTY-STATE-INFO',
        'DETAIL-TARGET-EMPTY-INFO',
        'DETAIL-TASK-NAME',
        'DETAIL-TASK-ID-COPY-TOOLTIP',
        'DETAIL-ACTION-EDIT',
        'DETAIL-ACTION-SAVE',
        'DETAIL-ACTION-CANCEL',
        'DETAIL-TASK-DESCRIPTION',
        'DETAIL-TASK-STATUS',
        'DETAIL-TASK-START-DATE',
        'DETAIL-TASK-DUE-DATE',
        'DETAIL-TASK-START-IMMEDIATE',
        'DETAIL-TASK-START-AT',
        'DETAIL-TASK-START-IN',
        'DETAIL-TASK-COMMAND-START',
        'DETAIL-TASK-COMMAND-REVERT',
        'DETAIL-TASK-COMMAND-CLOSE',
        'DETAIL-TASK-COMMAND-ABORT',
        'DETAIL-TARGET-TITLE',
        'DETAIL-TARGET-ADD',
        'DETAIL-TARGET-DELETE',
        'DETAIL-TARGET-REVERT-MODE',
        'DETAIL-TARGET-REVERT-MANUAL',
        'DETAIL-TARGET-REVERT-AUTO',
        'DETAIL-TARGET-REVERT-FORCED-MANUAL',
        'DETAIL-TARGET-REVERT-NO-REVERT',
        'DETAIL-TARGET-NONE-VALUE',
        'DETAIL-TARGET-TODAY-DATE-VALUE',
        'DETAIL-TARGET-TABLE-EMPTY',
        'DETAIL-TARGET-COLUMN-NAME-INFO',
        'DETAIL-TARGET-COLUMN-NAME-TARGET',
        'DETAIL-TARGET-COLUMN-NAME-COMMAND-PARAMETER',
        'DETAIL-TARGET-COLUMN-NAME-REVERT-PARAMETER',
        'DETAIL-TARGET-COLUMN-NAME-DEFAULT-VALUE',
        'DETAIL-TARGET-COLUMN-NAME-RESULTS',
        'DETAIL-TARGET-ORIGINAL-VALUE',
        'DETAIL-NOTE-TITLE',
        'DETAIL-NOTE-ADD',
        'DETAIL-NOTE-ENTER',
        'DETAIL-NOTE-ACTION-START',
        'DETAIL-NOTE-ACTION-CLOSE',
        'DETAIL-NOTE-ACTION-EXPIRATION-CHANGED',
        'DETAIL-NOTE-ACTION-REVERT',
        'DETAIL-NOTE-ACTION-ABORT',
        'MODEL-TASK-LOWER-CASE-AT',
        'MODEL-TASK-LOWER-CASE-UNTIL',

        'DETAIL-MSG-INLINE-DATETIME-CHANGE',
        'DETAIL-MSG-INLINE-DATETIME-INVALID',
        'DETAIL-MSG-INLINE-REQUIRED',
        'DETAIL-MSG-INLINE-TASK-NAME-EXISTS',
        'DETAIL-MSG-INLINE-CHARACTER-LENGTH-MINIMUM',
        'DETAIL-MSG-INLINE-CHARACTER-LENGTH-MINIMUM-NON-SPACE',
        'DETAIL-MSG-INLINE-DATETIME-DURATION-INVALID',
        'DETAIL-MSG-INLINE-DATETIME-START-INVALID',
        'DETAIL-MSG-INLINE-DATETIME-END-INVALID',
        'DETAIL-MSG-INLINE-TARGET-INVALID',
        'DETAIL-MSG-INLINE-TARGET-MISSING-VALUES',
        'DETAIL-MSG-INLINE-DATE-FORMAT-INVALID',

        'MSG-BOX-TEXT-UNSAVED-DATA-TASK-SAVE',
        'MSG-BOX-TEXT-ABORT-WARNING',
        'MSG-BOX-TEXT-CLOSE-WARNING',
        'MSG-BOX-TEXT-TASK-MANUAL-REVERT-REQUIRED',
        'MSG-BOX-TEXT-DUE-DATE-EXPIRY-WARNING',
        'MSG-BOX-TEXT-DEFFERRED-DUE-DATE-INCORRECT',
        'MSG-BOX-TEXT-AUTO-REVERT-WARNING',
        'MSG-BOX-TEXT-AUTO-REVERT-WARNING-VALIDATED',
        'MSG-BOX-TEXT-DUPLICATE-ERROR-TARGET',
        'MSG-BOX-TEXT-DUPLICATE-ERROR',
        'MSG-BOX-TEXT-TARGET-NOT-PRESENT',
        'MSG-BOX-TEXT-COMMAND-VALIDATION-FAILED',
        'MSG-BOX-TEXT-WSI-ERROR',
        'MSG-BOX-TEXT-TARGET-TYPE-NOT-SUPPORTED-ERROR',
        'MSG-BOX-TEXT-MULTIPLE-COMMANDS-ERROR',
        'MSG-BOX-TEXT-SELECTED-TASK-REMOVED',

        'MSG-BOX-OBJECT-MANAGER-TITLE',
        'MSG-BOX-DELETE-TITLE',
        'MSG-BOX-DELETE-TEXT',
        'MSG-BOX-CANCEL-TITLE',
        'MSG-BOX-DISCARD-HEADING',
        'MSG-BOX-DISCARD-TITLE',
        'MSG-BOX-CANCEL-BUTTON-TEXT',
        'MSG-BOX-EMPTY-PARAMETER-TEXT',
        'MSG-BOX-PARAMETER-DEFAULT-APPLY-TEXT',

        'TOAST-NOTIFICATION-TITLE-TASK-SAVE',
        'TOAST-NOTIFICATION-MSG-CHANGES-SAVED',
        'TOAST-NOTIFICATION-MSG-TASK-DELETE',
        'TOAST-NOTIFICATION-MSG-TASK-SAVE',
        'TOAST-NOTIFICATION-MSG-EXECUTE-COMMAND-SUCCESS',
        'TOAST-NOTIFICATION-MSG-EXECUTE-COMMAND-FAILED',
        'TOAST-NOTIFICATION-TITLE-ADD-NOTE',

        'HEADING-MSG-BOX-TARGET-DEFAULT',
        'BUTTON-LABEL-CLOSE',
        'HEADING-MSG-BOX-DUPLICATE',
        'BUTTON-LABEL-KEEP-SOURCE',
        'BUTTON-LABEL-DELETE-SOURCE',
        'BUTTON-LABEL-START-TASK',
        'HEADING-MSG-BOX-DUPLICATE',
        'MSG-BOX-TEXT-TASK-MANUAL-REVERT-REQUIRED-SHORT',
        'BUTTON-LABEL-PROCEED',
        'HEADING-TOAST-NOTIFICATION-DUPLICATE',,
        'HEADING-MSG-BOX-DELETED'
      ]).subscribe(values => {

      this.initialized = true;

      this.snapInTitle = values['SNAPIN-TITLE'];

      // Content
      this.emptyHeading = values['MASTER-EMPTY-STATE-HEADING'];
      this.emptyStateContent = values['MASTER-EMPTY-STATE-INFO'];

      this.addTitle = values['MASTER-ACTION-ADD'];
      this.duplicateTitle = values['MASTER-ACTION-DUPLICATE'];
      this.deleteTitle = values['MASTER-ACTION-DELETE'];

      this.editTitle = values['DETAIL-ACTION-EDIT'];
      this.saveTitle = values['DETAIL-ACTION-SAVE'];
      this.cancelTitle = values['DETAIL-ACTION-CANCEL'];

      this.statusIconTitle = values['MASTER-COLUMN-NAME-STATUS'];
      this.nameTitle = values['MASTER-COLUMN-NAME-TASKNAME'];
      this.ownerTitle = values['MASTER-COLUMN-NAME-CREATED-BY'];
      this.statusDetailsTitle = values['MASTER-COLUMN-NAME-STATUS-DETAILS'];

      this.duplicateMessage = values['MSG-BOX-DUPLICATE-TEXT'];
      this.cancelMessage = values['MSG-BOX-CANCEL-TITLE'];
      this.discardHeading = values['MSG-BOX-DISCARD-HEADING'];
      this.discardTitle = values['MSG-BOX-DISCARD-TITLE'];
      this.duplicateErrorTarget = values['MSG-BOX-TEXT-DUPLICATE-ERROR-TARGET'];
      this.duplicateError = values['MSG-BOX-TEXT-DUPLICATE-ERROR'];
      this.errorFromWsi = values['MSG-BOX-TEXT-WSI-ERROR'];

      this.taskSavedTitle = values['TOAST-NOTIFICATION-TITLE-TASK-SAVE'];
      this.taskSavedMsg = values['TOAST-NOTIFICATION-MSG-TASK-SAVE'];
      this.changesSaved = values['TOAST-NOTIFICATION-MSG-CHANGES-SAVED'];
      this.hasBeenDeleted = values['TOAST-NOTIFICATION-MSG-TASK-DELETE'];
      this.selectedTaskDeleted = values['MSG-BOX-TEXT-SELECTED-TASK-REMOVED'];

      // Info Comp
      this.noTaskHeading = values['MASTER-EMPTY-STATE-HEADING'];
      this.selectTaskToShowDetails = values['DETAIL-EMPTY-STATE-INFO'];
      this.nameTitle = values['DETAIL-TASK-NAME'];
      this.taskIdCopyTooltip = values['DETAIL-TASK-ID-COPY-TOOLTIP'];
      this.descriptionTitle = values['DETAIL-TASK-DESCRIPTION'];
      this.startDateTitle = values['DETAIL-TASK-START-DATE'];
      this.endDateTitle = values['DETAIL-TASK-DUE-DATE'];
      this.manualModeLabel = values['DETAIL-TARGET-REVERT-MANUAL'];
      this.automaticModeLabel = values['DETAIL-TARGET-REVERT-AUTO'];
      this.revertTitle = values['DETAIL-TARGET-REVERT-MODE'];
      this.headingNotes = values['DETAIL-NOTE-TITLE'];
      this.headingTarget = values['DETAIL-TARGET-TITLE'];
      this.infoColumnTitle = values['DETAIL-TARGET-COLUMN-NAME-INFO'];
      this.targetColumnTitle = values['DETAIL-TARGET-COLUMN-NAME-TARGET'];
      this.commandParameterColumnTitle = values['DETAIL-TARGET-COLUMN-NAME-COMMAND-PARAMETER'];
      this.revertParameterColumnTitle = values['DETAIL-TARGET-COLUMN-NAME-REVERT-PARAMETER'];
      this.defaultColumnTitle = values['DETAIL-TARGET-COLUMN-NAME-DEFAULT-VALUE']
      this.resultsColumnTitle = values['DETAIL-TARGET-COLUMN-NAME-RESULTS'];
      this.startCommandText = values['DETAIL-TASK-COMMAND-START'];
      this.revertCommandText = values['DETAIL-TASK-COMMAND-REVERT'];
      this.notesActionExpirationChanged = values['DETAIL-NOTE-ACTION-EXPIRATION-CHANGED'];
      this.closeCommandText = values['DETAIL-TASK-COMMAND-CLOSE'];
      this.abortCommandText = values['DETAIL-TASK-COMMAND-ABORT'];
      this.changeTimeText = values['DETAIL-MSG-INLINE-DATETIME-CHANGE'];
      this.addTargetTitle = values['DETAIL-TARGET-ADD'];
      this.deleteTargetTitle = values['DETAIL-TARGET-DELETE'];
      this.emptyHeading = values['DETAIL-TARGET-TABLE-EMPTY'];
      this.statusHeading = values['DETAIL-TARGET-COLUMN-NAME-STATUS'];
      this.startImmediateTitle = values['DETAIL-TASK-START-IMMEDIATE'];
      this.startAtTitle = values['DETAIL-TASK-START-AT'];
      this.startInTitle = values['DETAIL-TASK-START-IN'];
      this.notesActionStart = values['DETAIL-NOTE-ACTION-START'];
      this.notesActionClose = values['DETAIL-NOTE-ACTION-CLOSE'];
      this.notesActionRevert = values['DETAIL-NOTE-ACTION-REVERT'];
      this.notesActionAbort = values['DETAIL-NOTE-ACTION-ABORT'];
      this.textForcedManual = values['DETAIL-TARGET-REVERT-FORCED-MANUAL'];
      this.textNoRevert = values['DETAIL-TARGET-REVERT-NO-REVERT'];
      this.textEnterYourNote = values['DETAIL-NOTE-ENTER'];
      this.addNoteTitle = values['DETAIL-NOTE-ADD'];
      this.originalTitle = values['DETAIL-TARGET-ORIGINAL-VALUE'];
      this.targetNoneText = values['DETAIL-TARGET-NONE-VALUE'];
      this.dateTimeInvalid = values['DETAIL-MSG-INLINE-DATETIME-INVALID'];
      this.dateFormatInvalid = values['DETAIL-MSG-INLINE-DATE-FORMAT-INVALID']
      this.required = values['DETAIL-MSG-INLINE-REQUIRED'];
      this.alreadyExists = values['DETAIL-MSG-INLINE-TASK-NAME-EXISTS'];
      this.characterMin = values['DETAIL-MSG-INLINE-CHARACTER-LENGTH-MINIMUM'];
      this.characterMinSpaceOkay = values['DETAIL-MSG-INLINE-CHARACTER-LENGTH-MINIMUM-NON-SPACE'];
      this.durationInvalid = values['DETAIL-MSG-INLINE-DATETIME-DURATION-INVALID'];
      this.startRangeInvalid = values['DETAIL-MSG-INLINE-DATETIME-START-INVALID'];
      this.endRangeInvalid = values['DETAIL-MSG-INLINE-DATETIME-END-INVALID'];
      this.targetInvalid = values['DETAIL-MSG-INLINE-TARGET-INVALID'];
      this.targetMissingValues = values['DETAIL-MSG-INLINE-TARGET-MISSING-VALUES'];
      this.abortWarning = values['MSG-BOX-TEXT-ABORT-WARNING'];
      this.closeWarning = values['MSG-BOX-TEXT-CLOSE-WARNING'];
      this.dueDateExpiredWarning = values['MSG-BOX-TEXT-DUE-DATE-EXPIRY-WARNING'];
      this.deferredDueDateIncorrect = values['MSG-BOX-TEXT-DEFFERRED-DUE-DATE-INCORRECT'];
      this.noAutoRevertWarning = values['MSG-BOX-TEXT-AUTO-REVERT-WARNING'];
      this.textForcedManualValidated = values['MSG-BOX-TEXT-AUTO-REVERT-WARNING-VALIDATED'];
      this.errorTargetNotPresent = values['MSG-BOX-TEXT-TARGET-NOT-PRESENT'];
      this.errorCommandValidation = values['MSG-BOX-TEXT-COMMAND-VALIDATION-FAILED'];

      this.omSourceTitle = values['MSG-BOX-OBJECT-MANAGER-TITLE'];
      this.cancelTitle = values['MSG-BOX-CANCEL-BUTTON-TEXT'];
      this.manualRevertNote = values['MSG-BOX-TEXT-TASK-MANUAL-REVERT-REQUIRED'];
      this.targetWarningDefaultEmptyParameter = values['MSG-BOX-EMPTY-PARAMETER-TEXT'];
      this.targetChangeDefaultValuesForAll = values['MSG-BOX-PARAMETER-DEFAULT-APPLY-TEXT'];
      this.commandSuccessful = values['TOAST-NOTIFICATION-MSG-EXECUTE-COMMAND-SUCCESS'];
      this.commandFailed = values['TOAST-NOTIFICATION-MSG-EXECUTE-COMMAND-FAILED'];
      this.addNoteText = values['TOAST-NOTIFICATION-TITLE-ADD-NOTE'];
      this.todayText = values["DETAIL-TARGET-TODAY-DATE-VALUE"];
      this.unSavedDataTaskSave = values['MSG-BOX-TEXT-UNSAVED-DATA-TASK-SAVE'];

      this.failedToAssign = values['HEADING-MSG-BOX-TARGET-DEFAULT']
      this.close = values['BUTTON-LABEL-CLOSE'];
      this.taskDuplicatedHeading = values['HEADING-MSG-BOX-DUPLICATE'];

      this.keepSource = values['BUTTON-LABEL-KEEP-SOURCE'];
      this.deleteSource = values['BUTTON-LABEL-DELETE-SOURCE'];
      this.startTask = values['BUTTON-LABEL-START-TASK'];
      this.taskDeleted = values['HEADING-MSG-BOX-DUPLICATE'];
      this.manualRevertShort = values['MSG-BOX-TEXT-TASK-MANUAL-REVERT-REQUIRED-SHORT'];
      this.taskDeleted = values['HEADING-MSG-BOX-DELETED'];

      this.translationsChanged.next(this.initialized);
    }));
  }
}
