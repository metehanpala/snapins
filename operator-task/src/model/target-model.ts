import { BrowserObject, IRuntimeValue, TaskAction } from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../shared';
import { Utility } from '../shared/utility';
import { OperatorTaskStatuses } from '../types/operator-task-status';
import { OperatorTaskTargetCommandStatus } from '../types/operator-task-target-command-status';
import { OverridableParameters, OverridableParametersDetails } from '../types/overridable-parameter-types';
import { CommandResult } from '../types/task-command-result';
import { VariantType } from '../types/variant-type';
import { TaskViewMode } from '../view-model/operator-task-list-vm';
import { OperatorTaskModel } from './operator-task-model';
import {
  TargetNodeRepresentation,
  WsiOperatorTaskTargetRepresentation,
  WsiTarget
} from './wsi-operator-task-target-representation';

export class TargetModel {
  public get readPropertyValue(): any {
    return this._readPropertyValue;
  }

  public set readPropertyValue(value: any) {
    if (value) {
      this._readPropertyValue = value;
      this.needToReadPropertyValue = false;
    }
  }

  public get useOriginalValueForRevert(): boolean {
    return this._useOriginalValueForRevert;
  }

  // Set in parameter model ctor
  public set useOriginalValueForRevert(value: boolean) {
    this._useOriginalValueForRevert = value;
    if (value === true && this.canConfigureTaskData === true) {
      //  A. If the operator chooses a value for the revert parameter,
      //  this value is stored by the SnapIn in the RuntimeValueForRevert property (OriginalValueForRevert is False).
      // B. If the operator sets to empty the value for the revert parameter,
      // the SnapIn sets the RuntimeValueForRevert property to NULL and the OriginalValueForRevert to True.
      this.runtimeValueForRevert = null;
    }
  }

  public get overridable(): OverridableParametersDetails {
    return this._overridable;
  }

  public needToReadPropertyValue = false;

  public set overridable(value: OverridableParametersDetails) {
    this._overridable = value;
    if (this._overridable) {
      if (value.OverridableParameterAction) {
        this.parameterAction = value.OverridableParameterAction;
      }

      if (value.OverridableParameterRevert) {
        this.parameterRevert = value.OverridableParameterRevert;
      }

      if (this.targetIsNew) {
        this.needToReadPropertyValue = this.needReadPropertyValueHelper(this.parameterAction) || this.needReadPropertyValueHelper(this.parameterRevert);
      }
    }
  }

  public get bo(): BrowserObject {
    return this._bo;
  }

  public set bo(value: BrowserObject) {
    this._bo = value;
    if (value) {
      this.objectId = value.ObjectId;
      this.objectModel = value.Attributes.ObjectModelName;
      this.displayName = value.Name;
      this.displayDescription = value.Descriptor;
      this.objectId = value.ObjectId;
      this.designation = value.Designation;
    }
  }

  public get objectModel(): string {
    return this._objectModel;
  }

  public set objectModel(value: string) {
    this._objectModel = value;

    // if (!this.datapointDoesNotExist) {
    //   this.taskAction = this.mapTaskAction();
    // }
  }
  public targetIsNew = false;
  public objectId: string;

  // can only be determined from wsi response since it is not possible in flex ui to add a
  // deleted object
  // Can be deleted from system or from view, the target is shown in red
  public datapointDoesNotExist = false;
  public datapointIsNotInCurrentSystem = false;

  public displayName: string;
  public displayDescription: string;

  // /////// WsiOperatorTaskTargetRepresentation members   ////////
  public targetStatus: OperatorTaskTargetCommandStatus = OperatorTaskTargetCommandStatus.Unknown;
  public revertActionStatus: OperatorTaskTargetCommandStatus = OperatorTaskTargetCommandStatus.Unknown;
  // The command parameter of this target are aligned with the default values (in case of no default set it as true).
  // False when there is a default value set and user changed the value
  // UI shown as bolded text
  public alignedToDefaultValue = true;

