import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Component, Input } from '@angular/core';
import { IHfwMessage, ISnapInConfig, MockSnapInBase, SnapInBase } from '@gms-flex/core';
import { ActivatedRoute } from '@angular/router';
import {
  AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockTraceService,
  MockWsiEndpointService,
  NotifConfiguration,
  NotificationServiceBase,
  TraceService
} from '@gms-flex/services-common';

import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { GmsNotifConfigSnapInModule } from '../gms-notifconfig-snapin.module';
import { NotifConfigSnapInComponent } from './notifconfig-snapin.component';
import { SiCardComponent, SiMainDetailContainerComponent, SiTreeViewComponent } from '@simpl/element-ng';

@Component({
  /* eslint-disable-next-line */
  selector: 'si-main-detail-container',
  template: '<div></div>',
  providers: [
    { provide: SiMainDetailContainerComponent, useClass: MockSiMainDetailContainerComponent }
  ],
  standalone: false
})
class MockSiMainDetailContainerComponent {
  @Input() public resizableParts: any = undefined;
  @Input() public detailsActive: any = undefined;
  @Input() public detailsHeading: any = undefined;
  @Input() public containerClass: any = undefined;
}

@Component({
  /* eslint-disable-next-line */
  selector: 'si-tree-view',
  template: '<div></div>',
  providers: [
    { provide: SiTreeViewComponent, useClass: MockSiTreeViewComponent }
  ],
  standalone: false
})
class MockSiTreeViewComponent {
  @Input() public enableStateIndicator: any = undefined;
  @Input() public enableContextMenuButton: any = undefined;
  @Input() public folderStateStart: any = undefined;
  @Input() public singleSelectMode: any = undefined;
  @Input() public isVirtualized: any = undefined;
  @Input() public flatTree: any = undefined;
  @Input() public items: any = undefined;
  @Input() public updateTreeDisplay: any = undefined;
  @Input() public deleteChildrenOnCollapse: any = undefined;
  @Input() public selectedItem: any = undefined;
  @Input() public inFocus: any = undefined;
  @Input() public enableSelection: any = undefined;
  @Input() public enableFocus: any = undefined;
  @Input() public treeItemsSelected: any = undefined;
}

@Component({
  /* eslint-disable-next-line */
  selector: 'si-card',
  template: '<div></div>',
  providers: [
    { provide: SiCardComponent, useClass: MockSiCardComponent }
  ],
  standalone: false
})
class MockSiCardComponent {
  //
}

class MockTranslateService {
  public setDefaultLang(lang: string): void {
    return null;
  }

  public getBrowserLang(): string {
    return undefined;
  }

  public get(key: string | Array<string>, interpolateParams?: Object): Observable<string | any> {
    return of({
      'CONFIG-SHOW': 'show',
      'CONFIG-SOUND': 'sound',
      'CONFIG-SOUND-EVENTS': 'events',
      'TOAST-TITLE': 'title',
      'NONE': 'none',
      'BANNER': 'banner',
      'ALERT': 'alert',
      'OVERRIDE': 'override'
    });
  }
}
class MockAppContextService {
  private readonly _defaultCulture: BehaviorSubject<string> = new BehaviorSubject<string>(null!);
  private readonly _userCulture: BehaviorSubject<string> = new BehaviorSubject<string>(null!);

  public get userCulture(): Observable<string> {
    return this._userCulture.asObservable();
  }
  public get defaultCulture(): Observable<string> {
    return this._defaultCulture.asObservable();
  }
}


