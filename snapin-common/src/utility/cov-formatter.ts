import { PropertyDetails, Value, ValueDetails } from '@gms-flex/services';
import { BACnetDateTimeDetail, BACnetDateTimeResolution, FormatBACnetDateTime,
  FormatDate, FormatDuration, FormatLocaleResGroupingInterface, FormatNumeric } from '@gms-flex/controls';

/* jslint node: true */
import Long from 'long';
/*
 * Some design notes for later...
 *
 * ===== Complexity Discussion =====
 *
 * Note that some of the classes below have methods where the complexity
 * numbers are large (greater than 10). If you look closely, these methods
 * are primarily switch statements, used to map one of the input arguments
 * to something else (such as in the case of the BACnet date/time formatting,
 * where the detail and resolution are numeric values received from the WSI
 * and must be converted into enumerations used by the 'format helper' class).
 *
 * An alternative design approach (which was coded up and tested) is to
 * place. all of that information in static tables (dictionaries, etc) - this
 * simplifies the 'mapping' code quite a bit (which appeases the metrics
 * people who are interested strictly in complexity), but... at the expense of
 * problems in the unit testing / code coverage world. Specifically: with a
 * table-driven approach there is no way to easily determine which cases
 * have been exercised during unit testing. By "easily determine" we mean
 * that we cannot use the code coverage (after the tests are executed)
 * to see what additional tests are required (go take your TDD comments
 * outside, eh).
 *
 * So an explicit decision was made to keep the switch statements and live
 * with the additional complexity. Ultimately, the switch statements are not
 * complex for normal humans to understand, AND we have the extra benefit
 * of explicitly seeing which paths have been executed (when the tests
 * are run).
 *
 * Side note on being table driven: there is a switch statement used to
 * create an instance of the lower level formatting classes; a table
 * (dictionary/map/etc) that holds the correlation between the data
 * type and the constructor (think of a map with the data type as the
 * key and the value a method call to create the instance) MUST not be
 * in the public formatting class - the unit tests run but the build
 * will fail. If such a table-driven approach is to be used, it must be
 * placed in a private class in this module (and called in the public
 * formatting class's constructor).
 *
 * ===== Implementation Classes =====
 *
 * The classes below that actually 'do' the COV formatting (well: they
 * delegate to the "format helper" classes to do the actual formatting)
 * are not exported and are considered 'private' to this module. Private
 * in that they should not be used by anyone other than the one public
 * formatting class. This is important because the public formatting class
 * does some argument validation prior to calling the private classes.
 * Validation such as: is the value details null, are some of the interesting
 * properties null. Because the public class does this validation, the
 * private classes DO NOT do this validation.
 */

interface FormatImpl {
  format(value: ValueDetails): string;
}

class CovFormatterBACnetDateTime implements FormatImpl {

  private readonly formatter: FormatBACnetDateTime;
  private static mapDetail(detail: number): BACnetDateTimeDetail {
    let retVal: BACnetDateTimeDetail;
    switch (detail) {
      case 1:
        retVal = BACnetDateTimeDetail.DateOnly;
        break;
      case 2:
        retVal = BACnetDateTimeDetail.TimeOnly;
        break;
      case 3:
        retVal = BACnetDateTimeDetail.DateAndTime;
        break;
      default:
        retVal = BACnetDateTimeDetail.Unspecified;
        break;
    }
    return retVal;
  }

  private static mapResolution(res: number): BACnetDateTimeResolution {
    let retVal: BACnetDateTimeResolution;
    switch (res) {
      case 0:
        retVal = BACnetDateTimeResolution.Seconds;
        break;
      case 1:
        retVal = BACnetDateTimeResolution.Tenths;
        break;
      case 2:
        retVal = BACnetDateTimeResolution.Hundredths;
        break;
      default:
        retVal = BACnetDateTimeResolution.Hundredths;
        break;
    }
    return retVal;
  }

  constructor(locale: string, pd: PropertyDetails) {
    const d: BACnetDateTimeDetail = CovFormatterBACnetDateTime.mapDetail(pd.BACnetDateTimeDetail);
    const r: BACnetDateTimeResolution = CovFormatterBACnetDateTime.mapResolution(pd.BACnetDateTimeResolution);
    this.formatter = new FormatBACnetDateTime(locale, d, r);
  }

  public format(value: ValueDetails): string {
    let s = '';
    try {
      // sadly, the format helper class will throw if the incoming
      // string is not a valid bacnet date/time string. in
      // hindsight, might have been better to expose a method to
      // check a string BEFORE calling the format method.
      s = this.formatter.format(value.Value.Value);
    } catch (e) {
      s = '';
    }
    return s;
  }
}

