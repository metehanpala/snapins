// Whole-script strict mode syntax
/* jslint node: true */
'use strict';

import { PropertyDetails, Value, ValueDetails } from '@gms-flex/services';
import { CovFormatter } from './cov-formatter';

/*
 * development notes:
 * 1) we are only interested here in making sure that the formatting class
 *    is 'hooked up' correctly to the proper "format helper" class(es) and
 *    that it handles the edge cases for COV values (quality, etc)
 *    since those cases are what the formatting class is supposed to do.
 * 2) the order of the tests: extended data types first, then basic,
 *    then unknown.
 * 3) extended enum / date/time / real used to test arrays of values
 * 4) used extended int to check various combinations of null/undefined values
 */

describe('CovFormatter', () => {

  const propAbs = 'N/A';
  const comErr = '#COM';
  const locale = 'en-US';
  const propName = 'Name';

  // bad constructor calls

  it('Constructor: null property details', () => {
    expect(() => new CovFormatter(locale, propAbs, comErr, null)).toThrow();
  });

  it('Constructor: undefined property details', () => {
    expect(() => new CovFormatter(locale, propAbs, comErr, undefined)).toThrow();
  });

  // extended data types

  it('ExtendedApplSpecific: simple test', () => {
    const dt = 'ExtendedApplSpecific';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('ExtendedBitString: simple test', () => {
    const dt = 'ExtendedBitString';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', '["one", "two", "three"]');
    const fv: string = cf.format(vd);
    expect(fv).toBe('three two one');
  });
  it('ExtendedBitString: empty display string', () => {
    const dt = 'ExtendedBitString';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', '');
    const fv: string = cf.format(vd);
    expect(fv).toBe('RawString');
  });
  it('ExtendedBitString: empty list of display strings', () => {
    const dt = 'ExtendedBitString';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', '[]');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });

  it('ExtendedBool: simple test', () => {
    const dt = 'ExtendedBool';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('ExtendedDateTime: basic date and time', () => {
    const dt = 'ExtendedDateTime';
    const d = 3;
    const r = 1;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 2019.03.26 3:25.42.66 PM (default is tenths of seconds)
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3/26/2019 3:25:42.7 PM');
  });
  it('ExtendedDateTime: date only', () => {
    const dt = 'ExtendedDateTime';
    const d = 1;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    pd.BACnetDateTimeDetail = 1;
    // 2019.03.26 3:25.42.66 PM (default is tenths of seconds)
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3/26/2019');
  });
  it('ExtendedDateTime: date only, blank value', () => {
    const dt = 'ExtendedDateTime';
    const d = 1;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    pd.BACnetDateTimeDetail = 1;
    const vd: ValueDetails = getValueDetails(dt, '', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedDateTime: date only, invalid value', () => {
    const dt = 'ExtendedDateTime';
    const d = 1;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    pd.BACnetDateTimeDetail = 1;
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedDateTime: time only, seconds', () => {
    const dt = 'ExtendedDateTime';
    const d = 2;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 2019.03.26 3:25.42.66 PM (default is tenths of seconds)
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3:25:42 PM');
  });
  it('ExtendedDateTime: time only, tenths of a second', () => {
    const dt = 'ExtendedDateTime';
    const d = 2;
    const r = 1;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 2019.03.26 3:25.42.66 PM (default is tenths of seconds)
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3:25:42.7 PM');
  });
  it('ExtendedDateTime: time only, hundredths of a second', () => {
    const dt = 'ExtendedDateTime';
    const d = 2;
    const r = 2;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 2019.03.26 3:25.42.66 PM (default is tenths of seconds)
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3:25:42.66 PM');
  });
  it('ExtendedDateTime: unspecified detail', () => {
    const dt = 'ExtendedDateTime';
    const d = 4; // 1 - 3 is valid range
    const r = 1;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 2019.03.26 3:25.42.66 PM (default is tenths of seconds)
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3/26/2019 3:25:42.7 PM'); // defaults to d + t
  });
  it('ExtendedDateTime: time only, unspecified resolution', () => {
    const dt = 'ExtendedDateTime';
    const d = 2;
    const r = 3; // 0 - 2 is valid range
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 2019.03.26 3:25.42.66 PM
    const vd: ValueDetails = getValueDetails(dt, '1190326F15254266', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('3:25:42.66 PM'); // defaults to hundredths
  });
  it('ExtendedDateTime: date only - array of one value', () => {
    const dt = 'ExtendedDateTime';
    const rs = '["1190326F15254266"]';
    const ds = '["DisplayString"]';
    const d = 1;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    pd.BACnetDateTimeDetail = 1;
    const vd: ValueDetails = getValueDetails(dt, rs, ds, true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('3/26/2019');
  });
  it('ExtendedDateTime: date only - array of three values', () => {
    const dt = 'ExtendedDateTime';
    const rs = '["1190326F15254266", "1190325F15254266", "1190324F15254266"]';
    const ds = '["DisplayString"]';
    const d = 1;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    pd.BACnetDateTimeDetail = 1;
    const vd: ValueDetails = getValueDetails(dt, rs, ds, true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('3/26/2019 3/25/2019 3/24/2019');
  });
  it('ExtendedDateTime: date only - array of three values, middle one blank', () => {
    const dt = 'ExtendedDateTime';
    const rs = '["1190326F15254266", "", "1190324F15254266"]';
    const ds = '["DisplayString"]';
    const d = 1;
    const r = 0;
    const pd: PropertyDetails = getPDForBacnetDateTime(propName, d, r);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    pd.BACnetDateTimeDetail = 1;
    const vd: ValueDetails = getValueDetails(dt, rs, ds, true);
    const fv: string = cf.format(vd);
    // NOTE! two blanks since the middle value is empty
    expect(fv).toBe('3/26/2019  3/24/2019');
  });

  // duration

  // some useful numbers:
  // 3 d + 12 h + 42 m        =   5082 m
  // 3 d + 12 h + 42 m + 30 s = 304950 s

  // units: 1 (day), 2 (hr), 3 (m), 4 (s), 5 (ds), 6 (cs), 7 (ms)
  // format: 0 (none), 1 ("D.FFF"), 2 ("D:h.FFF"), 3 ("D:hh:mm.FFF"),
  //         4 ("D:hh:mm:ss.FFF"), 5 ("D:hh:mm:ss.fff"), 6 ("H.FFF"),
  //         7 ("H:mm.FFF"), 8 ("H:mm:ss.FFF"), 9 ("H:mm:ss.fff")
  //         10 ("M.FFF"), 11 ("M:ss.FFF"), 12 ("M:ss.fff"),
  //         13 ("S.FFF"), 14 ("S.fff")
  //
  // reminders:
  // 1) single capital letter means "this and above"
  // 2) "FFF" means include only if non-zero
  // 3) "fff" means always include

  it('ExtendedDuration: data driven tests', () => {
    const dt = 'ExtendedDuration';
    const data: any = [
      { units: 1, format: 1, val: 'Raw', expected: '' }, // invalid value
      { units: 1, format: 1, val: '42', expected: '42' },
      { units: 1, format: 2, val: '42', expected: '42:0' },
      { units: 2, format: 1, val: '48', expected: '2' },
      { units: 2, format: 1, val: '60', expected: '2.500' },
      { units: 3, format: 3, val: '5082', expected: '3:12:42' },
      { units: 3, format: 6, val: '5082', expected: '84.700' },
      { units: 3, format: 7, val: '80', expected: '1:20' },
      { units: 3, format: 13, val: '10', expected: '600' },
      { units: 3, format: 0, val: '42', expected: '42' }, // format: none
      { units: 3, format: 15, val: '42', expected: '42' }, // unknown format
      { units: 4, format: 3, val: '304950', expected: '3:12:42.500' },
      { units: 4, format: 4, val: '304950', expected: '3:12:42:30' },
      { units: 4, format: 5, val: '304950', expected: '3:12:42:30.000' },
      { units: 4, format: 8, val: '304950', expected: '84:42:30' },
      { units: 4, format: 9, val: '304950', expected: '84:42:30.000' },
      { units: 4, format: 10, val: '825', expected: '13.750' },
      { units: 5, format: 13, val: '825', expected: '82.500' },
      { units: 5, format: 14, val: '825', expected: '82.500' },
      { units: 6, format: 14, val: '8250', expected: '82.500' },
      { units: 7, format: 10, val: '822678', expected: '13.711' },
      { units: 7, format: 11, val: '822000', expected: '13:42' },
      { units: 7, format: 11, val: '822678', expected: '13:42.678' },
      { units: 7, format: 12, val: '822678', expected: '13:42.678' },
      { units: 8, format: 12, val: '42', expected: '42' } // unknown units
    ];

    data.forEach(d => {
      const pd: PropertyDetails = getPDForDuration(propName, d.units, d.format);
      const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
      const vd: ValueDetails = getValueDetails(dt, d.val, 'DisplayString');
      const fv: string = cf.format(vd);
      expect(fv).toBe(d.expected, `Units: ${d.units} Format: ${d.format} Value: ${d.val}`);
    });
  });

  // separate check just to make sure units is included

  it('ExtendedDuration: simple test with engrg units', () => {
    // note that the "get prop details" fcn defaults to what we test for
    const units = 'M.ss.fff';
    const dt = 'ExtendedDuration';
    const u = 7; // ms
    const f = 12; // m + s + ms
    const pd: PropertyDetails = getPDForDuration(propName, u, f);
    pd.UnitDescriptor = units;
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    // 822678 = 13 min + 42 sec + 678 ms
    const vd: ValueDetails = getValueDetails(dt, '822678', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('13:42.678 ' + units);
  });

  it('ExtendedEnum: simple test', () => {
    const dt = 'ExtendedEnum';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });
  it('ExtendedEnum: array with one value', () => {
    const dt = 'ExtendedEnum';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '["RawString"]', '["DisplayString"]', true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });
  it('ExtendedEnum: array with three value', () => {
    const dt = 'ExtendedEnum';
    const rs = '["rs1", "rs2", "rs3"]';
    const ds = '["ds1", "ds2", "ds3"]';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, rs, ds, true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('ds1 ds2 ds3');
  });
  it('ExtendedEnum: array with two raw values one display value', () => {
    const dt = 'ExtendedEnum';
    const rs = '["rs1", "rs2"]';
    const ds = '["ds1"]';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, rs, ds, true);
    const fv: string = cf.format(vd);
    // note: only ONE display value, so the second one reverts to using
    // the raw value (and returns it "as is")
    expect(fv).toBe('ds1 rs2');
  });
  it('ExtendedEnum: array with two raw values display value invalid', () => {
    const dt = 'ExtendedEnum';
    const rs = '["rs1", "rs2"]';
    const ds = '';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, rs, ds, true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('rs1 rs2');
  });

  it('ExtendedInt: simple test', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '1234.123', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('1,234'); // thousands separator!
  });
  it('ExtendedInt: simple test with units', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '1234.123', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('1,234 MyUnits'); // thousands separator!
  });
  it('ExtendedInt: null value details', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const fv: string = cf.format(null);
    expect(fv).toBe('');
  });
  it('ExtendedInt: undefined value details', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const fv: string = cf.format(undefined);
    expect(fv).toBe('');
  });
  it('ExtendedInt: null value in value details', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '1234.123', 'DisplayString');
    vd.Value = null;
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedInt: undefined value in value details', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '1234.123', 'DisplayString');
    vd.Value = undefined;
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedInt: non-numeric value', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedInt: blank value', () => {
    const dt = 'ExtendedInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'MyUnits';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });

  it('ExtendedReal: simple test', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123.454', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.45');
  });
  it('ExtendedReal: simple test with larger resolution', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.Resolution = 4;
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123.45', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.4500');
  });
  it('ExtendedReal: simple test with units', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'DegF';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123.454', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.45 DegF');
  });
  it('ExtendedReal: non-numeric raw value with units', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'DegF';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedReal: blank value', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedReal: blank value with units', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.UnitDescriptor = 'DegF';
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('ExtendedReal: property absent', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    vd.Value.IsPropertyAbsent = true;
    const fv: string = cf.format(vd);
    expect(fv).toBe(propAbs);
  });
  it('ExtendedReal: communication error', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', comErr);
    vd.Value.QualityGood = false;
    const fv: string = cf.format(vd);
    expect(fv).toBe(comErr);
  });
  it('ExtendedReal: communication error (null display value)', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', null);
    vd.Value.QualityGood = false;
    const fv: string = cf.format(vd);
    expect(fv).toBe(comErr);
  });
  it('ExtendedReal: communication error (undefined display value)', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', undefined);
    vd.Value.QualityGood = false;
    const fv: string = cf.format(vd);
    expect(fv).toBe(comErr);
  });
  it('ExtendedReal: communication error (blank display value)', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', '');
    vd.Value.QualityGood = false;
    const fv: string = cf.format(vd);
    expect(fv).toBe(comErr);
  });
  it('ExtendedReal: array of 1 numeric value', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.Resolution = 1;
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '[123.43]', '["DisplayString"]', true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.4');
  });
  it('ExtendedReal: array of 3 numeric values', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.Resolution = 1;
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '[123.43,234.33,345.73]', '["DisplayString"]', true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.4 234.3 345.7');
  });
  it('ExtendedReal: array of 3 numeric values, middle one a string', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.Resolution = 1;
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '[123.43,"a",345.73]', '["DisplayString"]', true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.4  345.7');
  });
  it('ExtendedReal: array of 3 numeric values, middle one empty', () => {
    const dt = 'ExtendedReal';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    pd.Resolution = 1;
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '[123.43,,345.73]', '["DisplayString"]', true);
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });

  it('ExtendedUint: simple test', () => {
    const dt = 'ExtendedUint';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '1234.123', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('1,234'); // thousands separator!
  });

  // basic data types

  it('BasicBlob: simple test', () => {
    const dt = 'BasicBlob';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('BasicBool: simple test', () => {
    const dt = 'BasicBool';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('BasicChar: simple test', () => {
    const dt = 'BasicChar';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('BasicFloat: simple test', () => {
    const dt = 'BasicFloat';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123.454332', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('123.45'); // def res for basic float is 2
  });
  it('BasicFloat: invalid value', () => {
    const dt = 'BasicFloat';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });

  it('BasicInt: simple test', () => {
    const dt = 'BasicInt';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123456.123', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('123,456');
  });

  it('BasicLangText: simple test', () => {
    const dt = 'BasicLangText';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('BasicObjectOrPropertyId: simple test', () => {
    const dt = 'BasicObjectOrPropertyId';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });

  it('BasicString: valid display string', () => {
    const dt = 'BasicString';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });
  it('BasicString: null display string', () => {
    const dt = 'BasicString';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', null);
    const fv: string = cf.format(vd);
    expect(fv).toBe('RawString');
  });
  it('BasicString: undefined display string', () => {
    const dt = 'BasicString';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', undefined);
    const fv: string = cf.format(vd);
    expect(fv).toBe('RawString');
  });

  // don't forget:
  // 1) month in Date is zero based
  // 2) Date to locale string does NOT include ms so will always be zero
  it('BasicTime: simple test', () => {
    const dt = 'BasicTime';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vl: Date = new Date(2015, 4, 25, 10, 11, 12, 456);
    const vd: ValueDetails = getValueDetails(dt, vl.toLocaleString(), 'DisplayString');
    const fv: string = cf.format(vd);
    // expect(fv).toBe('5/25/2015 10:11:12.000 AM');
  });
  it('BasicTime: blank value', () => {
    const dt = 'BasicTime';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });
  it('BasicTime: invalid string for value', () => {
    const dt = 'BasicTime';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'RawString', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('');
  });

  it('BasicUint: simple test', () => {
    const dt = 'BasicUint';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123456.345', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('123,456');
  });

  // any other "unknown" data type should just echo back the display value (or value)

  it('Unknown data type: simple test', () => {
    const dt = 'unknown';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, '123', 'DisplayString');
    const fv: string = cf.format(vd);
    expect(fv).toBe('DisplayString');
  });
  it('Unknown data type: null display value', () => {
    const dt = 'unknown';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'ValueString', null);
    const fv: string = cf.format(vd);
    expect(fv).toBe('ValueString');
  });
  it('Unknown data type: undefined display value', () => {
    const dt = 'unknown';
    const pd: PropertyDetails = getPropertyDetails(propName, dt);
    const cf: CovFormatter = new CovFormatter(locale, propAbs, comErr, pd);
    const vd: ValueDetails = getValueDetails(dt, 'ValueString', undefined);
    const fv: string = cf.format(vd);
    expect(fv).toBe('ValueString');
  });
});

/* eslint-disable */

// bacnet date/time cheat sheet:
// detail
// 1: BACnetDateTimeDetail.DateOnly;
// 2: BACnetDateTimeDetail.TimeOnly;
// 3: BACnetDateTimeDetail.DateAndTime;
// resolution
// 0: BACnetDateTimeResolution.Seconds;
// 1: BACnetDateTimeResolution.Tenths;
// 2: BACnetDateTimeResolution.Hundredths;
const getPDForBacnetDateTime = (name: string, d: number, r: number): PropertyDetails => ({
  PropertyName: name,
  Descriptor: 'descriptor1',
  IsArray: false,
  Min: 'min1',
  Max: 'max1',
  Order: 1,
  Resolution: 2,
  UnitDescriptor: '',
  UnitId: 3,
  BACnetDateTimeDetail: d, // date + time
  BACnetDateTimeResolution: r, // tenths
  DurationValueUnits: 7, // duration in ms
  DurationDisplayFormat: 12, // M.ss.fff
  Usage: 3,
  Type: 'ExtendedDateTime',
  Value: undefined
} as PropertyDetails);

// duration cheat sheet:
// units
// 1: // day
// 2: // hour
// 3: // minutes
// 4: // seconds
// 5: // deciseconds (“tenths of a second”)
// 6: // centiseconds (“hundredths of a second”)
// 7: // milliseconds
// display format
// 0: // none
// 1: // day = "D.FFF"
// 2: // day + hr = "D:h.FFF"
// 3: // day + hr + min = "D:hh:mm.FFF"
// 4: // day + hr + min + sec = "D:hh:mm:ss.FFF"
// 5: // day + hr + min + sec + milliseconds = "D:hh:mm:ss.fff"
// 6: // hour = "H.FFF"
// 7: // hr + min = "H:mm.FFF"
// 8: // hr + min + sec = "H:mm:ss.FFF"
// 9: // hr + min + sec + ms = "H:mm:ss.fff"
// 10: // min = "M.FFF"
// 11: // min + sec = "M:ss.FFF"
// 12: // min + sec + milliseconds = "M:ss.fff"
// 13: // sec = "S.FFF"
// 14: // sec + milliseconds = "S.fff";
const getPDForDuration = (name: string, u: number, f: number): PropertyDetails => ({
  PropertyName: name,
  Descriptor: 'descriptor1',
  IsArray: false,
  Min: 'min1',
  Max: 'max1',
  Order: 1,
  Resolution: 2,
  UnitDescriptor: '',
  UnitId: 3,
  BACnetDateTimeDetail: 3,
  BACnetDateTimeResolution: 1,
  DurationValueUnits: u,
  DurationDisplayFormat: f,
  Usage: 3,
  Type: 'ExtendedDuration',
  Value: undefined
} as PropertyDetails);

const getPropertyDetails = (name: string, dt: string): PropertyDetails => ({
  PropertyName: name,
  Descriptor: 'descriptor1',
  IsArray: false,
  Min: 'min1',
  Max: 'max1',
  Order: 1,
  Resolution: 2,
  UnitDescriptor: '',
  UnitId: 3,
  BACnetDateTimeDetail: 3, // date + time
  BACnetDateTimeResolution: 1, // tenths
  DurationValueUnits: 6, // duration in ms (+1?)
  DurationDisplayFormat: 12, // M.ss.fff
  Usage: 3,
  Type: dt,
  Value: undefined
});

const getLowLevelValue = (val: string, dv: string): Value => {
  const ts: string = new Date().toLocaleString();
  return {
    Value: val, // string;
    DisplayValue: dv, // string;
    Timestamp: ts, // string;
    QualityGood: true, // boolean;
    Quality: undefined, // string;
    IsPropertyAbsent: false // boolean;
  };
};

const getValueDetails = (dt: string, val: string, dv: string, isValueAnArray: boolean = false): ValueDetails => ({
  DataType: dt,
  ErrorCode: 0,
  SubscriptionKey: 0,
  Value: getLowLevelValue(val, dv),
  IsArray: isValueAnArray
});

/* eslint-disable */
