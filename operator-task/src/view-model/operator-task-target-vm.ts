import {
  CnsLabelEn
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject } from 'rxjs';

import { OperatorTaskParameterModel } from '../model/parameter-model';
import { TargetModel } from '../model/target-model';
import { OperatorTaskSnapinDataService } from '../services/operator-task-data.service';
import { TraceModules } from '../shared';
import { Utility } from '../shared/utility';
import { OperatorTaskStatuses } from '../types/operator-task-status';
import { OperatorTaskTargetCommandStatus } from '../types/operator-task-target-command-status';
import { eGmsDataType, OverridableParameters } from '../types/overridable-parameter-types';

export class OperatorTaskTargetViewModel {
  public get parameterValuesChanged(): boolean {
    return this._parameterValuesChanged;
  }

  public set parameterValuesChanged(value: boolean) {
    if (this.model.isEditing()) {
      this.targetErrorChangedSubject.next(value);
    }
    this._parameterValuesChanged = value;
  }
  public isAligningDefaultValue = false;
  public isSavingTarget = false;
  public get alignedToDefaultValue(): boolean {
    return this._alignedToDefaultValue;
  }

  public set alignedToDefaultValue(value: boolean) {
    this._alignedToDefaultValue = value;
    if (this.model.alignedToDefaultValue !== value) {
      this.model.alignedToDefaultValue = value;
    }
  }
  public get isDefaultValue(): boolean {
    return this._isDefaultValue;
  }

  public set isDefaultValue(value: boolean) {
    this._isDefaultValue = value;
    if (this.model.isDefaultValue !== value) {
      this.model.isDefaultValue = value;
    }
  }
  public get hasParameterValidationError(): boolean {
    if (!this.model.isEditing()) {
      return false;
    }
    return this.paramaterActionModel?.hasValidationError === true || this.parameterRevertModel?.hasValidationError === true;
  }

  public readonly targetErrorChangedSubject = new BehaviorSubject<boolean>(false);
  public targetErrorChanged$ = this.targetErrorChangedSubject.asObservable()

  // public parameterActionValidationErrors = false;
  // public parameterRevertValidationErrors = false;
  public displayName: string;
  public paramaterActionModel: OperatorTaskParameterModel;
  public parameterRevertModel: OperatorTaskParameterModel;

  public showAlarmBellResult: boolean;
  public showRevertIconResult: boolean;
  public commandStatusIcon: string;
  public commandRevertStatusIcon: string;
  public readonly trace: TraceService
  public readonly isEmptyString = "";
  public hasRevertCommand: boolean;
  public idForUseOriginalValue = '';
  public readonly mod = TraceModules.vmTargetTrace;
  public todayText = '';
  public readonly dataService: OperatorTaskSnapinDataService;
  private _isDefaultValue: boolean;
  private _alignedToDefaultValue: boolean;
  private _parameterValuesChanged = false;

  // public alignedToDefaultValue():boolean{
  //   return !isNullOrUndefined(this.model)
  //     ? this.model.alignedToDefaultValue
  //     : true;
  // }
  constructor(public model: TargetModel) {
    this.dataService = model.taskModel.dataService;
    this.trace = model.taskModel.traceService;
    // this.hasRevertCommand = model.hasRevertCommand(); not needed, in wpf used to display the
    // revert icon in the parameter column, in flex, the revert has its own column
    this.todayText = this.dataService.translations.todayText;
    this.alignedToDefaultValue = model.alignedToDefaultValue;
    this.isDefaultValue = model.isDefaultValue;

    if (this.model.taskModel.hasOverridableParameters) {
      this.setTargetParameter();
    }

    this.setDisplay()
  }

