import { BrowserObject, CreateDocumentData, DocumentTypes, ReportDocumentData,
  ReportExecutionStatus, ReportHistoryData, ReportHistoryResult,
  ReportStartResult, ServiceRequestInfo } from '@gms-flex/services';
import { Observable, of } from 'rxjs';
import { StateData } from '../view-model/storage-vm';

export class TranslateServiceStub {

  public get(key: any): Observable<any> {
    return of(key);
  }

  public get onLangChange(): Observable<any> {
    return of({ lang: 'en' });
  }
  public getBrowserLang(): string {
    return 'en';
  }
  public setDefaultLang(value: string): void {

  }
}

export const attributes: any = {
  /** WSI response is contradicting with camel case hence need to suspend this rule. */
  /* eslint-disable @typescript-eslint/naming-convention */
  DefaultProperty: 'LastRuntime',
  DisciplineDescriptor: 'Management System',
  DisciplineId: 0,
  ManagedType: 13,
  ManagedTypeName: 'ReportDefinition',
  ObjectId: 'System1:59deb757_8339_462c_8097_f8c33bf38546',
  ObjectModelName: 'GMS_ReportDefinition',
  SubDisciplineDescriptor: 'Unassigned',
  SubDisciplineId: 0,
  SubTypeDescriptor: 'Unassigned',
  SubTypeId: 0,
  TypeDescriptor: 'Report',
  TypeId: 6200
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const mockObject: BrowserObject = {
  /** WSI response is contradicting with camel case hence need to suspend this rule. */
  /* eslint-disable @typescript-eslint/naming-convention */
  Attributes: attributes,
  Descriptor: 'Event Report',
  Designation: 'System1.ApplicationView:ApplicationView.Reports.Event.EventReport',
  HasChild: false,
  Name: 'EventReport',
  Location: 'System1.Application View:Applications.Reports.Event.Event Report',
  ObjectId: 'System1:59deb757_8339_462c_8097_f8c33bf38546',
  SystemId: 1,
  ViewId: 10,
  ViewType: 1
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const mockReportHistoryData: ReportHistoryData = {
  /* eslint-disable @typescript-eslint/naming-convention */
  PdfPageSize: 5,
  ReportExecutionDisplayName: 'testReport',
  ReportExecutionDateTime: '7/8/2022 2:15:26 PM',
  ReportExecutionStatus: ReportExecutionStatus.Succeeded,
  ReportExecutionId: 'ae36b128-bb5a-42d1-ae73-9a53925f7d75-08072022141524419',
  ReportDocumentData: [{
    DocumentDisplayName: 'testReport_2022-07-08_19-45-32-129_1.Pdf',
    DocumentPath: 'FlexReports/testReport_2022-07-08_19-45-32-129_1.Pdf',
    DocumentStatus: 'Succeeded',
    DocumentType: DocumentTypes.Pdf
  }]
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const mockServiceReqInfoObject: ServiceRequestInfo = {
  /* eslint-disable @typescript-eslint/naming-convention */
  IsConnected: true,
  ServiceId: 1,
  SystemId: 1
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const mockGetReportHistoryResponse: ReportHistoryResult = {
  /* eslint-disable @typescript-eslint/naming-convention */
  ErrorInfo: '',
  Result: [mockReportHistoryData],
  ReportSubscriptionAdditionalValues: {
    ContextTypeOrNameFilter: undefined,
    ReportDefinitionId: '59deb757-8339-462c-8097-f8c33bf38546-26082022112722790'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const mockReportStartExecutionResult: ReportStartResult = {
  /* eslint-disable @typescript-eslint/naming-convention */
  ErrorInfo: '',
  ReportExecutionId: '59deb757-8339-462c-8097-f8c33bf38546-26082022112722790'
  /* eslint-enable @typescript-eslint/naming-convention */
};

export const mockReportDocumentData: ReportDocumentData = {
  /* eslint-disable @typescript-eslint/naming-convention */
  DocumentDisplayName: 'testReport_2022-07-08_19-45-32-129_1.Pdf',
  DocumentPath: 'FlexReports/testReport_2022-07-08_19-45-32-129_1.Pdf',
  DocumentStatus: 'Succeeded',
  DocumentType: DocumentTypes.Pdf
};

export const mockCreateDocumentData: CreateDocumentData = {
  SystemId: 1,
  ReportExecutionParams: undefined
};
/* eslint-enable @typescript-eslint/naming-convention */

export const mockStoreObject: StateData = {
  /* eslint-disable @typescript-eslint/naming-convention */
  path: '',
  index: 1,
  lastShownDocumentData: mockReportDocumentData,
  scrollTop: 180,
  scrollLeft: 200,
  zoomFactor: 40,
  zoomSetting: 1,
  page: 1,
  searchString: '',
  designation: ''
  /* eslint-enable @typescript-eslint/naming-convention */
};
