import { Observable } from 'rxjs';
import { BrowserObject } from '@gms-flex/services';
import { ObjectItemIfc } from './object-item';

export enum ContextState {
  Empty,
  SingleObject,
  MultipleObjects
}

export enum ViewState {
  None,
  List,
  ObjectInfo,
  Paths,
  ObjectAncestorInfo
}

export interface ObjectViewModelIfc {

  readonly dataChangedUndetected: Observable<void>;
  readonly contextChanged: Observable<void>;

  readonly objectList: readonly ObjectItemIfc[];
  readonly selectedObject: ObjectItemIfc;
  readonly selectedObjectInSelectedPath: ObjectItemIfc;
  readonly contextState: ContextState;
  readonly viewState: ViewState;

  setContext(boArr: BrowserObject[]): Observable<void>;
  showDefaultView(): void;
  showList(): void;
  showObject(item?: ObjectItemIfc): void;
  showPaths(markScrollRestore?: boolean): void;
  showObjectAncestor(item?: ObjectItemIfc): void;

}
