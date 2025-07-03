import { BACnetDateTimeDetail, FormatBACnetDateTime, FormatDate } from '@gms-flex/controls';

export enum DateTimeType {
  DateAndTime = 0,
  DateOnly,
  TimeOnly
}

export class BACnetDateTimeFormatter {
  private formatServiceBAC: FormatBACnetDateTime;
  private readonly _locale: string;
  private readonly _BACnetDateTimeResolution: number;
  private readonly _BACnetDateTimeDetail: number;

  public constructor(locale: string, bnDateTimeResolution: number, bnDateTimeDetail: number) {
    this._locale = locale;
    this._BACnetDateTimeResolution = bnDateTimeResolution;
    this._BACnetDateTimeDetail = bnDateTimeDetail;
  }

  public formatBACnetDateTime(bndt: string): string {
    if (bndt !== undefined) {
      if (this.formatServiceBAC === undefined) {
        this.formatServiceBAC = new FormatBACnetDateTime(
          this._locale, this.BACnetDTDetailEnumTranslator, this._BACnetDateTimeResolution);
      }
      return this.formatServiceBAC.format(bndt);
    } else {
      return undefined;
    }
  }

  public get BACnetDTDetailEnumTranslator(): BACnetDateTimeDetail {
    switch (this.bnDateTimeDetail) {
      case DateTimeType.DateOnly:
        return BACnetDateTimeDetail.DateOnly;
      case DateTimeType.TimeOnly:
        return BACnetDateTimeDetail.TimeOnly;
      case DateTimeType.DateAndTime:
        return BACnetDateTimeDetail.DateAndTime;
      default:
        return BACnetDateTimeDetail.Unspecified;
    }
  }

  private get bnDateTimeDetail(): DateTimeType {
    return this.toDateTimeType(this._BACnetDateTimeDetail);

  }

  private toDateTimeType(value: number): DateTimeType {
    let dtType: DateTimeType;
    switch (value) {
      case 1:
        dtType = DateTimeType.DateOnly;
        break;
      case 2:
        dtType = DateTimeType.TimeOnly;
        break;
      default:
        dtType = DateTimeType.DateAndTime;
        break;
    }
    return dtType;
  }
}