/* eslint-disable */
import { Injectable, OnDestroy } from '@angular/core';
import {
  AppRightsService,
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  CreateDocumentData,
  DeleteDocumentData,
  LanguageService,
  LicenseOptionsService,
  Page,
  ReportDeleteResult,
  ReportDocumentData,
  ReportExecutionStatus,
  ReportHistoryData,
  ReportHistoryResult,
  ReportServiceBase,
  ReportStartResult,
  ReportSubscriptionServiceBase,
  ReportUrl,
  ServiceRequestSubscriptionModel,
  SystemBrowserService,
  SystemsServicesServiceBase,
  ViewNode,
  WSIProcedure,
} from '@gms-flex/services';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { SiToastNotificationService } from '@simpl/element-ng';
import { ServiceRequestInfo } from '@gms-flex/services';
import { Control, EditableTableResult, ParameterRelatedInfo } from '../view-model/storage-vm';
import { TranslateService } from '@ngx-translate/core';

export const ALARM_PRINTOUT_MANAGE_TYPE = 'OPStepAlarmPrintout';

const reportViewerSnapinId = 42;
const reportViewerShowOptId = 1344;

export declare class DocumentSearchRequest {
  public parameters: any;
  public searchWords: string;
}

@Injectable()
export class ReportViewerService implements OnDestroy {
  public selectedObject: BrowserObject;
  public objectTypeFilter = '{"2600":[2601]}';
  public reportTileSelectionSub: Subject<any> = new Subject<any>();
  public sendToOutputEvent: Subject<any> = new Subject<any>();
  public paramatersRelatedInfo: Subject<ParameterRelatedInfo> = new Subject<ParameterRelatedInfo>(); 
  public reportExecutionId: Subject<string> = new Subject<string>();
  public treatmentFormUpdateEvent: Subject<boolean> = new Subject<boolean>();
  public reportPreviewLoading : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isFormValid: Subject<{error: boolean; isChangeInRuntimeStatus: boolean}> = new Subject<{error: boolean; isChangeInRuntimeStatus: boolean}>();
  public isSpinnerInEditableControl: Subject<boolean> = new Subject<boolean>();
  public cnsValue: CnsLabel;
  public isSystemConnected = false;
  public loggedInLanguage : { Descriptor: string; Code: string; };
  private readonly _trModule = 'gmsSnapinsCommon_ReportViewerService';
  private systemServicesSub: Subscription = new Subscription();
  private wsiAPISubscriptions: Subscription = new Subscription();
  private wsiReportSubscriptions: Subscription = new Subscription();
  private _eventIdAndExecutationIdMap: Map<string,string> = new Map<string, string>();


  constructor(
    private readonly traceService: TraceService,
    public siToastService: SiToastNotificationService,
    private readonly cnsHelperService: CnsHelperService,
    private systemsServicesService: SystemsServicesServiceBase,
    private readonly reportSubscriptionNotification: ReportSubscriptionServiceBase,
    private readonly reportViewerServiceBase: ReportServiceBase,
    private readonly systemBrowserService: SystemBrowserService,
    private readonly appRightService: AppRightsService,
    private readonly licenseService: LicenseOptionsService,
    private readonly translateService: TranslateService,
    private readonly appContextService: AppContextService,
    private readonly languageService: LanguageService
  ) {

    if (this.cnsHelperService) {
      this.cnsHelperService.activeCnsLabel.subscribe(() => {
        if (!isNullOrUndefined(this.cnsHelperService.activeCnsLabelValue)) {
          this.cnsValue = this.cnsHelperService.activeCnsLabelValue;
        }
      });
    }

    // to get loggedin user language
    this.languageService.getUserLanguage().subscribe(language => {
      this.loggedInLanguage = {
        Descriptor: language?.Descriptor,
        Code: language?.Code
      };
    })

  }

  public ngOnDestroy(): void {
    this.unsubscribeSubscription();
    this.traceService.debug(this._trModule, 'Report viewer control service is destroyed');
  }

  public unsubscribeSubscription(): void {
    this.unsubscribeReportNotificationSubscriptions(0);
    this.disposeServicesSubscriptions();
  }

  public unsubscribeReportNotificationSubscriptions(systemId?: number, reportDefinitionId?: string) {
    this.wsiAPISubscriptions.unsubscribe();
    this.unSubscribeReportSubscriptionNotification(systemId, reportDefinitionId);
    this.wsiAPISubscriptions = new Subscription();
  }

