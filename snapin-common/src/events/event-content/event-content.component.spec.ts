/* eslint-disable @typescript-eslint/naming-convention */
import { of } from 'rxjs';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { AssistedTreatmentService, BrowserObject, CnsHelperService, EventFilter, EventService,
  MultiMonitorServiceBase,
  SiIconMapperService, SystemBrowserService, SystemBrowserServiceBase } from '@gms-flex/services';
import { IHfwMessage } from '@gms-flex/core';
import { AppContextService, MockTraceService, TraceService } from '@gms-flex/services-common';
import { UnsaveDialogService } from '@gms-flex/controls';
import { TranslateService } from '@ngx-translate/core';
import { SiActionDialogService, SiMainDetailContainerComponent } from '@simpl/element-ng';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { EventContentComponent } from './event-content.component';
import { BrowserObjectService } from '../services/browser-object.service';
import { outputAst } from '@angular/compiler';
import { EventGridComponent } from '../event-grid';

@Component({
  selector: 'gms-si-master-detail-container',
  template: '<div></div>',
  providers: [
    { provide: SiMainDetailContainerComponent, useClass: MockSiMasterDetailContainerComponent }
  ],
  standalone: false
})
class MockSiMasterDetailContainerComponent {
  @Input() public largeLayoutBreakpoint: any = undefined;
  @Input() public detailsActive: any = undefined;
  @Input() public truncateHeading: any = undefined;
  @Input() public detailsHeading: any = undefined;
  @Input() public resizableParts: any = undefined;
  @Input() public hideBackButton: any = undefined;
  @Input() public containerClass: any = undefined;
  @Input() public masterContainerWidth: any = undefined;
  @Input() public minMasterSize: any = undefined;
  @Input() public minDetailSize: any = undefined;
  @Input() public readonly masterContainerWidthChange: any = undefined;
}

@Component({
  selector: 'gms-event-grid',
  template: '<div></div>',
  providers: [
    { provide: EventGridComponent, useClass: MockGmsEventGridComponent }
  ],
  standalone: false
})
class MockGmsEventGridComponent {
  @Input() public groupEvents: any = undefined;
  @Input() public supportQparam: any = undefined;
  @Input() public fullSnapinID: any = undefined;
  @Input() public fullQParamID: any = undefined;
  @Input() public fullPaneID: any = undefined;
  @Input() public eventFilter: any = undefined;
  @Input() public selectedEventsIds: any = undefined;
  @Input() public showColumnSelectionDlg: any = undefined;
  @Input() public SnapInId: any = undefined;
  @Input() public EventsSelected: any = undefined;
  @Input() public IsInInvestigativeMode: any = undefined;
  @Input() public IsInPopoverMode: any = undefined;
  @Input() public LocationInfoVisible: any = undefined;
  @Input() public WhenSectionVisible: any = undefined;
  @Input() public WhereSectionVisible: any = undefined;
  @Input() public DetailsSectionVisible: any = undefined;
  @Input() public NotesSectionVisible: any = undefined;
  @Input() public goBack: any = undefined;
  @Input() public EventCommandsDisabled: any = undefined;
  @Input() public readonly selectedEventsEv: any = undefined;
  @Input() public readonly numEventsChanged: any = undefined;
  @Input() public readonly eventsChanged: any = undefined;
  @Input() public readonly firstEvent: any = undefined;
  @Input() public readonly notifyUpdatedSelectionEv: any = undefined;
  @Output() public readonly gridEvents: any = undefined;
  @Output() public readonly minifiedState: any = undefined;
  @Output() public readonly eventCommandsDisabled: any = undefined;
  @Output() public readonly containerPage: any = undefined;
  @Output() public readonly goToSystem: any = undefined;
  @Output() public readonly goToInvestigativeTreatment: any = undefined;
  @Output() public readonly exitFromInvestigativeTreatment: any = undefined;
}

class MockAppContextService {
  public userNameValue: any = undefined;
}

