import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TraceService } from '@gms-flex/services-common';
import { TraceModules } from '../../shared/trace-modules';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { EventInfoServiceBase } from './event-info.service.base';

@Injectable({
  providedIn: 'root'
})
export class EventInfoService implements EventInfoServiceBase, OnDestroy {

  private readonly traceSvc: TraceServiceDelegate;

  public get commonTranslateService(): TranslateService {
    return this.translateService;
  }

  constructor(
    traceService: TraceService,
    private readonly translateService: TranslateService) {

    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.eventInfo);
  }

  public ngOnDestroy(): void {
    this.traceSvc.info('Destroying EventInfoService instance.');
  }
}
