import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { AdvanceReportingService,
  CascadingOptions, HistoryLogTable, LogViewerService,
  LogViewerServiceBase, ParametersMetaData } from '@gms-flex/services';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ResizeObserverService, SiFormModule } from '@simpl/element-ng';
import { SiFormlyModule } from '@simpl/element-ng/formly';
import { Observable, of } from 'rxjs';
import { AdvancedReportParametersComponent } from './advance-report-parameters.component';

describe('ParameterDialogComponent', () => {
  let component: AdvancedReportParametersComponent;
  let fixture: ComponentFixture<AdvancedReportParametersComponent>;
  let applogViewerServiceStub: Partial<LogViewerService>;
  let appAdvanceReportingServiceStub: Partial<AdvanceReportingService>;
  let mockResizeObserverService: ResizeObserverService;
  let mockLogViewerService: LogViewerServiceBase;
  let mockAdvanceReporingService: AdvanceReportingService;
  let mockTraceService: TraceService;
  const parametersMetaData: ParametersMetaData[] =
  [
    {
      controlType: 'ListBox',
      dataType: 'String',
      defaultvalue: '',
      // helpText: 'Select a media, if your list is empty check if you have WSI connection or your cache has been generated properly.',
      fixedOrder: true,
      //  helpText: 'Enter range of dates',
      Hidden: false,
      locale: 'en_US',
      paramterType: 0,
      // CascadingGroup: 'MediaGroup_selection',
      Required: true,
      name: 'Media',
      promptText: 'Media',
      scalarParameterType: 'multi-value',
      selectionList: [
        {
          'key': '<All>',
          'localeText': ''
        }
      ]
    },
    {
      controlType: 'ListBox',
      dataType: 'String',
      defaultvalue: '',
      // helpText: 'Select a media, if your list is empty check if you have WSI connection or your cache has been generated properly.',
      fixedOrder: true,
      //  helpText: 'Enter range of dates',
      Hidden: false,
      locale: 'en_US',
      paramterType: 0,
      // CascadingGroup: 'MediaGroup_selection',
      Required: true,
      name: 'MediaGroup',
      promptText: 'Media',
      scalarParameterType: 'multi-value',
      selectionList: [
        {
          'key': '<All>',
          'localeText': ''
        },
        {
          'key': '210',
          'localeText': 'Electricity'
        }
      ]
    },
    {
      controlType: 'TextBox',
      dataType: 'String',
      defaultvalue: 'today -1M',
      fixedOrder: true,
      //  helpText: 'Enter range of dates',
      Hidden: false,
      locale: 'en_US',
      name: 'dataRange',
      paramterType: 0,
      promptText: 'Time range for Report Content',
      scalarParameterType: 'simple',
      Required: true
    },
    {
      controlType: 'Checkbox',
      dataType: 'Boolean',
      defaultvalue: 'today -1M',
      fixedOrder: true,
      //  helpText: 'Enter range of dates',
      Hidden: false,
      locale: 'en_US',
      name: 'dataRange',
      paramterType: 0,
      promptText: 'Time range for Report Content',
      scalarParameterType: 'simple',
      Required: true
    }
  ];
  const parametersMetaDataWithDatarange: ParametersMetaData[] = [
    {
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
    }
  ];

  const parametersMetaDataWithoutMedia: ParametersMetaData[] =
  [{
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
  }, {
    controlType: 'TextBox',
    dataType: 'String',
    defaultvalue: 'today -1M',
    fixedOrder: true,
    //  helpText: 'Enter range of dates',
    Hidden: false,
    locale: 'en_US',
    name: 'dataRange',
    paramterType: 0,
    promptText: 'Time range for Report Content',
    scalarParameterType: 'simple',
    Required: true
  },
  {
    controlType: 'Checkbox',
    dataType: 'Boolean',
    defaultvalue: 'today -1M',
    fixedOrder: true,
    //  helpText: 'Enter range of dates',
    Hidden: false,
    locale: 'en_US',
    name: 'dataRange',
    paramterType: 0,
    promptText: 'Time range for Report Content',
    scalarParameterType: 'simple',
    Required: true
  }
  ];

  const logViewResult = [
    {
      Id: 1,
      EventId: 1,
      Time: '2021-09-22T18:54:56.443Z',
      LogType: 'LogType',
      RecordType: 'RecordType',
      AuditFlag: 'AuditFlag',
      UserName: 'UserName',
      Workstation: 'Workstation',
      Action: 'Action',
      Status: 'string',
      Name: 'string',
      Description: 'string',
      InternalName: 'string',
      HiddenInternalName: 'string',
      DefaultViewDesignation: 'string',
      DefaultViewLocation: 'string',
      CurrentViewDesignation: 'string',
      CurrentViewLocation: 'string',
      ManagementDesignation: 'string',
      ManagementLocation: 'string',
      SystemName: 'string',
      Discipline: 'string',
      SubDiscipline: 'string',
      Type: 'string',
      SubType: 'string',
      ValProf: 'string',
      EventCatPrio: 11,
      EventCause: 'string',
      AlertId: 'string',
      AlarmCategory: 'string',
      AlertMode: 'string',
      EventMessageText: 'string',
      AlertTime: 'string',
      AlertState: 'string',
      ObjectPropertyLogView: 'string',
      ObserverObjectPropertyLogView: 'string',
      LogicalDesignation: 'string',
      LogicalLocation: 'string',
      ObserverName: 'string',
      ObserverDescription: 'string',
      ObserverNameInternal: 'string',
      ObserverDefaultHierarchyDesignation: 'string',
      ObserverDefaultHierarchyLocation2: 'string',
      DeviceEventText: 'string',
      ValueDurationTicks: 11,
      Value: 'string',
      ApplicationDesignation: 'string',
      ApplicationLocation: 'string',
      PrevValueDurationTicks: 11,
      PrevValue: 'string',
      MessageText: 'string',
      Error: 'string'
    }];

  const linkLog = [{
    Rel: 'rel',
    Href: 'href',
    IsTemplated: false
  }];
  const historyLogData = {
    TableName: 'tableName',
    Size: 1,
    Page: 1,
    Result: logViewResult,
    SnapshotId: 'snapshotId',
    Total: 1,
    ErrorInfo: ['string'],
    _links: linkLog
  };

  const cascadingOptionsData = {
    items: [
      {
        key: 'Auto',
        localeText: 'auto'
      },
      {
        key: 'Day',
        localeText: 'D'
      },
      {
        key: 'Week',
        localeText: 'W'
      }
    ]
  };

  beforeEach(async () => {

    applogViewerServiceStub = {
      getHistoryLogs: (): Observable<HistoryLogTable> => of(historyLogData)
    };

    appAdvanceReportingServiceStub = {
      getCascadingOptionListByParam: (): Observable<CascadingOptions> => of(cascadingOptionsData)
    };

    await TestBed.configureTestingModule({
      imports: [
        SiFormlyModule.forRoot({
          validationMessages: [
            { name: 'required', message: 'This field is required' }
          ]
        }),
        SiFormModule
      ],
      declarations: [AdvancedReportParametersComponent],
      providers: [
        { provide: ResizeObserverService, useClass: ResizeObserverService },
        { provide: LogViewerServiceBase, useValue: applogViewerServiceStub },
        { provide: AdvanceReportingService, useValue: appAdvanceReportingServiceStub },
        { provide: TraceService, useClass: MockTraceService }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdvancedReportParametersComponent);
    component = fixture.componentInstance;
    mockTraceService = TestBed.inject(TraceService);
    mockLogViewerService = TestBed.inject(LogViewerServiceBase);
    mockResizeObserverService = TestBed.inject(ResizeObserverService);
    fixture.detectChanges();
  });

  it('should create AdvancedReportParametersComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should check small screen display on minified table display', () => {
    spyOn(mockResizeObserverService, 'observe').and.returnValue(of({ width: 400, height: 200 }));
    (component as any).ngOnInit();
    fixture.detectChanges();
    expect(component.containerWidth).toBe(400);
  });

  it('should check ngOnChanges', () => {
    const setControlTypeSpy = spyOn(component, 'setControlType');
    const getCascadingOptionListSpy = spyOn(component, 'getCascadingOptionList');
    const customParamsSpy = spyOn(component, 'customParams');
    (component as any).parametersMetaData = parametersMetaData;
    component.ngOnChanges({
      parametersMetaData: new SimpleChange(null, parametersMetaData, true)
    });
    expect(setControlTypeSpy).toHaveBeenCalled();
    expect(customParamsSpy).toHaveBeenCalled();
    const field =
    { key: 'Media', get parent(): any { return { get: (): any => ({ formControl: new FormControl('<Select Value...>') }) }; },
      type: 'select', defaultValue: '200', props: { label: 'Media Group', required: true, multiple: false } };
    component.fields[0].fieldGroup[0].hooks.onInit(field);
  });

  it('should check ngOnChanges with datarange', () => {
    const setControlTypeSpy = spyOn(component, 'setControlType');
    const getCascadingOptionListSpy = spyOn(component, 'getCascadingOptionList');
    const customParamsSpy = spyOn(component, 'customParams');
    (component as any).parametersMetaData = parametersMetaDataWithDatarange;
    component.ngOnChanges({
      parametersMetaData: new SimpleChange(null, parametersMetaDataWithDatarange, true)
    });
    expect(setControlTypeSpy).toHaveBeenCalled();
    expect(customParamsSpy).toHaveBeenCalled();
    const field =
    { key: 'dataRange', formControl: new FormControl('<Select Value...>'),
      type: 'select', defaultValue: '200', props: { label: 'Media Group', required: true, multiple: false } };
    component.fields[0].fieldGroup[0].hooks.onInit(field);
    field.formControl.setValue('hey');
    expect(getCascadingOptionListSpy).toHaveBeenCalled();
  });

  it('should check ngOnChanges without Media', () => {
    const setControlTypeSpy = spyOn(component, 'setControlType');
    const customParamsSpy = spyOn(component, 'customParams');
    (component as any).parametersMetaData = parametersMetaDataWithoutMedia;
    component.ngOnChanges({
      parametersMetaData: new SimpleChange(null, parametersMetaDataWithoutMedia, true)
    });
    expect(setControlTypeSpy).toHaveBeenCalled();
    expect(customParamsSpy).toHaveBeenCalled();
  });

  it('should check ngOnChanges with null', () => {
    const setControlTypeSpy = spyOn(component, 'setControlType');
    const customParamsSpy = spyOn(component, 'customParams');
    (component as any).parametersMetaData = parametersMetaData;
    component.ngOnChanges({
      parametersMetaData: new SimpleChange(null, null, true)
    });
    expect(setControlTypeSpy).not.toHaveBeenCalled();
    expect(customParamsSpy).not.toHaveBeenCalled();
  });

  it('should check ngOnChanges with media parameter', () => {
    const setControlTypeSpy = spyOn(component, 'setControlType');
    const customParamsSpy = spyOn(component, 'customParams');
    (component as any).parametersMetaData = parametersMetaData;
    component.ngOnChanges({
      parametersMetaData: new SimpleChange(null, parametersMetaData, true)
    });
    expect(setControlTypeSpy).toHaveBeenCalled();
    expect(customParamsSpy).toHaveBeenCalled();
  });

  it('should check setControlType with ListBox', () => {
    (component as any).parametersMetaData = parametersMetaData;
    const result = component.setControlType(parametersMetaData[0]);
    expect(result).toBe('select');
  });

  it('should check setControlType TextBox', () => {
    (component as any).parametersMetaData = parametersMetaData;
    const result = component.setControlType(parametersMetaData[2]);
    expect(result).toBe('string');
  });

  it('should check setControlType CheckBox', () => {
    (component as any).parametersMetaData = parametersMetaData;
    const result = component.setControlType(parametersMetaData[3]);
    expect(result).toBe('boolean');
  });

  it('should check setControlType with random controlType', () => {
    (component as any).parametersMetaData = parametersMetaData;
    parametersMetaData[2].controlType = 'random';
    const result = component.setControlType(parametersMetaData[2]);
    expect(result).toBe('');
  });

  it('should check customParams for Listbox', () => {
    (component as any).parametersMetaData = parametersMetaData;
    const fields = { key: 'MediaGroup', type: 'select', defaultValue: '200', props: { label: 'Media Group', required: true, multiple: false } };
    const result = component.customParams(fields, parametersMetaData[0]);
    expect(fields.props.multiple).toBe(true);
  });

  it('should check customParams for fromDate', () => {
    (component as any).parametersMetaData = parametersMetaData;
    const fields: FormlyFieldConfig =
    { key: 'property', type: 'datetime', defaultValue: undefined, props: { label: 'Media Group', required: true } };
    const result = component.customParams(fields, {
      controlType: 'TextBox',
      dataType: 'Date',
      defaultvalue: 'today -1M',
      // helpText: 'Enter the start date of the range, e.g. ',
      Hidden: false,
      Required: false,
      name: 'toDate',
      promptText: 'From Date (e.g. 2015-01-01 , inclusive date)',
      locale: 'en_US',
      paramterType: 0,
      scalarParameterType: 'simple',
      fixedOrder: true
      //  helpText: 'Enter range of dates',
    });
    expect(fields.expressions).toBeDefined();
  });
});
