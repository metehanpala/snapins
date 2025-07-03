import { NgZone } from '@angular/core';
import { from, Observable, of, Subject, throwError } from 'rxjs';
import { concatMap, debounceTime, filter, map, takeUntil, tap } from 'rxjs/operators';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { BrowserObject, CnsLabelEn, Designation, SystemsResponseObject } from '@gms-flex/services';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { TraceModules } from '../../shared/trace-modules';
import { ServiceCatalog } from './types';
import { NameHelperIfc, ObjectItem, ObjectItemIfc } from './object-item';
import { ContextState, ObjectViewModelIfc, ViewState } from './object-vm.base';
import { AboutObjectService } from '../services/about-object.service';

export class ObjectViewModel implements ObjectViewModelIfc, NameHelperIfc {

  private readonly traceSvc: TraceServiceDelegate;
  private readonly dataChangedUndetectedInd: Subject<void>;
  private readonly contextChangedInd: Subject<void>;
  private destroyInd: Subject<void>;

  private objectArr: ObjectItem[];
  private selObjectValue: ObjectItem;
  private selObjectInPathValue: ObjectItem;
  private viewStateValue: ViewState;
  private currentCnsLabel: CnsLabelEn;

  public get objectList(): readonly ObjectItemIfc[] {
    return this.objectArr || [];
  }

  public get selectedObject(): ObjectItemIfc {
    return this.selObjectValue;
  }

  public get selectedObjectInSelectedPath(): ObjectItemIfc {
    return this.selObjectInPathValue;
  }

  public get contextState(): ContextState {
    if (this.objectArr && this.objectArr.length > 0) {
      return this.objectArr.length === 1 ? ContextState.SingleObject : ContextState.MultipleObjects;
    }
    return ContextState.Empty;
  }

  public get viewState(): ViewState {
    return this.viewStateValue;
  }

  public get secondaryLabelEnabled(): boolean {
    const cl: CnsLabelEn = this.currentCnsLabel;
    return (
      cl === CnsLabelEn.NameAndDescription ||
      cl === CnsLabelEn.DescriptionAndName ||
      cl === CnsLabelEn.DescriptionAndAlias);
  }

  public get contextChanged(): Observable<void> {
    return this.contextChangedInd;
  }

  public get dataChangedUndetected(): Observable<void> {
    return this.dataChangedUndetectedInd;
  }

  private get isDisposed(): boolean {
    return this.destroyInd === undefined;
  }

  public constructor(
    private readonly svc: ServiceCatalog,
    private readonly id: string,
    private readonly ngZone: NgZone) {

    if (!svc) {
      throw new Error('invalid argument');
    }
    this.traceSvc = new TraceServiceDelegate(svc.traceService, TraceModules.aboutObject);
    this.destroyInd = new Subject<void>();
    this.dataChangedUndetectedInd = new Subject<void>();
    this.contextChangedInd = new Subject<void>();
    this.clear();
    this.svc.systemsService.getSystemsExt()?.pipe(takeUntil(this.destroyInd)).subscribe((sys: SystemsResponseObject) => {
      this.svc.isDistributedSystem = sys.IsDistributed;
      this.svc.cnsHelperService.activeCnsLabel
        .pipe(
          filter(label => !isNullOrUndefined(label) && label.cnsLabel !== this.currentCnsLabel),
          debounceTime(100),
          takeUntil(this.destroyInd))
        .subscribe(
          label => {
            this.currentCnsLabel = label.cnsLabel;
            this.updateLabels();
          });
    });
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.clear();
    // Dispose all sub-vms here...
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }

  public resolveNames(bo: BrowserObject): string[] {
    if (!bo) {
      return [];
    }
    return this.svc.cnsHelperService.getCnsLabelsOrdered(bo) || [];
  }

  public setContext(boArrInp: BrowserObject[]): Observable<void> {
    // Remove undefined items from input array
    const boArr: BrowserObject[] = (boArrInp || []).filter(bo => !isNullOrUndefined(bo));
    // Validate items (stop on 1st invalid item)
    const boInvalid: BrowserObject = boArr.find(bo => !this.isObjectValid(bo));
    if (boInvalid) {
      this.traceSvc.error('Provided context cointains invalid object: %s', boInvalid ? boInvalid.Designation : '');
      return throwError('invalid object context');
    }
    // Check if context is equal to current context
    if (this.isContextEqual(boArr)) {
      return of(undefined); // same as existing; no-op
    }
    // Update context
    return this.setContextInternal(boArr);
  }

