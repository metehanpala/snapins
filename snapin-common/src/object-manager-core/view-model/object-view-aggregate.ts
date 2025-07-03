import { NgZone } from '@angular/core';
import { Observable, of } from 'rxjs';
import { debounceTime, map, takeUntil, tap } from 'rxjs/operators';
import { Designation, designationSeparator, designationViewSeparator } from '@gms-flex/services';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { ObjectManagerCoreIfc } from '../object-manager-core';
import { AggregateViewIfc } from '../data-model/aggregate-view';
import { AggregateViewId } from '../data-model/types';
import { CnsNodeIfc } from '../data-model/cns-node';
import { ObjectView } from './object-view';
import { ObjectManagerServiceCatalog } from './types';
import { ItemTemplateTranslator } from './tree-item-data';

export class AggregateViewDelegate extends ObjectView {

  public get id(): AggregateViewId {
    return this.viewRef.id;
  }

  public get description(): string {
    return this.viewRef.description;
  }

  public constructor(
    traceSvc: TraceServiceDelegate,
    svcBlk: ObjectManagerServiceCatalog,
    vmId: string,
    locale: string,
    ngZone: NgZone,
    core: ObjectManagerCoreIfc,
    xlator: ItemTemplateTranslator,
    public viewRef: AggregateViewIfc,
    private readonly systemNameFilter: string,
    selectableTypesFilter: string[],
    creatableTypesFilter: string[]) {

    super(traceSvc, svcBlk, vmId, locale, ngZone, core, xlator, selectableTypesFilter, creatableTypesFilter);
    if (!viewRef) {
      throw new Error('invalid argument');
    }
  }

  protected initializeSub(): Observable<void> {
    return of(undefined)
      .pipe(
        tap(() => {
          this.viewRef.coreViewModified
            .pipe(
              debounceTime(this.resyncDelayMs),
              takeUntil(this.destroyInd))
            .subscribe(
              () => {
                this.resyncView();
              });
        }));
  }

  public activateSub(): Observable<void> {
    return of(undefined);
  }

  public deactivateSub(): void {
    return;
  }

  public disposeSub(): void {
    return;
  }

  public getCnsViewDesignation(systemName?: string): string {
    let designation: string;
    systemName = systemName || this.core.localSystemName;
    const cnsViewName: string = this.viewRef.getCnsViewName(systemName);
    if (cnsViewName) {
      designation = systemName + designationSeparator + cnsViewName + designationViewSeparator;
    }
    return designation;
  }

  public isIdMatch(id: AggregateViewId): boolean {
    return this.viewRef.isIdMatch(id);
  }

  public isNodeInScope(d: Designation): boolean {
    if (!d || !d.isValid) {
      return;
    }
    const systemName: string = d.systemName || this.core.localSystemName;
    const cnsViewName: string = d.viewName;
    return this.viewRef.containsCnsView(systemName, cnsViewName);
  }

  public resolveRootNodes(): Observable<CnsNodeIfc[]> {
    return this.viewRef.getRootNodes()
      .pipe(
        // Filter out root nodes not matching of the system-name filter
        map(rootNodes => rootNodes.filter(root => {
          if (this.systemNameFilter) {
            return root.systemName === this.systemNameFilter;
          }
          return true;
        })));
  }

  protected cnsNodeToView(cnsNode: CnsNodeIfc): AggregateViewIfc {
    if (cnsNode && this.viewRef && this.viewRef.containsCnsView(cnsNode.systemName, cnsNode.cnsView.Name)) {
      return this.viewRef;
    }
    return undefined;
  }

}