  public unSubscribeReportSubscriptionNotification(systemId?: number,reportDefinitionId?: string): void {
    this.reportSubscriptionNotification.unsubscribeWsi(systemId, reportDefinitionId);
  }

  public setSelectedObject(selectedObject: BrowserObject): void {
    this.selectedObject = selectedObject;
  }

  public initializeServicesSubscriptions(systemIds: number[]): void {
    const reportManagerId = 58; // reportmanager id is default 58, if there is any change in value this need to be updated

    if (!this.isSystemConnected) {
      let serviceRequest: ServiceRequestSubscriptionModel[] = [];
      systemIds
        .forEach((systemId: number) => {
          serviceRequest.push({ SystemId: systemId, Ids: [reportManagerId] } as ServiceRequestSubscriptionModel);
        });

      this.systemServicesSub = this.systemsServicesService.subscribeSystemsServices(serviceRequest).subscribe(
        (serviceReqResponse) => {
          if (serviceReqResponse) {
            this.traceService.debug(this._trModule, 'Subscription to ReportManager status successful');
          } else {
            this.traceService.warn(this._trModule, 'Not able to subscribe ReportManager status');
          }
        },
        (err) => this.traceService.error(this._trModule, 'Error while subscribing to ReportManager status', err)
      );

      this.isSystemConnected = true;
    }

  }

  public disposeServicesSubscriptions(): Observable<boolean> {
    this.systemServicesSub.unsubscribe();
    this.isSystemConnected = false;
    return this.systemsServicesService.unSubscribeSystemsServices();
  }

  public serviceNotification() : Observable<ServiceRequestInfo> {
    return this.systemsServicesService.systemsNotification();
  }

  public subscribeWSIReport(systemId: number, reportDefinitionId: string, ReportExecutionId: string): void {
    const onlineSystemService: Subscription = this.reportSubscriptionNotification.subscribeReport(systemId,
      reportDefinitionId, ReportExecutionId).subscribe({
        next: val => this.traceService.debug(this._trModule, 'Report control, subscribeWSIReport received: ', val),
        error: err => this.traceService.error(this._trModule, `${err}`),
        complete: () => this.traceService.info(this._trModule, 'subscribeWSIReport complete ')
      });
    this.wsiAPISubscriptions.add(onlineSystemService);
  }

  public subscribeWSIReportNotification(): Observable<ReportHistoryResult> {
    const reportHistoryData: Observable<ReportHistoryResult> = new Observable<ReportHistoryResult>(observer => {
      this.wsiReportSubscriptions?.unsubscribe();
      this.wsiReportSubscriptions=this.reportSubscriptionNotification.reportNotification().subscribe({
        next: (value: ReportHistoryResult) => {
          observer.next(value);
        },
        error: (err) => {
          this.traceService.error(this._trModule, 'subscribeWSIReportNotification error: ', `${err}`);
          observer.next(err);
        },
        complete: () => this.traceService.info(this._trModule,'subscribeWSIReportNotification complete ')
      });
    });
    return reportHistoryData;
  }

  public subscribetoWSI(systemId: number, reportDefinitionId: string): void {
    this.wsiAPISubscriptions.add(this.reportSubscriptionNotification.subscribeWsi(systemId, reportDefinitionId).subscribe({
      next: val => this.traceService.info(this._trModule, 'Subscribe to Wsi value: ', val),
      error: err => this.traceService.error(this._trModule, `${err}`),
      complete: () => this.traceService.info(this._trModule, 'subscribetoWSI complete ')
    }));
  }

  public startReportExecution(createDocumentData: CreateDocumentData): Observable<ReportStartResult> {
    const reportStartResult: Observable<ReportStartResult> = new Observable<ReportStartResult>(observer => {
      this.wsiAPISubscriptions.add(this.reportViewerServiceBase.startReportExecution(createDocumentData).subscribe({
        next: (value: ReportStartResult) => {
          observer.next(value);
          observer.complete();
        },
        error: (err) => {
          this.traceService.error(this._trModule, 'startReportExecution error: ', `${err}`);
          observer.next(err);
          observer.complete()
        }
      }));
    });
    return reportStartResult;
  }

