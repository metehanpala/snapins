import { GmsMessageData, ParametersMetaData, RelatedItemsRepresentation, ReportDocumentData } from '@gms-flex/services';

// This is duplicate interface created. This is bad practice of coding. We should try in future to remove it
export interface StateData {
  path?: string;
  index?: number;
  lastShownDocumentData?: ReportDocumentData;
  scrollTop?: number;
  scrollLeft?: number;
  skip?: number; // the skip for tiles view.
  tilesScrollTop?: number;
  zoomFactor?: number;
  zoomSetting?: number | string | undefined;
  page?: number;
  searchString?: string;
  designation: string;
  storedselectedRule?: SelectedRuleDetails;
  showReportHistory?: ShowReportHistory;
  setActiveReport?: SetActiveReport;
  scrollPosition?: number;
  relatedItems?: RelatedItemsRepresentation[];
  messageData?: GmsMessageData;
  expandedRow?: number[];
  multipleHistoryRowSelectionMap?: Map<string, MultipleHistoryRowSelectionMapData>;
}

export interface MultipleHistoryRowSelectionMapData {
  selectedChildNames: string[];
  parentName: string;
  isDocumentParent: boolean;
}

export interface SelectedRuleDetails {
  ruleObjectId: string;
  selectionContext: string;
}

export interface ShowReportHistory {
  documentData: ReportDocumentData;
  isManualSelection: boolean;
}
export interface SetActiveReport {
  execId: string;
  displayName: string;
  isParent: boolean;
}

export interface EditableTableResult {
  CreationDate: string;
  User: string;
  MamnagementStation: string;
  Comment: string;
}

export interface ParameterRelatedInfo {
  parametersLoading: boolean;
  parameterMetaData: ParametersMetaData[];
  selectedRule: string;
  ruleObjectId: string;
  selectionContext: string;
  rptdesign: string;
}
export interface Control {
  ControlId: number;
  ControlName: string;
  AssociatedElementId: number;
  AssociatedContentDefinitionId: string;
  ViewElement: boolean;
  TextGroupName: string;
  TextGroupList?: TextGroupListInfo[];
  Contents?: [];
  List?: Item;
}

export interface Item {
  Id: number;
  Name: string;
}

export interface TextGroupListInfo {
  Value: number;
  LangText: string[];
}

export interface LanguageInfo {
  ArrayIndex: number;
  Descriptor: string;
  Code: string;
}
export interface Language {
  Descriptor: string;
  Code: string;
}
