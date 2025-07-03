import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList,
  TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { Control, EditableTableResult, Language, LanguageInfo, TextGroupListInfo } from '../../view-model/storage-vm';
import { DatatableComponent, TableColumn } from '@siemens/ngx-datatable';
import { SelectOption } from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable';
import { debounceTime, Subject, Subscription, takeWhile } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ColHeaderData } from '../../../events/event-data.model';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { AssistedTreatmentService, LanguageService, LogViewerServiceBase,
  Step, SystemsProxyService, WSIProcedure, WSIStep } from '@gms-flex/services';
import { ReportViewerService } from '../../services/report-viewer.service';

enum DefaultColumns {
  CreationDate = 'CreationDate',
  User = 'User',
  ManagementStation = 'ManagementStation',
  Comment = 'Comment'
}
@Component({
  selector: 'gms-editable-controls',
  templateUrl: './editable-controls.component.html',
  styleUrl: './editable-controls.component.css',
  standalone: false
})
export class EditableControlsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() public editableControlData: Control[];
  @Input() public selectedEventOPId: string;
  @Input() public procedureStepType: string;
  @Input() public selectedObjectSystemId: number;
  @Input() public reportDefinitionId: string;
  @Input() public updatedStepData: any;
  @Input() public fetchedTableData: Map<number, EditableTableResult[]> = new Map<number, EditableTableResult[]>();
  @Input() public isEditable = new Map<number, any[]>();
  @Output() public readonly saveTreatmentFormEvent = new EventEmitter<string>();

  @ViewChild(DatatableComponent) public table!: DatatableComponent;
  @ViewChildren('input') public tableRows: QueryList<ElementRef>;
  @ViewChild('addBtnHeaderCellTemplate', { static: true })

  public focusedRow: number;
  public addBtnHeaderCellTemplate!: TemplateRef<any>;
  public rows: any[];
  public columns!: TableColumn[];
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public rowData = [{
    'CreationDate': '',
    'User': '',
    'MamnagementStation': '',
    'Comment': ''
  }];
  public listOfText: string[] = [];
  public inputTextChange = '';
  public updatedColumns: ColHeaderData[] = [];
  public creationDateLabel = '';
  public userLabel = '';
  public managementSationLabel = '';
  public commentLabel = '';
  public userName = '';
  public editableFieldlLabel = '';
  public commentTablelabel = '';
  public customSelectionLabel = '';
  public textGroupLabel = '';
  public tabularRowHeight = 300;
  public updatedProcedureData: WSIProcedure;
  public customTextList: any[] = [];
  public textGroupOptions: SelectOption[] = [];
  public textFieldData = [];
  public langArrayIndexValue = 0;
  public defaultLanguage: Language;
  public systemLanguages: LanguageInfo[];
  public isChangeInRuntimeStatus: boolean;

  // Declare subscription variables
  public defaultLanguageSubscription;
  public systemLanguagesSubscription;
  public getTextGroupSelectionSubscription;
  public highlightSubscription;
  public controlListItem = '';
  private fetchedFrmSnapId: string;
  private readonly subscriptions: Subscription[] = [];
  private readonly commentSubject = new Subject<{ controlId: string, rowIndex: number }>();

  constructor(private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly assistedTreatmentService: AssistedTreatmentService,
    private readonly traceService: TraceService,
    private readonly logViewerService: LogViewerServiceBase,
    private readonly languageService: LanguageService,
    private readonly systemsProxyService: SystemsProxyService,
    private readonly reportViewerService: ReportViewerService) {
  }

  public ngOnInit(): void {
    this.getTransalationsForForm();
    this.userName = this?.appContextService?.userNameValue;
 
    // call to get existing OP
    this.getSystemLanguageInfo();
    this.reportViewerService.isSpinnerInEditableControl.next(true);
    
    this.commentSubject.pipe(
      debounceTime(1000) 
    ).subscribe(({ controlId, rowIndex }) => {
      this.addComment(controlId, rowIndex);
    });
  }
  
  public ngAfterViewInit(): void {
    this.highlightSubscription = this.tableRows.changes.subscribe(() => {
      this.tableRows.toArray()[this.focusedRow].nativeElement.focus();
    })
  }

  public getSystemLanguageInfo(): void {
    this.defaultLanguageSubscription = this.languageService.getUserLanguage().subscribe((language: Language) => {
      this.defaultLanguage = {
        Descriptor: language?.Descriptor,
        Code: language?.Code
      };
      this.systemLanguagesSubscription = this.systemsProxyService.getSystemLanguages().subscribe((systemLanguage: LanguageInfo[]) => {
        if (!this.systemLanguages) {
          this.systemLanguages = [...systemLanguage];
        }
        this.getTextGroupSelectionList();
      });
    });
  }

  public getTextGroupSelectionList(): void {
    this.editableControlData?.forEach(element => {
      if (element.ControlName === 'ElementTextGroup') {
        if (element.TextGroupName !== undefined) {
          this.systemLanguages.forEach(langCode => {
            if (langCode?.Code === this.defaultLanguage?.Code) {
              this.langArrayIndexValue = langCode.ArrayIndex;
            }
          });
          this.getTextGroupSelectionSubscription = this.logViewerService.getTextGroupSelection(this.selectedObjectSystemId, element.TextGroupName).subscribe(
            { next: data => {
              element.TextGroupList = [...data];
            }, error: err => {
            }
            }
          );
        } else {
          element.TextGroupList = []; // If there is no values to select from dropdown of text group selection
        }
      }
      if (!element?.List) {
        element.List = { Id: element.ControlId, Name: '' }; // To handle case, if no preselected value is present in control.
      }
    });
  }

  public addTextInOption(): void {
    this.listOfText.push(this.inputTextChange);
  }

  public trackByIndex = (index: number): number => index;

  public deleteComment(tableKey, rowdata: EditableTableResult): void {
    const tableData = this.fetchedTableData.get(tableKey);
    const tempTableData = tableData;
    const toBeindex = tempTableData.findIndex(row => row.Comment == rowdata.Comment);
    tempTableData.splice(toBeindex, 1);
    if (tempTableData.length == 0) {
      tempTableData.push({
        'CreationDate': '',
        'User': '',
        'MamnagementStation': '',
        'Comment': ''
      });
    }
    this.fetchedTableData.set(tableKey, [...tempTableData]);
    // when any row is deleted, Send to output should be disabled as there is change in table data.
    // Save button will get enabled and require to save the form first by user. 
    this.isChangeInRuntimeStatus = true;
    this.reportViewerService.validateTreatmentForm(this.editableControlData, this.fetchedTableData, this.isChangeInRuntimeStatus);
  }

  public addCommentWithDebounce(controlId: string, rowIndex: number): void {
    // Emit the event to the subject
    this.commentSubject.next({ controlId, rowIndex });
  }
  
  public addComment(tableKey, rowIndex): void {
    const table = this.fetchedTableData.get(tableKey);
    const temp = table[rowIndex];
    if (temp.Comment !== '' && temp.MamnagementStation === '') {
      temp.CreationDate = this.reportViewerService.newDateToLocaleFormat(temp.CreationDate);
      temp.User = this?.appContextService?.userNameValue;
      temp.MamnagementStation = '_#WEBCLIENT#_';
    } 

    this.fetchedTableData.set(tableKey, [...table]);
    this.reportViewerService.validateTreatmentForm(this.editableControlData, this.fetchedTableData);
    this.focusedRow = rowIndex;
  }

  public addNewRow(controlId: number): void {
    this.reportViewerService.addNewRow(controlId, this.editableControlData, this.fetchedTableData);
  }

  public validateTreatmentForm(): void {
    this.isChangeInRuntimeStatus = true;
    this.reportViewerService.validateTreatmentForm(this.editableControlData, this.fetchedTableData, this.isChangeInRuntimeStatus);
  }

  public onSelectionChange(event: string, controlId: number): void {
    this.editableControlData?.forEach(element => {
      if (element.ControlId === controlId) {
        element.List = { 'Id': controlId, 'Name': event }; // element.List will never be undefined, so no undefined check
      }
    });
    this.isChangeInRuntimeStatus = true;
    this.reportViewerService.validateTreatmentForm(this.editableControlData, this.fetchedTableData, this.isChangeInRuntimeStatus)
  }

  public saveTreatmentForm(): void {
    this.createXMLFromTreatmentForm();
  }

  public ngOnDestroy(): void {
    if (this.defaultLanguageSubscription) {
      this.defaultLanguageSubscription.unsubscribe();
    }
    if (this.systemLanguagesSubscription) {
      this.systemLanguagesSubscription.unsubscribe();
    }
    if (this.getTextGroupSelectionSubscription) {
      this.getTextGroupSelectionSubscription.unsubscribe();
    }
    if (this.highlightSubscription) {
      this.highlightSubscription.unsubscribe();
    }
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });
    this.reportViewerService.isSpinnerInEditableControl.next(false);
  }
  
  private createXMLFromTreatmentForm(): void {
    const xmlDoc = document.implementation.createDocument(null, 'FrmCnt', null);
    this.editableControlData.forEach(control => {
      // set new attribute
      if (!this.fetchedFrmSnapId) {
        this.fetchedFrmSnapId = `Rtd-${this.reportDefinitionId}-Time-${new Date().toUTCString()}`;
      }

      xmlDoc.documentElement.setAttribute('FrmSnapId', this.fetchedFrmSnapId); // not working as of now
      // get node name of main node  xmlDoc2.getElementsByTagName('FrmCnt')[0].nodeName
      if (control.ControlName === 'ElementEditableTextField') {
        const textFieldData = control?.List;
        if (textFieldData) {
          const ElmTextFld = xmlDoc.createElement('ElmTextFld');
          // set the  attribute of the  element
          ElmTextFld.setAttribute('ElmId', control.ControlId.toString());
          ElmTextFld.setAttribute('ElmData', textFieldData?.Name);
          xmlDoc.documentElement.appendChild(ElmTextFld);
        }
      }
      if (control.ControlName === 'ElementTextGroup') {
        const selectexdText = control?.List;
        if (selectexdText) {
          const ElmTxtSel = xmlDoc.createElement('ElmTxtSel');
          ElmTxtSel.setAttribute('ElmId', control.ControlId.toString());
          const MLTxt = xmlDoc.createElement('MLTxt');

          // to set attribute with selected option for all available languages
          let textGroupItemInfo: TextGroupListInfo;
          if (this.systemLanguages.length) {
            textGroupItemInfo = control.TextGroupList.find((textGroupItem: TextGroupListInfo) => 
              textGroupItem.LangText?.find(itemLanguageText => itemLanguageText === selectexdText?.Name));
            this.systemLanguages.forEach(language => {
              textGroupItemInfo.LangText.forEach((value, index) => {
                if (index === language.ArrayIndex) {
                  MLTxt.setAttribute(language.Code, value.toString());
                }
              });
            })
          } 
          ElmTxtSel.appendChild(MLTxt);
          xmlDoc.documentElement.appendChild(ElmTxtSel);
        }
      }
      if (control.ControlName === 'ElementComboBox') {
        const textGroupOpt = control?.List;
        if (textGroupOpt) {
          const ElmCusSel = xmlDoc.createElement('ElmCusSel');
          ElmCusSel.setAttribute('ElmId', control.ControlId.toString());
          const MLTxt = xmlDoc.createElement('MLTxt');

          // to set attribute with selected option for all available languages
          if (this.systemLanguages.length) {
            const CustomTextItem = control.Contents.find(x => x[this.defaultLanguage.Code] === textGroupOpt?.Name);
            for (const [key, value] of Object.entries(CustomTextItem)) {
              MLTxt.setAttribute(key, value.toString());
            }
          } 
          ElmCusSel.appendChild(MLTxt);
          xmlDoc.documentElement.appendChild(ElmCusSel);
        }
      }
      if (control.ControlName === 'ElementCommentTable') {
        // we need to itrate table object for rows data
        const table = this.fetchedTableData.get(control.ControlId);
        const ElmComTbl = xmlDoc.createElement('ElmComTbl');
        const ElmData = xmlDoc.createElement('ElmData');
        table?.forEach(row => {
          if (row.CreationDate !== '') {
            const CmntTblDtRw = xmlDoc.createElement('CmntTblDtRw');
            ElmComTbl.setAttribute('ElmId', control.ControlId.toString());
            CmntTblDtRw.setAttribute('DtTime', row.CreationDate);
            CmntTblDtRw.setAttribute('Usr', row.User);
            CmntTblDtRw.setAttribute('WkStion', row.MamnagementStation);
            CmntTblDtRw.setAttribute('Comm', row.Comment);
            CmntTblDtRw.setAttribute('DtWithSpeFrmt', this.createDateWithSpeFrmt(row.CreationDate));
            ElmData.appendChild(CmntTblDtRw);
          }
        });
        ElmComTbl.appendChild(ElmData);
        xmlDoc.documentElement.appendChild(ElmComTbl);
      }
    });
    // convert document to string
    const xmlString = new XMLSerializer().serializeToString(xmlDoc);
    this.saveTreatmentFormEvent.emit(xmlString);
    this.saveTreatmentFormData(xmlString);
  }

  private saveTreatmentFormData(xmlString: string): void {
    const updatedStep: Step = new Step();
    updatedStep.automaticDPE = this.updatedStepData?.AutomaticDPE;
    updatedStep.attributes = this.updatedStepData?.Attributes;
    updatedStep.fixedLink = this.updatedStepData?.FixedLink;
    updatedStep.hasConfirmedExecution = this.updatedStepData?.HasConfirmedExecution;
    updatedStep.isCompleted = this.updatedStepData?.IsCompleted;
    updatedStep.managedType = this.updatedStepData.ManagedType;
    updatedStep.runtimeStatus = xmlString;
    updatedStep.status = this.updatedStepData.Status;
    updatedStep.stepId = this.updatedStepData.StepId;
    updatedStep.stepName = this.updatedStepData.StepName;

    this.assistedTreatmentService.updateStep(this.selectedEventOPId, updatedStep);
  }

  private initTableColumnHeaders(): void {
    for (const column in DefaultColumns) {
      if (isNaN(Number(column))) {
        if (column === DefaultColumns.CreationDate) {
          this.createDefaultColumnHeaderData(column, this.creationDateLabel);
        } else if (column === DefaultColumns.User) {
          this.createDefaultColumnHeaderData(column, this.userLabel);
        } else if (column === DefaultColumns.ManagementStation) {
          this.createDefaultColumnHeaderData(column, this.managementSationLabel);
        } else {
          this.createDefaultColumnHeaderData(column, this.commentLabel);
        }
      }
    }
  }

  // Creating Column Header Data
  private createDefaultColumnHeaderData(prop: string, label: string): void {

    const columnDef: ColHeaderData = {
      id: prop,
      title: label,
      visible: true,
      draggable: true,
      disabled: true
    };
    this.updatedColumns.push(columnDef);
  }

  /**
   * This method initializes the table columns
   */
  private getTransalationsForForm(): void {
    const messageKeys: string[] = [
      'REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_CREATION_DATE_LABEL',
      'REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_USER_LABEL',
      'REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_MANAGEMENT_STATION_LABEL',
      'REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_COMMENT_LABEL',
      'REPORT-VIEWER.ASSISTED_TREATMENT.ENTER_EDITABLE_FIELD',
      'REPORT-VIEWER.ASSISTED_TREATMENT.ENTER_COMMENTS_TABLE',
      'REPORT-VIEWER.ASSISTED_TREATMENT.SELECT_CUSTOM_GROUP_SELECTION',
      'REPORT-VIEWER.ASSISTED_TREATMENT.SELECT_TEXT_GROUP_SELECTION'
    ];
    this.subscriptions.push(this.translateService.get(messageKeys).subscribe(values => {
      this.creationDateLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_CREATION_DATE_LABEL'];
      this.userLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_USER_LABEL'];
      this.managementSationLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_MANAGEMENT_STATION_LABEL'];
      this.commentLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.COLUMN_COMMENT_LABEL'];
      this.editableFieldlLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.ENTER_EDITABLE_FIELD'];
      this.commentTablelabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.ENTER_COMMENTS_TABLE'];
      this.customSelectionLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.SELECT_CUSTOM_GROUP_SELECTION'];
      this.textGroupLabel = values['REPORT-VIEWER.ASSISTED_TREATMENT.SELECT_TEXT_GROUP_SELECTION'];
      this.initTableColumnHeaders();
    }));
  }

  private createDateWithSpeFrmt(dateTime: string): string {
    // Expected date should be in format -  "DD.MM.YYYY HH:MM:SS"
    // Hence the below conversion
    let dateWithSpecFrmt = '';

    const browserCulture = this.translateService.getBrowserLang();
    // expected culture to store specific date 
    const cultureForSpecificFrmt = 'de-DE';
    // format options for specific date
    const dateTimeFormatOptions: Intl.DateTimeFormatOptions = 
    { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" };

    if (browserCulture === 'de') {
      // Convert DD.MM.YYYY HH:MM:SS to locale specifice format date
      const dateTimeArray = dateTime.split(/,/g);
      const [day, month, year] = dateTimeArray[0].split(".");
      dateTime = month + "." + day + "." + year;
    }
    dateWithSpecFrmt = new Date(dateTime)?.toLocaleString(cultureForSpecificFrmt, dateTimeFormatOptions).replace(/,/g, "");
    return dateWithSpecFrmt;
  }

}
