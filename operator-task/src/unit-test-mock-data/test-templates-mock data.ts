/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */

import { OperatorTaskTemplatesResponse } from '@gms-flex/services';

export class TemplateMockData {

  // No overridable Parameters
  public static suppresAlarm: OperatorTaskTemplatesResponse = {
    CnsPath:
      "System100.ManagementView:ManagementView.SystemSettings.Libraries.HQ.Global.Global_OperatorTasks_HQ_1.Templates.AlarmSuppression",
    Node: "System100.ManagementView:ManagementView.SystemSettings.Libraries.HQ.Global.Global_OperatorTasks_HQ_1.Templates.AlarmSuppression",
    TemplateName: "Suppress Alarms",
    TemplateNameLocalized: "Suppress Alarms",
    FileContent:
      '{\r\n\t"Template": {\r\n\t\t"TaskActions":\r\n\t\t[\r\n\t\t\t{\r\n\t\t\t\t"Property": "SuppressAlarms",\r\n\t\t\t\t"CommandName": "EnableAll",\r\n\t\t\t\t"Parameters" : {"UIntParameter": 0}, \r\n\t\t\t\t"RevertAction": \r\n\t\t\t\t{\r\n\t\t\t\t\t"CommandName": "DisableAll"\r\n\t\t\t\t}, \r\n\t\t\t\t"Condition": \r\n\t\t\t\t{\r\n\t\t\t\t\t"__comment": "0 = Disabled; 1 = Enabled", \r\n\t\t\t\t\t"Operator": "=",\r\n\t\t\t\t\t"Value": 0\r\n\t\t\t\t}\r\n\t\t\t}\r\n\t\t]\r\n\t}\r\n}\r\n',
    ScaledValues: true,
    TaskName: "Suppress Alarms",
    TaskNameLocalized: "Suppress Alarms",
    TaskDescription: "Suppress Alarms",
    TaskDescriptionLocalized: "Suppress Alarms",
    Duration: 0,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    HasOverridableParameters: false,
    TaskActions: [
      {
        ConditionValue: 0,
        ExecutionOrder: 0,
        TargetObjectModels: ["*"],
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
    ObjectModelsAllowed: ["*"],
    ObjectModelsNotAllowed: []
  };

  // With overridable parameters
  public static allVirtualTypes: OperatorTaskTemplatesResponse = {
    CnsPath:
      "System100.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OpTemplates.AllVirtuals",
    Node: "System100.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OpTemplates.AllVirtuals",
    TemplateName: "00 All Virtuals",
    TemplateNameLocalized: "00 All Virtuals",
    FileContent:
      '{\r\n\t"Template": {\r\n\t\t"Duration" : "00:00:01",\r\n\t\t"NotesRequired": "Yes",\r\n\t\t"TaskActions" : [\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Analog",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"_Parameters" : {"Value": 1.1},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "<>",\r\n            \t\t\t"Value": 0.0\r\n        \t\t\t\t}, \r\n\t\t\t\t"_RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value",\t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": 2.2}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Binary",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"Parameters" : {"Value": true},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "<>",\r\n            \t\t\t"Value": true\r\n        \t\t\t\t},\r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"_OverridableParameter": "Value",\t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": false}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_BitString",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"Parameters" : {"Value": "010101"},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "<>",\r\n            \t\t\t"Value": 0\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value",\t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": null}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Integer",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"Parameters" : {"Value": -1},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "=",\r\n            \t\t\t"Value": 10.00\r\n        \t\t\t\t},\r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value", \t\t\t\t\t\r\n\t\t\t\t\t"__Parameters" : {"Value": -22}\r\n\t\t\t\t}\t\t\t\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_String",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"__Parameters" : {"Value": "Bye"},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "=",\r\n            \t\t\t"Value": "Bye"\r\n        \t\t\t\t},\r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t\t"CommandName" : "Write",\t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": "Hello"}\r\n\t\t\t\t}\t\t\t\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Unsigned",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"Parameters" : {"Value": 1},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "<>",\r\n            \t\t\t"Value": 0\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value", \t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": 22}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Combination",\r\n\t\t\t\t"Property": "FloatValue",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"Parameters" : {"Value": 0.1},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "=",\r\n            \t\t\t"Value": 0\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value", \t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": 0.2}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Duration",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"__Parameters" : {"Value": 0},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "=",\r\n            \t\t\t"Value": 0\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value", \t\t\t\t\t\r\n\t\t\t\t\t"__Parameters" : {"Value": 0}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_DateTime",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"__Parameters" : {"Value": 0},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "=",\r\n            \t\t\t"Value": 0\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value", \t\t\t\t\t\r\n\t\t\t\t\t"__Parameters" : {"Value": 0}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_Multistate",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"OverridableParameter": "Value",\r\n\t\t\t\t"Parameters" : {"Value": 1},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "<>",\r\n            \t\t\t"Value": 1\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value", \t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": 2}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels": "GMS_Virtual_BitString_64",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"Parameters" : {"Value": "0101010101010101"},\r\n\t\t\t\t"Condition": {\r\n        \t\t\t\t"Operator": "<>",\r\n            \t\t\t"Value": 0\r\n        \t\t\t\t}, \r\n\t\t\t\t"RevertAction" : {\r\n\t\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t\t"OverridableParameter": "Value",\t\t\t\t\t\r\n\t\t\t\t\t"Parameters" : {"Value": 21845}\r\n\t\t\t\t}\r\n\t\t\t},\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels" : ["GMS_Virtual_Integer_64"], \r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"OverridableParameter": "Value", \r\n\t\t\t\t"Parameters" : {"Value": 9223372036854775807}, \r\n\t\t\t\t\r\n\t\t\t\t"RevertAction": \r\n\t\t\t\t{\r\n\t\t\t\t\t"CommandName": "Write", \r\n\t\t\t\t\t"OverridableParameter": "Value", \r\n\t\t\t\t"Parameters" : {"Value": -9223372036854775808}, \r\n\t\t\t\t},\r\n\t\t\t\t"Condition":\r\n\t\t\t\t\t{\r\n        \t\t\t\t"Operator" : "=",\r\n            \t\t\t"Value" : -9223372036854775808\r\n\t\t\t\t\t}\r\n\t\t\t}, \r\n\t\t\t\r\n\t\t\t{\r\n\t\t\t\t"ObjectModels" : ["GMS_Virtual_Unsigned_64"], \r\n\t\t\t\t"CommandName" : "Write",\r\n\t\t\t\t"Property": "Value",\r\n\t\t\t\t"OverridableParameter": "Value", \r\n\t\t\t\t"Parameters" : {"Value": 18446744073709551615}, \r\n\t\t\t\t\r\n\t\t\t\t"RevertAction": \r\n\t\t\t\t{\r\n\t\t\t\t\t"CommandName": "Write", \r\n\t\t\t\t\t"OverridableParameter": "Value", \r\n\t\t\t\t"Parameters" : {"Value": 0}, \r\n\t\t\t\t},\r\n\t\t\t\t"Condition":\r\n\t\t\t\t\t{\r\n        \t\t\t\t"Operator" : "=",\r\n            \t\t\t"Value" : 0\r\n\t\t\t\t\t}\r\n\t\t\t}\r\n\t\t]\r\n\t}\r\n}\r\n',
    ScaledValues: true,
    TaskName: "All Virtuals with 64 bits",
    TaskNameLocalized: "All Virtuals with 64 bits",
    TaskDescription: "Andreas template with added virtual objects for 64 bits",
    TaskDescriptionLocalized:
      "Andreas template with added virtual objects for 64 bits",
    Duration: 60,
    RevertActionMode: 0,
    TimeoutForConditions: 30,
    NotesRequired: 1,
    HasOverridableParameters: true,
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
}