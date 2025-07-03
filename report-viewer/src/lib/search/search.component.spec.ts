/* eslint-disable */
import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of as observableOf, Subject } from 'rxjs';

// internationalisation
import { TranslateService, TranslateStore } from '@ngx-translate/core';

// hfw-core
import { IHfwMessage, IPreselectionService, ISnapInConfig, IStorageService, SnapInBase } from '@gms-flex/core';

// hfw-services
import {
  AppContextService, TraceService
} from '@gms-flex/services-common';

// gms-services
import {
  BrowserObject, CnsHelperService, SystemBrowserServiceBase, TrendService, TrendServiceBase
} from '@gms-flex/services';

@Component({
    selector: 'gms-schedule-view',
    template: `<div *ngIf="schedule">A schedule is present</div>
<div *ngIf="!schedule">No schedule is present</div>`,
    standalone: false
})

class MockTrendViewComponent implements OnDestroy, OnChanges, OnInit {
  @Input() public _selectedObject: any = 'the selected object';
  public ngOnDestroy(): void {
    //
  }
  public ngOnChanges(): void {
    //
  }
  public ngOnInit(): void {
    //
  }
}

describe('TrendSnapInComponent', () => {
  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  const preselectService: IPreselectionService = undefined;
  const storageService: IStorageService = undefined;
  // Mocks for Angular services
  const mockActivatedRoute: any = jasmine.createSpyObj('mockActivatedRoute', ['snapshot']);
  mockActivatedRoute.snapshot = {
    'data': {
      'frameId': 'frameId_Test',
      'paneId': 'paneId_Test',
      'snapInId': 'snapInId_Test'
    }
  };

  // Mocks for hfw-services-common dependencies
  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'error', 'warn', 'debug']);
  const mockAppContextService: any = jasmine.createSpyObj('mockAppContextService', ['getBrowserLang']);
  mockAppContextService.defaultCulture = nullObservable;
  mockAppContextService.userCulture = nullObservable;
  mockAppContextService.getBrowserLang.and.returnValue(nullObservable);

  // Mocks for hfw-core dependencies
  const mockSnapInBase: any = jasmine.createSpyObj('mockSnapInBase', ['getFullSnapInIdFromRoute']);
  const mockMessageBroker: any = jasmine.createSpyObj('mockMessageBroker', ['getMessage', 'sendMessage', 'getPreselectionService', 'getStorageService']);
  const mockSnapinConfig: any = jasmine.createSpyObj('mockSnapinConfig', ['getSnapInHldlConfig', 'getLayouts']);
  mockMessageBroker.getMessage.and.returnValue(nullObservable);
  mockMessageBroker.getPreselectionService.and.returnValue(preselectService);
  mockMessageBroker.getStorageService.and.returnValue(storageService);
  mockSnapinConfig.getLayouts.and.returnValue([]);
  mockSnapinConfig.getSnapInHldlConfig.and.returnValue();

  // Mocks for internationalisation dependencies
  const mockTranslateService: any = jasmine.createSpyObj('mockTranslateService', ['getBrowserLang', 'setDefaultLang']);

  const mockCnsHelperService: any = jasmine.createSpyObj('mockCnsHelperService', ['getBrowserLang', 'setDefaultLang']);
  const mockSystemBrowserService: any = jasmine.createSpyObj('mockSystemBrowserService', ['getBrowserLang', 'setDefaultLang']);
  const mockRouter: any = jasmine.createSpyObj('mockRouter', ['getBrowserLang', 'setDefaultLang']);

  // Mocks for scheduleviewer services
  const mockTrendService: any = jasmine.createSpy('mockTrendService');

  const mockTrendSnapinService: any = jasmine.createSpy('mockTrendSnapinService');

  const mockGmsObjectSelectionService: any = jasmine.createSpyObj('mockGmsObjectSelectionService', ['reset']);

  // mock of ObjectSelectionService.selectedObjects
  const mockSelectedObjects: BehaviorSubject<BrowserObject[]> = new BehaviorSubject<BrowserObject[]>([]);

  // mock of ObjectSelectionService.navigate
  const mockNavigate: Subject<BrowserObject> = new Subject<BrowserObject>();

  mockGmsObjectSelectionService.selectedObjects = mockSelectedObjects;
  mockGmsObjectSelectionService.navigate = mockNavigate;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [MockTrendViewComponent],
      providers: [
        // angular services
        { provide: ActivatedRoute, useValue: mockActivatedRoute },

        // hfw-core
        { provide: SnapInBase, useValue: mockSnapInBase },
        { provide: IHfwMessage, useValue: mockMessageBroker },
        { provide: ISnapInConfig, useValue: mockSnapinConfig },

        // hfw-services
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: TraceService, useValue: mockTraceService },

        // internationalisation
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: SystemBrowserServiceBase, useValue: mockSystemBrowserService },
        { provide: Router },
        { provide: TrendService, useClass: mockTrendService },
        { provide: TrendServiceBase, useClass: mockTrendService }
      ]
    });

    // TestBed.overrideComponent(TrendPreviewPageComponent, {
    //     set: {
    //         providers: [
    //             { provide: TrendPreviewPageComponent, useClass: TrendPreviewPageComponent }
    //         ]
    //     }
    // });
    TestBed.compileComponents();
  });

  describe('initialization', () => {

    // beforeEach(() => {
    //     fixture = TestBed.createComponent(TrendSnapInComponent);
    //     comp = fixture.componentInstance;
    //     fixture.detectChanges();
    // });

    it('should build without a problem', () => {
      // expect(comp instanceof TrendSnapInComponent).toBe(true);
    });
  });
});

@Component({
    selector: 'gms-test-cmp',
    template: '<gms-trend-snapin />',
    standalone: false
})

class TestComponent {}
