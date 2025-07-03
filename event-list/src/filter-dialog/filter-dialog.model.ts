import { EventFilter } from '@gms-flex/services';

export const checked = 'checked';
export interface DialogData {
  exitCode: DialogExitCode;
  eventFilter?: EventFilter;
  savedFilters?: EventFilter[];
}

export enum DialogExitCode {
  CANCEL = 0,
  APPLY = 1,
  UPDATE = 2,
  NEW = 3,
  REMOVE = 4,
  DELETEALL = 5
}

export enum FilterStringType {
  Name = 0,
  Description = 1,
  Alias = 2
}