describe('NotifConfigSnapInComponent', () => {
  let fixture;
  let component;
  let de: any;
  const notificationOne: any = {
    getState: () => (0)
  };

  const mockConfig: NotifConfiguration = new NotifConfiguration('newEvents');
  mockConfig.setCustomData([{
    name: 'CDTestName', 
    label: 'CDTestLabel', 
    radioValue: 'CDTestRadio', 
    data: [{ 
      name: 'CDTestDataName', 
      label: 'CDTestDataLabel', 
      value: false, 
      color: 'CDTestDataColor'
    }, {
      name: 'CDTestDataName3',
      label: 'CDTestDataLabel3',
      value: false,
      color: 'CDTestDataColor3'
    }, {
      name: 'CDTestDataName5',
      label: 'CDTestDataLabel5',
      value: false,
      color: 'CDTestDataColor5'
    }, {
      name: 'CDTestDataName7',
      label: 'CDTestDataLabel7',
      value: false,
      color: 'CDTestDataColor7'
    }], color: 'CDTestColor', 
    id: 'CDTestId', 
    override: false 
  },
  {
    name: 'CDTestName2', 
    label: 'CDTestLabel2', 
    radioValue: 'CDTestRadio2', 
    data: [{ 
      name: 'CDTestDataName2', 
      label: 'CDTestDataLabel2', 
      value: false, 
      color: 'CDTestDataColor2'
    }, {
      name: 'CDTestDataName4',
      label: 'CDTestDataLabel4',
      value: false,
      color: 'CDTestDataColor4'
    }, {
      name: 'CDTestDataName6',
      label: 'CDTestDataLabel6',
      value: false,
      color: 'CDTestDataColor6'
    }, {
      name: 'CDTestDataName8',
      label: 'CDTestDataLabel8',
      value: false,
      color: 'CDTestDataColor8'
    }], color: 'CDTestColor2', 
    id: 'CDTestId2', 
    override: false 
  }]);
  mockConfig.setCustomSettings([{
    name: 'CDCustomSettingName',
    label: 'CDCustomSettingLabel',
    value: false,
    color: 'CDCustomSettingColor'
  }]);
  const mockConfigurations: Map<string, NotifConfiguration> = new Map<string, NotifConfiguration>().set('newEvents', mockConfig);

  const notificationServiceBaseStub: any = {
    register: (arg, second) => ({}),
    subscribeNotifications: () => (of(notificationOne)),
    subscribeConfigurations: () => (of(mockConfigurations)),
    getConfigurations: () => (mockConfigurations),
    updateConfigurations: () => ({}),
    cancelAll: () => ({}),
    getActiveNotifications: () => ([]),
    cancel: () => ({})
  };

  const mockSnapinConfig: any = jasmine.createSpyObj('mockSnapinConfig', ['getSnapInHldlConfig', 'getLayouts']);
  mockSnapinConfig.getLayouts.and.returnValue([]);
  mockSnapinConfig.getSnapInHldlConfig.and.returnValue();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        NotifConfigSnapInComponent,
        MockSiMainDetailContainerComponent,
        MockSiTreeViewComponent,
        MockSiCardComponent
      ],
      providers: [
        { provide: SnapInBase, useValue: MockSnapInBase },
        { provide: AppContextService, useClass: MockAppContextService },
        { provide: TranslateService, useClass: MockTranslateService },
        {
          provide: ActivatedRoute, useValue: {
            'snapshot': {
              'data': {
                'frameId': 'frameId_Test',
                'paneId': 'paneId_Test',
                'snapInId': 'snapInId_Test'
              }
            }
          }
        },
        { provide: TraceService, useClass: MockTraceService },
        MockWsiEndpointService,
        { provide: 'wsiSettingFilePath', useValue: 'wsiMock' },
        { provide: AuthenticationServiceBase, useClass: MockAuthenticationService },
        IHfwMessage,
        // internationalisation
        { provide: 'productSettingFilePath', useValue: 'productMock' },
        { provide: NotificationServiceBase, useValue: notificationServiceBaseStub },
        { provide: ISnapInConfig, useValue: mockSnapinConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotifConfigSnapInComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should build without a problem', () => {
    component.ngOnInit();

    expect(component instanceof NotifConfigSnapInComponent).toBe(true);
  });

  it('should select and getSubData, getSub, getOverride', () => {
    component.ngOnInit();
    component.sel([component.treeItems[0].children[0]]);

    expect(component.getSubData()).toEqual(mockConfig.getCustomData()[0].data);
    expect(component.getSub()).toEqual(mockConfig.getCustomData()[0]);
    expect(component.getOverride(['newEvents', 'CDTestName'])).toEqual(mockConfig.getCustomData()[0].override);
  });

  it('should set config', () => {
    component.ngOnInit();
    component.sel([component.treeItems[0].children[0]]);

    component.setConfig(0, true);
    expect(component.configurations.get('newEvents').getShow()).toBe(true);

    component.setConfig(0, false);
    expect(component.configurations.get('newEvents').getShow()).toBe(false);

    component.setConfig(1);
    expect(component.configurations.get('newEvents').getToast()).toEqual('none');

    component.setConfig(2);
    expect(component.configurations.get('newEvents').getToast()).toEqual('banner');

    component.setConfig(3);
    expect(component.configurations.get('newEvents').getToast()).toEqual('alert');

    component.setConfig(4, true);
    expect(component.configurations.get('newEvents').getSound()).toBe(true);

    component.setConfig(4, false);
    expect(component.configurations.get('newEvents').getSound()).toBe(false);

    component.setConfig(5, true);
    expect(component.configurations.get('newEvents').getCustomData()[0].override).toBe(true);

    component.setConfig(5, false);
    expect(component.configurations.get('newEvents').getCustomData()[0].override).toBe(false);

    component.setConfig(0, true, 'sub');
    expect(component.configurations.get('newEvents').getCustomData()[0].data[0].value).toBe(true);

    component.setConfig(0, false, 'sub');
    expect(component.configurations.get('newEvents').getCustomData()[0].data[0].value).toBe(false);

    component.setConfig(0, true, 'customCfg');
    expect(component.configurations.get('newEvents').getCustomSettings()[0].value).toBe(true);

    component.setConfig(0, false, 'customCfg');
    expect(component.configurations.get('newEvents').getCustomSettings()[0].value).toBe(false);
  });

  it('should enableSoundSub', () => {
    component.ngOnInit();

    expect(component.configurations.get('newEvents').getCustomData()[0].data[1].value).toBe(false);
    component.enableSoundSub();
    expect(component.configurations.get('newEvents').getCustomData()[0].data[1].value).toBe(true);
  });

  it('should disableBackToNormal', () => {
    component.ngOnInit();

    component.configurations.get('newEvents').getCustomSettings()[0].value = true;
    component.configurations.get('newEvents').getCustomData().forEach(sub => {
      sub.data[3].value = true;
    });

    expect(component.configurations.get('newEvents').getCustomSettings()[0].value).toBe(true);
    expect(component.configurations.get('newEvents').getCustomData()[0].data[3].value).toBe(true);

    component.disableBackToNormal();

    expect(component.configurations.get('newEvents').getCustomSettings()[0].value).toBe(false);
    expect(component.configurations.get('newEvents').getCustomData()[0].data[3].value).toBe(false);
  });
});

@Component({
    selector: 'gms-test-cmp',
    template: '<gms-about-snapin />',
    standalone: false
})

class TestComponent {}
