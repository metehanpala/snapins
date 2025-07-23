import { BrowserObject, GmsSubscription, ValueDetails } from '@gms-flex/services';
import { Subscription } from 'rxjs';

import { BACnetDateTimeDetail, BACnetDateTimeResolution } from '../textual-viewer-data.model';

export interface MessageData {
  /* eslint-disable-next-line */
  MessageBody: BrowserObject;
}

export interface TextSnapinData {
  path: string;
  description: string;
  name: string;
  alias: string;
  typeDescriptor: string;
  subTypeDescriptor: string;
  validationProfile: string;
  outOfScan: string;
  value: string;
  image: string;
  summary: string;
  valueUnit: string;
  summaryUnit: string;
  resolution: number;
  type: string;
  bdtDetail?: BACnetDateTimeDetail;
  bdtResolution?: BACnetDateTimeResolution;
  ddFormat?: DurationDisplayFormat;
  dvUnits?: DurationUnits;
}

/**
 * Duration display format.
 */
export enum DurationDisplayFormat {
  None = 0,
  Day,
  DayHour,
  DayHourMin,
  DayHourMinSec,
  DayHourMinSecMs,
  Hour,
  HourMin,
  HourMinSec,
  HourMinSecMs,
  Min,
  MinSec,
  MinSecMs,
  Sec,
  SecMs
}

/**
 * Duration units.
 * Duration property values are represented as unsigned integer values.  The value
 * units may vary.
 */
export enum DurationUnits {
  Day = 0,
  Hour,
  Min,
  Sec,
  Dsec,
  Csec,
  Msec
}

/**
 * Fields of a BACnet date-time object.
 */
export interface BACnetDateTime {
  yearOffset: number;
  month: number;
  dayOfMonth: number;
  dayOfWeek: number;
  hour: number;
  minute: number;
  second: number;
  hundreth: number;
}

export interface SubscriptionData {
  requestedObjectOrPropertyId: string;
  // subscribedPropertyId: string;
  textTableIndex: number;
  mainValue: boolean;
  mainIsSummary: boolean;
  // key: number;
  valueSubscription: GmsSubscription<ValueDetails>;
  subscription: Subscription;
}

/**
 * Property value types.
 */
export enum PropertyValueType {
  /**
   * String-type or enumerated values.
   * Also used as a catchall for complex or unsupported property types that will
   * be handled by default like strings.
   */
  StringValue = 0,

  IntegerValue,

  FloatValue,

  DateTimeValue,

  BACnetDateTimeValue,

  DurationValue,

  BitstringValue
}

export enum RowSubscriptionInfoType {
  Status,
  DefaultProperty,
  FunctionDefaultProperty,
  CurrentPriorityProperty
}
