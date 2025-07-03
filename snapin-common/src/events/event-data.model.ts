/* eslint-disable @typescript-eslint/naming-convention */
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Procedure, Step } from '@gms-flex/services';
import { StepAction } from '@simpl/element-ng/stepper';

const STEP_TO_DISABLE = 'OPStepAlarmPrintout';

export enum enumColumnType {
  Hidden = 0,
  Text = 1,
  EventIcon = 2,
  State = 3,
  Timer = 4,
  Recursation = 5,
  Buttons = 6,
  ScrollableText = 7
}

export class HeaderData {
  public constructor(
    public id?: string,
    public label?: string,
    public widthPercentage?: number,
    public columnType?: enumColumnType,
    public isFixedSize?: boolean,
    public columnVisible?: boolean,
    public minColWidth?: number,
    public width?: number,
    public sortingDirection?: number,
    public allowSorting?: boolean) {
    this.isFixedSize = false;
    this.columnVisible = true;
    this.minColWidth = 0;
    this.widthPercentage = 20;
    this.width = 20;
    this.allowSorting = true;
    this.sortingDirection = 0;
  }
}

export interface GridData {
  cellData: Map<string, any>;
  customData?: any;
  isDisabled: boolean; // To disable a row in the event-list
}

/**
 * interface for grid events needed to communicate with the snapins
 */
export interface GridEvent {
  eventType: enumEventType;
  eventData: any;
  totalWidth?: number;
  [key: string]: enumEventType | number | any;
}

/**
 *
 */
export enum enumEventType {
  HeaderColumnClick = 1,
  RowClick = 2,
  ButtonClick = 4,
  RowUnselect = 6,
  ColumnResized = 7,
  RequestDefault = 8,
  CancelChanges = 9,
  GridInitialized = 10,
  EmitEvent = 11
}

export interface ColHeaderData {
  id: string;
  title: string;
  visible: boolean;
  draggable: boolean;
  disabled: boolean;
}

export enum SelectionStatus {
  CANCEL = 0,
  OK = 1,
  DEFAULT = 2,
  INSTANT = 3
}

export enum ResolveExecutionStatus {
  InProgress = -1,
  Failure = 0, 
  Success = 1
}

export interface ResolveExecutionResult {
  status: ResolveExecutionStatus,
  errorMessage?: string
}

export class OPStep {
  public attachments: string;
  public attributes: string;
  public configuration: string;
  public errorText: string;
  public hasConfirmedExecution: boolean;
  public isCompleted: boolean;
  public managedType: string;
  public notes: string;
  public operator: string;
  public runtimeStatus: string;
  public status: string;
  public id: string;
  public name: string;
  public fixedLink: string;
  public open: boolean;
  public required: boolean;
  public disabled: boolean;
  public repeatable: boolean;
  public primaryAction?: StepAction;
  public secondaryActions?: StepAction[];
  public icon?: string;
}

export class OperatingProcedure {
  public alertCount: number;
  public alertSource: string;
  public alertTime: Date;
  public id: string;
  public isClosed: boolean;
  public resetSteps: number;
  public sequential: boolean;
  public steps: OPStep[];
  public subsequent: number;

  public initializeFromOPServiceProcedure(procedure: Procedure, resolveLabel: string): void {
    this.alertCount = procedure.alertCount;
    this.alertSource = procedure.alertSource;
    this.alertCount = procedure.alertCount;
    this.id = procedure.id;
    this.isClosed = procedure.isClosed;
    this.resetSteps = procedure.resetSteps;
    this.sequential = procedure.sequential;
    this.steps = procedure.steps ? this.initializeFromOPServiceSteps(procedure.steps, resolveLabel) : null;
    this.subsequent = procedure.subsequent;
  }

  public initializeFromOPServiceSteps(steps: Step[], resolveLabel: string): OPStep[] {
    const procedureSteps: OPStep[] = [];

    if (steps && steps.length > 0) {
      steps.forEach(step => {
        const currStep: OPStep = new OPStep();
        currStep.attachments = step.attachments;
        currStep.attributes = step.attributes;
        currStep.configuration = step.configuration;
        currStep.errorText = step.errorText;
        currStep.hasConfirmedExecution = step.hasConfirmedExecution;
        currStep.isCompleted = step.isCompleted;
        currStep.managedType = step.managedType;
        currStep.notes = step.notes;
        currStep.operator = step.operator;
        currStep.runtimeStatus = step.runtimeStatus;
        currStep.status = step.status;
        currStep.id = step.stepId;
        currStep.name = step.stepName;
        currStep.fixedLink = step.fixedLink;
        currStep.open = false;
        currStep.disabled = false;
        currStep.required = currStep.attributes.includes('Mandatory');
        currStep.repeatable = !currStep.attributes.includes('Unrepeteable');
        currStep.primaryAction = {
          title: resolveLabel,
          icon: 'element-download',
          type: 'action',
          disabled: step.managedType === STEP_TO_DISABLE || (currStep.isCompleted && currStep.attributes.includes('Unrepeteable'))
        };
        currStep.secondaryActions = [];

        procedureSteps.push(currStep);
      });
    }
    return procedureSteps;
  }
}
