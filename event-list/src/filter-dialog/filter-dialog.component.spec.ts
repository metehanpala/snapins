import { Component, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TreeSelectorComponent } from '@gms-flex/controls';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { SiCollapsiblePanelComponent, SiSearchBarComponent } from '@simpl/element-ng';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, of } from 'rxjs';

import { EventFilterDlgComponent } from './filter-dialog.component';

@Component({
  selector: 'gms-si-search-bar',
  template: '<div></div>',
  providers: [
    { provide: SiSearchBarComponent, useClass: MockSiSearchBarComponent }
  ],
  standalone: false
})
class MockSiSearchBarComponent {
  @Input() public placeholder: any = undefined;
  @Input() public colorVariant: any = undefined;
  @Input() public value: any = undefined;
  @Input() public showIcon: any = undefined;
  @Input() public debounceTime: any = undefined;
  @Output() public readonly searchChange: any = undefined;
}

@Component({
  selector: 'gms-si-collapsible-panel',
  template: '<div></div>',
  providers: [
    { provide: SiCollapsiblePanelComponent, useClass: MockSiCollapsiblePanelComponent }
  ],
  standalone: false
})
class MockSiCollapsiblePanelComponent {
  @Input() public heading: any = undefined;
}

@Component({
  selector: 'gms-hfw-tree-selector',
  template: '<div></div>',
  providers: [
    { provide: TreeSelectorComponent, useClass: MockHfwTreeSelectorComponent }
  ],
  standalone: false
})
class MockHfwTreeSelectorComponent {
  @Input() public inputElementName: any = undefined;
  @Input() public selectionTree: any = undefined;
  @Input() public excludeAccordion: any = undefined;
  @Input() public enableItemFilter: any = undefined;
  @Output() public readonly selectionChanged: any = undefined;
}

class MockAppContextService {
  public get defaultCulture(): Observable<string> {
    return of('default culture');
  }
  public get userCulture(): Observable<string> {
    return of('user culture');
  }
}

describe('EventFilterDlgComponent', () => {
  let fixture;
  let component;

  const strings: any = {
    'aliasFilterLabel': 'alias filter label',
    'designationFilterLabel': 'designation filter label',
    'sourcepropertyidFilterLabel': 'source property id filter label',
    'nameFilterLabel': 'name filter label',
    'descriptionFilterLabel': 'description filter label',
    'dateTimeFilterLabel': 'date time filter label',
    'timeEmptyFilterLabel': 'time empty filter label',
    'timeLastQuarterHourFilterLabel': 'time last quarter hour filter label',
    'timeLastHalfHourFilterLabel': 'time last half hour filter label',
    'timeLastHourFilterLabel': 'time last hour filter label',
    'timeLastNightFilterLabel': 'time last night filter label',
    'timeYesterdayFilterLabel': 'time yesterday filter label',
    'timeTodayFilterLabel': 'time today filter label',
    'filterClearMsg': 'filter clear msg',
    'searchFilterWatermark': 'search filter watermark',
    'disciplineFilterLabel': 'discipline filter label',
    'categoryFilterLabel': 'category filter label',
    'stateFilterLabel': 'state filter label',
    'srcStateFilterLabel': 'src state filter label',
    'srcSystemFilterLabel': 'src system filter label',
    'hiddenEventsFilterLabel': 'hidden events filter label',
    'hiddenEventsShowLabel': 'hidden events show label',
    'eventStateUnprocessed': 'event state unprocessed',
    'eventStateReadyToBeReset': 'event state ready to be reset',
    'eventStateReadyToBeClosed': 'event state ready to be closed',
    'eventStateWaitingForCondition': 'event state waiting for condition',
    'eventStateAcked': 'event state acked',
    'eventStateClosed': 'event state closed',
    'eventStateUnprocessedWithTimer': 'event state unprocessed with timer',
    'eventStateReadyToBeResetWithTimer': 'event state ready to be reset with timer',
    'eventStateWaitingForCommandExecution': 'event state waiting for command execution',
    'sourceStateActive': 'source state active',
    'sourceStateQuiet': 'source state quiet',
    'contentActionFilterLabel': 'content action filter label',
    'gridControlCustomizeTitle': 'grid control customize title'
  };

  const mockBsModalRef: any = jasmine.createSpyObj('MyMockBsModalRef', ['hide']);
  mockBsModalRef.hide.and.returnValue(undefined);

  const mockTranslateService: any = jasmine.createSpyObj('MyMockTranslateService', ['setDefaultLang', 'getBrowserLang', 'use', 'get']);
  mockTranslateService.setDefaultLang.and.returnValue(undefined);
  mockTranslateService.getBrowserLang.and.returnValue('get browser culture lang');
  mockTranslateService.use.and.returnValue(of(undefined));
  mockTranslateService.get.and.returnValue(of(strings));

  const mockTraceService: any = jasmine.createSpyObj('MyMockTraceService', ['warn', 'info', 'error', 'debug', 'isDebugEnabled']);
  mockTraceService.warn.and.returnValue(undefined);
  mockTraceService.info.and.returnValue(undefined);
  mockTraceService.error.and.returnValue(undefined);
  mockTraceService.debug.and.returnValue(undefined);
  mockTraceService.isDebugEnabled.and.returnValue(undefined);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        MockSiSearchBarComponent,
        MockSiCollapsiblePanelComponent,
        MockHfwTreeSelectorComponent,
        EventFilterDlgComponent
      ],
      providers: [
        { provide: BsModalRef, useValue: mockBsModalRef },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: TraceService, useValue: mockTraceService },
        { provide: AppContextService, useClass: MockAppContextService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventFilterDlgComponent);
    component = fixture.componentInstance;

    component.eventFilter = {
      empty: false,
      eventId: undefined,
      categories: undefined,
      disciplines: undefined,
      states: ['states1', 'states2', 'states3'],
      srcState: ['srcState1', 'srcState2', 'srcState3'],
      srcAlias: 'srcAlias',
      srcDesignations: ['src designations1', 'src designations2', 'src designations3'],
      srcName: 'src name',
      srcDescriptor: 'src descriptor',
      srcSystem: undefined,
      informationalText: 'informational text',
      creationDateTime: undefined,
      from: undefined,
      to: undefined,
      hiddenEvents: false,
      srcPropertyIds: ['src property ids1', 'src property ids2', 'src property ids3'],
      id: 'id'
    };

    fixture.detectChanges();

  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should activate ngOnInit() when filter dialog is open', () => {
    mockTranslateService.setDefaultLang.calls.reset();
    const defaultCulture: any = spyOnProperty(component.appContextService, 'defaultCulture', 'get');
    defaultCulture.and.returnValue(of('default culture'));
    component.ngOnInit();
    expect(mockTranslateService.setDefaultLang).toHaveBeenCalledTimes(1);
    mockTranslateService.setDefaultLang.calls.reset();
    defaultCulture.and.returnValue(of(null));
    component.ngOnInit();
    expect(mockTranslateService.setDefaultLang).toHaveBeenCalledTimes(1);

    mockTranslateService.use.calls.reset();
    const userCulture: any = spyOnProperty(component.appContextService, 'userCulture', 'get');
    userCulture.and.returnValue(of('user culture'));
    component.ngOnInit();
    expect(mockTranslateService.use).toHaveBeenCalledTimes(1);
    mockTraceService.warn.calls.reset();
    userCulture.and.returnValue(of(null));
    component.ngOnInit();
    expect(mockTraceService.warn).toHaveBeenCalledTimes(2);
  });

});
