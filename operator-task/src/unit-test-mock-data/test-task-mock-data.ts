/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/member-ordering */
import { OperatorTaskInfo } from "@gms-flex/services";

export class TaskMockData {
  public static allVirtualTypes_idle: OperatorTaskInfo = {
    Id: "4b474a98-07b4-4507-a69a-00ed0fc2d87d",
    TaskName: null,
    TaskDescription: null,
    Status: 120,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized:
      "Template with added virtual objects for 64 bits",
    StartedBy: "",
    SystemId: 99,
    IsExpirationConfig: false,
    ExpirationTime: "2024-05-24T18:25:21.908Z",
    ExpirationTimeRun: "1970-01-01T00:00:00Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "1970-01-01T00:00:00Z",
    Deferred: false,
    PreviousStatus: 120,
    LastModificationTime: "1970-01-01T00:00:00Z",
    ValidationComment: "",
    TargetDpIds: {
      "System100.allvirtualtypes:allvirtualtypes.analog": {
        RuntimeValue: { _type: 458752, a: false, b: 10, _originalType: 458752 },
        RuntimeValueForRevert: { _type: 0, a: false },
        RevertParamValueType: 0,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 6,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "analog",
          Description: "analog",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.analog",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.analog",
          ObjectType: "GMS_Virtual_Analog",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_analog",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_analog"
        }
      },
      "System100.allvirtualtypes: allvirtualtypes.binary": {
        RuntimeValue: {
          _type: 262144,
          a: false,
          b: true,
          _originalType: 262144
        },
        RuntimeValueForRevert: { _type: 0, a: false },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "binary",
          Description: "binary",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.binary",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.binary",
          ObjectType: "GMS_Virtual_Binary",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_binary",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_binary"
        }
      },

