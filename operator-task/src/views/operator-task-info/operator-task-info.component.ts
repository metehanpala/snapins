import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input, NgZone,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { FullSnapInId } from '@gms-flex/core';
import { BrowserObject, CnsLabel, GmsMessageData, LogMessage, ValidationResultStatus } from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode, DatatableComponent, SelectionType } from '@siemens/ngx-datatable';
import {
  ConfirmationDialogResult,
  MenuItem,
  ModalRef,
  ResizeObserverService,
  SiActionDialogService,
  SiFormContainerComponent,
  SiFormValidationError,
  SiModalService,
  ViewType
} from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable';
import { asapScheduler, forkJoin, map, Observable, Subscription } from 'rxjs';

import { OperatorTaskModel } from '../../model/operator-task-model';
import { OperatorTaskNoteModel } from '../../model/operator-task-note-model';
import { ParameterControl } from '../../model/parameter-model';
import { TargetModel } from '../../model/target-model';
import { TaskDateTimeControl } from '../../model/task-date-time-control';
import { TaskDurationTimeControl } from '../../model/task-duration-time-control';
import { OperatorTaskSnapinDataService } from '../../services/operator-task-data.service';
import { TraceModules } from '../../shared';
import { OperatorTaskTranslations } from '../../shared/operator-task-translations';
import { Utility } from '../../shared/utility';
import {
  OperatorTaskAlertType,
  ToastNotificationState
} from '../../types/operator-task-alert-type';
import { OperatorTaskCommandId } from '../../types/operator-task-command-names';
import { DateOption } from '../../types/operator-task-date-options';
import { OperatorTaskErrorTypes } from '../../types/operator-task-error-types';
import { OperatorTaskStatuses } from '../../types/operator-task-status';
import { OperatorTaskUserActionType } from '../../types/operator-task-user-action-type';
import {
  CommandParametersInfo,
  eGmsDataType,
  OverridableParameters
} from '../../types/overridable-parameter-types';
import { RevertActionMode } from '../../types/revert-action-mode';
import { TaskViewMode } from '../../view-model/operator-task-list-vm';
import { OperatorTaskTargetViewModel } from '../../view-model/operator-task-target-vm';

