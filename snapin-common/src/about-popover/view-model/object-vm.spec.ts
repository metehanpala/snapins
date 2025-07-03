import { fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { Observable, Observer, of, Subject } from 'rxjs';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import {
  BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn, ObjectsServiceBase,
  SiIconMapperService, SystemBrowserServiceBase, SystemsServiceBase
} from '@gms-flex/services';
import { ObjectManagerCoreServiceBase } from '../../object-manager-core';
import { ServiceCatalog } from './types';
import { ObjectViewModel } from './object-vm';
import { ContextState, ViewState } from './object-vm.base';
import { ObjectItem } from './object-item';

describe('ObjectViewModel', () => {

  const desig = 'sys.v1:root.node1';
  const desig2 = 'sys.v1:root.node2';
  const desc = 'node1-desc';
  const name = 'node1-name';
  const sniId = 'sniTest';
  let vm: ObjectViewModel;

  let traceServiceMock: TraceService;
  let cnsHelperServiceSpy: jasmine.SpyObj<CnsHelperService>;
  let objectManagerCoreServiceSpy: jasmine.SpyObj<ObjectManagerCoreServiceBase>;
  let objectsServiceSpy: jasmine.SpyObj<ObjectsServiceBase>;
  let systemBrowserServiceSpy: jasmine.SpyObj<SystemBrowserServiceBase>;
  let siIconMapperServiceSpy: jasmine.SpyObj<SiIconMapperService>;
  let cnsLabelChangeInd: Subject<CnsLabel>;
  let siSystemsServiceSpy: jasmine.SpyObj<SystemsServiceBase>;

  // Helper: Create an observable that returns the provided data when subscribed after a single
  // turn (a.k.a. tick) of the JS engine.
  const asyncData = <T>(data: T): Observable<T> => Observable.create((o: Observer<T>) => {
    setTimeout(() => {
      o.next(data);
      o.complete();
    }, 0);
  });

  beforeEach(waitForAsync(() => {
    // Create subject to generate name-format change indications
    cnsLabelChangeInd = new Subject<CnsLabel>();
    // Create mocks
    traceServiceMock = new MockTraceService() as TraceService;
    cnsHelperServiceSpy = jasmine.createSpyObj<CnsHelperService>('CnsHelperService',
      ['getCnsLabelsOrdered'],
      {
        activeCnsLabel: cnsLabelChangeInd
      });
    objectManagerCoreServiceSpy = jasmine.createSpyObj<ObjectManagerCoreServiceBase>('ObjectManagerCoreServiceBase',
      ['findPathObjects']);
    objectsServiceSpy = jasmine.createSpyObj<ObjectsServiceBase>('ObjectsServiceBase',
      ['getServiceText']);
    systemBrowserServiceSpy = jasmine.createSpyObj<SystemBrowserServiceBase>('SystemBrowserServiceBase',
      ['searchNodes']);
    siIconMapperServiceSpy = jasmine.createSpyObj<SiIconMapperService>('SiIconMapperService',
      ['getGlobalIcon']);
    siSystemsServiceSpy = jasmine.createSpyObj<SystemsServiceBase>('SystemsServiceBase',
      ['getSystemsExt']);

    // Create view-model object to test
    vm = new ObjectViewModel(
      new ServiceCatalog(
        traceServiceMock,
        cnsHelperServiceSpy,
        objectManagerCoreServiceSpy,
        objectsServiceSpy,
        systemBrowserServiceSpy,
        siIconMapperServiceSpy,
        siSystemsServiceSpy),
      sniId,
      undefined);
  }));

  /* eslint-disable */
  const boEmpty: Readonly<BrowserObject> = {
    Descriptor: undefined,
    Designation: undefined,
    HasChild: false,
    Name: undefined,
    Location: undefined,
    ObjectId: undefined,
    SystemId: 0,
    ViewId: 0,
    ViewType: 0,
    Attributes: {
      Alias: undefined,
      DefaultProperty: undefined,
      DisciplineDescriptor: undefined,
      DisciplineId: 0,
      FunctionName: undefined,
      ManagedType: 0,
      ManagedTypeName: undefined,
      ObjectId: undefined,
      SubDisciplineDescriptor: undefined,
      SubDisciplineId: 0,
      SubTypeDescriptor: undefined,
      SubTypeId: 0,
      TypeDescriptor: undefined,
      TypeId: 0,
      ObjectModelName: undefined
    }
  };
  /* eslint-enable */

  /*
  const boSample: Readonly<BrowserObject> = {...boEmpty,
    Designation: "sys.view.root",
    // Name: "root"
  };
*/

  it('#constructor should check for invalid ServiceCatalog', () => {
    expect(() => new ObjectViewModel(undefined, sniId, undefined)).toThrow();
  });

  it('#constructor should put view-model in correct initial state', () => {
    expect(vm.contextState).toBe(ContextState.Empty);
    expect(vm.viewState).toBe(ViewState.None);
    expect(vm.objectList).toBeDefined();
    expect(vm.objectList.length).toBe(0);
    expect(vm.selectedObject).toBeUndefined();
    expect(vm.selectedObjectInSelectedPath).toBeUndefined();
  });

  it('#isObjectValid should detect undefined object', () => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    expect(vmObj.isObjectValid(undefined)).toBe(false);
    expect(vmObj.isObjectValid(null)).toBe(false);
  });

  it('#isObjectValid should detect object with undefined designation', () => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    const bo: BrowserObject = { ...boEmpty };
    bo.Designation = undefined;
    expect(vmObj.isObjectValid(bo)).toBe(false);
    bo.Designation = null;
    expect(vmObj.isObjectValid(bo)).toBe(false);
    bo.Designation = '';
    expect(vmObj.isObjectValid(bo)).toBe(false);
  });

  it('#isObjectValid should require a designation with view and a root node (system optional)', () => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    const bo: BrowserObject = { ...boEmpty };
    // Invalid
    bo.Designation = 'sys.view';
    expect(vmObj.isObjectValid(bo)).toBe(false);
    bo.Designation = 'view:';
    expect(vmObj.isObjectValid(bo)).toBe(false);
    bo.Designation = ':root';
    expect(vmObj.isObjectValid(bo)).toBe(false);
    bo.Designation = 'x';
    expect(vmObj.isObjectValid(bo)).toBe(false);
    bo.Designation = '.:';
    expect(vmObj.isObjectValid(bo)).toBe(false);
    // Valid
    bo.Designation = 'view:root';
    expect(vmObj.isObjectValid(bo)).toBe(true);
    bo.Designation = 'sys.view:root.child';
    expect(vmObj.isObjectValid(bo)).toBe(true);
  });

  it('#resolveNames should return empty array on undefined input', () => {
    const arr: string[] = vm.resolveNames(undefined);
    expect(arr).toBeDefined();
    expect(arr.length).toBe(0);
  });

  xit('#resolveNames and #secondaryLabelEnabled should react to name-format changes', fakeAsync(() => {
    const bo: BrowserObject = { ...boEmpty };
    bo.Designation = desig;
    bo.Descriptor = desc;
    bo.Name = name;
    const icon = 'my-icon';

    siIconMapperServiceSpy.getGlobalIcon.and.returnValue(of(icon));
    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(
      [bo.Descriptor, bo.Name],
      [bo.Name],
      [bo.Name, bo.Descriptor]);

    cnsLabelChangeInd.next(new CnsLabel(CnsLabelEn.DescriptionAndName));
    tick(110); // because the view-model debounces change indications at 100ms!

    vm.setContext([bo]).subscribe();
    tick(1);
    expect(vm.secondaryLabelEnabled).toBe(true);
    expect(vm.objectList[0].objectLabel.primary).toBe(bo.Descriptor);
    expect(vm.objectList[0].objectLabel.secondary).toBe(bo.Name);

    cnsLabelChangeInd.next(new CnsLabel(CnsLabelEn.Name));
    tick(110);
    expect(vm.secondaryLabelEnabled).toBe(false);
    expect(vm.objectList[0].objectLabel.primary).toBe(bo.Name);
    expect(vm.objectList[0].objectLabel.secondary).toBeFalsy(); // empty-string / undefined are both acceptable

    cnsLabelChangeInd.next(new CnsLabel(CnsLabelEn.NameAndDescription));
    tick(110);
    expect(vm.secondaryLabelEnabled).toBe(true);
    expect(vm.objectList[0].objectLabel.primary).toBe(bo.Name);
    expect(vm.objectList[0].objectLabel.secondary).toBe(bo.Descriptor);
  }));

  it('#setContext should emit error if any one object in input array is invalid', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = 'sys.v1:root';
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = 'sys.v2'; // invalid designation!
    spyOn<any>(vm, 'setContextInternal').and.returnValue(of(undefined)); // internal vm method should NOT be called
    let errFlag = false;
    vm.setContext([bo1, bo2]).subscribe(
      () => fail('expected error'),
      err => errFlag = true
    );
    tick(1);
    expect(errFlag).toBeTrue();
  }));

  it('#setContext should process single object', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.Descriptor = desc;
    bo1.Name = name;
    const icon = 'my-icon';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValue([bo1.Descriptor, bo1.Name]);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValue(of(icon));

    let contextChangedCount = 0;
    vm.contextChanged.subscribe(() => contextChangedCount++);

    let isOk = false;
    vm.setContext([bo1]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(1);
    expect(vm.contextState).toBe(ContextState.SingleObject);
    expect(vm.viewState).toBe(ViewState.None);
    expect(vm.objectList).toBeDefined();
    expect(vm.objectList.length).toBe(1);
    expect(vm.objectList[0]).toBeDefined();
    expect(vm.objectList[0].objectLabel).toBeDefined();
    expect(vm.objectList[0].objectLabel.primary).toBe(bo1.Descriptor);
    expect(vm.objectList[0].objectLabel.secondary).toBe(bo1.Name);
    expect(vm.objectList[0].objectLabel.iconCls).toBe(icon);
    expect(vm.selectedObject).toBeUndefined();
  }));

  it('#setContext should correctly reset state on second call', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.Descriptor = desc;
    bo1.Name = name;
    const icon1 = 'my-icon1';

    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.Descriptor = 'node2-desc';
    bo2.Name = 'node2-name';
    const icon2 = 'my-icon2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues([bo1.Descriptor, bo1.Name], [bo2.Descriptor, bo2.Name]);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of(icon1), of(icon2));

    let contextChangedCount = 0;
    vm.contextChanged.subscribe(() => contextChangedCount++);

    let isOk = false;
    vm.setContext([bo1]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(1);
    vm.showObject(vm.objectList[0]); // force view-state change / selected-object change

    // Set new context
    isOk = false;
    vm.setContext([bo2]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(2);
    expect(vm.contextState).toBe(ContextState.SingleObject);
    expect(vm.viewState).toBe(ViewState.None);
    expect(vm.objectList).toBeDefined();
    expect(vm.objectList.length).toBe(1);
    expect(vm.objectList[0]).toBeDefined();
    expect(vm.objectList[0].objectLabel).toBeDefined();
    expect(vm.objectList[0].objectLabel.primary).toBe(bo2.Descriptor);
    expect(vm.objectList[0].objectLabel.secondary).toBe(bo2.Name);
    expect(vm.objectList[0].objectLabel.iconCls).toBe(icon2);
    expect(vm.selectedObject).toBeUndefined();
  }));

  it('#setContext should correctly clear state on empty call', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.Descriptor = desc;
    bo1.Name = name;
    const icon1 = 'my-icon1';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues([bo1.Descriptor, bo1.Name]);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of(icon1));

    let contextChangedCount = 0;
    vm.contextChanged.subscribe(() => contextChangedCount++);

    let isOk = false;
    vm.setContext([bo1]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(1);
    vm.showObject(vm.objectList[0]); // force view-state change / selected-object change

    // Clear context
    isOk = false;
    vm.setContext(undefined).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(2);
    expect(vm.contextState).toBe(ContextState.Empty);
    expect(vm.viewState).toBe(ViewState.None);
    expect(vm.objectList).toBeDefined();
    expect(vm.objectList.length).toBe(0);
    expect(vm.selectedObject).toBeUndefined();
  }));

  it('#setContext should detect no change', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.Descriptor = desc;
    bo1.Name = name;
    const icon1 = 'my-icon1';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues([bo1.Descriptor, bo1.Name]);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of(icon1));

    let contextChangedCount = 0;
    vm.contextChanged.subscribe(() => contextChangedCount++);

    let isOk = false;
    vm.setContext([bo1]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(1);
    vm.showObject(vm.objectList[0]); // force view-state change / selected-object change

    // Redundant call (should have no effect on VM state)
    isOk = false;
    vm.setContext([bo1]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(1); // no context change!
    expect(vm.contextState).toBe(ContextState.SingleObject);
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.objectList).toBeDefined();
    expect(vm.objectList.length).toBe(1);
    expect(vm.selectedObject).toBe(vm.objectList[0]);
  }));

  it('#setContext should detect no change of empty context', fakeAsync(() => {
    let contextChangedCount = 0;
    vm.contextChanged.subscribe(() => contextChangedCount++);

    let isOk = false;
    vm.setContext(undefined).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(0);
  }));

  it('#setContext should process multiple objects', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.Descriptor = desc;
    bo1.Name = name;
    const icon1 = 'my-icon1';

    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.Descriptor = 'node2-desc';
    bo2.Name = 'node2-name';
    const icon2 = 'my-icon2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues([bo1.Descriptor, bo1.Name], [bo2.Descriptor, bo2.Name]);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of(icon1), of(icon2));

    let contextChangedCount = 0;
    vm.contextChanged.subscribe(() => contextChangedCount++);

    let isOk = false;
    vm.setContext([bo1, bo2]).subscribe(
      () => isOk = true,
      err => fail(err)
    );
    tick(1);
    expect(isOk).toBeTrue();
    expect(contextChangedCount).toBe(1);
    expect(vm.contextState).toBe(ContextState.MultipleObjects);
    expect(vm.viewState).toBe(ViewState.None);
    expect(vm.objectList).toBeDefined();
    expect(vm.objectList.length).toBe(2);
    expect(vm.objectList[0]).toBeDefined();
    expect(vm.objectList[0].objectLabel).toBeDefined();
    expect(vm.objectList[0].objectLabel.primary).toBe(bo1.Descriptor);
    expect(vm.objectList[0].objectLabel.secondary).toBe(bo1.Name);
    expect(vm.objectList[0].objectLabel.iconCls).toBe(icon1);
    expect(vm.objectList[1]).toBeDefined();
    expect(vm.objectList[1].objectLabel).toBeDefined();
    expect(vm.objectList[1].objectLabel.primary).toBe(bo2.Descriptor);
    expect(vm.objectList[1].objectLabel.secondary).toBe(bo2.Name);
    expect(vm.objectList[1].objectLabel.iconCls).toBe(icon2);
    expect(vm.selectedObject).toBeUndefined();
  }));

  it('#showDefaultView should set view-state to NONE for empty context', fakeAsync(() => {
    vm.showDefaultView();
    expect(vm.contextState).toBe(ContextState.Empty);
    expect(vm.viewState).toBe(ViewState.None);
  }));

  it('#showDefaultView should set view-state to OBJECT-INFO for single-object context', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValue(['X', 'Y']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValue(of('my-icon'));

    vm.setContext([bo1]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe(bo1.ObjectId);
  }));

  it('#showDefaultView should set view-state to LIST for multiple-object context', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.ObjectId = 'obj2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(['X1', 'Y1'], ['X2', 'Y2']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of('my-icon1'), of('my-icon2'));

    vm.setContext([bo1, bo2]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();
  }));

  it('#showList and #showObject should manage view-state transitions', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.ObjectId = 'obj2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(['X1', 'Y1'], ['X2', 'Y2']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of('my-icon1'), of('my-icon2'));

    vm.setContext([bo1, bo2]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();

    spyOn<any>(vm.objectList[1], 'readDetails').and.returnValue(undefined);
    spyOn<any>(vm.objectList[1], 'firstPath').and.returnValue(undefined);
    vm.showObject(vm.objectList[1]);
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj2');

    vm.showList();
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();

    spyOn<any>(vm.objectList[0], 'readDetails').and.returnValue(undefined);
    spyOn<any>(vm.objectList[0], 'firstPath').and.returnValue(undefined);
    vm.showObject(vm.objectList[0]);
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj1');
  }));

  it('#showObject should handle invalid object', fakeAsync(() => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.ObjectId = 'obj2';
    const bo69: BrowserObject = { ...boEmpty };
    bo69.Designation = 'sys.v1:root.node69';
    bo69.ObjectId = 'obj69';

    // Create dummy object that does not exist in vm object-list
    const dummy: ObjectItem = new ObjectItem(vmObj.svc, undefined, vmObj, bo69, true);

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(['X1', 'Y1'], ['X2', 'Y2']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of('my-icon1'), of('my-icon2'));

    vm.setContext([bo1, bo2]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();

    vm.showObject(dummy);
    // Should be not change in view-state!
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();

    spyOn<any>(vm.objectList[1], 'readDetails').and.returnValue(undefined);
    spyOn<any>(vm.objectList[1], 'firstPath').and.returnValue(undefined);
    vm.showObject(vm.objectList[1]);
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj2');

    vm.showObject(dummy);
    // Should be not change in view-state!
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj2');
  }));

  it('#showObject and #showPaths should manage view-state transitions', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.ObjectId = 'obj2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(['X1', 'Y1'], ['X2', 'Y2']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of('my-icon1'), of('my-icon2'));
    vm.setContext([bo1, bo2]).subscribe();
    tick(1);

    spyOn<any>(vm.objectList[1], 'readDetails').and.returnValue(undefined);
    spyOn<any>(vm.objectList[1], 'firstPath').and.returnValue(undefined);
    vm.showObject(vm.objectList[1]);
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj2');
    expect(vm.selectedObject.restoreScrollPosDetail).toBeFalsy();

    spyOn<any>(vm.objectList[1], 'readPathHeaders').and.returnValue(undefined);
    vm.showPaths(true); // `true` flag indicates scroll position of selected object should be marked to be maintained
    expect(vm.viewState).toBe(ViewState.Paths);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj2');
    expect(vm.selectedObject.restoreScrollPosDetail).toBe(true);

    vm.showObject(); // undefined item-param indicates that last-selected object should be shown
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe('obj2');
  }));

  it('#showPaths should handle invalid state transition', fakeAsync(() => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;
    bo2.ObjectId = 'obj2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(['X1', 'Y1'], ['X2', 'Y2']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of('my-icon1'), of('my-icon2'));
    vm.setContext([bo1, bo2]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();

    // Cannot transition from list-view to path-view; no selected object!
    vm.showPaths(true);
    expect(vm.viewState).toBe(ViewState.List);
    expect(vm.selectedObject).toBeUndefined();
  }));

  it('#showPaths and #showObjectAncestor should manage view-state transitions', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo1child1: BrowserObject = { ...boEmpty };
    bo1child1.Designation = 'sys.v1:root.node1.child1';
    bo1child1.ObjectId = 'objchild1';
    const bo1child2: BrowserObject = { ...boEmpty };
    bo1child2.Designation = 'sys.v1:root.node1.child2';
    bo1child2.ObjectId = 'objchild2';

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValue(['X', 'Y']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValue(of('my-icon'));

    vm.setContext([bo1]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe(bo1.ObjectId);

    spyOn<any>(vm.selectedObject, 'getOtherObjects').and.returnValue(of(undefined));
    objectManagerCoreServiceSpy.findPathObjects.and.returnValue(of([bo1child1, bo1child2]));
    vm.showPaths();
    vm.selectedObject.firstPath();
    expect(vm.viewState).toBe(ViewState.Paths);
    expect(vm.selectedObject.pathHeaderList).toBeDefined();
    expect(vm.selectedObject.pathHeaderList.length).toBe(1);
    expect(vm.selectedObject.selectedPathHeader).toBe(vm.selectedObject);
    expect(vm.selectedObject.selectedPathHeader.ancestorList).toBeDefined();
    expect(vm.selectedObject.selectedPathHeader.ancestorList.length).toBe(2);
    expect(vm.selectedObject.selectedPathHeader.restoreScrollPosPath).toBe(false);
    expect(vm.selectedObjectInSelectedPath).toBeUndefined();

    vm.showObjectAncestor(vm.selectedObject.selectedPathHeader.ancestorList[1]);
    expect(vm.viewState).toBe(ViewState.ObjectAncestorInfo);
    expect(vm.selectedObject.selectedPathHeader).toBe(vm.selectedObject);
    expect(vm.selectedObject.selectedPathHeader.restoreScrollPosPath).toBe(true);
    expect(vm.selectedObjectInSelectedPath).toBeDefined();
    expect(vm.selectedObjectInSelectedPath).toBe(vm.selectedObject.selectedPathHeader.ancestorList[1]);

    vm.showPaths();
    expect(vm.viewState).toBe(ViewState.Paths);
    expect(vm.selectedObject.selectedPathHeader).toBe(vm.selectedObject);
    expect(vm.selectedObjectInSelectedPath).toBeUndefined();
  }));

  it('#showObjectAncestor should handle invalid state transition', fakeAsync(() => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    bo1.ObjectId = 'obj1';
    const bo1child1: BrowserObject = { ...boEmpty };
    bo1child1.Designation = 'sys.v1:root.node1.child1';
    bo1child1.ObjectId = 'objchild1';

    // Create dummy object that does not exist in vm object-list
    const dummy: ObjectItem = new ObjectItem(vmObj.svc, undefined, vmObj, bo1child1, true);

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValue(['X', 'Y']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValue(of('my-icon'));

    vm.setContext([bo1]).subscribe();
    tick(1);
    vm.showDefaultView();
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe(bo1.ObjectId);

    // Child object has not been loaded yet; invalid transition
    vm.showObjectAncestor(dummy);
    expect(vm.viewState).toBe(ViewState.ObjectInfo);
    expect(vm.selectedObject).toBeDefined();
    expect(vm.selectedObject.objectId).toBe(bo1.ObjectId);
  }));

  it('#dispose should check if already disposed', () => {
    const vmObj: any = vm as any; // to circumvent TS-compiler to access private members
    const clearFuncSpy: jasmine.Spy = spyOn<any>(vm, 'clear');
    expect(clearFuncSpy.calls.count()).toBe(0);
    expect(vmObj.isDisposed).toBe(false);

    clearFuncSpy.and.callThrough();
    vm.dispose();
    expect(vmObj.isDisposed).toBe(true);
    expect(clearFuncSpy.calls.count()).toBe(1);

    clearFuncSpy.and.callThrough();
    vm.dispose(); // redundant call should be harmless
    expect(vmObj.isDisposed).toBe(true);
    expect(clearFuncSpy.calls.count()).toBe(1);
  });

  it('#dispose should dispose of subordinate objects', fakeAsync(() => {
    const bo1: BrowserObject = { ...boEmpty };
    bo1.Designation = desig;
    const bo2: BrowserObject = { ...boEmpty };
    bo2.Designation = desig2;

    cnsHelperServiceSpy.getCnsLabelsOrdered.and.returnValues(['X1', 'Y1'], ['X2', 'Y2']);
    siIconMapperServiceSpy.getGlobalIcon.and.returnValues(of('my-icon1'), of('my-icon2'));

    vm.setContext([bo1, bo2]).subscribe();
    tick(1);

    const obj1: any = vm.objectList[0];
    const obj2: any = vm.objectList[1];
    expect(obj1.isDisposed).toBe(false);
    expect(obj2.isDisposed).toBe(false);
    vm.dispose();
    expect(obj1.isDisposed).toBe(true);
    expect(obj2.isDisposed).toBe(true);
  }));

  // it("", () => {});
});
