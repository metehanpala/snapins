import { BrowserObject, Designation, SystemBrowserServiceBase, ViewNode, ViewType, ViewTypeConverter } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { AsyncSubject, from, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { Common } from '../object-manager-core-common';
import { WsiTranslator } from '../wsi-translator';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { CnsNode, CnsNodeIfc, CnsRootNode, CnsSubNode } from './cns-node';
import { AggregateViewId } from './types';

export interface AggregateViewIfc {

  readonly isDeleted: boolean;
  readonly id: AggregateViewId;
  readonly description: string;
  readonly type: ViewType;
  readonly coreViewModified: Observable<void>;
  readonly cnsViews: ViewNode[];

  isIdMatch(id: AggregateViewId): boolean;
  containsCnsView(systemName: string, cnsViewName: string): boolean;
  getCnsViewName(systemName: string): string;
  getRootNodes(): Observable<readonly CnsNodeIfc[]>;
  getChildren(parentDesignation: string): Observable<readonly CnsNodeIfc[]>;
  getNode(designation: string): Observable<CnsNodeIfc>;

}

export class AggregateView implements AggregateViewIfc {

  public cnsViews: ViewNode[];
  public roots: CnsNode[];

  private viewId: AggregateViewId;
  private deleted: boolean;
  private viewModifiedInd: Subject<void>;
  private respGetRoots: AsyncSubject<readonly CnsNodeIfc[]>;
  private readonly respMapGetChildren: Map<CnsNode, AsyncSubject<readonly CnsNodeIfc[]>>;
  private readonly _viewDeleted: string = 'view deleted';
  public get isDeleted(): boolean {
    return Boolean(this.deleted === true);
  }

  public get id(): AggregateViewId {
    return this.viewId;
  }

  public get description(): string {
    return this.id.description;
  }

  public get type(): ViewType {
    return this.id.type;
  }

  public get coreViewModified(): Observable<void> {
    return this.viewModifiedInd;
  }

  public static isAggregateMatch(x: ViewNode, y: ViewNode): boolean {
    const xId: AggregateViewId = AggregateViewId.createFromViewNode(x);
    const yId: AggregateViewId = AggregateViewId.createFromViewNode(y);
    return AggregateViewId.isEqual(xId, yId);
  }

  public static compare(locale: string, x: AggregateView, y: AggregateView): number {
    if (!x) {
      return y ? 1 : 0;
    } else if (!y) {
      return 0;
    }
    let res: number = Common.localeCompareSafe(locale, x.description, y.description, {
      sensitivity: 'base', // case insensitive
      ignorePunctuation: false,
      numeric: true // enable numeric collation, "1" < "2" < "10"
    });
    if (res === 0) {
      res = x.type - y.type;
    }
    return res;
  }

  private static compareRoots(locale: string, x: CnsNode, y: CnsNode, isByName?: boolean): number {
    if (isNullOrUndefined(x)) {
      return isNullOrUndefined(y) ? 0 : -1;
    }
    if (isNullOrUndefined(y)) {
      return 1;
    }
    const opt: Intl.CollatorOptions = {
      sensitivity: 'base', // case insensitive
      ignorePunctuation: false,
      numeric: true // enable numeric collation, "1" < "2" < "10"
    };
    let cmpVal: number = Common.localeCompareSafe(locale, x.systemName, y.systemName, opt);
    if (cmpVal === 0) {
      if (isByName) {
        cmpVal = Common.localeCompareSafe(locale, x.name, y.name, opt);
      } else {
        cmpVal = Common.localeCompareSafe(locale, x.description, y.description, opt);
      }
    }
    return cmpVal;
  }

  public constructor(
    private readonly traceSvc: TraceServiceDelegate,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly locale: string,
    private readonly localSystemName: string,
    vArr: ViewNode[],
    private readonly isChildOrderByName: boolean) {

    if (isNullOrUndefined(traceSvc) ||
        isNullOrUndefined(systemBrowserService) ||
        !vArr || vArr.length === 0) {
      throw new Error('Invalid argument');
    }
    this.respMapGetChildren = new Map<CnsNode, AsyncSubject<readonly CnsNode[]>>();
    this.viewModifiedInd = new Subject<void>();
    this.cnsViews = [];
    vArr.forEach(v => this.addCnsView(v));
  }

  public dispose(): void {
    this.markDeleted();
    this.viewModifiedInd.complete();
    this.viewModifiedInd = undefined;
  }

  public containsCnsView(systemName: string, cnsViewName: string): boolean {
    return !isNullOrUndefined(this.findCnsView(systemName, cnsViewName));
  }

  public getCnsViewName(systemName: string): string {
    const cnsView: ViewNode = this.cnsViews.find(v => v.SystemName === systemName);
    if (cnsView) {
      return cnsView.Name;
    }
  }

  public findCnsView(systemName: string, cnsViewName: string): ViewNode {
    return this.cnsViews.find(v => v.SystemName === systemName && v.Name === cnsViewName);
  }

  public findCnsViewById(systemId: number, cnsViewId: number): ViewNode {
    return this.cnsViews.find(v => v.SystemId === systemId && v.ViewId === cnsViewId);
  }

  public findCnsNode(d: Designation): CnsNode {
    let cnsNode: CnsNode;
    if (d?.isValid && d.isRootNodeValid && this.roots) {
      const systemName: string = d.systemName || this.localSystemName; // default to local system
      const pathParts: string[] = d.designationParts.slice(d.isSystemValid ? 2 : 1);
      let nextNodeArr: CnsNode[] = this.roots.filter(r => r.systemName === systemName);
      for (const pathPartsItem of pathParts) {
      // for (let idx: number = 0; idx < pathParts.length; ++idx) {
        cnsNode = nextNodeArr.find(n => n.name === pathPartsItem);
        if (cnsNode) {
          nextNodeArr = cnsNode.children || [];
        } else {
          break; // not found!
        }
      }
    }
    return cnsNode;
  }

  public isMatch(cnsView: ViewNode): boolean {
    return this.isIdMatch(AggregateViewId.createFromViewNode(cnsView));
  }

  public isIdMatch(id: AggregateViewId): boolean {
    return AggregateViewId.isEqual(this.id, id);
  }

  public getRootNodes(): Observable<readonly CnsNodeIfc[]> {
    if (this.isDeleted) {
      return throwError(new Error(this._viewDeleted));
    }
    if (this.roots) {
      return of(this.roots); // already loaded!
    }

    // Allow only a single sequence of outstanding server requests for root nodes.
    // Response is multi-cast through a Subject in case of multiple concurrent callers.
    let resp: AsyncSubject<readonly CnsNodeIfc[]> = this.respGetRoots;
    if (!resp) {
      // NOTE: An AsyncSubject is used to ensure the caller receives the last (and only)
      //  indication from the returned Observable in the case that it subscribes after
      //  the Subject completes.
      resp = new AsyncSubject<readonly CnsNodeIfc[]>();
      this.respGetRoots = resp;

      const rootArr: CnsNode[] = [];
      from(this.cnsViews)
        .pipe(
          concatMap(cnsView => this.systemBrowserService.getNodes(cnsView.SystemId, cnsView.ViewId, cnsView.Designation, this.isChildOrderByName)
            .pipe(map(boArr => (boArr || []).map(bo => new CnsRootNode(cnsView, bo))))),
          catchError(err => {
            this.traceSvc.error('Error reading root nodes: %s', err);
            return of([] as CnsRootNode[]);
          }))
        .subscribe(
          cnsRoots => {
            // Collect root nodes from each CNS view in a single array
            cnsRoots.forEach(r => rootArr.push(r));
          },
          err => {
            // Errors intercepted by `catchError` operator above
          },
          () => {
            // All calls for root nodes complete.
            // Set aggregate view roots and notify caller
            rootArr.sort((x, y) => AggregateView.compareRoots(this.locale, x, y, this.isChildOrderByName));
            this.roots = rootArr;
            this.respGetRoots.next(this.roots);
            this.respGetRoots.complete();
            this.respGetRoots = undefined;
          });
    }

    return resp;
  }

  public getChildren(parentDesignation: string): Observable<readonly CnsNodeIfc[]> {
    if (this.isDeleted) {
      return throwError(new Error(this._viewDeleted));
    }
    const d: Designation = new Designation(parentDesignation);
    const parent: CnsNode = this.findCnsNode(d);
    if (!parent) {
      return throwError(new Error('node not found'));
    }
    if (parent.isLeaf) {
      return of([]);
    }
    if (parent.children) {
      return of(parent.children); // already loaded!
    }

    // Allow only a single sequence of outstanding server requests for root nodes for a given aggregate view.
    // Response is multi-cast through a Subject in case of multiple concurrent callers.
    let resp: AsyncSubject<readonly CnsNodeIfc[]> = this.respMapGetChildren.get(parent);
    if (!resp) {
      // NOTE: An AsyncSubject is used to ensure the caller receives the last (and only)
      //  indication from the returned Observable in the case that it subscribes after
      //  the Subject completes.
      resp = new AsyncSubject<readonly CnsNodeIfc[]>();
      this.respMapGetChildren.set(parent, resp);

      const v: ViewNode = parent.cnsView;
      this.systemBrowserService.getNodes(v.SystemId, v.ViewId, parent.designation, this.isChildOrderByName)
        .pipe(
          map(boArr => (boArr || []).map(bo => new CnsSubNode(parent, bo))),
          catchError(err => {
            this.traceSvc.error('Error reading child nodes: parent=%s, %s', parent.designation, err);
            return of([] as CnsNode[]);
          }))
        .subscribe(
          nodeArr => {
            parent.children = nodeArr;
            // SPECIAL CASE: If it turns out this node has no children, it means it was incorrectly marked
            //  as a non-leaf node.  In this case, force it's status to a 'leaf' here.  One example where
            //  this can happen is when a node is loaded and is reported as having children (non-leaf). Then,
            //  before its children are loaded (by a user eventually expanding the node), the children are
            //  all deleted at the server.  The CNS indications we receive at the client when these child
            //  deletions occur do not provide enough information to determine if the parent has been rendered
            //  a 'leaf'.  We will only find out about the parent's new leaf status here when the user tries to
            //  expand the parent node only to find no children.  Obscure case, for sure, but can happen.
            if (nodeArr.length === 0) {
              parent.browserObj.HasChild = false; // it's really a leaf!
            }
            resp.next(parent.children);
            resp.complete();
            this.respMapGetChildren.delete(parent);
          });
    }

    return resp;
  }

  public getNode(designation: string): Observable<CnsNodeIfc> {
    if (this.isDeleted) {
      return throwError(new Error(this._viewDeleted));
    }
    const d: Designation = new Designation(designation);
    if (!d.isValid) {
      return of(undefined);
    }
    if (d.designation === d.rootNodeNameFull) {
      return this.getRootNodes()
        .pipe(
          map(cnsRoots => {
            const systemName: string = d.systemName || this.localSystemName;
            return cnsRoots.find(r => r.name === d.rootNodeName && r.systemName === systemName);
          }));
    } else {
      return this.getNode(d.parentNodeDesignation)
        .pipe(
          concatMap(parent => this.getChildren(parent.designation)),
          map(cnsNodes => cnsNodes.find(n => n.name === d.designationParts[d.designationParts.length - 1]))
        );
    }
  }

  public addCnsView(cnsView: ViewNode, addRoots?: boolean): void {
    if (!cnsView) {
      return;
    }
    if (this.containsCnsView(cnsView.SystemName, cnsView.Name)) {
      return; // already a member!
    }
    if (this.cnsViews.length === 0) {
      this.viewId = AggregateViewId.createFromViewNode(cnsView);
    } else {
      if (!this.isMatch(cnsView)) {
        throw new Error('Incompatible cns-view added to aggregate');
      }
    }
    this.cnsViews.push(cnsView);
    // If root nodes are to be added AND the view has been activated at least
    // once to establish a root node array, go ahead and add root nodes
    if (addRoots && this.roots) {
      this.systemBrowserService.getNodes(cnsView.SystemId, cnsView.ViewId, cnsView.Designation, this.isChildOrderByName)
        .subscribe(
          boArr => {
            (boArr || []).forEach(bo => {
              const cnsNode: CnsNode = new CnsRootNode(cnsView, bo);
              this.roots.push(cnsNode);
            });
            this.roots.sort((x, y) => AggregateView.compareRoots(this.locale, x, y, this.isChildOrderByName));
            this.notifyViewModified();
          },
          err => {
            // Failed to get root nodes! Remove newly added CNS view from set.
            const pos: number = this.cnsViews.findIndex(v => v === cnsView);
            this.cnsViews.splice(pos, 1);
          }
        );
    }
  }

  public updateCnsView(cnsView: ViewNode): void {
    if (!cnsView) {
      return;
    }
    const pos: number = this.cnsViews.findIndex(v => v.SystemName === cnsView.SystemName && v.Name === cnsView.Name);
    if (pos >= 0) {
      this.cnsViews[pos] = cnsView;
    }
  }

  public removeCnsView(systemName: string, cnsViewName: string): void {
    const pos: number = this.cnsViews.findIndex(v => v.SystemName === systemName && v.Name === cnsViewName);
    if (pos < 0) {
      return;
    }
    this.cnsViews.splice(pos, 1);
    if (this.roots) {
      // Remove root nodes belonging to the removed view
      const rootArr: CnsNode[] = this.roots.filter(r => r.cnsView.SystemName === systemName && r.cnsView.Name === cnsViewName);
      rootArr.forEach(root => {
        this.roots.splice(this.roots.findIndex(r => r === root), 1);
        root.markDeleted();
      });
      this.notifyViewModified();
    }
  }

  public removeCnsViewsForSystem(systemName: string): void {
    let view: ViewNode;
    do {
      view = this.cnsViews.find(v => v.SystemName === systemName);
      if (view) {
        this.removeCnsView(view.SystemName, view.Name);
      }
    }
    while (view);
  }

  public updateCnsNode(cnsView: ViewNode, bo: BrowserObject): void {
    if (!bo || !cnsView) {
      return;
    }
    if (!this.containsCnsView(cnsView.SystemName, cnsView.Name)) {
      throw new Error('incorrect view');
    }
    const d: Designation = new Designation(bo.Designation);
    if (!d.isValid || !d.isRootNodeValid) {
      return;
    }
    let isChanged = false;
    let cnsNode: CnsNode = this.findCnsNode(d);
    if (cnsNode) {
      // Update existing node.
      const boPrevious: BrowserObject = cnsNode.browserObj;
      // SPECIAL CASE: The WSI does not reliably send a correct `HasChild` property value
      //  in a modified node.  For this reason, we carry forward the value stored
      //  with the current node.
      bo.HasChild = boPrevious.HasChild;
      // Overwrite browser-object
      cnsNode.update(bo);
      isChanged = true;
      // SPECIAL CASE: If the node description has been modified, all descendants of this
      //  node must have their `Location` properties updated to reflect this change.
      if (bo.Descriptor !== boPrevious.Descriptor) {
        this.updateParentLocation(cnsNode.children, boPrevious.Location.length, bo.Location);
      }
    } else {
      // Treat as a new node of an existing parent.
      const isRoot: boolean = d.rootNodeNameFull === d.designation;
      if (isRoot) {
        cnsNode = new CnsRootNode(cnsView, bo);
        if (!this.roots) {
          this.roots = [];
        }
        this.roots.push(cnsNode);
        this.roots.sort((x, y) => AggregateView.compareRoots(this.locale, x, y, this.isChildOrderByName));
        isChanged = true;
      } else {
        const parent: CnsNode = this.findCnsNode(new Designation(d.parentNodeDesignation));
        if (parent) {
          cnsNode = new CnsSubNode(parent, bo);
          if (parent.isLeaf) {
            // Transition parent from a leaf node; it effectively now has its (one) children loaded
            parent.browserObj.HasChild = true;
            parent.children = [cnsNode];
            isChanged = true;
          } else {
            // Parent is not a leaf.
            // Add new node as a child only if the parent's children are already loaded; otherwise,
            // this node will be added later when/if the parent is expanded.
            if (parent.children && parent.children.length > 0) {
              parent.children.push(cnsNode); // append; no sorting (minor deficiency)
              isChanged = true;
            }
          }
        }
      }
    }
    if (isChanged) {
      this.notifyViewModified();
    }
  }

  public removeCnsNode(bo: BrowserObject): void {
    if (!bo) {
      return;
    }
    let isChanged = false;
    const d: Designation = new Designation(bo.Designation);
    const cnsNode: CnsNode = this.findCnsNode(d);
    if (!cnsNode) {
      return; // node has not yet been loaded
    }
    if (cnsNode.isRoot) {
      const pos: number = this.roots.findIndex(r => r === cnsNode);
      if (pos >= 0) {
        this.roots.splice(pos, 1);
        cnsNode.markDeleted();
        isChanged = true;
      }
    } else {
      const parent: CnsNode = cnsNode.parent;
      if (parent?.children) {
        const pos: number = parent.children.findIndex(n => n === cnsNode);
        if (pos >= 0) {
          parent.children.splice(pos, 1);
          parent.browserObj.HasChild = parent.children.length > 0;
          cnsNode.markDeleted();
          // If parent now has no children, mark it as a leaf node
          if (parent.children.length === 0) {
            parent.browserObj.HasChild = false;
          }
          isChanged = true;
        }
      }
    }
    if (isChanged) {
      this.notifyViewModified();
    }
  }

  public markDeleted(): void {
    this.deleted = true;
    if (this.roots) {
      this.roots.forEach(r => r.markDeleted());
    }
  }

  private updateParentLocation(children: CnsNode[], oldParentLocationLength: number, newParentLocation: string): void {
    if (!children) {
      return;
    }
    children.forEach(child => {
      const bo: BrowserObject = child.browserObj;
      bo.Location = newParentLocation + bo.Location.substr(oldParentLocationLength);
      this.updateParentLocation(child.children, oldParentLocationLength, newParentLocation);
    });
  }

  private notifyViewModified(): void {
    if (this.viewModifiedInd && !this.viewModifiedInd.closed) {
      this.viewModifiedInd.next();
    }
  }

}
