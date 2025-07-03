import { NgZone } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { BrowserObject, CnsHelperService, Designation, SearchOption, TablesEx, ViewType, ViewTypeConverter } from '@gms-flex/services';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { TraceModules } from '../../shared/trace-modules';
import { ObjectLabel, ObjectLabelIfc } from './object-label';
import { ServiceCatalog } from './types';

export interface NameHelperIfc {
  readonly secondaryLabelEnabled: boolean;
  resolveNames(bo: BrowserObject): string[];
}

export interface ObjectItemIfc {

  readonly objectLabel: ObjectLabelIfc;
  readonly hasParent: boolean;
  readonly parentRef: ObjectItemIfc;
  readonly secondaryLabelEnabled: boolean;
  readonly description: string;
  readonly name: string;
  readonly hasAlias: boolean;
  readonly alias: string;
  readonly informationText: string;
  readonly hasInformationText: boolean;
  readonly isSourceObject: boolean;

  // List of ancestors of this browser-object (does NOT include this object)
  readonly ancestorList: readonly ObjectItemIfc[];

  // List of all browser-objects for this object-id (including this object)
  // Each object contains its own list of ancestors, which comprises the full path
  readonly pathHeaderList: readonly ObjectItemIfc[];
  readonly pathCount: number;
  readonly selectedPathPos: number;
  readonly selectedPathHeader: ObjectItemIfc;

  // Support for scroll position restoration
  lastScrollPosDetail: number;
  lastScrollPosPath: number;
  restoreScrollPosDetail: boolean;
  restoreScrollPosPath: boolean;

  // For debugging purposes
  readonly designation: string;
  readonly objectId: string;

  previousPath(): void;
  nextPath(): void;
  firstPath(): void;

}

export class ObjectItem implements ObjectItemIfc {

  public readonly viewType: ViewType;

  public lastScrollPosDetail: number;
  public lastScrollPosPath: number;
  public restoreScrollPosDetail: boolean;
  public restoreScrollPosPath: boolean;

  private loaded: boolean;
  private readonly objLabel: ObjectLabel;
  private infoText: string;
  private parent: ObjectItem;
  private primaryRef: ObjectItem;
  private ancestorArr: ObjectItem[];
  // Together with this object, the other-object array makes up the paths
  private otherArr: ObjectItem[];
  private pathArr: ObjectItem[];
  private pathPos: number;

  private readonly setIconInd: Subject<ObjectItem>;
  private destroyInd: Subject<void>;
  private readonly traceSvc: TraceServiceDelegate;

  private readonly des: Designation;
  private readonly isRoot: boolean;

  public get objectLabel(): ObjectLabelIfc {
    return this.objLabel || ObjectLabel.empty;
  }

  public get hasParent(): boolean {
    return !this.isRoot;
  }

  public get parentRef(): ObjectItemIfc {
    return this.parent;
  }

  public get secondaryLabelEnabled(): boolean {
    return this.nameHelper.secondaryLabelEnabled;
  }

  public get description(): string {
    return this.primaryRef ? this.primaryRef.boSource.Descriptor : undefined;
  }

  public get name(): string {
    return this.primaryRef ? this.primaryRef.boSource.Name : undefined;
  }

  public get hasAlias(): boolean {
    return Boolean(this.alias); // true if non-empty string
  }

  public get alias(): string {
    const bo: BrowserObject = this.primaryRef ? this.primaryRef.boSource : undefined;
    return bo?.Attributes ? bo.Attributes.Alias : undefined;
  }

  public get hasInformationText(): boolean {
    return Boolean(this.informationText); // true if non-empty string
  }

  public get informationText(): string {
    return this.infoText;
  }

  public get ancestorList(): readonly ObjectItemIfc[] {
    return this.ancestorArr;
  }

  public get pathHeaderList(): readonly ObjectItemIfc[] {
    return this.pathArr || [];
  }

  public get pathCount(): number {
    return this.pathHeaderList.length;
  }

  public get selectedPathPos(): number {
    return this.pathPos; // zero-based
  }

  public get selectedPathHeader(): ObjectItemIfc {
    return this.pathHeaderList[this.pathPos];
  }

  public get designation(): string {
    return this.des ? this.des.designation : undefined;
  }

  public get objectId(): string {
    return this.boSource.ObjectId;
  }

  private get isDisposed(): boolean {
    return this.destroyInd === undefined;
  }

  public static comparer(a: ObjectItem, b: ObjectItem): number {
    if (!a) {
      return b ? 1 : 0;
    } else if (!b) {
      return -1;
    }
    if (a === b) {
      return 0;
    }
    let res: number = CnsHelperService.compareViewTypes(a.viewType, b.viewType);
    if (res === 0) {
      res = a.des.designationWoSystemView.localeCompare(b.des.designationWoSystemView);
    }
    return res;
  }

