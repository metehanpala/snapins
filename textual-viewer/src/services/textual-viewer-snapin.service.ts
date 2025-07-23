import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { PropertyServiceBase, SiIconMapperService, SystemBrowserServiceBase, ValueSubscription2ServiceBase } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';

import { TvTraceModules } from '../view-model/globals';
import { TextualViewerSnapInViewModel } from '../view-model/snapin-vm';
import { TextualViewerSnapInViewModelBase } from '../view-model/snapin-vm.base';

@Injectable({
  providedIn: 'root'
})
export class TextualViewerSnapInService implements OnDestroy {

  private sniVmMap: Map<string, TextualViewerSnapInViewModel>;

  private readonly traceModule: string = TvTraceModules.service;

  constructor(
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly propertyService: PropertyServiceBase,
    private readonly valueSubscriptionService: ValueSubscription2ServiceBase,
    private readonly iconMapperService: SiIconMapperService,
    private readonly traceService: TraceService,
    private readonly ngZone: NgZone) {

    this.sniVmMap = new Map<string, TextualViewerSnapInViewModel>();
  }

  public ngOnDestroy(): void {
    if (this.sniVmMap) {
      this.sniVmMap.forEach(vm => {
        try {
          vm.dispose();
        } catch (err) {
          this.traceService.error(this.traceModule, 'ngOnDestroy: caught error');
        }
      });
      this.sniVmMap.clear();
      this.sniVmMap = undefined;
    }
  }

  public registerViewModel(sniId: string): TextualViewerSnapInViewModelBase {
    if (sniId === undefined || sniId === null || sniId.length <= 0) {
      throw new Error('sniId argument cannot be undefined or empty');
    }

    let vm: TextualViewerSnapInViewModel = this.sniVmMap.get(sniId);

    if (!vm) {
      this.traceService.info(this.traceModule, `Create new view-model: sniId=[${sniId}]`);

      vm = new TextualViewerSnapInViewModel(
        sniId,
        this.systemBrowserService,
        this.propertyService,
        this.valueSubscriptionService,
        this.iconMapperService,
        this.traceService,
        this.ngZone);

      this.sniVmMap.set(sniId, vm);
    }

    return vm;
  }

  /**
   * Remove and dispose of snap-in view-model.
   */
  public unregisterViewModel(sniId: string): void {
    const vm: TextualViewerSnapInViewModel = this.sniVmMap.get(sniId);
    if (vm !== undefined) {
      this.traceService.info(this.traceModule, `Destroy view-model: sniId=[${sniId}]`);
      vm.dispose();
      this.sniVmMap.delete(vm.id);
    }
  }
}
