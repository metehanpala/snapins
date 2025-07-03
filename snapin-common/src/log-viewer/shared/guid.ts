/* eslint-disable no-bitwise */
// @dynamic
export class Guid {
  public static newGuid(): string {
    // Usage:
    // let guid: Guid = Guid.newGuid();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string): string => {
      const r: number = Math.random() * 16 | 0;
      const v: number = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