  public constructor(
    private readonly svc: ServiceCatalog,
    private readonly ngZone: NgZone,
    private readonly nameHelper: NameHelperIfc,
    public readonly boSource: BrowserObject,
    // This flag will be set false if the object is a member of another object's "other" or "ancestor" array
    public readonly isSourceObject: boolean) {

    if (!(nameHelper && svc && boSource && boSource.Designation)) {
      throw new Error('invalid argument');
    }
    this.traceSvc = new TraceServiceDelegate(svc.traceService, TraceModules.aboutObject);
    this.des = new Designation(boSource.Designation);
    if (!(this.des.isValid && this.des.isViewValid && this.des.isRootNodeValid)) {
      throw new Error('invalid source object');
    }
    this.isRoot = (this.des.rootNodeName === this.des.designationWoSystemView);
    this.viewType = ViewTypeConverter.toViewType(boSource.ViewType);
    this.destroyInd = new Subject<void>();
    this.objLabel = new ObjectLabel();
    this.loaded = false; // refers to object details (not including path)
    this.pathArr = undefined; // not yet read
    this.pathPos = 0;
    this.setIconInd = new Subject<ObjectItem>();
    this.setIconInd
      .pipe(
        concatMap(item => item ? item.setIcon() : of(undefined)),
        takeUntil(this.destroyInd))
      .subscribe();
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    // Dispose all sub-vms here...
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }

  public updateLabels(): void {
    // Update source-object label
    let suffix: string;
    const lArr: string[] = this.nameHelper.resolveNames(this.boSource);
    if (lArr?.length > 0 && this.isRoot && this.svc.isDistributedSystem) {
      const d: Designation = new Designation(this.boSource.Designation);
      if (d.isValid && d.rootNodeNameFull === d.designation) {
        suffix = `  (${d.systemName})`;
        lArr[0] = lArr[0] + suffix;
      }
    }
    this.objLabel.update(lArr);
    // Update labels in associated-object arrays (ancestors and other-object arrays)
    // To be safe, filter out existence of self (this) in the associated object arrays;
    // Shouldn't be there, but it would result in infinite loop if accidentally self-referenced in one of these arrays!
    if (this.ancestorArr) {
      this.ancestorArr.filter(item => item !== this).forEach(item => item.updateLabels());
    }
    if (this.otherArr) {
      this.otherArr.filter(item => item !== this).forEach(item => item.updateLabels());
    }
  }

  public setIcon(): Observable<void> {
    if (!this.boSource.Attributes) {
      return of(undefined);
    }
    const typeId: number = this.boSource.Attributes.TypeId;
    const subTypeId: number = this.boSource.Attributes.SubTypeId;
    return this.svc.iconMapperService.getGlobalIcon(TablesEx.ObjectSubTypes, subTypeId, typeId)
      .pipe(
        map(icon => {
          this.objLabel.iconCls = icon;
        }),
        catchError(err => {
          this.traceSvc.error('Failed to load icon: object-id=%s, object-type=%s, object-subtype=%s, %s', this.boSource.ObjectId, typeId, subTypeId, err);
          return of(undefined);
        }));
  }

  public readDetails(): void {
    if (this.loaded) {
      return; // already in progress or complete!
    }
    of(undefined)
      .pipe(
        tap(() => {
          this.loaded = true;
        }),
        concatMap(() => this.getInformationText()),
        concatMap(() => this.getAncestors()),
        concatMap(() => this.getPrimaryObject()),
        catchError(err => {
          this.loaded = false;
          this.traceSvc.error('Failed to read object details: objectId=%s, %s', this.objectId, err);
          return of(undefined);
        })
      )
      .subscribe();
  }

  public readPathHeaders(): void {
    if (this.pathArr) {
      return; // paths headers already loaded!
    }
    of(undefined)
      .pipe(
        tap(() => {
          // Path array always contains the source-object (this) as the first item
          this.pathArr = [];
          this.pathArr.push(this);
        }),
        concatMap(() => this.getOtherObjects()),
        tap(() => {
          this.pathArr.push(...this.otherArr);
          this.pathPos = 0;
        }),
        catchError(err => {
          this.traceSvc.error('Search for all nodes for object-id failed: objectId=%s, %s', this.objectId, err);
          return of(undefined);
        })
      )
      .subscribe();
  }

  public previousPath(): void {
    if (this.pathArr && this.pathPos > 0) {
      --this.pathPos;
      this.pathArr[this.pathPos].getAncestors().subscribe();
    }
  }

  public nextPath(): void {
    if (this.pathArr && this.pathPos + 1 < this.pathCount) {
      ++this.pathPos;
      this.pathArr[this.pathPos].getAncestors().subscribe();
    }
  }

