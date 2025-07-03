/* eslint-disable @typescript-eslint/naming-convention */
import { CommandParameters, IRuntimeValue, PropertyDetails } from "@gms-flex/services";

export interface OverridableParametersDetails {
  TemplateTaskActionMissConfigured: boolean;
  OverridableParameterAction: OverridableParameters;
  OverridableParameterRevert: OverridableParameters;
  ObjectId: string;
}

export interface OverridableParameters {
  ParamInfo: CommandParametersInfo;
  Param: CommandParametersRepresentation;
  // In case a default target is not specified in the task, set the default value specified in the template
  DefaultParamValue: IRuntimeValue;
  // when this is true, the property's current value needs to be used
  // can be read from ParameterDecoration.DefaultValue
  // for revert --> if the property is not specified, would need to get the property from the
  // task action --> missing AffectedPropertyName from CommandParametersInfo
  UseCurrentPropertyValue: boolean;
}

export interface CommandParametersInfo {
  Name: string;
  Description: string;
  GmsDataType: eGmsDataType;
  ParamType: ParameterType;
  Control: eControl;
  ParameterDecoration: CommandParameters;
  propertyDetailsRepresentationWithoutValue: PropertyDetails;
  // Note missing properties from WSI
  // defaultValue:IRuntimeValue
  // affectedPropertyName - use to read the current value,
  // this can be derived from TaskAction.Property and if
  // RevertAction.Property == null, use TaskAction.Property,
}
export interface CommandParametersRepresentation {
  // Name of the parameter
  Name: string;

  // Flag indicating whether the parameter value needs to be set at runtime (it might be changed
  // by the operator) --> This is the overridableParameters.
  SetAtRuntime: boolean;

  // Value to assign to the parameter for command execution.
  // This value is read from the template file and must be converted according to the proper type
  // before using it.
  // If Value is null it means that the parameter's value was not specified in the template (this is
  // acceptable only for overridable parameters, i.e. parameters with SetAtRuntime = true).
  // When Value is null:
  // - in case of actions => the SnapIn reads the value of the parameter's affected property and
  // sets the OperatorTaskTarget.RuntimeValue accordingly
  // - in case of revert actions => the SnapIn sets the
  // OperatorTaskTarget.UseOriginalValueForRevert = true, to force the Cohost
  //   to read the value of the revert parameter's affected property and set it into
  //   OperatorTaskTarget.RuntimeValueForRevert
  // When Value is not null:
  // - the CoHost converts Value into the corresponding RuntimeValue when the command is executed.
  Value: any;// shouldn't this be a variant

  // Typed value of the parameter. This property is created converting the "Value" property (which is a generic object read from the template)
  // to the correct data type; the conversion is based on the type of the parameter requested by the command.
  // The conversion is made by the Operator Tasks CoHost when SetAtRuntime = false.
  // If SetAtRuntime = true, the CoHost must use the RuntimeValue of each OperatorTaskTarget as parameter's value.
  RuntimeValue: IRuntimeValue;

  // This flag is set to true if the parameter's value was not specified or null in the template.
  // For parameters of revert actions, this means that the parameter's value must be the original value
  // (i.e. the value of the affected property before executing the task commands).
  UseOriginalValue: boolean;

  // This flag indicates that a parameter is of type ImplicitCns
  // (for this type of parameters the value is automatically set by the CoHost)
  // Set and used by the CoHost only, it is NOT persisted in the task and must not be used elsewhere.
  readonly IsImplicitCns: boolean;
}
export enum eGmsDataType {
  None = 0,
  PvssChar = 1,
  PvssUint = 2,
  PvssInt = 3,
  PvssFloat = 4,
  PvssBool = 5,
  PvssBit32 = 6,
  PvssString = 7,
  PvssTime = 8,
  PvssDpId = 9,
  PvssLangText = 10,
  PvssBlob = 11,
  GmsBool = 12,
  GmsInt = 13,
  GmsUint = 14,
  GmsReal = 15,
  GmsEnum = 16,
  GmsBitString = 17,
  GmsDateTime = 18,
  GmsApplSpecific = 19,
  GmsAny = 20,
  GmsComplex = 21,
  GmsDuration = 22,
  PvssUint64 = 23,
  PvssInt64 = 24,
  PvssBit64 = 25,
  GmsInt64 = 26,
  GmsUint64 = 27,
  GmsBitString64 = 29
}

export enum ParameterType {
  Default,
  CnsPath
}

export enum eControl {
  DropDown,
  Numeric,
  String,
  DateTime,
  Password
}