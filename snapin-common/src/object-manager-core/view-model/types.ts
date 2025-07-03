import { SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { CnsHelperService, SiIconMapperService, TablesServiceBase } from '@gms-flex/services';
import { AggregateViewId } from '../data-model/types';

export interface ViewFilter {
  viewIds?: AggregateViewId[];
  viewIdDefault?: AggregateViewId;
  systemName?: string;
}

export enum SelectionPriority {
  Default = 0,
  Initial = 1,
  QueryParam = 2,
  HfwMessage = 3
}

export interface SelectionRequest {
  selection: string;
  priority: SelectionPriority;
  sendMessage: boolean;
  customData?: any;
}

// Block object containing all services used throughout Object Manager VM classes
export interface ObjectManagerServiceCatalog {
  tablesService: TablesServiceBase;
  iconMapperService: SiIconMapperService;
  cnsHelperService: CnsHelperService;
  settingsService: SettingsServiceBase;
}