  // the user value is used as the parameters for all dps of same type
  // the isDefaultvalue is only set on the current target, the other targets runtime value is
  // changed
  // Only one default value can be set per om, reset the others
  public isDefaultValue = false;
  // Show the default value from template, or the current property value (adding new target)
  public runtimeValue: IRuntimeValue;
  public runtimeValueForRevert: IRuntimeValue;
  public targetNode?: TargetNodeRepresentation; // CnsTreeNode representation

  // Cohost members; do not write
  public errorsDetails?: CommandResult[];
  public revertActionErrorsDetails?: CommandResult[];
  public commandedProperty?: string;
  public conditionVerified?: number;
  public flagsValue?: number;

  // use for saving; CNSPath in wpf
  public designation: string;
  public parameterAction: OverridableParameters;
  public parameterRevert: OverridableParameters;

  public viewMode: TaskViewMode;
  public taskAction: TaskAction;
  public isInvalidTarget = false;
  public templateTaskActionMissConfigured = false;

  private _useOriginalValueForRevert = false;
  private _overridable: OverridableParametersDetails;
  private wsiTarget: WsiTarget;
  private _objectModel: string;
  private _bo: BrowserObject;
  private readonly modTrace = TraceModules.modelTrace;

  // see needReadPropertyValueHelper() for conditions
  private _readPropertyValue: any;
  constructor(public trace: TraceService, public taskModel: OperatorTaskModel,
    isNew: boolean, bo: BrowserObject, value: WsiTarget, public canConfigureTaskData: boolean) {
    this.targetIsNew = isNew;
    if (!isNew) {
      this.createTargetFromWsi(value);
    } else {
      this.createNewTarget(bo);
    }

    this.taskAction = this.taskModel.getActionsByObjectModel(this.objectModel);
  }

  public traceData(): string {
    // eslint-disable-next-line max-len
    return `designation=  ${this.designation}|runtimeValueForRevert=  ${this.runtimeValueForRevert}|runtimeValue=  ${this.runtimeValue}|targetStatus=  ${this.targetStatus}|revertActionStatus=  ${this.revertActionStatus}|alignedToDefaultValue=  ${this.alignedToDefaultValue}useOriginalValueForRevert=  ${this.useOriginalValueForRevert}|isDefaultValue=  ${this.isDefaultValue}`;
  }
  public isEditing(): boolean {
    return this.viewMode !== TaskViewMode.View;
  }

  public hasRevertCommand(): boolean {
    if (isNullOrUndefined(this.taskAction) && !this.datapointDoesNotExist) {
      this.trace.warn(this.modTrace, 'hasRevertCommand() called before setting taskaction')
      this.taskAction = this.taskModel.getActionsByObjectModel(this.objectModel);
    }

    if (isNullOrUndefined(this.taskAction)) {
      this.trace.warn(this.modTrace, `hasRevertCommand() did not find task action for: ${this.objectId}`)
      return false;
    }

    return !isNullOrUndefined(this.taskAction.RevertAction);
  }

  public createTargetFromWsi(value: WsiTarget): void {
    if (value) {
      this.wsiTarget = value;
      this.alignedToDefaultValue = value.wsTargetRep.AlignedToDefaultValue;
      this.commandedProperty = value.wsTargetRep.CommandedProperty;
      this.conditionVerified = value.wsTargetRep.ConditionVerified;
      this.errorsDetails = value.wsTargetRep.ErrorsDetails;
      this.flagsValue = value.wsTargetRep.FlagsValue;
      this.isDefaultValue = value.wsTargetRep.IsDefaultValue;
      this.revertActionErrorsDetails =
        value.wsTargetRep.RevertActionErrorsDetails;
      this.revertActionStatus = value.wsTargetRep.RevertActionStatus;
      this.runtimeValue = value.wsTargetRep.RuntimeValue;
      this.runtimeValueForRevert = value.wsTargetRep.RuntimeValueForRevert;
      this.targetStatus = value.wsTargetRep.Status;
      this.useOriginalValueForRevert =
        value.wsTargetRep.UseOriginalValueForRevert;
      this.targetNode = value.wsTargetRep.TargetNode;

      if (this.targetNode) {
        this.objectId = this.determineObjectId();
        this.objectModel = this.targetNode.ObjectType;
        this.displayName = this.targetNode.Name;
        this.displayDescription = this.targetNode.Description;
        this.designation = this.targetNode.NameAssembled;
      }
    }
  }