  public getReportHistory(systemId: number, reportId: string): Observable<any> {
    const reportHistory: Observable<any> = new Observable<any>(observer => {
      this.wsiAPISubscriptions.add(this.reportViewerServiceBase.getReportHistory(systemId, reportId).subscribe({
        next: (value: any) => {
          observer.next(value);
          observer.complete();
        },
        error: (err) => {
          this.traceService.error(this._trModule, 'getReportHistory error: ', `${err}`);
          observer.next(err);
          observer.complete();
      }
      }));
    });
    return reportHistory;
  }

  public getDocument(systemId: number, documentData: ReportDocumentData): Promise<ReportUrl> {
    return new Promise<ReportUrl>((resolve, reject) => {
      this.reportViewerServiceBase.getDocument(systemId, documentData).then(url => {
        resolve(url);
      });
    });
  }

  public cancelReportExecution(systemId: number, reportExecutionId: string, reportHistoryData: ReportHistoryData[]): void {
    const exec = reportHistoryData.find(data => data.ReportExecutionId === reportExecutionId);
    exec.ReportExecutionStatus = ReportExecutionStatus.Cancelling;
    this.wsiAPISubscriptions.add(this.reportViewerServiceBase.cancelReportExecution(systemId, reportExecutionId).subscribe(response => {
      if (response?.IsReportExecutionCancelled) {
        exec.ReportExecutionStatus = ReportExecutionStatus.Cancelled;
        // need to add a check whether there is a subscription exist for the provided reportExecutionId
        this.unsubscribeReport(reportExecutionId, systemId);
      }
    }));
  }

  public unsubscribeReport(reportExecutionId: string, systemId: number): void {
    this.reportSubscriptionNotification.unsubscribeReport(reportExecutionId, systemId);
  }

  public deleteReportDocuments(deleteDocumentData: DeleteDocumentData): Observable<ReportDeleteResult> {
    const documentDeleteResponse: Observable<ReportDeleteResult> = new Observable<ReportDeleteResult>(observer => {
      this.wsiAPISubscriptions.add(this.reportViewerServiceBase.deleteReportDocuments(deleteDocumentData).subscribe({
        next: (value: ReportDeleteResult) => {
          observer.next(value)
          observer.complete();
        },
        error: (err) => {
          this.traceService.error(this._trModule, 'deleteReportDocuments error: ', `${err}`);
          observer.next(err);
          observer.complete();
        }
      }));
    });
    return documentDeleteResponse;
  }

  public getSearchNode(systemId: number , nodeSearchString: string): Observable<Page> {
    const searchNode: Observable<Page> = new Observable<Page>(observer => {
      this.wsiAPISubscriptions.add(this.systemBrowserService.searchNodes(systemId, nodeSearchString).subscribe({
        next: (value: Page) => {
          observer.next(value);
          observer.complete();
        },
        error: (err) => {
          this.traceService.error(this._trModule, 'getSearchNode error: ', `${err}`);
          observer.next(err);
          observer.complete();
      }
      }));
    });
    return searchNode;
  }

  public getAllViews() : Observable<ViewNode[]> { // to extract all available systems in snapins
    return this.systemBrowserService.getViews(null);
  }

  public getExecutionIdFromMap(eventId: string): string {
    return this._eventIdAndExecutationIdMap.get(eventId);
  }

  public setEventIdAndExecutionIdMap(execId: string, eventId:string) {
    if (!this._eventIdAndExecutationIdMap.has(eventId)) {
      this._eventIdAndExecutationIdMap.set(eventId, execId);
    }
  }
  
  public getReportRights(): boolean {
    let appRights = false;
    const applicationRights = this.appRightService.getAppRights(reportViewerSnapinId);
    const appRightsAvailable = applicationRights?.Operations.find(appRight => appRight.Id === reportViewerShowOptId) ? true : false;

    const  licenseRights = this.licenseService.getLicenseOptionsRights('sbt_gms_opt_report');
    let licenseAvailable = false;
    if (!isNullOrUndefined(licenseRights)) {
      if (licenseRights.Available === -1) {
        licenseAvailable = true;
      } else {
        licenseAvailable = licenseRights.Required <= (licenseRights.Available);
      }
    }

    appRights = appRightsAvailable && licenseAvailable;

    return appRights;
  }

