import { isNullOrUndefined } from '@gms-flex/services-common';

/**
 * Class containing common view-model static helper methods and variables.
 * NOTE: `abstract` keyword is intended only to help enforce the static nature of this class.
 */
export abstract class Common {

  // Key value user at server to store more recently selected view (a.k.a. hierarchy)
  public static readonly userSettingsLastSelectedView: string = 'Web_SystemBrowser_SelectedHierarchy';

  public static readonly transparentIcon: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

  public static isObjectTypeValid(typeId: number): boolean {
    // If object type is unassigned at the server, its value will be -1 stored
    // as a 16-bit signed int and passed by the WSI as unsigned integer (65535).
    return (!isNaN(typeId) && typeId !== 65535);
  }

  public static localeCompareSafe(locale: string, x: string, y: string, opt?: Intl.CollatorOptions): number {
    // NOTE: This method catches exceptions thrown in certain browser environments when
    //  invalid or unknown locale strings are used in the string.localeCompare function
    //  and applies fallback comparison logic.

    let cmpVal = 0;
    if (isNullOrUndefined(x)) {
      return isNullOrUndefined(y) ? 0 : -1;
    }
    if (isNullOrUndefined(y)) {
      return 1;
    }
    try {
      cmpVal = x.localeCompare(y, locale, opt);
    } catch (e) {
      try {
        cmpVal = x.localeCompare(y, undefined, opt);
      } catch (f) {
        const xAlt: string = !(opt?.sensitivity) ? x.toLowerCase() : x;
        const yAlt: string = !(opt?.sensitivity) ? y.toLowerCase() : y;
        if (xAlt === yAlt) {
          cmpVal = 0;
        } else {
          cmpVal = xAlt < yAlt ? -1 : 1;
        }
      }
    }
    return cmpVal;
  }

}