  public setDisplay(): void {
    this.setDisplayName(this.dataService.cnsLabel);
    this.commandStatusIcon = this.setStatusIcons(this.model.targetStatus);
    this.showRevertIconResult = !isNullOrUndefined(this.model.useOriginalValueForRevert);
    this.commandRevertStatusIcon = this.setStatusIcons(this.model.revertActionStatus);
    this.showAlarmBellResult = this.model.taskModel.status === OperatorTaskStatuses.Expired
      && this.model.conditionVerified === 2;
  }

  public setDisplayName(cns: CnsLabelEn): void {
    if (this.model.datapointDoesNotExist) {
      this.displayName = this.model.objectId;
      return;
    }
    switch (cns) {
      case CnsLabelEn.Description:
      case CnsLabelEn.DescriptionAndName:
      case CnsLabelEn.DescriptionAndAlias:
        this.displayName = this.model.displayDescription
        break;
      case CnsLabelEn.Name:
      case CnsLabelEn.NameAndDescription:
      case CnsLabelEn.NameAndAlias:
      default:
        this.displayName = this.model.displayName;
        break;
    }
  }

  public updateFromViewModel(): void {
    this.isSavingTarget = true;
    this.parameterValuesChanged = false;
    // this.parameterActionValidationErrors = false;
    // this.parameterRevertValidationErrors = false;
    if (this.model.isValidTarget()) {
      if (this.paramaterActionModel) {
        this.model.runtimeValue = this.paramaterActionModel.updateRuntimeValue();
        this.trace.debug(this.mod, `Action runtimeValue= ${this.model.runtimeValue}`);
      }

      if (this.parameterRevertModel) {
        this.model.runtimeValueForRevert = this.parameterRevertModel.updateRuntimeValue();
        this.model.useOriginalValueForRevert = this.parameterRevertModel.useOriginalValue;
        this.trace.debug(this.mod, `Revert Action runtimeValue= ${this.model.runtimeValueForRevert}`);
      }
    } else {
      this.trace.warn(this.mod, `updateFromViewModel(): datapoint is invalid | ${this.model.objectId}`)
    }
    this.isSavingTarget = false;
  }

  public hasDefaultValueSet(om: string): boolean {
    return this.model.taskModel.targetDpIds.some(t =>
      t.designation !== this.model.designation
      && t.isDefaultValue
      && t.objectModel === om);
  }

  public hasAlignedToDefaultValue(row: OperatorTaskTargetViewModel, rows: OperatorTaskTargetViewModel[]): boolean {
    return rows.some(t =>
      t.model.designation !== this.model.designation
      && !t.alignedToDefaultValue
      && t.model.objectModel === row.model.objectModel);
  }

  public isEmptyParameterValue(): boolean {
    // The empty string is considered valid for a parameter with string type
    if (this.paramaterActionModel
      && this.paramaterActionModel.gmsDataType !== eGmsDataType.PvssString
      && Utility.isNullOrWhitespace(this.paramaterActionModel.editableValue)) {
      return true;
    }
    return false;
  }

  public isSameObjectModel(om: string): boolean {
    return this.model.objectModel === om;
  }

  private setTargetParameter(): void {
    if (isNullOrUndefined(this.model) || !this.model.isValidTarget()) {
      return;
    }

    if (this.model.targetIsNew) {
      if (this.model.parameterAction) {
        const defaultValue = this.getDefaultParameterValue(this.model.parameterAction, false, this.model.targetIsNew);
        this.paramaterActionModel = new OperatorTaskParameterModel(this, defaultValue, false)
      }

      if (this.model.parameterRevert) {
        const defaultValue = this.getDefaultParameterValue(this.model.parameterRevert, true, this.model.targetIsNew);
        this.parameterRevertModel = new OperatorTaskParameterModel(this, defaultValue, true)
      }
    } else {
      // use the value in runtimeVariants
      if (Utility.isRuntimeInitialized(this.model.runtimeValue)) {
        this.paramaterActionModel = new OperatorTaskParameterModel(this, null, false)
      }

      if (this.model.useOriginalValueForRevert === true || Utility.isRuntimeInitialized(this.model.runtimeValueForRevert)) {
        this.parameterRevertModel = new OperatorTaskParameterModel(this, null, true);
      }
    }

    if (!isNullOrUndefined(this.parameterRevertModel)) {
      this.idForUseOriginalValue = this.model.designation ?? Utility.createGuid();
    }

    this.parameterValuesChanged = this.hasParameterValidationError;
  }

