import { Injectable } from '@angular/core';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import { TraceService } from '@gms-flex/services-common';

const traceModule = 'gmsSnapins_DocumentServices';

export interface StateData {
  path: string;
  scrollTop: number;
  scrollLeft: number;
  skip: number; // the skip for tiles view.
  tilesScrollTop: number;
  searchString: string;
}
@Injectable(
  { providedIn: 'root' }
)
export class DocumentStorageService implements IStorageService {

  public typeId = 'DocumentViewerType';

  public path = '';
  public scrollTop = 0;
  public scrollLeft = 0;

  public skip = 0; // the skip for tiles view.
  public tilesScrollTop: number;
  public searchString: string;

  constructor(private readonly traceService: TraceService) {
    this.traceService.info(traceModule, 'DocumentStorageService created');
  }

  public getState(): StateData {
    const data: StateData = {
      path: this.path,
      scrollTop: this.scrollTop,
      scrollLeft: this.scrollLeft,
      skip: this.skip,
      tilesScrollTop: this.tilesScrollTop,
      searchString: this.searchString
    };
    return data;
  }

  public setState(fullId: FullSnapInId, state: any): void {
    this.path = state.path;
    this.scrollTop = state.scrollTop;
    this.scrollLeft = state.scrollLeft;
    this.skip = state.skip;
    this.tilesScrollTop = state.tilesScrollTop;
    this.searchString = state.searchString;
  }

  public clearState(): void {
    this.path = '';
    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.skip = 0;
    this.tilesScrollTop = undefined; // this undefined is intentional.
    this.searchString = undefined;
  }

  public getDirtyState(fullId: FullSnapInId): boolean {
    return;
  }

  public setDirtyState(fullId: FullSnapInId, state: boolean): void {
    //
  }

}
