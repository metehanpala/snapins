import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef,
  EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AdvanceReportingService, BrowserObject, ParameterDetails, PropertyValuesService, RelatedItemsRepresentation } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { MenuItem, SiToastNotificationService } from '@simpl/element-ng';
import { Subscription } from 'rxjs';
import { ReportViewerService } from '../../services/report-viewer.service';
import { ParameterRelatedInfo, SelectedRuleDetails, StateData } from '../../view-model/storage-vm';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'gms-application-rules',
  templateUrl: './application-rules.component.html',
  styleUrl: './application-rules.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ApplicationRulesComponent implements OnInit, OnChanges, OnDestroy {

  public rptDesign: any;
  public invalid_inputError = '';
  public failureErrorTitle = '';
  public failureErrorMsg = '';
  public service_unavailableErrorTitle = '';
  public service_unavailableErrorMsg = '';
  public advancedReportingConfigurationFailedTitle = '';
  public advancedReportingConfigurationFailedMsg = '';
  public mainUrlUnavailableMsg = '';
  public errorMsgDescription = '';
  public items: MenuItem[] = [];
  public paramterRelatedInfo: ParameterRelatedInfo = {
    parametersLoading: false,
    parameterMetaData: null,
    selectedRule: '',
    ruleObjectId: '',
    selectionContext: '',
    rptdesign: ''
  };
  public selectedRuleInfo: RelatedItemsRepresentation;

  @Input() public applicationRules: RelatedItemsRepresentation[];
  @Input() public systemId: number;
  @Input() public selectedObject: BrowserObject;
  @Input() public stateDataObject: StateData;
  @Output() public readonly childToParent = new EventEmitter<string>();
  @Output() public readonly savedSelectedRule = new EventEmitter<SelectedRuleDetails>();
  @ViewChild('rules') public rules!: ElementRef;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly propertyValuesService: PropertyValuesService,
    private readonly reportViewerService: ReportViewerService,
    private readonly advanceReportingService: AdvanceReportingService,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService) { }

  public ngOnChanges(changes: SimpleChanges): void {
    const ruleObjectId = changes?.stateDataObject?.currentValue?.storedselectedRule?.ruleObjectId;
    // Check if already a rule exist that can be applied
    if (ruleObjectId?.length > 0) {
      const objectId = ruleObjectId;
      // search for the existing rule in the new application rules
      const changedRule = changes?.applicationRules?.currentValue.filter(data => data.Nodes[0].ObjectId === objectId)[0];
      if (changedRule && this.selectedRuleInfo !== changedRule) {
        this.selectedRuleInfo = changedRule;
      } else { // If the rule is not found in the application rules, apply the first rule from the list.
        this.selectedRuleInfo = this.applicationRules[0];
      }
    } else { // If the there's no existing rule that can be applied, apply the first rule from the list.
      this.selectedRuleInfo = this.applicationRules[0];
    }
    this.parameterDialog(this.selectedRuleInfo);
    this.saveCurrentState();
  }
  
  public ngOnInit(): void {
    this.getTranslations();
  }

  public trackByFn(index, item): string {
    return index + item.ItemDescriptor; // or item.id
  }

  public viewRuleselectionChanged(event: any): void {
    if (this.subscriptions?.length) {
      this.subscriptions.forEach((subscription: Subscription) => {
        subscription?.unsubscribe();
      });
    }
    const selectedRule = this.applicationRules[event.target.selectedIndex];
    this.parameterDialog(selectedRule);
    this.saveCurrentState();
  }

  public parameterDialog(selectedRule): void {
    this.selectedRuleInfo = selectedRule;
    if (this.rules) {
      this.rules.nativeElement.disabled = true;
    }
    this.paramterRelatedInfo.parametersLoading = true;
    this.paramterRelatedInfo.rptdesign = undefined;
    const objectId = selectedRule.Nodes[0].ObjectId;
    this.reportViewerService.reportPreviewLoading.next(true);
    // object for handling history call independent of get parameter list
    this.paramterRelatedInfo = this.createParameterHandleInfo(true, null,
      null, selectedRule.Nodes[0].ObjectId, this.selectedObject.Designation, undefined);

    // to get history based on info passed in observable
    this.reportViewerService.paramatersRelatedInfo.next(this.paramterRelatedInfo);
    const propertyValSubscriptions: Subscription = this.propertyValuesService.readPropertiesAndValue(objectId, true).subscribe(
      { next: data => {
        for (const dataVal of data.Properties) {
          if (dataVal.PropertyName == 'Parameters.ParamValue') {
            this.rptDesign = dataVal.Value.Value.substring(1, dataVal.Value.Value.length - 1).split(',');
            const index = this.rptDesign.findIndex(x => x.includes('.rptdesign'));
            if (this.rptDesign[index]) {
              this.rptDesign = this.rptDesign[index]?.substring(1, this.rptDesign[index].length - 1);
            }            
          }
        }
        if (this.rptDesign.includes('.rptdesign')) {
          this.childToParent.emit(this.rptDesign);
          const paramDetailsSubscriptions: Subscription = this.advanceReportingService.getParameterDetailsJson(this.systemId,
            this.rptDesign, this.selectedObject.Designation).subscribe(
            { next: (res: ParameterDetails) => {
              this.reportViewerService.reportPreviewLoading.next(false);
              if (this.rules) {
                this.rules.nativeElement.disabled = false;
              }
              this.paramterRelatedInfo = this.createParameterHandleInfo(false, res.parameters,
                selectedRule.ItemDescriptor, selectedRule.Nodes[0].ObjectId, this.selectedObject.Designation, this.rptDesign);
              this.reportViewerService.paramatersRelatedInfo.next(this.paramterRelatedInfo);
              paramDetailsSubscriptions.unsubscribe();
            }, error: err => {
              this.reportViewerService.reportPreviewLoading.next(false);
              if (this.rules) {
                this.rules.nativeElement.disabled = false;
              }
              this.paramterRelatedInfo = this.createParameterHandleInfo(false, null, null, null, null, undefined);

              this.reportViewerService.paramatersRelatedInfo.next(this.paramterRelatedInfo);
              this.toastNotificationService.queueToastNotification('danger', this.getToastMessage(err), this.errorMsgDescription);
              paramDetailsSubscriptions.unsubscribe();
              this.traceService.warn('apllication-rules', `error occured at getParameterDetailsJson ${err}`);
            }
            }
          );
        } else {
          this.reportViewerService.reportPreviewLoading.next(false);
          this.paramterRelatedInfo = this.createParameterHandleInfo(false, null, null, null, null, undefined);

          if (this.rules) {
            this.rules.nativeElement.disabled = false;
          }
          this.reportViewerService.paramatersRelatedInfo.next(this.paramterRelatedInfo);
        }
        propertyValSubscriptions.unsubscribe();
      },
      error: err => {
        this.reportViewerService.reportPreviewLoading.next(false);
        this.paramterRelatedInfo = this.createParameterHandleInfo(false, null, null, null, null, undefined);
        if (this.rules) {
          this.rules.nativeElement.disabled = false;
        }
        this.reportViewerService.paramatersRelatedInfo.next(this.paramterRelatedInfo);
        propertyValSubscriptions.unsubscribe();
        this.traceService.warn('apllication-rules', `error occured at readPropertiesAndValue ${err}`);
      }
      });
  }

  public createParameterHandleInfo(parametersLoading, parameterMetaData, selectedRule, ruleObjectId, selectionContext, rptdesign): ParameterRelatedInfo {
    return {
      parametersLoading,
      parameterMetaData,
      selectedRule,
      ruleObjectId,
      selectionContext,
      rptdesign
    };
  }

  public ngOnDestroy(): void {
    this.traceService.info('apllication-rules', `ngOnDestroy() called`);
    // Unsubscribe i18n text subscriptions
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
  }

  public saveCurrentState(): void {
    const val: SelectedRuleDetails = {
      'ruleObjectId': this.paramterRelatedInfo.ruleObjectId,
      'selectionContext': this.paramterRelatedInfo.selectionContext
    };
    this.savedSelectedRule.emit(val);
  }

  public getTranslations(): void {
    this.subscriptions.push(this.translateService.get([
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_INVALID_INPUT',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR_MESSAGE',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR_MESSAGE',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED_MESSAGE',
      'REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_MAIN_URL_MESSAGE'
    ]).subscribe(values => {
      this.invalid_inputError = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_INVALID_INPUT'];
      this.failureErrorTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR'];
      this.failureErrorMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_FAILURE_ERROR_MESSAGE'];
      this.service_unavailableErrorTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR'];
      this.service_unavailableErrorMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_SERVICE_UNAVAILABLE_ERROR_MESSAGE'];
      this.advancedReportingConfigurationFailedTitle = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED'];
      this.advancedReportingConfigurationFailedMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_FAILED_MESSAGE'];
      this.mainUrlUnavailableMsg = values['REPORT-VIEWER.ERROR_MESSAGES.ADVANCEREPORTING_CONFIGURATION_MAIN_URL_MESSAGE'];

    }));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public getToastMessage(err) {
    let errorMsg;
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

}