      "System100.allvirtualtypes:allvirtualtypes.bit": {
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 10,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "bit",
          Description: "bit",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.bit",
          DescriptionAssembled: "System100.allvirtualtypes:allvirtualtypes.bit",
          ObjectType: "GMS_Virtual_BitString",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_bit",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_bit"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.bit64": {
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "21845",
          _originalType: 4980736
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "bit64",
          Description: "bit64",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.bit64",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.bit64",
          ObjectType: "GMS_Virtual_BitString_64",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_bit64",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_bit64"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.Date": {
        RuntimeValue: {
          _type: 196608,
          a: false,
          b: "2024-05-24T01:25:38Z",
          _originalType: 196608
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 10,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "Date",
          Description: "Date",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.Date",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.Date",
          ObjectType: "GMS_Virtual_DateTime",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_Date",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_Date"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.duration": {
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 5,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 10,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "duration",
          Description: "duration",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.duration",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.duration",
          ObjectType: "GMS_Virtual_Duration",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_duration",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_duration"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.int": {
        RuntimeValue: {
          _type: 327680,
          a: false,
          b: -1,
          _originalType: 327680
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 10,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "int",
          Description: "int",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.int",
          DescriptionAssembled: "System100.allvirtualtypes:allvirtualtypes.int",
          ObjectType: "GMS_Virtual_Integer",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_int",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_int"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.int64": {
        RuntimeValue: {
          _type: 524288,
          a: false,
          b: "9223372036854775807",
          _originalType: 4587520
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "-9223372036854775808",
          _originalType: 4587520
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "int64",
          Description: "int64",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.int64",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.int64",
          ObjectType: "GMS_Virtual_Integer_64",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_int64",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_int64"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.multistate": {
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 2,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "multistate",
          Description: "multistate",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.multistate",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.multistate",
          ObjectType: "GMS_Virtual_Multistate",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName:
            "System100:ApplicationView_Logics_VirtualObjects_multistate",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_multistate"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.string": {
        RuntimeValue: {
          _type: 524288,
          a: false,
          b: "test",
          _originalType: 524288
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "Hello",
          _originalType: 524288
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "string",
          Description: "string",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.string",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.string",
          ObjectType: "GMS_Virtual_String",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_string",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_string"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.uint": {
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 22,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "uint",
          Description: "uint",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.uint",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.uint",
          ObjectType: "GMS_Virtual_Unsigned",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_uint",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_uint"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.uint64": {
        RuntimeValue: {
          _type: 524288,
          a: false,
          b: "18446744073709551615",
          _originalType: 4784128
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "0",
          _originalType: 4784128
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        FlagsValue: 2,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "uint64",
          Description: "uint64",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.uint64",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.uint64",
          ObjectType: "GMS_Virtual_Unsigned_64",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_uint64",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_uint64"
        }
      }
    },
    ValidRevertParameters: false,
    Removed: false,
    OperatorTaskNotesRepresentation: [],
    CnsPath:
      "System100.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OpTemplates.AllVirtuals",
    TemplateNameLocalized: "00 All Virtuals",
    FileContent: "",
    ScaledValues: true,
    TaskNameLocalized: "All Virtuals with 64 bits #7",
    Duration: 300,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        ExecutionOrder: 0,
        TargetObjectModels: ["GMS_Virtual_Analog"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: null,
        ConditionOperator: "<>",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: null
      },
      {
        ExecutionOrder: 1,
        TargetObjectModels: ["GMS_Virtual_Binary"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: true,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: false,
              Value: false,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: true,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: null
      },
      {
        ExecutionOrder: 2,
        TargetObjectModels: ["GMS_Virtual_BitString"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: false,
            Value: "010101",
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        ConditionValue: 0,
        OverridableParameterAction: null,
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 3,
        TargetObjectModels: ["GMS_Virtual_Integer"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: -1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        ConditionValue: 0,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: -1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 4,
        TargetObjectModels: ["GMS_Virtual_String"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: "Hello",
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionValue: 0,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: "Hello",
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 5,
        TargetObjectModels: ["GMS_Virtual_Unsigned"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 22,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionValue: 0,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 22,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 6,
        TargetObjectModels: ["GMS_Virtual_Combination"],
        Property: "FloatValue",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 0.1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 0.2,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionValue: 0,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 0.1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 0.2,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 7,
        TargetObjectModels: ["GMS_Virtual_Duration"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 8,
        TargetObjectModels: ["GMS_Virtual_DateTime"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionValue: 0,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 9,
        TargetObjectModels: ["GMS_Virtual_Multistate"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 2,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 2,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 10,
        TargetObjectModels: ["GMS_Virtual_BitString_64"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: false,
            Value: "9223372036854797653",
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 21845,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: null,
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 21845,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 11,
        TargetObjectModels: ["GMS_Virtual_Integer_64"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: "9223372036854775807",
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: "-9223372036854775808",
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: "9223372036854775807",
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: "-9223372036854775808",
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 12,
        TargetObjectModels: ["GMS_Virtual_Unsigned_64"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: "18446744073709551615",
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 0,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionValue: 0,
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: "18446744073709551615",
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 0,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      }
    ],
    HasOverridableParameters: true,
    ObjectModelsAllowed: [
      "GMS_Virtual_Analog",
      "GMS_Virtual_Binary",
      "GMS_Virtual_BitString",
      "GMS_Virtual_Integer",
      "GMS_Virtual_String",
      "GMS_Virtual_Unsigned",
      "GMS_Virtual_Combination",
      "GMS_Virtual_Duration",
      "GMS_Virtual_DateTime",
      "GMS_Virtual_Multistate",
      "GMS_Virtual_BitString_64",
      "GMS_Virtual_Integer_64",
      "GMS_Virtual_Unsigned_64"
    ],
    ObjectModelsNotAllowed: []
  };

  public static allVirtualTypes_closed: OperatorTaskInfo = {
    Id: "764dfcfa-7b14-4b84-ada3-a24e1d568719",
    TaskName: null,
    TaskDescription: null,
    Status: 110,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized:
      "Template with added virtual objects for 64 bits",
    StartedBy: "a",
    SystemId: 99,
    IsExpirationConfig: false,
    ExpirationTime: "2024-05-22T19:22:41.965Z",
    ExpirationTimeRun: "2024-05-22T19:51:17.928Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "2024-05-22T19:46:16.229Z",
    Deferred: false,
    PreviousStatus: 120,
    LastModificationTime: "2024-05-22T20:08:11.586Z",
    ValidationComment: "",
    TargetDpIds: {
      "System100.allvirtualtypes:allvirtualtypes.analog": {
        FlagsValue: 4,
        RuntimeValue: { _type: 458752, a: false, b: 10, _originalType: 458752 },
        RuntimeValueForRevert: { _type: 0, a: false },
        RevertParamValueType: 0,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 1,
        TargetNode: {
          Order: 0,
          Name: "analog",
          Description: "analog",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.analog",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.analog",
          ObjectType: "GMS_Virtual_Analog",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_analog",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_analog"
        }
      },
      "System100.allvirtualtypes: allvirtualtypes.binary": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 262144,
          a: false,
          b: true,
          _originalType: 262144
        },
        RuntimeValueForRevert: { _type: 0, a: false },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "binary",
          Description: "binary",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.binary",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.binary",
          ObjectType: "GMS_Virtual_Binary",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_binary",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_binary"
        }
      },

      "System100.allvirtualtypes:allvirtualtypes.bit": {
        FlagsValue: 8,
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 21,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 1,
        TargetNode: {
          Order: 0,
          Name: "bit",
          Description: "bit",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.bit",
          DescriptionAssembled: "System100.allvirtualtypes:allvirtualtypes.bit",
          ObjectType: "GMS_Virtual_BitString",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_bit",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_bit"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.bit64": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "21845",
          _originalType: 4784128
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 1,
        TargetNode: {
          Order: 0,
          Name: "bit64",
          Description: "bit64",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.bit64",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.bit64",
          ObjectType: "GMS_Virtual_BitString_64",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_bit64",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_bit64"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.Date": {
        FlagsValue: 8,
        RuntimeValue: {
          _type: 196608,
          a: false,
          b: "2024-05-24T01:25:38Z",
          _originalType: 196608
        },
        RuntimeValueForRevert: {
          _type: 196608,
          a: false,
          b: "2024-05-24T01:25:38Z",
          _originalType: 196608
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "Date",
          Description: "Date",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.Date",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.Date",
          ObjectType: "GMS_Virtual_DateTime",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_Date",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_Date"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.duration": {
        FlagsValue: 8,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 5,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 5,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "duration",
          Description: "duration",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.duration",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.duration",
          ObjectType: "GMS_Virtual_Duration",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_duration",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_duration"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.int": {
        FlagsValue: 8,
        RuntimeValue: {
          _type: 327680,
          a: false,
          b: -1,
          _originalType: 327680
        },
        RuntimeValueForRevert: {
          _type: 327680,
          a: false,
          b: -1,
          _originalType: 327680
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "int",
          Description: "int",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.int",
          DescriptionAssembled: "System100.allvirtualtypes:allvirtualtypes.int",
          ObjectType: "GMS_Virtual_Integer",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_int",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_int"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.int64": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 524288,
          a: false,
          b: "9223372036854775807",
          _originalType: 4587520
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "-9223372036854775808",
          _originalType: 4587520
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "int64",
          Description: "int64",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.int64",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.int64",
          ObjectType: "GMS_Virtual_Integer_64",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_int64",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_int64"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.multistate": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 2,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "multistate",
          Description: "multistate",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.multistate",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.multistate",
          ObjectType: "GMS_Virtual_Multistate",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName:
            "System100:ApplicationView_Logics_VirtualObjects_multistate",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_multistate"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.string": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 524288,
          a: false,
          b: "test",
          _originalType: 524288
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "Hello",
          _originalType: 524288
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "string",
          Description: "string",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.string",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.string",
          ObjectType: "GMS_Virtual_String",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_string",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_string"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.uint": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 22,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 1,
        TargetNode: {
          Order: 0,
          Name: "uint",
          Description: "uint",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.uint",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.uint",
          ObjectType: "GMS_Virtual_Unsigned",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_uint",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_uint"
        }
      },
      "System100.allvirtualtypes:allvirtualtypes.uint64": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 524288,
          a: false,
          b: "18446744073709551615",
          _originalType: 4784128
        },
        RuntimeValueForRevert: {
          _type: 524288,
          a: false,
          b: "0",
          _originalType: 4784128
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 2,
        TargetNode: {
          Order: 0,
          Name: "uint64",
          Description: "uint64",
          NameAssembled: "System100.allvirtualtypes:allvirtualtypes.uint64",
          DescriptionAssembled:
            "System100.allvirtualtypes:allvirtualtypes.uint64",
          ObjectType: "GMS_Virtual_Unsigned_64",
          SystemNumber: 99,
          NameSystemNumber: "System100",
          DpIdName: "System100:ApplicationView_Logics_VirtualObjects_uint64",
          NameDpIdAndAbove:
            "System100:ApplicationView_Logics_VirtualObjects_uint64"
        }
      }
    },
    ValidRevertParameters: true,
    Removed: false,
    OperatorTaskNotesRepresentation: [
      {
        Date: "2024-05-22T20:08:11.511Z",
        User: "Default Administrator",
        Description: "aaa",
        ActionDetailsId: 21,
        ActionDetailsText: "Close task command executed."
      }
    ],
    CnsPath:
      "System100.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OpTemplates.AllVirtuals",
    TemplateNameLocalized: "00 All Virtuals",
    FileContent:
      '{\r\n\tTemplate: {\r\n\t\tDuration : "00:00:05",\r\n\t\tNotesRequired: "Yes",\r\n\t\tTaskActions : [\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Analog",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\t_Parameters : {Value: 1.1},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "<>",\r\n            \t\t\tValue: 0.0\r\n        \t\t\t\t}, \r\n\t\t\t\t_RevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value",\t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: 2.2}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Binary",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\tParameters : {Value: true},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "<>",\r\n            \t\t\tValue: true\r\n        \t\t\t\t},\r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\t_OverridableParameter: "Value",\t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: false}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_BitString",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tParameters : {Value: "010101"},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "<>",\r\n            \t\t\tValue: 0\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value",\t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: null}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Integer",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\tParameters : {Value: -1},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "=",\r\n            \t\t\tValue: 10.00\r\n        \t\t\t\t},\r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value", \t\t\t\t\t\r\n\t\t\t\t\t__Parameters : {Value: -22}\r\n\t\t\t\t}\t\t\t\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_String",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\t__Parameters : {Value: "Bye"},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "=",\r\n            \t\t\tValue: "Bye"\r\n        \t\t\t\t},\r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\t\tCommandName : "Write",\t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: "Hello"}\r\n\t\t\t\t}\t\t\t\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Unsigned",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\tParameters : {Value: 1},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "<>",\r\n            \t\t\tValue: 0\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value", \t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: 22}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Combination",\r\n\t\t\t\tProperty: "FloatValue",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\tParameters : {Value: 0.1},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "=",\r\n            \t\t\tValue: 0\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value", \t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: 0.2}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Duration",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\t__Parameters : {Value: 0},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "=",\r\n            \t\t\tValue: 0\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value", \t\t\t\t\t\r\n\t\t\t\t\t__Parameters : {Value: 0}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_DateTime",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\t__Parameters : {Value: 0},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "=",\r\n            \t\t\tValue: 0\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value", \t\t\t\t\t\r\n\t\t\t\t\t__Parameters : {Value: 0}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_Multistate",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tOverridableParameter: "Value",\r\n\t\t\t\tParameters : {Value: 1},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "<>",\r\n            \t\t\tValue: 1\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value", \t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: 2}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels: "GMS_Virtual_BitString_64",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tParameters : {Value: "0101010101010101"},\r\n\t\t\t\tCondition: {\r\n        \t\t\t\tOperator: "<>",\r\n            \t\t\tValue: 0\r\n        \t\t\t\t}, \r\n\t\t\t\tRevertAction : {\r\n\t\t\t\t\tCommandName : "Write",\r\n\t\t\t\t\tOverridableParameter: "Value",\t\t\t\t\t\r\n\t\t\t\t\tParameters : {Value: 21845}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\tObjectModels : ["GMS_Virtual_Integer_64"], \r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tOverridableParameter: "Value", \r\n\t\t\t\tParameters : {Value: 9223372036854775807}, \r\n\t\t\t\t\r\n\t\t\t\tRevertAction: \r\n\t\t\t\t{\r\n\t\t\t\t\tCommandName: "Write", \r\n\t\t\t\t\tOverridableParameter: "Value", \r\n\t\t\t\tParameters : {Value: -9223372036854775808}, \r\n\t\t\t\t},\r\n\t\t\t\tCondition:\r\n\t\t\t\t\t{\r\n        \t\t\t\tOperator : "=",\r\n            \t\t\tValue : -9223372036854775808\r\n\t\t\t\t\t}\r\n\t\t\t}, \r\n\t\t\t\r\n\t\t\t{\r\n\t\t\t\tObjectModels : ["GMS_Virtual_Unsigned_64"], \r\n\t\t\t\tCommandName : "Write",\r\n\t\t\t\tProperty: "Value",\r\n\t\t\t\tOverridableParameter: "Value", \r\n\t\t\t\tParameters : {Value: 18446744073709551615}, \r\n\t\t\t\t\r\n\t\t\t\tRevertAction: \r\n\t\t\t\t{\r\n\t\t\t\t\tCommandName: "Write", \r\n\t\t\t\t\tOverridableParameter: "Value", \r\n\t\t\t\tParameters : {Value: 0}, \r\n\t\t\t\t},\r\n\t\t\t\tCondition:\r\n\t\t\t\t\t{\r\n        \t\t\t\tOperator : "=",\r\n            \t\t\tValue : 0\r\n\t\t\t\t\t}\r\n\t\t\t}\r\n\t\t]\r\n\t}\r\n}\r\n',
    ScaledValues: true,
    TaskNameLocalized: "All Virtuals with 64 bits #2",
    Duration: 300,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        RevertAction: null,
        ConditionValue: 0,
        ExecutionOrder: 0,
        TargetObjectModels: ["GMS_Virtual_Analog"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: null
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 1,
        TargetObjectModels: ["GMS_Virtual_Binary"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: true,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: false,
              Value: false,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: true,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: null
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 2,
        TargetObjectModels: ["GMS_Virtual_BitString"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: false,
            Value: "010101",
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: null,
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 3,
        TargetObjectModels: ["GMS_Virtual_Integer"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: -1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: -1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 4,
        TargetObjectModels: ["GMS_Virtual_String"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: "Hello",
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: "Hello",
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 5,
        TargetObjectModels: ["GMS_Virtual_Unsigned"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 22,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 22,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 6,
        TargetObjectModels: ["GMS_Virtual_Combination"],
        Property: "FloatValue",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 0.1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 0.2,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 0.1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 0.2,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 7,
        TargetObjectModels: ["GMS_Virtual_Duration"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 8,
        TargetObjectModels: ["GMS_Virtual_DateTime"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: null,
              RuntimeValue: null,
              UseOriginalValue: true,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 9,
        TargetObjectModels: ["GMS_Virtual_Multistate"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 1,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 2,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 1,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 2,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 0,
        ExecutionOrder: 10,
        TargetObjectModels: ["GMS_Virtual_BitString_64"],
        Property: "Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: false,
            Value: "0101010101010101",
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 21845,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "<>",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: null,
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 21845,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 11,
        TargetObjectModels: ["GMS_Virtual_Integer_64"],
        Property: "Value",
        ConditionValue: 0,
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 9223372036854776000,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: -9223372036854776000,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 9223372036854776000,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: -9223372036854776000,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ExecutionOrder: 12,
        TargetObjectModels: ["GMS_Virtual_Unsigned_64"],
        Property: "Value",
        CommandName: "Write",
        ConditionValue: 0,
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: 18446744073709552000,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 0,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 18446744073709552000,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 0,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      }
    ],
    HasOverridableParameters: true,
    ObjectModelsAllowed: [
      "GMS_Virtual_Analog",
      "GMS_Virtual_Binary",
      "GMS_Virtual_BitString",
      "GMS_Virtual_Integer",
      "GMS_Virtual_String",
      "GMS_Virtual_Unsigned",
      "GMS_Virtual_Combination",
      "GMS_Virtual_Duration",
      "GMS_Virtual_DateTime",
      "GMS_Virtual_Multistate",
      "GMS_Virtual_BitString_64",
      "GMS_Virtual_Integer_64",
      "GMS_Virtual_Unsigned_64"
    ],
    ObjectModelsNotAllowed: []
  };

  public static taskTestIdle: OperatorTaskInfo = {
    Id: "bbe5c67f-d37e-4685-9549-d2cb640f3f22",
    TaskName: null,
    TaskDescription: null,
    Status: 120,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized: "– Use case: duplicating task that is closed, the timer is reverted to date when it should keep the original selection\nCreate task with end timer\nstart task and close\nduplicate task - end should still be timer!!!!",
    StartedBy: "a",
    SystemId: 1,
    IsExpirationConfig: false,
    ExpirationTime: "2024-11-05T16:42:23.749Z",
    ExpirationTimeRun: "1970-01-01T00:00:00Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "1970-01-01T00:00:00Z",
    Deferred: false,
    PreviousStatus: 120,
    LastModificationTime: "1970-01-01T00:00:00Z",
    ValidationComment: "",
    TargetDpIds: {
      "System1.ApplicationView:ApplicationView.Trends": {
        FlagsValue: 2,
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "Trends",
          Description: "Trends",
          NameAssembled: "System1.ApplicationView:ApplicationView.Trends",
          DescriptionAssembled: "System1.Application View:Applications.Trends",
          ObjectType: "_GmsTrendsSystemFolder",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:ApplicationViewTrendFolder",
          NameDpIdAndAbove: "System1:ApplicationViewTrendFolder"
        }
      }
    },
    ValidRevertParameters: false,
    Removed: false,
    OperatorTaskNotesRepresentation: [],
    CnsPath: "System1.ManagementView:ManagementView.SystemSettings.Libraries.HQ.Global.Global_OperatorTasks_HQ_1.Templates.AlarmSuppression",
    TemplateNameLocalized: "Suppress Alarms",
    FileContent: "{\r\n\t\"Template\": {\r\n\t\t\"TaskActions\":\r\n\t\t[\r\n\t\t\t{\r\n\t\t\t\t\"Property\": \"SuppressAlarms\",\r\n\t\t\t\t\"CommandName\": \"EnableAll\",\r\n\t\t\t\t\"Parameters\" : {\"UIntParameter\": 0}, \r\n\t\t\t\t\"RevertAction\": \r\n\t\t\t\t{\r\n\t\t\t\t\t\"CommandName\": \"DisableAll\"\r\n\t\t\t\t}, \r\n\t\t\t\t\"Condition\": \r\n\t\t\t\t{\r\n\t\t\t\t\t\"__comment\": \"0 = Disabled; 1 = Enabled\", \r\n\t\t\t\t\t\"Operator\": \"=\",\r\n\t\t\t\t\t\"Value\": 0\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t]\r\n\t}\r\n}\r\n",
    ScaledValues: true,
    TaskNameLocalized: "PCR 2604330: Timer/duration [FT8] Operator Tasks: duplicated task with fixed task ending  #2",
    Duration: 60,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        ConditionValue: 0,
        ExecutionOrder: 0,
        TargetObjectModels: [
          "*"
        ],
        Property: "SuppressAlarms",
        CommandName: "EnableAll",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "UIntParameter",
            SetAtRuntime: false,
            Value: 0,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "DisableAll",
          CommandAlias: 0,
          Parameters: null
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: null,
        OverridableParameterRevert: null
      }
    ],
    HasOverridableParameters: false,
    ObjectModelsAllowed: [
      "*"
    ],
    ObjectModelsNotAllowed: []
  }

  public static taskTestRunning: OperatorTaskInfo = {
    Id: "bbe5c67f-d37e-4685-9549-d2cb640f3f22",
    TaskName: null,
    TaskDescription: null,
    Status: 90,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized: "– Use case: duplicating task that is closed, the timer is reverted to date when it should keep the original selection\nCreate task with end timer\nstart task and close\nduplicate task - end should still be timer!!!!",
    StartedBy: "a",
    SystemId: 1,
    IsExpirationConfig: false,
    ExpirationTime: "2024-11-05T16:42:23.749Z",
    ExpirationTimeRun: "2024-11-05T16:51:25.574Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "2024-11-05T16:50:25.156Z",
    Deferred: false,
    PreviousStatus: 120,
    LastModificationTime: "2024-11-05T16:50:25.574Z",
    ValidationComment: "",
    TargetDpIds: {
      "System1.ApplicationView:ApplicationView.Trends": {
        FlagsValue: 2,
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "Trends",
          Description: "Trends",
          NameAssembled: "System1.ApplicationView:ApplicationView.Trends",
          DescriptionAssembled: "System1.Application View:Applications.Trends",
          ObjectType: "_GmsTrendsSystemFolder",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:ApplicationViewTrendFolder",
          NameDpIdAndAbove: "System1:ApplicationViewTrendFolder"
        }
      }
    },
    ValidRevertParameters: false,
    Removed: false,
    OperatorTaskNotesRepresentation: [
      {
        Date: "2024-11-05T16:50:24Z",
        User: "Default Administrator",
        Description: "aa",
        ActionDetailsId: 20,
        ActionDetailsText: "Start task command executed."
      }
    ],
    CnsPath: "System1.ManagementView:ManagementView.SystemSettings.Libraries.HQ.Global.Global_OperatorTasks_HQ_1.Templates.AlarmSuppression",
    TemplateNameLocalized: "Suppress Alarms",
    FileContent: "{\r\n\t\"Template\": {\r\n\t\t\"TaskActions\":\r\n\t\t[\r\n\t\t\t{\r\n\t\t\t\t\"Property\": \"SuppressAlarms\",\r\n\t\t\t\t\"CommandName\": \"EnableAll\",\r\n\t\t\t\t\"Parameters\" : {\"UIntParameter\": 0}, \r\n\t\t\t\t\"RevertAction\": \r\n\t\t\t\t{\r\n\t\t\t\t\t\"CommandName\": \"DisableAll\"\r\n\t\t\t\t}, \r\n\t\t\t\t\"Condition\": \r\n\t\t\t\t{\r\n\t\t\t\t\t\"__comment\": \"0 = Disabled; 1 = Enabled\", \r\n\t\t\t\t\t\"Operator\": \"=\",\r\n\t\t\t\t\t\"Value\": 0\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t]\r\n\t}\r\n}\r\n",
    ScaledValues: true,
    TaskNameLocalized: "PCR 2604330: Timer/duration [FT8] Operator Tasks: duplicated task with fixed task ending  #2",
    Duration: 60,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        ConditionValue: 0,
        ExecutionOrder: 0,
        TargetObjectModels: [
          "*"
        ],
        Property: "SuppressAlarms",
        CommandName: "EnableAll",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "UIntParameter",
            SetAtRuntime: false,
            Value: 0,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "DisableAll",
          CommandAlias: 0,
          Parameters: null
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: null,
        OverridableParameterRevert: null
      }
    ],
    HasOverridableParameters: false,
    ObjectModelsAllowed: [
      "*"
    ],
    ObjectModelsNotAllowed: []
  }

  public static taskTestClosed: OperatorTaskInfo = {
    Id: "bbe5c67f-d37e-4685-9549-d2cb640f3f22",
    TaskName: null,
    TaskDescription: null,
    Status: 110,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized: "– Use case: duplicating task that is closed, the timer is reverted to date when it should keep the original selection\nCreate task with end timer\nstart task and close\nduplicate task - end should still be timer!!!!",
    StartedBy: "a",
    SystemId: 1,
    IsExpirationConfig: false,
    ExpirationTime: "2024-11-05T16:42:23.749Z",
    ExpirationTimeRun: "2024-11-05T16:51:25.574Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "2024-11-05T16:50:25.156Z",
    Deferred: false,
    PreviousStatus: 120,
    LastModificationTime: "2024-11-05T16:50:57.958Z",
    ValidationComment: "",
    TargetDpIds: {
      "System1.ApplicationView:ApplicationView.Trends": {
        FlagsValue: 2,
        RuntimeValue: {
          _type: 0,
          a: false
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "Trends",
          Description: "Trends",
          NameAssembled: "System1.ApplicationView:ApplicationView.Trends",
          DescriptionAssembled: "System1.Application View:Applications.Trends",
          ObjectType: "_GmsTrendsSystemFolder",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:ApplicationViewTrendFolder",
          NameDpIdAndAbove: "System1:ApplicationViewTrendFolder"
        }
      }
    },
    ValidRevertParameters: false,
    Removed: false,
    OperatorTaskNotesRepresentation: [
      {
        Date: "2024-11-05T16:50:57Z",
        User: "Default Administrator",
        Description: "aaa",
        ActionDetailsId: 21,
        ActionDetailsText: "Close task command executed."
      },
      {
        Date: "2024-11-05T16:50:24Z",
        User: "Default Administrator",
        Description: "aa",
        ActionDetailsId: 20,
        ActionDetailsText: "Start task command executed."
      }
    ],
    CnsPath: "System1.ManagementView:ManagementView.SystemSettings.Libraries.HQ.Global.Global_OperatorTasks_HQ_1.Templates.AlarmSuppression",
    TemplateNameLocalized: "Suppress Alarms",
    FileContent: "{\r\n\t\"Template\": {\r\n\t\t\"TaskActions\":\r\n\t\t[\r\n\t\t\t{\r\n\t\t\t\t\"Property\": \"SuppressAlarms\",\r\n\t\t\t\t\"CommandName\": \"EnableAll\",\r\n\t\t\t\t\"Parameters\" : {\"UIntParameter\": 0}, \r\n\t\t\t\t\"RevertAction\": \r\n\t\t\t\t{\r\n\t\t\t\t\t\"CommandName\": \"DisableAll\"\r\n\t\t\t\t}, \r\n\t\t\t\t\"Condition\": \r\n\t\t\t\t{\r\n\t\t\t\t\t\"__comment\": \"0 = Disabled; 1 = Enabled\", \r\n\t\t\t\t\t\"Operator\": \"=\",\r\n\t\t\t\t\t\"Value\": 0\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t]\r\n\t}\r\n}\r\n",
    ScaledValues: true,
    TaskNameLocalized: "PCR 2604330: Timer/duration [FT8] Operator Tasks: duplicated task with fixed task ending  #2",
    Duration: 60,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        ConditionValue: 0,
        ExecutionOrder: 0,
        TargetObjectModels: [
          "*"
        ],
        Property: "SuppressAlarms",
        CommandName: "EnableAll",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "UIntParameter",
            SetAtRuntime: false,
            Value: 0,
            RuntimeValue: null,
            UseOriginalValue: false,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "DisableAll",
          CommandAlias: 0,
          Parameters: null
        },
        ConditionOperator: "=",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: null,
        OverridableParameterRevert: null
      }
    ],
    HasOverridableParameters: false,
    ObjectModelsAllowed: [
      "*"
    ],
    ObjectModelsNotAllowed: []
  }

  public static taskWithAllTargetCasesIdle: OperatorTaskInfo = {
    Id: "8cf57411-104e-4ce6-8a66-3d0f8f7cfa7d",
    TaskName: null,
    TaskDescription: null,
    Status: 120,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized: "targets have default value, not, originalvalue",
    StartedBy: "",
    SystemId: 1,
    IsExpirationConfig: false,
    ExpirationTime: "2024-11-13T15:06:30.777Z",
    ExpirationTimeRun: "1970-01-01T00:00:00Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "1970-01-01T00:00:00Z",
    Deferred: false,
    PreviousStatus: 120,
    LastModificationTime: "1970-01-01T00:00:00Z",
    ValidationComment: "",
    TargetDpIds: {
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_1": {
        FlagsValue: 3,
        RuntimeValue: {
          _type: 458752,
          a: false,
          b: 34,
          _originalType: 458752
        },
        RuntimeValueForRevert: {
          _type: 458752,
          a: false,
          b: 4,
          _originalType: 458752
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: true,
        AlignedToDefaultValue: true,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "AO_1",
          Description: "Analog Output 1",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_1",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Analog Output 1",
          ObjectType: "GMS_BACNET_EO_BA_AO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_4194305",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_4194305"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_2": {
        FlagsValue: 2,
        RuntimeValue: {
          _type: 458752,
          a: false,
          b: 34,
          _originalType: 458752
        },
        RuntimeValueForRevert: {
          _type: 458752,
          a: false,
          b: 4,
          _originalType: 458752
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "AO_2",
          Description: "Analog Output 2",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_2",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Analog Output 2",
          ObjectType: "GMS_BACNET_EO_BA_AO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_4194306",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_4194306"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_3": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 458752,
          a: false,
          b: 24,
          _originalType: 458752
        },
        RuntimeValueForRevert: {
          _type: 458752,
          a: false,
          b: 56,
          _originalType: 458752
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "AO_3",
          Description: "Analog Output 3",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_3",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Analog Output 3",
          ObjectType: "GMS_BACNET_EO_BA_AO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_4194307",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_4194307"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_1": {
        FlagsValue: 3,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: true,
        AlignedToDefaultValue: true,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "BO_1",
          Description: "Binary Output 1",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_1",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Binary Output 1",
          ObjectType: "GMS_BACNET_EO_BA_BO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_16777217",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_16777217"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_2": {
        FlagsValue: 8,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 0,
          a: false
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "BO_2",
          Description: "Binary Output 2",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_2",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Binary Output 2",
          ObjectType: "GMS_BACNET_EO_BA_BO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_16777218",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_16777218"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_3": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 0,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 0,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 0,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "BO_3",
          Description: "Binary Output 3",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_3",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Binary Output 3",
          ObjectType: "GMS_BACNET_EO_BA_BO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_16777219",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_16777219"
        }
      }
    },
    ValidRevertParameters: false,
    Removed: false,
    OperatorTaskNotesRepresentation: [],
    CnsPath: "System1.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OtTemplates.Command_Output_With_Revert",
    TemplateNameLocalized: "Command_Output_With_Revert",
    FileContent: "",
    ScaledValues: true,
    TaskNameLocalized: "DND BACnet with default idle ",
    Duration: 108000,
    RevertActionMode: 1,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        ConditionValue: 1,
        ExecutionOrder: 0,
        TargetObjectModels: [
          "GMS_BACNET_EO_BA_MSI_1"
        ],
        Property: "Present_Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 2,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionProperty: "Current_Priority",
        ConditionOperator: ">",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 2,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 1,
        ExecutionOrder: 1,
        TargetObjectModels: [
          "GMS_BACNET_EO_BA_AO_1",
          "GMS_BACNET_EO_BA_BO_1",
          "GMS_BACNET_EO_BA_BSV_1",
          "GMS_BACNET_EO_BA_AV_1",
          "GMS_BACNET_EO_BA_BV_1",
          "GMS_BACNET_EO_BA_CHO_1",
          "GMS_BACNET_EO_BA_CV_1",
          "GMS_BACNET_EO_BA_DTV_1",
          "GMS_BACNET_EO_BA_DV_1",
          "GMS_BACNET_EO_BA_IV_1",
          "GMS_BACNET_EO_BA_LAV_1",
          "GMS_BACNET_EO_BA_LO_1",
          "GMS_BACNET_EO_BA_MSV_1",
          "GMS_BACNET_EO_BA_MSO_1",
          "GMS_BACNET_EO_BA_OSV_1",
          "GMS_BACNET_EO_BA_MSV_1",
          "GMS_BACNET_EO_BA_PIV_1",
          "GMS_BACNET_EO_BA_TPV_1",
          "GMS_BACNET_EO_BA_DPV_1",
          "GMS_BACNET_EO_BA_DTPV_1",
          "GMS_BACNET_EO_BA_TV_1",
          "GMS_APOGEE_EO_BA_AO_1",
          "GMS_APOGEE_EO_BA_BO_1",
          "GMS_APOGEE_EO_BA_AV_1",
          "GMS_APOGEE_EO_BA_BV_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_AO_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_BO_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_AV_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_BV_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_MSO_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_MSV_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AO_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BO_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AV_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BV_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSO_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSV_1",
          "GMS_APOGEE_EO_BA_MSO_1",
          "GMS_APOGEE_EO_BA_MSV_1"
        ],
        Property: "Present_Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 4,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionProperty: "Current_Priority",
        ConditionOperator: ">",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 4,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      }
    ],
    HasOverridableParameters: true,
    ObjectModelsAllowed: [
      "GMS_BACNET_EO_BA_MSI_1",
      "GMS_BACNET_EO_BA_AO_1",
      "GMS_BACNET_EO_BA_BO_1",
      "GMS_BACNET_EO_BA_BSV_1",
      "GMS_BACNET_EO_BA_AV_1",
      "GMS_BACNET_EO_BA_BV_1",
      "GMS_BACNET_EO_BA_CHO_1",
      "GMS_BACNET_EO_BA_CV_1",
      "GMS_BACNET_EO_BA_DTV_1",
      "GMS_BACNET_EO_BA_DV_1",
      "GMS_BACNET_EO_BA_IV_1",
      "GMS_BACNET_EO_BA_LAV_1",
      "GMS_BACNET_EO_BA_LO_1",
      "GMS_BACNET_EO_BA_MSV_1",
      "GMS_BACNET_EO_BA_MSO_1",
      "GMS_BACNET_EO_BA_OSV_1",
      "GMS_BACNET_EO_BA_PIV_1",
      "GMS_BACNET_EO_BA_TPV_1",
      "GMS_BACNET_EO_BA_DPV_1",
      "GMS_BACNET_EO_BA_DTPV_1",
      "GMS_BACNET_EO_BA_TV_1",
      "GMS_APOGEE_EO_BA_AO_1",
      "GMS_APOGEE_EO_BA_BO_1",
      "GMS_APOGEE_EO_BA_AV_1",
      "GMS_APOGEE_EO_BA_BV_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_AO_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_BO_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_AV_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_BV_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_MSO_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_MSV_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AO_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BO_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AV_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BV_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSO_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSV_1",
      "GMS_APOGEE_EO_BA_MSO_1",
      "GMS_APOGEE_EO_BA_MSV_1"
    ],
    ObjectModelsNotAllowed: []
  }

  // Target Use Cases: DefaultValue, OriginalValueForRevert, NotDefaultValue
  public static taskWithAllTargetCasesClosed: OperatorTaskInfo = {
    Id: "3cc67eb6-8d4c-4b39-bef0-213bc0de738f",
    TaskName: null,
    TaskDescription: null,
    Status: 110,
    CreatedBy: "Default Administrator",
    TaskDescriptionLocalized: "targets have default value, not, originalvalue",
    StartedBy: "a",
    SystemId: 1,
    IsExpirationConfig: false,
    ExpirationTime: "2024-11-13T15:19:17.688Z",
    ExpirationTimeRun: "2024-11-14T21:20:20.548Z",
    DeferDuration: 0,
    DeferTime: "1970-01-01T00:00:00Z",
    DeferTimeRun: "2024-11-13T15:20:18.783Z",
    Deferred: false,
    PreviousStatus: 100,
    LastModificationTime: "2024-11-13T15:20:54.894Z",
    ValidationComment: "",
    TargetDpIds: {
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_1": {
        FlagsValue: 3,
        RuntimeValue: {
          _type: 458752,
          a: false,
          b: 34,
          _originalType: 458752
        },
        RuntimeValueForRevert: {
          _type: 458752,
          a: false,
          b: 4,
          _originalType: 458752
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: true,
        AlignedToDefaultValue: true,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "AO_1",
          Description: "Analog Output 1",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_1",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Analog Output 1",
          ObjectType: "GMS_BACNET_EO_BA_AO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_4194305",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_4194305"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_2": {
        FlagsValue: 2,
        RuntimeValue: {
          _type: 458752,
          a: false,
          b: 34,
          _originalType: 458752
        },
        RuntimeValueForRevert: {
          _type: 458752,
          a: false,
          b: 4,
          _originalType: 458752
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: true,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "AO_2",
          Description: "Analog Output 2",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_2",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Analog Output 2",
          ObjectType: "GMS_BACNET_EO_BA_AO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_4194306",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_4194306"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_3": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 458752,
          a: false,
          b: 24,
          _originalType: 458752
        },
        RuntimeValueForRevert: {
          _type: 458752,
          a: false,
          b: 56,
          _originalType: 458752
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "AO_3",
          Description: "Analog Output 3",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.AO_3",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Analog Output 3",
          ObjectType: "GMS_BACNET_EO_BA_AO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_4194307",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_4194307"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_1": {
        FlagsValue: 3,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: true,
        AlignedToDefaultValue: true,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "BO_1",
          Description: "Binary Output 1",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_1",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Binary Output 1",
          ObjectType: "GMS_BACNET_EO_BA_BO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_16777217",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_16777217"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_2": {
        FlagsValue: 8,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 1,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 0,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: true,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "BO_2",
          Description: "Binary Output 2",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_2",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Binary Output 2",
          ObjectType: "GMS_BACNET_EO_BA_BO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_16777218",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_16777218"
        }
      },
      "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_3": {
        FlagsValue: 0,
        RuntimeValue: {
          _type: 393216,
          a: false,
          b: 0,
          _originalType: 393216
        },
        RuntimeValueForRevert: {
          _type: 393216,
          a: false,
          b: 0,
          _originalType: 393216
        },
        RevertParamValueType: 0,
        UseOriginalValueForRevert: false,
        IsDefaultValue: false,
        AlignedToDefaultValue: false,
        Status: 1,
        ErrorsDetails: [],
        RevertActionStatus: 0,
        RevertActionErrorsDetails: [],
        ConditionVerified: 0,
        TargetNode: {
          Order: 0,
          Name: "BO_3",
          Description: "Binary Output 3",
          NameAssembled: "System1.ManagementView:ManagementView.FieldNetworks.D1.Hardware.triple.Local_IO.BO_3",
          DescriptionAssembled: "System1.Management View:Project.Field Networks.D1.Hardware.Simulator Device 898.Local_IO.Binary Output 3",
          ObjectType: "GMS_BACNET_EO_BA_BO_1",
          SystemNumber: 1,
          NameSystemNumber: "System1",
          DpIdName: "System1:GmsDevice_1_898_16777219",
          NameDpIdAndAbove: "System1:GmsDevice_1_898_16777219"
        }
      }
    },
    ValidRevertParameters: true,
    Removed: false,
    OperatorTaskNotesRepresentation: [
      {
        Date: "2024-11-13T15:20:54.824Z",
        User: "Default Administrator",
        Description: "aa",
        ActionDetailsId: 21,
        ActionDetailsText: "Close task command executed."
      },
      {
        Date: "2024-11-13T15:20:17.344Z",
        User: "Default Administrator",
        Description: "a",
        ActionDetailsId: 20,
        ActionDetailsText: "Start task command executed."
      },
      {
        Date: "2024-11-13T15:19:44.978Z",
        User: "Default Administrator",
        Description: "started dup",
        ActionDetailsId: 20,
        ActionDetailsText: "Start task command executed."
      }
    ],
    CnsPath: "System1.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OtTemplates.Command_Output_With_Revert",
    TemplateNameLocalized: "Command_Output_With_Revert",
    FileContent: "",
    ScaledValues: true,
    TaskNameLocalized: "DND BACnet with default idle  #1",
    Duration: 108000,
    RevertActionMode: 1000,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    TaskActions: [
      {
        ConditionValue: 1,
        ExecutionOrder: 0,
        TargetObjectModels: [
          "GMS_BACNET_EO_BA_MSI_1"
        ],
        Property: "Present_Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 2,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionProperty: "Current_Priority",
        ConditionOperator: ">",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 2,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      },
      {
        ConditionValue: 1,
        ExecutionOrder: 1,
        TargetObjectModels: [
          "GMS_BACNET_EO_BA_AO_1",
          "GMS_BACNET_EO_BA_BO_1",
          "GMS_BACNET_EO_BA_BSV_1",
          "GMS_BACNET_EO_BA_AV_1",
          "GMS_BACNET_EO_BA_BV_1",
          "GMS_BACNET_EO_BA_CHO_1",
          "GMS_BACNET_EO_BA_CV_1",
          "GMS_BACNET_EO_BA_DTV_1",
          "GMS_BACNET_EO_BA_DV_1",
          "GMS_BACNET_EO_BA_IV_1",
          "GMS_BACNET_EO_BA_LAV_1",
          "GMS_BACNET_EO_BA_LO_1",
          "GMS_BACNET_EO_BA_MSV_1",
          "GMS_BACNET_EO_BA_MSO_1",
          "GMS_BACNET_EO_BA_OSV_1",
          "GMS_BACNET_EO_BA_MSV_1",
          "GMS_BACNET_EO_BA_PIV_1",
          "GMS_BACNET_EO_BA_TPV_1",
          "GMS_BACNET_EO_BA_DPV_1",
          "GMS_BACNET_EO_BA_DTPV_1",
          "GMS_BACNET_EO_BA_TV_1",
          "GMS_APOGEE_EO_BA_AO_1",
          "GMS_APOGEE_EO_BA_BO_1",
          "GMS_APOGEE_EO_BA_AV_1",
          "GMS_APOGEE_EO_BA_BV_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_AO_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_BO_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_AV_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_BV_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_MSO_1",
          "GMS_APOGEE_EO_BA_FLN_DEV_MSV_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AO_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BO_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AV_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BV_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSO_1",
          "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSV_1",
          "GMS_APOGEE_EO_BA_MSO_1",
          "GMS_APOGEE_EO_BA_MSV_1"
        ],
        Property: "Present_Value",
        CommandName: "Write",
        CommandAlias: 0,
        Parameters: [
          {
            Name: "Value",
            SetAtRuntime: true,
            Value: null,
            RuntimeValue: null,
            UseOriginalValue: true,
            IsImplicitCns: false
          }
        ],
        RevertAction: {
          Property: null,
          CommandName: "Write",
          CommandAlias: 0,
          Parameters: [
            {
              Name: "Value",
              SetAtRuntime: true,
              Value: 4,
              RuntimeValue: null,
              UseOriginalValue: false,
              IsImplicitCns: false
            }
          ]
        },
        ConditionProperty: "Current_Priority",
        ConditionOperator: ">",
        ConditionIndex: -1,
        ConditionMaxAge: -1,
        OverridableParameterAction: {
          Name: "Value",
          SetAtRuntime: true,
          Value: null,
          RuntimeValue: null,
          UseOriginalValue: true,
          IsImplicitCns: false
        },
        OverridableParameterRevert: {
          Name: "Value",
          SetAtRuntime: true,
          Value: 4,
          RuntimeValue: null,
          UseOriginalValue: false,
          IsImplicitCns: false
        }
      }
    ],
    HasOverridableParameters: true,
    ObjectModelsAllowed: [
      "GMS_BACNET_EO_BA_MSI_1",
      "GMS_BACNET_EO_BA_AO_1",
      "GMS_BACNET_EO_BA_BO_1",
      "GMS_BACNET_EO_BA_BSV_1",
      "GMS_BACNET_EO_BA_AV_1",
      "GMS_BACNET_EO_BA_BV_1",
      "GMS_BACNET_EO_BA_CHO_1",
      "GMS_BACNET_EO_BA_CV_1",
      "GMS_BACNET_EO_BA_DTV_1",
      "GMS_BACNET_EO_BA_DV_1",
      "GMS_BACNET_EO_BA_IV_1",
      "GMS_BACNET_EO_BA_LAV_1",
      "GMS_BACNET_EO_BA_LO_1",
      "GMS_BACNET_EO_BA_MSV_1",
      "GMS_BACNET_EO_BA_MSO_1",
      "GMS_BACNET_EO_BA_OSV_1",
      "GMS_BACNET_EO_BA_PIV_1",
      "GMS_BACNET_EO_BA_TPV_1",
      "GMS_BACNET_EO_BA_DPV_1",
      "GMS_BACNET_EO_BA_DTPV_1",
      "GMS_BACNET_EO_BA_TV_1",
      "GMS_APOGEE_EO_BA_AO_1",
      "GMS_APOGEE_EO_BA_BO_1",
      "GMS_APOGEE_EO_BA_AV_1",
      "GMS_APOGEE_EO_BA_BV_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_AO_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_BO_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_AV_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_BV_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_MSO_1",
      "GMS_APOGEE_EO_BA_FLN_DEV_MSV_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AO_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BO_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_AV_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_BV_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSO_1",
      "GMS_APOGEE_EO_BA_FLN_UEC_DEV_MSV_1",
      "GMS_APOGEE_EO_BA_MSO_1",
      "GMS_APOGEE_EO_BA_MSV_1"
    ],
    ObjectModelsNotAllowed: []
  }

}