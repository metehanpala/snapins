import { NgZone } from '@angular/core';
import { from, Observable, Observer, of } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, map, takeUntil, tap } from 'rxjs/operators';
import { Designation } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { ObjectManagerCoreIfc } from '../object-manager-core';
import { AggregateViewIfc } from '../data-model/aggregate-view';
import { AggregateViewId } from '../data-model/types';
import { CnsNodeIfc } from '../data-model/cns-node';
import { ObjectView } from './object-view';
import { ObjectManagerServiceCatalog } from './types';
import { ItemTemplateTranslator } from './tree-item-data';

interface ViewScopeSpecifier {
  viewId: AggregateViewId;
  branchRoot: Designation;
  objectTypes?: number[];
}

export class CustomView extends ObjectView {

  private viewScope: ViewScopeSpecifier[];
  private viewRefArr: AggregateViewIfc[];
  private readonly rootDesignationArr: Designation[];

  // id field from base class is explicitly set as `undefined` for custom-views.
  public get id(): AggregateViewId {
    return undefined;
  }

  public get description(): string {
    return this.customDescription;
  }

  public constructor(
    traceSvc: TraceServiceDelegate,
    svcBlk: ObjectManagerServiceCatalog,
    vmId: string,
    locale: string,
    ngZone: NgZone,
    core: ObjectManagerCoreIfc,
    xlator: ItemTemplateTranslator,
    designationArr: string[],
    private readonly customDescription: string,
    selectableTypesFilter: string[],
    creatableTypesFilter: string[]) {

    super(traceSvc, svcBlk, vmId, locale, ngZone, core, xlator, selectableTypesFilter, creatableTypesFilter);
    if (designationArr) {
      this.rootDesignationArr = designationArr
        .map(dStr => new Designation(dStr))
        // Designations containing only a view are considered invalid!
        .filter(d => d.isRootNodeValid);
    }
    if (!this.rootDesignationArr || this.rootDesignationArr.length === 0) {
      throw new Error('invalid argument');
    }
  }

  public initializeSub(): Observable<void> {
    return this.resolveViewScope()
      .pipe(
        tap(() => {
          this.viewRefArr.forEach(viewRef => viewRef.coreViewModified
            .pipe(
              debounceTime(this.resyncDelayMs),
              takeUntil(this.destroyInd))
            .subscribe(
              () => {
                this.resyncView();
              }));
        }));
  }

  public activateSub(): Observable<void> {
    return of(undefined);
  }

  protected deactivateSub(): void {
    return;
  }

  protected disposeSub(): void {
    return;
  }

  protected cnsNodeToView(cnsNode: CnsNodeIfc): AggregateViewIfc {
    let view: AggregateViewIfc;
    if (cnsNode && this.viewRefArr) {
      view = this.viewRefArr.find(v => v.containsCnsView(cnsNode.systemName, cnsNode.cnsView.Name));
    }
    return view;
  }

  public isNodeInScope(d: Designation): boolean {
    // NOTE: It is important that this method NOT rely on loaded tree-item data (roots) because
    //  it can be called prior to activation, at which time no tree-item data will be loaded!
    if (!d || !d.isValid) {
      return false;
    }
    const systemName: string = d.systemName || this.core.localSystemName;
    const inScope: boolean = this.rootDesignationArr.some(dRoot => {
      const sname: string = dRoot.systemName || this.core.localSystemName;
      const len: number = dRoot.designationWoSystem.length;
      return sname === systemName && dRoot.designationWoSystem === d.designationWoSystem.substr(0, len);
    });
    return inScope;
  }

  protected resolveRootNodes(): Observable<CnsNodeIfc[]> {
    return new Observable((observer: Observer<CnsNodeIfc[]>) => {
      const cnsRoots: CnsNodeIfc[] = [];
      from(this.viewScope)
        .pipe(
          concatMap(spec => {
            const view: AggregateViewIfc = this.viewRefArr.find(v => v.isIdMatch(spec.viewId));
            return view.getNode(spec.branchRoot.designation);
          }),
          catchError(err => {
            this.traceSvc.error('Failed to get root node for custom view: %s', err);
            return of(undefined);
          }),
          filter(cnsNode => !isNullOrUndefined(cnsNode)))
        .subscribe(
          cnsNode => {
            cnsRoots.push(cnsNode);
          },
          err => {
            observer.error(err);
          },
          () => {
            observer.next(cnsRoots);
            observer.complete();
          });
    });
  }

  private resolveViewScope(): Observable<void> {
    return new Observable((observer: Observer<void>) => {
      this.viewScope = [];
      this.viewRefArr = [];
      from(this.rootDesignationArr)
        .pipe(
          concatMap(designation => this.resolveScopeSpecification(designation)),
          filter(spec => !isNullOrUndefined(spec)))
        .subscribe(
          spec => {
            this.viewScope.push(spec);
          },
          err => {
            observer.error(err);
          },
          () => {
            observer.next(undefined);
            observer.complete();
          });
    });
  }

  private resolveScopeSpecification(d: Designation): Observable<ViewScopeSpecifier> {
    return this.core.getViews()
      .pipe(
        map(views => views.find(v => v.containsCnsView(d.systemName || this.core.localSystemName, d.viewName))),
        tap(view => {
          // Keep a collection of the aggregate-views within the scope of this custom object view
          if (view && !this.viewRefArr.includes(view)) {
            this.viewRefArr.push(view);
          }
        }),
        map(view => {
          if (!view) {
            throw new Error('view not found');
          }
          return {
            viewId: view.id,
            branchRoot: d
          } as ViewScopeSpecifier;
        }),
        catchError(err => {
          this.traceSvc.error('Error resolving view scope specifier: designation=%s, %s', d.designation, err);
          return of(undefined);
        })
      );
  }

}
