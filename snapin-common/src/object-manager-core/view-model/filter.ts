import { TextEntry } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { Observable, Subject } from 'rxjs';

export enum PatternNamespaceType {
  CnsDisplayName = 0,
  CnsName = 1,
  DpAlias = 2
}

interface TextEntryRef {
  value: number;
  subRefs: TextEntryRef[];
}

export enum FilterSetting {
  Pattern = 0,
  PatternNamespace,
  SelectionScope,
  ObjectType,
  Discipline,
  AlarmSuppression
}

export class Filter {

  public customData: any; // NOT serialized!!
  private pat: string;
  private ns: PatternNamespaceType;
  private within: boolean;
  private alarmSup: boolean;
  private disciplineArr: TextEntry[];
  private objectTypeArr: TextEntry[];
  private changeNotificationDisabled: boolean;
  private readonly filterChangedInd: Subject<void>;

  public get pattern(): string {
    return this.pat || '';
  }

  public set pattern(pat: string) {
    const patVal: string = pat && pat.length > 0 ? pat : undefined;
    if (this.pat === patVal) {
      return;
    }
    this.pat = patVal;
    this.notifyFilterChanged();
  }

  public get patternNamespace(): PatternNamespaceType {
    return this.ns;
  }

  public set patternNamespace(ns: PatternNamespaceType) {
    if (this.ns === ns) {
      return;
    }
    this.ns = ns;
    this.notifyFilterChanged();
  }

  public get isWithinSelection(): boolean {
    return this.within;
  }

  public set isWithinSelection(flag: boolean) {
    if (this.within === flag) {
      return;
    }
    this.within = flag;
    this.notifyFilterChanged();
  }

  public get isAlarmSuppression(): boolean {
    return this.alarmSup ? true : undefined;
  }

  public set isAlarmSuppression(flag: boolean) {
    // NOTE: Alarm-suppression is a 3-state filter:
    //  undefined = show all points, alarm suppression enabled or disabled
    //  false = show only points with alarm suppression disabled
    //  true = show only points with alarm suppression enabled
    // The current UI, which uses a check-box, represents only the `undefined` state (check-box clear) and
    // the `true` state (check-box checked).  There is no way to specify the `false` state in the current UI.
    // For this reason, we coerce a value of false to undefined in this setter.
    const flagVal: boolean = flag ? true : undefined;
    if (this.alarmSup === flagVal) {
      return;
    }
    this.alarmSup = flagVal;
    this.notifyFilterChanged();
  }

  public get disciplines(): TextEntry[] {
    return this.disciplineArr;
  }

  public set disciplines(arr: TextEntry[]) {
    const arrVal: TextEntry[] = arr && arr.length > 0 ? arr.slice(0) : undefined;
    if (TextEntry.isEqualArr(this.disciplineArr, arrVal)) {
      return;
    }
    this.disciplineArr = arrVal;
    this.notifyFilterChanged();
  }

  public get objectTypes(): TextEntry[] {
    return this.objectTypeArr;
  }

  public set objectTypes(arr: TextEntry[]) {
    const arrVal: TextEntry[] = arr && arr.length > 0 ? arr.slice(0) : undefined;
    if (TextEntry.isEqualArr(this.objectTypeArr, arr)) {
      return;
    }
    this.objectTypeArr = arrVal;
    this.notifyFilterChanged();
  }

  public get filterChanged(): Observable<void> {
    return this.filterChangedInd;
  }

  public static textEntryArrAsStringArr(arr: TextEntry[]): string[] {
    const values: string[] = [];
    if (!isNullOrUndefined(arr)) {
      for (const e of arr) {
        if (!isNullOrUndefined(e.subText) && e.subText.length > 0) {
          e.subText.forEach(subT => values.push(subT.text));
        } else {
          values.push(e.text);
        }
      }
    }
    return values;
  }

