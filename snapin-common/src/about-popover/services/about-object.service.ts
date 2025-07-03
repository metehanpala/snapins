import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CnsHelperService, ObjectsServiceBase, SiIconMapperService, SystemBrowserServiceBase, SystemsServiceBase } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { TraceModules } from '../../shared/trace-modules';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { ServiceCatalog } from '../view-model/types';
import { ObjectViewModel } from '../view-model/object-vm';
import { ObjectViewModelIfc } from '../view-model/object-vm.base';
import { ObjectManagerCoreServiceBase } from '../../object-manager-core';
import { AboutObjectServiceBase } from './about-object.service.base';

@Injectable({
  providedIn: 'root'
})
export class AboutObjectService implements AboutObjectServiceBase, OnDestroy {

  private readonly traceSvc: TraceServiceDelegate;
  private vmMap: Map<string, ObjectViewModel>;
  private readonly serviceCatalog: ServiceCatalog;

  public get commonTranslateService(): TranslateService {
    return this.translateService;
  }

  constructor(
    traceService: TraceService,
    private readonly translateService: TranslateService,
    objectsService: ObjectsServiceBase,
    systemBrowserService: SystemBrowserServiceBase,
    iconMapperService: SiIconMapperService,
    cnsHelperService: CnsHelperService,
    cnsCoreService: ObjectManagerCoreServiceBase,
    systemsService: SystemsServiceBase) {

    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.aboutObject);
    this.vmMap = new Map<string, ObjectViewModel>();
    // Service catalog will be provided to view-model objects
    this.serviceCatalog = new ServiceCatalog(
      traceService,
      cnsHelperService,
      cnsCoreService,
      objectsService,
      systemBrowserService,
      iconMapperService,
      systemsService);
  }

  public ngOnDestroy(): void {
    this.traceSvc.info('Destroying AboutObjectService instance.');
    this.vmMap.forEach(vm => vm.dispose());
    this.vmMap.clear();
    this.vmMap = undefined;
  }

  public registerViewModel(id: string, ngZone: NgZone): ObjectViewModelIfc {
    if (!this.vmMap) {
      throw new Error('service has been destroyed');
    }
    if (!id) {
      throw new Error('empty registration id');
    }
    // Retrieve a view-model from the map, or create it if it does not yet exist
    let vm: ObjectViewModel = this.vmMap.get(id);
    if (!vm) {
      this.traceSvc.info('Create new object view-model: id=%s', id);
      vm = new ObjectViewModel(this.serviceCatalog, id, ngZone);
      this.vmMap.set(id, vm); // add to map
    } else {
      this.traceSvc.info('Retrieve existing object view-model: id=%s', id);
    }
    return vm;
  }

  public unregisterViewModel(id: string): void {
    // Remove a view-model from the map and dispose of it
    const vm: ObjectViewModel = this.vmMap.get(id);
    if (vm) {
      this.traceSvc.info('Delete object view-model: id=%s', id);
      this.vmMap.delete(id);
      vm.dispose();
    }
  }

}
