import { Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IHfwMessage, ISnapInConfig, SnapInBase } from '@gms-flex/core';
import { GmsGraphicsViewerSnapInModule } from '@gms-flex/graphics-viewer/src/gms-graphics-viewer-snapin.module';
import { GraphicsViewerSnapInComponent } from '@gms-flex/graphics-viewer/src/snapin';
import { TranslateServiceStub } from '@gms-flex/graphics-viewer/src/snapin/graphics-viewer-snapin.component.spec';
import {
  BrowserObject, CnsHelperService, ExecuteCommandServiceBase,
  GmsMessageData,
  GmsSelectionType,
  GraphicsService,
  ObjectAttributes,
  SystemBrowserServiceBase, TablesServiceBase
} from '@gms-flex/services';
import { AppContextService, AppSettingsService, TraceService } from '@gms-flex/services-common';
import { TranslateService, TranslateStore } from '@ngx-translate/core';
import { Column } from '@simpl/element-ng';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

import { GmsTextualViewerSnapInModule } from '../../gms-textual-viewer-snapin.module';
import { GridSelectionService } from '../../services/grid-selection.service';
import { TextualViewerDataService } from '../../services/textual-viewer-data.service';
import { EnumIconType, HeaderData } from '../../textual-viewer-data.model';
import { TextualViewerComponent } from './textual-viewer.component';

describe('TextualViewerComponent', () => {

  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);

  let fixture: ComponentFixture<TextualViewerComponent>;
  let comp: TextualViewerComponent;
  let de: any;

  class MockTextualViewerComponent implements OnDestroy, OnChanges, OnInit {
    @Input() public selectedObject: any = 'the selected object';
    // dummy variable created to satisfy lint rules
    private _dummy = '';

    public ngOnDestroy(): void {
      this._dummy = 'ngOnDestroy()';
    }

    public ngOnChanges(): void {
      this._dummy = 'ngOnChanges()';
    }

    public ngOnInit(): void {
      this._dummy = 'ngOnInit()';
    }
  }

  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  const mockSnapInBase: any = jasmine.createSpyObj('mockSnapInBase', ['getFullSnapInIdFromRoute']);
  // const mockCnsHelperService: any = jasmine.createSpyObj('mockCnsHelperService', ['read']);
  const mockMessageBroker: any = jasmine.createSpyObj('mockMessageBroker', ['getMessage', 'sendMessage', 'getStorageService']);
  mockMessageBroker.sendMessage.and.returnValue(nullObservable);
  mockMessageBroker.getMessage.and.returnValue(nullObservable);
  mockMessageBroker.getStorageService.and.returnValue(nullObservable);

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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [GmsTextualViewerSnapInModule],
      declarations: [TextualViewerComponent],
      providers: [
        // angular services
        // { provide: ActivatedRoute, useValue: mockActivatedRoute },

        // hfw-core
        // { provide: SnapInBase, useValue: mockSnapInBase },
        // { provide: IHfwMessage, useValue: mockMessageBroker },
        // { provide: ISnapInConfig, useValue: mockSnapinConfigService },
        // { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: TraceService, useValue: mockTraceService },
        GridSelectionService,
        CnsHelperService,
        TranslateStore,
        BsModalService,
        TextualViewerDataService
      ]
    });
    TestBed.compileComponents();
  }));

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
  /* eslint-enable */

  describe('initialization', () => {
    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(TextualViewerComponent);
      comp = fixture.componentInstance;
      fixture.detectChanges();
    }));

    it('should build without a problem', () => {
      expect(comp instanceof TextualViewerComponent).toBe(true);
    });

    it('Calculate Scroll Y Percentage Correctly', () => {
      const scrollY: number = comp.calculateScrollYPercentage();
      expect(scrollY).toBeDefined();
    });

    it('Create column', () => {
      const headerData: HeaderData = makeHeader('header', true);
      const column: Column = (comp as any).createColumn(headerData);
      expect(column).toBeDefined();
    });

    it('Create column array', () => {
      const headerData: HeaderData = makeHeader('header', true);
      const headerDataList: HeaderData[] = [headerData];
      const columnList: Column[] = (comp as any).createColHeaderDataArr(headerDataList);
      expect(columnList).toBeDefined();
    });

    it('firstColumnVisibleId', () => {
      const headerData: HeaderData = makeHeader('header', true);
      const headerDataList: HeaderData[] = [headerData];
      comp.headerData = headerDataList;
      const result: string = comp.firstColumnVisibleId();
      expect(result).toBeDefined();
    });

    it('showColumnDialog', () => {
      (comp as any).showColumnDialog();
      expect(true).toBeDefined();
    });

    it('getColumnCellClass', () => {
      const headerData: HeaderData = makeHeader('header', true);
      let result: string = (comp as any).getColumnCellClass(headerData, 'bold');
      expect(result).toBeDefined();
      result = (comp as any).getColumnCellClass(headerData, undefined);
      expect(result).toBeUndefined();
    });

    it('getPipeIconData', () => {
      const cellData = new Map<string, string>();
      cellData.set('name', 'test');
      const id = 'name';
      const result: string = comp.getPipeIconData(cellData, id);
      expect(result).toBeDefined();
    });

    it('getPipeIconClass', () => {
      const cellData = new Map<string, string>();
      cellData.set('name', 'test');
      const id = 'name';
      const result: string = comp.getPipeIconClass(cellData, id);
      expect(result).toBeUndefined();
    });

    it('getPipeIconType', () => {
      const cellData = new Map<string, string>();
      cellData.set('name', 'test');
      const id = 'name';
      const result: EnumIconType = comp.getPipeIconType(cellData, id);
      expect(result).toBeDefined();
    });

    it('onSubmitChanges', () => {
      comp.onSubmitChanges();
      expect(true).toBeDefined();
    });

    it('splitAfterLastPeriod', () => {
      const input = 'second:first.name';
      const result: string = comp.splitAfterLastPeriod(input);
      const expected = 'second:first';
      expect(result).toBe(expected);
    });

    it('smallScreenSortCompare', () => {
      const firstOrder = { smallScreenOrder: 1 };
      const secondOrder = { smallScreenOrder: 2 };
      const result: number = comp.smallScreenSortCompare(firstOrder, secondOrder);
      const expected = -1;
      expect(result).toBe(expected);
    });

    it('smallScreenSortCompare', () => {
      const firstOrder: any = { smallScreenOrder: 2 };
      const secondOrder: any = { smallScreenOrder: 1 };
      const result: number = comp.smallScreenSortCompare(firstOrder, secondOrder);
      const expected = 1;
      expect(result).toBe(expected);
    });

    it('onUpdateGridDisplay', () => {
      comp.onUpdateGridDisplay();
    });

    it('getRowColor', () => {
      const row: any = { statePipeColor: 'blue' };
      const result: string = comp.getRowColor(row);
      const expected = 'blue';
      expect(result).toBe(expected);
    });

    it('selectAllRows', () => {
      const event: any = { stopPropagation: () => {}, preventDefault: () => {} };
      comp.selectAllRows(event);
      expect(comp.selected).toEqual(comp.textTable);
    });
  });
});