  public static isPatternAll(p: string): boolean {
    if (isNullOrUndefined(p) || p.length === 0) {
      return true;
    }
    const noAsterisks: string = p.replace(/\*/g, '');
    return noAsterisks.length === 0;
  }

  public static toTextEntryRefArr(entries: TextEntry[]): TextEntryRef[] {
    let entryRefs: TextEntryRef[];
    if (entries && entries.length > 0) {
      entryRefs = entries.map(e => ({
        value: e.value,
        subRefs: Filter.toTextEntryRefArr(e.subText)
      }));
    }
    return entryRefs;
  }

  public static fromTextEntryRefArr(entryRefs: TextEntryRef[], dict: TextEntry[]): TextEntry[] {
    let entries: TextEntry[];
    if (entryRefs && entryRefs.length > 0) {
      entries = entryRefs
        .map(r => {
          let entry: TextEntry;
          const foundEntry: TextEntry = dict.find(e => e.value === r.value);
          if (foundEntry) {
            entry = new TextEntry(
              foundEntry.value,
              foundEntry.text,
              Filter.fromTextEntryRefArr(r.subRefs, dict));
          }
          return entry;
        })
        .filter(e => !isNullOrUndefined(e));
    }
    return entries;
  }

  public static toSerializableObject(filter: Filter): any {
    let data: any;
    if (filter) {
      data = {
        pattern: filter.pat,
        patternNameSpace: filter.ns,
        isWithinSel: filter.within,
        disciplineValues: Filter.toTextEntryRefArr(filter.disciplineArr),
        objectTypeValues: Filter.toTextEntryRefArr(filter.objectTypeArr),
        isAlmSup: filter.alarmSup
      };
    }
    return data;
  }

  public static fromSerializableObject(data: any, disciplineTexts: TextEntry[], objectTypeTexts: TextEntry[]): Filter {
    const f: Filter = new Filter();
    f.pat = data.pattern;
    f.ns = data.patternNameSpace;
    f.within = Boolean(data.isWithinSel);
    f.disciplineArr = Filter.fromTextEntryRefArr(data.disciplineValues, disciplineTexts);
    f.objectTypeArr = Filter.fromTextEntryRefArr(data.objectTypeValues, objectTypeTexts);
    f.alarmSup = data.isAlmSup;
    return f;
  }

  public static serializeFilters(filterArr: Filter[]): string {
    let filterArrEncoded: string;
    let filterArrEncodedEncoded: string;
    if (filterArr && filterArr.length > 0) {
      const dataArr: any[] = filterArr.map(filter => Filter.toSerializableObject(filter));
      filterArrEncoded = JSON.stringify(dataArr);
      filterArrEncodedEncoded = JSON.stringify(filterArrEncoded); // 2nd encoding will escape quotes!
      // Remove leading and trailing quote ('"') character from double-encoded string value!
      // Otherwise, these characters will be incorrectly treated as part of the setting's string-value.
      const len: number = filterArrEncodedEncoded.length;
      if (len > 1) {
        if (filterArrEncodedEncoded[0] === '"' && filterArrEncodedEncoded[len - 1] === '"') {
          filterArrEncodedEncoded = filterArrEncodedEncoded.substr(1, len - 2);
        }
      }
    }
    return filterArrEncodedEncoded;
  }

  public static deserializeFilters(filterArrEncoded: string, disciplineTexts: TextEntry[], objectTypeTexts: TextEntry[]): Filter[] {
    let filterArr: Filter[];
    if (filterArrEncoded) {
      try {
        const dataArr: any[] = JSON.parse(filterArrEncoded);
        filterArr = dataArr.map(data => Filter.fromSerializableObject(data, disciplineTexts, objectTypeTexts));
      } catch (err) {
        filterArr = undefined; // invalid encoding!
      }
    }
    return filterArr;
  }

  public constructor() {
    this.filterChangedInd = new Subject<void>();
    this.changeNotificationDisabled = false;
    this.reset();
  }