  public getRuntimeStatus(stepData,stepId: string, procedureStepType: string, editableControlData: Control[], fetchedTableData: Map<number, EditableTableResult[]>): WSIProcedure {
    let updatedStepData: WSIProcedure;
  
    stepData.forEach(step => {
      if (step?.ManagedType === procedureStepType && step?.StepId == stepId) {
        
        updatedStepData = step;
        if (step?.RuntimeStatus) {
          
          // Parse the XMl when we have prefilled data.
          this.getParsedXMl(step?.RuntimeStatus, editableControlData,fetchedTableData);
        } else {
          //// create the XMl when we do not have prefilled data.
          editableControlData.forEach(control => {
            if (control.ControlName === 'ElementCommentTable') {
              const table = [];
              //Pusing initial table if we dont have any prefilled data
              table.push({
                'CreationDate': '',
                'User': '',
                'MamnagementStation': '',
                'Comment': ''
              });
              fetchedTableData.set(control.ControlId, [...table]);
              control.List = undefined;

              // initial load of the treatment form
              this.addNewRow(control.ControlId, editableControlData, fetchedTableData, false);
            }
            //Filling Initial value in Editable text field if we dont have any prefilled data
            if (control.ControlName === 'ElementEditableTextField') {
              control.List = { Id: control.ControlId, Name: '' };
            }

            //Filling Initial value in text selection if we dont have any prefilled data
            if (control.ControlName === 'ElementTextGroup') {
              control.List = { Id: control.ControlId, Name: '' };
            }

            //Filling Initial value in text group selection if we dont have any prefilled data
            if (control.ControlName === 'ElementComboBox') {
              control.List = { Id: control.ControlId, Name: '' };
            }
          });

          // disable send to output button as there is no data present in any of the control
          this.validateTreatmentForm(editableControlData, fetchedTableData);
        }
      }
    });
    return updatedStepData;
  }

  public getParsedXMl(xmlString, editableControlData: Control[], fetchedTableData: Map<number, EditableTableResult[]>): void {
    
    let fetchedFrmSnapId: string;
    const parser = new DOMParser();
    
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const rootNode = xmlDoc.querySelector('FrmCnt');
    fetchedFrmSnapId = rootNode.getAttribute('FrmSnapId');
    
    editableControlData.forEach(control => {
      if (control.ControlName === 'ElementEditableTextField') {
        //  text field
        const abstracts = xmlDoc.querySelectorAll('ElmTextFld');
        if (abstracts.length !== 0) {
          abstracts.forEach(textNode => {
            if (textNode.getAttribute('ElmId') === control.ControlId.toString()) {
              control.List = { Id: control.ControlId, Name: textNode.getAttribute('ElmData') };
            }
          });
        }
      }
      if (control.ControlName === 'ElementTextGroup') {
        // custom text selection and text group selection
        const textSelection = xmlDoc.querySelectorAll('ElmTxtSel');
        textSelection.forEach(textElement => {
          if (textElement.getAttribute('ElmId') === control.ControlId.toString()) {
            const multiText = textElement.querySelector('MLTxt');
            control.List = { Id: control.ControlId, Name: multiText.getAttribute(this.loggedInLanguage?.Code) };
          }
        });
      }

      if (control.ControlName === 'ElementComboBox') {
        const textSelection = xmlDoc.querySelectorAll('ElmCusSel');
        textSelection.forEach(textElement => {
          if (textElement.getAttribute('ElmId') === control.ControlId.toString()) {
            const multiText = textElement.querySelector('MLTxt');
            control.List = { Id: control.ControlId, Name: multiText.getAttribute(this.loggedInLanguage?.Code) };
          }
        });
      }
      if (control.ControlName === 'ElementCommentTable') {
        // custom text selection and text group selection
        const tempArray = [];
        const tempEditableRows = [];
        const abstracts1 = xmlDoc.querySelectorAll('ElmComTbl');
        abstracts1.forEach(table => {
          if (table.getAttribute('ElmId') === control.ControlId.toString()) {
            const tableRows = table.querySelectorAll('CmntTblDtRw');
            if (tableRows.length !== 0) {
              tableRows.forEach(row => {
                tempArray.push({
                  'CreationDate': this.convertXMLDateToLocaleDate(row?.getAttribute('DtWithSpeFrmt')),
                  'User': row.getAttribute('Usr'),
                  'MamnagementStation': row.getAttribute('WkStion'),
                  'Comment': row.getAttribute('Comm')
                });
              });
            }
            tempArray.forEach(arr => {
              tempEditableRows.push({ isEdit: false });
            });
            fetchedTableData.set(control.ControlId, tempArray);
            this.addNewRow(control.ControlId, editableControlData, fetchedTableData, false);
          }
        });
      }
    });

    // validate complete form only once on initial load
    this.validateTreatmentForm(editableControlData, fetchedTableData);
  }

  
  public addNewRow(tableKey, editableControlData: Control[], fetchedTableData: Map<number, EditableTableResult[]>, validationReq = true): void {
    const table = fetchedTableData.get(tableKey);
    const temp = table.pop();
    if (temp.Comment !== '' && temp.MamnagementStation !== '') {
      table.push(temp);
      // pushing new row to table
      table.push({
        'CreationDate': '',
        'User': '',
        'MamnagementStation': '',
        'Comment': ''
      });
    } else {
      table.push(temp);
    }
    fetchedTableData.set(tableKey, [...table]);

    // form will not be validated when we are doing intial loading
    if (validationReq) {
      this.validateTreatmentForm(editableControlData, fetchedTableData);
    }    
  }

