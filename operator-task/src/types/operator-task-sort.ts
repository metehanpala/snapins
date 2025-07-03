export interface TaskSort {
  prop: string;
  dir: string;
}

export enum TaskSortDirection {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}
