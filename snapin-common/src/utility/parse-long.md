# Parsing 64-bit Integer Values <a name="Parsing64Bit"></a>

To parse strings representing a 64-bit integer value or array of 64-bit integer values without loss of precision, the following methods can be used:

Method Syntax|Description
:---|:---
`parseLong(string[, boolean]): Long` | Parse a string representing a 64-bit integer value to a `Long` object.<br>If the optional `boolean` parameter value is `true`, the string will be parsed as an unsigned value; otherwise, the value will be parsed as signed.
`parseLongArr(string[, boolean]): Long[]` | Parse a string representing an array of 64-bit integer values to a `Long[]`.<br>If the optional `boolean` parameter value is `true`, the string will be parsed as an array of unsigned values; otherwise, the values will be parsed as signed.

## Usage

Import these methods in the file where they will be used.  Additionally, import the `Long` type from the 3rd party [long.js](https://www.npmjs.com/package/long) library.

```javascript
import { parseLong, parseLongArr } from "@gms-flex/snapin-common";

// tslint:disable-next-line
const Long: any = require("long");
```

Reference the `long.js` package types in the `devDependencies` section of your project's `package.json` file.

```json
"devDependencies": {
  "@types/long": "4"
}
```

## Background

When parsing a string containing a 64-bit integer value using the standard [parseInt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt) or [JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) methods, the value will be parsed to a JavaScript `number`.  While this will work, 64-bit integer values will be subject to a loss of precision due to [limitations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER#Description) of JavaScript's internal representation of numeric values.

In the WSI, 64-bit values and arrays of 64-bit values are typically represented in JSON as strings.  When passed in COVs through a value subscription, for example, property values arrive in the snap-in as string-type properties inside some larger JS object like this:

```javascript
{
  Value: "9223372036854775807",
  ...
}
```
and array values like this:

```javascript
{
  Value: "[-9223372036854775808, 0, 9223372036854775807]"
  ...
}
```

Parsing these string values using `parseInt()` or `JSON.parse()` will result in a `number` and `number[]` respecively and result in a loss of precision as seen here:

```javascript
> var x = parseInt("9223372036854775807")
> console.log(x, typeof x)
9223372036854776000 "number"

> var xArr = JSON.parse("[-9223372036854775808, 0, 9223372036854775807]")
> console.log(xArr, typeof xArr[0])
[-9223372036854776000, 0, 9223372036854776000] "number"
```

To avoid this, the common `parseLong()` and `parseLongArr()` methods can be used to transform these strings to an object of type `Long` (or an array of `Long` objects) instead of a `number`.

## 3rd Party Library Dependency (`long.ts`)

These methods depend on the `Long` object type provided in the `long.js` 3rd party library.  Refer to [library documentation](https://www.npmjs.com/package/long) for details of operations available on this type.

## Usage Notes

### Use only where necessary

Since these methods require a dependency on a 3rd party type and further apply only to integer values (not floating point values), use of them should be restricted to cases where the caller *knows* the value encoded in the string is an integer (signed or unsigned) in the 64-bit range.

For GMS property values, for example, use of these parsing methods can be restricted to property values known to be from one of the following native property types (as reported as part of the property definition):

+ `BasicInt64`
+ `BasicUint64`
+ `BasicBit64`
+ `ExtendedInt64`
+ `ExtendedUint64`
+ `ExtendedBitString64`

### 64-bit integer values as numeric data in JSON

There are cases where the WSI transmits 64-bit integer values as numbers, not strings.  One example is the Min and Max values assigned to property command parameters of 64-bit properties.

In these cases, the data transmitted by the server is transformed into a JavaScript object in the lower `gms-services` layer of the FlexClient using generic parsing logic.  In this layer, application specific information about the value being parsed is not available, so no determination can be made about whether to parse it to a `number` or a `Long`.  As a result, such values will be parsed as `numbers`--successfully, but subject to data loss.

### JavaScript *BigInt* type

The latest JavaScript documentation [specifies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) a `BigInt` built-in object type to support 64-bit integers.  However, at the time of the writing, it is new to the language specification and has limited browser support (currently not supported in Safari or Edge, for example).

When this type is better established, it should allow for the `Long` object type to be deprecated and the eventual removal of the `long.js` 3rd party library dependency.

