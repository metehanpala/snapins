import { BrowserObject, ObjectAttributes } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';

export class CompareBrowserObjects {
  public static sameObject(b1: BrowserObject, b2: BrowserObject): boolean {
    let isSame = false;
    if (b1 === undefined || b1 === null) {
      isSame = b2 === undefined || b2 === null;
    } else if (b2 === null || b2 === undefined) {
      isSame = false;
    } else {
      const b1Alias: string = b1.Attributes ? b1.Attributes.Alias : undefined;
      const b2Alias: string = b2.Attributes ? b2.Attributes.Alias : undefined;

      isSame =
                b1.Descriptor === b2.Descriptor &&
                b1.Designation === b2.Designation &&
                b1.Name === b2.Name &&
                b1.Location === b2.Location &&
                b1.ObjectId === b2.ObjectId &&
                b1.SystemId === b2.SystemId &&
                b1.ViewId === b2.ViewId &&
                b1Alias === b2Alias;
    }
    return isSame;
  }

  public static sameCollection(c1: BrowserObject[], c2: BrowserObject[]): boolean {
    let isSame = false;
    if (this.isEmpty(c1)) {
      isSame = this.isEmpty(c2);
    } else if (this.isEmpty(c2)) {
      isSame = false;
    } else if (c1.length !== c2.length) {
      isSame = false;
    } else {
      isSame = c1.every(
        (v, i) => c2.find(f => this.sameObject(f, v)) !== undefined
      );
    }
    return isSame;
  }

  private static isEmpty(c: BrowserObject[]): boolean {
    return isNullOrUndefined(c) || c.length === 0;
  }
}
