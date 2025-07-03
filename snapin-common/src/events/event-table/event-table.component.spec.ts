/* eslint-disable @typescript-eslint/dot-notation */
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { from, Observable, of } from 'rxjs';
import { clone, cloneDeep } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { BlinkService } from '@simpl/element-ng';
import { EventTableComponent } from './event-table.component';
import { IHfwMessage, ISnapInConfig } from '@gms-flex/core';
import { CategoryService, EventService } from '@gms-flex/services';
import { ActivatedRoute } from '@angular/router';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { ColumnChangesService, DatatableComponent, DimensionsHelper, ScrollbarHelper } from '@siemens/ngx-datatable';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  cellData,
  colDataOrdering,
  colDataOrderingArr,
  colDataSorting,
  colDataVersion,
  commandTexts,
  currentEvent,
  currentRow,
  fixedCols,
  fullSnapinID,
  hdrData,
  headerData,
  initColsData,
  toMapCellData
} from './mock.data';

const INVESTIGATIVE_MODE = 'investigative';

class ActivatedRouteSnapin {

}

class MockCommonTranslateService {
  public get(key: string | string[], interpolateParams?: object): Observable<string | string[] > {
    return of(key);
  }
  public getBrowserLang(): string {
    return 'en';
  }
}
const activatedRouteMockData = {
  snapshot: {
    data: {
      snapinId: {
        snapinId: 'event',
        frameId: 'event'
      },
      paneId: {
        paneId: 'asd',
        frameId: 'event'
      }
    }
  }
};

