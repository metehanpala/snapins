import { Component, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { IHfwMessage, IPreselectionService, IStorageService, MockSnapInBase, SnapInBase } from '@gms-flex/core';
import { StateData } from '@gms-flex/document-root-services';
import { DocumentServiceBase, FileUrl, GmsManagedTypes, SystemBrowserServiceBase } from '@gms-flex/services';
import { AppContextService, MockTraceService, TraceService } from '@gms-flex/services-common';
import { DocumentViewerComponent } from '@gms-flex/snapin-common';
import { TranslateService } from '@ngx-translate/core';
import { SiEmptyStateComponent, SiLoadingSpinnerComponent } from '@simpl/element-ng';
import { Observable, of, Subject } from 'rxjs';

import { SearchViewComponent } from '../search';
import { DocumentSnapinService } from '../services';
import { DocumentSnapInComponent } from './document-snapin.component';

@Component({
  /* eslint-disable-next-line */
    selector: 'gms-document-search-view',
  template: `<div></div>`,
  providers: [
    { provide: SearchViewComponent, useClass: MockSearchViewComponent }
  ],
  standalone: false
})
class MockSearchViewComponent {
  @Input() public selectedObject: any = undefined;
  @Input() public fullId: any = undefined;
}

@Component({
  selector: 'gms-document-viewer',
  template: '<div></div>',
  providers: [
    { provide: DocumentViewerComponent, useClass: MockDocumentViewerComponent }
  ],
  standalone: false
})
class MockDocumentViewerComponent {
  @Input() public browserMsg: any = undefined;
}

class MockDomSanitizer {
  public bypassSecurityTrustResourceUrl(value: string): SafeResourceUrl {
    return 'test';
  }
}

class MockTranslateService {
  public use(lang: string): Observable<any> {
    return of(undefined);
  }
  public setDefaultLang(lang: string): void {
    return null;
  }
  /* eslint-disable */
  public get(key: string | string[], interpolateParams?: any): Observable<any> {
    return of({
      'NEW-TAB-BUTTON': 'newTab',
      'EMPTY-TITLE-FILE': 'emptyTitle',
      'EMPTY-CONTENT-FILE': 'emptyContent'
    });
  }
  /* eslint-enable */
  public getBrowserLang(): string {
    return undefined;
  }
}

class MockAppContextService {
  public get userCulture(): Observable<string> {
    return of(undefined);
  }
  public get defaultCulture(): Observable<string> {
    return of(undefined);
  }
}

describe('Document SnapIn component', () => {
  let fixture;
  let component;

  /* eslint-disable */
  const storageService: any = {
    typeId: 'test',
    getState(): StateData {
      return {
        path: 'test',
        scrollTop: 1,
        scrollLeft: 2,
        skip: 3,
        tilesScrollTop: 4,
        searchString: 'test'
      };
    },
    setState(): void { return null; },
    clearState(): void { return null; },
    getDirtyState(): boolean { return false; },
    setDirtyState(): void { return null; }
  };
  /* eslint-enable */

  const mockMessageBroker: any = jasmine.createSpyObj('mockMessageBroker', ['getStorageService', 'getMessage']);
  mockMessageBroker.getStorageService.and.returnValue(storageService);
  mockMessageBroker.getMessage.and.returnValue(of(null));

  const mockSystemBrowserService: any = jasmine.createSpyObj('mockSystemBrowserService', ['searchNodes']);
  mockSystemBrowserService.searchNodes.and.returnValue(of(undefined));

  const mockDocumentService: any = jasmine.createSpyObj('mockDocumentService', ['stopRequest', 'getUrl']);
  mockDocumentService.stopRequest.and.returnValue(null);
  mockDocumentService.getUrl.and.returnValue(Promise.resolve(undefined));

  const mockDocumentSnapinService: any = jasmine.createSpyObj(
    'mockDocumentSnapinService', ['getTargetNavigationBrowserObj', 'findWhitelist'], { documentTileSelectionSub: new Subject<any>() }
  );
  mockDocumentSnapinService.getTargetNavigationBrowserObj.and.returnValue(of(undefined));
  mockDocumentSnapinService.findWhitelist.and.returnValue(undefined);

  const mockResponse: any = jasmine.createSpyObj('mockResponse', ['text']);
  mockResponse.text.and.returnValue(Promise.resolve('test'));

  /* eslint-disable */
  const iframe: any = {
    scrollTop: 2,
    scrollLeft: 3,
    contentWindow: {
      document: {
        body: {
          scrollTop: 5,
          scrollLeft: 7
        }
      }
    },
    addEventListener(): void { return null; }
  };
  /* eslint-enable */

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        DocumentSnapInComponent,
        MockSearchViewComponent,
        MockDocumentViewerComponent
      ],
      providers: [
        { provide: SnapInBase, useValue: MockSnapInBase },
        IPreselectionService,
        IStorageService,
        { provide: ActivatedRoute, useValue: {
          'snapshot': {
            'data': {
              'frameId': 'frameId_Test',
              'paneId': 'paneId_Test',
              'snapInId': 'snapInId_Test',
              'fullId': 'fullId_Test'
            }
          }

        }
        },
        { provide: TraceService, useClass: MockTraceService },
        { provide: DomSanitizer, useClass: MockDomSanitizer },
        { provide: DocumentServiceBase, useValue: mockDocumentService },
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: AppContextService, useClass: MockAppContextService },
        { provide: DocumentSnapinService, useValue: mockDocumentSnapinService },
        { provide: SystemBrowserServiceBase, useValue: mockSystemBrowserService },
        { provide: IHfwMessage, useValue: mockMessageBroker }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentSnapInComponent);
    component = fixture.componentInstance;

    spyOn(document, 'getElementById').and.returnValue(iframe);

    component.fullId = {
      /* eslint-disable-next-line */
      fullId(): string {
        return 'test';
      }
    };

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should build without a problem', () => {
    component.ngOnInit();
    expect(component instanceof DocumentSnapInComponent).toBe(true);
  });

  it('should destroy without a problem', () => {
    component.fileUrl = 'test';
    component.path = 'test';

    // pdf == true
    mockDocumentService.stopRequest.calls.reset();
    component.pdf = true;
    component.ngOnDestroy();

    expect(mockDocumentService.stopRequest).toHaveBeenCalledTimes(1);
    expect(component._subscriptions.length).toBeGreaterThan(0);

    // pdf == false
    mockDocumentService.stopRequest.calls.reset();
    component.pdf = false;
    component.ngOnDestroy();

    expect(mockDocumentService.stopRequest).toHaveBeenCalledTimes(1);
    expect(component._subscriptions.length).toBeGreaterThan(0);
  });

  it('should handle MessageBroker message', async () => {
    const mockCreateTiles: any = spyOn(component, 'createTiles').and.callThrough();

    // managed type is "FILE_VIEWER"
    /* eslint-disable */
    const msg1: any = {
      data: [{
        Attributes: {
          ManagedType: GmsManagedTypes.FILE_VIEWER.id
        }
      }]
    };
    /* eslint-enable */
    mockMessageBroker.getMessage.and.returnValue(of(msg1));

    component.ngOnInit();

    expect(mockCreateTiles).toHaveBeenCalledTimes(1);
    expect(component.selectedObject).toBe(msg1.data[0]);
    expect(component.fileUrl).toBeUndefined();
    expect(component.path).toBeUndefined();
    expect(component.tileView).toBeTrue();

    // managed type is "EXTERNAL_DOCUMENT"
    mockCreateTiles.calls.reset();

    /* eslint-disable */
    const msg2: any = {
      data: [{
        Attributes: {
          ManagedType: GmsManagedTypes.EXTERNAL_DOCUMENT.id
        }
      }]
    };
    mockMessageBroker.getMessage.and.returnValue(of(msg2));
    /* eslint-enable */

    await component.ngOnInit();

    expect(await mockCreateTiles).toHaveBeenCalledTimes(0);
    expect(await component.tileView).toBeFalse();

    // m.data is null
    mockCreateTiles.calls.reset();

    const msg3: any = {
      data: null
    };
    mockMessageBroker.getMessage.and.returnValue(of(msg3));
    // res.Nodes is not null
    /* eslint-disable */
    const nodes1: any = {
      Nodes: [{
        Designation: 'test'
      }]
    };
    /* eslint-enable */
    mockSystemBrowserService.searchNodes.and.returnValue(of(nodes1));

    await component.ngOnInit();

    expect(await mockCreateTiles).toHaveBeenCalledTimes(0);
    // res.Nodes is null
    mockCreateTiles.calls.reset();
    const nodes2: any = {
      /* eslint-disable-next-line */
      Nodes: null
    };
    mockSystemBrowserService.searchNodes.and.returnValue(of(nodes2));

    await component.ngOnInit();

    expect(await mockCreateTiles).toHaveBeenCalledTimes(0);

    // m is null
    mockCreateTiles.calls.reset();
    mockMessageBroker.getMessage.and.returnValue(of(null));

    await component.ngOnInit();

    expect(await mockCreateTiles).toHaveBeenCalledTimes(0);
  });
});
