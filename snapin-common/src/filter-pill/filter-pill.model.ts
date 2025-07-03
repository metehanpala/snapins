import { isNullOrUndefined } from '@gms-flex/services-common';

export class FilterPillData {
  public constructor(
    private readonly _filterId: any,
    private readonly _icons: boolean,
    private readonly _title: string,
    private readonly _values: string[]) {
  }

  public get filterId(): any {
    return this._filterId;
  }
  public get title(): string {
    return this._title;
  }
  public get icons(): boolean {
    return this._icons;
  }
  public get values(): string[] {
    return this._values;
  }
  public get valuesCount(): number {
    return !isNullOrUndefined(this._values) ? this._values.length : 0;
  }
}
