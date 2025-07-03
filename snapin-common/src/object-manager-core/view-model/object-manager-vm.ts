import { NgZone } from '@angular/core';
import { BrowserObject, Designation, ViewInfo, ViewNode, ViewType } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { concatMap, debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { AggregateViewId } from '../data-model/types';
import { ObjectManagerCoreIfc } from '../object-manager-core';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { TraceModules } from '../../shared/trace-modules';
import { AggregateView, AggregateViewIfc } from '../data-model/aggregate-view';
import { ObjectManagerViewConfig } from '../../object-manager/object-manager.types';
import { CnsNodeIfc } from '../data-model/cns-node';
import { ObjectView, ObjectViewIfc } from './object-view';
import { AggregateViewDelegate } from './object-view-aggregate';
import { CustomView } from './object-view-custom';
import { ItemTemplateTranslator, TreeItemData } from './tree-item-data';
import { ObjectManagerServiceCatalog, SelectionPriority, SelectionRequest, ViewFilter } from './types';
import { FilterView, FilterViewIfc, RootScope } from './filter-view';
import { isNullOrUndefined } from '@siemens/ngx-datatable';

export interface ObjectManagerViewModelIfc {

  readonly locale: string;
  readonly isInitialized: boolean;
  readonly isActive: boolean;
  readonly isCustomized: boolean;
  readonly views: readonly ObjectViewIfc[];
  readonly selectedView: ObjectViewIfc;
  readonly filter: FilterViewIfc;

  activate(ds: DomSanitizer): Observable<void>;
  deactivate(): void;
  setViewConfig(viewConfig: ObjectManagerViewConfig, initialSelection: string): void;
  enableSelectedViewReporting(flag: boolean): void;
  setUserFilterSelectionContext(bo: BrowserObject): void;
  injectItemTemplateTranslator(xlator: ItemTemplateTranslator): void;
  setSelectedView(id: AggregateViewId): void;
  setSelectedItem(req: SelectionRequest): void;

}

export class ObjectManagerViewModel implements ObjectManagerViewModelIfc {

  private readonly traceSvc: TraceServiceDelegate;
  private active: boolean;
  private agViewArr: AggregateViewDelegate[];
  private customViewArr: CustomView[];
  private filterView: FilterView;

  private selectableTypesFilter: string[];
  private creatableTypesFilter: string[];
  private customRoots: string[];
  private agViewFilter: ViewFilter;
  private initialSelection: string;
  private reportSelectedView: boolean;
  private itemTemplateTranslator: ItemTemplateTranslator;

  private selView: ObjectView;
  private pendingSelection: SelectionRequest;
  private destroyInd: Subject<void>;

  // If the Object Manager VM has been configured for custom views, the custom views
  // are shown in place of the standard aggregate views.
  public get views(): readonly ObjectViewIfc[] {
    return this.customViewArr || this.agViewArr || [];
  }

  public get isCustomized(): boolean {
    return !isNullOrUndefined(this.customViewArr) && this.customViewArr.length > 0;
  }

  // The selected-view will be a view reference from the aggregate-view array or the custom-view
  // array if custom views have been configured.
  public get selectedView(): ObjectViewIfc {
    return this.selView;
  }

  public get filter(): FilterViewIfc {
    return this.filterView;
  }

  public get isInitialized(): boolean {
    return (!isNullOrUndefined(this.customViewArr) || !isNullOrUndefined(this.agViewArr));
  }

  public get isActive(): boolean {
    return Boolean(this.active);
  }

  private get isDisposed(): boolean {
    return this.destroyInd === undefined;
  }

  public get locale(): string {
    return this.core.locale;
  }

  constructor(
    traceService: TraceService,
    private readonly svcBlk: ObjectManagerServiceCatalog,
    private readonly id: string,
    private readonly ngZone: NgZone,
    private readonly core: ObjectManagerCoreIfc) {

    if (!(traceService && svcBlk && core)) {
      throw new Error('invalid argument');
    }
    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.objectManager, `[${id}]`);
    this.destroyInd = new Subject<void>();
    // Subscribe for indications of view-list modifications resulting from CNS changes at the server.
    this.core.coreViewListModified
      .pipe(
        debounceTime(500),
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.resyncAggregateViewList();
        });
  }

  public injectItemTemplateTranslator(xlator: ItemTemplateTranslator): void {
    this.itemTemplateTranslator = xlator;
  }

  public setViewConfig(config: ObjectManagerViewConfig, initialSelection: string): void {
    if (this.isInitialized) {
      this.traceSvc.warn('Call to set view-config ignored; view-model already initialized');
      return;
    }
    // Clear any previously set config
    this.selectableTypesFilter = undefined;
    this.creatableTypesFilter = undefined;
    this.customRoots = undefined;
    this.agViewFilter = undefined;
    this.initialSelection = initialSelection || undefined;
    // Set config
    if (config) {
      // List of selectable types; all-selectable if not defined
      if (config.selectableTypes && config.selectableTypes.length > 0) {
        this.selectableTypesFilter = config.selectableTypes.slice(0);
      }
      // List of creatable types; creation-disabled if not defined
      if (config.creatableTypes && config.creatableTypes.length > 0) {
        this.creatableTypesFilter = config.creatableTypes.slice(0);
      }
      // Root nodes for creating a custom-view (incompatible w/ ag-view filter)
      if (config.customRoots && config.customRoots.length > 0) {
        this.customRoots = config.customRoots.slice(0);
      }
      // Aggregate-view filter; all-views (or custom-view) if not defined
      const vfilter: ViewFilter = config.viewFilter;
      if (vfilter) {
        if (!this.customRoots) {
          this.agViewFilter = {};
          if (vfilter.viewIds && vfilter.viewIds.length > 0) {
            this.agViewFilter.viewIds = vfilter.viewIds.slice(0);
          }
          const vid: AggregateViewId = vfilter.viewIdDefault;
          if (vid?.type !== undefined && vid.description) {
            this.agViewFilter.viewIdDefault = new AggregateViewId(vid.type, vid.description);
          }
          // optional system-name filter
          this.agViewFilter.systemName = vfilter.systemName || undefined;
        } else {
          // Ignore ag-view filter if custom-view already specified!
          this.traceSvc.warn('View-config contains ag-view filter and custom-roots specification; ag-view filter ignored');
        }
      }
    }
  }

  public enableSelectedViewReporting(val: boolean): void {
    if (this.isCustomized) {
      return; // reporting selected view applies only to aggregate views!
    }
    const flag = Boolean(val);
    if (this.reportSelectedView !== val) {
      this.reportSelectedView = val;
      // If reporting is being enabled and there is currently a selected view, report it
      const selView: AggregateViewDelegate = this.selView as AggregateViewDelegate;
      if (this.reportSelectedView && selView) {
        const vi: ViewInfo = new ViewInfo(selView.viewRef.cnsViews);
        this.svcBlk.cnsHelperService.setActiveView(vi);
      }
    }
  }

  public initialize(): Observable<void> {
    if (this.isInitialized) {
      return of(undefined); // already initialized
    }
    // Create a filter view
    this.filterView = new FilterView(
      this.traceSvc,
      this.svcBlk,
      this.id,
      this.locale,
      this.ngZone,
      this.core,
      this.selectableTypesFilter);
    // The aggregate-view array is created on initialization by default; this will
    // be overridden by a custom-view array if custom views are created by the client.
    this.customViewArr = undefined;
    this.agViewArr = [];
    return this.core.getViews()
      .pipe(
        map(agViews => {
          if (this.customRoots) {
            // Create custom-view (only one supported at this time!)
            this.createCustomView('', this.customRoots);
          }
          if (!this.customViewArr) {
            // No custom-view; create aggregate-views
            this.createAggregateViews(agViews);
          }
        }),
        tap(() => {
          // Listen for changes in view activation state
          const viewArr: ObjectView[] = this.customViewArr || this.agViewArr || [];
          viewArr.forEach(v => v.activationStateChanged
            .pipe(
              takeUntil(this.destroyInd))
            .subscribe(args => this.onActivationStateChanged(args)));
        }));
  }

  public activate(ds: DomSanitizer): Observable<void> {
    if (this.isDisposed) {
      throw new Error('view has been disposed');
    }
    return this.initialize()
      .pipe(
        concatMap(() => this.filterView.activate(ds)),
        tap(() => {
          this.active = true;
          this.setInitialSelection();
        }));
  }

  public deactivate(): void {
    if (!this.active) {
      return;
    }
    // Deactivate all views
    if (this.filterView) {
      this.filterView.deactivate();
    }
    if (this.customViewArr) {
      this.customViewArr.forEach(v => v.deactivate());
    }
    if (this.agViewArr) {
      this.agViewArr.forEach(v => v.deactivate());
    }
    this.active = false;
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.deactivate();
    if (this.agViewArr) {
      this.agViewArr.forEach(v => v.dispose());
      this.agViewArr = undefined;
    }
    if (this.customViewArr) {
      this.customViewArr.forEach(v => v.dispose());
      this.customViewArr = undefined;
    }
    if (this.filterView) {
      this.filterView.dispose();
      this.filterView = undefined;
    }
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }

  public createCustomView(description: string, roots: string[]): ObjectViewIfc {
    let custView: CustomView;
    try {
      custView = new CustomView(
        this.traceSvc,
        this.svcBlk,
        this.id,
        this.locale,
        this.ngZone,
        this.core,
        this.itemTemplateTranslator,
        roots,
        description,
        this.selectableTypesFilter,
        this.creatableTypesFilter);
      if (!this.customViewArr) {
        this.customViewArr = [];
      }
      this.customViewArr.push(custView);
    } catch (err) {
      this.traceSvc.error('Custom view creation failed: description=%s, %s', description, err);
    }
    return custView;
  }

  public createAggregateViews(agViews: readonly AggregateViewIfc[]): void {
    this.agViewArr = [];
    if (agViews) {
      this.agViewArr = agViews
        .filter(agView => {
          if (this.agViewFilter?.viewIds) {
            return this.agViewFilter.viewIds.some(id => agView.isIdMatch(id));
          }
          return true;
        })
        .map(agView => new AggregateViewDelegate(
          this.traceSvc,
          this.svcBlk,
          this.id,
          this.locale,
          this.ngZone,
          this.core,
          this.itemTemplateTranslator,
          agView,
          this.agViewFilter ? this.agViewFilter.systemName : undefined,
          this.selectableTypesFilter,
          this.creatableTypesFilter));
    }
  }

  // TEMPORARY: This method is here only to help expose cns-views outside of the ObjectManagerComponent
  //  for purposes of CNS search in System Browser.  Once the search functionality is moved from SB
  //  to the OM, this method can be removed!!!
  public getCnsViewsByBrowserObject(bo: BrowserObject): ViewNode[] {
    if (!bo || !this.views) {
      return undefined;
    }
    const d: Designation = new Designation(bo.Designation);
    const view: AggregateViewDelegate = this.agViewArr.find(v => v.isNodeInScope(d));
    const agView: AggregateView = view ? view.viewRef as AggregateView : undefined;
    return agView ? agView.cnsViews : undefined;
  }

  public getAgViewById(id: AggregateViewId): AggregateViewDelegate {
    let view: AggregateViewDelegate;
    if (this.agViewArr) {
      view = this.agViewArr.find(v => v.isIdMatch(id));
    }
    return view;
  }

  public setUserFilterSelectionContext(bo: BrowserObject): void {
    if (!this.filterView) {
      return;
    }
    let cnsView: ViewNode;
    if (bo) {
      cnsView = this.core.lookupViewNode(bo.ViewId, bo.SystemId);
    }
    this.filterView.setSelection(cnsView, bo); // will clear selection context if cnsView not defined!
  }

  public setSelectedView(id: AggregateViewId): void {
    // Externally setting selected custom-view is not implemented since there can be only one currently
    if (this.isCustomized) {
      return;
    }
    this.setSelectedViewInternal(this.getAgViewById(id));
  }

  public setInitialSelection(): void {
    if (!this.isActive) {
      return;
    }
    // First, try to process a pending or initial selection
    let req: SelectionRequest = this.pendingSelection;
    if (!req && this.initialSelection) {
      req = {
        selection: this.initialSelection,
        priority: SelectionPriority.Initial,
        sendMessage: true
      };
    }
    if (req && !this.selectionRequestToView(req)) {
      this.traceSvc.warn('Provided initial node selection not found in view-scope; ignoring: selection=%s', req.selection);
      req = undefined;
    }
    if (req) {
      this.setSelectedItem(req);
      return; // done!
    }
    // If we drop through to here, there is no pending/initial selection;
    // just set the initial view (no item selection)
    let initialView: ObjectView;
    if (this.isCustomized) {
      // Custom-views
      initialView = this.customViewArr && this.customViewArr.length > 0 ? this.customViewArr[0] : undefined;
    } else {
      // Aggregate-views
      if (this.agViewFilter?.viewIdDefault) {
        initialView = this.getAgViewById(this.agViewFilter.viewIdDefault);
      }
      if (!initialView && this.agViewArr) {
        initialView = this.agViewArr.find(v => v.id.type === ViewType.Application) || this.agViewArr[0];
      }
    }
    this.setSelectedViewInternal(initialView);
  }

  public setSelectedViewInternal(view: ObjectView): void {
    if (this.selView === view) {
      return;
    }
    if (this.selView) {
      this.selView.clearPendingSelection();
    }
    this.selView = view;
    if (!this.isCustomized) {
      const agView: AggregateViewDelegate = view as AggregateViewDelegate;
      this.filterView.setScope(agView);
      if (this.reportSelectedView) {
        const vi: ViewInfo = new ViewInfo(agView.viewRef.cnsViews);
        this.svcBlk.cnsHelperService.setActiveView(vi);
      }
    }
  }

  public setSelectedItem(req: SelectionRequest): void {
    if (!req) {
      return;
    }
    this.traceSvc.debug('Internal selection request received: designation=%s, prio=%s, sendMessage=%s',
      req.selection,
      req.priority,
      req.sendMessage);

    if (!this.isActive) {
      // View-model is not ready to process selection; mark as pending until activation
      if (this.pendingSelection && this.pendingSelection.priority > req.priority) {
        this.traceSvc.debug('Internal selection of higher priority already pending; request ignored');
      } else {
        this.traceSvc.debug('View-model inactive; internal selection set as pending');
        this.pendingSelection = req;
      }
    } else {
      // Process internal selection request
      this.pendingSelection = undefined;
      const view: ObjectView = this.selectionRequestToView(req);
      if (view) {
        // First, mark the view associated with the selection as the "selected" view.
        // This will trigger the view-layer to mark the view-vm "active" (if it is not already).
        this.setSelectedViewInternal(view);
        // Pass the selection request to the associated view for processing
        view.setSelectedItem(req);
      } else {
        this.traceSvc.warn('Internal selection refers to unknown view; request not processed: %s', req.selection);
      }
    }
  }

  public availableViewsChanged(delView: AggregateViewDelegate[]): void {
    if (delView[0] !== this.selectedView) {
      return;
    } else {
      this.traceSvc.debug('The current selected view was deleted and a new view selection must be made');
      this.setSelectedViewInternal(this.agViewArr[0]);
    }
  }

  private selectionRequestToView(req: SelectionRequest): ObjectView {
    let view: ObjectView;
    let d: Designation;
    if (req?.selection) {
      d = new Designation(req.selection);
    }
    if (d?.isValid) {
      const viewArr: ObjectView[] = this.customViewArr || this.agViewArr;
      if (viewArr) {
        view = viewArr.find(v => v.isNodeInScope(d));
      }
    }
    return view;
  }

  private resyncAggregateViewList(): void {
    // NOTE: A change to the list of aggregate-views in core will ONLY affect the list of aggregate-view
    //   delegates in the OM view-model.  It will not affect custom-views establish on VM initialization.
    //   Custom-views are transitory in nature (i.e., used typically in a dialog to select an item or items
    //   for a single operation); they do not exist during the entire application life-time.  For this
    //   reason, no attempt is made to add/remove custom-view root-nodes as underlying aggregate-views
    //   come and go with system state changes.
    if (!this.isInitialized) {
      return;
    }
    this.core.getViews()
      .subscribe(
        agViews => {
          // Remove all deleted views
          const viewDeletedArr: AggregateViewDelegate[] = this.agViewArr.filter(v => v.viewRef.isDeleted);
          viewDeletedArr.forEach(vDeleted => {
            const pos: number = this.agViewArr.findIndex(v => v === vDeleted);
            this.agViewArr.splice(pos, 1);
            this.availableViewsChanged(viewDeletedArr);
          });
          // Update/add view-delegates from current view list
          agViews.forEach((agView, idx) => {
            const v: AggregateViewDelegate = idx < this.agViewArr.length ? this.agViewArr[idx] : undefined;
            if (v && v.viewRef === agView) {
              // Update existing view delegate from current view data
              // NOTE: Currently, there is not aggregate-view instance data that needs to be updated in
              //  the associated delegate.  So, nothing to do here, but left as a placeholder.
            } else {
              // Add new view
              const viewAdded: AggregateViewDelegate = new AggregateViewDelegate(
                this.traceSvc,
                this.svcBlk,
                this.id,
                this.locale,
                this.ngZone,
                this.core,
                this.itemTemplateTranslator,
                agView,
                this.agViewFilter ? this.agViewFilter.systemName : undefined,
                this.selectableTypesFilter,
                this.creatableTypesFilter
              );
              this.agViewArr.splice(idx, 1, viewAdded);
            }
          });
        });
  }

  private onActivationStateChanged(view: ObjectView): void {
    if (!view) {
      return;
    }
    if (view.isActive) {
      // If this is a custom view, reset the search-scope of the filter view.
      // The search-scope is established by collecting the root nodes of all active custom views.
      if (this.isCustomized) {
        const scope: RootScope[] = [];
        this.customViewArr.forEach(v => {
          if (v.isActive) {
            v.roots.forEach(tiRoot => {
              const cnsRoot: CnsNodeIfc = TreeItemData.extract(tiRoot).cnsNode;
              scope.push({
                cnsView: cnsRoot.cnsView,
                cnsRoot: cnsRoot.browserObj
              });
            });
          }
        });
        this.filterView.setCustomScope(scope);
      }
      // When a view is activated, force a selection attempt on anything this might be pending.
      // If the pending selection is for a different view, the call to setSelectedItem will simply return.
      if (this.pendingSelection) {
        this.traceSvc.debug('Re-evaluated pending selection for activated view: %s', view.description);
        this.setSelectedItem(this.pendingSelection);
      }
    }
  }

}
