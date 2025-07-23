import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  FullSnapInId,
  IHfwMessage,
  IPreselectionService, ISnapInActions,
  ISnapInConfig,
  IStorageService,
  MockSnapInBase,
  SnapInBase
} from '@gms-flex/core';
import {
  CnsHelperService, CnsLabel,
  PropertyServiceBase, SiIconMapperService,
  SystemBrowserService,
  SystemBrowserServiceBase,
  ValueSubscription2ServiceBase
} from '@gms-flex/services';
import {
  AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockWsiEndpointService,
  SettingsServiceBase,
  TraceService
} from '@gms-flex/services-common';
import { TextStorageService } from '@gms-flex/textual-viewer-root-services';
import { TranslateLoader, TranslateService, TranslateStore } from '@ngx-translate/core';
import { NgxDatatableModule, ScrollbarHelper } from '@siemens/ngx-datatable';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { GmsTextualViewerSnapInModule } from '../gms-textual-viewer-snapin.module';
import { GridSelectionService } from '../services/grid-selection.service';
import { TextualViewerDataService } from '../services/textual-viewer-data.service';
import { TextualViewerStateStorageService } from '../services/textual-viewer-state-storage.service';
import { TextualViewerSnapInComponent } from './textual-viewer-snapin.component';
import { TextualViewerComponent } from './view/textual-viewer.component';

describe('Textual SnapIn component', () => {

  // For stubbing Observables
  const nullObservable: BehaviorSubject<any> = new BehaviorSubject(null);

  let fixture: ComponentFixture<TextualViewerSnapInComponent>;
  let comp: TextualViewerSnapInComponent;
  let de: any;
  const mockSettingsService: any = jasmine.createSpy('mockSettingsService');
  const mockTranslateService: any = jasmine.createSpyObj('mockTranslateService', ['getBrowserLang', 'setDefaultLang', 'get']);
  const mockTraceService: any = jasmine.createSpyObj('mockTraceService', ['info', 'debug', 'warn', 'error']);
  const mockCnsHelperService: any = jasmine.createSpyObj('mockCnsHelperService', ['activeCnsLabel']);
  const mockSystemBrowserService: any = jasmine.createSpy('mockSystemBrowserService');
  const mockPropertyService: any = jasmine.createSpy('mockPropertyService');
  const mockValueSubscription2Service: any = jasmine.createSpyObj('mockValueSubscription2Service', ['registerClient']);
  const mockTablesDataPath: any = jasmine.createSpy('mockTablesDataPath');
  const mockSiIconMapperService: any = jasmine.createSpy('mockSiIconMapperService');
  const mockSnapinConfig: any = jasmine.createSpyObj('mockSnapinConfig', ['getSnapInHldlConfig']);
  const mockSnapinActions: any = jasmine.createSpyObj('mockSnapinActions', ['setSnapInActions']);
  const mockIHfwMessage: any = jasmine.createSpyObj('mockIHfwMessage', ['getMessage', 'getStorageService']);
  const mockAppContextService: any = jasmine.createSpyObj('mockAppContextService', ['defaultCulture']);
  const mockStorageService: any = jasmine.createSpyObj('mockStorageService', ['getState', 'setState']);
  mockAppContextService.defaultCulture = nullObservable;
  mockAppContextService.userCulture = nullObservable;
  mockCnsHelperService.activeCnsLabel = nullObservable;
  mockTranslateService.get = (args: any): any => nullObservable;
  mockTranslateService.setDefaultLang = (args: any): any => nullObservable;
  mockValueSubscription2Service.registerClient = (args: any): any => nullObservable;
  mockIHfwMessage.getMessage = (args: any): any => nullObservable;
  mockIHfwMessage.getStorageService = (args: any): any => new TextStorageService();
  mockStorageService.setState = (args: any): any => nullObservable;
  mockStorageService.getState = (args: any): any => nullObservable;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [NgxDatatableModule],
      providers: [
        { provide: SnapInBase, useValue: MockSnapInBase },
        IPreselectionService,
        IStorageService,
        TextualViewerStateStorageService,
        { provide: ActivatedRoute, useValue: {
          'snapshot': {
            'data': {
              'frameId': 'frameId_Test',
              'paneId': 'paneId_Test',
              'snapInId': 'snapInId_Test'
            }
          }
        }
        },
        // GridSelectionService,
        { provide: TraceService, useValue: mockTraceService },
        { provide: SettingsServiceBase, useValue: mockSettingsService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: SystemBrowserServiceBase, useValue: mockSystemBrowserService },
        { provide: PropertyServiceBase, useValue: mockPropertyService },
        { provide: ValueSubscription2ServiceBase, useValue: mockValueSubscription2Service },
        { provide: SiIconMapperService, useValue: mockSiIconMapperService },
        { provide: AppContextService, useValue: mockAppContextService },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        IHfwMessage,
        { provide: ISnapInConfig, useValue: mockSnapinConfig },
        { provide: ISnapInActions, useValue: mockSnapinActions },
        { provide: IHfwMessage, useValue: mockIHfwMessage },
        TextualViewerDataService,
        BsModalService
        // TranslateService,
        // TranslateStore,
        // TranslateLoader
        ,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
  });

  describe('initialization', () => {
    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(TextualViewerSnapInComponent);
      const expectedId: FullSnapInId = new FullSnapInId('text', 'text-1');
      comp = fixture.componentInstance;
      comp.fullId = expectedId;
      fixture.detectChanges();
    }));

    it('should build without a problem',
      waitForAsync(() => {
        TestBed.compileComponents().then(() => {
          // empty
          expect(comp instanceof TextualViewerSnapInComponent).toBe(true);
        });
      }));
  });

});

@Component({
  selector: 'gms-test-cmp',
  template: '<gms-text-snapin />',
  standalone: false
})

class TestComponent {}
