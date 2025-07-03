/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
import { IRuntimeValue } from '@gms-flex/services';

import { OperatorTaskTargetCommandStatus } from '../types/operator-task-target-command-status';
import { CommandResult } from '../types/task-command-result';

export interface WsiTarget {
  cnsPathDesignation: string;
  wsTargetRep: WsiOperatorTaskTargetRepresentation;
}

export interface WsiOperatorTaskTargetRepresentation {
  // <summary>
  // Summary status of the commands execution (set by CoHost)
  // </summary>
  Status: OperatorTaskTargetCommandStatus;

  // <summary>
  // Summary status of the revert commands execution  (set by CoHost)
  // </summary>
  RevertActionStatus: OperatorTaskTargetCommandStatus;

  // <summary>
  // Flags indicating if the overridable parameters values are the default value or aligned to the defaut value
  // </summary>
  AlignedToDefaultValue: boolean;
  IsDefaultValue: boolean;

  // <summary>
  // In the template, it is possible to indicate that the value of one parameter of one command of a task action should be asked to the operator (that is an overridable parameter).
  // As a consequence, for each target the Operator Tasks SanpIn shows:
  // - the parameter's default value (if provided in the template)
  // or
  // - the current property value (if not provided in the template)
  // and allows the operator to change it.
  // This default value or new value inserted at runtime for each target is stored by the SnapIn in the RuntimeValue property.
  // When executing the command on this target, the CoHost uses this value for the parameter (if provided, otherwise the parameter's value is the one specified in the template).
  // Note: this property remains NULL when the value of the parameter is not overridable by the operator
  // </summary>
  RuntimeValue: IRuntimeValue;

  // <summary>
  // The same as the RuntimeValue property, applied to a parameter of a revert action, with little differences. In details:
  // For each target the Operator Tasks SanpIn shows:
  // - the parameter's default value (if provided in the template)
  // or
  // - the text "Original Value" (if no value is provided in the template)
  // and allows the operator to change it.
  // A. If the operator chooses a value for the revert parameter, this value is stored by the SnapIn in the RuntimeValueForRevert property (UseOriginalValueForRevert is False).
  // B. If the operator sets to empty the value for the revert parameter, the SnapIn sets the RuntimeValueForRevert property to NULL and the UseOriginalValueForRevert to True.
  //
  // When executing the command on this target:
  // - if UseOriginalValueForRevert = False => the CoHost uses the RuntimeValueForRevert value as value of the revert parameter
  // - if UseOriginalValueForRevert = True  => the CoHost reads the value of the parameter's affected property when the action is executed and stores it
  // in the RuntimeValueForRevert property; the value of RuntimeValueForRevert is then used when the revert action is executed.
  // - if UseOriginalValueForRevert = Null => the CoHost uses the value provided in the template for the parameter (the value of the revert parameter is not overridable by the operator)
  // </summary>
  RuntimeValueForRevert: IRuntimeValue;

  // <summary>
  // Flag indicating whether the value of the overridable parameter for the revert action must be:
  // - (true)  the "original" value, i.e. the value of the property before executing the command
  // - (false) the value specified in the property RuntimeValueForRevert
  // - (null)  the value provided as default in the template, to get from the CommandParameter definition (the value of the parameter for revert is not overridable by the operator)
  // </summary>
  UseOriginalValueForRevert: boolean;

  // <summary>
  // Status of each command execution on the target  (set by CoHost)
  // </summary>

  ErrorsDetails?: CommandResult[];

  // <summary>
  // Status of each revert command execution on the target  (set by CoHost)
  // </summary>
  RevertActionErrorsDetails?: CommandResult[];

  // <summary>
  // Name of the property commanded on the target (to use when the condition property is not specified and the target is commanded by alias, set by CoHost)
  // </summary>
  CommandedProperty?: string;

  // <summary>
  // The status of the check on the target conditions (set by CoHost)
  // </summary>
  ConditionVerified?: number;

  FlagsValue?: number;
  TargetNode?: TargetNodeRepresentation;

  // ///// CoHost properties that should not be used  ///////
  // <summary>
  // Data type of the overridable parameter for revert.
  // Set and used by the CoHost only, it is NOT persisted in the task and must not be used elsewhere.
  // </summary>
  // RevertParamValueType?: number;

  // <summary>
  // This DpId contains the original value for revert (target dpId + affected property dpe).
  // Its value is read and saved into RuntimeValueForRevert when the task starts, and it is afterwards used to execute the revert command.
  // Set and used by the CoHost only, it is NOT persisted in the task and must not be used elsewhere.
  // </summary>
  // OriginalValueForRevertObjectId?: string;
}

// Example response from wsi
// Valid, from another system will have all the properties populated
// Deleted/non-existing
// "TargetNode": {
//   "Order": 0,
//     "SystemNumber": 0
// }
// Note: model can be excluded in saving task
export interface TargetNodeRepresentation {
  // the order of the target when they are added
  // Notes:
  // Same target from different view can be added with different parameters/value
  Order: number;
  Name: string;
  Description: string;
  NameAssembled: string;
  DescriptionAssembled: string;
  ObjectType: string;
  SystemNumber: number;
  NameSystemNumber: string;
  // Datapoint name in WPF and BrowserObject Node.ObjectId with system number
  // Use NameDpIdAndAbove first and fallback to DpIdName if null
  // ie MainSystem:GmsDevice_1_898_4194307
  DpIdName: string;
  NameDpIdAndAbove: string;
}