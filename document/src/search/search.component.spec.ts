import { AfterViewInit, Component, EventEmitter, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TileScrolledEvent, TilesViewComponent, TilesViewDataResult } from '@gms-flex/controls';
import { IHfwMessage, IPreselectionService, IStorageService } from '@gms-flex/core';
import { StateData } from '@gms-flex/document-root-services';
import { CnsHelperService, CnsLabel, GmsManagedTypes, Page,
  SystemBrowserServiceBase, ValueDetails, ValueServiceBase } from '@gms-flex/services';
import { SiSearchBarComponent } from '@simpl/element-ng';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { DocumentSnapinService } from '../services';
import { SearchViewComponent } from './search.component';

@Component({
  /* eslint-disable-next-line */
    selector: 'si-search-bar',
  template: `<div></div>`,
  providers: [
    { provide: SiSearchBarComponent, useClass: MockSiSearchBarComponent }
  ],
  standalone: false
})
class MockSiSearchBarComponent implements OnInit, OnChanges, OnDestroy {
  private _value: any = 'test';

  public ngOnChanges(): void {
    return null;
  }
  public ngOnInit(): void {
    return null;
  }
  public ngOnDestroy(): void {
    return null;
  }
  public resetForm(): void {
    return null;
  }
  public get value(): string {
    return this._value;
  }
  public set value(value: string) {
    this._value = value;
  }
}

@Component({
  /* eslint-disable-next-line */
    selector: 'hfw-tiles-view',
  template: `<div></div>`,
  providers: [
    { provide: TilesViewComponent, useClass: MockTilesViewComponent }
  ],
  standalone: false
})
class MockTilesViewComponent implements OnDestroy, OnChanges, OnInit, AfterViewInit {
  @Input() public data: any = 'data';
  @Input() public isVirtual = false;
  @Input() public loading = false;
  @Input() public pageSize = 20;
  @Input() public skip = 0;
  @Input() public set tileSize(size: string) {
    //
  }
  @Output() public readonly scrollPageChange: EventEmitter<TileScrolledEvent> = new EventEmitter();
  public ngOnChanges(): void {
    return null;
  }
  public ngOnInit(): void {
    return null;
  }
  public ngAfterViewInit(): void {
    return null;
  }
  public ngOnDestroy(): void {
    return null;
  }
  public getScrollTop(): any {
    return undefined;
  }
  public scrollTo(scrollTop: number): void {
    return null;
  }
}

/* eslint-disable */
class MockValueService {
  private readonly valueDetails: ValueDetails = {
    DataType: 'test',
    ErrorCode: 0,
    SubscriptionKey: 0,
    Value: {
      Value: 'file://test.txt',
      DisplayValue: 'test',
      Timestamp: 'test',
      QualityGood: true,
      Quality: 'test'
    },
    IsArray: false
  };
  readValues(objectOrPropertyId: string[], booleansAsNumericText?: boolean): Observable<[ValueDetails]> {
    return of([this.valueDetails]);
  }
}
/* eslint-enable */

class MockCnsHelperService {
  public activeCnsLabelValue: CnsLabel = new CnsLabel(undefined, null, null);

  public get activeCnsLabel(): Observable<any> {
    /* eslint-disable-next-line*/
    return of({ ActiveCnsLabelValue: new CnsLabel(undefined, null, null) });
  }
}

/* eslint-disable */
class MockSystemBrowserService {
  private readonly mockBrowserObject = {
    Attributes: {
      ManagedType: GmsManagedTypes.EXTERNAL_DOCUMENT
    },
    Descriptor: 'test',
    Designation: 'System1.ApplicationView:ApplicationView.Documents.test',
    HasChild: false,
    Name: 'test',
    Location: 'System1.ApplicationView:ApplicationView.Documents.test',
    ObjectId: 'test',
    SystemId: 9,
    ViewId: 8,
    ViewType: 7
  };
  private readonly page: any = {
    Nodes: [this.mockBrowserObject],
    Page: 1,
    Size: 1,
    Total: 1
  };
  public searchNodes(systemId: number, searchString: string, viewId: number): Observable<Page> {
    return of(this.page);
  }
}