describe('EventTableComponent', () => {
  let component: EventTableComponent;
  let fixture: ComponentFixture<EventTableComponent>;
  let mockTranslateService: any;
  let mockBlinkService: any;
  let mockIHfwMessage: any = null;
  let mockEventService: any = null;
  let mockISnapInConfig: any = null;
  let mockEventCommonService: any = null;
  let mockCategoryService: any = null;

  const tableComponent = jasmine.createSpyObj('DatatableComponent', ['recalculate', 'recalculateColumns']);
  tableComponent.recalculate.and.returnValue();
  tableComponent.recalculateColumns.and.returnValue();

  beforeEach(() => {
    mockBlinkService = jasmine.createSpyObj('BlinkService', ['pulse$']);
    mockBlinkService.pulse$ = of(true);

    mockIHfwMessage = jasmine.createSpyObj('IHfwMessage', ['getCurrentMode']);
    mockIHfwMessage.getCurrentMode.and.returnValue(of({ id: INVESTIGATIVE_MODE }));

    mockEventService = jasmine.createSpyObj('EventService', ['serverClientTimeDiff']);
    // mockEventService.serverClientTimeDiff = (): Observable<number> => of(1);
    mockEventService.serverClientTimeDiff.and.returnValue(new Promise((resolve, reject) => {
      resolve(1);
    }));

    mockISnapInConfig = jasmine.createSpyObj('ISnapInConfig', ['getAvailableModes']);
    mockISnapInConfig.getAvailableModes.and.returnValue(of(true));

    mockEventCommonService = jasmine.createSpyObj('EventsCommonServiceBase', ['commonTranslateService']);
    mockEventCommonService.commonTranslateService = new MockCommonTranslateService();

    mockCategoryService = jasmine.createSpyObj('CategoryService', ['getCategories']);
    mockCategoryService.getCategories.and.returnValue(of(true));

    TestBed.configureTestingModule({
      declarations: [EventTableComponent, DatatableComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: BlinkService, useValue: mockBlinkService },
        { provide: IHfwMessage, useValue: mockIHfwMessage },
        { provide: EventService, useValue: mockEventService },
        { provide: ISnapInConfig, useValue: mockISnapInConfig },
        { provide: EventsCommonServiceBase, useValue: mockEventCommonService },
        { provide: ScrollbarHelper, useClass: ScrollbarHelper },
        { provide: CategoryService, useValue: mockCategoryService },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMockData
        },
        { provide: DimensionsHelper, useClass: DimensionsHelper },
        { provide: ColumnChangesService, useClass: ColumnChangesService }
      ]
    });

    fixture = TestBed.createComponent(EventTableComponent);
    component = fixture.componentInstance;
    component.table = tableComponent;
  });

  it('onGetCurrentMode should retun true on investigative mode', () => {
    component['onGetCurrentMode'](INVESTIGATIVE_MODE);

    expect(component['isInInvestigativeMode']).toBeTrue();
  });

  it('should init data', () => {
    spyOn<any>(component, 'setColsSorting');
    spyOn<any>(component, 'setColWidths'); // Required to use <any> for private methods

    component.fullSnapinID = fullSnapinID;
    component.headerData = headerData;
    component.hdrData = hdrData;

    component['initData'](initColsData);

    // Private params/methods
    // have to be checked in via component['fixedSizeCols'] syntax
    expect(component['fixedSizeCols']).toEqual(fixedCols);
    expect(component['colDataVersion']).toEqual(colDataVersion);
    expect(component['colDataOrdering']).toEqual(colDataOrdering);
    expect(component['colDataSorting']).toEqual(colDataSorting);
    expect(component['colDataOrderingArr']).toEqual(colDataOrderingArr);

    expect(component['setColsSorting']).toHaveBeenCalled();
    expect(component['setColWidths']).toHaveBeenCalled();
  });

  it('should setColsSorting', () => {
    component.fullSnapinID = fullSnapinID;
    component.headerData = headerData;
    component.hdrData = hdrData;

    component['setColsSorting']('state, 0, 2;categoryDescriptor, 0, 2;creationTime, 0, 1;');

    const stateHeaderData = component.hdrData.find((h: any) => h.id === 'state');
    expect(stateHeaderData.sortingDirection).toEqual(2);
  });

  it('should processColumnsSettings', () => {
    component.fullSnapinID = fullSnapinID;
    component.headerData = headerData;
    component.hdrData = hdrData;

    component['setColsSorting']('state, 0, 2;categoryDescriptor, 0, 2;creationTime, 0, 1;');

    const stateHeaderData = component.hdrData.find((h: any) => h.id === 'state');
    expect(stateHeaderData.sortingDirection).toEqual(2);
  });

  it('should getSorting be true', () => {
    expect(component.getSorting(true)).toEqual('true');
  });

  it('should hasCommands return true', () => {
    expect(component.hasCommands([1, 2, 3])).toBeTrue();
  });

  it('should getDisciplineColor return rgb color string', () => {
    expect(component.getDisciplineColor(currentEvent)).toEqual('rgb(189, 189, 196)');
  });

  it('should setCellContents return title and subtitle', () => {
    expect(component.setCellContents('cause', currentRow)).toEqual({
      title: 'Services running properly',
      subtitle: undefined
    });
  });

  it('should setCellContents creationTime return title and subtitle', () => {
    expect(component.setCellContents('creationTime', currentRow)).toEqual({
      title: '1/12/2022',
      subtitle: ' 10:48:02 AM'
    });
  });

  it('should setCellContents state return title and subtitle', () => {
    expect(component.setCellContents('state', currentRow)).toEqual({
      title: 'Unprocessed',
      subtitle: 'element-alarm'
    });
  });

  /**
   * Requires to deal with sanitizer types
   * Possible Solution:
   * https://stackoverflow.com/questions/45318082/angular2-expected-safevalue-must-use-property-binding
   */
  // it('should getDisciplineIcon return string', () => {
  //   expect(component.getDisciplineIcon(currentEvent)).toBe(component.sanitizer.bypassSecurityTrustHtml('element-settings'));
  // });

  it('onSelect should set selections', () => {
    const ev = { selected: [currentEvent] };

    component.onSelect(ev);

    expect(component.selected).toEqual(ev.selected);

  });

  it('onSelectMini should set minified selections', () => {
    const minifiedRow = component['setMinifiedRow'](currentRow);
    const minifiedRows = [minifiedRow];
    component.rowsMinified = minifiedRows;

    const ev = { selected: [minifiedRow] };

    component.onSelectMini(ev);

    expect(component.selectedMini).toEqual(minifiedRows);
  });

  it('Should set column size onResize', fakeAsync(() => {

    component.txtTable = [currentRow];
    component.headerData = headerData;
    component.hdrData = headerData;
    component['columnsSettingsObs'] = of(initColsData);
    component['columnsSettings'] = (initColsData);

    component.ngOnInit();

    component.table._internalColumns = component.hdrData.map(h => {
      const headerItem = {
        width: h.minColWidth,
        name: h.label,
        prop: h.id
      };

      return headerItem;
    });

    const ev = {
      column: {
        prop: 'belongsTo'
      },
      newValue: 271
    };
    tick(100);
    const resizedCol = component.onResize(ev);

    fixture.detectChanges();

    const headerItem = component.hdrData.find(hdr => hdr.id === ev.column.prop);

    expect(headerItem.width).toEqual(ev.newValue);
    flush();
  }));

  it('Should set sort on onSort', fakeAsync(() => {

    component.txtTable = [currentRow];
    component.headerData = headerData;
    component.hdrData = headerData;
    component['columnsSettingsObs'] = of(initColsData);
    component['columnsSettings'] = (initColsData);

    component.ngOnInit();

    component.table._internalColumns = component.hdrData.map(h => {
      const headerItem = {
        width: h.minColWidth,
        name: h.label,
        prop: h.id
      };

      return headerItem;
    });

    const ev = {
      column: {
        prop: 'belongsTo'
      }
    };
    tick(100);
    const sortedCol = component.onSort(ev);

    fixture.detectChanges();

    // const headerItem = component.hdrData.find(hdr => hdr.id === ev.column.prop);

    expect(sortedCol.colName).toEqual(ev.column.prop);
    expect(sortedCol.dir).toEqual(1);
    flush();
  }));

  it('Should set selected items', fakeAsync(() => {

    const secondRow = JSON.parse(JSON.stringify(currentRow));
    secondRow.customData.eventItem.id += 2;

    const rows = [currentRow, secondRow];

    const selected = component['getSelected'](rows, [secondRow]);

    expect(selected).toEqual([secondRow]);
  }));

  it('Should set selected minified items', fakeAsync(() => {

    const minifiedRow1 = component['setMinifiedRow'](currentRow);

    const secondRow = cloneDeep(currentRow);
    secondRow.cellData = toMapCellData(cellData);
    secondRow.customData.eventItem.id = 2;

    const minifiedRow2 = component['setMinifiedRow'](secondRow);

    const rows = [minifiedRow1, minifiedRow2];

    const selected = component['getMinifiedSelected'](rows, [secondRow]);

    expect(selected).toEqual([minifiedRow2]);
  }));

  it('setActionsCell Should set actions cell', fakeAsync(() => {
    component.commandTexts = commandTexts;

    const actions = component['setActionsCell'](currentRow);

    const mockActions = {
      'primary': [
        {
          'title': 'Acknowledge',
          'disabled': false
        }
      ],
      'secondary': [
        {
          'title': 'Reset',
          'disabled': true
        },
        {
          'title': 'Silence',
          'disabled': true
        },
        {
          'title': 'Close',
          'disabled': true
        }
      ]
    }
    ;

    expect(actions.primary[0].title).toEqual('Acknowledge');
    expect(actions.primary[0].disabled).toBeFalse();
    expect(actions.secondary[0].title).toEqual('Reset');
    expect(actions.secondary[0].disabled).toBeTrue();
    expect(actions.secondary[1].title).toEqual('Silence');
    expect(actions.secondary[2].title).toEqual('Close');
  }));

});
