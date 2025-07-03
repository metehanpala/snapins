/* eslint-disable @typescript-eslint/naming-convention */
import { IRuntimeValue, OperatorTaskStatus } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import Long from 'long';
import { of } from 'rxjs';

import { OperatorTaskStatuses } from '../types/operator-task-status';
import { eGmsDataType } from '../types/overridable-parameter-types';
import { RevertActionMode } from '../types/revert-action-mode';
import { VariantType } from '../types/variant-type';

export class Utility {
  public static taskStatusTranslated: Map<number, OperatorTaskStatus>;
  public static formatLang = 'en';
  public static readonly MAX_NOTES = 10;
  public static readonly MAX_NOTES_CHARS = 500;
  public static readonly ALLOWW_ALL_OM = '*';
  public static readonly DEFAULT_NOTES_REQUIRED = 1;// NotesRequired.Yes;
  public static readonly DEFAULT_REVERT_ACTION = RevertActionMode.Manual;
  public static readonly UNSET_DATE_TIME_STRING = '1970-01-01T00:00:00Z';
  public static readonly UNSET_DATE_TIME_DATE = new Date('1970-01-01T00:00:00Z');
  public static readonly REGEX_WSI_DATE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/;
  public static readonly REGEX_ALL_WHITESPACE = /^\s*$/;
  public static readonly EMPTY_OBSERVABLE = of([]);

  public static DEFAULT_EMPTY_STRING = '';
  public static Float_DefaultResolution = 2;
  public static readonly INT32MIN: number = -(2147483648);
  public static readonly INT32MAX: number = 2147483647;
  public static readonly UINT32MIN: number = 0;
  public static readonly UINT32MAX: number = 4294967295;
  public static readonly CHARMIN: number = 0;
  public static readonly CHARMAX: number = 255;
  public static readonly INT64MIN: Long = Long.MIN_VALUE;
  public static readonly INT64MAX: Long = Long.MAX_VALUE;
  public static readonly UINT64MIN: Long = Long.UZERO;
  public static readonly UINT64MAX: Long = Long.MAX_UNSIGNED_VALUE;
  public static readonly BOOLMIN: number = 0;
  public static readonly BOOLMAX: number = 1;
  public static readonly BITMIN: number = 0;
  public static readonly BIT32MAX_BIT: number = 31;
  public static readonly BIT64MAX_BIT: number = 63;