class CovFormatterDateTime implements FormatImpl {

  private readonly formatter: FormatDate;

  private static decode(s: string): Date {
    let dt: Date;
    const ms: number = Date.parse(s); // NaN if string not valid
    if (!isNaN(ms)) {
      dt = new Date(ms);
    }
    return dt;
  }

  constructor(locale: string) {
    this.formatter = new FormatDate(locale);
  }

  public format(value: ValueDetails): string {
    let v = '';
    const dt: Date = CovFormatterDateTime.decode(value.Value.Value);
    if (dt !== undefined) {
      v = this.formatter.format(dt);
    }
    return v;
  }
}

class CovFormatterDuration implements FormatImpl {

  private readonly formatter: FormatDuration;
  private readonly displayUnits: string;

  private static decode(s: string): number {
    let n = Number(s);
    if (isNaN(n)) {
      n = undefined;
    }
    return n;
  }

  private static mapUnits(n: number): string {
    let units = '';
    switch (n) {
      case 1: // day
        units = 'd';
        break;
      case 2: // hour
        units = 'h';
        break;
      case 3: // minutes
        units = 'm';
        break;
      case 4: // seconds
        units = 's';
        break;
      case 5: // deciseconds ('tenths of a second')
        units = 'ts';
        break;
      case 6: // centiseconds ('hundredths of a second')
        units = 'hs';
        break;
      case 7: // milliseconds
        units = 'ms';
        break;
      default:
        break;
    }
    return units;
  }

  // reminders:
  // 1) capital letter means 'this and all above'
  // 2) 'FFF' means only show if non-zero
  // 3) 'fff' means show all the time

  private static mapFormat(n: number): string {
    let fmt = '';
    switch (n) {
      case 0: // none
        break;
      case 1: // day
        fmt = 'D.FFF';
        break;
      case 2: // day + hr
        fmt = 'D:h.FFF';
        break;
      case 3: // day + hr + min
        fmt = 'D:hh:mm.FFF';
        break;
      case 4: // day + hr + min + sec
        fmt = 'D:hh:mm:ss.FFF';
        break;
      case 5: // day + hr + min + sec + milliseconds
        fmt = 'D:hh:mm:ss.fff';
        break;
      case 6: // hour
        fmt = 'H.FFF';
        break;
      case 7: // hr + min
        fmt = 'H:mm.FFF';
        break;
      case 8: // hr + min + sec
        fmt = 'H:mm:ss.FFF';
        break;
      case 9: // hr + min + sec + ms
        fmt = 'H:mm:ss.fff';
        break;
      case 10: // min
        fmt = 'M.FFF';
        break;
      case 11: // min + sec
        fmt = 'M:ss.FFF';
        break;
      case 12: // min + sec + milliseconds
        fmt = 'M:ss.fff';
        break;
      case 13: // sec
        fmt = 'S.FFF';
        break;
      case 14: // sec + milliseconds
        fmt = 'S.fff';
        break;
      default:
        break;
    }
    return fmt;
  }

  constructor(locale: string, pd: PropertyDetails) {
    const units: string = CovFormatterDuration.mapUnits(pd.DurationValueUnits);
    const fmt: string = CovFormatterDuration.mapFormat(pd.DurationDisplayFormat);
    this.formatter = new FormatDuration(locale, units, fmt);
    this.displayUnits = pd.UnitDescriptor;
  }

  public format(value: ValueDetails): string {
    let v = '';
    const n: number = CovFormatterDuration.decode(value.Value.Value);
    if (n !== undefined) {
      v = this.formatter.format(n);
      if (v) {
        if (this.displayUnits) {
          v = `${v} ${this.displayUnits}`;
        }
      }
    }
    return v;
  }
}

class CovFormatterNumeric implements FormatImpl {

  private readonly formatter: FormatNumeric;
  private readonly engrgUnit: string;

  private static decode(st: string): number {
    let n = Number(st);
    if (isNaN(n)) {
      n = undefined;
    }
    return n;
  }

  constructor(paramFormatNum: FormatLocaleResGroupingInterface) {
    this.formatter = new FormatNumeric(paramFormatNum);
    this.engrgUnit = paramFormatNum.eu;
  }

  public format(value: ValueDetails): string {
    let v = '';
    const n: number = CovFormatterNumeric.decode(value.Value.Value);
    if (n !== undefined) {
      v = this.formatter.format(n);
      if (this.engrgUnit) {
        v = `${v} ${this.engrgUnit}`;
      }
    }
    return v;
  }
}

class CovFormatterInt64bit implements FormatImpl {

  private readonly formatter: FormatNumeric;
  private readonly engrgUnit: string;