  public reset(f?: Filter, skipChangeNotification?: boolean): void {
    const entryState: boolean = this.changeNotificationDisabled;
    if (skipChangeNotification) {
      this.changeNotificationDisabled = true;
    }
    this.pat = undefined;
    this.ns = PatternNamespaceType.CnsDisplayName;
    this.within = false;
    this.alarmSup = undefined;
    this.disciplineArr = undefined;
    this.objectTypeArr = undefined;
    if (f) {
      this.pat = f.pat;
      this.ns = f.ns;
      this.within = f.within;
      if (f.disciplineArr) {
        this.disciplineArr = f.disciplineArr.slice(0);
      }
      if (f.objectTypeArr) {
        this.objectTypeArr = f.objectTypeArr.slice(0);
      }
      this.alarmSup = f.alarmSup;
    }
    this.notifyFilterChanged();
    this.changeNotificationDisabled = entryState; // restore on-entry state
  }

  public get isPatternClear(): boolean {
    return isNullOrUndefined(this.pat) || this.pat.length === 0;
  }

  public get isClear(): boolean {
    return (
      this.isPatternClear &&
      !this.within &&
      !this.alarmSup &&
      !(this.disciplineArr && this.disciplineArr.length > 0) &&
      !(this.objectTypeArr && this.objectTypeArr.length > 0)
      // && add additional filter criteria checks here...
    );
  }

  public isEqual(that: Filter): boolean {
    if (!isNullOrUndefined(that)) {
      return (
        this.pat === that.pat &&
        this.ns === that.ns &&
        Boolean(this.within) === Boolean(that.within) &&
        Boolean(this.alarmSup) === Boolean(that.alarmSup) &&
        TextEntry.isEqualArr(this.disciplineArr, that.disciplineArr) &&
        TextEntry.isEqualArr(this.objectTypeArr, that.objectTypeArr)
      );
    }
    return false;
  }

  private notifyFilterChanged(): void {
    if (this.changeNotificationDisabled) {
      return;
    }
    this.filterChangedInd.next(undefined);
  }
}

export class FilterPreset {

  public static serializePresets(presetArr: FilterPreset[]): string {
    let presetArrEncoded: string;
    let presetArrEncodedEncoded: string;
    if (presetArr && presetArr.length > 0) {
      const dataArr: any[] = presetArr.map(preset => ({
        name: preset.name,
        filter: Filter.toSerializableObject(preset.filter)
      }));
      presetArrEncoded = JSON.stringify(dataArr);
      presetArrEncodedEncoded = JSON.stringify(presetArrEncoded); // 2nd encoding will escape quotes!
      // Remove leading and trailing quote ('"') character from double-encoded string value!
      // Otherwise, these characters will be incorrectly treated as part of the setting's string-value.
      const len: number = presetArrEncodedEncoded.length;
      if (len > 1) {
        if (presetArrEncodedEncoded[0] === '"' && presetArrEncodedEncoded[len - 1] === '"') {
          presetArrEncodedEncoded = presetArrEncodedEncoded.substr(1, len - 2);
        }
      }
    }
    return presetArrEncodedEncoded;
  }

  public static deserializePresets(presetArrEncoded: string, disciplineTexts: TextEntry[], objectTypeTexts: TextEntry[]): FilterPreset[] {
    let presetArr: FilterPreset[];
    if (presetArrEncoded) {
      try {
        const dataArr: any[] = JSON.parse(presetArrEncoded);
        presetArr = dataArr.map(data => {
          const f: Filter = Filter.fromSerializableObject(data.filter, disciplineTexts, objectTypeTexts);
          return new FilterPreset(data.name, f);
        });
      } catch (err) {
        presetArr = undefined; // invalid encoding!
      }
    }
    return presetArr || [];
  }

  constructor(
    public readonly name: string,
    public readonly filter: Filter) {
  }

}
