import { waitForAsync } from '@angular/core/testing';
import { IRuntimeValue } from '@gms-flex/services';

import { OperatorTaskStatuses } from '../types/operator-task-status';
import { eGmsDataType } from '../types/overridable-parameter-types';
import { VariantType } from '../types/variant-type';
import { Utility } from './utility';

const BIT64_RUNTIME: IRuntimeValue = {
  _type: 524288,
  a: false,
  b: "18446744073709551615",
  _originalType: 4980736
}

describe('Utility', () => {

  beforeEach(waitForAsync(() => {
  }));

  describe('createGuid', () => {
    it('is defined', () => {
      const actual = Utility.createGuid();
      expect(actual).toBeDefined();
    });

    it('is in GUID format', () => {
      const actual = Utility.createGuid();
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const result = regex.test(actual);
      expect(result).toEqual(true);
    });
  });

  describe('decodeDateTimeToString', () => {
    let originalLang: string;

    beforeEach(() => {
      originalLang = Utility.formatLang;
    });

    afterEach(() => {
      Utility.formatLang = originalLang;
    });

    it('is formatted to German', () => {
      Utility.formatLang = 'de';
      const actual = Utility.decodeDateTimeToString('2018-09-12T19:49:06.000Z');
      expect(actual).toEqual('12.9.2018, 14:49:06');
    });

    it('is formatted to English', () => {
      Utility.formatLang = 'en';
      const actual = Utility.decodeDateTimeToString('2018-09-12T19:49:06.000Z');
      expect(actual).toEqual('9/12/2018, 2:49:06 PM');
    });

    it('is empty', () => {
      Utility.formatLang = 'en';
      const actual = Utility.decodeDateTimeToString(undefined);
      expect(actual).toEqual('');
    });
  });

  describe('createRuntimeVariant', () => {
    const result: IRuntimeValue = { _type: 0, a: false, b: undefined };
    it('should create IRunTime object for PvssBit64 max value', () => {
      const actual = Utility.createRuntimeVariant(eGmsDataType.PvssBit64, Utility.UINT64MAX);
      expect(actual).toEqual(BIT64_RUNTIME);

    });

    it('should create IRunTime object for PvssUint64 max value', () => {
      const actual = Utility.createRuntimeVariant(eGmsDataType.PvssUint64, Utility.UINT64MAX);
      expect(actual).toEqual(
        {
          _type: 524288,
          a: false,
          b: "18446744073709551615",
          _originalType: 4784128
        });

    });

    it('should create IRunTime object for PvssInt64 max value', () => {
      const actual = Utility.createRuntimeVariant(eGmsDataType.PvssInt64, Utility.INT64MAX);
      expect(actual).toEqual(
        {
          _type: 524288,
          a: false,
          b: "9223372036854775807",
          _originalType: 4587520
        });
    });

    it('should return uninitialized runtime', () => {
      const types = [
        eGmsDataType.PvssDpId,
        eGmsDataType.PvssLangText,
        eGmsDataType.GmsAny,
        eGmsDataType.None,
        eGmsDataType.PvssBlob,
        eGmsDataType.GmsApplSpecific
      ];
      types.forEach(t => {
        expect(Utility.createRuntimeVariant(t, undefined)).toEqual(result);
      }
      );
    });

    it('should create PvssFloat/GmsReal', () => {
      const types = [
        eGmsDataType.PvssFloat,
        eGmsDataType.GmsReal
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, 123.456)
        const expected: IRuntimeValue = { _type: VariantType.Double, a: false, b: 123.456 };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create PvssFloat/GmsReal', () => {
      const types = [
        eGmsDataType.PvssFloat,
        eGmsDataType.GmsReal
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, 123.456)
        const expected: IRuntimeValue = { _type: VariantType.Double, a: false, b: 123.456 };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create PvssBool/GmsBool', () => {
      const types = [
        eGmsDataType.PvssBool,
        eGmsDataType.GmsBool
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, true)
        const expected: IRuntimeValue = { _type: VariantType.Bool, a: false, b: true };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create PvssString', () => {
      const types = [
        eGmsDataType.PvssString
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, 'hello')
        const expected: IRuntimeValue = { _type: VariantType.StringType, a: false, b: 'hello' };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create GmsBitString/PvssBit32', () => {
      const types = [
        eGmsDataType.GmsBitString,
        eGmsDataType.PvssBit32
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, 144)
        const expected: IRuntimeValue = { _type: VariantType.Bit32, a: false, b: 144 };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create PvssUint/GmsUint/GmsEnum', () => {
      const types = [
        eGmsDataType.PvssUint,
        eGmsDataType.GmsUint,
        eGmsDataType.GmsEnum
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, 22)
        const expected: IRuntimeValue = { _type: VariantType.UInt32, a: false, b: 22 };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create PvssInt/GmsInt', () => {
      const types = [
        eGmsDataType.PvssInt,
        eGmsDataType.GmsInt
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, -22)
        const expected: IRuntimeValue = { _type: VariantType.SInt32, a: false, b: -22 };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create GmsDateTime/PvssTime', () => {
      const types = [
        eGmsDataType.GmsDateTime,
        eGmsDataType.PvssTime
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, "2024-05-31T16:25:02.96Z")
        const expected: IRuntimeValue = { _type: VariantType.DateTime, a: false, b: "2024-05-31T16:25:02.96Z" };
        expect(actual).toEqual(expected);
      }
      );
    });

    it('should create PvssChar', () => {
      const types = [
        eGmsDataType.PvssChar
      ];
      types.forEach(t => {
        const actual = Utility.createRuntimeVariant(t, undefined)
        const expected: IRuntimeValue = { _type: VariantType.UInt8, a: false, b: undefined };
        expect(actual).toEqual(expected);
      }
      );
    });

  });

  describe('isRuntimeInitialized', () => {
    it('#isRuntimeInitialized should return false for Uninitialized', () => {
      const UNINITIALIZED: IRuntimeValue = { _type: 0, a: false, b: undefined };
      const actual = Utility.isRuntimeInitialized(UNINITIALIZED);
      expect(actual).toEqual(false);
    });

    it('#isRuntimeInitialized should return true for Initialized', () => {
      const actual = Utility.isRuntimeInitialized(BIT64_RUNTIME);
      expect(actual).toEqual(true);
    });
  });

  describe('calculateRevertModeText', () => {
    const noRevertMockText = 'No';
    const forcedMockText = 'Forced'
    it('#calculateRevertModeText should be no revert', () => {
      const hasRevertActions = false;
      const forcedManual = true;
      const actual = Utility.calculateRevertModeText(hasRevertActions, forcedManual, noRevertMockText, forcedMockText);
      expect(actual).toEqual(noRevertMockText);
    });

    it('#calculateRevertModeText should be empty', () => {
      const hasRevertActions = true;
      const forcedManual = false;
      const actual = Utility.calculateRevertModeText(hasRevertActions, forcedManual, noRevertMockText, forcedMockText);
      expect(actual).toEqual('');
    });

    it('#calculateRevertModeText should be empty', () => {
      const actual = Utility.calculateRevertModeText(undefined, undefined, undefined, undefined);
      expect(actual).toEqual('');
    });

  });

  describe('encodeDateTime', () => {
    it('returns a predefined string for the unset date time', () => {
      const result = Utility.encodeDateTime(Utility.UNSET_DATE_TIME_DATE);
      expect(result).toEqual(Utility.UNSET_DATE_TIME_STRING);
    });

    it('returns ISO string for a valid date', () => {
      const testDate = new Date('2024-05-31T12:34:56.789Z');
      const result = Utility.encodeDateTime(testDate);
      expect(result).toEqual('2024-05-31T12:34:56.789Z');
    });

    it('returns undefined for a falsy date value', () => {
      const result = Utility.encodeDateTime(null);
      expect(result).toBeUndefined();
    });
  });

  describe('encodeDateTimeFromString', () => {
    it('returns the "Unset Date Time"', () => {
      const result = Utility.encodeDateTimeFromString(Utility.UNSET_DATE_TIME_STRING);
      expect(result).toEqual(Utility.UNSET_DATE_TIME_STRING);
    });

    it('returns ISO formatted string for a valid date string', () => {
      const testDateString = '2024-05-31T12:34:56.789Z';
      const result = Utility.encodeDateTimeFromString(testDateString);
      expect(result).toEqual('2024-05-31T12:34:56.789Z');
    });

    it('returns undefined for an invalid date string', () => {
      const invalidDateString = 'not a date';
      const result = Utility.encodeDateTimeFromString(invalidDateString);
      expect(result).toBeUndefined();
    });

    it('returns undefined for an empty string', () => {
      const result = Utility.encodeDateTimeFromString(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('getIcon', () => {
    it('should return "element-ok" for ClosedForMissingLicense', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.ClosedForMissingLicense)).toBe('element-ok');
    });

    it('should return "element-alarm-filled" for Expired', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Expired)).toBe('element-alarm-filled');
    });

    it('should return "element-alarm-filled" for ReadyToBeClosed', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.ReadyToBeClosed)).toBe('element-alarm-filled');
    });

    it('should return "element-command-arrow-filled" for ExecutingCommands', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.ExecutingCommands)).toBe('element-command-arrow-filled');
    });

    it('should return "element-redo" for RevertingCommands', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.RevertingCommands)).toBe('element-redo');
    });

    it('should return "element-clock" for WaitingForConditions', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.WaitingForConditions)).toBe('element-clock');
    });

    it('should return "element-stop-filled" for Aborting', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Aborting)).toBe('element-stop-filled');
    });

    it('should return "element-fast-forward-filled" for RunningWithException', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.RunningWithException)).toBe('element-fast-forward-filled');
    });

    it('should return "element-fast-forward-filled" for Running', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Running)).toBe('element-fast-forward-filled');
    });

    it('should return "element-calendar" for Deferred', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Deferred)).toBe('element-calendar');
    });

    it('should return "element-cancel" for Failed', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Failed)).toBe('element-cancel');
    });

    it('should return "element-ok" for Closed', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Closed)).toBe('element-ok');
    });

    it('should return "element-minus" for Idle', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.Idle)).toBe('element-minus');
    });

    it('should return "element-self-test" for CheckingPreconditions', () => {
      expect(Utility.getIcon(OperatorTaskStatuses.CheckingPreconditions)).toBe('element-self-test');
    });

    it('should return undefined for an unknown status', () => {
      expect(Utility.getIcon(undefined)).toBeUndefined();
    });
  });

  describe('getIconColor', () => {
    it('should return "status-danger" for ClosedForMissingLicense', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.ClosedForMissingLicense)).toBe('status-danger');
    });

    it('should return "status-warning" for Expired', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Expired)).toBe('status-warning');
    });

    it('should return "status-info" for ReadyToBeClosed', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.ReadyToBeClosed)).toBe('status-info');
    });

    it('should return "status-info" for ExecutingCommands', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.ExecutingCommands)).toBe('status-info');
    });

    it('should return "status-info" for RevertingCommands', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.RevertingCommands)).toBe('status-info');
    });

    it('should return "status-info" for WaitingForConditions', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.WaitingForConditions)).toBe('status-info');
    });

    it('should return "status-info" for Aborting', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Aborting)).toBe('status-info');
    });

    it('should return "status-warning" for RunningWithException', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.RunningWithException)).toBe('status-warning');
    });

    it('should return "status-info" for Running', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Running)).toBe('status-info');
    });

    it('should return "status-info" for Deferred', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Deferred)).toBe('status-info');
    });

    it('should return "status-danger" for Failed', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Failed)).toBe('status-danger');
    });

    it('should return "status-info" for Closed', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Closed)).toBe('status-info');
    });

    it('should return "status-info" for Idle', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.Idle)).toBe('status-info');
    });

    it('should return "status-info" for CheckingPreconditions', () => {
      expect(Utility.getIconColor(OperatorTaskStatuses.CheckingPreconditions)).toBe('status-info');
    });

    it('should return "undefined" for invalid statuses', () => {
      expect(Utility.getIconColor(null)).toBeUndefined();
    });
  });

  describe('addSecondsToDate', () => {
    it('should add seconds to a date', () => {
      const baseDate = new Date('2020-01-01T00:00:00Z');
      const secondsToAdd = 10;
      const expectedDate = new Date('2020-01-01T00:00:10Z');
      expect(Utility.addSecondsToDate(baseDate, secondsToAdd)).toEqual(expectedDate);
    });

    it('should handle negative seconds', () => {
      const baseDate = new Date('2020-01-01T00:00:30Z');
      const secondsToAdd = -10;
      const expectedDate = new Date('2020-01-01T00:00:20Z');
      expect(Utility.addSecondsToDate(baseDate, secondsToAdd)).toEqual(expectedDate);
    });

    it('should handle zero seconds', () => {
      const baseDate = new Date('2020-01-01T00:00:00Z');
      const secondsToAdd = 0;
      const expectedDate = new Date('2020-01-01T00:00:00Z');
      expect(Utility.addSecondsToDate(baseDate, secondsToAdd)).toEqual(baseDate);
    });

  });

  describe('dateToLocaleTimeString', () => {
    beforeAll(() => {
      Utility.formatLang = 'en-US';
    });

    it('should correctly format the date to a locale-specific time string', () => {
      const date = new Date('2020-01-01T14:30:00Z');
      const expected = '8:30 AM';
      const actual = Utility.dateToLocaleTimeString(date)
      expect(actual).toBe(expected);
    });

    it('should throw an error if the date object is invalid', () => {
      expect(() => Utility.dateToLocaleTimeString(new Date('invalid-date'))).toThrowError('Invalid date object provided.');
    });

    it('should throw an error if userLang is not set or not a string', () => {
      const validDate = new Date();
      const originalLang = Utility.formatLang;
      Utility.formatLang = undefined;
      expect(() => Utility.dateToLocaleTimeString(validDate)).toThrowError('User language is not set or not a string.');
      Utility.formatLang = originalLang;
    });

    it('should handle different locales correctly', () => {
      Utility.formatLang = 'de';
      const date = new Date('2024-05-09T18:59:23.566Z');
      const expectedTime = '13:59';
      const actual = Utility.dateToLocaleTimeString(date)
      expect(actual).toBe(expectedTime);
    });

    afterEach(() => {
      Utility.formatLang = 'en';
    });
  });

  describe('isRunningOrExpiredStatus', () => {
    it('should return true', () => {

      const statuses = [
        OperatorTaskStatuses.Running,
        OperatorTaskStatuses.RunningWithException,
        OperatorTaskStatuses.Expired
      ];
      statuses.forEach(status => {
        expect(Utility.isRunningOrExpiredStatus(status)).toBeTrue();
      }
      );
    });

    it('should return false for any other status', () => {
      const statuses = [
        OperatorTaskStatuses.ClosedForMissingLicense,
        OperatorTaskStatuses.ReadyToBeClosed,
        OperatorTaskStatuses.ExecutingCommands,
        OperatorTaskStatuses.RevertingCommands,
        OperatorTaskStatuses.WaitingForConditions,
        OperatorTaskStatuses.Aborting,
        OperatorTaskStatuses.Deferred,
        OperatorTaskStatuses.Failed,
        OperatorTaskStatuses.Closed,
        OperatorTaskStatuses.Idle,
        OperatorTaskStatuses.CheckingPreconditions
      ];
      statuses.forEach(status => {
        expect(Utility.isRunningOrExpiredStatus(status)).toBeFalse();
      }
      );
    });
  });

  describe('calculateRevertModeText', () => {
    const noRevertMockText = 'No';
    const forcedMockText = 'Forced'
    it('should be empty', () => {
      const hasRevertActions = true;
      const forcedManual = false;
      const actual = Utility.calculateRevertModeText(hasRevertActions, forcedManual, noRevertMockText, forcedMockText);
      expect(actual).toEqual('');
    });

    it('should be no revert', () => {
      const hasRevertActions = false;
      const forcedManual = true;
      const actual = Utility.calculateRevertModeText(hasRevertActions, forcedManual, noRevertMockText, forcedMockText);
      expect(actual).toEqual(noRevertMockText);
    });

    it('#calculateRevertModeText should be empty', () => {
      const actual = Utility.calculateRevertModeText(undefined, undefined, undefined, undefined);
      expect(actual).toEqual('');
    });
  });

  describe('createErrorMessage', () => {
    it('use the value provided', () => {
      const result = Utility.createErrorMessage(undefined, 'hello');
      expect(result).toEqual('hello');
    });

    it('use the value from the error', () => {
      const error = {
        name: 'test',
        message: 'testMessage'
      }
      const actual = Utility.createErrorMessage(error, undefined);
      expect(actual).toEqual('test: testMessage');
    });
  });

  describe('isNullOrWhitespace', () => {
    it('should be true when param is undefined', () => {
      const result = Utility.isNullOrWhitespace(undefined);
      expect(result).toBeTrue();
    });

    it('should be true when param is null', () => {
      const result = Utility.isNullOrWhitespace(null);
      expect(result).toBeTrue();
    });

    it('should be true when param is empty', () => {
      const result = Utility.isNullOrWhitespace("");
      expect(result).toBeTrue();
    });

    it('should be true when param is white space', () => {
      const result = Utility.isNullOrWhitespace(" ");
      expect(result).toBeTrue();
    });

    it('should be false when param has value', () => {
      const result = Utility.isNullOrWhitespace(" some text");
      expect(result).toBeFalse();
    });
  });

  describe('isValidParameterType', () => {
    it('should be false when IsArray is true', () => {
      const result = Utility.isValidParameterType(true, eGmsDataType.PvssInt64);
      expect(result).toBeFalse();
    });

    it('should be true when IsArray is undefined or null', () => {
      const result = Utility.isValidParameterType(null, eGmsDataType.PvssInt64);
      expect(result).toBeTrue();
    });
    it('should be true when IsArray is false and GmsDataType is valid', () => {
      const types = [
        eGmsDataType.PvssInt,
        eGmsDataType.PvssUint,
        eGmsDataType.PvssFloat,
        eGmsDataType.PvssBool,
        eGmsDataType.PvssTime,
        eGmsDataType.PvssChar,
        eGmsDataType.PvssString,
        eGmsDataType.GmsInt,
        eGmsDataType.GmsUint,
        eGmsDataType.GmsReal,
        eGmsDataType.GmsBool,
        eGmsDataType.GmsEnum,
        eGmsDataType.GmsDateTime,
        eGmsDataType.GmsDuration,
        eGmsDataType.PvssBit32,
        eGmsDataType.GmsBitString,
        eGmsDataType.PvssInt64,
        eGmsDataType.PvssUint64,
        eGmsDataType.GmsInt64,
        eGmsDataType.GmsUint64,
        eGmsDataType.PvssBit64,
        eGmsDataType.GmsBitString64
      ];
      types.forEach(t => {
        expect(Utility.isValidParameterType(false, t)).toBeTrue();
      }
      );
    });

    it('should be false when GmsDataType is invalid', () => {
      const types = [
        eGmsDataType.None,
        eGmsDataType.PvssDpId,
        eGmsDataType.PvssLangText,
        eGmsDataType.PvssBlob,
        eGmsDataType.GmsAny,
        eGmsDataType.GmsApplSpecific,
        eGmsDataType.GmsComplex
      ];
      types.forEach(t => {
        expect(Utility.isValidParameterType(false, t)).toBeFalse();
      }
      );
    });

  });
});