describe('EventContentComponent', () => {
  let fixture;
  let component;

  const nodes: BrowserObject[] = [
    {
      Attributes: {
        Alias: '',
        FunctionName: '',
        DefaultProperty: 'hostname',
        DisciplineDescriptor: 'Management System',
        DisciplineId: 0,
        ManagedType: 15,
        ManagedTypeName: 'Station',
        ObjectId: 'System1:ManagementView_ManagementSystem_Clients_a1',
        ObjectModelName: 'GMS_Station',
        SubDisciplineDescriptor: 'System Settings',
        SubDisciplineId: 4,
        SubTypeDescriptor: 'Management Station',
        SubTypeId: 1202,
        TypeDescriptor: 'Computer',
        TypeId: 1100
      },
      Descriptor: 'a1',
      Designation: 'System1.ManagementView:ManagementView.ManagementSystem.Clients.a1',
      HasChild: false,
      Location: 'System1.Management View:Project.Management System.Clients.a1',
      Name: 'a1',
      ObjectId: 'System1:ManagementView_ManagementSystem_Clients_a1',
      SystemId: 1,
      ViewId: 9,
      ViewType: 0
    },
    {
      Attributes: {
        Alias: '',
        FunctionName: '',
        DefaultProperty: 'hostname',
        DisciplineDescriptor: 'Management System',
        DisciplineId: 0,
        ManagedType: 15,
        ManagedTypeName: 'Station',
        ObjectId: 'System1:ManagementView_ManagementSystem_Clients_a2',
        ObjectModelName: 'GMS_Station',
        SubDisciplineDescriptor: 'System Settings',
        SubDisciplineId: 4,
        SubTypeDescriptor: 'Management Station',
        SubTypeId: 1202,
        TypeDescriptor: 'Computer',
        TypeId: 1100
      },
      Descriptor: 'a2',
      Designation: 'System1.ManagementView:ManagementView.ManagementSystem.Clients.a2',
      HasChild: false,
      Location: 'System1.Management View:Project.Management System.Clients.a2',
      Name: 'a1',
      ObjectId: 'System1:ManagementView_ManagementSystem_Clients_a2',
      SystemId: 1,
      ViewId: 9,
      ViewType: 0
    }
  ];

  // let component: EventContentComponent;
  let mockSiIconMapperService: any = null;
  const mockEventService: any = null;
  let mockTranslateService: any = null;
  let mockAssistedTreatmentService: any = null;
  const mockSiActionDialogService: any = null;
  let mockIHfwMessage: any = null;
  const mockTraceService: any = null;
  const mockEventsCommonServiceBase: any = {};
  let mockUnsaveDialogService: any = null;
  let mockCnsHelperService: any = null;
  let mockSystemBrowserServiceBase: any = null;
  let browserServiceMock: any = null;
  let multiMonitorServiceMock: any = null;

  mockSiIconMapperService = jasmine.createSpyObj('SiIconMapperService', ['getGlobalIcon']);
  mockSiIconMapperService.getGlobalIcon.and.returnValue(of(''));

  mockCnsHelperService = jasmine.createSpyObj('CnsHelperService', ['getCnsLabelsOrdered', 'activeCnsLabel']);
  mockCnsHelperService.getCnsLabelsOrdered.and.returnValue(['label1', 'label2']);
  mockCnsHelperService.activeCnsLabel = of('');

  mockSystemBrowserServiceBase = jasmine.createSpyObj('SystemBrowserServiceBase', ['searchNodes']);
  mockSystemBrowserServiceBase.searchNodes.and.returnValue(of({ page: { Nodes: nodes } }));

  mockIHfwMessage = jasmine.createSpyObj('IHfwMessage', ['getCurrentMode']);
  mockIHfwMessage.getCurrentMode.and.returnValue(of({ id: 'investigative' }));

  mockUnsaveDialogService = jasmine.createSpyObj('UnsaveDialogService', ['showDialog', 'closeDialog']);
  mockUnsaveDialogService.showDialog = of('');

  mockTranslateService = jasmine.createSpyObj('TranslateService', ['get']);
  mockTranslateService.get.and.returnValue(of(''));

  mockAssistedTreatmentService = jasmine.createSpyObj('AssistedTreatmentService', ['subscribeProcedure', 'unSubscribeProcedure']);
  mockAssistedTreatmentService.subscribeProcedure(of(''));
  mockAssistedTreatmentService.unSubscribeProcedure(of(''));

  multiMonitorServiceMock = jasmine.createSpyObj('TranslateService', ['runsInElectron', 'isManagerWithEvent', 'sendEvent']);
  // multiMonitorServiceMock.get.and.returnValue(of(''));

  browserServiceMock = jasmine.createSpyObj('BrowserObjectService', ['getSystemIdFromSystemName']);
  browserServiceMock.getSystemIdFromSystemName.and.returnValue(Promise.resolve(1));

  mockTranslateService = jasmine.createSpyObj('MyMockTranslateService', ['get']);
  mockTranslateService.get.and.returnValue(of(''));

  beforeEach(() => {
    // @Input() public hideButton: boolean = false;
    // @Input() public nodes: BrowserObject[];
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        MockSiMasterDetailContainerComponent,
        MockGmsEventGridComponent,
        // MockGmsEventAssistedTreatmentComponent,
        EventContentComponent
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: SiIconMapperService, useValue: mockSiIconMapperService },
        { provide: EventService, useValue: mockEventService },
        { provide: TraceService, useClass: MockTraceService },
        { provide: AssistedTreatmentService, useValue: mockAssistedTreatmentService },
        { provide: SystemBrowserServiceBase, useValue: mockSystemBrowserServiceBase },
        { provide: IHfwMessage, useValue: mockIHfwMessage },
        { provide: UnsaveDialogService, useValue: mockUnsaveDialogService },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: EventsCommonServiceBase },
        { provide: SiActionDialogService, useValue: mockSiActionDialogService },
        { provide: BrowserObjectService, useValue: browserServiceMock },
        { provide: MultiMonitorServiceBase, useValue: multiMonitorServiceMock },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: AppContextService, useClass: MockAppContextService }
      ]
    });

    fixture = TestBed.createComponent(EventContentComponent);

    // fixture.detectChanges();
    component = fixture.componentInstance;
    component.translateService = mockTranslateService;
    jasmine.clock().uninstall();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  // Input
  it('Should set filter', fakeAsync(() => {
    component.nodes = [nodes[0]];

    component.ngOnInit(); // call ngOnInit
    tick(100); // simulate the promise being resolved

    fixture.detectChanges();

    const expectedEventFilter: EventFilter = {
      empty: false,
      srcDesignations: [component.nodes[0].Designation]
    };
    expect(component.eventFilter).toEqual(expectedEventFilter);

  }));

  it('Should set a header when single node @Inputed', fakeAsync(() => {
    component.nodes = [nodes[0]];

    component.ngOnInit(); // call ngOnInit
    tick(100); // simulate the promise being resolved

    fixture.detectChanges();

    expect(component.header.primary).toEqual('label1');
    expect(component.header.secondary).toEqual('label2');
  }));

  it('Should reset on zero nodes', fakeAsync(() => {
    component.nodes = [];

    component.ngOnInit(); // call ngOnInit
    tick(100); // simulate the promise being resolved

    fixture.detectChanges();

    expect(component.primary).toEqual(undefined);
  }));

  // Interactions

  it('Should clear data', fakeAsync(() => {
    component.nodes = [nodes[0]];

    // Define data
    component.eventFilter = {};
    component.header = {};
    component.icon = 'text';

    // Start component
    component.clearData();
    expect(component.eventFilter).toBe(undefined);
    expect(component.header).toBe(undefined);
    expect(component.icon).toBe(undefined);
  }));

  it('Should set currentModeId on checkInvestigativeMode()', fakeAsync(() => {
    component.checkInvestigativeMode();

    // Start component
    expect(component.currentModeId).toBeDefined();
    expect(component.isInInvestigativeMode).toBeTruthy();
  }));

  it('subscribeLabelsOrder() Should call setLabel()', fakeAsync(() => {
    spyOn(component, 'setLabel');
    component.subscribeLabelsOrder(nodes[0]);

    expect(component.setLabel).toHaveBeenCalled();
  }));

  it('setBrowserObject() should call searchNodesCallback', fakeAsync(async () => {
    spyOn(component, 'searchNodesCallback');
    await component.setBrowserObject('System1:sss');
    tick(100);
    fixture.detectChanges();

    expect(component.searchNodesCallback).toHaveBeenCalled();
  }));

  it('searchNodesCallback() should call setIcon,setLabel,subscribeLabelsOrder ', fakeAsync(() => {
    spyOn(component, 'setIcon');
    spyOn(component, 'setLabel');
    spyOn(component, 'subscribeLabelsOrder');
    const page = { Nodes: nodes };

    tick(100);
    fixture.detectChanges();

    component.searchNodesCallback(page);
    tick(100);
    fixture.detectChanges();

    expect(component.setIcon).toHaveBeenCalled();
    expect(component.setLabel).toHaveBeenCalled();
    expect(component.subscribeLabelsOrder).toHaveBeenCalled();
  }));

  // TODO
  // Test toPromise()
  // it('setBrowserObject() should call setIcon,setLabel,subscribeLabelsOrder ', () => {
  //   // spyOn(component.systemBrowserService, 'searchNodes');
  //   // jasmine.clock().install();
  //   spyOn(component, 'setIcon');
  //   spyOn(component, 'setLabel');
  //   spyOn(component, 'subscribeLabelsOrder');
  //   fixture.detectChanges();
  //   component.setBrowserObject('System1:sss');
  //   jasmine.clock().tick(1000);
  //   // tick(100);
  //   // fixture.detectChanges();

  //   expect(component.setIcon).toHaveBeenCalled();
  //   expect(component.setLabel).toHaveBeenCalled();
  //   expect(component.subscribeLabelsOrder).toHaveBeenCalled();

  //   // jasmine.clock().uninstall();
  // });

});
