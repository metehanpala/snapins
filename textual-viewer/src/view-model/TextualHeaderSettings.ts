import { HeaderData } from '../textual-viewer-data.model';

export class TextualHeaderSettings {

  private static readonly headerSeparator: string = ';';
  private static readonly propertySeparator: string = '.';

  /*
     * @summary
     * Create a string representing headers.
     *
     * @description
     * Creates a string for each header and then concatenates those
     * strings, separated by a semi-colon.
     *
     * @param {HeaderData[]} hdrs - a list of headers
     *
     * @returns
     * Returns a string representing the headers.
     */
  public static toString(hdrs: HeaderData[]): string {
    let s = '';
    if (hdrs != null && hdrs.length > 0) {
      s = hdrs.map(h => this.headerToString(h))
        .filter(a => a)
        .join(TextualHeaderSettings.headerSeparator);
    }
    return s;
  }

  /*
     * @summary
     * Create an array of headers from a string.
     *
     * @description
     * Parses the string for an array of headers
     *
     * @param {string} s - a string that represents 0+ headers
     *
     * @returns
     * An array of headers; the array may be empty, and will not
     * contain any undefined or null headers. Note that this means
     * that an individual header string (whre the headers in the
     * string are separated by semi-colons) will be ignored.
     */
  public static fromString(s: string): HeaderData[] {
    let hdrs: HeaderData[] = [];
    if (s) {
      hdrs = s.split(TextualHeaderSettings.headerSeparator)
        .map(a => this.headerFromString(a))
        .filter(b => b != null);
    }
    return hdrs;
  }

  /*
     * Create a new header data instance from two instances: the
     * "original" instance is the base and "toMerge" instance
     * will be copied on to the original instance property values.
     * Note that we only transfer over a few of the many properties.
     *
     * Also: if the original header is null/undefined the return value
     * will be undefined. if the toMerge header is null/undefined then
     * a copy of the original header will be returned (not same instance!)
     */
  public static mergeHeaders(original: HeaderData, toMerge: HeaderData): HeaderData {
    let h: HeaderData;
    if (original != null) {
      h = new HeaderData(original.id);
      h.label = original.label;
      h.configButton = original.configButton;
      h.headerIconClass = original.headerIconClass;
      h.minColWidth = original.minColWidth;
      h.showLabel = original.showLabel;
      h.styleClasses = original.styleClasses;
      h.columnType = original.columnType;
      h.isFixedSize = original.isFixedSize;
      h.widthPercentage = original.widthPercentage;
      h.hideResize = original.hideResize;
      h.smallScreenOrder = original.smallScreenOrder;
      h.columnGroup = original.columnGroup;
      h.size = original.size;
      h.columnVisible = original.columnVisible;
      h.showfilter = original.showfilter;
      h.allowHiding = original.allowHiding;
      h.width = original.width;
      if (toMerge != null) {
        h.columnVisible = toMerge.columnVisible;
        h.showfilter = toMerge.showfilter;
        h.allowHiding = toMerge.allowHiding;
      }
    }
    return h;
  }

  private static headerToString(hd: HeaderData): string {
    let s = '';
    if (hd != null) {
      s = /* 00 */ hd.id + TextualHeaderSettings.propertySeparator +
      /* 01 */ hd.label + TextualHeaderSettings.propertySeparator +
      /* 02 */ hd.showLabel + TextualHeaderSettings.propertySeparator +
      /* 03 */ hd.showfilter + TextualHeaderSettings.propertySeparator +
      /* 04 */ hd.size + TextualHeaderSettings.propertySeparator +
      /* 05 */ hd.styleClasses + TextualHeaderSettings.propertySeparator +
      /* 06 */ hd.columnType + TextualHeaderSettings.propertySeparator +
      /* 07 */ hd.columnVisible + TextualHeaderSettings.propertySeparator +
      /* 08 */ hd.minColWidth + TextualHeaderSettings.propertySeparator +
      /* 09 */ hd.headerIconClass + TextualHeaderSettings.propertySeparator +
      /* 10 */ hd.configButton + TextualHeaderSettings.propertySeparator +
      /* 11 */ hd.smallScreenOrder + TextualHeaderSettings.propertySeparator +
      /* 12 */ hd.columnGroup + TextualHeaderSettings.propertySeparator +
      /* 13 */ hd.allowHiding + TextualHeaderSettings.propertySeparator +
      /* 14 */ hd.isFixedSize + TextualHeaderSettings.propertySeparator +
      /* 15 */ hd.hideResize + TextualHeaderSettings.propertySeparator +
      /* 16 */ hd.widthPercentage;
    }
    return s;
  }

  private static headerFromString(s: string): HeaderData {
    let hdr: HeaderData;

    if (s) {
      const props: string[] = s.split(TextualHeaderSettings.propertySeparator);

      if (props.length === 17) {
        hdr = new HeaderData(props[0]);
        hdr.label = props[1];
        hdr.showLabel = props[2] === 'true' ? true : false;
        hdr.showfilter = props[3] === 'true' ? true : false;
        hdr.columnVisible = props[7] === 'true' ? true : false;
        hdr.allowHiding = props[13] === 'true' ? true : false;
        hdr.isFixedSize = props[14] === 'true' ? true : false;
        hdr.hideResize = props[15] === 'true' ? true : false;
      }
    }

    return hdr;
  }
}