  public static createGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string): string => {
      // eslint-disable-next-line no-bitwise
      const r: number = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v: number = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public static decodeDateTimeToString(dtString: string): string {
    if (dtString) {
      let dt: Date;
      const dtMsec: number = Date.parse(dtString); // will return NaN if cannot parse date-time string
      if (!isNaN(dtMsec)) {
        dt = new Date(dtMsec);
      }
      return dt.toLocaleString(this.formatLang);
    }
    return '';
  }

  public static encodeDateTime(dt: Date): string {
    if (dt === this.UNSET_DATE_TIME_DATE) {
      return this.UNSET_DATE_TIME_STRING;
    }
    return dt ? dt.toISOString() : undefined;
  }

  public static encodeDateTimeFromString(dt: string): string {
    if (dt === this.UNSET_DATE_TIME_STRING) {
      return this.UNSET_DATE_TIME_STRING;
    }

    const date = new Date(dt)
    if (isNaN(date.getTime())) {
      return undefined; // Return undefined if the date is not valid
    }
    return date.toISOString();
  }

  public static parseDuration(seconds: number): any {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
  
    return { days: days, hours: hours, minutes: minutes };
  }

  public static getIcon(status: OperatorTaskStatuses): string {
    let result = '';
    switch (status) {
      case OperatorTaskStatuses.ClosedForMissingLicense:
      case OperatorTaskStatuses.Closed:
        result = 'element-ok';
        break;
      case OperatorTaskStatuses.Expired:
      case OperatorTaskStatuses.ReadyToBeClosed:
        result = 'element-alarm-filled';
        break;
      case OperatorTaskStatuses.ExecutingCommands:
        result = 'element-command-arrow-filled';
        break;
      case OperatorTaskStatuses.RevertingCommands:
        result = 'element-redo';
        break;
      case OperatorTaskStatuses.WaitingForConditions:
        result = 'element-clock';
        break;
      case OperatorTaskStatuses.Aborting:
        result = 'element-stop-filled';
        break;
      case OperatorTaskStatuses.RunningWithException:
      case OperatorTaskStatuses.Running:
        result = 'element-fast-forward-filled';
        break;
      case OperatorTaskStatuses.Deferred:
        result = 'element-calendar';
        break;
      case OperatorTaskStatuses.Failed:
        result = 'element-cancel';
        break;
      case OperatorTaskStatuses.Idle:
        result = 'element-minus';
        break;
      case OperatorTaskStatuses.CheckingPreconditions:
        result = 'element-self-test';
        break;
      default:
        result = undefined;
        break;
    }
    return result;
  }

  public static getIconColor(status: OperatorTaskStatuses): string {
    let result = '';
    switch (status) {
      case OperatorTaskStatuses.ClosedForMissingLicense:
      case OperatorTaskStatuses.Failed:
        result = 'status-danger';
        break;
      case OperatorTaskStatuses.Expired:
      case OperatorTaskStatuses.RunningWithException:
        result = 'status-warning';
        break;
      case OperatorTaskStatuses.ReadyToBeClosed:
      case OperatorTaskStatuses.ExecutingCommands:
      case OperatorTaskStatuses.RevertingCommands:
      case OperatorTaskStatuses.WaitingForConditions:
      case OperatorTaskStatuses.Aborting:
      case OperatorTaskStatuses.Running:
      case OperatorTaskStatuses.Deferred:
      case OperatorTaskStatuses.Closed:
      case OperatorTaskStatuses.Idle:
      case OperatorTaskStatuses.CheckingPreconditions:
        result = 'status-info';
        break;
      default:
        result = undefined;
        break;
    }
    return result;
  }

  public static createErrorMessage(error: any, defaultmsg: string): string {
    let result = defaultmsg;
    if (!isNullOrUndefined(error)) {
      result = error?.name + ': ' + error?.message;
    }
    return result;
  }

  public static addSecondsToDate(dt: Date, timeout: number): Date {
    const secondsToadd = timeout;
    const updatedDate = new Date(dt.setSeconds(dt.getSeconds() + secondsToadd));
    return updatedDate;
  }

  public static dateToLocaleTimeString(dt: Date): string {
    if (!(dt instanceof Date) || isNaN(dt.getTime())) {
      throw new Error('Invalid date object provided.');
    }
    if (typeof this.formatLang !== 'string') {
      throw new Error('User language is not set or not a string.');
    }

    const hourFormat = this.getDefaultHourCycle(this.formatLang);

    return dt.toLocaleTimeString(this.formatLang, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: hourFormat === '12-hour'
    });
  }

  public static isValidDate(dt: Date): boolean {
    return dt instanceof Date && !isNaN(dt.getTime());
  }

  public static createRuntimeVariant(gmsType: eGmsDataType, val: any): IRuntimeValue {
    // For 64types, wsi expects a string for value and _type and _originalType to
    // reflect the actual type
    const result: IRuntimeValue = { _type: 0, a: false, b: val };
    switch (gmsType) {
      case eGmsDataType.PvssFloat:
      case eGmsDataType.GmsReal:
        result._type = VariantType.Double;
        break;

      case eGmsDataType.PvssBool:
      case eGmsDataType.GmsBool:
        result._type = VariantType.Bool;
        break;

      case eGmsDataType.PvssString:
        result._type = VariantType.StringType;
        break;

      case eGmsDataType.GmsBitString:
      case eGmsDataType.PvssBit32:
        result._type = VariantType.Bit32
        break;

      case eGmsDataType.PvssUint:
      case eGmsDataType.GmsUint:
      case eGmsDataType.GmsEnum:
        result._type = VariantType.UInt32
        break;

      case eGmsDataType.PvssInt:
      case eGmsDataType.GmsInt:
        result._type = VariantType.SInt32
        break;

      case eGmsDataType.GmsDateTime:
      case eGmsDataType.PvssTime:
        result._type = VariantType.DateTime;
        break;

      case eGmsDataType.PvssUint64:
      case eGmsDataType.GmsUint64:
        result._type = VariantType.StringType;
        result._originalType = VariantType.UInt64;
        result.b = val.toString();
        break;

      case eGmsDataType.PvssInt64:
      case eGmsDataType.GmsInt64:
        result._type = VariantType.StringType;
        result._originalType = VariantType.SInt64;
        result.b = val.toString();
        break;

      case eGmsDataType.GmsBitString64:
      case eGmsDataType.PvssBit64:
        result._type = VariantType.StringType;
        result._originalType = VariantType.Bit64;
        result.b = val.toString();
        break;

      case eGmsDataType.PvssChar:
        result._type = VariantType.UInt8
        break;
      // Not Supported Types
      case eGmsDataType.PvssDpId:
      case eGmsDataType.PvssLangText:
      case eGmsDataType.GmsAny:
      case eGmsDataType.None:
      case eGmsDataType.PvssBlob:
      case eGmsDataType.GmsApplSpecific:
      default:
        break;
    }
    return result;
  }

  public static getOriginalRuntimeType(runtime: IRuntimeValue): VariantType {
    let result = VariantType.Uninitialized;
    if (!isNullOrUndefined(runtime)) {
      if (runtime._originalType) {
        result = runtime._originalType;
      } else {
        result = runtime._type;
      }
    }
    return result;
  }

  public static isRuntimeInitialized(runtime: IRuntimeValue): boolean {
    let result = true;
    const originalType = Utility.getOriginalRuntimeType(runtime);
    if (originalType === VariantType.Uninitialized) {
      result = false;
    }
    return result;
  }

  public static isRunningOrExpiredStatus(status: OperatorTaskStatuses): boolean {
    return status === OperatorTaskStatuses.Running
      || status === OperatorTaskStatuses.RunningWithException
      || status === OperatorTaskStatuses.Expired;
  }

  public static calculateRevertModeText(hasRevertActions: boolean, isForcedManual: boolean, noRevertText: string, forcedText: string): string {
    if (isNullOrUndefined(hasRevertActions) || isNullOrUndefined(isForcedManual)
      || isNullOrUndefined(noRevertText) || isNullOrUndefined(forcedText)) {
      return '';
    }

    if (hasRevertActions) {
      return isForcedManual ? forcedText : '';
    }
    return noRevertText;
  }

  public static isNullOrWhitespace(input: any): boolean {
    if (input === null || input === undefined) {
      return true;
    }
    if (typeof input !== 'string') {
      return false;
    }
    return input.trim().length === 0;
  }

  public static isValidParameterType(isArray: boolean, gmsType: eGmsDataType): boolean {
    let result = true;
    if (isArray) {
      result = false;
    } else {
      switch (gmsType) {
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

  private static getDefaultHourCycle(locale: string): '12-hour' | '24-hour' {
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric' };
    const formatter = new Intl.DateTimeFormat(locale, options);
    const parts = formatter.formatToParts(new Date());

    // Check if the 'dayPeriod' part exists which indicates AM/PM usage (12-hour)
    const hourCycle = parts.some(part => part.type === 'dayPeriod') ? '12-hour' : '24-hour';
    return hourCycle;
  }

}