  private getDefaultParameterValue(parameter: OverridableParameters, isRevert: boolean, initDefaultValue: boolean): any {
    if (isNullOrUndefined(parameter) || isNullOrUndefined(this.model)) {
      return undefined;
    }

    let actionDefaultValue: any;

    if (initDefaultValue) {
      // Verify if there is a target of the same data type that is the default one .....
      const targetWithDefaultParam = this.model.taskModel.isDefaultParameterValueSet(this.model.objectModel);
      if (targetWithDefaultParam) {
        // ...... in case of a target set as default, use its value
        if (!isRevert && targetWithDefaultParam.paramaterActionModel) {
          return targetWithDefaultParam.paramaterActionModel.editableValue;
        }

        if (isRevert && targetWithDefaultParam.parameterRevertModel) {
          // ... in case of revert, set also the flag to require the original value
          if (this.model != null && targetWithDefaultParam.model) {
            this.model.useOriginalValueForRevert = targetWithDefaultParam.model.useOriginalValueForRevert;
          }
          return targetWithDefaultParam.parameterRevertModel.editableValue;
        }

      }

      // In case a default target is not specified in the task, set the default value specified in the template
      actionDefaultValue = !isNullOrUndefined(parameter.DefaultParamValue) ? parameter.DefaultParamValue.b : undefined;

      // If the value is null and is not the revert parameter
      // or it is the revert but the original value is not required,it is necessary to read the current value.
      if (isNullOrUndefined(actionDefaultValue) && (!isRevert || !parameter.UseCurrentPropertyValue)) {
        // the call to read property value is done ahead of time in info component
        // Notes: when the datapoint is offline, the datapoints defaultvalue will be null/undefined,

        let currentValue: any;
        let readFromValueService = false;
        if (!isNullOrUndefined(this.model.readPropertyValue)) {
          currentValue = this.model.readPropertyValue;
          readFromValueService = true;
        } else {
          currentValue = parameter.ParamInfo?.ParameterDecoration?.DefaultValue;
        }
        this.trace.info(this.mod, `getDefaultParameterValue() isReadFromValueService= ${readFromValueService} | value = 
        ${currentValue} | ${this.model.objectId}`)
        return currentValue;
      } else {
        this.trace.info(this.mod, `getDefaultParameterValue() read from template = ${parameter.DefaultParamValue} | ${this.model.objectId}`)
      }
    } else {
      // Not a new target
      if (!isNullOrUndefined(this.model.runtimeValueForRevert)
        && !isNullOrUndefined(this.model.runtimeValue)) {
        actionDefaultValue = isRevert ? this.model.runtimeValueForRevert.b : this.model.runtimeValue.b;
        this.trace.debug(this.mod, `getDefaultParameterValue() read from runtime:
        calculated = ${actionDefaultValue} |
        isRevert = ${isRevert} | ${this.model.objectId}`)
      }
    }

    // ... return the original default value of the parameter.
    return actionDefaultValue;
  }

  private setStatusIcons(status: number): string {
    let color = 'status-info';
    switch (status) {
      case OperatorTaskTargetCommandStatus.Unknown:
        color = 'status-info';
        break;
      case OperatorTaskTargetCommandStatus.Succeeded:
        color = 'status-success';
        break;
      case OperatorTaskTargetCommandStatus.Exception:
        color = 'status-caution';
        break;
      case OperatorTaskTargetCommandStatus.Failed:
        color = 'status-danger';
        break;
      default:
        this.trace.warn(this.mod, `setStatusIcons default case`);
        break;
    }
    return color;
  }
}