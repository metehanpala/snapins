import { ColHeaderData } from '../../events/event-data.model';
import { LogViewResult, RowDetailsDescription, SortColumnData, ViewNode } from '@gms-flex/services';
import { TableColumnProp } from '@siemens/ngx-datatable';
import { MenuItem, SearchCriteria } from '@simpl/element-ng';

export class GridHeaderData {
  public dateTime?: string;
  public recordKind?: string;
  public sourceDescription?: string;
  public eventCategory?: string;
}

export class SearchOperators {
  constructor(operators: string[]) {
    this.operators = operators;
  }
  public operators: string[];
}

export type SearchOperatorsMap = Map<string, SearchOperators>;

export interface CustomDialog {
  primaryActions?: MenuItem[];
  secondaryActions?: MenuItem[];
}

export interface MasterDetailContainerSettings {
  masterDataContinerSize?: number;
  colSettings?: ColumnSettings[];
  tableWidth?: number;
  columnHeaderData?: ColHeaderData[];
}

export interface ColumnSettings {
  id?: TableColumnProp;
  width?: number;
}

export interface ScrollData {
  offsetY: number;
  firstTime?: boolean;
}
export interface ILogViewerObj {
  [key: string]: string;
}

export interface SendSelectionForHistoryLogs {
  designation: string,
  alertId: string,
  recordType: string,
  internalName: string,
  pageSize: number,
}

export interface LogViewerRetainState {
  appliedFilterCriteria?: SearchCriteria;
  selectedCriteriaOptions?: SearchCriteria;
  joinedFilters?: string;
  selectedRows?: LogViewResult[];
  sortedColumns?: SortColumnData;
  scrollOffsetY?: number;
  snapShotId?: string;
  selectedRowIndex?: number;
  selectedRowPageNumber?: number;
  selectedRowDetailsData?: RowDetailsDescription;
  hideShowVeryDetailPane?: boolean;
  detailPaneScrollPosition?: number;
  detailPaneScrollLeft?: number;
  totalElements?: number;
  newSnapshotCreated?: boolean;
  activityEnums?: Map<string, ActivityOriginalEnumValues>;
  historylogsactivityEnums?: Map<string, ActivityOriginalEnumValues>;
}

export interface WarningMessageContent {
  isToShowWarningMessage: boolean;
  viewSize?: number;
}

export interface PaneControls {
  noOfControls: number;
  noOfSections: number;
}

export interface SelectionDetail {
  internalName: string;
  ruleName: string;
}

export class ActivityOriginalEnumValues {
  public enum: string[];
  public tag: string[];
  constructor(enumP: string[], tagP: string[]) {
    this.enum = enumP;
    this.tag = tagP;
  }
}

export interface SystemViewNode {
  views: ViewNode[];
  IsDistributed: boolean;

}
