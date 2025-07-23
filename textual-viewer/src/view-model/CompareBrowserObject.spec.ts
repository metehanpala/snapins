// Whole-script strict mode syntax
/* jslint node: true */
'use strict';

import { BrowserObject, ObjectAttributes } from '@gms-flex/services';

import { CompareBrowserObjects } from './CompareBrowserObjects';

describe('CompareBrowserObject', () => {

  // same object?

  it('SameObject with null and/or undefined arguments', () => {
    expect(CompareBrowserObjects.sameObject(undefined, undefined)).toBe(true);
    expect(CompareBrowserObjects.sameObject(null, undefined)).toBe(true);
    expect(CompareBrowserObjects.sameObject(undefined, null)).toBe(true);
    expect(CompareBrowserObjects.sameObject(null, null)).toBe(true);
  });

  it('SameObject with one real object', () => {
    const bo: BrowserObject = mkBo('id', 1, 42);
    expect(CompareBrowserObjects.sameObject(bo, undefined)).toBe(false);
    expect(CompareBrowserObjects.sameObject(bo, null)).toBe(false);
    expect(CompareBrowserObjects.sameObject(undefined, bo)).toBe(false);
    expect(CompareBrowserObjects.sameObject(null, bo)).toBe(false);
  });

  it('SameObject with equal objects', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 1, 42);
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(true);
  });

  it('SameObject with different ids', () => {
    const bo1: BrowserObject = mkBo('id1', 1, 42);
    const bo2: BrowserObject = mkBo('id2', 1, 42);
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(false);
  });

  it('SameObject with different system ids', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 2, 42);
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(false);
  });

  it('SameObject with different view ids', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 1, 43);
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(false);
  });

  it('SameObject with same descriptors', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 1, 42);
    bo1.Descriptor = 'descriptor';
    bo2.Descriptor = 'descriptor';
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(true);
  });

  it('SameObject with different descriptors', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 1, 42);
    bo1.Descriptor = 'descriptor1';
    bo2.Descriptor = 'descriptor2';
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(false);
  });

  it('SameObject with aliases', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 1, 42);
    bo1.Attributes = mkObjAttr('attr');
    bo2.Attributes = mkObjAttr('attr');
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(true);
  });

  it('SameObject with different aliases', () => {
    const bo1: BrowserObject = mkBo('id', 1, 42);
    const bo2: BrowserObject = mkBo('id', 1, 42);
    bo1.Attributes = mkObjAttr('attr1');
    bo2.Attributes = mkObjAttr('attr2');
    expect(CompareBrowserObjects.sameObject(bo1, bo2)).toBe(false);
  });

  // note: an incoming array of null/undefined/empty is considered to
  // be 'empty' and two empty arrays are considered equal

  it('SameCollection with null and/or undefined arguments', () => {
    expect(CompareBrowserObjects.sameCollection(undefined, undefined)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(null, undefined)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(undefined, null)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(null, null)).toBe(true);
  });

  it('SameCollection with one empty collection', () => {
    expect(CompareBrowserObjects.sameCollection([], undefined)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(null, [])).toBe(true);
    expect(CompareBrowserObjects.sameCollection([], null)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(null, [])).toBe(true);
  });

  it('SameCollection with one non-empty collection', () => {
    const c: BrowserObject[] = [mkBo('id', 1, 2)];
    expect(CompareBrowserObjects.sameCollection(c, undefined)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(null, c)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(c, null)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(null, c)).toBe(false);
  });

  it('SameCollection with arrays with one object', () => {
    const c1: BrowserObject[] = [mkBo('id', 1, 2)];
    const c2: BrowserObject[] = [mkBo('id', 1, 2)];
    expect(CompareBrowserObjects.sameCollection(c1, c2)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(c2, c1)).toBe(true);
  });

  it('SameCollection with arrays of different sizes', () => {
    const c1: BrowserObject[] = [mkBo('id', 1, 2), mkBo('id2', 2, 3)];
    const c2: BrowserObject[] = [mkBo('id', 1, 2)];
    expect(CompareBrowserObjects.sameCollection(c1, c2)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(c2, c1)).toBe(false);
  });

  it('SameCollection with arrays of same content, different order', () => {
    const bo1: BrowserObject = mkBo('id1', 1, 2);
    const bo2: BrowserObject = mkBo('id2', 2, 3);
    const bo3: BrowserObject = mkBo('id3', 3, 4);
    const c1: BrowserObject[] = [bo1, bo2, bo3];
    const c2: BrowserObject[] = [bo2, bo1, bo3];
    expect(CompareBrowserObjects.sameCollection(c1, c2)).toBe(true);
    expect(CompareBrowserObjects.sameCollection(c2, c1)).toBe(true);
  });

  it('SameCollection with arrays of different content, first value', () => {
    const bo1: BrowserObject = mkBo('id1', 1, 2);
    const bo2: BrowserObject = mkBo('id2', 2, 3);
    const bo3: BrowserObject = mkBo('id3', 3, 4);
    const bo4: BrowserObject = mkBo('id4', 4, 5);
    const c1: BrowserObject[] = [bo1, bo2, bo3];
    const c2: BrowserObject[] = [bo4, bo2, bo3];
    expect(CompareBrowserObjects.sameCollection(c1, c2)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(c2, c1)).toBe(false);
  });

  it('SameCollection with arrays of different content, middle value', () => {
    const bo1: BrowserObject = mkBo('id1', 1, 2);
    const bo2: BrowserObject = mkBo('id2', 2, 3);
    const bo3: BrowserObject = mkBo('id3', 3, 4);
    const bo4: BrowserObject = mkBo('id4', 4, 5);
    const c1: BrowserObject[] = [bo1, bo2, bo3];
    const c2: BrowserObject[] = [bo1, bo4, bo3];
    expect(CompareBrowserObjects.sameCollection(c1, c2)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(c2, c1)).toBe(false);
  });

  it('SameCollection with arrays of different content, last value', () => {
    const bo1: BrowserObject = mkBo('id1', 1, 2);
    const bo2: BrowserObject = mkBo('id2', 2, 3);
    const bo3: BrowserObject = mkBo('id3', 3, 4);
    const bo4: BrowserObject = mkBo('id4', 4, 5);
    const c1: BrowserObject[] = [bo1, bo2, bo3];
    const c2: BrowserObject[] = [bo1, bo2, bo4];
    expect(CompareBrowserObjects.sameCollection(c1, c2)).toBe(false);
    expect(CompareBrowserObjects.sameCollection(c2, c1)).toBe(false);
  });

});

/* eslint-disable */

function mkObjAttr(a: string): ObjectAttributes {
  return {
    Alias: a,
    DefaultProperty: 'DefaultProperties',
    DisciplineDescriptor: 'DisciplineDescriptor',
    DisciplineId: 42,
    FunctionDefaultProperty: 'FcnDefProp',
    FunctionName: 'FcnName',
    ManagedType: 69,
    ManagedTypeName: 'ManagedTypeName',
    ObjectId: 'ObjectId',
    SubDisciplineDescriptor: 'SubDisciplineDescriptor',
    SubDisciplineId: 1234,
    SubTypeDescriptor: 'SubTypeDescriptor',
    SubTypeId: 2345,
    TypeDescriptor: 'TypeDescriptor',
    TypeId: 3456,
    ObjectModelName: 'ObjectModelName',
    CustomData: null
  };
}

function mkBo(oi: string, si: number, vi: number): BrowserObject {
  return {
    Attributes: null,
    Descriptor: 'descriptor',
    Designation: 'designation',
    HasChild: false,
    Name: 'name',
    Location: 'location',
    ObjectId: oi,
    SystemId: si,
    ViewId: vi,
    ViewType: 0
  };

  /* eslint-enable */
}
