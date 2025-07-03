/* eslint-disable guard-for-in */
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormRecord } from '@angular/forms';
import {
  AdvanceReportingService, AdvanceReportingServiceBase, BrowserObject, ExecuteApiParams, HistoryApiParams, HistoryLogKind, LogViewerServiceBase,
  ParametersMetaData, PropertyValuesService
} from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { ResizeObserverService, SiToastNotificationService } from '@simpl/element-ng';
import { distinctUntilChanged, map, of, startWith, Subscription } from 'rxjs';
import { ReportViewerService } from '../../services/report-viewer.service';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'gms-advance-report-parameters',
  templateUrl: './advance-report-parameters.component.html',
  styleUrl: './advance-report-parameters.component.css',
  standalone: false
})
export class AdvancedReportParametersComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('ReportParameter', { static: true, read: ElementRef }) public reportParameterElement!: ElementRef;
  @Output() public readonly showHideReportEvent = new EventEmitter();
  @Input() public readonly parametersMetaData: ParametersMetaData[];
  @Input() public responsiveParameter: string;
  @Input() public selectedRule: string;
  @Input() public systemId: number;
  @Input() public fileNameData: string;
  @Input() public selectedObject: BrowserObject;
  @Input() public ruleObjectIdData: string;
  @Input() public fileTypeData: string;

  public invalid_inputError = '';
  public failureErrorTitle = '';
  public failureErrorMsg = '';
  public service_unavailableErrorTitle = '';
  public service_unavailableErrorMsg = '';
  public advancedReportingConfigurationFailedTitle = '';
  public advancedReportingConfigurationFailedMsg = '';
  public mainUrlUnavailableMsg = '';
  public errorMsgDescription = '';
  public considerTime = '';
  public ignoreTime = '';
  public formGroup = new FormRecord({});
  public fields: FormlyFieldConfig[] = [];
  public dataNew: any;
  public containerWidth: number;
  public numberOfColumns: number;
  public executionCommanded = '';
  public cascadedParamError = '';
  public mediaParamError = '';
  private resizeSubs?: Subscription;
  private mediaLists: any[ ] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly resizeObserver: ResizeObserverService,
    private readonly logViewerService: LogViewerServiceBase,
    private readonly traceService: TraceService,
    private readonly advancedReportingService: AdvanceReportingService,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly reportViewerService: ReportViewerService,
    private readonly translateService: TranslateService
  ) { }

  public ngOnChanges(changes: SimpleChanges): void {
    
    if (changes?.parametersMetaData?.currentValue != null) {
      const fieldsGroup = this.parametersMetaData?.map((metaData: ParametersMetaData) => {

        if (this.setControlType(metaData) || !metaData?.Hidden) {
          const fields: FormlyFieldConfig = {
            key: metaData.name,
            type: this.setControlType(metaData),
            wrappers: ['tooltip', 'form-field'],
            defaultValue: metaData.defaultvalue,
            props: {
              helpText: metaData?.promptText,
              label: metaData?.promptText || metaData?.name,
              required: metaData.Required,
              pattern: metaData.dataType == 'Integer' ? /^(\d+)?$/ : metaData.dataType == 'String' ? /^[^@+=]+[^]*$/ : ''
            },
            hooks: {
              onInit: field => {
                if (metaData.name == 'Media') {
                  // calculate mediagroup field options length
                  let groupOpt;
                  this.fields[0].fieldGroup?.find(param => groupOpt = param.key == 'MediaGroup' ? param.props.options : []);
                  // calculate media field options length
                  const medialength = metaData.selectionList ? metaData.selectionList?.find(x => x.localeText == '')
                    ? metaData.selectionList.length - 1 : metaData.selectionList.length : 0;
                  // to check media list is not empty for filter based on mediagroup
                  // And checking option list of mediagroup and media as we are not getting
                  // media data in some cases if have single mediagroup
                  const isLocaleTextNull = metaData.selectionList?.find(x => x.localeText === null);
                  if (this.mediaLists.length == 0 && (groupOpt.length > 1 || medialength == 0 || !metaData?.selectionList || isLocaleTextNull)) {
                    const params: HistoryApiParams = {
                      systemId: this.systemId,
                      historyLogKind: HistoryLogKind.MeterConfigurationReport
                    };
                    const historyLogsSubs: Subscription = this.logViewerService.getHistoryLogs(params).subscribe(
                      {
                        next: response => {
                          this.mediaLists = response.Result;
                          const mediaGrupControl = field.parent.get('MediaGroup').formControl;
                          field.props.options = mediaGrupControl.valueChanges.pipe(
                            startWith(mediaGrupControl.value),
                            distinctUntilChanged(),
                            map(() => {
                              const mediaGroupId = +mediaGrupControl?.value;
                              const options = [];
                              const defaultSelected = [];
                              this.mediaLists?.forEach((media: any) => {
                                if (media?.MeterMediaGroupTextGroupId === mediaGroupId && changes.selectedObject?.currentValue.HasChild) {
                                  options.push({ label: media?.MeterMedia, value: media?.MeterMediaTextGroupId });
                                  if (!defaultSelected.includes(media?.MeterMediaTextGroupId)) {
                                    defaultSelected.push(media?.MeterMediaTextGroupId);
                                  }
                                } else if (media?.MeterMediaGroupTextGroupId === mediaGroupId && media?.MeterName ===
                                  changes.selectedObject?.currentValue?.Name) {
                                  options.push({ label: media?.MeterMedia, value: media?.MeterMediaTextGroupId });
                                }
                              });
                              if (options.length !== 0) {
                                if (changes.selectedObject?.currentValue.HasChild) {
                                  field.formControl.patchValue(defaultSelected);
                                } else {
                                  field.formControl.patchValue([options[0]?.value]);
                                }
                              } else {
                                field.formControl.patchValue(undefined);
                              }
                              return [...new Map(options.map(item => [item.label, item])).values()];
                            })
                          );
                          historyLogsSubs.unsubscribe();
                        },
                        error: err => {
                          historyLogsSubs.unsubscribe();
                          this.toastNotificationService.queueToastNotification('danger', this.mediaParamError, '');
                          this.traceService.warn('advance-report-parameter', `error occured at getHistoryLogs ${err}`);
                        }
                      });
                  }
                }
                if (metaData.CascadingGroup && metaData.CascadingGroup !== 'MediaGroup_selection') {
                  return field.formControl.valueChanges.subscribe(optValue =>
                    this.getCascadingOptionList(metaData.name, optValue)
                  );
                }
              }
            }
          };
          this.customParams(fields, metaData);
          return fields;
        }
      });

      const numberOfControls = fieldsGroup.length;
      this.numberOfColumns = Math.floor(numberOfControls / 2);
      const gridRows = [];
      fieldsGroup.forEach((data, index) => {
        if (this.numberOfColumns >= index) {
          gridRows.push({
            columns: [{
              fieldCount: 1
            }, {
              fieldCount: 1
            }]
          });
        }
      });
      gridRows.push({
        columns: [{
          fieldCount: -1
        } // -1 catches all remaining fields
        ]
      });
      this.fields = [{
        type: 'object-grid',
        props: {
          // Config for a simple bootstrap grid
          gridConfig: gridRows
        },
        fieldGroup: fieldsGroup
      }];
    }
  }

  public ngOnInit(): void {
    this.resizeSubs = this.resizeObserver
      .observe(this.reportParameterElement.nativeElement, 100, false, false)
      .subscribe(dim => {
        this.containerWidth = dim.width;
      });
    this.getTranslations();
  }
  public ngOnDestroy(): void {
    this.resizeSubs.unsubscribe();
  }

  public setControlType(metaData: ParametersMetaData): string {
    switch (metaData?.controlType) {
      case 'Checkbox':
        return metaData?.dataType === 'Boolean' ? 'boolean' : 'checkbox';
      case 'TextBox':
      case 'TextBox':
        // eslint-disable-next-line max-len
        return metaData.dataType === 'Date' ? 'datetime' : (metaData.dataType === 'Float' || metaData.dataType === '3') ? 'number' : (metaData.dataType === '8' || metaData.dataType == 'Integer') ? 'string' : metaData.dataType?.toLowerCase();
      case 'ListBox':
        return metaData.dataType = 'select';
      default:
        return '';
    }
  }

  public customParams(fields: FormlyFieldConfig, metaData: ParametersMetaData): FormlyFieldConfig {
    // to set the dropdown values in case of select and multiselect
    if (metaData.controlType === 'ListBox') {
      fields.props.options = [];
      metaData.selectionList = metaData?.selectionList ? metaData.selectionList.filter(value => value.key !== '<All>') : undefined;
      const defaultForParent = [];
      fields.props.multiple = (metaData.scalarParameterType === 'multi-value') ? true : false;
      if (metaData?.selectionList) {
        for (const list of metaData?.selectionList) {
          const selectValueCheck = list?.key?.replace(/\s/g, '')?.toLocaleLowerCase()?.includes('Select Value'.replace(/\s/g, '')?.toLocaleLowerCase());
          if (selectValueCheck) {
            fields.defaultValue = undefined;
            list.localeText = list.localeText === ' ' || list.localeText == '' ? list.key : list.localeText;
          }
          const label = list.localeText === ' ' || list.localeText == '' ? list.key : list.localeText;
          fields.props.options.push({ label, value: selectValueCheck ? undefined : list.key });
          defaultForParent.push(list.key);
        }
        fields.props.options = fields.props.options?.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
        fields.defaultValue = fields.props.multiple ? fields.props?.options.length == 0 ? '' : defaultForParent :
          fields.defaultValue ? fields.defaultValue : fields.props?.options[0]?.value;
      }
    }

    // validate toDate and fromDate by disabling dates based on selection
    if (metaData?.dataType == 'Date' || 'datetime') {
      fields.expressions = {
        'props.dateConfig': (): any => {
          if (metaData.name === 'toDate' && this.formGroup.value.fromDate) {
            return {
              minDate: new Date(this.formGroup.value.fromDate),
              showTime: metaData?.dataType === 'DateTime',
              showSeconds: true,
              enabledTimeText: this.considerTime,
              disabledTimeText: this.ignoreTime
            };
          } else if (metaData.name === 'fromDate' && this.formGroup.value.toDate) {
            return {
              maxDate: new Date(this.formGroup.value.toDate),
              showTime: metaData?.dataType === 'DateTime',
              showSeconds: true,
              enabledTimeText: this.considerTime,
              disabledTimeText: this.ignoreTime
            };
          }
          return metaData?.dataType === 'DateTime' ? { 
            showTime: true, 
            showSeconds: true,
            enabledTimeText: this.considerTime,
            disabledTimeText: this.ignoreTime
          } : {};
        }
      };
    }

    fields.defaultValue = fields.defaultValue == '' || null ? undefined : metaData.dataType
      == 'Boolean' ? JSON.parse(fields.defaultValue) : fields.defaultValue;
    return fields;
  }

  public getCascadingOptionList(cascadingParamName: string, selectedOption: string): void {
    let childParam;
    this.fields[0].fieldGroup.find((x, index) => {
      if (x.key === cascadingParamName) {
        childParam = this.fields[0].fieldGroup[index + 1];
      }
    });
    const optionlist = [];
    let parentCascadingGroup;
    let childCascadingGroup; 
    for (let paramCount = 0; paramCount < this.parametersMetaData.length - 1; paramCount++) {
      if (this.parametersMetaData[paramCount]?.name === cascadingParamName) {
        parentCascadingGroup = this.parametersMetaData[paramCount].CascadingGroup;
        childCascadingGroup = this.parametersMetaData[paramCount + 1].CascadingGroup;
        break;
      }
    }
    if (childParam && childParam.type == 'select' && parentCascadingGroup === childCascadingGroup) {
      const cascadeSubs: Subscription = this.advancedReportingService.getCascadingOptionListByParam(this.systemId,
        this.fileNameData, cascadingParamName, selectedOption).subscribe(
        {
          next: resp => {
            resp.items.forEach((values: any) => {
              optionlist.push({
                label: values.key,
                value: values.localeText
              });
            });
            const field = this.getField(childParam?.key);
            // To Update the optionlist
            field.props.options = [...optionlist];
            // To Update the default selection in dropdown
            field.formControl.patchValue(optionlist[0]?.value);
            cascadeSubs.unsubscribe();
          },
          error: err => {
            this.toastNotificationService.queueToastNotification('danger', this.cascadedParamError, '');
            cascadeSubs.unsubscribe();
            this.traceService.warn('advance-report-parameter', `error occured at getHistoryLogs ${err}`);
          }
        });
    }
  }

  public onBackButton(): void {
    this.showHideReportEvent.emit();
  }

  public executeReport(): void {
    const parametersValue = {
      'Parameters': [],
      'Section': 'save document'
    };

    // to define file name data
    parametersValue.Parameters.push({
      ParamId: 'report',
      ParamValue: this.fileNameData
    });

    // to define file format data
    parametersValue.Parameters.push({
      ParamId: 'format',
      ParamValue: this.fileTypeData
    });

    // Payload parameters
    for (const key in this.formGroup.value) {
      this.fields[0].fieldGroup.forEach(field => {
        if ((field.type === 'Date' || 'datetime') && key === field.key) {
          // PCR 2655403: Not able to open Powermanager reports in Flex client with custom duration
          // In case of custom duration selection for german OS, the date format sent
          // from client is in german format, which is not supported by the tomcat server. Hence, we are converting the date
          // format to en-US format before sending it to server.
          // Date format sent: 08.10.2021 00:00:00
          // Date format expected: 10/08/2021 00:00:00AM
          // In case of failure in future, we will revert the changes and will check for the root cause.
          this.formGroup.value[key] = this.formGroup.value[key]?.toLocaleString('en-US');
        }
      });

      // multi selection parameter should be send as a string seperated by commas
      if (Array.isArray(this.formGroup.value[key])) {
        this.formGroup.value[key] = this.formGroup.value[key]?.toString();
      }
      parametersValue.Parameters.push({
        ParamId: key,
        ParamValue: this.formGroup.value[key]
      });
    }

    const params: ExecuteApiParams = {
      systemId: this.systemId,
      ruleId: this.ruleObjectIdData,
      parameters: parametersValue,
      selectionContext: this.selectedObject.Designation,
      fileName: this.selectedRule,
      fileExt: this.fileTypeData,
      objectId: this.selectedObject.ObjectId
    };
    
    const executeSubs: Subscription = this.advancedReportingService.executeParameters(params).subscribe(
      {
        next: resp => {
          executeSubs.unsubscribe();
          this.reportViewerService.reportExecutionId.next(resp.ReportExecutionId);
          this.toastNotificationService.queueToastNotification('success', this.executionCommanded, '');
          executeSubs.unsubscribe();
        },
        error: err => {
          executeSubs.unsubscribe();
          this.toastNotificationService.queueToastNotification('danger', this.getToastMessage(err), this.errorMsgDescription);
          this.traceService.warn('advance-report-parameter', `error occured at executeParameters ${err}`);
          executeSubs.unsubscribe();
        }
      });

  }

  public getTranslations(): void {
    this.subscriptions.push(
      this.translateService
        .get([
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_EXECUTION_COMMANDED',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CASCADED_PARAM_FAILED',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_MEDIA_FAILED',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_EXECUTION_FAILED',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_INVALID_INPUT',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR_MESSAGE',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR_MESSAGE',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED',
          'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED_MESSAGE',
          'REPORT-VIEWER.ADVANCE_REPORTING.CONSIDER_TIME',
          'REPORT-VIEWER.ADVANCE_REPORTING.IGNORE_TIME'
        ])
        .subscribe(values => {
          this.executionCommanded = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_EXECUTION_COMMANDED'];
          this.cascadedParamError = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CASCADED_PARAM_FAILED'];
          this.mediaParamError = values[ 'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_MEDIA_FAILED'];
          this.invalid_inputError = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_INVALID_INPUT'];
          this.failureErrorTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR'];
          this.failureErrorMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR_MESSAGE'];
          this.service_unavailableErrorTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR'];
          this.service_unavailableErrorMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR_MESSAGE'];
          this.advancedReportingConfigurationFailedTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED'];
          this.advancedReportingConfigurationFailedMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED_MESSAGE'];
          this.mainUrlUnavailableMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_MAIN_URL_MESSAGE'];
          this.considerTime = values['REPORT-VIEWER.ADVANCE_REPORTING.CONSIDER_TIME'];
          this.ignoreTime = values['REPORT-VIEWER.ADVANCE_REPORTING.IGNORE_TIME'];
        })
    );
  }

  // To handle errors on execution of reports
  public getToastMessage(err): string {
    let errorMsg: string;
    if (err.message === 'Invalid Input') {
      errorMsg = this.invalid_inputError;
    } else if (err.message
      === 'Unable to connect to remote server') {
      errorMsg = this.service_unavailableErrorTitle;
      this.errorMsgDescription = this.service_unavailableErrorMsg;
    } else if (err.message === 'Mainurl unavailable') {
      errorMsg = this.advancedReportingConfigurationFailedTitle;
      this.errorMsgDescription = this.mainUrlUnavailableMsg;
    } else if (err.message === 'Synchronization fail') {
      errorMsg = this.advancedReportingConfigurationFailedTitle;
      this.errorMsgDescription = this.advancedReportingConfigurationFailedMsg;
    } else {
      errorMsg = this.failureErrorTitle;
      this.errorMsgDescription = this.failureErrorMsg;
    }
    return errorMsg;
  }

  private getField(key: string, fields: FormlyFieldConfig[] = this.fields): FormlyFieldConfig {
    for (const field of fields) {
      if (field.key === key) {
        return field;
      }

      if (field.fieldGroup && field.fieldGroup.length > 0) {
        return this.getField(key, field.fieldGroup);
      }
    }
  }
}
