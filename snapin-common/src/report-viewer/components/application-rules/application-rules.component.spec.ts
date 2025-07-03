import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';

import { ApplicationRulesComponent } from './application-rules.component';
import { AdvanceReportingService, LogViewerService,
  ParameterDetails,
  PropertyDetails,
  PropertyInfo,
  PropertyValuesService,
  RelatedItemsRepresentation } from '@gms-flex/services';

import { ReportViewerService } from '../../services/report-viewer.service';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { ParameterRelatedInfo } from '../../view-model/storage-vm';

describe('ApplicationRulesComponent', () => {
  let component: ApplicationRulesComponent;
  let fixture: ComponentFixture<ApplicationRulesComponent>;
  let mockPropertyValuesService: PropertyValuesService;
  let mockAdvanceReportingService: AdvanceReportingService;
  let mockReportViewService: ReportViewerService;
  let propertyValuesServiceStub: Partial<PropertyValuesService>;
  let advanceReportingServiceStub: Partial<AdvanceReportingService>;
  let reportViewerServiceStub: Partial<ReportViewerService>;
  let mockTraceService: TraceService;

  const mockObjectId = 'System1:ManagementView_SystemSettings_Libraries_HQ_Global_Global_AdvancedReporting_HQ_1_AdvRules_ConfigurationPage';

  const applicationMock: RelatedItemsRepresentation [] = [
    {
      GroupDescriptor: 'Web Apps',
      GroupOrder: 0,
      ItemDescriptor: 'Configuration Page',
      Mode: 0,
      Nodes: [{
        Attributes: {
          Alias: 'Alias',
          DefaultProperty: 'DefaultProperty',
          DisciplineDescriptor: 'DisciplineDescriptor',
          DisciplineId: 0,
          FunctionName: 'FunctionName',
          ManagedType: 0,
          ManagedTypeName: 'ManagedTypeName',
          ObjectId: mockObjectId,
          SubDisciplineDescriptor: 'SubDisciplineDescriptor',
          SubDisciplineId: 0,
          SubTypeDescriptor: 'SubTypeDescriptor',
          SubTypeId: 0,
          TypeDescriptor: 'TypeDescriptor',
          TypeId: 0,
          ObjectModelName: 'ObjectModelName'
        },
        Descriptor: 'Configuration Page',
        Designation: 'System1.ManagementView:ManagementView.SystemSettings.Libraries.HQ.Global.Global_AdvancedReporting_HQ_1.AdvRules.ConfigurationPage',
        HasChild: false,
        // eslint-disable-next-line max-len
        Location: 'System1.Management View:Project.System Settings.Libraries.L1-Headquarter.Global.Advanced Reporting.Advanced Reporting Rules.Configuration Page',
        Name: 'ConfigurationPage',
        ObjectId: 'System1:ManagementView_SystemSettings_Libraries_HQ_Global_Global_AdvancedReporting_HQ_1_AdvRules_ConfigurationPage',
        SystemId: 1,
        ViewId: 9,
        ViewType: 0
      }],
      Parameter: 'ManagementView_SystemSettings_Libraries_HQ_Global_Global_AdvancedReporting_HQ_1_AdvRules_ConfigurationPage',
      Reference: '',
      SourceType: 3
    }
  ];

  const mockReadPropertyValue =
  {
    'ErrorCode': 0,
    'ObjectId': 'System1:ManagementView_SystemSettings_Libraries_HQ_Global_Global_AdvancedReporting_HQ_1_AdvRules_ConfigurationPage',
    'OriginalObjectOrPropertyId': 'System1:ManagementView_SystemSettings_Libraries_HQ_Global_Global_AdvancedReporting_HQ_1_AdvRules_ConfigurationPage',
    'Attributes': {
      'DefaultProperty': 'Description',
      'ObjectId': 'System1:ManagementView_SystemSettings_Libraries_HQ_Global_Global_AdvancedReporting_HQ_1_AdvRules_ConfigurationPage',
      'DisciplineDescriptor': 'Management System',
      'DisciplineId': 0,
      'SubDisciplineDescriptor': 'Unassigned',
      'SubDisciplineId': 0,
      'TypeDescriptor': 'Other',
      'TypeId': 9900,
      'SubTypeDescriptor': 'Unassigned',
      'SubTypeId': 0,
      'ManagedType': 208,
      'ManagedTypeName': 'Application Rule',
      'ObjectModelName': 'GmsApplicationRule',
      'ValidationRules': {},
      'Alias': '',
      'FunctionName': ''
    },
    'FunctionProperties': [],
    'Properties': [
      {
        'Order': 0,
        'Resolution': 0,
        'PropertyName': 'StatusPropagation.AggregatedSummaryStatus',
        'Descriptor': 'ParamValue',
        'Type': 'ExtendedEnum',
        'Usage': 7,
        'Value': {
          'Value': '0',
          'DisplayValue': 'Normal',
          'Quality': '0',
          'QualityGood': true,
          'Timestamp': '1970-01-01T00:00:00Z'
        },
        'DisplayOffNormalOnly': false,
        'NormalValue': '0',
        'PropertyAbsent': false,
        'IsArray': false,
        'TextTable': 'TxG_PropagationSummaryStatus',
        'PropertyType': 0
      }
    ]
  };

  const mockGetParam: ParameterDetails = {
    parameters: [
      {
        'controlType': ' ',
        'dataType': '',
        'defaultvalue': ' ',
        'fixedOrder': true,
        'Hidden': false,
        'Required': true,
        'name': 'path',
        'paramterType': 0,
        'scalarParameterType': 'simple',
        'locale': ''
      }
    ]
  };

  const mockParamterRelatedInfo: ParameterRelatedInfo = {
    parametersLoading: true,
    parameterMetaData: [{
      controlType: 'ListBox',
      dataType: 'String',
      defaultvalue: 'today -1M',
      fixedOrder: true,
      //  helpText: 'Enter range of dates',
      Hidden: false,
      locale: 'en_US',
      name: 'dataRange',
      paramterType: 0,
      promptText: 'Time range for Report Content',
      Required: true,
      scalarParameterType: 'simple'
    }],
    selectedRule: 'alarm summary adv Rpt',
    ruleObjectId: ''
  };

  beforeEach(async () => {

    propertyValuesServiceStub = {
      readPropertiesAndValue: (): Observable<PropertyInfo<PropertyDetails>> => of(mockReadPropertyValue)
    };

    advanceReportingServiceStub = {
      getParameterDetailsJson: (): Observable<ParameterDetails> => of(mockGetParam)
    };

    reportViewerServiceStub = {
      paramatersRelatedInfo: new Subject<ParameterRelatedInfo>()
    };

    await TestBed.configureTestingModule({
      declarations: [ApplicationRulesComponent],
      providers: [{ provide: PropertyValuesService, useValue: propertyValuesServiceStub },
        { provide: AdvanceReportingService, useValue: advanceReportingServiceStub },
        { provide: ReportViewerService, useValue: reportViewerServiceStub },
        { provide: TraceService, useClass: MockTraceService }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationRulesComponent);
    mockPropertyValuesService = TestBed.inject(PropertyValuesService);
    mockAdvanceReportingService = TestBed.inject(AdvanceReportingService);
    mockReportViewService = TestBed.inject(ReportViewerService);
    mockTraceService = TestBed.inject(TraceService);
    component = fixture.componentInstance;
    component.applicationRules = applicationMock;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should viewRuleselectionChanged() called', () => {
    const retainspy = spyOn(component as any, 'parameterDialog');
    const mockEvent = {
      isTrusted: true,
      bubbles: true,
      cancelBubble: false,
      cancelable: false,
      composed: false,
      currentTarget: [],
      defaultPrevented: false,
      eventPhase: 2,
      returnValue: true,
      srcElement: [],
      target: {
        value: 'Configuration Page',
        selectedIndex: 1
      },
      timeStamp: 1009560.5,
      type: 'change'
    };
    component.paramterRelatedInfo = mockParamterRelatedInfo;
    component.applicationRules = applicationMock;
    reportViewerServiceStub.paramatersRelatedInfo.next(mockParamterRelatedInfo);
    fixture.detectChanges();
    component.viewRuleselectionChanged(mockEvent);
    fixture.detectChanges();
    expect(component.applicationRules).toBeDefined();
    fixture.detectChanges();
    expect(retainspy).toHaveBeenCalled();
  });

  it('should parameterDialog() called', () => {
    const spyProperty = spyOn(mockPropertyValuesService, 'readPropertiesAndValue').and.returnValue(of(mockReadPropertyValue));
    const spyParam = spyOn(mockAdvanceReportingService, 'getParameterDetailsJson').and.returnValue(of(mockGetParam));
    component.parameterDialog(applicationMock[0]);
    fixture.detectChanges();
    expect(spyProperty).toHaveBeenCalled();
    expect(spyParam).toHaveBeenCalled();
    fixture.detectChanges();
  });

});