@Component({
  selector: 'gms-operator-task-info',
  templateUrl: './operator-task-info.component.html',
  styleUrl: './operator-task-info.component.scss',
  standalone: false
})
export class OperatorTaskInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() public list: OperatorTaskModel[] = null;
  @Input() public snapInId: FullSnapInId = null;
  @Input() public goBack: Observable<boolean> = new Observable<boolean>();
  @Input() public countRows = 0;
  @Input() public saveEvent: Observable<void>;
  @Input() public taskListVm: any;
  @Input() public gmsMessageData!: GmsMessageData;
  @Output() public readonly notifyParent: EventEmitter<void> = new EventEmitter();
  @ViewChild('infoContainer', { static: true }) public infoContainer: ElementRef;
  @ViewChild('targetContainer') public targetContainer: ElementRef;
  @ViewChild(DatatableComponent) public table?: DatatableComponent;
  @ViewChild(SiFormContainerComponent) public formContainer!: SiFormContainerComponent<typeof this.form.controls>;
  @ViewChild('notesTemplate', { static: true }) public notesTemplate!: TemplateRef<any>;
  @ViewChild('modalWarningTemplate', { static: true }) public modalWarningTemplate!: TemplateRef<any>;
  @ViewChild('alertModalWithIconTemplate', { static: true }) public alertModalWithIconTemplate!: TemplateRef<any>;

  public startDueRadioReadOnly: boolean;
  public revertModeDisabled: boolean;
  public alertModalIcon: any;
  public alertModalIconColor: any;
  public alertStackedIcon: any;
  public alertStackedColor: any;
  public selectedTask: OperatorTaskModel;
  public selectionType = SelectionType.cell;
  public viewType: TaskViewMode = TaskViewMode.NoSelection;
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public containerWidth: number;
  public containerClass = '';
  public currCnsLabel: CnsLabel = null;
  public headingNotes = '';
  public headingTarget = '';
  public emptyHeading: string;
  public statusHeading = '';
  // Commands
  public startCommandText = '';
  public revertCommandText = '';
  public closeCommandText = '';
  public abortCommandText = '';
  public startCommandEnabled = false;
  public revertCommandEnabled = false;
  public closeCommandEnabled = false;
  public abortCommandEnabled = false;
  public startCommandPrimary = false;
  public revertCommandPrimary = false;
  public closeCommandPrimary = false;
  public abortCommandPrimary = false;
  public rows: OperatorTaskTargetViewModel[] = [];
  public isTargetsAccordionOpen = true;
  public addTargetTitle = '';
  public deleteTargetTitle = '';
  public omSourceTitle: string;
  public tableViewType: ViewType;
  // RevertActionMode is set to automatic and user does not have Allow Automatic Revert security right
  public textForcedManual = '';
  // RevertActionMode is set to automatic and targets have validation (Supervised or with FourEyes).
  public textForcedManualValidation = "Manual revocation after task completion required due to validation profile.\n\nStart task?";
  public textNoRevertCommand = '';
  // Notes
  public isNotesAccordionOpen = false;
  public addNoteDisabled = true;
  public addNoteTitle = '';
  public cancelTitle = '';
  public manualRevertNote = '';
  public notesActionClose: string;
  public notesActionStart: string;
  public notesActionRevert: string;
  public notesActionAbort: string;
  public noteModalTitle?: string;
  public noTaskHeading: string;
  public selectTaskToShowDetails: string;
  public showRevertColumn = false;
  // Form
  public form: FormGroup;
  public labelWidth = 140;
  public startDateIn: TaskDurationTimeControl;
  public endDateIn: TaskDurationTimeControl;
  public startDateAt: TaskDateTimeControl;
  public endDateAt: TaskDateTimeControl;
  public startDateAtControlName = 'startDateAtControlName';
  public startDateInControlName = 'startDateInControlName';
  public endDateAtControlName = 'endDateAtControlName';
  public endDateInControlName = 'endDateInControlName';
  public descriptionControl: FormControl;
  public descriptionControlName = 'description';
  // these are regular controls, no additional properties
  public nameControl: FormControl;
  public nameControlValidators: ValidatorFn[];
  public startImmediateTitle = '';
  public startAtTitle = '';
  public startInTitle = '';
  public nameTitle = '';
  public descriptionTitle = '';
  public startDateTitle = '';
  public endDateTitle = '';
  public targetContentActions: MenuItem[] = [];
  public manualModeLabel = '';
  public automaticModeLabel = '';
  public revertTitle = '';
  public dateOptions = DateOption;
  public errorCodeTranslateKeyMap: Map<string, string>;
  public controlNameTranslateKeyMap: Map<string, string>;
  public errorCommandValidation: string;
  public commandFailed = '';
  public commandSuccessful = '';
  public infoColumnTitle = '';
  public targetColumnTitle = '';
  public commandParameterColumnTitle = '';
  public revertParameterColumnTitle = '';
  public defaultColumnTitle = '';
  public resultsColumnTitle = '';
  public originalValue = '';
  public selectedTaskDeleted = '';
  public noneStringPlaceholder = '';
  public taskIdCopyTooltip = '';
  public revertModeText = '';
  public singleColumnWidth = 100;
  public noTitle = '';
  public yesTitle = '';
  public close = '';
  public get textEnterYourNote(): string {
    return this._textEnterYourNote;
  }

  public set textEnterYourNote(value: string) {
    this._textEnterYourNote = value;
  }
  public get modalWarningMessage(): string {
    return this._modalWarningMessage;
  }

  public set modalWarningMessage(value: string) {
    this._modalWarningMessage = value;
  }

  public get modalWarningTitle(): string {
    return this._modalWarningTitle;
  }

  public set modalWarningTitle(value: string) {
    this._modalWarningTitle = value;
  }

  public contextObjectList: BrowserObject[] = [];
  public isObjInfoOpen = false;
  public isLoadingTargets = false;
  public selectedCommand: OperatorTaskCommandId;
  public canConfigureTaskData = false;
  private _noteInput?: string = '';

  public get noteInput(): string {
    return this._noteInput;
  }

  public set noteInput(value: string) {
    if (isNullOrUndefined(value) || Utility.REGEX_ALL_WHITESPACE.test(value)) {
      this.addNoteDisabled = true;
    } else {
      this.addNoteDisabled = false;
      this._noteInput = value;
    }
  }

  private failedToAssign = '';
  private startTask = '';

  protected readonly parameterControl = ParameterControl;
  protected readonly operatorTaskStatuses = OperatorTaskStatuses;
  protected readonly operatorTaskRevertActionMode = RevertActionMode;
  protected readonly isNullOrUndefined = isNullOrUndefined;
  protected readonly utility = Utility;
  protected readonly taskViewType = TaskViewMode;
  protected readonly commandNames = OperatorTaskCommandId;
  protected readonly ColumnMode = ColumnMode;
  private addTargetMenu: MenuItem;
  // private deleteTargetMenu: MenuItem;
  private selectedTarget: OperatorTaskTargetViewModel;
  private note: OperatorTaskNoteModel;
  private readonly nameControlName = 'name';
  // Note that this control does not have a corresponding html element
  private readonly targetRowControlName = 'targetRowControlName';
  private targetRowControl: FormControl;
  private deleteTitle = '';
  private saveTitle = '';
  private editTitle = '';
  private selectedTaskChangedSubscription: Subscription;
  private saveButtonSubscription: Subscription;
  private readonly siModalSubscriptions: Subscription[] = [];
  // errorCodeTranslateKeyMap Value Properties
  private alreadyExists = '';
  private characterMin = '';
  private dateTimeInvalid = '';
  private durationInvalid = '';
  private required = '';
  private startRangeInvalid = '';
  private endRangeInvalid = '';
  private dateFormatInvalid = '';
  private readonly subscriptions: Subscription[] = [];
  private ref?: ModalRef<unknown>;
  private readonly centeredModalClass = 'modal-dialog-centered';
  private readonly modTrace = TraceModules.detailsTrace;
  private changeTimeText: string;
  private _textEnterYourNote = '';
  private _modalWarningTitle: string;
  private _modalWarningMessage: string;
  private _logMessage: LogMessage;
  private _outgoingTask: OperatorTaskModel;
  private abortWarning: string;
  private closeWarning: string;
  private dueDateExpiredWarning: string;
  private deferredDueDateIncorrect: string;
  private noAutoRevertWarning: string;
  private errorTargetNotPresent: string;
  private userAction: OperatorTaskUserActionType = OperatorTaskUserActionType.NotSupported;
  private addNoteText: string;
  private duplicateTitle: string;
  private descriptionControlValidators: ValidatorFn[];
  private characterMinSpaceOkay: string;
  private targetInvalid = '';
  private targetMissingValues = '';
  private targetChangedSubscriptions: Subscription[] = [];
  private targetWarningDefaultEmptyParameter = '';
  private targetChangeDefaultValuesForAll = '';
  private unSavedDataTaskSave = '';
  private taskDeleted = '';
  private readonly siModal = inject(SiActionDialogService);

  public constructor(
    private readonly traceService: TraceService,
    private readonly resizeObserver: ResizeObserverService,
    private readonly translateService: TranslateService,
    private readonly dataService: OperatorTaskSnapinDataService,
    private readonly siModalSvc: SiModalService,
    public readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly siActionDialogService: SiActionDialogService) {
    this.buildForm();
  }

  private _selectedEndDateOption: DateOption;

  public get selectedEndDateOption(): DateOption {
    return this._selectedEndDateOption;
  }

  public set selectedEndDateOption(value: DateOption) {
    this._selectedEndDateOption = value;
    if (this.viewType === TaskViewMode.Edit || this.viewType === this.taskViewType.Add) {
      switch (value) {
        case DateOption.DateTime:
          this.endDateIn.clearUpdateValidators();
          this.endDateAt.minDateValidation();
          if (this.selectedStartDateOption === DateOption.DateTime) {
            this.endDateAt.subscribeDateRangeValidation(this.selectedStartDateOption, this.startDateAt.control, false);
            this.startDateAt.subscribeDateRangeValidation(this.selectedEndDateOption, this.endDateAt.control, true);
          }

          this.endDateAt.editableControl(this.selectedTask, false);
          break;
        case DateOption.Duration:
          if (this.selectedStartDateOption === DateOption.DateTime) {
            this.startDateAt.clearRangeValidation();
          }

          this.endDateAt.clearValidatorsAndUnsubscribe('selectedEndDateOption');
          this.endDateIn.editableControl(this.selectedTask.duration);
          break;
        default:
          this.traceService.debug(this.modTrace, `selectedEndDateOption() default case ${value}`);
          break;
      }
    } else if (this.viewType === TaskViewMode.View) {
      switch (value) {
        case DateOption.Immediate:
          this.endDateAt.disableControlAndUnsubscribe('selectedEndDateOption');
          break;
        case DateOption.DateTime:
          break;
        case DateOption.Duration:
          this.endDateAt.disableControlAndUnsubscribe('selectedEndDateOption');
          break;
        default:
          this.traceService.debug(this.modTrace, `selectedEndDateOption() default case ${value}`);
          break;
      }
    }
  }

  private _selectedStartDateOption: DateOption;

  public get selectedStartDateOption(): DateOption {
    return this._selectedStartDateOption;
  }

  public set selectedStartDateOption(value: DateOption) {
    this._selectedStartDateOption = value;

    if (this.viewType === TaskViewMode.Edit || this.viewType === this.taskViewType.Add) {
      switch (this._selectedStartDateOption) {
        case DateOption.Immediate:
          if (this.selectedEndDateOption === DateOption.DateTime) {
            this.endDateAt.clearRangeValidation();
          }

          this.startDateIn.clearUpdateValidators();
          this.startDateAt.clearValidatorsAndUnsubscribe('selectedStartDateOption');
          break;
        case DateOption.DateTime:
          this.startDateIn.clearUpdateValidators();

          this.startDateAt.minDateValidation();
          if (this.selectedEndDateOption === DateOption.DateTime) {
            this.startDateAt.subscribeDateRangeValidation(this.selectedEndDateOption, this.endDateAt.control, true);
            this.endDateAt.subscribeDateRangeValidation(this.selectedStartDateOption, this.startDateAt.control, false);
          }

          this.startDateAt.editableControl(this.selectedTask, true);
          break;
        case DateOption.Duration:
          if (this.selectedEndDateOption === DateOption.DateTime) {
            this.endDateAt.clearRangeValidation();
          }

          this.startDateAt.clearValidatorsAndUnsubscribe('selectedStartDateOption');
          this.startDateIn.editableControl(this.selectedTask.deferDuration);
          break;
        default:
          this.traceService.debug(this.modTrace, `selectedStartDateOption() default case ${value}`);
          break;
      }
    } else if (this.viewType === TaskViewMode.View) {
      switch (value) {
        case DateOption.Immediate:
          this.startDateAt.disableControlAndUnsubscribe('selectedStartDateOption');
          break;
        case DateOption.DateTime:
          break;
        case DateOption.Duration:
          this.startDateAt.disableControlAndUnsubscribe('selectedStartDateOption');
          break;
        default:
          this.traceService.debug(this.modTrace, `selectedStartDateOption() default case ${value}`);
          break;
      }
    }

  }

  private _selectedRevertMode: any;

  public get selectedRevertMode(): any {
    return this._selectedRevertMode;
  }

  public set selectedRevertMode(value: any) {
    if (value === 0) {
      this._selectedRevertMode = this.operatorTaskRevertActionMode.Manual;
    } else {
      this._selectedRevertMode = this.operatorTaskRevertActionMode.Automatic;
    }

  }

  // Show field required for Edit and Add.
  public get revertModeTitle(): string {
    return this.viewType === TaskViewMode.Add || this.viewType === TaskViewMode.Edit ? '*' + this.revertTitle : this.revertTitle;
  }

  // public get isReadOnly(): boolean {
  //   let result = false;
  //   if (this.viewType === TaskViewMode.View || this.viewType === TaskViewMode.NoSelection) {
  //     result = true;
  //   } else if (this.viewType === TaskViewMode.Edit &&
  //     (this.selectedTask.status === OperatorTaskStatuses.Expired
  //       || this.selectedTask.status === OperatorTaskStatuses.RunningWithException
  //       || this.selectedTask.status === OperatorTaskStatuses.Running)) {
  //     result = false;
  //   }
  //   return result;
  // }

  public get nameErrors(): SiFormValidationError[] {
    const errors = this.formContainer?.getValidationErrors();
    return errors?.filter(error => error.errorCode === 'name');
  }

  public get descriptionErrors(): SiFormValidationError[] {
    const errors = this.formContainer?.getValidationErrors();
    return errors?.filter(error => error.errorCode === 'description');
  }

  public readonly trackByIndex = (index: number): number => index;

  public goToSystemCommand(targetBo: BrowserObject): void {
    this.dataService.goToSystemCommand.next(targetBo);
  }

  public addEnabled(): boolean {
    // applies to target add button and target row controls
    return (this.viewType === TaskViewMode.Add || this.viewType === TaskViewMode.Edit)
      && this.taskListVm.canConfigureTaskData;
  }

  public ngOnInit(): void {
    this.subscriptions.push(this.resizeObserver.observe(this.infoContainer.nativeElement, 100, true, true).subscribe(() => this.onContainerResize()));

    this.subscriptions.push(this.dataService.translations.translationsChanged.subscribe(available => {
      if (available) {
        this.translateStrings();

        if (this.errorCodeTranslateKeyMap !== undefined) {
          this.errorCodeTranslateKeyMap.clear();
        }

        this.errorCodeTranslateKeyMap = new Map<string, string>([
          // When using non-custom validation use syntax: formControlName.errorKey, translationValue
          // When using custom validation  syntax: errorKey, translationValue
          // Note: empty values are used to suppress duplicate errors
          ['startRangeInvalid', this.startRangeInvalid],
          ['nameAlreadyExists', this.alreadyExists],
          ['nameMin', this.characterMin],
          ['minDurationInvalid', this.durationInvalid],
          ['minDate', this.dateTimeInvalid],
          ['endRangeInvalid', this.endRangeInvalid],
          ['targetMin', this.targetInvalid],
          ['description.required', this.characterMinSpaceOkay],
          ['targetMissingValues', this.targetMissingValues],
          ['dateFormat', this.dateFormatInvalid],
          ['endDateAtControlName.required', this.required],
          ['startDateAtControlName.required', this.required]
        ]);
      }
    }));

    this.subscriptions.push(this.taskListVm.taskChanged.subscribe(() => {
      this.onTaskChanged();
    }));

    this.init();

    this.saveButtonSubscription = this.saveEvent.subscribe({
      next: v => {
        this.traceService.debug(this.modTrace, `saveButtonSubscription ${v}`);
        this.handleSaveButton();
      },
      error: e => this.traceService.warn(this.modTrace, `saveButtonSubscription error= ${e}`),
      complete: () => this.traceService.debug(this.modTrace, `saveButtonSubscription complete`)
    })
  }

  public ngAfterViewInit(): void {
    this.subscriptions.push(this.dataService.cnsDisplayTypeChanged.subscribe(cnsLabel => {
      this.rows.forEach(vm => {
        vm.setDisplayName(this.dataService.cnsLabel);
      })
    }));
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        subscription.unsubscribe();
      }
    });

    this.selectedTaskChangedSubscription?.unsubscribe();
    this.saveButtonSubscription?.unsubscribe();

    this.startDateAt?.unsubscribeSubscriptions('ngOnDestroy');
    this.endDateAt?.unsubscribeSubscriptions('ngOnDestroy');

    this.siModalSubscriptions.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        this.traceService.debug(this.modTrace, `ngOnDestroy() unsubscribing si modal subs`);
        subscription.unsubscribe();
      }
    });
    this.clearTargetSubscriptions('onDestroy');
    this.ref?.detach();
  }

  public isEditing(): boolean {
    return this.viewType === TaskViewMode.Add || this.viewType === TaskViewMode.Edit;
  }

  public durationSubmit(value: any, id: string): void {

    switch (id) {
      case "startDateIn":
        this.startDateIn.submitted(value);
        if (this.startDateIn.control.status !== 'INVALID') {
          this.selectedTask.deferred = true;
          this.selectedTask.deferDuration = this.startDateIn.getPropertyValue();
        }

        break;
      case "endDateIn":
        this.endDateIn.submitted(value);
        if (this.endDateIn.control.status !== 'INVALID') {
          this.selectedTask.isExpirationConfig = false;
          this.selectedTask.duration = this.endDateIn.getPropertyValue();
        }

        break;
      default:
        break;
    }
  }

  public dateSubmit(id: string): void {
    // Note: Called only when modal closes, but not if the value did not change
    this.startDateAt.control.updateValueAndValidity();
    this.endDateAt.control.updateValueAndValidity();
    switch (id) {
      case "startDateAt":
        if (this.startDateAt.control.status !== 'INVALID') {
          this.saveStartDate();
        }

        break;
      case "endDateAt":
        if (this.endDateAt.control.status !== 'INVALID') {
          this.saveEndDate()
        }

        break;
      default:
        break;
    }
  }

  public datatableOnSelect(items: OperatorTaskTargetViewModel[]): void {
    const selected = items?.[0];
    if (selected === this.selectedTarget) {
      return;
    }
    this.selectedTarget = selected;
    // check the revert of the previous target first
    if (this.selectedTarget && this.viewType !== TaskViewMode.View) {
      if (this.selectedTarget.parameterRevertModel) {
        if (Utility.isNullOrWhitespace(this.selectedTarget.parameterRevertModel.editableValue)) {
          this.selectedTarget.parameterRevertModel.useOriginalValue = true;
          // this.selectedTarget.parameterRevertModel.reverseOnUserOriginal();
        } else {
          this.selectedTarget.parameterRevertModel.useOriginalValue = false;
        }
      }
    }

    // this.selectedTarget = selected;
    if (this.selectedTarget) {
      this.contextObjectList = [];
      this.contextObjectList.push(this.selectedTarget.model.bo);
    }

    this.updateButtonState();
  }

  public onAddTarget(): void {
    const config = this.dataService.getObjectManagerConfig(this.selectedTask.objectModelsAllowed);
    this.subscriptions.push(
      this.dataService.selectDataPoints(this.omSourceTitle, config).subscribe(
        selectedPoints => {
          if (selectedPoints) {
            this.dataService.addDataPoint.next(selectedPoints);
            this.filterAndCreateTargetModels(selectedPoints);
          }
        },
        error => {
          this.traceService.warn(this.modTrace, `onAddTarget() error: ${error}`);
        }
      )
    );
  }

  public onDeleteTarget(row: any): void {
    try {
      const updatedRows = this.rows.filter(r => r !== row);
      this.rows = updatedRows;
      this.selectedTask.targetsDeleted = true;
      this.subscribeToTargetChanges();
      this.setTargetErrors();
    } catch (ex) {
      this.traceService.error(this.modTrace, `Error on deleteTarget(): ${ex}`);
    }
  }

  public resizeTable(): void {
    asapScheduler.schedule(() => this.table?.recalculate(), 20);
  }

  public calculateMinHeight(): any {
    const baseHeight = 300;
    if (this.selectedTask.targetDpIds?.length > 10) {
      const minHeight = Math.max(this.selectedTask.targetDpIds.length * 50, baseHeight);
      return minHeight + 'px';
    }
    return baseHeight + 'px';
  }

  public getControlErrorsForDuration(controlName: string): SiFormValidationError[] {
    const errors: SiFormValidationError[] = this.formContainer?.getValidationErrors(controlName);
    return errors?.filter(error => error.errorCode === 'minDurationInvalid');
  }

  public targetErrors(): SiFormValidationError[] {
    const errors = this.formContainer?.getValidationErrors();
    const targetErrorCodes = ['targetMin', 'targetMissingValues'];
    return errors?.filter(error => targetErrorCodes.includes(error.errorCode));
  }

  public onSelectCommand(commandName: OperatorTaskCommandId): void {
    // revert warning - manual start/security and changetime
    // notes yes - on all, if abort, abort message then notes
    let modalTitle = '';
    let detailsId: LogMessage;
    let needRevertForManual = false;
    let msg = '';
    let yes = '';
    const no = this.cancelTitle;
    this.selectedCommand = commandName;
    switch (commandName) {
      case OperatorTaskCommandId.Start:
        this.userAction = OperatorTaskUserActionType.Start;
        modalTitle = this.startCommandText;
        detailsId = LogMessage.StartTask;
        needRevertForManual = this.selectedTask.revertActionMode === RevertActionMode.Manual;
        msg = this.manualRevertNote;
        yes = this.startTask;
        break;
      case OperatorTaskCommandId.Abort:
        this.userAction = OperatorTaskUserActionType.Abort;
        modalTitle = this.abortCommandText;
        detailsId = LogMessage.Abort;
        msg = this.abortWarning;
        yes = this.abortCommandText;
        break;
      case OperatorTaskCommandId.Revert:
        this.userAction = OperatorTaskUserActionType.Revert;
        modalTitle = this.revertCommandText;
        detailsId = LogMessage.Revert;
        yes = this.revertTitle;
        break;
      case OperatorTaskCommandId.Close:
        this.userAction = OperatorTaskUserActionType.Close;
        modalTitle = this.closeCommandText;
        detailsId = LogMessage.CloseTask;
        yes = this.closeCommandText;
        if (this.selectedTask.status === OperatorTaskStatuses.Running || this.selectedTask.status === OperatorTaskStatuses.RunningWithException) {
          needRevertForManual = this.selectedTask.revertActionMode === RevertActionMode.Manual
            || this.selectedTask.revertActionMode === RevertActionMode.ForcedManual;
          msg = this.closeWarning;
        }
        break;
      case OperatorTaskCommandId.ChangeTime:
        this.userAction = OperatorTaskUserActionType.ChangeTime;
        modalTitle = this.closeCommandText;
        detailsId = LogMessage.ChangeExpiration;
        needRevertForManual = this.selectedTask.revertActionMode === RevertActionMode.Manual;
        msg = this.manualRevertNote;
        break;
      default:
        this.traceService.debug(this.modTrace, `onSelectCommand() not supported: ${commandName}`);
        break;
    }

    this.modalWarningTitle = modalTitle;
    this.modalWarningMessage = msg;
    this._logMessage = detailsId;

    // For this specific case - start date is determined at the the time of starting the task
    // Date range needs validation
    if (this.selectedStartDateOption === DateOption.Duration && this.selectedEndDateOption === DateOption.DateTime) {
      const startDateComputed = new Date();
      const endDate = this.endDateAt.getValue();
      const startInValue = this.startDateIn.getPropertyValue();
      const startInParsed = Utility.parseDuration(startInValue);

      startDateComputed.setDate(startDateComputed.getDate() + startInParsed.days);

      startDateComputed.setHours(startDateComputed.getHours() + startInParsed.hours);

      startDateComputed.setMinutes(startDateComputed.getMinutes() + startInParsed.minutes);

      if (startDateComputed >= endDate) {
        this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Warning, this.deferredDueDateIncorrect, this.modalWarningTitle);
        return;
      }
    }

    if (!this.evaluateForcedManualRevertActionMode(detailsId)) {
      // user has automatic revert rights
      // show revert warning first, then notes
      if ((this.selectedTask.status !== OperatorTaskStatuses.Expired
        && needRevertForManual && this.selectedTask.revertActionMode === 0)
        || needRevertForManual) {
        this.openModalWarning(modalTitle, detailsId, msg, yes, no);
      } else {
        this.validationFirstStep({ modalTitle, detailsId, msg, yes, no });
      }
    } else {
      msg = this.noAutoRevertWarning;
      this.openModalWarning(modalTitle, detailsId, msg, yes, no);
    }
  }

  public onProceedCommand(action: number): void {
    this.ref?.hide();
    if (action === 1) {
      if (this.isForcedManual()) {
        this.taskListVm.sendUpdateTask(this.selectedTask, this.dataService.systemIdSelected).subscribe(response => {
          if (response === 0) {
            this.validationFirstStep();
          }
        });
      } else {
        this.validationFirstStep();
      }
    } else {
      if (this.isForcedManual()) {
        // revert the change
        this.selectedTask.revertActionMode = RevertActionMode.Automatic;
      }
      this.traceService.info(this.modTrace, `${this.selectedCommand} cancelled.`);
    }
  }

  public onAddNote(userResponse: number): void {
    const tasktoAddNote = isNullOrUndefined(this._outgoingTask) ? this.selectedTask : this._outgoingTask;
    if (userResponse === 1) {
      this.traceService.debug(this.modTrace, `onAddNote()`);
      this.note = new OperatorTaskNoteModel(null, this.dataService.user, this.dataService.translations, this._logMessage, new Date().toLocaleString());
      this.note.description = this.noteInput;

      this.taskListVm.sendAddNote(tasktoAddNote.id, this.note.toWsiNote()).subscribe(response => {
        if (response === 0) {
          if (tasktoAddNote.operatorTaskNotes.length >= Utility.MAX_NOTES) {
            tasktoAddNote.operatorTaskNotes.pop();
          }
          tasktoAddNote.operatorTaskNotes.unshift(this.note);
          this.executeCommand(undefined, tasktoAddNote);
        } else {
          this.dataService.showToastNotification(ToastNotificationState.Danger, this.addNoteText, response.message);
          this.traceService.debug(this.modTrace, `Error on addNote for ${this.selectedTask?.taskNameLocalized}: ${response} `);
          this.clearNote();
        }
      });
    } else {
      this.traceService.debug(this.modTrace, `Cancelling note ${this.selectedTask?.taskNameLocalized}`);
      this.clearNote();
    }
  }

  public validationCancelled(action: OperatorTaskUserActionType): void {
    let title = '';
    switch (action) {
      case OperatorTaskUserActionType.Add:
        break;
      case OperatorTaskUserActionType.Delete:
        title = this.deleteTitle;
        break;
      case OperatorTaskUserActionType.Edit:
        title = this.editTitle;
        break;
      case OperatorTaskUserActionType.Duplicate:
        title = this.duplicateTitle;
        break;
      case OperatorTaskUserActionType.Save:
        title = this.saveTitle;
        break;
      case OperatorTaskUserActionType.Start:
        title = this.startCommandText;
        break;
      case OperatorTaskUserActionType.Revert:
        title = this.revertCommandText;
        break;
      case OperatorTaskUserActionType.Close:
        title = this.closeCommandText;
        break;
      case OperatorTaskUserActionType.Abort:
        title = this.abortCommandText;
        break;
      case OperatorTaskUserActionType.ChangeTime:
        title = this.changeTimeText;
        break;
      case OperatorTaskUserActionType.NotSupported:
        title = this.saveTitle;
        break;
      default:
        break;
    }
    this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Danger, this.errorCommandValidation, title);
  }

  public opeAlertModalWithIconTemplate(modalType: OperatorTaskAlertType, msg: string, title: string): void {
    // modal with dynamic icon and only ok button
    this.modalWarningMessage = msg;
    this.modalWarningTitle = title;
    switch (modalType) {
      case OperatorTaskAlertType.Warning:
        this.alertModalIcon = 'element-triangle-filled';
        this.alertModalIconColor = 'status-warning';
        this.alertStackedIcon = 'element-state-exclamation-mark';
        this.alertStackedColor = 'status-warning-contrast';

        break;
      case OperatorTaskAlertType.Danger:
        this.alertModalIcon = 'element-circle-filled';
        this.alertModalIconColor = 'status-danger';
        this.alertStackedIcon = 'element-state-close';
        this.alertStackedColor = 'status-danger-contrast';
        break;
      case OperatorTaskAlertType.Info:
      default:
        this.alertModalIcon = 'element-square-filled';
        this.alertModalIconColor = 'status-info';
        this.alertStackedIcon = 'element-state-info';
        this.alertStackedColor = 'status-info-contrast';
        break;
    }

    this.ref?.hide();
    this.ref = this.siModalSvc.show(this.alertModalWithIconTemplate, {
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      // class: this.centeredModalClass,
      ariaLabelledBy: 'sample-modal-title'
    });
  }

  public onToggleDefault(row: OperatorTaskTargetViewModel): void {
    if (row.isDefaultValue) {
      // check if the value is valid/not empty
      if (row.isEmptyParameterValue()) {
        asapScheduler.schedule(() => {
          row.isDefaultValue = false;
        }, 10);

        this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Warning, this.targetWarningDefaultEmptyParameter, this.failedToAssign);
        return;
      }

      const hasAlignedToDefaultFalse = row.hasAlignedToDefaultValue(row, this.rows);
      const alreadyHasDefault = row.hasDefaultValueSet(row.model.objectModel);
      // check if there is already a default value set, and !isAligningDefaultValue
      if (hasAlignedToDefaultFalse && alreadyHasDefault) {
        // show popup
        this.siModal
          .showConfirmationDialog(
            this.targetChangeDefaultValuesForAll,
            this.targetColumnTitle)
          .subscribe(confirmation => {
            switch (confirmation) {
              case ConfirmationDialogResult.Confirm:
                this.setValuesForDefault(row, false, alreadyHasDefault)
                break;
              case ConfirmationDialogResult.Decline:
                // only change the values of target with isAligningDefaultValue is true
                // remove the default check for the rest
                this.setValuesForDefault(row, true, alreadyHasDefault)
                break;
              default:
                break;
            }
          })
      } else {
        this.setValuesForDefault(row, false, alreadyHasDefault)
      }
    }
  }

  // Show the note modal if validationComment is not defined before executing the command.
  // Else send addNote api and execute the command
  public createNote(modalTitle: string, detailsId: LogMessage, validationComment: string, outgoingTask?: OperatorTaskModel): void {
    this.traceService.debug(this.modTrace, `createNote() ${detailsId} | ${outgoingTask?.taskNameLocalized}`);
    this._logMessage = detailsId;
    this._outgoingTask = outgoingTask;

    if (validationComment !== undefined && validationComment !== '') {
      this.noteInput = validationComment;
      this.onAddNote(1);
    } else {
      this.noteModalTitle = modalTitle;
      this.showNotesModal();
    }
  }

  public executeCommand(note?: string, task?: OperatorTaskModel): void {
    this.clearNote();
    const title = this.getTitleFromCommand(this.selectedCommand);
    const taskToCommand = isNullOrUndefined(task) ? this.selectedTask : task;

    this.traceService.debug(this.modTrace,
      `executeCommand(): ${title}  for '${this.selectedTask.taskNameLocalized}'`);

    if (this.selectedCommand === OperatorTaskCommandId.ChangeTime) {
      this.saveEndDate();
      this.taskListVm.sendTaskCommand(this.selectedCommand, note, Utility.encodeDateTimeFromString(taskToCommand.expirationTime)
        , taskToCommand).subscribe(response => {
        if (response === 0) {
          this.dataService.showToastNotification(ToastNotificationState.Success, title, this.commandSuccessful);
          this.traceService.debug(this.modTrace, `executeCommand(): ${this.selectedTask?.taskNameLocalized}: ${response} `);
        } else {
        // WSI error
          this.dataService.showToastNotification(ToastNotificationState.Danger, title, `${this.commandFailed} ${response.message}`);
          this.traceService.warn(this.modTrace, `Error executeCommand(): ${taskToCommand?.taskNameLocalized}: ${response} `);
        }
      });
    } else if (this.selectedCommand === OperatorTaskCommandId.Close) {
      if (!this.dataService.rightsService.CanStopRunningTasks && this.closeCommandEnabled === true) {
        this.traceService.error(this.modTrace, `executeCommand(): close command is enabled while user does not have rights. `)
        this.dataService.showToastNotification(ToastNotificationState.Danger, title, `${this.commandFailed} user does not have right to close the task.`);
        return;
      }

      this.taskListVm.sendCloseTaskCommand(note, this.selectedTask).subscribe(response => {
        if (response === 0) {
          this.dataService.showToastNotification(ToastNotificationState.Success, title, this.commandSuccessful);
          this.traceService.debug(this.modTrace, `executeCommand(): ${taskToCommand?.taskNameLocalized}: ${response} `);
        } else {
          // WSI error
          this.dataService.showToastNotification(ToastNotificationState.Danger, title, `${this.commandFailed} ${response.message}`);
          this.traceService.warn(this.modTrace, `Error executeCommand(): ${taskToCommand?.taskNameLocalized}: ${response} `);
        }
      });
    } else {
      this.taskListVm.sendTaskCommand(this.selectedCommand, note).subscribe(response => {
        if (response === 0) {
          this.dataService.showToastNotification(ToastNotificationState.Success, title, this.commandSuccessful);
          this.traceService.debug(this.modTrace, `executeCommand(): ${taskToCommand?.taskNameLocalized}: ${response} `);
        } else {
          // WSI error
          this.dataService.showToastNotification(ToastNotificationState.Danger, title, `${this.commandFailed} ${response.message}`);
          this.traceService.warn(this.modTrace, `Error executeCommand(): ${taskToCommand?.taskNameLocalized}: ${response} `);
        }
      });
    }
  }

  public showSaveTaskWarning(): ModalRef<any> {
    this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Info, this.unSavedDataTaskSave, this.saveTitle);
    return this.ref;
  }

  public onClickedOriginalValue(row: any): void {
    if (!isNullOrUndefined(row)) {
      asapScheduler.schedule(() => {
        row.parameterRevertModel.useOriginalValue = false;
      }, 10);
    }
  }

  public onRemoveValueForRevert(row: any): void {
    if (!isNullOrUndefined(row)) {
      row.parameterRevertModel.useOriginalValue = true;
    }
  }

  public showOriginalValueCalc(row: any): boolean {
    if (!isNullOrUndefined(row)) {
      return row?.parameterRevertModel.useOriginalValue
        === false || this.canConfigureTaskData === false
    }
    return false;
  }

  public classStyleForParameterFont(row: any, isRevert: boolean): string {
    if (!isNullOrUndefined(row)) {
      let style = 'form-control ';

      if (isRevert && row.parameterRevertModel?.useOriginalValue === true) {
        style += 'original-text-color ';
      }

      if (row.alignedToDefaultValue === false) {
        style += 'original-text-weight ';
      }

      if (row.parameterRevertModel?.control === ParameterControl.ComboBox
        || row.parameterControl?.control === ParameterControl.ComboBox) {
        style += 'ellipsis ';
      }

      return style;
    }
    return '';
  }

  public classStyleForControls(row: OperatorTaskTargetViewModel, isRevert: boolean): string {
    if (!isNullOrUndefined(row)) {
      // let style = 'mx-2 row text-ellipsis ';
      let style = 'mx-2 row ';
      const control = isRevert ? row.parameterRevertModel.control : row.paramaterActionModel.control;
      if (!this.addEnabled()) {
        switch (control) {
          case ParameterControl.DatePicker:
          case ParameterControl.Spinner:
          case ParameterControl.TextBox:
            style += 'target-parameter-readonly ';
            break;

          case ParameterControl.ComboBox:
            if (isRevert && row.parameterRevertModel?.useOriginalValue) {
              style += 'target-parameter-readonly ';
            } else {
              style += 'comboReadOnly ';
            }
            break;

          default:
            break;
        }
      } else {
        style += 'editable '
      }

      return style;
    }
    return '';
  }

  private validationFirstStep(modalText?: any): void {
    // Cannot command popups
    if (!this.evaluateExpirationTime(this._logMessage)) {
      this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Warning, this.dueDateExpiredWarning, this.modalWarningTitle);
      this.traceService.warn(this.modTrace,
        `validationFirstStep() Cannot ${this.modalWarningTitle}
        ${this.selectedTask.taskNameLocalized} because of expired time.`);
      return;
    }

    const dps = this.getTargetsForValidation(this._logMessage);
    if (typeof dps === 'number') {
      switch (dps as OperatorTaskErrorTypes) {
        case OperatorTaskErrorTypes.None:
          break;
        case OperatorTaskErrorTypes.TargetDeleted:
          this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Danger, this.errorTargetNotPresent, this.modalWarningTitle);
          this.traceService.warn(this.modTrace,
            `validationFirstStep() Cannot ${this.modalWarningTitle}
            ${this.selectedTask.taskNameLocalized} because a target does not exist.`);
          break;
        case OperatorTaskErrorTypes.TargetNotReachable:
          this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Danger, this.errorCommandValidation, this.modalWarningTitle);
          this.traceService.warn(this.modTrace,
            `validationFirstStep() Cannot ${this.modalWarningTitle}
            ${this.selectedTask.taskNameLocalized} because a target is not reachable.`);
          break;
        case OperatorTaskErrorTypes.TimeExpired:
        case OperatorTaskErrorTypes.OperatorTaskFolderMissing:
        default:
          break;

      }
      return;
    }

    this.taskListVm.showValidationDialog(dps, this.userAction).subscribe(
      response => {
        const result = response?.result;
        const status = result?._status;
        const comment: string = result?._comments?.CommonText;
        switch (status as ValidationResultStatus) {
          case ValidationResultStatus.Success:
            const hasPassword = !isNullOrUndefined(result) &&
              (!isNullOrUndefined(result.Password) || !isNullOrUndefined(result.SuperPassword));
            if (hasPassword
              && this.selectedTask.revertActionMode === RevertActionMode.Automatic
              && this.userAction === OperatorTaskUserActionType.Start) {
              this.forcedManualForValidatedTargets(result, modalText)
            } else if (this.selectedTask.notesRequired === 1) {
              this.createNote(this.modalWarningTitle, this._logMessage, comment);
            } else {
              this.executeCommand();
            }
            break;
          case ValidationResultStatus.Cancelled:
            this.validationCancelled(this.userAction);
            break;
          case ValidationResultStatus.Error:
            break;
          default:
            break;

        }
      },
      error => {
        // Note validation service does not return errors
        this.traceService.warn(this.modTrace, `validationFirstStep() error: ${error}`);
      },
      () => {
        this.traceService.debug(this.modTrace, `validationFirstStep() completed.`);
      }
    );
  }

  private forcedManualForValidatedTargets(validationResult: any, modal?: any): void {
    if (modal === undefined || validationResult === undefined) {
      this.traceService.warn(this.modTrace,
        `Cannot execute start for validated objects due to missing values`);
      return;
    }

    this.siActionDialogService.showActionDialog(
      {
        type: "confirmation",
        message: this.textForcedManualValidation,
        heading: modal.modalTitle,
        confirmBtnName: modal.yes,
        declineBtnName: modal.no
      }
    ).subscribe(confirmation => {
      switch (confirmation) {
        case "confirm":
          this.selectedTask.revertActionMode = RevertActionMode.ForcedManual;
          this.taskListVm.sendUpdateTask(this.selectedTask, this.dataService.systemIdSelected).subscribe(response => {
            if (response !== 0) {
              this.selectedTask.revertActionMode = RevertActionMode.Automatic;
              this.traceService.warn(this.modTrace,
                `validationFirstStep(): Update '${this.selectedTask.taskNameLocalized}' failed with validated objects. Command cannot be executed.`);
              return;
            }

            this.traceService.debug(this.modTrace,
              `validationFirstStep(): Update '${this.selectedTask.taskNameLocalized}'
              with validated objects successful.`);
            // note that this requires backend changes since after updating task,
            // we get taskChangeNotification where the value is incorrect
            if (this.selectedTask.notesRequired === 1) {
              this.createNote(this.modalWarningTitle, this._logMessage, validationResult?.Comments?.CommonText);
            } else {
              this.executeCommand();
            }
          });
          break;
        case "decline":
          this.traceService.debug(this.modTrace,
            `validationFirstStep(): User declined starting '${this.selectedTask.taskNameLocalized}' with validated objects.`);
          break;
        default:
          break;
      }
    });
  }

  private setTargetErrors(): void {
    if (this.viewType === TaskViewMode.Add || this.viewType === TaskViewMode.Edit) {
      if (this.rows?.length <= 0) {
        this.targetRowControl.setErrors({ targetMin: true }, { emitEvent: true });
      } else if (this.rows?.find(vm => vm.hasParameterValidationError === true)) {
        this.targetRowControl.setErrors({ targetMissingValues: true }, { emitEvent: true });
      } else {
        this.targetRowControl.setErrors(null);
      }
    }
  }

  private onContainerResize(): void {
    const elem: any = this.infoContainer.nativeElement;
    this.containerWidth = elem.offsetWidth;

    if (this.containerWidth < 360) {
      this.containerClass = 'minified';
    } else {
      this.containerClass = '';
    }
  }

  private inittargetMenutItems(): void {
    this.addTargetMenu = {
      title: 'DETAIL-TARGET-ADD',
      icon: 'element-plus',
      disabled: !this.addEnabled(),
      action: (): void => {
        this.onAddTarget();
      }
    };

    this.targetContentActions = [this.addTargetMenu];
  }

  private updateButtonState(): void {
    asapScheduler.schedule(() => {
      this.addTargetMenu.disabled = !this.addEnabled();
      this.handleRevertMode();
      this.canConfigureTaskData = this.taskListVm.canConfigureTaskData;
      this.changeDetectorRef.detectChanges();
    }, 10);

  }

  private translateStrings(): void {
    const translations: OperatorTaskTranslations = this.dataService.translations;
    if (translations === undefined) {
      return;
    }

    this.omSourceTitle = translations.omSourceTitle;
    this.nameTitle = translations.nameTitle;
    this.descriptionTitle = translations.descriptionTitle;
    this.startDateTitle = translations.startDateTitle;
    this.endDateTitle = translations.endDateTitle;
    this.manualModeLabel = translations.manualModeLabel;
    this.automaticModeLabel = translations.automaticModeLabel;
    this.revertTitle = translations.revertTitle;
    this.headingNotes = translations.headingNotes;
    this.headingTarget = translations.headingTarget;
    this.infoColumnTitle = translations.infoColumnTitle;
    this.targetColumnTitle = translations.targetColumnTitle;
    this.commandParameterColumnTitle = translations.commandParameterColumnTitle;
    this.revertParameterColumnTitle = translations.revertParameterColumnTitle;
    this.defaultColumnTitle = translations.defaultColumnTitle;
    this.resultsColumnTitle = translations.resultsColumnTitle;
    this.startCommandText = translations.startCommandText;
    this.revertCommandText = translations.revertCommandText;
    this.closeCommandText = translations.closeCommandText;
    this.abortCommandText = translations.abortCommandText;
    this.changeTimeText = translations.changeTimeText;
    this.addTargetTitle = translations.addTargetTitle;
    this.deleteTargetTitle = translations.deleteTargetTitle;
    this.deleteTitle = translations.deleteTargetTitle;
    this.saveTitle = translations.saveTitle;
    this.editTitle = translations.editTitle;
    this.emptyHeading = translations.emptyHeading;
    this.statusHeading = translations.statusHeading;
    this.startImmediateTitle = translations.startImmediateTitle;
    this.startAtTitle = translations.startAtTitle;
    this.startInTitle = translations.startInTitle;
    this.dateTimeInvalid = translations.dateTimeInvalid;
    this.dateFormatInvalid = translations.dateFormatInvalid;
    this.required = translations.required;
    this.alreadyExists = translations.alreadyExists;
    this.characterMin = translations.characterMin;
    this.characterMinSpaceOkay = translations.characterMinSpaceOkay;
    this.durationInvalid = translations.durationInvalid;
    this.startRangeInvalid = translations.startRangeInvalid;
    this.endRangeInvalid = translations.endRangeInvalid;
    this.cancelTitle = translations.cancelTitle;
    this.addNoteTitle = translations.addNoteTitle;
    this.manualRevertNote = translations.manualRevertNote;
    this.notesActionStart = translations.notesActionStart;
    this.notesActionClose = translations.notesActionClose;
    this.notesActionRevert = translations.notesActionRevert;
    this.notesActionAbort = translations.notesActionAbort;

    this.noTaskHeading = translations.noTaskHeading;
    this.selectTaskToShowDetails = translations.selectTaskToShowDetails;
    this.selectedTaskDeleted = translations.selectedTaskDeleted;
    this.textForcedManual = translations.textForcedManual;
    this.textForcedManualValidation = translations.textForcedManualValidated;
    this.textNoRevertCommand = translations.textNoRevert;
    this.textEnterYourNote = translations.textEnterYourNote;
    this.abortWarning = translations.abortWarning;
    this.closeWarning = translations.closeWarning;
    this.dueDateExpiredWarning = translations.dueDateExpiredWarning;
    this.deferredDueDateIncorrect = translations.deferredDueDateIncorrect;
    this.noAutoRevertWarning = translations.noAutoRevertWarning;
    this.errorTargetNotPresent = translations.errorTargetNotPresent;
    this.errorCommandValidation = translations.errorCommandValidation;
    this.duplicateTitle = translations.duplicateTitle;
    this.commandFailed = translations.commandFailed;
    this.commandSuccessful = translations.commandSuccessful;
    this.addNoteText = translations.addNoteText;
    this.originalValue = translations.originalTitle;
    this.targetInvalid = translations.targetInvalid;
    this.targetMissingValues = translations.targetMissingValues;
    this.targetChangeDefaultValuesForAll = translations.targetChangeDefaultValuesForAll;
    this.targetWarningDefaultEmptyParameter = translations.targetWarningDefaultEmptyParameter;
    this.unSavedDataTaskSave = translations.unSavedDataTaskSave;
    this.noneStringPlaceholder = translations.targetNoneText;
    this.taskIdCopyTooltip = translations.taskIdCopyTooltip;

    this.failedToAssign = translations.failedToAssign;
    this.close = translations.close;
    this.startTask = translations.startTask;
    this.taskDeleted = translations.taskDeleted;
  }

  private init(): void {
    this.tableViewType = 'expanded';
    this.onSelectedTaskChanged();
    this.inittargetMenutItems();
  }

  private buildForm(): void {
    this.form = new FormGroup({
    });

    this.nameControl = new FormControl('');
    this.form.addControl(this.nameControlName, this.nameControl);

    this.descriptionControl = new FormControl('');
    this.form.addControl(this.descriptionControlName, this.descriptionControl);

    this.endDateIn = new TaskDurationTimeControl(this.endDateInControlName);
    this.form.addControl(this.endDateInControlName, this.endDateIn.control);

    this.startDateIn = new TaskDurationTimeControl(this.startDateInControlName);
    this.form.addControl(this.startDateInControlName, this.startDateIn.control);

    this.startDateAt = new TaskDateTimeControl(this.startDateAtControlName);
    this.form.addControl(this.startDateAtControlName, this.startDateAt.control);

    this.endDateAt = new TaskDateTimeControl((this.endDateAtControlName));
    this.form.addControl(this.endDateAtControlName, this.endDateAt.control);

    this.targetRowControl = new FormControl(0);
    this.form.addControl(this.targetRowControlName, this.targetRowControl);
  }

  private disableControls(): void {
    this.traceService.debug(this.modTrace, `disableControls()`);

    this.form.disable({ emitEvent: true });
    this.startDateAt?.disableControlAndUnsubscribe('disableControls');
    this.endDateAt.disableControlAndUnsubscribe('disableControls');
    this.form.get('name').clearValidators();
    this.form.updateValueAndValidity()
  }

  private enableControlsAndValidators(): void {
    if (this.selectedTask) {
      this.form.enable({ emitEvent: false });

      this.nameControlValidators = [
        Validators.minLength(1),
        nameValidator(this.taskListVm.taskNames())
      ];
      this.nameControl.addValidators(this.nameControlValidators);

      this.descriptionControlValidators = [
        Validators.minLength(1)
      ];
      this.descriptionControl.addValidators(this.descriptionControlValidators);

      this.initStartDueDateControls(this.selectedStartDateOption, true);
      this.initStartDueDateControls(this.selectedEndDateOption, false);

      if (!this.taskListVm.canConfigureTaskName) {
        this.nameControl.disable();
      }

      if (!this.taskListVm.canConfigureTaskData) {
        this.descriptionControl.disable();
        this.startDateAt.control.disable();
        this.startDueRadioReadOnly = true;
      } else {
        this.startDueRadioReadOnly = false;
      }
    }
    this.form.updateValueAndValidity();
  }

  private initStartDueDateControls(dateOption: DateOption, isStart: boolean): void {
    switch (dateOption) {
      case DateOption.Immediate:
        this.startDateIn.clearUpdateValidators();
        this.startDateAt.clearValidatorsAndUnsubscribe('selectedStartDateOption');
        break;
      case DateOption.DateTime:
        if (isStart) {
          this.startDateIn.clearUpdateValidators();
          this.startDateAt.editableControl(this.selectedTask, true);

          this.startDateAt.minDateValidation();
          if (this.selectedEndDateOption === DateOption.DateTime) {
            this.startDateAt.subscribeDateRangeValidation(this.selectedEndDateOption, this.endDateAt.control, true);
          }
        } else {
          this.endDateIn.clearUpdateValidators();

          this.endDateIn.clearUpdateValidators();
          this.endDateAt.editableControl(this.selectedTask, false);
          this.endDateAt.minDateValidation();
          if (this.selectedStartDateOption === DateOption.DateTime) {
            this.endDateAt.subscribeDateRangeValidation(this.selectedStartDateOption, this.startDateAt.control, false);
          }
        }
        break;
      case DateOption.Duration:
        if (isStart) {
          this.startDateAt.clearValidatorsAndUnsubscribe('selectedStartDateOption');
          this.startDateIn.editableControl(this.selectedTask.deferDuration);
        } else {
          this.endDateAt.clearValidatorsAndUnsubscribe('selectedEndDateOption');
          this.endDateIn.editableControl(this.selectedTask.duration);
        }
        break;
      default:
        this.traceService.debug(this.modTrace, `initStartDueDateControls() not supported: ${this._selectedStartDateOption}`);
        break;
    }

    if (this.selectedStartDateOption === DateOption.DateTime) {
      this.startDateAt.minDateValidation();
      if (this.selectedEndDateOption === DateOption.DateTime) {
        this.startDateAt.subscribeDateRangeValidation(this.selectedEndDateOption, this.endDateAt.control, true);
      }
    }

    if (this.selectedEndDateOption === DateOption.DateTime) {
      this.endDateAt.minDateValidation();
      if (this.selectedStartDateOption === DateOption.DateTime) {
        this.endDateAt.subscribeDateRangeValidation(this.selectedStartDateOption, this.startDateAt.control, false);
      }
    }
  }

  private onSelectedTaskChanged(): void {
    this.selectedTaskChangedSubscription = this.taskListVm?.selectedTaskChanged.subscribe(data => {
      this.clearTargetSubscriptions('Selection changed');
      if (isNullOrUndefined(data)) {

        // only if a selected task is removed by a parallel client
        if (!this.selectedTask.ClientRemoved) {
          this.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Warning, this.selectedTaskDeleted, this.taskDeleted);
        }

        this.selectedTask = undefined;
        this.viewType = TaskViewMode.NoSelection;
        return;
      }

      if (isNullOrUndefined(data.selectedTask)) {
        this.viewType = TaskViewMode.NoSelection;
        this.selectedTask = undefined;
        return;
      }

      if (this.selectedTask?.id === data.selectedTask.id) {
        this.notifyParent.emit();
        if (data.selectedTask.taskIsChanged) {
          // reassign selectedTask
          this.selectedTask = data.selectedTask;
        }
      }

      if (isNullOrUndefined(this.selectedTask) || (this.selectedTask.id !== data.selectedTask.id)) {
        this.selectedTask = data.selectedTask;
        this.selectedTarget = undefined;
        this.rows = [];
      }

      if (this.selectedTask.taskIsChanged) {
        // reset the properties here
        this.selectedTask.targetsInitialized = false;
        this.selectedTask.targetViewModels = [];
        this.selectedTask.targetDpIds = [];

        // this.selectedTask.updateTargets(this.taskListVm.canConfigureTaskData);
      }
      if (!this.selectedTask.isNew && !this.selectedTask.targetsInitialized) {
        this.rows = [];
        this.selectedTask.initializeTargets(this.taskListVm.canConfigureTaskData);
      }

      // update the view mode so that the parameters values be calculated ie useoriginalvalue
      this.selectedTask.targetDpIds?.forEach(m => {
        m.viewMode = data.viewType;
      })

      this.viewType = data.viewType;
      // determine if viewmodels require init
      if (this.selectedTask.isNew && this.selectedTask.isNew && !isNullOrUndefined(this.gmsMessageData)) {
        this.rows = [];
        const selection: BrowserObject[] = this.gmsMessageData.customData || [];
        const models: TargetModel[] = [];
        selection.forEach(bo => {
          const target = new TargetModel(this.traceService, this.selectedTask, true, bo, undefined, this.taskListVm.canConfigureTaskData);
          models.push(target);
        });
        this.selectedTask.targetDpIds = models;
        this.initializeTargetViewModels(this.selectedTask.targetDpIds);
      } else if (!this.selectedTask.isNew && this.selectedTask.targetViewModels.length === 0) {
        this.rows = [];
        this.initializeTargetViewModels(this.selectedTask.targetDpIds);
      } else {
        this.rows = [];
        this.updateRows(this.selectedTask.targetViewModels);
      }

      switch (data.viewType) {
        case TaskViewMode.Add:
        case TaskViewMode.Edit:
          this.form.patchValue({
            name: this.selectedTask.taskNameLocalized,
            description: this.selectedTask.taskDescriptionLocalized
          });

          if (!this.taskListVm.canConfigureTaskData) {
            this.selectedStartDateOption = DateOption.DateTime;
            this.selectedEndDateOption = DateOption.DateTime;
          } else {
            this.selectedStartDateOption = this.selectedTask.startDateType;
            this.selectedEndDateOption = this.selectedTask.endDateType;
          }

          this.selectedRevertMode = this.selectedTask.revertActionMode;
          this.enableControlsAndValidators();
          this.inittargetMenutItems();
          asapScheduler.schedule(() => this.setTargetErrors(), 10);

          break;
        case TaskViewMode.View:
          this.startCommandEnabled = this.taskListVm.canStartTask;
          this.revertCommandEnabled = this.taskListVm.canRevertTask;
          this.closeCommandEnabled = this.taskListVm.canCloseTask;
          this.abortCommandEnabled = this.taskListVm.canAbortTask;
          this.inittargetMenutItems();
          this.selectedRevertMode = this.selectedTask.revertActionMode;
          this.disableControls();
          break;
        case TaskViewMode.NoSelection:
          this.form?.reset();
          break;
        default:
          this.traceService.debug(this.modTrace, 'selectedTaskChanged() default case');
          break;
      }

      this.updateButtonState();
    });
  }

  private onTaskChanged(): void {
    // update the command button state
    this.startCommandEnabled = this.taskListVm.canStartTask;
    this.revertCommandEnabled = this.taskListVm.canRevertTask;
    this.closeCommandEnabled = this.taskListVm.canCloseTask;
    this.abortCommandEnabled = this.taskListVm.canAbortTask;
  }

  private handleSaveButton(): void {
    if (!this.taskListVm.canConfigureTaskData) {
      this.traceService.error(TraceModules.contentTrace,
        `handleSaveButton() The task cannot be saved; canConfigureTaskData=false | ${this.selectedTask.traceData()}.`)
      return;
    }

    this.saveStartDate();
    this.saveEndDate();
    this.selectedTask.taskNameLocalized = this.form.controls.name.value;
    this.selectedTask.taskDescriptionLocalized = this.form.controls.description.value;
    this.rows.forEach(vm => {
      vm.updateFromViewModel();
    });
    this.selectedTask.resetChangeAndErrorFlags();

    this.selectedTask.revertActionMode = this._selectedRevertMode;
    this.selectedTask.targetViewModels = this.rows;
    this.selectedTask.targetDpIds = this.rows.map(mod => mod.model);
    this.disableControls();

    this.startDateAt.clearValidatorsAndUnsubscribe('handleSaveButton');
    this.endDateAt.clearValidatorsAndUnsubscribe('handleSaveButton');
  }

  private saveEndDate(): void {
    this.selectedTask.endDateType = this._selectedEndDateOption;
    switch (this.selectedTask.endDateType) {
      case DateOption.Immediate:
        // does not apply
        break;
      case DateOption.DateTime:
        this.selectedTask.isExpirationConfig = true;
        this.selectedTask.expirationTime = this.endDateAt.control.value;
        this.selectedTask.duration = 0;
        break;
      case DateOption.Duration:
        this.selectedTask.isExpirationConfig = false;
        this.selectedTask.duration = this.endDateIn.getPropertyValue();
        break;
      default:
        this.traceService.warn(this.modTrace, `saveEndDate(): not supported: ${this.selectedTask.endDateType}`);
        break;
    }

  }

  private saveStartDate(): void {
    this.selectedTask.startDateType = this._selectedStartDateOption;
    switch (this.selectedTask.startDateType) {
      case DateOption.Immediate:
        this.selectedTask.deferred = false;
        this.selectedTask.deferDuration = 0;
        break;
      case DateOption.DateTime:
        this.selectedTask.deferred = true;
        this.selectedTask.deferTime = this.startDateAt.control.value;
        this.selectedTask.deferDuration = 0;
        break;
      case DateOption.Duration:
        this.selectedTask.deferred = true;
        this.selectedTask.deferDuration = this.startDateIn.getPropertyValue();
        break;
      default:
        this.traceService.warn(this.modTrace, `saveStartDate(): not supported: ${this.selectedTask.startDateType}`);
        break;
    }
  }

  private initializeTargetViewModels(models: TargetModel[]): void {
    this.isLoadingTargets = true;
    const unresolved: Map<number, string[]> = this.createSystemBrowserRequest(models);
    this.traceService.debug(this.modTrace, `initializeTargetViewModels()
    name= ${this.selectedTask.taskNameLocalized}
    |canConfigureTaskData= ${this.taskListVm.canConfigureTaskData}
    |taskIsChanged= ${this.selectedTask.taskIsChanged}
    |viewType= ${TaskViewMode[this.viewType]}
    |count models= ${models.length}`);

    this.resolveSystemBrowserNodes(unresolved).subscribe(
      nodes => {
        this.traceService.debug(this.modTrace, `resolveSystemBrowserNodes() returned: ${nodes.length}`);
        if (nodes) {
          models.forEach(model => {
            // map the nodes to target
            if (!model.datapointDoesNotExist) {
              const mappedObjectId = nodes.find(bo => bo.ObjectId === model.objectId && bo.ErrorCode === 0);
              if (mappedObjectId && mappedObjectId.Nodes.length > 0) {
                const mappedNode = mappedObjectId.Nodes.find(bo => bo.Designation === model.designation);
                if (mappedNode) {
                  model.bo = mappedNode;
                }
              }
            }
          })
        }
      },
      error => {
        this.traceService.warn(this.modTrace, 'resolveSystemBrowserNodes() error:', error);
        this.setTargetErrors();
      },
      () => {
        this.traceService.debug(this.modTrace, 'resolveSystemBrowserNode() completed');
        this.initializeTargetParameters(models);
      }
    )
  }

  private initializeTargetParameters(models: TargetModel[]): void {
    this.isLoadingTargets = true;
    const resolvedVms: OperatorTaskTargetViewModel[] = [];
    const ids: string[] = this.createListForOverridableParams(models);
    const idsToReadValues = [];
    if (ids.length === 0) {
      this.traceService.debug(this.modTrace, `initializeTargetParameters() completed: not calling getOverridableParameters`);
      this.createResolvedVms(models, resolvedVms);
      return;
    }

    this.traceService.debug(this.modTrace, `getOverridableParameters() for ${this.selectedTask.taskNameLocalized}
    | ids= ${ids.length} |taskChanged= ${this.selectedTask.taskIsChanged}
    | status=${OperatorTaskStatuses[this.selectedTask.status]}`);

    this.dataService.getOverridableParameters(this.selectedTask, ids)
      .subscribe(
        params => {
          if (params) {
            this.traceService.debug(this.modTrace, `getOverridables returned: ${params.length}`);
            for (const m of models) {
              if (m.isValidTarget() === false) {
                continue;
              }

              const opd = params.find(p => p.ObjectId === m.objectId);
              if (!isNullOrUndefined(opd)) {
                if (!opd.TemplateTaskActionMissConfigured) {
                  m.templateTaskActionMissConfigured = true;
                  continue;
                }

                m.isInvalidTarget = this.validateOverridable(opd.OverridableParameterAction) === true
                  && this.validateOverridable(opd.OverridableParameterAction) === true;

                if (m.isInvalidTarget === true) {
                  continue;
                }

                m.overridable = opd;
                if (this.taskListVm.canConfigureTaskData === true && m.needToReadPropertyValue === true) {
                  idsToReadValues.push(m.objectId);
                }
              } else {
                const opdKeys = params.map(p => p.ObjectId);
                this.traceService.warn(this.modTrace, `getOverridableParameters() unable to map ${m.objectId} model:keys=${opdKeys}`);
              }
            }
          } else {
            this.traceService.warn(this.modTrace, 'getOverridableParameters() params undefined');
          }
        },
        error => {
          this.traceService.error(this.modTrace, `getOverridableParameters() error: ${error}`);
        },
        () => {
          if (idsToReadValues.length > 0) {
            this.traceService.debug(this.modTrace, `getOverridableParameters completed:
            calling readPropertyValues= ${idsToReadValues.length !== 0}`);

            this.dataService.readPropertyValues(idsToReadValues, false).subscribe({
              next: values => {
                this.traceService.debug(this.modTrace, `readPropertyValues returned: ${values.length}`);
                if (values) {
                  // map the currentpropertyvalue to models readPropertyValue;
                  models.forEach(mod => {
                    const missingValue = mod.isValidTarget() && (mod.needToReadPropertyValue);
                    if (missingValue) {
                      const mappedProp = values.find(rp => rp.ObjectId === mod.objectId);
                      if (mappedProp) {
                        mod.readPropertyValue = mappedProp.Value.Value;
                        this.traceService.info(this.modTrace, '')
                      }
                    }
                  })
                }
              },
              error: e => {
                this.traceService.error(this.modTrace, `readPropertyValues() error: ${e}`);
              },
              complete: () => {
                this.traceService.debug(this.modTrace, `readPropertyValues completed`);
                this.createResolvedVms(models, resolvedVms);
              }
            })
          } else {
            this.createResolvedVms(models, resolvedVms);
          }
        }
      );
  }

  private createResolvedVms(models: TargetModel[], resolvedVms: OperatorTaskTargetViewModel[]): void {
    const invalidTargets = models
      .filter(m => m.isInvalidTarget === true)
      .map(m => m.bo.Name);

    const misconfigured = models
      .filter(m => m.templateTaskActionMissConfigured === true)
      .map(m => m.bo.Name);

    if (invalidTargets.length > 0) {
      const targetTypeNotSupported = this.translateService.instant('MSG-BOX-TEXT-TARGET-TYPE-NOT-SUPPORTED-ERROR', { 'targetName': invalidTargets });
      this.subscriptions.push(this.siModal
        .showAlertDialog(
          targetTypeNotSupported,
          this.addTargetTitle,
          undefined,
          undefined,
          'element-info'
        )
        .subscribe(() => this.traceService.warn(this.modTrace, `createResolvedVms():Target is not supported: ${invalidTargets}`)));
    }

    if (misconfigured.length > 0) {
      const targetHasMultipleCommandsError = this.translateService.instant('MSG-BOX-TEXT-MULTIPLE-COMMANDS-ERROR', { 'targetName': misconfigured });
      this.subscriptions.push(this.siModal
        .showAlertDialog(
          targetHasMultipleCommandsError,
          this.addTargetTitle,
          undefined,
          undefined,
          'element-info'
        )
        .subscribe(() => this.traceService.warn(this.modTrace, `createResolvedVms():Target is not supported: ${misconfigured}`)));
    }

    // delete the invalid/misconfigured targets
    models = models.filter(t => t.isInvalidTarget === false && t.templateTaskActionMissConfigured === false);
    this.selectedTask.targetDpIds = models;

    models.forEach(m => {
      const model = m.designation;
      try {
        resolvedVms.push(new OperatorTaskTargetViewModel(m));
      } catch (err) {
        this.traceService.warn(this.modTrace, `createResolvedVms(): ${model} error = ${err} `)
      }

    })
    this.updateRows(resolvedVms);
  }

  private resolveSystemBrowserNodes(unresolved: Map<number, string[]>): Observable<any> {
    const observables: Observable<any>[] = [];
    unresolved.forEach((list, id) => {
      observables.push(this.dataService.searchNodeMultiple(id, list));
    })

    return forkJoin(observables).pipe(
      map(results => results.reduce((acc, val) => acc.concat(val), []))
    );
  }

  private createSystemBrowserRequest(targets: TargetModel[]): Map<number, string[]> {
    const result = new Map<number, string[]>();
    targets.forEach(t => {
      if (t.isValidTarget() && isNullOrUndefined(t.bo)) {
        const system = t.targetNode?.SystemNumber;
        if (result.has(system)) {
          result.get(system)!.push(t.objectId);
        } else {
          result.set(system, [t.objectId]);
        }
      }
    });
    return result;
  }

  private updateRows(vms: OperatorTaskTargetViewModel[]): void {
    if (!this.selectedTask.isNew && !this.selectedTask.taskIsChanged && this.taskListVm.canConfigureTaskData) {
      this.selectedTask.targetViewModels = [...new Set([...this.selectedTask.targetViewModels, ...vms])];
    } else if (!this.selectedTask.isNew) {
      this.rows = [];
      this.selectedTask.targetViewModels = vms;
      this.selectedTask.targetViewModels.forEach(vm => {
        vm.setDisplay();
      })
    }

    if (this.selectedTask.taskIsChanged) {
      this.selectedTask.taskIsChanged = false;
    }

    // new task, handle in save
    this.rows = [...new Set([...this.rows, ...vms])];

    this.showRevertColumn = this.rows.some(item => !isNullOrUndefined(item.parameterRevertModel) === true);
    this.isLoadingTargets = false;

    if (this.isEditing()) {
      this.subscribeToTargetChanges();
    }

    // this.setTargetErrors();
    this.resizeTable();
    this.traceTargets();
  }

  private traceTargets(): void {
    const trace = [];
    let index = 1;
    this.selectedTask?.targetViewModels?.forEach(vm => {
      const model = vm.model.traceData();
      const parameterRevertModel = vm.parameterRevertModel?.traceData();
      const paramaterActionModel = vm.paramaterActionModel?.traceData();

      trace.push(`<<[${index}]>>${model} |parameterRevertModel = ${parameterRevertModel} |paramaterActionModel= ${paramaterActionModel}`)
      index++;
    })

    this.traceService.debug(this.modTrace, trace.join("\n"));
  }
  private openModalWarning(modalTitle: string, detailsId: LogMessage, msg: string, yesButtonText: string, noButtonText: string): void {
    // modal with warning icon and yes no button
    this.modalWarningMessage = msg;
    this.modalWarningTitle = modalTitle;
    this._logMessage = detailsId;
    this.ref?.hide();
    this.yesTitle = yesButtonText;
    this.noTitle = noButtonText;
    this.ref = this.siModalSvc.show(this.modalWarningTemplate, {
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      // class: this.centeredModalClass,
      ariaLabelledBy: 'sample-modal-title'
    });
  }

  private showNotesModal(): void {
    // this.openModal('notesTemplate', this.notesTemplate, this.centeredModalClass);
    this.ref?.hide();
    this.ref = this.siModalSvc.show(this.notesTemplate, {
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      // class: this.centeredModalClass,
      ariaLabelledBy: 'sample-modal-title'
    });
  }

  private clearNote(): void {
    this._outgoingTask = undefined;
    this.ref?.hide();
    this.note = undefined;
    this._noteInput = undefined;
  }

  private getTargetsForValidation(logMsg: LogMessage): string[] | OperatorTaskErrorTypes {
    // This checks if the target exist --> One or more targets are no longer available or not
    // reachable at the moment
    // If the target exist from another system but user has no access ---> The command cannot be
    // executed due to a validation error.
    // In WPF there is a validation helper for this -- might be what WSI is implementing
    let dps: string[] = [];
    if (logMsg === LogMessage.CloseTask || logMsg === LogMessage.Abort) {
      dps = this.taskListVm.getTaskTargetsForValidation(true);
    } else {
      dps = this.taskListVm.getTaskTargetsForValidation(false);
    }

    return dps;
  }

  private evaluateForcedManualRevertActionMode(action: LogMessage): boolean {
    // If a user does not have automatic revert rights and RevertMode is automatic
    // show the security warning once,
    // once forcedManual is saved, restarting task should not show the warning
    let result = false;
    if (action === LogMessage.StartTask) {
      if (this.selectedTask?.revertActionMode === RevertActionMode.Automatic
        && this.selectedTask.hasRevertActions()
        && !this.dataService.rightsService.CanAllowAuomaticRevert) {
        result = true;
        this.selectedTask.revertActionMode = RevertActionMode.ForcedManual;
      }
    }

    return result;
  }

  private evaluateExpirationTime(action: LogMessage): boolean {
    // Note Starting task when the start date is expired is allowed
    let result = true;
    if (action === LogMessage.StartTask) {
      if (this.selectedTask?.endDateType === DateOption.DateTime) {
        const dt = new Date(this.selectedTask.expirationTime);
        if (dt <= new Date()) {
          result = false;
        }
      }
    }
    return result;
  }

  private getTitleFromCommand(selectedCommand: OperatorTaskCommandId): string {
    let result = '';
    switch (selectedCommand) {
      case OperatorTaskCommandId.Start:
        result = this.startCommandText;
        break;
      case OperatorTaskCommandId.Close:
        result = this.closeCommandText;
        break;
      case OperatorTaskCommandId.ChangeTime:
        result = this.changeTimeText;
        break;
      case OperatorTaskCommandId.Revert:
        result = this.revertCommandText;
        break;
      case OperatorTaskCommandId.Abort:
        result = this.abortCommandText;
        break;
      default:
        // not supported
        break;
    }
    return result;
  }

  private isForcedManual(): boolean {
    return this.selectedTask.revertActionMode === RevertActionMode.ForcedManual
      && this.selectedCommand === OperatorTaskCommandId.Start;
  }

  private createListForOverridableParams(models: TargetModel[]): string[] {
    // NOTE: Do not send deleted datapoints
    const result = [];
    if (this.selectedTask.hasOverridableParameters === true) {
      models.forEach(mod => {
        if (mod.isValidTarget()) {
          result.push(mod.bo?.ObjectId);
        } else {
          this.traceService.warn(this.modTrace, `Datapoint does not exist. ${mod.objectId}`)
        }
      })
    }
    return result;
  }

  private validateOverridable(opd: OverridableParameters): boolean {
    let result = false;
    if (!isNullOrUndefined(opd)
      && !Utility.isValidParameterType(opd?.ParamInfo.propertyDetailsRepresentationWithoutValue.IsArray,
        opd?.ParamInfo.GmsDataType)) {
      result = true;
    }
    return result;
  }

  private isValidParameterType(paraminfo: CommandParametersInfo): boolean {
    let result = true;
    if (paraminfo) {
      if (paraminfo.propertyDetailsRepresentationWithoutValue.IsArray === true) {
        result = false;
      }

      switch (paraminfo.GmsDataType) {
        case eGmsDataType.PvssInt:
        case eGmsDataType.PvssUint:
        case eGmsDataType.PvssFloat:
        case eGmsDataType.PvssBool:
        case eGmsDataType.PvssTime:
        case eGmsDataType.PvssChar:
        case eGmsDataType.PvssString:
        case eGmsDataType.GmsInt:
        case eGmsDataType.GmsUint:
        case eGmsDataType.GmsReal:
        case eGmsDataType.GmsBool:
        case eGmsDataType.GmsEnum:
        case eGmsDataType.GmsDateTime:
        case eGmsDataType.GmsDuration:
        case eGmsDataType.PvssBit32:
        case eGmsDataType.GmsBitString:
        case eGmsDataType.PvssInt64:
        case eGmsDataType.PvssUint64:
        case eGmsDataType.GmsInt64:
        case eGmsDataType.GmsUint64:
        case eGmsDataType.PvssBit64:
        case eGmsDataType.GmsBitString64:
          result = true;
          break;
        default:
          result = false;
          break;

      }
    }

    return result;
  }

  private filterAndCreateTargetModels(selectedPoints: BrowserObject[]): void {
    const models: TargetModel[] = [];
    const filteredSelection: BrowserObject[] = [];
    const alreadyAdded: string[] = [];
    selectedPoints.forEach(obj => {
      if (!this.rows.some(vm => vm.model.bo?.Designation === obj.Designation)) {
        filteredSelection.push(obj);
      } else {
        alreadyAdded.push(obj.Designation);
        // this.traceService.debug(this.modTrace, `Target already exists: ${obj.Designation}`);
      }
    })

    filteredSelection.forEach(bo => {
      const target = new TargetModel(this.traceService, this.selectedTask, true, bo, undefined, this.taskListVm.canConfigureTaskData);
      models.push(target);
    });

    this.traceService.debug(this.modTrace, `Targets to be added= ${filteredSelection.length} : Skipped= ${selectedPoints.length - filteredSelection.length}`);
    if (alreadyAdded.length > 0) {
      this.traceService.debug(this.modTrace, `Skipped datapoints=${JSON.stringify(alreadyAdded, null, 2)}`);
    }

    if (models.length > 0) {
      this.traceService.debug(this.modTrace, `New targets to be added= ${filteredSelection.length}`);
      this.initializeTargetViewModels(models);
    }
  }

  private setValuesForDefault(row: OperatorTaskTargetViewModel, skipAligned: boolean, alreadyHasDefault: boolean): void {
    this.rows.forEach(vm => {
      if (row.model.designation !== vm.model.designation) {
        if (vm.isSameObjectModel(row.model.objectModel)) {
          if (alreadyHasDefault && row.isDefaultValue) {
            // remove the previous set, only one default can be set
            vm.isDefaultValue = false;
          }

          if (!vm.alignedToDefaultValue && skipAligned) {
            this.traceService.warn(this.modTrace, `Skipping default assignment for ${vm.model.bo.Designation} | alignedToDefault=${vm.alignedToDefaultValue}`)
          } else {
            const commandValue = row.paramaterActionModel?.editableValue;
            const revertValue = row.parameterRevertModel?.editableValue;
            // reset the aligned to default value
            if (!vm.alignedToDefaultValue) {
              vm.alignedToDefaultValue = true;
            }

            // apply the values
            vm.isAligningDefaultValue = true;
            if (commandValue) {
              vm.paramaterActionModel.editableValue = commandValue;
            }

            if (revertValue) {
              vm.parameterRevertModel.editableValue = revertValue;
            }
            vm.isAligningDefaultValue = false;
          }
        }
      } else {
        // also set alignedToDefaultValue to true when this value is set as default
        // this could happen when there is already a default value set
        if (!row.alignedToDefaultValue && row.isDefaultValue) {
          row.alignedToDefaultValue = true;
        }
      }
    })
  }

  private handleRevertMode(): void {
    const hasRevertActions = this.selectedTask?.hasRevertActions();
    this.revertModeText = Utility.calculateRevertModeText(hasRevertActions,
      this.selectedTask?.revertActionMode === RevertActionMode.ForcedManual,
      this.textNoRevertCommand,
      this.textForcedManual);

    if (this.isEditing() && this.taskListVm.canConfigureTaskData) {
      this.revertModeDisabled = !hasRevertActions;
    } else {
      this.revertModeDisabled = true;
    }
  }

  private subscribeToTargetChanges(): void {
    this.clearTargetSubscriptions('subscribeToTargetChanges()');
    this.rows?.forEach(r => {
      const subscription = r.targetErrorChanged$.subscribe(
        val => {
          this.setTargetErrors()
        }
      );
      this.targetChangedSubscriptions.push(subscription);
    });
    this.traceService.debug(this.modTrace, `subscribeToTargetChanges(): Subscription length= ${ this.targetChangedSubscriptions?.length}`)
  }

  private clearTargetSubscriptions(msg: string): void {
    this.traceService.debug(this.modTrace, `clearTargetSubscriptions(): ${msg} | Clearing = ${ this.targetChangedSubscriptions?.length} subscriptions`)
    this.targetChangedSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.targetChangedSubscriptions = [];
  }

}

export const nameValidator: (nameList: string[]) => ValidatorFn = (nameList: string[]) => (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (nameList.includes(value)) {
    return { nameAlreadyExists: true };
  } else if (Utility.REGEX_ALL_WHITESPACE.test(value)) {
    return { nameMin: true };
  } else {
    return null;
  }
};
