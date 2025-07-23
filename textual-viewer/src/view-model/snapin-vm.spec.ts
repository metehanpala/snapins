import { ChangeDetectorRef, NgZone } from '@angular/core';
import { fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { BrowserObject, GmsSubscription, ObjectAttributes, PropertyDetails, PropertyInfo, PropertyServiceBase, SiIconMapperService, SubscriptionState,
  SystemBrowserServiceBase, TablesEx, Value, ValueDetails, ValueSubscription2ServiceBase } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { from, Observable, Observer } from 'rxjs';

import { GridData, GridVirtualizedArgs } from '../textual-viewer-data.model';
import { TvColumnIds } from './globals';
import { TextualViewerSnapInViewModel } from './snapin-vm';

const exeOutsideAngular = (fn: (...args: any[]) => any): any => {
  fn();
};

describe('TextualViewerSnapInViewModel', () => {
  const elapsedTime = 30000; // milliseconds
  const sniId = 'snapinTest';
  const subscriptionReg = 'SomethingCleverHere';
  const theLocale = 'en-US';
  const propertyAbsText = 'N/A';
  const commLossText = '#COM';
  const obj1CovValue = '75.3';
  const obj1FcnDefPropCovValue = '56.78';
  const clearIconPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

  const iconAsSvg: string =
   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"\>' +
   '<circle cx="50" cy="50" r="48" fill="none" stroke="#000"/\>' +
   '<path d="M50,2a48,48 0 1 1 0,96a24 24 0 1 1 0-48a24 24 0 1 0 0-48"/\>' +
   '<circle cx="50" cy="26" r="6"/\>' +
   '<circle cx="50" cy="74" r="6" fill="#FFF"/\>' +
   '</svg\>';

  // object 1

  /* eslint-disable */

  const browserObj1WithNoDefProp: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc1',
    Attributes: Object.freeze({
      Alias: 'Object1Alias',
      DefaultProperty: undefined,
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1WithFcnDefProp: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc1',
    Attributes: Object.freeze({
      Alias: 'Object1Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: '[]Function_Default_Property',
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc1',
    Attributes: Object.freeze({
      Alias: 'Object1Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1WithNoAlias: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc1',
    Attributes: Object.freeze({
      // Alias: "Object1Alias",
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1WithNoDescriptor: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    // Descriptor: "desc1",
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc1',
    Attributes: Object.freeze({
      Alias: 'Object1Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1WithNoLocation: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    // Location: "System1:Something.SomethingElse.desc1",
    Attributes: Object.freeze({
      Alias: 'Object1Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1WithBadLocation: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.BadDescriptor',
    Attributes: Object.freeze({
      Alias: 'Object1Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const browserObj1WithNoAttributes: BrowserObject = Object.freeze({
    ObjectId: 'obj1',
    Descriptor: 'desc1',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc1'
  }) as BrowserObject;

  const obj1Details: PropertyInfo<PropertyDetails> = Object.freeze({
    ErrorCode: 0,
    ObjectId: browserObj1.ObjectId,
    Properties: [{
      Order: 1,
      Usage: 3,
      Type: 'ExtendedReal',
      PropertyName: 'Present_Value',
      Descriptor: 'Desc1',
      Resolution: 1
    }]
  }) as PropertyInfo<PropertyDetails>;

  const obj1WithFcnDefPropDetails: PropertyInfo<PropertyDetails> = Object.freeze({
    ErrorCode: 0,
    ObjectId: browserObj1.ObjectId,
    Properties: [{
      Order: 1,
      Usage: 3,
      Type: 'ExtendedReal',
      PropertyName: 'Present_Value',
      Descriptor: 'Desc1',
      Resolution: 1
    }],
    FunctionProperties: [{
      Order: 1,
      Usage: 3,
      Type: 'ExtendedReal',
      PropertyName: 'Function_Default_Property',
      Descriptor: 'Function_Property_Desc1',
      Resolution: 2
    }]
  }) as PropertyInfo<PropertyDetails>;

  const obj1StatusSubValueAsAny: any = {
    DataType: 'ExtendedEnum',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: '42',
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-06',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  };

  obj1StatusSubValueAsAny.BackgroundColor = Object.freeze({ A: 64, R: 64, G: 64, B: 124 });

  const obj1StatusSubValue: ValueDetails = Object.freeze(obj1StatusSubValueAsAny);

  const obj1StatusSubValuewithErrorAsAny: any = {
    DataType: 'ExtendedEnum',
    ErrorCode: 123456,
    IsArray: false,
    Value: Object.freeze({
      Value: '42',
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-06',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  };

  obj1StatusSubValuewithErrorAsAny.BackgroundColor = Object.freeze({ A: 64, R: 64, G: 64, B: 124 });

  const obj1StatusSubValueWithError: ValueDetails = Object.freeze(obj1StatusSubValuewithErrorAsAny);

  const obj1StatusSubValueBadQualityAsAny: any = {
    DataType: 'ExtendedEnum',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: '42',
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-06',
      QualityGood: false,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  };

  obj1StatusSubValueBadQualityAsAny.BackgroundColor = Object.freeze({ A: 64, R: 64, G: 64, B: 124 });

  /* eslint-enable */

  const obj1StatusSubValueWithBadQuality: ValueDetails = Object.freeze(obj1StatusSubValueBadQualityAsAny);

  const obj1StatusSubRespWithBadQuality: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj1StatusSubValueWithBadQuality]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1StatusSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj1StatusSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1StatusSubRespWithError: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 123456,
    state: SubscriptionState.Subscribed,
    changed: from([obj1StatusSubValueWithError]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1StatusSubRespNullValue: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([null]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  /* eslint-disable */

  const obj1DefPropSubValue: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  const obj1DefPropSubValueWithError: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 123456,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  const obj1DefPropSubValueAbsent: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: true
    }) as Value
  }) as ValueDetails;

  const obj1DefPropSubValueCommErr: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: false,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  const obj1FcnDefPropSubValue: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1FcnDefPropCovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  /* eslint-enable */

  const obj1DefPropSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.' + browserObj1.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj1DefPropSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1DefPropSubRespWithError: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.' + browserObj1.Attributes.DefaultProperty,
    errorCode: 123456,
    state: SubscriptionState.Subscribed,
    changed: from([obj1DefPropSubValueWithError]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1DefPropSubRespNullValue: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.' + browserObj1.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([null]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1DefPropSubRespAbsent: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.' + browserObj1.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj1DefPropSubValueAbsent]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1DefPropSubRespCommErr: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1.ObjectId + '.' + browserObj1.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj1DefPropSubValueCommErr]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj1FcnDefPropSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj1WithFcnDefProp.ObjectId + browserObj1WithFcnDefProp.Attributes.FunctionDefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj1FcnDefPropSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  // object 2

  /* eslint-disable */

  const browserObj2: BrowserObject = Object.freeze({
    ObjectId: 'obj2',
    Descriptor: 'desc2',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc2',
    Attributes: Object.freeze({
      Alias: 'Object2Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1002
    }) as ObjectAttributes
  }) as BrowserObject;

  const obj2Details: PropertyInfo<PropertyDetails> = Object.freeze({
    ErrorCode: 0,
    ObjectId: browserObj2.ObjectId,
    Properties: [{
      Order: 1,
      Usage: 3,
      Type: 'ExtendedReal',
      PropertyName: 'Present_Value',
      Descriptor: 'Desc2',
      Resolution: 2
    }]
  }) as PropertyInfo<PropertyDetails>;

  const obj2StatusSubValueAsAny: any = {
    DataType: 'ExtendedEnum',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: '42',
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-06',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  };

  obj2StatusSubValueAsAny.BackgroundColor = Object.freeze({ A: 64, R: 64, G: 64, B: 124 });

  const obj2StatusSubValue: ValueDetails = Object.freeze(obj2StatusSubValueAsAny);

  const obj2DefPropSubValue: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  /* eslint-enable */

  const obj2StatusSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj2.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj2StatusSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj2DefPropSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj2.ObjectId + '.' + browserObj2.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj2DefPropSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  // object 3

  /* eslint-disable */

  const browserObj3: BrowserObject = Object.freeze({
    ObjectId: 'obj3',
    Descriptor: 'desc3',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc3',
    Attributes: Object.freeze({
      Alias: 'Object3Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1001
    }) as ObjectAttributes
  }) as BrowserObject;

  const obj3Details: PropertyInfo<PropertyDetails> = Object.freeze({
    ErrorCode: 0,
    ObjectId: browserObj3.ObjectId,
    Properties: [{
      Order: 1,
      Usage: 3,
      Type: 'ExtendedReal',
      PropertyName: 'Present_Value',
      Descriptor: 'Desc3',
      Resolution: 3
    }]
  }) as PropertyInfo<PropertyDetails>;

  const obj3StatusSubValueAsAny: any = {
    DataType: 'ExtendedEnum',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: '43',
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-03',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  };

  obj3StatusSubValueAsAny.BackgroundColor = Object.freeze({ A: 64, R: 64, G: 64, B: 124 });

  const obj3StatusSubValue: ValueDetails = Object.freeze(obj3StatusSubValueAsAny);

  const obj3DefPropSubValue: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  /* eslint-enable */

  const obj3StatusSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj3.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj3StatusSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj3DefPropSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj3.ObjectId + '.' + browserObj3.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj3DefPropSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  // object 4

  /* eslint-disable */

  const browserObj4: BrowserObject = Object.freeze({
    ObjectId: 'obj4',
    Descriptor: 'desc4',
    SystemId: 1,
    ViewId: 9,
    Location: 'System1:Something.SomethingElse.desc4',
    Attributes: Object.freeze({
      Alias: 'Object4Alias',
      DefaultProperty: 'Present_Value',
      FunctionDefaultProperty: undefined,
      TypeId: 1002
    }) as ObjectAttributes
  }) as BrowserObject;

  const obj4Details: PropertyInfo<PropertyDetails> = Object.freeze({
    ErrorCode: 0,
    ObjectId: browserObj4.ObjectId,
    Properties: [{
      Order: 1,
      Usage: 3,
      Type: 'ExtendedReal',
      PropertyName: 'Present_Value',
      Descriptor: 'Desc4',
      Resolution: 4
    }]
  }) as PropertyInfo<PropertyDetails>;

  const obj4StatusSubValueAsAny: any = {
    DataType: 'ExtendedEnum',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: '44',
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-04',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  };

  obj4StatusSubValueAsAny.BackgroundColor = Object.freeze({ A: 64, R: 64, G: 64, B: 124 });

  const obj4StatusSubValue: ValueDetails = Object.freeze(obj4StatusSubValueAsAny);

  const obj4DefPropSubValue: ValueDetails = Object.freeze({
    DataType: 'ExtendedReal',
    ErrorCode: 0,
    IsArray: false,
    Value: Object.freeze({
      Value: obj1CovValue,
      DisplayValue: 'DisplayString',
      Timestamp: '2019-04-05',
      QualityGood: true,
      Quality: '0',
      IsPropertyAbsent: false
    }) as Value
  }) as ValueDetails;

  /* eslint-enable */

  const obj4StatusSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj4.ObjectId + '.StatusPropagation.AggregatedSummaryStatus',
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj4StatusSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  const obj4DefPropSubResp: GmsSubscription<ValueDetails> = Object.freeze({
    gmsId: browserObj4.ObjectId + '.' + browserObj4.Attributes.DefaultProperty,
    errorCode: 0,
    state: SubscriptionState.Subscribed,
    changed: from([obj4DefPropSubValue]),
    stateChanged: from([SubscriptionState.Subscribing, SubscriptionState.Subscribed])
  }) as GmsSubscription<ValueDetails>;

  // icons

  // const iconPng: IconImage = Object.freeze({ imageFormat: "PNG", image: clearIconPng }) as IconImage;
  // const iconSvg: IconImage = Object.freeze({ imageFormat: "SVG", image: iconAsSvg }) as IconImage;
  // const iconXXX: IconImage = Object.freeze({ imageFormat: "XXX", image: clearIconPng }) as IconImage;
  const iconCls = 'icon-cls';

  // local variables

  let sniVm: TextualViewerSnapInViewModel;
  let propertyServiceSpy: jasmine.SpyObj<PropertyServiceBase>;
  let valueSubscriptionServiceSpy: jasmine.SpyObj<ValueSubscription2ServiceBase>;
  let systemServiceSpy: jasmine.SpyObj<SystemBrowserServiceBase>;
  let iconMapperServiceSpy: jasmine.SpyObj<SiIconMapperService>;
  let chgRefSpy: jasmine.SpyObj<ChangeDetectorRef>;
  let ngZoneSpy: jasmine.SpyObj<NgZone>;
  let tracer: TraceService;

  // Helper: Create an observable that returns the provided data when
  // subscribed after a single turn (a.k.a. tick) of the JS engine.
  const asyncData = (data: any): Observable<any> => new Observable((o: Observer<any>) => {
    setTimeout(() => {
      o.next(data);
      o.complete();
    }, 0);
  });

  const getGlobalIconMock = (t: TablesEx, n: number): Observable<string> => asyncData(iconCls);

  beforeEach(waitForAsync(() => {
    propertyServiceSpy = jasmine.createSpyObj('PropertyServiceBase', ['readPropertiesMulti']);

    valueSubscriptionServiceSpy = jasmine.createSpyObj(
      'ValueSubscription2ServiceBase',
      ['disposeClient', 'registerClient', 'subscribeValues', 'unsubscribeValues']
    );

    systemServiceSpy = jasmine.createSpyObj('SystemBrowserServiceBase', ['getNodes']);

    iconMapperServiceSpy = jasmine.createSpyObj('SiIconMapperService', ['getGlobalIcon']);

    chgRefSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    const ts: jasmine.SpyObj<TraceService> = jasmine.createSpyObj('TraceService',
      ['isInfoEnabled', 'isDebugEnabled', 'debug', 'error', 'info']);

    ts.isInfoEnabled.and.returnValue(true);
    ts.isDebugEnabled.and.returnValue(true);

    const bos: BrowserObject[] = [];

    systemServiceSpy.getNodes.and.returnValue(asyncData(bos));

    const u: unknown = ts;
    tracer = u as TraceService;

    ngZoneSpy = jasmine.createSpyObj('NgZone', ['runOutsideAngular']);

    ngZoneSpy.runOutsideAngular.and.callFake(exeOutsideAngular);

    sniVm = new TextualViewerSnapInViewModel(
      sniId,
      systemServiceSpy,
      propertyServiceSpy,
      valueSubscriptionServiceSpy,
      iconMapperServiceSpy,
      tracer,
      ngZoneSpy
    );
    sniVm.setText(propertyAbsText, commLossText);
  }));

  const callCtor = (id: string): TextualViewerSnapInViewModel => new TextualViewerSnapInViewModel(
    id,
    systemServiceSpy,
    propertyServiceSpy,
    valueSubscriptionServiceSpy,
    iconMapperServiceSpy,
    tracer,
    ngZoneSpy
  );

  it('Constructor should throw if id is undefined', () => {
    expect(() => callCtor(undefined)).toThrow();
  });

  it('Constructor should throw if id is null', () => {
    expect(() => callCtor(null)).toThrow();
  });

  it('Constructor should throw if id is empty string', () => {
    expect(() => callCtor('')).toThrow();
  });

  it('Constructor should set correct property defaults', () => {
    expect(sniVm.id).toEqual(sniId);
    expect(sniVm.objectList).toEqual([]);
    // this call cannot be made until the vm has been activated
    // expect(sniVm.getBrowserObjectsForSelection([])).toEqual([]);
  });

  it('Context assignment with multiple browser objects', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1, browserObj2, browserObj3, browserObj4];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details, obj2Details, obj3Details, obj4Details];

    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    iconMapperServiceSpy.getGlobalIcon.and.callFake(getGlobalIconMock);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const bos: BrowserObject[] = sniVm.getBrowserObjectsForSelection(rows);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(ngZoneSpy.runOutsideAngular.calls.count()).toBe(4);
    expect(iconMapperServiceSpy.getGlobalIcon.calls.count()).toBe(4);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);

    expect(rows.length).toEqual(objs.length);
    expect(bos.length).toEqual(objs.length);

    expect(bos.find(bo => bo.ObjectId === browserObj1.ObjectId)).toBeTruthy();
    expect(bos.find(bo => bo.ObjectId === browserObj2.ObjectId)).toBeTruthy();
    expect(bos.find(bo => bo.ObjectId === browserObj3.ObjectId)).toBeTruthy();
    expect(bos.find(bo => bo.ObjectId === browserObj4.ObjectId)).toBeTruthy();

    tick();
  }));

  it('Context assignment with multiple browser objects (one null)', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1, browserObj2, browserObj3, browserObj4];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details, obj2Details, obj3Details, obj4Details];

    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    iconMapperServiceSpy.getGlobalIcon.and.callFake(getGlobalIconMock);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const t: GridData[] = sniVm.objectList;
    const rows: GridData[] = [t[0], null, t[1], t[2], t[3]];
    const bos: BrowserObject[] = sniVm.getBrowserObjectsForSelection(rows);

    // 1) we should be making one call to retrieve property information
    // 2) we should be making two calls to retrieve icons (based on the
    //    object type ids we assigned to the test data). note that this
    //    call is made "outside of angular"

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(ngZoneSpy.runOutsideAngular.calls.count()).toBe(4);
    expect(iconMapperServiceSpy.getGlobalIcon.calls.count()).toBe(4);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);

    expect(bos.length).toEqual(objs.length);

    expect(bos.find(bo => bo.ObjectId === browserObj1.ObjectId)).toBeTruthy();
    expect(bos.find(bo => bo.ObjectId === browserObj2.ObjectId)).toBeTruthy();
    expect(bos.find(bo => bo.ObjectId === browserObj3.ObjectId)).toBeTruthy();
    expect(bos.find(bo => bo.ObjectId === browserObj4.ObjectId)).toBeTruthy();
  }));

  it('Virtualize with multiple browser objects (one null)', fakeAsync(() => {
    // arrange

    const objs: BrowserObject[] = [browserObj1, browserObj2, null, browserObj3, browserObj4];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details, obj2Details, obj3Details, obj4Details];

    const readPropNames: string[] = [
      obj1DefPropSubResp.gmsId, obj2DefPropSubResp.gmsId,
      obj3DefPropSubResp.gmsId, obj4DefPropSubResp.gmsId
    ];

    const subpropNames: string[] = [
      obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId,
      obj2StatusSubResp.gmsId, obj2DefPropSubResp.gmsId,
      obj3StatusSubResp.gmsId, obj3DefPropSubResp.gmsId,
      obj4StatusSubResp.gmsId, obj4DefPropSubResp.gmsId
    ];

    // order is very important here: status then def prop
    const subs: GmsSubscription<ValueDetails>[] = [
      obj1StatusSubResp, obj1DefPropSubResp,
      obj2StatusSubResp, obj2DefPropSubResp,
      obj3StatusSubResp, obj3DefPropSubResp,
      obj4StatusSubResp, obj4DefPropSubResp
    ];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    // initial check to make sure everything is right

    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(
      readPropNames, 2, false);

    expect(ngZoneSpy.runOutsideAngular.calls.count()).toBe(4);
    expect(iconMapperServiceSpy.getGlobalIcon.calls.count()).toBe(4);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);

    const t: GridData[] = sniVm.objectList;

    expect(t).not.toBeNull();
    expect(t.length).toBe(4);

    const rows: GridData[] = [t[0], null, t[1], t[2], t[3]]; // << null!
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // act

    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);

    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(
      subpropNames, subscriptionReg);

    sniVm.deactivate();
  }));

  it('Context assignment with same context', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1, browserObj2, browserObj3, browserObj4];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details, obj2Details, obj3Details, obj4Details];

    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;

    // assert (initial)
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(ngZoneSpy.runOutsideAngular.calls.count()).toBe(4);
    expect(iconMapperServiceSpy.getGlobalIcon.calls.count()).toBe(4);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);

    // second call to set context, same list of objects
    sniVm.setContext(objs);

    // assert: we expect no action on the part of snapin vm
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(ngZoneSpy.runOutsideAngular.calls.count()).toBe(4);
    expect(iconMapperServiceSpy.getGlobalIcon.calls.count()).toBe(4);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);
  }));

  it('Virt / nonvirt with no selection', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [];
    const dets: PropertyInfo<PropertyDetails>[] = [];
    const subs: GmsSubscription<ValueDetails>[] = [];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(0);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(0);
  }));

  it('Virt / nonvirt with null arg', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [];
    const dets: PropertyInfo<PropertyDetails>[] = [];
    const subs: GmsSubscription<ValueDetails>[] = [];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    sniVm.onGridVirtualizedChanged(null);

    tick(elapsedTime);

    sniVm.deactivate();
    sniVm.dispose();

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(0);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(0);
  }));

  it('Virt / nonvirt with one browser object', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    expect(rows.length).toBe(1);
    expect(rows[0].enableStatePipe).toBe(false); // pipe starts out false

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);
    expect(rows[0].enableStatePipe).toBe(true);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.unsubscribeValues).toHaveBeenCalledWith(subs, subscriptionReg);
  }));

  it('Virt / nonvirt with one browser object, duplicate calls to dispose', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();
    sniVm.dispose();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object, duplicate call to virt', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);

    // act
    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert (nothing should be done!)
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object, disposed after virt', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);

    // act
    sniVm.dispose();

    try {
      // this should throw ("View model has been disposed....")
      sniVm.onGridVirtualizedChanged(gvaVirt);
      expect(false).toBe(true);
    } catch (e) {
      expect(true).toBe(true);
    }
  }));

  it('Virt / nonvirt with one browser object, duplicate in virt array', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = [sniVm.objectList[0], sniVm.objectList[0]];
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object, null in virt/nonvirt array', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = [sniVm.objectList[0], null];
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object, fcn def prop', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1WithFcnDefProp];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1WithFcnDefPropDetails];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1FcnDefPropSubResp];
    const readPropNames: string[] = [obj1FcnDefPropSubResp.gmsId];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1FcnDefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object, no def prop', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1WithNoDefProp];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(0);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt with one browser object, no descriptor', fakeAsync(() => {
    // here we are dealing one browser object that has no descriptor,
    // so when the grid row is created there is no descriptor id

    // arrange
    const objs: BrowserObject[] = [browserObj1WithNoDescriptor];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);
  }));

  it('Virt with one browser object, no location', fakeAsync(() => {
    // here we are dealiing one browser object that has no location -
    // that means that the group header will be blank

    // arrange
    const objs: BrowserObject[] = [browserObj1WithNoLocation];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);
  }));

  it('Virt with one browser object, no alias', fakeAsync(() => {
    // here we are dealiing one browser object that has no location -
    // that means that the group header will be blank

    // arrange
    const objs: BrowserObject[] = [browserObj1WithNoAlias];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);
  }));

  it('Virt with one browser object, no descriptor in location', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1WithBadLocation];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);
  }));

  it('Virt with one browser object with no attributes', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1WithNoAttributes];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(0);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
  }));

  it('Virtualized (and deactivated) with one browser object', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);

    // act
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object (null COVs)', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];

    // the returning COVs will be null
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubRespNullValue,
      obj1DefPropSubRespNullValue];

    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
  }));

  it('Virt / nonvirt with one browser object (error codes)', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    // both values being returned have non-zero error codes
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubRespWithError, obj1DefPropSubRespWithError];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    expect(rows[0].enableStatePipe).toBe(false); // pipe starts out false

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).not.toBe(obj1CovValue);

    expect(rows[0].enableStatePipe).toBe(false); // pipe ends upfalse

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.unsubscribeValues).toHaveBeenCalledWith(subs, subscriptionReg);
  }));

  it('Virt / nonvirt with one browser object, bad quality on status', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubRespWithBadQuality, obj1DefPropSubResp];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubResp.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, false);

    expect(rows[0].enableStatePipe).toBe(false); // pipe starts out false

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(obj1CovValue);

    expect(rows[0].enableStatePipe).toBe(false); // remains false

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.unsubscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.unsubscribeValues).toHaveBeenCalledWith(subs, subscriptionReg);
  }));

  it('Virt / nonvirt with one browser object (property absent)', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubRespAbsent];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubRespAbsent.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(propertyAbsText);
  }));

  it('Virt / nonvirt with one browser object (comm error)', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubRespCommErr];
    const propNames: string[] = [obj1StatusSubResp.gmsId, obj1DefPropSubRespCommErr.gmsId];
    const readPropNames: string[] = [obj1DefPropSubResp.gmsId];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const rows: GridData[] = sniVm.objectList;
    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs(rows, true);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(propertyServiceSpy.readPropertiesMulti.calls.count()).toBe(1);
    expect(propertyServiceSpy.readPropertiesMulti).toHaveBeenCalledWith(readPropNames, 2, false);
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(1);
    expect(valueSubscriptionServiceSpy.subscribeValues).toHaveBeenCalledWith(propNames, subscriptionReg);
    expect(rows[0].cellData.get(TvColumnIds.valueId)).toBe(commLossText);
  }));

  it('Checks gridRow creation', fakeAsync(() => {
    const objs: BrowserObject[] = [browserObj1];
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs([], false);
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    tick(elapsedTime);
    const objectList: GridData[] = sniVm.objectList;
    expect(objectList.length).toBeGreaterThan(0);
  }));

  it('Virt / nonvirt with no grid rows', fakeAsync(() => {
    // arrange
    const objs: BrowserObject[] = [browserObj1];
    const dets: PropertyInfo<PropertyDetails>[] = [obj1Details];
    const subs: GmsSubscription<ValueDetails>[] = [obj1StatusSubResp, obj1DefPropSubResp];

    iconMapperServiceSpy.getGlobalIcon.and.returnValue(asyncData(iconCls));
    propertyServiceSpy.readPropertiesMulti.and.returnValue(asyncData(dets));
    valueSubscriptionServiceSpy.subscribeValues.and.returnValue(subs);
    valueSubscriptionServiceSpy.registerClient.and.returnValue(subscriptionReg);

    // act
    sniVm.activate(theLocale, chgRefSpy);
    sniVm.setContext(objs);

    tick(elapsedTime);

    const gvaVirt: GridVirtualizedArgs = new GridVirtualizedArgs([], true);
    const gvaNonvirt: GridVirtualizedArgs = new GridVirtualizedArgs([], false);

    sniVm.onGridVirtualizedChanged(gvaVirt);

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);

    // act
    sniVm.onGridVirtualizedChanged(gvaNonvirt);
    sniVm.deactivate();
    sniVm.dispose();

    tick(elapsedTime);

    // assert
    expect(valueSubscriptionServiceSpy.subscribeValues.calls.count()).toBe(0);
  }));

});
