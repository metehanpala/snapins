import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { concatMap, filter, map, take, tap } from 'rxjs/operators';
import { AuthenticationServiceBase, isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { BrowserObject, CnsHelperService, ObjectsServiceBase, SiIconMapperService, SystemBrowserServiceBase,
  SystemBrowserSubscriptionServiceBase, SystemsServiceBase, TablesServiceBase, ViewInfo, ViewType } from '@gms-flex/services';
import { TraceModules } from '../shared/trace-modules';
import { TraceServiceDelegate } from '../shared/trace-service-delegate';
import { ObjectManagerViewModel, ObjectManagerViewModelIfc } from './view-model/object-manager-vm';
import { ObjectManagerCore } from './object-manager-core';
import { ObjectManagerCoreServiceBase } from './object-manager-core.service.base';
import { ObjectManagerServiceCatalog } from './view-model/types';
import { AggregateViewIfc } from './data-model/aggregate-view';
import { AggregateViewId } from './data-model/types';
import { Common } from './object-manager-core-common';

@Injectable({
  providedIn: 'root'
})
export class ObjectManagerCoreService implements ObjectManagerCoreServiceBase, OnDestroy {

  private readonly traceSvc: TraceServiceDelegate;
  private core: ObjectManagerCore;
  private vmMap: Map<string, ObjectManagerViewModel>;
  private initialViewId: AggregateViewId;

  // TranslateService for use by all Object Manager components.
  // Instead of injecting a TranslateService directly, all OM components requiring translatable
  // resources will instead inject the one (root-singleton) ObjectManagerCoreService and access this
  // application-wide common TranslateService.  This avoid the incorrect (snap-in specific) service
  // being injected into OM components when used in lazy-loaded snap-in modules.
  public get commonTranslateService(): TranslateService {
    return this.translateService;
  }

  constructor(
    traceService: TraceService,
    private readonly translateService: TranslateService,
    private readonly systemsService: SystemsServiceBase,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly systemBrowserSubscriptionService: SystemBrowserSubscriptionServiceBase,
    private readonly objectsService: ObjectsServiceBase,
    private readonly tablesService: TablesServiceBase,
    private readonly iconMapperService: SiIconMapperService,
    private readonly settingsService: SettingsServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly authenticationService: AuthenticationServiceBase) {

    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.objectManagerCore);
    this.traceSvc.info('Creating new Object Manager core service.');
    this.vmMap = new Map<string, ObjectManagerViewModel>();
    const locale: string = this.translateService.currentLang || this.translateService.defaultLang || 'en-US';
    this.core = new ObjectManagerCore(
      this.traceSvc,
      this.systemsService,
      this.systemBrowserService,
      this.systemBrowserSubscriptionService,
      this.objectsService,
      this.cnsHelperService,
      locale);

    // Listen for user login
    this.authenticationService.userNameEvent
      .pipe(
        filter(uname => !isNullOrUndefined(uname) && uname.length > 0),
        take(1)) // complete subscription after the first (non-empty) value has been emitted
      .subscribe(
        uname => this.onUserLogin(uname));
  }

  public ngOnDestroy(): void {
    this.traceSvc.info('Destroying Object Manager core service.');
    this.vmMap.forEach(vm => vm.dispose());
    this.vmMap.clear();
    this.vmMap = undefined;
    this.core.dispose();
    this.core = undefined;
  }

  public registerViewModel(id: string, ngZone: NgZone): ObjectManagerViewModelIfc {
    if (!this.vmMap) {
      throw new Error('service has been destroyed');
    }
    if (!id) {
      throw new Error('empty registration id');
    }
    // Retrieve a view-model from the map, or create it if it does not yet exist
    let vm: ObjectManagerViewModel = this.vmMap.get(id);
    if (!vm) {
      this.traceSvc.info('Register new object-manager view-model: id=%s', id);
      // If locale not provided by registrant, default to core locale
      const svcBlk: ObjectManagerServiceCatalog = {
        tablesService: this.tablesService,
        iconMapperService: this.iconMapperService,
        cnsHelperService: this.cnsHelperService,
        settingsService: this.settingsService
      };
      vm = new ObjectManagerViewModel(
        this.traceSvc.native,
        svcBlk,
        id,
        ngZone,
        this.core);
      this.vmMap.set(id, vm); // add to map
    } else {
      this.traceSvc.info('Register existing object-manager view-model: id=%s', id);
    }
    return vm;
  }

  public unregisterViewModel(id: string): void {
    // Remove a view-model from the map and dispose of it
    const vm: ObjectManagerViewModel = this.vmMap.get(id);
    if (vm) {
      this.traceSvc.info('Un-registering and deleting object-manager view-model: id=%s', id);
      this.vmMap.delete(id);
      vm.dispose();
    }
  }

  // Future Consideration: thought about exposing the entire core as a property of type ObjectManagerCoreIfc
  //   rather than exposing just a couple select methods as pass-through calls to core.
  //   This may be a better approach, but we would need to consider the ramifications (good and bad) of
  //   exposing all core functionality to any SNI that injectd the core service, such as object creation.

  public getViews(): Observable<readonly AggregateViewIfc[]> {
    return this.core.getViews();
  }

  public findObject(designation: string): Observable<BrowserObject> {
    return this.core.findObject(designation);
  }

  public findPathObjects(designation: string): Observable<BrowserObject[]> {
    return this.core.findPathObjects(designation);
  }

  public updateVmFilter(): void {
    Array.from(this.vmMap.values()).forEach(vm => {
      vm.filter.updateFilters().toPromise().then(() => {
        this.traceSvc.info('Request to refresh filters');
      });
    });
  }

  private onUserLogin(uname: string): void {
    if (!this.cnsHelperService.activeViewValue) {
      this.traceSvc.info('User login detected; initialize empty active view in CnsHelperService');
      this.settingsService.getSettings(Common.userSettingsLastSelectedView)
        .pipe(
          tap(settingsVal => this.initialViewId = this.parseViewId(settingsVal)),
          concatMap(() => this.core.getViews()),
          map(agViews => this.setActiveView(agViews))
        )
        .subscribe(
          () => {
            const vi: ViewInfo = this.cnsHelperService.activeViewValue;
            this.traceSvc.info('Active view initialized: %s', vi ? vi.description : '<undefined>');
          }
        );
    }
  }

  private parseViewId(val: string): AggregateViewId {
    let viewId: AggregateViewId;
    if (!isNullOrUndefined(val)) {
      const parts: string[] = val.split('.');
      if (parts && parts.length === 2) {
        viewId = { type: parseInt(parts[0], 10), description: parts[1] };
      }
    }
    return viewId;
  }

  private setActiveView(agViewArr: readonly AggregateViewIfc[]): void {
    if (!(agViewArr && agViewArr.length > 0)) {
      this.traceSvc.warn('Aggregate view list is empty; cannot initialize active view!');
      return;
    }
    let initialView: AggregateViewIfc;
    if (this.initialViewId) {
      initialView = agViewArr.find(v => v.isIdMatch(this.initialViewId));
    }
    if (!initialView) {
      initialView = agViewArr.find(v => v.type === ViewType.Application) || agViewArr[0];
    }
    const vi: ViewInfo = new ViewInfo(initialView.cnsViews);
    this.cnsHelperService.setActiveView(vi);
  }
}