  public newDateToLocaleFormat(dateTime: string): string {
    let dateTimeFormatOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",minute: "2-digit", second: "2-digit" };
    // Use to forrmat the date when new comment added
    let browserCulture = this.translateService.getBrowserLang();
    return new Date().toLocaleString(browserCulture, dateTimeFormatOptions).replace(/,/g, "");
  }

  public convertXMLDateToLocaleDate(dateTime: string): string {
    // Always getting DD.MM.YYYY HH:MM:SS date format from saved OP
    // need to convert to browser local specific format
    let browserCulture = this.translateService.getBrowserLang();

    if (isNullOrUndefined(browserCulture)) {
      browserCulture = 'en-US';
    }
    // Convert DD.MM.YYYY HH:MM:SS to locale specifice format date
    const dateTimeArray = dateTime.split(/,/g);
    const [day, month, year] = dateTimeArray[0].split(".");
    dateTime = month + "." +  day + "." + year;
    // To create datetime option format
    let dateTimeFormatOptions: Intl.DateTimeFormatOptions = { year:"numeric",month:"2-digit", day:"2-digit", hour:"2-digit",minute:"2-digit", second:"2-digit" };

    return new Date(dateTime)?.toLocaleString(browserCulture, dateTimeFormatOptions).replace(/,/g, "");
  }
  
  public validateTreatmentForm(editableControlData: Control[], fetchedTableData: Map<number, EditableTableResult[]>, isChangeInRuntimeStatus=false): void {
    let error = false;
    for (const control of editableControlData) {
      if (control.ControlName === 'ElementEditableTextField' || control.ControlName === 'ElementTextGroup' || control.ControlName ==='ElementComboBox') {
        error = control.List?.Name ? false : true;
      }
       if (control.ControlName === 'ElementCommentTable') {
        const table = fetchedTableData.get(control.ControlId);
        if (table?.length == 0 || (table?.length === 1 && table?.find(x => x.Comment === '' || x.CreationDate === ''))) {
          error = true;
        } else {
          error = false;
        }
      }
      if (error) { 
        //When last row of table is deleted. Reset isChangeInRuntimeStatus with false.
        // It will validate based on invalid form data, which means form has error.
        isChangeInRuntimeStatus=false;
        break; }
    }
    // If error is true, it has error
    // If error is false, it does not have error
    this.isFormValid.next({error, isChangeInRuntimeStatus});
  }

  public updateFormatedDateInXML(xmlString: string): string {
    let parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Iterate datatable tags in xml and get table row
    // update date format to browser specific 
    const element = xmlDoc.querySelectorAll('ElmComTbl');
            element.forEach(table => {
                const tableRows = table.querySelectorAll('CmntTblDtRw');
                if (tableRows.length !== 0) {
                  tableRows.forEach(row => {
                    let formattedDtTime = this. convertXMLDateToLocaleDate( row?.getAttribute('DtWithSpeFrmt'));
                    row.setAttribute('DtTime', formattedDtTime);
                  });
                }
            });
    // Convert the updated DOM document back to a string
    var updatedXmlString = new XMLSerializer().serializeToString(xmlDoc);
    return updatedXmlString;
  }
}
