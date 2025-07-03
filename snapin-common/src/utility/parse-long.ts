import { isNullOrUndefined } from '@gms-flex/services-common';
import Long from 'long';

// These utility methods parse a string containing an integer value or array of integer values
// into a `Long` object (see long.js) without loss of precision of 64-bit signed/unsigned
// integer values that exceed the bounds of `Number.MIN_SAFE_INTEGER` && `Number.MAX_SAFE_INTEGER`.
//
// These methods should be used in place of JSON.parse() and parseInt() when the caller is
// aware that the data may include 64-bit integer values.

export const parseLong = (valueAsObj: any, isUnsigned?: boolean): Long => {
  let value: Long;
  if (!isNullOrUndefined(valueAsObj)) {
    try {
      if (typeof valueAsObj === 'string' || valueAsObj instanceof String) {
        const valueAsString: string = String(valueAsObj).trim();
        value = Long.fromString(valueAsString, isUnsigned);
      } else if (typeof valueAsObj === 'number' || valueAsObj instanceof Number) {
        const valueAsNumber = Number(valueAsObj);
        value = Long.fromNumber(valueAsNumber, isUnsigned);
      }
    } catch (e) {
      value = undefined;
    }
  }
  return value;
};

export const parseLongArr = (arrAsString: string, isUnsigned?: boolean): Long[] => {
  let valueArr: Long[];
  if (arrAsString) {
    const modString: string = arrAsString.replace('[', '').replace(']', '').trim(); // remove array brackets
    const valueAsStringArr: string[] = modString.split(/\s*,\s*/); // separate values into array of strings
    valueArr = valueAsStringArr.map(s => parseLong(s, isUnsigned));
  }
  return valueArr;
};
