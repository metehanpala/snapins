import { Injectable } from '@angular/core';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import { TraceService } from '@gms-flex/services-common';

import { traceModule } from './event-list-preselect.service';

@Injectable(
  { providedIn: 'root' }
)
export class EventListStorageService implements IStorageService {

  public typeId = 'EventListType';

  constructor(private readonly traceService: TraceService) {
    this.traceService.info(traceModule, 'EventListStorageService created');
  }

  public getState(fullId: FullSnapInId): any {
    //
  }

  public setState(fullId: FullSnapInId, state: any): void {
    //
  }

  public clearState(fullId: FullSnapInId): void {
    //
  }

  public getDirtyState(fullId: FullSnapInId): boolean {
    return;
  }

  public setDirtyState(fullId: FullSnapInId, state: boolean): void {
    //
  }
}