  // Set the default values, viewmodel will initialize the command paramaters
  public createNewTarget(bo: BrowserObject): void {
    this.bo = bo;
    if (bo) {
      this.objectModel = bo.Attributes.ObjectModelName;
      this.displayName = bo.Name;
      this.displayDescription = bo.Descriptor;
      this.objectId = bo.ObjectId;
      this.designation = bo.Designation;
      // The object is created with default values for the command parameters data
      this.wsiTarget = {
        cnsPathDesignation: this.designation,
        wsTargetRep: {
          Status: OperatorTaskTargetCommandStatus.Unknown,
          RevertActionStatus: OperatorTaskTargetCommandStatus.Unknown,
          AlignedToDefaultValue: this.alignedToDefaultValue,
          IsDefaultValue: false,
          RuntimeValue: undefined,
          RuntimeValueForRevert: undefined,
          UseOriginalValueForRevert: false
        }
      }
    }
  }

  public toWsiTarget(): any {
    const key = this.designation;
    const wsiTarget = {
      Status: this.targetStatus,
      RevertActionStatus: this.revertActionStatus,
      AlignedToDefaultValue: this.alignedToDefaultValue,
      IsDefaultValue: this.isDefaultValue,
      RuntimeValue: this.runtimeValue,
      UseOriginalValueForRevert: undefined,
      RuntimeValueForRevert: undefined
    };

    if (!this.datapointDoesNotExist && this.hasRevertCommand()) {
      //  A. If the operator chooses a value for the revert parameter,
      //  this value is stored by the SnapIn in the RuntimeValueForRevert property (OriginalValueForRevert is False).
      // B. If the operator sets to empty the value for the revert parameter,
      // the SnapIn sets the RuntimeValueForRevert property to NULL and the OriginalValueForRevert to True.
      wsiTarget.UseOriginalValueForRevert = this.useOriginalValueForRevert;
      wsiTarget.RuntimeValueForRevert = this.runtimeValueForRevert;
    }
    return { key, wsiTarget };
  }

  public isTargetMissingParameters(): boolean {
    if (this.taskModel.hasOverridableParameters) {
      if (Utility.isRuntimeInitialized(this.runtimeValue) && isNullOrUndefined(this.runtimeValue.b)) {
        return true;
      }

      if (Utility.isRuntimeInitialized(this.runtimeValueForRevert) && isNullOrUndefined(this.runtimeValueForRevert.b)) {
        return true;
      }
    }
    return false;
  }

  public isValidTarget(): boolean {
    return !this.datapointIsNotInCurrentSystem
      && !this.datapointDoesNotExist;
  }

  public needReadPropertyValueHelper(op: OverridableParameters): boolean {
    if (op && op.UseCurrentPropertyValue) {
      return true;
    }
    return false;
  }

  private determineObjectId(): string {
    let result: string;
    if (this.wsiTarget.wsTargetRep.TargetNode.hasOwnProperty("NameDpIdAndAbove")) {
      if (this.wsiTarget.wsTargetRep.TargetNode.NameDpIdAndAbove) {
        result = this.wsiTarget.wsTargetRep.TargetNode.NameDpIdAndAbove;
      } else if (this.wsiTarget.wsTargetRep.TargetNode.DpIdName) {
        result = this.wsiTarget.wsTargetRep.TargetNode.DpIdName;
      } else if (this.wsiTarget.wsTargetRep.TargetNode.NameAssembled) {
        result = this.wsiTarget.wsTargetRep.TargetNode.NameAssembled; // + Utility.SEMI_COLON;
      }
    }

    if (isNullOrUndefined(result)) {
      this.datapointDoesNotExist = true;
      result = this.wsiTarget.cnsPathDesignation;
    }

    return result;
  }
}