  private static decode(s: string): Long {
    let n: Long = Long.fromString(s, false);
    if ((n === undefined) || (n === null) || ((typeof (n) !== 'number') && (!Long.isLong(n)))) {
      n = undefined;
    }
    return n;
  }

  constructor(paramFormat: FormatLocaleResGroupingInterface) {
    this.formatter = new FormatNumeric(paramFormat);
    this.engrgUnit = paramFormat.eu;
  }

  public format(value: ValueDetails): string {
    let v = '';
    const n: Long = CovFormatterInt64bit.decode(value.Value.Value);
    if (n !== undefined) {
      v = this.formatter.format(n);
      if (this.engrgUnit) {
        v = `${v} ${this.engrgUnit}`;
      }
    }
    return v;
  }
}

class CovFormatterUInt64bit implements FormatImpl {

  private readonly formatter: FormatNumeric;
  private readonly engrgUnit: string;

  private static decode(s: string): Long {
    let n: Long = Long.fromString(s, true);
    if ((n === undefined) || (n === null) || ((typeof (n) !== 'number') && (!Long.isLong(n)))) {
      n = undefined;
    }
    return n;
  }

  constructor(paramFormat: FormatLocaleResGroupingInterface) {
    this.formatter = new FormatNumeric(paramFormat);
    this.engrgUnit = paramFormat.eu;
  }

  public format(value: ValueDetails): string {
    let v = '';
    const n: Long = CovFormatterUInt64bit.decode(value.Value.Value);
    if (n !== undefined) {
      v = this.formatter.format(n);
      if (this.engrgUnit) {
        v = `${v} ${this.engrgUnit}`;
      }
    }
    return v;
  }
}

class CovFormatterBitString implements FormatImpl {
  public format(vd: ValueDetails): string {
    let s = '';
    try {
      if (vd.Value.DisplayValue) {
        try {
          s = JSON.parse(vd.Value.DisplayValue).reverse().join(' ');
        } catch (e) {
          if (vd.Value.Value) {
            s = vd.Value.Value;
          }
        }
      } else {
        if (vd.Value.Value) {
          s = vd.Value.Value;
        }
      }
    } catch (e) {
      s = '';
    }
    return s;
  }
}

class CovFormatterSimple implements FormatImpl {
  public format(value: ValueDetails): string {
    return value.Value.DisplayValue || value.Value.Value;
  }
}

export class CovFormatter {

  private readonly formatter: FormatImpl;

  private static factory(locale: string, pd: PropertyDetails): FormatImpl {
    let f: FormatImpl;
    const param: FormatLocaleResGroupingInterface = {
      locale,
      res: 0
    };
    switch (pd.Type) {
      case 'BasicInt':
      case 'BasicUint':
        f = new CovFormatterNumeric(param);
        break;
      case 'ExtendedInt':
      case 'ExtendedUint':
        param.eu = pd.UnitDescriptor;
        f = new CovFormatterNumeric(param);
        break;
      case 'BasicFloat':
        param.res = 2;
        f = new CovFormatterNumeric(param);
        break;
      case 'ExtendedReal':
        param.res = pd.Resolution;
        param.eu = pd.UnitDescriptor;
        f = new CovFormatterNumeric(param);
        break;
      case 'BasicUint64':
      case 'ExtendedUint64':
        param.res = pd.Resolution;
        f = new CovFormatterUInt64bit(param);
        break;

      case 'BasicInt64':
      case 'ExtendedInt64':
        param.res = pd.Resolution;
        f = new CovFormatterInt64bit(param);
        break;

      case 'BasicTime':
        f = new CovFormatterDateTime(param.locale);
        break;
      case 'ExtendedDateTime':
        f = new CovFormatterBACnetDateTime(param.locale, pd);
        break;

      case 'ExtendedDuration':
        f = new CovFormatterDuration(param.locale, pd);
        break;

      case 'BasicBit64':
      case 'ExtendedBitString64':
      case 'ExtendedBitString':
        f = new CovFormatterBitString();
        break;

      case 'BasicChar':
      case 'BasicString':
      case 'BasicBool':
      case 'BasicObjectOrPropertyId':
      case 'BasicLangText':
      case 'BasicBlob':
      case 'ExtendedEnum':
      case 'ExtendedBool':
      case 'ExtendedApplSpecific':
      case 'ExtendedComplex':
      default:
        f = new CovFormatterSimple();
        break;
    }
    return f;
  }

  private static isValueOk(v: ValueDetails): boolean {
    return v?.Value !== undefined && v?.Value !== null;
  }