  public firstPath(): void {
    this.pathPos = 0;
    if (this.pathArr && this.pathArr.length > 0) {
      this.pathArr[this.pathPos].getAncestors().subscribe();
    }
  }

  public findObjectInSelectedPath(item: ObjectItemIfc): ObjectItem {
    let found: ObjectItem;
    if (item && this.pathArr) {
      const pathHeader: ObjectItem = this.pathArr[this.pathPos];
      if (pathHeader) {
        found = item === pathHeader ? pathHeader : pathHeader.ancestorArr.find(i => item === i);
      }
    }
    return found;
  }

  public clearScrollRestore(): void {
    this.restoreScrollPosDetail = false;
    this.restoreScrollPosPath = false;
    // Currently, no need to recursively clear scroll restoration in ancestor-object or
    // alternate-path arrays since the flags in these subordinate objects are not used by UI.
  }

  private getInformationText(): Observable<void | string> {
    if (this.infoText !== undefined) {
      return; // if read and none found, infoText will be set to an empty string (no longer undefined)
    }
    const oid: string = this.boSource.ObjectId;
    return this.svc.objectsService.getServiceText(oid)
      .pipe(
        map(sti => sti?.ServiceText ? sti.ServiceText.InformationText : undefined),
        tap(infoText => {
          this.infoText = infoText || '';
        }),
        catchError(err => {
          this.traceSvc.error('Failed to read service-text: object-id=%s, %s', oid, err);
          return of(undefined);
        }));
  }

  private getPrimaryObject(): Observable<void> {
    if (this.primaryRef) {
      return of(undefined); // already read; no-op
    }
    if (this.viewType === ViewType.Management) {
      this.primaryRef = this; // the source-object (this) is also the "primary" object
      return of(undefined);
    }
    return of(undefined)
      .pipe(
        // Get all other browser-object related to this object-id
        concatMap(() => this.getOtherObjects()),
        tap(() => {
          if (this.otherArr) {
            // Primary object is the one in the Management view, or Application view, or this (in that order)
            this.primaryRef =
              this.otherArr.find(item => item.viewType === ViewType.Management) ||
              this.otherArr.find(item => item.viewType === ViewType.Application) ||
              this;
          }
        }));
  }

  private getOtherObjects(): Observable<void> {
    if (this.otherArr) {
      return of(undefined); // already read; no-op
    }
    const bo: BrowserObject = this.boSource;
    return of(undefined)
      .pipe(
        tap(() => {
          this.otherArr = []; // read is in progress
        }),
        concatMap(() => this.svc.systemBrowserService.searchNodes(bo.SystemId, bo.ObjectId, undefined, SearchOption.objectId, false, undefined, 100, 1)),
        map(page => page?.Nodes && page.Nodes.length > 0 ? page.Nodes : [bo]),
        map(boOtherArr => {
          this.otherArr = (boOtherArr || [])
            .filter(boOther => boOther.Designation !== bo.Designation) // don't include source-object (this) in list of other-objects!
            .map(boOther => new ObjectItem(this.svc, this.ngZone, this.nameHelper, boOther, false));
          this.otherArr.sort(ObjectItem.comparer);
        }),
        tap(() => {
          this.updateLabels();
          this.otherArr.forEach(item => this.setIconInd.next(item));
        }),
        catchError(err => {
          this.traceSvc.error('Failed to read all browser-objects: object-id=%s, %s', bo.ObjectId, err);
          return of(undefined);
        }));
  }

  private getAncestors(): Observable<void> {
    if (this.ancestorArr) {
      return of(undefined); // already read; no-op
    }
    if (this.isRoot) {
      this.ancestorArr = [];
      return of(undefined); // root-node; no ancestors
    }
    return of(undefined)
      .pipe(
        tap(() => {
          this.ancestorArr = [];
        }),
        concatMap(() => this.svc.cnsCoreService.findPathObjects(this.des.parentNodeDesignation)),
        map(boAncestorArr => {
          this.ancestorArr = (boAncestorArr || []).map(boAncestor => new ObjectItem(this.svc, this.ngZone, this.nameHelper, boAncestor, false));
          // Ancestors are returned in order with the root node first
        }),
        tap(() => {
          this.updateLabels();
          this.ancestorArr.forEach(item => this.setIconInd.next(item));
        }),
        tap(() => {
          // Establish parent reference
          const len: number = this.ancestorArr.length;
          if (len > 0) {
            this.parent = this.ancestorArr[len - 1];
          }
        }),
        catchError(err => {
          this.traceSvc.error('Failed to read ancestors: %s', err);
          return of(undefined);
        }));
  }

}
