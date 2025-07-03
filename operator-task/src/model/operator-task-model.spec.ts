import { OperatorTaskStatus } from '@gms-flex/services';
import { TranslateService } from '@ngx-translate/core';

import { OperatorTaskTranslations } from '../shared/operator-task-translations';
import { Utility } from '../shared/utility';
import { DateOption } from '../types/operator-task-date-options';
import { OperatorTaskStatuses } from '../types/operator-task-status';
import { OperatorTaskTargetCommandStatus } from '../types/operator-task-target-command-status';
import { TaskMockData } from '../unit-test-mock-data/test-task-mock-data';
import { TestTaskStatusTranslated } from '../unit-test-mock-data/test-task-status-translated';
import { OperatorTaskModel } from './operator-task-model';

let mockTraceService: any;
let mockDataService: any;

let translateServiceSpy: jasmine.SpyObj<TranslateService>;
const translations: OperatorTaskTranslations = new OperatorTaskTranslations(translateServiceSpy);

describe('OperatorTaskModel', () => {
  mockTraceService = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  mockDataService = jasmine.createSpyObj('OperatorTaskSnapinDataService', ['translations']);
  translations.startImmediateTitle = 'Immediately at task start';
  translations.startAtTitle = 'At';
  translations.startInTitle = 'In';

  mockDataService.translations = translations;

  beforeEach(() => {
    Utility.formatLang = 'en';
  });

  afterEach(() => {
    Utility.formatLang = 'en';
  });

  describe('initialization', () => {
    it('should not initialize translation properties if translations are undefined', () => {
      const definedTrans = mockDataService.translations;
      mockDataService.translations = undefined;
      const ot = new OperatorTaskModel(mockTraceService, mockDataService);
      expect(ot.startImmediate).toEqual('');
      expect(ot.startAt).toEqual('');
      expect(ot.startIn).toEqual('');
      mockDataService.translations = definedTrans;
    });

    it('should properly initialize properties when translations are provided', () => {
      const ot = new OperatorTaskModel(mockTraceService, mockDataService);
      expect(ot.startImmediate).toEqual('Immediately at task start');
      expect(ot.startAt).toEqual('At');
      expect(ot.startIn).toEqual('In');
    });

  });

  describe('Non-status specific Task properties', () => {
    const ot = new OperatorTaskModel(mockTraceService, mockDataService);
    ot.createModelFromWSI(TaskMockData.allVirtualTypes_idle);

    it('task should be defined', () => {
      expect(ot).toBeDefined();
    });

    it('wsiOperatorTaskInfo', () => {
      expect(ot.wsiOperatorTaskInfo).toBeDefined();
    });

    it('cnsPath', () => {
      expect(ot.cnsPath).toBe(ot.wsiOperatorTaskInfo.CnsPath);
    });

    it('should have a valid guid format for Id', () => {
      expect(ot.id).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    });

    it('TaskDescription', () => {
      expect(ot.taskDescription).toBe("Template with added virtual objects for 64 bits");
    });

    it('TaskDescriptionLocalized', () => {
      expect(ot.taskDescriptionLocalized).toBe("Template with added virtual objects for 64 bits");
    });

    it('createdBy', () => {
      expect(ot.createdBy).toBe('Default Administrator');
    });

    it('SystemId', () => {
      expect(ot.systemId).toBe(99);
    });

    it('ValidationComment', () => {
      expect(ot.validationComment).toBe("");
    });

    it('DeferDuration', () => {
      expect(ot.deferDuration).toBe(0);
    });

    it('StartDateType - Duration', () => {
      ot.startDateType = DateOption.Duration;
      expect(ot.startDateDisplay).toBe((`In `));
    });

    // it('DeferTimeRun', () => {
    //   expect(ot.deferTimeRun).toBe("12/31/1969, 6:00:00 PM");
    // });

    it('Deferred should be a boolean', () => {
      expect(ot.deferred).toBeFalse();
    });

    it('PreviousStatus should be an integer', () => {
      expect(ot.previousStatus).toBe(120);
    });

    // it('LastModificationTime should be in the correct ISO format', () => {
    //   expect(ot.lastModificationTime).toBe("12/31/1969, 6:00:00 PM");
    // });

  });

  describe('StartDate', () => {
    const ot = new OperatorTaskModel(mockTraceService, mockDataService);
    ot.createModelFromWSI(TaskMockData.allVirtualTypes_idle);
    it('StartDateType - Immediate', () => {
      ot.startDateType = DateOption.Immediate;
      expect(ot.startDateDisplay).toBe("Immediately at task start");
    });

    it('StartDateType - DateTime - string', () => {
      ot.deferTime = new Date().toLocaleString();
      const expected = ot.parseDateTimeForDisplay(ot.deferTime);
      ot.startDateType = DateOption.DateTime;
      expect(ot.startDateDisplay).toBe(`At ${expected}`);
    });
  });

  describe('Status:Closed', () => {
    const ot = new OperatorTaskModel(mockTraceService, mockDataService);
    ot.createModelFromWSI(TaskMockData.allVirtualTypes_closed);

    Utility.taskStatusTranslated = new Map<number, OperatorTaskStatus>();
    TestTaskStatusTranslated.statuses.forEach(val => {
      Utility.taskStatusTranslated.set(val.Id, val);
    });
    it('statusAndTimeValue empty string', () => {
      const statuses = [
        OperatorTaskStatuses.CheckingPreconditions,
        OperatorTaskStatuses.ExecutingCommands,
        OperatorTaskStatuses.ExecutingCommands,
        OperatorTaskStatuses.RevertingCommands,
        OperatorTaskStatuses.Aborting
      ];
      statuses.forEach(status => {
        ot.status = status;
        ot.statusAndTimeValue = ''
        expect(ot.statusAndTimeValue).toBe("");
      })
    });

    it('statusAndTimeValue WaitingForConditions', () => {
      ot.status = OperatorTaskStatuses.WaitingForConditions;
      ot.statusAndTimeValue = ''
      expect(ot.statusAndTimeValue).toBe(": 5/22/2024 - 3:08 PM");

    });
  });

  describe('Status: Idle specific properties', () => {
    const ot = new OperatorTaskModel(mockTraceService, mockDataService);
    ot.createModelFromWSI(TaskMockData.allVirtualTypes_idle);

    // Idle task specific properties
    it('statusAndTimeValue', () => {
      expect(ot.statusAndTimeValue).toEqual('');
    });

    it('Status', () => {
      expect(ot.status).toBe(120);
    });

    it('StartedBy', () => {
      expect(ot.startedBy).toEqual('');
    });

    it('IsExpirationConfig should be a boolean', () => {
      expect(ot.isExpirationConfig).toBeFalse();
    });

    // it('ExpirationTime', () => {
    //   expect(ot.expirationTime).toBe("5/24/2024, 1:25:21 PM");
    // });
  });

  describe('Data Object Property Defined Tests', () => {
    const ot = new OperatorTaskModel(mockTraceService, mockDataService);
    ot.createModelFromWSI(TaskMockData.allVirtualTypes_idle);
    const definedKeys = [
      "_endDateType ",
      "_startDateType ",
      "_status ",
      "_statusAndTimeValue",
      "_statusUpdateDateTime ",
      "atString ",
      "cnsPath ",
      "createdBy ",
      "deferDuration ",
      "deferred ",
      "deferTime ",
      "deferTimeRun ",
      "duration ",
      "emptyString ",
      "endDateDisplay ",
      "expirationTime ",
      "expirationTimeRun ",
      "fileContent ",
      "hasOverridableParameters ",
      "id ",
      "isExpirationConfig ",
      "isNew ",
      "lastModificationTime ",
      "minDateTick ",
      "modTrace ",
      "notesRequired ",
      "previousStatus ",
      "removed ",
      "revertActionMode ",
      "scaledValues ",
      "startAt ",
      "startDateDisplay ",
      "startedBy ",
      "startImmediate ",
      "startIn ",
      "systemId ",
      "targetsDeleted ",
      "targetsInitialized ",
      "taskDescription ",
      "taskDescriptionLocalized ",
      "taskIsChanged ",
      "taskNameLocalized ",
      "templateNameLocalized ",
      "timeoutForConditions ",
      "untilString ",
      "validationComment ",
      "validRevertParameters "
    ]

    const expectedValues = {
      _endDateType: 2,
      _startDateType: 0,
      _status: 120,
      _statusAndTimeValue: "",
      _statusUpdateDateTime: undefined,
      atString: "at",
      cnsPath: "System100.ManagementView:ManagementView.SystemSettings.Libraries.Project.Common.Common_Data_Project_1.OpTemplates.AllVirtuals",
      createdBy: "Default Administrator",
      deferDuration: 0,
      deferred: false,
      deferTime: "12/31/1969, 6:00:00 PM",
      deferTimeRun: "12/31/1969, 6:00:00 PM",
      duration: 300,
      emptyString: "",
      endDateDisplay: "In 5m",
      expirationTime: "5/24/2024, 1:25:21 PM",
      expirationTimeRun: "12/31/1969, 6:00:00 PM",
      fileContent: "",
      hasOverridableParameters: true,
      id: "4b474a98-07b4-4507-a69a-00ed0fc2d87d",
      isExpirationConfig: false,
      isNew: false,
      lastModificationTime: "12/31/1969, 6:00:00 PM",
      minDateTick: 0,
      modTrace: "GmsSnapins_OperatorTaskModel",
      notesRequired: 1,
      previousStatus: 120,
      removed: false,
      revertActionMode: 0,
      scaledValues: true,
      startAt: "At",
      startDateDisplay: "Immediately at task start",
      startedBy: "",
      startImmediate: "Immediately at task start",
      startIn: "In",
      systemId: 99,
      targetsDeleted: false,
      targetsInitialized: false,
      taskDescription: "Template with added virtual objects for 64 bits",
      taskDescriptionLocalized: "Template with added virtual objects for 64 bits",
      taskIsChanged: false,
      taskNameLocalized: "All Virtuals with 64 bits #7",
      templateNameLocalized: "00 All Virtuals",
      timeoutForConditions: 30,
      untilString: "until",
      validationComment: "",
      validRevertParameters: false
    }

    for (const key of definedKeys) {
      it(`should have the property '${key}' with the correct value`, () => {
        expect(ot[key]).toBe(expectedValues[key]);
      });
    }
  });

  describe('Duplicate task: start and end', () => {
    const idle = new OperatorTaskModel(mockTraceService, mockDataService);
    idle.createModelFromWSI(TaskMockData.taskTestIdle);

    const closed = new OperatorTaskModel(mockTraceService, mockDataService);
    closed.createModelFromWSI(TaskMockData.taskTestClosed);

    const endDuration = new OperatorTaskModel(mockTraceService, mockDataService);
    endDuration.duplicateModel(closed, 'testName', "testDup", 1, closed.targetDpIds);

    // Date:End test
    it('should retain End:Duration', () => {
      expect(endDuration.isExpirationConfig).toEqual(idle.isExpirationConfig);
      expect(endDuration.endDateType).toEqual(DateOption.Duration);
    });

    const endDate = new OperatorTaskModel(mockTraceService, mockDataService);
    endDate.createModelFromWSI(TaskMockData.taskTestClosed);
    endDate.wsiOperatorTaskInfo.IsExpirationConfig = true;
    endDate.wsiOperatorTaskInfo.ExpirationTime = Utility.encodeDateTimeFromString(new Date().toString());

    const taskDateDup = new OperatorTaskModel(mockTraceService, mockDataService);
    taskDateDup.duplicateModel(endDate, 'testName', "testDup", 1, endDate.targetDpIds);
    it('should retain End:Date when task was idle', () => {
      expect(endDate.endDateType).toEqual(DateOption.DateTime);
    });

    // Date:Start test
    idle.deferDuration = 60;
    idle.startDateType = DateOption.Duration;
    const idleStartDuration = new OperatorTaskModel(mockTraceService, mockDataService);
    idleStartDuration.duplicateModel(idle, 'testName', "testDup", 1, idle.targetDpIds)
    it('should revert Start:Duration to Immediate', () => {
      expect(idleStartDuration.startDateType).toEqual(DateOption.Immediate);
    });

    closed.deferTime = new Date().toString();
    closed.startDateType = DateOption.DateTime;
    const closedDate = new OperatorTaskModel(mockTraceService, mockDataService);
    closedDate.duplicateModel(closed, 'testName', "closeDuplidated", 1, closed.targetDpIds)
    it('should revert Start:Date to Immediate', () => {
      expect(closedDate.startDateType).toEqual(DateOption.Immediate);
    });

    it('should default to immediate for start', () => {
      expect(closedDate.startDateType).toEqual(DateOption.Immediate);
    });
  });

  describe('Duplicate task targets', () => {
    // duplicate
    const closed = new OperatorTaskModel(mockTraceService, mockDataService);
    closed.createModelFromWSI(TaskMockData.taskWithAllTargetCasesClosed);
    // manually call this since this is called after api calls
    closed.initializeTargets(false);

    const newTask = new OperatorTaskModel(mockTraceService, mockDataService);
    newTask.duplicateModel(closed, 'newUser', 'duplicatedClosedTask', 1, closed.targetDpIds);

    it('should duplicate the targets', () => {
      expect(closed.targetDpIds.length).toEqual(newTask.targetDpIds.length);
    });

    for (let i = 0; i < closed.targetDpIds.length; i++) {
      const expected = closed.targetDpIds[i];
      const actual = newTask.targetDpIds[i];

      it('should reset the status', () => {
        expect(actual.targetStatus).toEqual(OperatorTaskTargetCommandStatus.Unknown);
        expect(actual.revertActionStatus).toEqual(OperatorTaskTargetCommandStatus.Unknown);
      });

      it('should clone alignedToDefaultValue', () => {
        expect(actual.alignedToDefaultValue).toEqual(expected.alignedToDefaultValue);
      });

      it('should clone isDefaultValue', () => {
        expect(actual.isDefaultValue).toEqual(expected.isDefaultValue);
      });

      it('should clone useOriginalValueForRevert', () => {
        expect(actual.useOriginalValueForRevert).toEqual(expected.useOriginalValueForRevert);
      });

      it('should clone runtimeValue', () => {
        expect(actual.runtimeValue.a).toEqual(expected.runtimeValue.a);
        expect(actual.runtimeValue.b).toEqual(expected.runtimeValue.b);
        expect(actual.runtimeValue._type).toEqual(expected.runtimeValue._type);
        expect(actual.runtimeValue._originalType).toEqual(expected.runtimeValue._originalType);
      });

      it('should clone runtimeValueForRevert', () => {
        if (actual.useOriginalValueForRevert) {
          expect(actual.runtimeValueForRevert).toEqual(expected.runtimeValueForRevert);
          expect(actual.runtimeValueForRevert).toEqual(null);
        } else {
          expect(actual.runtimeValueForRevert.a).toEqual(expected.runtimeValueForRevert.a);
          expect(actual.runtimeValueForRevert.b).toEqual(expected.runtimeValueForRevert.b);
          expect(actual.runtimeValueForRevert._type).toEqual(expected.runtimeValueForRevert._type);
          expect(actual.runtimeValueForRevert._originalType).toEqual(expected.runtimeValueForRevert._originalType);
        }
      });

      it('should clone bo', () => {
        expect(actual.bo).toEqual(expected.bo);
      });

    }

  });

});