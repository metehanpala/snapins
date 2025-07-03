import { Injectable } from '@angular/core';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import { TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../shared/trace-modules';

@Injectable(
  { providedIn: 'root' }
)

export class OperatorTaskStorageService implements IStorageService {

  // This Id must match the 'typeId' of the 'snapInTypes' array specified in the extension HLDL
  // and the 'path' property of the 'Route' object inserted into the 'appRoutes' array
  public typeId = 'OperatorTaskSnapinType';

  constructor(private readonly traceService: TraceService) {
    this.traceService.info(TraceModules.operatorTaskRootServices, 'OperatorTaskStorageService created.');
  }

  public getState(_fullId: FullSnapInId): any {
    //
  }

  public setState(_fullId: FullSnapInId, _state: any): void {
    //
  }

  public clearState(_fullId: FullSnapInId): void {
    //
  }

  public getDirtyState(_fullId: FullSnapInId): boolean {
    return false;
  }

  public setDirtyState(_fullId: FullSnapInId, _state: boolean): void {
    //
  }
}
