// Whole-script strict mode syntax
/* jslint node: true */
'use strict';

import { EnumColumnGroup, EnumColumnType, HeaderData } from '../textual-viewer-data.model';
import { TextualHeaderSettings } from './TextualHeaderSettings';

describe('TextualHeaderSettings', () => {

  it('toString: null header array', () => {
    // act
    const s: string = TextualHeaderSettings.toString(null);

    // assert
    expect(s).toBe('');
  });

  it('toString: undefined header array', () => {
    // act
    const s: string = TextualHeaderSettings.toString(undefined);

    // assert
    expect(s).toBe('');
  });

  it('toString: empty header array', () => {
    const hdrs: HeaderData[] = [];

    // act
    const s: string = TextualHeaderSettings.toString(hdrs);

    // assert
    expect(s).toBe('');
  });

  it('toString: one header', () => {
    // arrange
    const hdrs: HeaderData[] = [];
    hdrs.push(makeHeader('id'));

    // act
    const s: string = TextualHeaderSettings.toString(hdrs);

    // assert
    expect(s).toContain('id.');
    expect(s).not.toContain(';');
  });

  it('toString: three headers', () => {
    // arrange
    const hdrs: HeaderData[] = [];
    hdrs.push(makeHeader('id1'));
    hdrs.push(makeHeader('id2'));
    hdrs.push(makeHeader('id3'));

    // act
    const s: string = TextualHeaderSettings.toString(hdrs);

    // assert
    expect(s).toContain('id1.');
    expect(s).toContain('id2.');
    expect(s).toContain('id3.');
    expect(s.split(';').length).toBe(3);
  });

  it('toString: three headers, middle one null', () => {
    // arrange
    const hdrs: HeaderData[] = [];
    hdrs.push(makeHeader('id1'));
    hdrs.push(null);
    hdrs.push(makeHeader('id3'));

    // act
    const s: string = TextualHeaderSettings.toString(hdrs);

    // assert
    expect(s).toContain('id1.');
    expect(s).toContain('id3.');
    expect(s.split(';').length).toBe(2);
  });

  it('fromString: null string', () => {
    // act
    const hdrs: HeaderData[] = TextualHeaderSettings.fromString(null);

    // assert
    expect(hdrs).not.toBeNull();
    expect(hdrs.length).toBe(0);
  });

  it('fromString: undefined string', () => {
    // act
    const hdrs: HeaderData[] = TextualHeaderSettings.fromString(undefined);

    // assert
    expect(hdrs).not.toBeNull();
    expect(hdrs.length).toBe(0);
  });

  it('fromString: empty string', () => {
    // act
    const hdrs: HeaderData[] = TextualHeaderSettings.fromString('');

    // assert
    expect(hdrs).not.toBeNull();
    expect(hdrs.length).toBe(0);
  });

  it('fromString: single string with less properties', () => {
    const s = 'id.one.two.three';

    // act
    const hdrs: HeaderData[] = TextualHeaderSettings.fromString(s);

    // assert
    expect(hdrs).not.toBeNull();
    expect(hdrs.length).toBe(0);
  });

  it('fromString: three strings, one with less properties', () => {
    // arrange
    const hdr1: HeaderData[] = [makeHeader('id1')];
    const hdr2: HeaderData[] = [makeHeader('id2')];

    const s1: string = TextualHeaderSettings.toString(hdr1);
    const s2: string = TextualHeaderSettings.toString(hdr2);

    const s: string = s1 + ';id.one.two.three;' + s2;

    // act
    const hdrs: HeaderData[] = TextualHeaderSettings.fromString(s);

    // assert
    expect(hdrs).not.toBeNull();
    expect(hdrs.length).toBe(2);
    expect(hdrs[0]).not.toBeUndefined();
    expect(hdrs[1]).not.toBeUndefined();
  });

  it('fromString: three strings, middle one empty', () => {
    // arrange
    const hdr1: HeaderData[] = [makeHeader('id1')];
    const hdr2: HeaderData[] = [makeHeader('id2')];

    const s1: string = TextualHeaderSettings.toString(hdr1);
    const s2: string = TextualHeaderSettings.toString(hdr2);

    const s: string = s1 + ';;' + s2;

    // act
    const hdrs: HeaderData[] = TextualHeaderSettings.fromString(s);

    // assert
    expect(hdrs).not.toBeNull();
    expect(hdrs.length).toBe(2);
    expect(hdrs[0]).not.toBeUndefined();
    expect(hdrs[1]).not.toBeUndefined();
  });

  it('Round trip: three headers', () => {
    // arrange
    const hdrsIn: HeaderData[] = [];
    hdrsIn.push(makeHeader('id1'));
    hdrsIn.push(makeHeader('id2'));
    hdrsIn.push(makeHeader('id3'));

    const s: string = TextualHeaderSettings.toString(hdrsIn);

    // act
    const hdrsOut: HeaderData[] = TextualHeaderSettings.fromString(s);

    // assert
    expect(hdrsOut.length).toBe(3);
    expect(hdrsOut[0].id).toBe(hdrsIn[0].id);
    expect(hdrsOut[1].id).toBe(hdrsIn[1].id);
    expect(hdrsOut[2].id).toBe(hdrsIn[2].id);
  });

  it('Merge with original header null', () => {
    // arrange
    const toMerge: HeaderData = makeHeader('id');

    // act
    const hdr: HeaderData = TextualHeaderSettings.mergeHeaders(null, toMerge);

    expect(hdr).toBeUndefined();
  });

  it('Merge with original header undefined', () => {
    // arrange
    const toMerge: HeaderData = makeHeader('id');

    // act
    const hdr: HeaderData = TextualHeaderSettings.mergeHeaders(undefined, toMerge);

    expect(hdr).toBeUndefined();
  });

  it('Merge with toMerge header null', () => {
    // arrange
    const flag = true;
    const id = 'SomeCleverId';
    const original: HeaderData = makeHeader(id, flag);

    // act
    const hdr: HeaderData = TextualHeaderSettings.mergeHeaders(original, null);

    // assert
    expect(hdr.id).toBe(id);
    expect(hdr.allowHiding).toBe(flag);
    expect(hdr.columnVisible).toBe(flag);
    expect(hdr.showfilter).toBe(flag);
  });

  it('Merge with toMerge header undefined', () => {
    // arrange
    const flag = true;
    const id = 'SomeCleverId';
    const original: HeaderData = makeHeader(id, flag);

    // act
    const hdr: HeaderData = TextualHeaderSettings.mergeHeaders(original, undefined);

    // assert
    expect(hdr.id).toBe(id);
    expect(hdr.allowHiding).toBe(flag);
    expect(hdr.columnVisible).toBe(flag);
    expect(hdr.showfilter).toBe(flag);
  });

  it('Merge two headers', () => {
    const id = 'SomeCleverId';
    const label = 'MyLabel';
    const widthPercentage = 164;
    const columnType: EnumColumnType = EnumColumnType.PIPED_ICON_BOX;
    const smallScreenOrder = 1124;
    const columnGroup: EnumColumnGroup = EnumColumnGroup.GroupThree;
    const styleClasses = 'StyleClasses';
    const minColWidth = 123456;
    const width = 654321;
    const headerIconClass = 'SomeIconClass';
    const size = '42';

    // arrange
    const original: HeaderData = makeHeader(id, true);
    const toMerge: HeaderData = makeHeader(id, false);

    original.label = label;
    original.widthPercentage = widthPercentage;
    original.columnType = columnType;
    original.smallScreenOrder = smallScreenOrder;
    original.columnGroup = columnGroup;
    original.styleClasses = styleClasses;
    original.minColWidth = minColWidth;
    original.width = width;
    original.headerIconClass = headerIconClass;
    original.size = size;

    // act
    const hdr: HeaderData = TextualHeaderSettings.mergeHeaders(original, toMerge);

    // assert - make sure that:
    // 1) id is same (would screw up client code!
    // 2) return is fresh instances of header data
    // 3) only things that transfer over are SOME booleans
    //    (which we test for)

    expect(hdr.id).toBe(id, 'id');

    expect(hdr).not.toEqual(original, 'not equal to original');
    expect(hdr).not.toEqual(toMerge, 'not equal to toMerge');

    expect(hdr.label).toBe(label, 'label');
    expect(hdr.widthPercentage).toBe(widthPercentage, 'widthPercentage');
    expect(hdr.columnType).toBe(columnType, 'columnType');
    expect(hdr.smallScreenOrder).toBe(smallScreenOrder, 'smallScreenOrder');
    expect(hdr.columnGroup).toBe(columnGroup, 'columnGroup');
    expect(hdr.styleClasses).toBe(styleClasses, 'styleClasses');
    expect(hdr.minColWidth).toBe(minColWidth, 'minColWidth');
    expect(hdr.width).toBe(width, 'width');
    expect(hdr.headerIconClass).toBe(headerIconClass, 'headerIconClass');
    expect(hdr.size).toBe(size, 'size');

    expect(hdr.isFixedSize).toBe(true, 'isFixedSize');
    expect(hdr.hideResize).toBe(true, 'hideResize');
    expect(hdr.showLabel).toBe(true, 'showLabel');

    expect(hdr.allowHiding).toBe(false, 'allowHiding');
    expect(hdr.columnVisible).toBe(false, 'columnVisible');
    expect(hdr.showfilter).toBe(false, 'showFilter');
  });
});

const makeHeader = (id: string, b: boolean = false): HeaderData => {
  const hd: HeaderData = new HeaderData(id);

  // hd.label;
  // hd.size;
  // hd.styleClasses;
  // hd.columnType;
  // hd.minColWidth;
  // hd.headerIconClass;
  // hd.configButton;
  // hd.smallScreenOrder;
  // hd.columnGroup;
  // hd.widthPercentage;

  hd.allowHiding = b;
  hd.columnVisible = b;
  hd.showfilter = b;

  hd.isFixedSize = b;
  hd.hideResize = b;
  hd.showLabel = b;

  return hd;
};
