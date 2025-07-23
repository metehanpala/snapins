import { Injectable } from '@angular/core';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import { TraceService } from '@gms-flex/services-common';

import { traceModule } from './text-preselect.service';

@Injectable()
export class TextStorageService implements IStorageService {

  public typeId = 'TextualViewerType';
  public stateMap: Map<string, any> = new Map();

  constructor(private readonly traceService?: TraceService) {
    this.traceService?.info(traceModule, 'TextStorageService created.');
  }

  public getState(fullId: FullSnapInId): any {
    let state: any;
    let snapInId = '';

    if (fullId !== undefined) {
      snapInId = fullId.snapInId;
    } else {
      return state;
    }

    if (this.stateMap.has(snapInId)) {
      state = this.stateMap.get(snapInId);
    }

    return state;
  }

  public setState(fullId: FullSnapInId, state: any): void {
    let snapInId = '';

    if (fullId !== undefined) {
      snapInId = fullId.snapInId;
    } else {
      return;
    }

    this.stateMap.set(snapInId, state);
  }

  public clearState(fullId: FullSnapInId): void {
    let snapInId = '';
    if (fullId !== undefined) {
      snapInId = fullId.snapInId;
    } else {
      return;
    }

    if (this.stateMap.has(snapInId)) {
      this.stateMap.delete(snapInId);
    }
  }

  public getDirtyState(fullId: FullSnapInId): boolean {
    return;
  }

  public setDirtyState(fullId: FullSnapInId, state: boolean): void {
    //
  }
}