  public showDefaultView(): void {
    // Clear all scroll restoration flags
    if (this.objectArr) {
      this.objectArr.forEach(item => item.clearScrollRestore());
    }
    // Set initial view based on current object-context
    switch (this.contextState) {
      case ContextState.SingleObject:
        this.showObject(this.objectArr[0]);
        break;
      case ContextState.MultipleObjects:
        this.showList();
        break;
      case ContextState.Empty:
      default:
        this.selObjectValue = undefined;
        this.selObjectInPathValue = undefined;
        this.viewStateValue = ViewState.None;
        break;
    }
  }

  public showList(): void {
    this.selObjectValue = undefined;
    this.viewStateValue = ViewState.List;
  }

  public showObject(item?: ObjectItemIfc): void {
    // item arg will be undefined when navigating "back" to show-object state (no change in selected object)
    if (item) {
      const itemFound: ObjectItem = (this.objectArr || []).find(i => i === item);
      if (itemFound) {
        this.selObjectValue = itemFound;
        itemFound.readDetails();
      }
    }
    if (this.selObjectValue) {
      // Reset the path selection to the first header when transitioning to/back-to the detail-view;
      // if/when the path-view is reselected, it will show the first header (not the previously selected--this
      // is what has been requested).
      this.selectedObject.firstPath();
      this.viewStateValue = ViewState.ObjectInfo;
    } else {
      this.traceSvc.error('Request to show detail-view without a selected object: param=$s', item ? item.objectId : undefined);
    }
  }

  public showPaths(markScrollRestore?: boolean): void {
    if (this.selObjectValue) {
      if (markScrollRestore) {
        this.selObjectValue.restoreScrollPosDetail = true;
      }
      this.selObjectValue.readPathHeaders();
      this.selObjectInPathValue = undefined;
      this.viewStateValue = ViewState.Paths;
    } else {
      this.traceSvc.error('Request to show path-view without a selected object');
    }
  }

  public showObjectAncestor(item?: ObjectItemIfc): void {
    if (item && this.selObjectValue) {
      const itemFound: ObjectItem = this.selObjectValue.findObjectInSelectedPath(item);
      if (itemFound) {
        this.selObjectInPathValue = itemFound;
        this.selObjectValue.restoreScrollPosPath = true;
        itemFound.readDetails();
      }
    }
    if (this.selObjectInPathValue) {
      this.viewStateValue = ViewState.ObjectAncestorInfo;
    } else {
      this.traceSvc.error('Request to show path-object detail-view without a selected object: param=$s', item ? item.objectId : undefined);
    }
  }

  private isObjectValid(bo: BrowserObject): boolean {
    if (!(bo?.Designation)) {
      return false;
    }
    const d: Designation = new Designation(bo.Designation);
    return d.isValid && d.isViewValid && d.isRootNodeValid;
  }

  private isContextEqual(boArr: BrowserObject[]): boolean {
    boArr = boArr || [];
    const boArrCurrent: BrowserObject[] = (this.objectArr || []).map(item => item.boSource);
    return boArr.length === boArrCurrent.length &&
      boArr.every((bo, idx) => bo === boArrCurrent[idx]);
  }

  private clear(): void {
    if (this.objectArr) {
      this.objectArr.forEach(item => item.dispose());
    }
    this.selObjectValue = undefined;
    this.selObjectInPathValue = undefined;
    this.objectArr = undefined;
    this.viewStateValue = ViewState.None;
  }

  private setContextInternal(boArr: BrowserObject[]): Observable<void> {
    if (!(boArr && boArr.length > 0)) {
      return of(undefined)
        .pipe(
          tap(() => {
            this.traceSvc.info('Clear object context');
            this.clear();
            this.contextChangedInd.next();
          }));
    }
    return of(boArr)
      .pipe(
        map(arr => {
          this.clear();
          this.objectArr = arr.map(bo => new ObjectItem(this.svc, this.ngZone, this, bo, true));
          this.updateLabels();
        }),
        tap(() => {
          this.contextChangedInd.next();
        }),
        concatMap(() => this.setIcons()));
  }

  private updateLabels(): void {
    if (!this.objectArr) {
      return;
    }
    this.objectArr.forEach(item => item.updateLabels());
  }

  private setIcons(): Observable<void> {
    if (!this.objectArr) {
      return of(undefined);
    }
    return from(this.objectArr)
      .pipe(
        concatMap(item => item.setIcon()));
  }
}
