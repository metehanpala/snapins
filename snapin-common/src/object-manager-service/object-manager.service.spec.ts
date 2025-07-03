import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { NEVER, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TraceService } from '@gms-flex/services-common';
import { BrowserObject, ObjectAttributes, Page, SystemBrowserServiceBase } from '@gms-flex/services';

import { ObjectManagerService } from './object-manager.service';

import { ModalDialogResult, ObjectManagerServiceModalOptions, ObjectManagerServiceModalResult } from './data.model';

class TestServiceTemplateModule {}

/* eslint-disable */

// Test data
const browserObjectGeneric: BrowserObject = Object.freeze({
  ObjectId: 'obj1',
  Descriptor: 'desc1',
  SystemId: 1,
  ViewId: 9,
  Location: 'System1:Something.SomethingElse.desc1',
  Attributes: Object.freeze({
    Alias: undefined,
    DefaultProperty: undefined,
    FunctionDefaultProperty: undefined,
    TypeId: 1001
  }) as ObjectAttributes
}) as BrowserObject;

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

/* eslint-enable */

// local variables
let objectManagerService: ObjectManagerService;
let traceServiceSpy: jasmine.SpyObj<TraceService>;
let systemBrowserServiceSpy: jasmine.SpyObj<SystemBrowserServiceBase>;
let modalServiceSpy: jasmine.SpyObj<BsModalService>;

const omsModalConfig: ObjectManagerServiceModalOptions = {
  singleSelection: true,
  hideSearch: false,
  roots: undefined,
  views: undefined,
  selectedNode: undefined,
  selectableTypes: undefined
};

/** Action method that should be called when the async work is complete */
/* eslint-disable-next-line */
interface DoneFn extends Function {
  (): void;

  /** fails the spec and indicates that it has completed. If the message is an Error, Error.message is used */
  fail: (message?: Error | string) => void;
}