describe('SearchComponent', () => {
  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  const preselectService: IPreselectionService = undefined;
  const storageService: IStorageService = {
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

  // Mocks for hfw-core dependencies
  const mockMessageBroker: any = jasmine.createSpyObj('mockMessageBroker', ['getMessage', 'sendMessage', 'getPreselectionService', 'getStorageService']);
  mockMessageBroker.getMessage.and.returnValue(nullObservable);
  mockMessageBroker.getPreselectionService.and.returnValue(preselectService);
  mockMessageBroker.getStorageService.and.returnValue(storageService);

  const mockDocumentSnapinService: any = jasmine.createSpyObj('DocumentSnapinService', ['onTileClick', 'setSelectedObject']);

  /* eslint-disable */
  const mockBrowserObject = {
    Attributes: { ManagedType: GmsManagedTypes.EXTERNAL_DOCUMENT },
    Descriptor: 'test',
    Designation: 'System1.ApplicationView:ApplicationView.Documents.test',
    HasChild: false,
    Name: 'test',
    Location: 'System1.ApplicationView:ApplicationView.Documents.test',
    ObjectId: 'test',
    SystemId: 9,
    ViewId: 8,
    ViewType: 7
  };
  /* eslint-enable */

  let fixture;
  let component;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        MockTilesViewComponent,
        MockSiSearchBarComponent,
        SearchViewComponent
      ],
      providers: [
        { provide: IHfwMessage, useValue: mockMessageBroker },
        { provide: CnsHelperService, useClass: MockCnsHelperService },
        { provide: SystemBrowserServiceBase, useClass: MockSystemBrowserService },
        { provide: ValueServiceBase, useClass: MockValueService },
        { provide: DocumentSnapinService, useValue: mockDocumentSnapinService }
      ],
      schemas: [
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchViewComponent);
    component = fixture.componentInstance;

    spyOn(component.ngZone, 'runOutsideAngular').and.returnValue(undefined);

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should build without a problem', () => {
    expect(component instanceof SearchViewComponent).toBe(true);
  });

  it('should click on body', () => {
    mockDocumentSnapinService.onTileClick.and.returnValue(undefined);
    component.onClickBody(mockBrowserObject);
    expect(component.selectedObject).toEqual(mockBrowserObject);
    expect(component.selectedBrowserObjectName).toEqual(mockBrowserObject.ObjectId);
  });

  it('should change search', () => {
    const fetchData: any = spyOn(component, 'fetchData').and.returnValue(undefined);
    component.searchChange('testString');
    expect(component.search).toEqual('testString');
    component.searchChange(null);
    expect(component.skip).toEqual(0);
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should execute ngOnChanges', () => {
    const searchAllNodes = spyOn(component, 'searchAllNodes').and.callThrough();
    const unsub = spyOn(component.systemBrowserSubscription, 'unsubscribe').and.returnValue(undefined);
    component.selectedObject = mockBrowserObject;
    component.ngOnChanges({
      selectedObject: new SimpleChange(null, mockBrowserObject, true)
    });
    fixture.detectChanges();
    expect(mockMessageBroker.getStorageService).toHaveBeenCalledTimes(1);
    expect(component.restoredScrollTop).toEqual(4);
    expect(component.search).toEqual('test');
    expect(mockDocumentSnapinService.setSelectedObject).toHaveBeenCalledTimes(1);
    expect(component.selectedBrowserObjectName).toEqual(mockBrowserObject.ObjectId);
    expect(searchAllNodes).toHaveBeenCalledTimes(1);
    expect(unsub).toHaveBeenCalledTimes(1);
    expect(component.searchString).toEqual(mockBrowserObject.Designation + '*');
    expect(component.nodes[0].Name).toEqual(mockBrowserObject.Name);
  });

  it('should handle page change', () => {
    const fetchData: any = spyOn(component, 'fetchData').and.returnValue(undefined);
    const mockEvent: TileScrolledEvent = {
      skip: 1,
      take: 2
    };
    component.handlePageChange(mockEvent);
    expect(component.skip).toEqual(mockEvent.skip);
    expect(component.pageSize).toEqual(mockEvent.take);
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it('should fetch data', () => {
    const unsub = spyOn(component.searchSubscription, 'unsubscribe').and.returnValue(undefined);
    const dataResult: TilesViewDataResult = {
      data: ['test'],
      total: 1
    };
    const getNodes = spyOn(component, 'getNodes').and.returnValue(of(dataResult));
    component.fetchData('test');
    expect(unsub).toHaveBeenCalledTimes(1);
    expect(getNodes).toHaveBeenCalledTimes(1);
    expect(component.view).toEqual(dataResult);
  });

  it('should get nodes', () => {
    const mockNodes: any = [mockBrowserObject];
    component.selectedObject = mockBrowserObject;
    component.fullBackupNodes = mockNodes;
    const mockFilterName = spyOn(component, 'filterByName').and.callThrough();
    const mockFilterDesc = spyOn(component, 'filterByDescription').and.callThrough();

    // search is not undefined
    // filter by name
    const options1: any = {
      skip: 0,
      take: 1,
      search: 'test',
      filterByName: true
    };
    component.getNodes(options1);
    expect(mockFilterName).toHaveBeenCalledTimes(1);
    expect(mockFilterDesc).toHaveBeenCalledTimes(0);

    // filter by description
    mockFilterName.calls.reset();
    mockFilterDesc.calls.reset();
    const options2: any = {
      skip: 0,
      take: 2,
      search: 'test',
      filterByName: false
    };
    component.getNodes(options2);
    expect(mockFilterName).toHaveBeenCalledTimes(0);
    expect(mockFilterDesc).toHaveBeenCalledTimes(1);

    // search is ''
    mockFilterName.calls.reset();
    mockFilterDesc.calls.reset();
    const options3: any = {
      skip: 0,
      take: 2,
      search: '',
      filterByName: true
    };
    component.getNodes(options3);
    expect(mockFilterName).toHaveBeenCalledTimes(0);
    expect(mockFilterDesc).toHaveBeenCalledTimes(0);

    // search is undefined
    mockFilterName.calls.reset();
    mockFilterDesc.calls.reset();
    const options4: any = {
      skip: 0,
      take: 2,
      search: undefined,
      filterByName: true
    };
    component.getNodes(options4);
    expect(mockFilterName).toHaveBeenCalledTimes(0);
    expect(mockFilterDesc).toHaveBeenCalledTimes(0);
  });
});