  /*
     * Constructor
     * @summary Create a COV formatter for a specific data type
     *
     * @description
     * Create a COV formatter for a specific data type
     *
     * @param {string} locale - the user's locale
     * @param {string} propertyAbsentText - returned when property is absent
     * @param {string} comErrorText - returned when value has comm error
     * @param {PropertyDetails} pd - a description of the property
     *
     * @returns
     * An instance of CovFormatter that can format a value of the
     * type specified by the property description.
     *
     * @example
     * const locale: string = 'de-DE';
     * const propAbs: string = 'N/A';
     * const commErr: string = '#COM';
     * const pd: PropertyDetails = getPropertyDetails(); // property definition
     * const vd: ValueDetails = getValueDetails();       // COV
     * const cf: CovFormatter = new CovFormatter('de-DE', propAbs, commErr, pd);
     * const result: string = cf.format(vd);
     */
  public constructor(
    locale: string,
    private readonly propertyAbsentText: string,
    private readonly comErrorText: string,
    pd: PropertyDetails) {
    if (pd == null) {
      throw new Error('Property definition must be provided');
    }
    this.formatter = CovFormatter.factory(locale, pd);
  }

  /*
     * @name format
     * @summary Formats a COV into displayable text
     *
     * @description
     * Use this function to format a COV for the property type
     * as described in the factory call.
     *
     * @param {ValueDetails} value - the COV
     *
     * @returns {string} the formatted value
     *
     * Note that:
     * 1) If the incoming value is null/undefined the return value will be
     *    an empty string. Consider that this was a conscious design decision
     *    to do that rather than throw an exception.
     * 2) If the incoming value indicates that the property is absent, the
     *    return string will be the 'property absent text' argument provided
     *    to the constructor
     * 3) If the incoming value has bad quality the return string will be the
     *    'com error text' argument provided to the constructor
     * 4) The WSI does provide a display value that could be used in the case
     *    where the quality is not good, but we are handling all of that here.
     * 5) If the incoming value declares itself to contain an array of values,
     *    the formatter will:
     *    a) attempt to 'break' the array apart into individual values,
     *    b) format those values (per the property's type that was specified
     *       in the property details provided to the constructor),
     *    c) concatenate those values (separated by a space) into a single
     *       string.
     *    If the formatter cannot break the value apart, it falls back to
     *    trying to format the value 'as-is.'
     */
  public format(value: ValueDetails): string {
    let v = '';

    if (CovFormatter.isValueOk(value)) {
      if (value.Value.IsPropertyAbsent) {
        v = this.propertyAbsentText;
      } else if (!value.Value.QualityGood) {
        v = this.comErrorText;
      } else if (value.Value.Value) {
        if (value.IsArray) {
          v = this.processArray(value);
        } else {
          v = this.formatter.format(value);
        }
      }
    }
    return v;
  }

  // note here that we are not passing through the background color,
  // which is not part of the value details interface.
  // fortunately, we do not care about the color here, really only
  // the value/display value fields.
  private mkVd(vd: ValueDetails, v: string, dv: string): ValueDetails {
    /* eslint-disable */
    const nv: Value = Object.freeze({
      Value: v,
      DisplayValue: dv,
      Timestamp: vd.Value.Timestamp,
      QualityGood: true,
      Quality: vd.Value.Quality,
      IsPropertyAbsent: false
    }) as Value;
    return Object.freeze({
      DataType: vd.DataType,
      ErrorCode: vd.ErrorCode,
      SubscriptionKey: vd.SubscriptionKey,
      Value: nv,
      IsArray: false
    }) as ValueDetails;
    /* eslint-enable */
  }

  private breakApartArray(vd: ValueDetails): ValueDetails[] {
    let vds: ValueDetails[] = [];

    // we were told (by the value details) that the value contains
    // an array of values. if this is true, the json parser will
    // break it apart - if not, the parser will throw an exception.
    // in that case, we assume that the value details lied and we
    // fall back to using the value details 'as-is'
    //
    // note that a similar observation can be made about the
    // display value (should be an array but may not be)

    try {
      const vals: string[] = JSON.parse(vd.Value.Value).map(a => a.toString());
      let dvals: string[] = [];
      if (vd.Value.DisplayValue) {
        try {
          dvals = JSON.parse(vd.Value.DisplayValue).map(b => b.toString());
        } catch (e) {
          dvals = [vd.Value.DisplayValue];
        }
      }
      while (dvals.length < vals.length) {
        dvals.push('');
      }
      vds = vals.map((v, i) => this.mkVd(vd, v, dvals[i]));
    } catch (e) {
      vds = [vd];
    }

    return vds;
  }

  private processArray(vd: ValueDetails): string {
    return this.breakApartArray(vd)
      .map(a => this.formatter.format(a))
      .join(' ');
  }
}