// //////  Tests  /////////////
describe('ObjectManagerService', () => {

  beforeEach(waitForAsync(() => {
    traceServiceSpy = jasmine.createSpyObj('TraceService', ['isInfoEnabled', 'isDebugEnabled', 'debug', 'error', 'info']);
    systemBrowserServiceSpy = jasmine.createSpyObj('SystemBrowserService', ['searchNodes']);
    modalServiceSpy = jasmine.createSpyObj('BsModalService', ['hide', 'show']);

    objectManagerService = new ObjectManagerService(traceServiceSpy, systemBrowserServiceSpy, modalServiceSpy);
  })
  );

  /**
   * build tests
   */
  it('Should build without a problem',
    waitForAsync(() => {
      TestBed.compileComponents().then(() => {
        expect(true).toBeTruthy();
      });
    }));

  /**
   * constructor tests
   */
  it('Instantiate ObjectManagerService', () => {
    const omsLocal: ObjectManagerService = new ObjectManagerService(traceServiceSpy, systemBrowserServiceSpy, modalServiceSpy);
    expect(omsLocal instanceof ObjectManagerService).toBe(true);
  }
  );

  /**
   * show tests using default parameters, cancelled
   */

  it('show - Cancelled', fakeAsync(() => {
    const bsModelRef: BsModalRef = {
      content: {
        selectionChanged: NEVER,
        dialogBtnResult: of(ModalDialogResult.Cancelled).pipe(delay(10))
      },
      hide: () => {
        // nothing to do
      }
    } as BsModalRef;

    modalServiceSpy.show.and.returnValue(bsModelRef);

    objectManagerService.show('Object Manager Service Test').subscribe(
      (result: ObjectManagerServiceModalResult) => {
        expect(result.action).toBe(ModalDialogResult.Cancelled);
        expect(result.selection).toBe(undefined);
      },
      err => {
        fail(); // should not end up here!
      });

    tick(20);
  }));

  /**
   * show tests using default parameters, saved
   */

  it('show - OK', fakeAsync(() => {
    const bsModelRef: BsModalRef = {
      content: {
        selectionChanged: of([browserObj1WithFcnDefProp]).pipe(delay(5)),
        dialogBtnResult: of(ModalDialogResult.Ok).pipe(delay(10))
      },
      hide: () => {
        // nothing to do
      }
    } as BsModalRef;

    modalServiceSpy.show.and.returnValue(bsModelRef);

    objectManagerService.show('Object Manager Service Test').subscribe(
      (result: ObjectManagerServiceModalResult) => {
        expect(result.action).toBe(ModalDialogResult.Ok);
        expect(result.selection).toEqual([browserObj1WithFcnDefProp]);
      },
      err => {
        fail(); // should not end up here!
      });

    tick(20);
  }));

  /**
   * show and hide test
   */

  it('show and hide', fakeAsync(() => {
    const bsModelRef: BsModalRef = {
      content: {
        selectionChanged: NEVER,
        dialogBtnResult: NEVER
      },
      hide: () => {
        // nothing to do
      }
    } as BsModalRef;

    modalServiceSpy.show.and.returnValue(bsModelRef);

    objectManagerService.show('Object Manager Service Test', omsModalConfig).subscribe(
      (result: ObjectManagerServiceModalResult) => {
        expect(result.action).toBe(ModalDialogResult.Hidden);
        expect(result.selection).toBe(undefined);
      },
      err => {
        fail(); // should not end up here!
      });

    expect(objectManagerService.hide()).toBe(true);

    tick(10);
  }));

  /**
   * show and show tests
   */

  it('show and then show', fakeAsync(() => {
    const bsModelRef: BsModalRef = {
      content: {
        selectionChanged: of([browserObj1WithFcnDefProp]).pipe(delay(5)),
        dialogBtnResult: of(ModalDialogResult.Ok).pipe(delay(10))
      },
      hide: () => {
        // nothing to do
      }
    } as BsModalRef;

    modalServiceSpy.show.and.returnValue(bsModelRef);

    objectManagerService.show('Object Manager Service Test #1').subscribe(
      (result: ObjectManagerServiceModalResult) => {
        expect(result.action).toBe(ModalDialogResult.Ok);
        expect(result.selection).toEqual([browserObj1WithFcnDefProp]);
      },
      err => {
        fail(); // should not end up here!
      });

    tick(2);

    objectManagerService.show('Object Manager Service Test #2').subscribe(
      (result: ObjectManagerServiceModalResult) => {
        fail(); // should not end up here!
      },
      err => {
        expect(err.message).toBe('ObjectManager Dialog already active');
      });

    tick(10);

  }));

  /**
   * show, hide and show tests
   */

  it('show, hide and then show', fakeAsync(() => {
    const bsModelRef1: BsModalRef = {
      content: {
        selectionChanged: of([browserObj1WithFcnDefProp]).pipe(delay(2)),
        dialogBtnResult: of(ModalDialogResult.Ok).pipe(delay(3))
      },
      hide: () => {
        // nothing to do
      }
    } as BsModalRef;

    const bsModelRef2: BsModalRef = {
      content: {
        selectionChanged: of([browserObj1WithNoDefProp]).pipe(delay(2)),
        dialogBtnResult: of(ModalDialogResult.Ok).pipe(delay(5))
      },
      hide: () => {
        // nothing to do
      }
    } as BsModalRef;

    modalServiceSpy.show.and.returnValue(bsModelRef1);

    objectManagerService.show('Object Manager Service Test #1').subscribe(
      (result: ObjectManagerServiceModalResult) => {
        expect(result.action).toBe(ModalDialogResult.Hidden);
        expect(result.selection).toEqual(undefined);
      },
      err => {
        expect(err.message).toBe('ObjectManager Dialog already active');
      });

    expect(objectManagerService.hide()).toBe(true);

    modalServiceSpy.show.and.returnValue(bsModelRef2);

    objectManagerService.show('Object Manager Service Test #2').subscribe(
      (result: ObjectManagerServiceModalResult) => {
        expect(result.action).toBe(ModalDialogResult.Ok);
        expect(result.selection).toEqual([browserObj1WithNoDefProp]);
      },
      err => {
        expect(err.message).toBe('ObjectManager Dialog already active');
      });

    tick(10);
  }));

  /**
   * hide tests
   */

  it('hide without show', () => {
    expect(objectManagerService.hide()).toBe(false);
  }
  );

  /**
   * checkCnsNameUnique tests
   */

  it('should call checkCnsNameUnique - unique 1', fakeAsync(() => {
    const pageResponse: Page = {
      /* eslint-disable-next-line */
      Nodes: []
    } as Page;

    systemBrowserServiceSpy.searchNodes.and.returnValue(of(pageResponse));

    objectManagerService.checkCnsNameUnique(browserObjectGeneric, 'Mike_is_1SuperCoolDude').subscribe(
      (result: boolean) => {
        expect(result).toBe(true);
      },
      err => {
        fail(err); // should not end up here!
      });
  }));

  it('should call checkCnsNameUnique - unique 2', fakeAsync(() => {
    const pageResponse: Page = {
      /* eslint-disable-next-line */
      Nodes: undefined
    } as Page;

    systemBrowserServiceSpy.searchNodes.and.returnValue(of(pageResponse));

    objectManagerService.checkCnsNameUnique(browserObjectGeneric, 'Mike_is_1SuperCoolDude').subscribe(
      (result: boolean) => {
        expect(result).toBe(true);
      },
      err => {
        fail(err); // should not end up here!
      });
  }));

  it('should call checkCnsNameUnique - invalid arguments 1', fakeAsync(() => {
    objectManagerService.checkCnsNameUnique(undefined, 'Mike_is_1SuperCoolDude').subscribe(result => {
      fail(); // should not end up here!
    },
    err => {
      expect(err.message).toBe('Invalid arguments');
    });
  }));

  it('should call checkCnsNameUnique - invalid arguments 2', fakeAsync(() => {
    objectManagerService.checkCnsNameUnique(browserObjectGeneric, undefined).subscribe(result => {
      fail(); // should not end up here!
    },
    err => {
      expect(err.message).toBe('Invalid arguments');
    });
  }));

  it('should call checkCnsNameUnique - invalid arguments 3', fakeAsync(() => {
    objectManagerService.checkCnsNameUnique(browserObjectGeneric, '').subscribe(result => {
      fail(); // should not end up here!
    },
    err => {
      expect(err.message).toBe('Invalid arguments');
    });
  }));

  it('should call checkCnsNameUnique - error from ', fakeAsync(() => {
    systemBrowserServiceSpy.searchNodes.and.returnValue(throwError(new Error('error from server')));

    objectManagerService.checkCnsNameUnique(browserObjectGeneric, 'Mike_is_1SuperCoolDude').subscribe(result => {
      fail(); // should not end up here!
    },
    err => {
      expect(err.message).toBe('error from server');
    });
  }));

});
