import { TestBed, waitForAsync } from '@angular/core/testing';
import { Filter, FilterPreset, PatternNamespaceType } from './filter';
import { TextEntry } from '@gms-flex/services';

describe('Filter', () => {
  let filterMock: any;
  let filterMock2: any;
  let filterPresetMock: any;
  beforeEach(() => {
    filterMock = new Filter();
    filterMock2 = new Filter();
  });

  it('should build without a problem',
    waitForAsync(() => {
      TestBed.compileComponents().then(() => {
        // empty
      });
    }));

  it('should create instance of filter', () => {
    expect(filterMock instanceof Filter).toBeTrue();
  });

  it('should pass all pattern test', () => {
    // initial value
    expect(filterMock.pattern).toEqual('');

    // passed in value
    let pat = 'some|random|pattern';
    filterMock.pattern = pat;
    expect(filterMock.pattern).toEqual(pat);
    filterMock.pattern = pat;
    expect(filterMock.pattern === 'someRandomPattern').toBeFalse();
    pat = undefined;
    filterMock.pattern = pat;
    expect(filterMock.pattern).toEqual('');

    // how to use static methods - use object/class name instead of instance
    // method toTextEntryRefArr
    const entry1 = new TextEntry(1, 'testString', null);
    const textEntryAr: TextEntry[] = [entry1];
    const res = Filter.toTextEntryRefArr(textEntryAr);
    expect(res instanceof Array).toBeTrue();

    // method textEntryArrAsStringArr
    let stringFromArr = Filter.textEntryArrAsStringArr(textEntryAr);
    expect(stringFromArr).toContain('testString');
    const emptyArr = [];
    stringFromArr = Filter.textEntryArrAsStringArr(emptyArr);
    expect(stringFromArr).toEqual([]);
    const entry2 = new TextEntry(2, 'another', textEntryAr);
    const textEntryAr2: TextEntry[] = [entry2];
    stringFromArr = Filter.textEntryArrAsStringArr(textEntryAr2);
    expect(stringFromArr).toContain('testString');

    // method isPatternAll
    let testStr = null;
    let strResult = Filter.isPatternAll(testStr);
    expect(strResult).toBeTrue();
    testStr = 'hey*';
    strResult = Filter.isPatternAll(testStr);
    expect(strResult).toBeFalse();

    // method fromTextEntryRefArr
    const result = Filter.fromTextEntryRefArr(res, textEntryAr);
    expect(result).toContain(entry1);

  });

  it('serializiation/deserialization methods', () => {
    const entry1 = new TextEntry(1, 'testString', null);
    const textEntryAr: TextEntry[] = [entry1];
    const entry2 = new TextEntry(2, 'another', textEntryAr);
    const textEntryAr2: TextEntry[] = [entry2];
    // method toSerializableObject
    const testFilter = new Filter();
    const isItCreated = Filter.toSerializableObject(testFilter);
    expect(isItCreated).toBeDefined();

    // method fromSerializableObject
    const pat1 = 'Net_1';
    filterMock.pat = pat1;
    filterMock.ns = 0;
    const filterObject = Filter.fromSerializableObject(filterMock, textEntryAr, textEntryAr2);
    expect(filterObject.pattern).toContain('Net_1');

    // method serializeFilters
    const mockFilterArr = [filterMock];
    const encodedFilterArr = Filter.serializeFilters(mockFilterArr);
    expect(encodedFilterArr).toContain('Net_1');

    // method deserializeFilters
    let s = Filter.deserializeFilters(encodedFilterArr, null, null);
    expect(s).toBeUndefined();
    s = Filter.deserializeFilters('[{\"pattern\":\"Net_1\",\"patternNameSpace\":0,\"isWithinSel\":false}]', null, null);
    expect(s[0]).toBeInstanceOf(Filter);

    // method serializePresets
    filterMock.pattern = 'testpattern';
    filterPresetMock = new FilterPreset('test', filterMock);
    const presetMockArr = [filterPresetMock];
    const toSerializePresets = FilterPreset.serializePresets(presetMockArr);
    expect(toSerializePresets).toContain('test');
    // deserializePresets
    const fromDeserializePresets =
      FilterPreset.deserializePresets(
        '[{\"name\":\"test\",\"filter\":{\"pattern\":\"testpattern\",\"patternNameSpace\":0,\"isWithinSel\":false}}]', [], []);
    expect(fromDeserializePresets[0]).toBeInstanceOf(FilterPreset);
    const errDeserializePresets = FilterPreset.deserializePresets(toSerializePresets, [], []);
    expect(errDeserializePresets).toEqual([]);
  });

  it('test getters and setters', () => {
    const testNs: PatternNamespaceType = 0;
    const testWithin = true;
    const testAlmSup = false;
    const testPat = 'hello';
    const testDisciplineSubTe = new TextEntry(4, 'Building Automation', null);
    const testDisciplineSubTAr: TextEntry[] = [testDisciplineSubTe];
    const testDisciplineAr = new TextEntry(2, 'Building Automation', testDisciplineSubTAr);
    const testObjTypeSubTe = new TextEntry(4, 'Value', null);
    const testObjTypeSubTAr: TextEntry[] = [testObjTypeSubTe];
    const testObjTypeAr = new TextEntry(3, 'Value', testObjTypeSubTAr);
    filterMock.pat = testPat;
    filterMock.ns = testNs;
    filterMock.within = testWithin;
    filterMock.alarmSup = testAlmSup;
    filterMock.disciplineArr = testDisciplineAr;
    filterMock.objectTypeArr = testObjTypeAr;

    // check isClear getter
    expect(filterMock2.isClear).toBeTrue();
    filterMock.reset(filterMock2, true);
    expect(filterMock.pattern).toEqual(filterMock2.pattern);
    // check isEqual method
    expect(filterMock.isEqual(filterMock2)).toBeTrue();
    expect(filterMock.isEqual(null)).toBeFalse();

    filterMock2.disciplines = testDisciplineAr;
    filterMock.reset(filterMock2);

    filterMock.patternNamespace = 1;
    expect(filterMock.ns).toEqual(filterMock.patternNamespace);
    filterMock.patternNamespace = 1;
    expect(filterMock.ns).toEqual(filterMock.patternNamespace);

    filterMock.isWithinSelection = false;
    expect(filterMock.within).toEqual(filterMock.isWithinSelection);
    filterMock.isWithinSelection = false;
    expect(filterMock.within).toEqual(filterMock.isWithinSelection);
    filterMock.isWithinSelection = true;
    expect(filterMock.within).toBeTrue();

    filterMock.isAlarmSuppression = true;
    expect(filterMock.alarmSup).toEqual(filterMock.isAlarmSuppression);
    filterMock.isAlarmSuppression = true;
    expect(filterMock.alarmSup).toEqual(filterMock.isAlarmSuppression);
    filterMock.isAlarmSuppression = undefined;
    expect(filterMock.alarmSup).toEqual(filterMock.isAlarmSuppression);

    filterMock.disciplines = testDisciplineAr;
    expect(filterMock.disciplineArr).toEqual(filterMock.disciplines);
    filterMock.disciplines = [undefined];
    expect(filterMock.disciplineArr).toEqual(filterMock.disciplines);

    filterMock.objectTypes = testObjTypeAr;
    expect(filterMock.objectTypeArr).toEqual(filterMock.objectTypes);
    filterMock.objectTypes = [undefined];
    expect(filterMock.objectTypeArr).toEqual(filterMock.objectTypes);
    filterMock.objectTypeArr = undefined;
    filterMock.objectTypes = undefined;
    expect(filterMock.objectTypeArr).toEqual(filterMock.objectTypes);

    const o = filterMock.filterChanged;
    expect(true).toBeTrue();
  });

  it('0 length branch of isPatternClear', () => {
    filterMock.pat = '';
    expect(filterMock.isPatternClear).toBeTrue();
  });

  it('branches of reset', () => {
    const diSubTe = new TextEntry(4, 'Building Automation', null);
    const obSubTe = new TextEntry(5, 'Value', null);
    const diSubTAr: TextEntry[] = [diSubTe];
    const obSubTAr: TextEntry[] = [obSubTe];
    filterMock.pat = 'check';
    filterMock.ns = 0;
    filterMock.within = true;
    filterMock.alarmSup = false;
    filterMock.disciplineArr = diSubTAr;
    filterMock.objectTypeArr = obSubTAr;

    filterMock2.reset(filterMock);
    expect(filterMock.isClear).toBeFalse();
  });
});
