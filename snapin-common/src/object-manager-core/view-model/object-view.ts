import { NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { from, Observable, Observer, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { childrenLoaded, expand, expandRecursive, TreeItem } from '@simpl/element-ng';
import { BrowserObject, ChildObjectTypeAttributes, CnsLabelEn, Designation, TablesEx } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { TraceModules } from '../../shared/trace-modules';
import { AggregateViewIfc } from '../data-model/aggregate-view';
import { CreateObjectResponse, ObjectManagerCoreIfc } from '../object-manager-core';
import { AggregateViewId } from '../data-model/types';
import { CnsNodeIfc } from '../data-model/cns-node';
import { Common } from '../object-manager-core-common';
import { ItemTemplateTranslator, TreeItemData, TreeItemlLifeCycleState } from './tree-item-data';
import { ObjectManagerServiceCatalog, SelectionRequest } from './types';

export { AggregateViewId };

export interface ObjectTypeInfo {
  name: string;
  description: string;
  typeId: number;
}

class CustomData {
  public sendMessage: boolean;
  public customData: any;
}

export interface ObjectViewIfc {

  readonly id: AggregateViewId; // NOTE: will be `undefined` for custom-view
  readonly description: string;
  readonly isActive: boolean;
  readonly isSecondaryLabelEnabled: boolean;
  readonly isGenericCreationEnabled: boolean;
  readonly roots: TreeItem[];
  readonly transientItem: TreeItem;
  transientItemDescription: string;
  readonly transientItemType: string;
  readonly selectedItems: readonly TreeItem[];
  readonly selectedItemCreatableTypes: readonly ObjectTypeInfo[];
  readonly selectedItemIsDeletable: boolean;
  readonly selectedItemChangedInternal: Observable<CustomData>;
  readonly viewStateChanged: Observable<void>;
  readonly dataChangedUndetected: Observable<void>;
  readonly viewReattached: Observable<void>;
  readonly loading: Observable<boolean>;

  activate(ds: DomSanitizer): Observable<void>;
  deactivate(): void;
  getChildren(tiParent: TreeItem): Observable<TreeItem[]>;
  newItem(tiParent: TreeItem, omName: string): Observable<boolean>;
  newItemSave(): Observable<CreateObjectResponse>;
  modifyItem(ti: TreeItem): boolean;
  modifyItemSave(cnsDescription: string): Observable<boolean>;
  deleteItem(ti: TreeItem): Observable<boolean>;
  cancelEdit(): void;
  clearSelectedItems(): void;
  updateSelectedItems(): void;
  processReattach(): void;

}

export abstract class ObjectView implements ObjectViewIfc {

  public transientItemDescription: string;

  private active: boolean;
  private rootArr: TreeItem[];
  private currentCnsLabel: CnsLabelEn;
  private selectedItemArr: TreeItem[];
  private selectedItemCreatableTypeArr: ObjectTypeInfo[];
  private selectedItemIsDeletableFlag: boolean;
  private transItem: TreeItem;
  private transItemOmName: string;
  private pendingSelection: SelectionRequest;
  private retrySelection: string;

  protected destroyInd: Subject<void>;
  protected traceSvcResync: TraceServiceDelegate;
  private readonly loadingInd: Subject<boolean>;
  private readonly selectedItemChangedInternalInd: Subject<CustomData>;
  private readonly viewStateChangedInd: Subject<void>;
  private readonly dataChangedUndetectedInd: Subject<void>;
  private readonly activationStateChangedInd: Subject<ObjectView>;
  private readonly viewReattachedInd: Subject<void>;
  private readonly setIconInd: Subject<TreeItem>;
  private readonly getObjectInfoInd: Subject<void>;
  private domSanitizer: DomSanitizer;

  protected readonly resyncDelayMs: number = 1000;

  public abstract get id(): AggregateViewId;

  public abstract get description(): string;

  public get roots(): TreeItem[] {
    return this.rootArr || [];
  }

  public get isActive(): boolean {
    return Boolean(this.active);
  }

  protected get isDisposed(): boolean {
    return this.destroyInd === undefined;
  }

  public get isSecondaryLabelEnabled(): boolean {
    return (this.currentCnsLabel === CnsLabelEn.DescriptionAndName ||
      this.currentCnsLabel === CnsLabelEn.DescriptionAndAlias ||
      this.currentCnsLabel === CnsLabelEn.NameAndDescription ||
      this.currentCnsLabel === CnsLabelEn.NameAndAlias);
  }

  public get selectedItems(): readonly TreeItem[] {
    return this.selectedItemArr || [];
  }

  public get selectedItemCreatableTypes(): readonly ObjectTypeInfo[] {
    if (this.isGenericCreationEnabled) {
      return this.selectedItemCreatableTypeArr || [];
    }
    return undefined;
  }

  public get selectedItemIsDeletable(): boolean {
    return this.selectedItemIsDeletableFlag;
  }

  public get isGenericCreationEnabled(): boolean {
    return !isNullOrUndefined(this.creatableTypesFilter);
  }

  public get transientItem(): TreeItem {
    return this.transItem;
  }

  public get transientItemType(): string {
    return this.transItemOmName;
  }

  public get loading(): Observable<boolean> {
    return this.loadingInd;
  }

  public get activationStateChanged(): Observable<ObjectView> {
    return this.activationStateChangedInd;
  }

  public get selectedItemChangedInternal(): Observable<CustomData> {
    return this.selectedItemChangedInternalInd;
  }

  public get viewStateChanged(): Observable<void> {
    return this.viewStateChangedInd;
  }

  public get viewReattached(): Observable<void> {
    return this.viewReattachedInd;
  }

  public get dataChangedUndetected(): Observable<void> {
    return this.dataChangedUndetectedInd;
  }

  private get isInitialized(): boolean {
    return !isNullOrUndefined(this.rootArr);
  }

  protected constructor(
    protected traceSvc: TraceServiceDelegate,
    protected svcBlk: ObjectManagerServiceCatalog,
    protected readonly vmId: string,
    protected locale: string,
    protected ngZone: NgZone,
    protected core: ObjectManagerCoreIfc,
    protected itemTemplateTranslator: ItemTemplateTranslator,
    protected selectableTypesFilter: string[],
    protected creatableTypesFilter: string[]) {
    if (!(traceSvc && svcBlk && core)) {
      throw new Error('invalid argument');
    }
    this.destroyInd = new Subject<void>();
    this.loadingInd = new Subject<boolean>();
    this.selectedItemChangedInternalInd = new Subject<CustomData>();
    this.viewStateChangedInd = new Subject<void>();
    this.viewReattachedInd = new Subject<void>();
    this.dataChangedUndetectedInd = new Subject<void>();
    this.activationStateChangedInd = new Subject<ObjectView>();
    this.setIconInd = new Subject<TreeItem>();
    this.getObjectInfoInd = new Subject<void>();
    this.traceSvcResync = new TraceServiceDelegate(this.traceSvc.native, TraceModules.objectManagerViewResync, `[${vmId}]`);
    // Subscribe to internal requests to set icons.
    // Icons to load are queued up by passing them through the following subscription
    // using a `setIconInd.next(ti)` call.  Each request indication generated is serialized
    // by the `concatMap` operator through the `loadIcons` method.  This is important since the first
    // call will access the server for the map of all icons; subsequent calls will then be handled locally.
    this.setIconInd
      .pipe(
        concatMap(ti => this.setIcon(ti)),
        takeUntil(this.destroyInd))
      .subscribe();
    // Subscribe to internal requests to update object-info for new selections
    // This is handled through a subscription all within this class (rather than a direct function
    // call on each selection change) so that updates to the selection info can be debounced
    // in the event of a rapid burst of selection changes.
    this.getObjectInfoInd
      .pipe(
        debounceTime(500),
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.onGetSelectedItemObjectInfo();
        });
    // Initialize current CNS label format and subscribe for application-wide changes to this setting
    this.currentCnsLabel = this.svcBlk.cnsHelperService.activeCnsLabelValue ?
      this.svcBlk.cnsHelperService.activeCnsLabelValue.cnsLabel :
      CnsLabelEn.DescriptionAndName;
    this.svcBlk.cnsHelperService.activeCnsLabel
      .pipe(
        filter(label => !isNullOrUndefined(label) && label.cnsLabel !== this.currentCnsLabel),
        debounceTime(100),
        takeUntil(this.destroyInd))
      .subscribe(
        label => {
          this.currentCnsLabel = label.cnsLabel;
          if (this.rootArr) {
            this.rootArr.forEach(r => this.updateDisplayLabels(r, true));
          }
        }
      );
  }

  public initialize(): Observable<void> {
    if (this.isInitialized) {
      return of(undefined);
    }
    return this.initializeSub()
      .pipe(
        tap(() => {
          this.loadingInd.next(true);
        }),
        concatMap(() => this.resolveRootNodes()),
        map(cnsRoots => this.createTreeItems(cnsRoots)),
        map(tiRoots => {
          this.rootArr = tiRoots;
          this.rootArr.forEach(r => this.setIconInd.next(r));
        }),
        // If the root array contains one-and-only-one node, get its children and expand it
        concatMap(() => {
          if (this.rootArr && this.rootArr.length === 1) {
            return this.getChildren(this.rootArr[0]);
          }
          return of(undefined);
        }),
        map(tiChildren => {
          if (tiChildren && tiChildren.length > 0) {
            expand(this.rootArr[0]);
            this.viewStateChangedInd.next();
          }
        }),
        catchError(() => of(undefined)),
        finalize(() => {
          this.loadingInd.next(false);
        })
      );
  }
  protected abstract initializeSub(): Observable<void>;

  public activate(ds: DomSanitizer): Observable<void> {
    if (this.isDisposed) {
      return throwError(new Error('view has been disposed'));
    }
    if (!ds) {
      return throwError(new Error('undefined argument'));
    }
    this.domSanitizer = ds;
    return this.initialize()
      .pipe(
        concatMap(() => this.activateSub()),
        tap(() => {
          this.active = true;
          this.activationStateChangedInd.next(this);
          this.setSelectedItem(this.pendingSelection);
        })
      );
  }
  protected abstract activateSub(): Observable<void>;

  public deactivate(): void {
    this.deactivateSub();
    this.clearPendingSelection();
    this.active = false;
    this.activationStateChangedInd.next(this);
  }
  protected abstract deactivateSub(): void;

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.disposeSub();
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }
  protected abstract disposeSub(): void;

  public updateSelectedItems(): void {
    this.updateSelectedItemAttributes();
  }

  public processReattach(): void {
    this.viewReattachedInd.next(undefined);
  }

  public abstract isNodeInScope(d: Designation): boolean;

  protected abstract resolveRootNodes(): Observable<CnsNodeIfc[]>;

  protected abstract cnsNodeToView(cnsNode: CnsNodeIfc): AggregateViewIfc;

  public newItem(tiParent: TreeItem, omName: string): Observable<boolean> {
    let clearTransientFlag: boolean;
    return of(undefined)
      .pipe(
        tap(() => {
          clearTransientFlag = isNullOrUndefined(this.transItem); // if no transient at start of execution, be sure to clear on error!
          this.createTreeItemTransient(tiParent, omName);
        }),
        concatMap(() => this.getChildren(tiParent)),
        map(tiChildren => {
          if (!tiParent.children) {
            tiParent.children = [];
          }
          tiParent.children.push(this.transItem);
          // Update the parent after adding children in case it was previously a leaf node!
          if (isNullOrUndefined(tiParent.state) || tiParent.state === 'leaf') {
            tiParent.state = 'collapsed';
          }
          expand(tiParent);
          this.clearSelectedItems();
          this.viewStateChangedInd.next();
          return true;
        }),
        tap(() => {
          // Set the initial object type for the transient item and load an icon for it
          const typeId: number = this.getObjectTypeFromObjectModelName(omName);
          if (this.transItem && !isNaN(typeId)) {
            TreeItemData.extract(this.transItem).iconObjectType = typeId;
            TreeItemData.extract(this.transItem).iconObjectSubType = undefined; // will be refined on update, if necessary
            this.setIconInd.next(this.transItem);
          }
        }),
        catchError(err => {
          if (clearTransientFlag) {
            this.clearTransient();
          }
          this.traceSvc.error('Failed to create new tree-item: %s', err);
          return of(false);
        })
      );
  }

  public newItemSave(): Observable<CreateObjectResponse> {
    let tiData: TreeItemData;
    let tiDataParent: TreeItemData;
    const emptyResp: CreateObjectResponse = {};
    return of(undefined)
      .pipe(
        tap(() => {
          if (!this.transItem) {
            throw new Error('no transient item to save');
          }
          tiData = TreeItemData.extract(this.transItem);
          tiDataParent = TreeItemData.extract(this.transItem.parent);
          if (tiData.lifeCycleState !== TreeItemlLifeCycleState.New) {
            throw new Error('cannot create item not in a new state');
          }
          if (!tiDataParent.cnsNode) {
            throw new Error('cannot create item with transient parent');
          }
          tiData.markSyncPending(this.itemTemplateTranslator);
          tiData.createLocation = `${tiDataParent.cnsNode.browserObj.Location}.${this.transientItemDescription}`;
        }),
        concatMap(() => this.core.createObject(this.transItemOmName, tiDataParent.cnsNode, this.transientItemDescription)),
        catchError(err => {
          this.traceSvc.error('Error creating object: om=%s, cnsDesc=%s, parent=%s, %s',
            this.transItemOmName,
            this.transientItemDescription,
            tiDataParent.cnsNode.designation,
            err);
          return of(emptyResp);
        }),
        tap(resp => {
          if (!resp.browserObj) {
            // Failed to create new object
            // Remove the newly created (and un-saved) transient tree-item
            // // and reset selection to parent node
            this.deleteTreeItemTransient();
            // if (tiDataParent.cnsNode) {
            //   this.expandToAndSelect(tiDataParent.cnsNode.designation);
            // }
          }
        })
      );
  }

  public modifyItem(ti: TreeItem): boolean {
    return false; // not yet supported
  }

  public modifyItemSave(cnsDescription: string): Observable<boolean> {
    return of(false); // not yet supported
  }

  public deleteItem(ti: TreeItem): Observable<boolean> {
    return of(false); // not yet supported
  }

  public cancelEdit(): void {
    if (!this.transItem) {
      return;
    }
    const ti: TreeItem = this.transItem;
    const tiData: TreeItemData = TreeItemData.extract(ti);
    if (tiData.lifeCycleState === TreeItemlLifeCycleState.New) {
      this.deleteTreeItemTransient();
    } else if (tiData.lifeCycleState === TreeItemlLifeCycleState.Modify) {
      // NOTE: We don't support modify yet; this is what the logic might look like
      // tiData.markModifyCancelled(this.itemTemplateTranslator);
      // this.updateTreeItem(this.transItem);
      // this.clearTransient();
    } else {
      this.traceSvc.warn('Transient tree-item not in a cancellable state');
    }
  }

  public getChildren(tiParent: TreeItem): Observable<TreeItem[]> {
    const tiArrEmpty: TreeItem[] = [];
    if (!tiParent) {
      return of(tiArrEmpty);
    }
    if (childrenLoaded(tiParent)) {
      return of(tiParent.children || tiArrEmpty);
    }
    const cnsParent: CnsNodeIfc = TreeItemData.extract(tiParent).cnsNode;
    const view: AggregateViewIfc = this.cnsNodeToView(cnsParent);
    if (!view) {
      return of(tiArrEmpty);
    }
    return view.getChildren(cnsParent.designation)
      .pipe(
        map(cnsChildren => this.createTreeItems(cnsChildren.slice(0), tiParent)),
        map(tiChildren => {
          tiParent.children = tiChildren;
          // Update is necessary to ensure the parent's 'leaf' status is consistent with its new child status
          this.updateTreeItem(tiParent);
          tiParent.children.forEach(ti => this.setIconInd.next(ti));
          return tiParent.children;
        }),
        catchError(err => {
          this.traceSvc.error('Error getting children: parent=%s, %s', cnsParent.designation, err);
          return of(tiArrEmpty);
        }));
  }

  public getTreeItem(designation: string): Observable<TreeItem> {
    const d: Designation = new Designation(designation);
    if (!this.isInitialized || !this.isNodeInScope(d)) {
      return of(undefined);
    }
    const systemName: string = d.systemName || this.core.localSystemName;
    // Check if this designation is a root node of the view
    const tiRoot: TreeItem = this.roots.find(r => {
      const cnsRoot: CnsNodeIfc = TreeItemData.extract(r).cnsNode;
      const dRoot: Designation = new Designation(cnsRoot.designation);
      return cnsRoot.systemName === systemName && dRoot.designationWoSystem === d.designationWoSystem;
    });
    // If found in the root tree-item array, return it
    if (tiRoot) {
      return of(tiRoot);
    }
    // Otherwise, get the child tree-item array of the parent, and search it for a match
    return this.getTreeItem(d.parentNodeDesignation)
      .pipe(
        concatMap(tiParent => this.getChildren(tiParent)),
        map(tiArr => {
          const ti: TreeItem = tiArr.find(item => {
            const cnsNode: CnsNodeIfc = TreeItemData.extract(item).cnsNode;
            return cnsNode.name === d.designationParts[d.designationParts.length - 1];
          });
          return ti;
        })
      );
  }

  public clearPendingSelection(): void {
    if (this.pendingSelection) {
      this.traceSvc.debug('Pending selection for view cleared: selection=%s', this.pendingSelection.selection);
    }
    this.pendingSelection = undefined;
    this.retrySelection = undefined;
  }

  public setSelectedItem(req: SelectionRequest): void {
    if (!req) {
      return;
    }
    if (!this.isActive) {
      // View-model is not ready to process selection; mark as pending until activation
      if (this.pendingSelection && this.pendingSelection.priority > req.priority) {
        this.traceSvc.debug('Internal selection of higher priority already pending; request ignored');
      } else {
        this.traceSvc.debug('View-model inactive; internal selection set as pending');
        this.pendingSelection = req;
      }
    } else {
      // Any time an explict selection request is received, this will cancel (override) any
      // pending selections.
      this.clearPendingSelection();
      // Process internal selection request
      this.expandToAndSelect(req.selection, req.sendMessage, req.customData);
    }
  }

  public expandToAndSelect(designation: string, sendMessage: boolean, customData?: any): void {
    this.traceSvc.debug('Expand-to and select: %s, sendMessage=%s', designation, sendMessage);
    // NOTE: Decision was made to expand internally selected node in ALL cases (not just in the case where
    //  the node is a root node).  Leaving the original code in case this decision is reversed in the future.
    // let expandSelectedItem: boolean = false;
    let expandSelectedItem = true; // Expand ALL internally selected nodes, by default
    if (!designation) {
      designation = this.getRootDesignation();
      expandSelectedItem = true; // special case if we are selecting a root node!  (not so special anymore.. see above comment)
    }
    const d: Designation = new Designation(designation);
    if (!d.isValid) {
      return;
    }
    // Get the tree-item matching the designation
    // View children will be loaded from the root out to the designation
    this.getTreeItem(d.designation)
      .pipe(
        concatMap(ti => {
          // If we are to expand this item, too, we need to go one step further and load its children
          if (expandSelectedItem) {
            return this.getChildren(ti).pipe(map((tiArr => ti))); // make sure to always pass along the target tree-item!
          } else {
            return of(ti);
          }
        })
      )
      .subscribe(
        ti => {
          if (ti) {
            // Tree-item loaded, expand the tree to its location (selected item expanded optionally)
            expandRecursive(ti);
            if (expandSelectedItem) {
              expand(ti); // has no effect on leaf nodes
            }
            // Mark this and only this item as selected
            this.clearSelectedItems();
            if (ti.selectable) {
              ti.selected = true;
              ti.active = true;
            }
            this.updateSelectedItemAttributes();
            // Tree-item expansion results in a view state change
            this.viewStateChangedInd.next();
            // Notify that a selection was executed internally.
            // The boolean flag sent indicates whether a `selection` message should be sent to other
            // SNIs based on this state change.
            // Messages of this type may be suppressed for different reasons--the original selection request
            // was not able to be fully resolved, the requestor is just trying to update the tree to match
            // a select message already sent, etc.
            this.selectedItemChangedInternalInd.next({ sendMessage, customData });
          } else {
            if (sendMessage) {
              // In the event this is a request to select a newly created object, we will buffer this
              // request and try again after the next CNS change indication is received.
              // This buffer is cleared if a request for a new selection is received.
              this.retrySelection = d.designation;
              this.traceSvc.info('Expand-to and select tree-item not found; retry later on CNS change indication: %s', this.retrySelection);
            }
            // Tree-item not found, try to expand to its parent (if it is not a root node),
            // but don't mark it as a selection to generate a send message for (i.e., sendMessage param set to FALSE)!
            if (d.rootNodeNameFull !== d.designation) {
              this.expandToAndSelect(d.parentNodeDesignation, false);
            }
          }
        }
      );
  }

  public clearSelectedItems(): void {
    if (this.rootArr) {
      this.rootArr.forEach(tiRoot => this.clearSelectedItemsRecursive(tiRoot));
    }
    this.selectedItemArr = [];
    this.selectedItemCreatableTypeArr = [];
  }

  public updateSelectedItemAttributes(): void {
    // Update selected item array exposed to view
    this.selectedItemArr = [];
    if (this.rootArr) {
      this.rootArr.forEach(r => this.selectedItemArr.push(...this.getSelectedItemsRecursive(r)));
    }
    // If object creation is enabled, update creation related info for new selection context
    this.selectedItemCreatableTypeArr = []; // clear old selection info while gathering new info from the server!
    this.selectedItemIsDeletableFlag = false;
    if (this.isGenericCreationEnabled) {
      this.getObjectInfoInd.next(); // do this work through an rxjs subscription so it can be debounced!
    }
  }

  public onGetSelectedItemObjectInfo(): void {
    this.selectedItemIsDeletableFlag = false;
    this.selectedItemCreatableTypeArr = [];
    if (this.selectedItemArr.length !== 1) {
      return;
    }
    const selectedCnsNode: CnsNodeIfc = TreeItemData.extract(this.selectedItemArr[0]).cnsNode;
    if (!selectedCnsNode) {
      return; // this is a transient item, has not been written to the server yet (no DP yet created!)
    }
    const selectedItemArrAtTimeOfCheck: TreeItem[] = this.selectedItemArr;
    this.core.getObjectInfo(selectedCnsNode).subscribe(
      info => {
        if (this.selectedItemArr === selectedItemArrAtTimeOfCheck) {
          this.selectedItemCreatableTypeArr = [];
          this.selectedItemIsDeletableFlag = false;
          if (info) {
            this.selectedItemIsDeletableFlag = info.IsGenericDeleteAllowed;
            const allowedTypes: string[] = this.creatableTypesFilter || [];
            const creatableTypes: ChildObjectTypeAttributes[] = info.ChildObjects || [];
            creatableTypes
              .filter(otAttr =>
                otAttr?.Name &&
                otAttr.IsGenericCreateAllowed &&
                allowedTypes.some(t => t === otAttr.Name))
              .forEach(otAttr => {
                this.selectedItemCreatableTypeArr.push({
                  name: otAttr.Name,
                  description: otAttr.Description || info.Name, // use raw om-name if description is not provided!
                  typeId: otAttr.TypeId
                });
              });
          }
        }
      }
    );
  }

  protected resyncView(): void {
    if (!this.rootArr) {
      return;
    }
    this.traceSvcResync.info('Resync initiated: view=%s', this.id ? this.id.description : '<custom>');
    this.resolveRootNodes().subscribe(
      cnsRoots => {
        this.resyncChildren(cnsRoots);
        this.traceSvcResync.info('Resync complete: view=%s', this.id ? this.id.description : '<custom>');
        // If there is a newly created tree-item that is pending a CNS node creation at the server
        // and confirmation of that created node has been received with this latest update,
        // auto-select it here.
        const tiData: TreeItemData = this.transItem ? TreeItemData.extract(this.transItem) : undefined;
        if (tiData && tiData.lifeCycleState === TreeItemlLifeCycleState.InSync) {
          this.traceSvcResync.info('Clear transient node after resync: label=%s', this.transItem.label);
          this.clearTransient();
          this.expandToAndSelect(tiData.cnsNode.designation, true);
        // If there is an internal selection request that could not be fully processed possiby because
        // the CNS node was yet to be created and indicated by the server (scenario is when a SNI creates
        // and then requests selection of a new object), retry the selection of this node now.
        } else if (this.retrySelection) {
          const sel: string = this.retrySelection;
          this.traceSvcResync.info('Retry pending selection after resync: %s', sel);
          this.clearPendingSelection();
          this.expandToAndSelect(sel, true);
        } else {
          this.traceSvcResync.info('Re-evaluate selected items after resync');
          this.updateSelectedItems();
        }
      },
      err => {
        this.traceSvc.error('Error reading root nodes on view resync: %s', err);
      }
    );
  }

  private resyncChildren(cnsNodeArr: readonly CnsNodeIfc[], tiParent?: TreeItem): void {
    this.traceSvcResync.debug('Resync %s...', tiParent ? `children of ${tiParent.label}` : `<root-items>`);

    // Establish array of tree-items to be synced.
    // If a parent has been provided, resynchronization will be performed on its children;
    // If no parent has been provided, resynchronization will be performed on the root tree-item array.
    const tiArr: TreeItem[] = tiParent ? tiParent.children : this.rootArr;

    // Remove all tree-items referencing deleted nodes
    const tiDeletedArr: TreeItem[] = tiArr.filter(ti => {
      const cnsNode: CnsNodeIfc = TreeItemData.extract(ti).cnsNode;
      return cnsNode?.isDeleted ? true : false;
    });
    tiDeletedArr.forEach(tiDeleted => {
      this.traceSvcResync.debug('  delete tree-item: %s', tiDeleted.label);
      const pos: number = tiArr.findIndex(ti => ti === tiDeleted);
      tiArr.splice(pos, 1);
      // Be sure to delete any child node that is in a transient state and cancel the open edit operation!
      this.deleteTransientChild(tiDeleted);
    });
    // Update/add tree-items from current node list
    const tiIconReloadArr: TreeItem[] = [];
    const tiChildrenLoadedArr: TreeItem[] = [];
    const tiExistingArr: TreeItem[] = tiArr.filter(item => TreeItemData.extract(item).cnsNode); // node assignment
    const tiNewArr: TreeItem[] = tiArr.filter(item => !TreeItemData.extract(item).cnsNode); // no node assigment yet
    cnsNodeArr.forEach((cnsNode, idx) => {
      let ti: TreeItem = tiExistingArr.find(item => TreeItemData.extract(item).cnsNode.designation === cnsNode.designation);
      if (!ti) {
        // Check if the cns-node is associated with a new tree-item added in the client
        ti = tiNewArr.find(item => TreeItemData.extract(item).createLocation === cnsNode.browserObj.Location);
      }
      if (ti) {
        // Update existing tree-item (this could be an existing or newly created item!)
        this.traceSvcResync.debug('  update tree-item: %s', ti.label);
        const tiData: TreeItemData = TreeItemData.extract(ti);
        if (tiData.iconObjectType !== cnsNode.browserObj.Attributes.TypeId ||
          tiData.iconObjectSubType !== cnsNode.browserObj.Attributes.SubTypeId) {
          tiIconReloadArr.push(ti); // object-type/subtype change; icon to be reloaded
        }
        tiData.setCnsNode(cnsNode, this.itemTemplateTranslator);
        this.updateTreeItem(ti);
        if (childrenLoaded(ti)) {
          tiChildrenLoadedArr.push(ti); // children to be resync'ed
        }
      } else {
        // Indication of new node added server-side
        ti = this.createTreeItem(cnsNode, tiParent);
        this.traceSvcResync.debug('  create tree-item: %s', ti.label);
        tiArr.splice(idx, 0, ti);
        tiIconReloadArr.push(ti);
      }
    });
    // Remove any tree-items that are non-selectable leaf nodes
    const tiHideableLeafArr: TreeItem[] = tiArr.filter(ti => this.isHideableLeaf(ti));
    tiHideableLeafArr.forEach(tiLeaf => {
      this.traceSvcResync.debug('  hide leaf tree-item: %s', tiLeaf.label);
      const pos: number = tiArr.findIndex(ti => ti === tiLeaf);
      tiArr.splice(pos, 1);
    });
    // Update the parent after removing/adding children in case it has now become a leaf node!
    this.updateTreeItem(tiParent);
    // View modification results in a view state change
    this.viewStateChangedInd.next();
    // Reload icons for any tree-items with updated object-types
    tiIconReloadArr.forEach(ti => this.setIconInd.next(ti));
    // Recursively resync the children of all tree-items encountered that have previously loaded children;
    // If a tree-item is marked as having children (a non-lead node) but those children have yet to be loaded
    // (because the item has never been expanded), there is nothing to resynchronize!
    tiChildrenLoadedArr.forEach(ti => {
      const cnsNode: CnsNodeIfc = TreeItemData.extract(ti).cnsNode;
      const view: AggregateViewIfc = this.cnsNodeToView(cnsNode);
      if (view) {
        view.getChildren(cnsNode.designation)
          .subscribe(
            cnsNodes => {
              this.resyncChildren(cnsNodes, ti);
            });
      }
    });
  }

  private deleteTransientChild(tiParent: TreeItem): void {
    if (!(this.transItem && tiParent && tiParent.children)) {
      return;
    }
    tiParent.children.forEach(ti => {
      if (ti === this.transItem) {
        this.clearTransient(); // tranient item's parent was deleted!
      } else {
        this.deleteTransientChild(ti);
      }
    });
  }

  private getObjectTypeFromObjectModelName(omName: string): number {
    let typeId: number;
    if (this.selectedItemCreatableTypeArr) {
      const creatableType: ObjectTypeInfo = this.selectedItemCreatableTypeArr.find(type => type.name === omName);
      if (creatableType) {
        typeId = creatableType.typeId;
      }
    }
    return typeId;
  }

  private getSelectedItemsRecursive(ti: TreeItem): TreeItem[] {
    const tiArr: TreeItem[] = [];
    if (ti) {
      if (ti.selected) {
        tiArr.push(ti);
      }
      if (ti.children) {
        ti.children.forEach(tiChild => tiArr.push(...this.getSelectedItemsRecursive(tiChild)));
      }
    }
    return tiArr;
  }

  private clearSelectedItemsRecursive(ti: TreeItem): void {
    if (ti) {
      ti.selected = false;
      ti.active = false;
      if (ti.children) {
        ti.children.forEach(tiChild => this.clearSelectedItemsRecursive(tiChild));
      }
    }
  }

  private isObjectModelFilterMatch(cnsNode: CnsNodeIfc): boolean {
    if (!cnsNode) {
      return false;
    }
    if (!this.selectableTypesFilter || this.selectableTypesFilter.length === 0) {
      return true; // object-model filter not set
    }
    const omName: string = cnsNode.browserObj.Attributes ? cnsNode.browserObj.Attributes.ObjectModelName : undefined;
    return this.selectableTypesFilter.some(val => val === omName);
  }

  private isHideableLeaf(ti: TreeItem): boolean {
    if (!(this.selectableTypesFilter && this.selectableTypesFilter.length > 0)) {
      return false; // if a selectable types filter is not in use, nothing should be hidden!
    }
    if (!(ti?.state === 'leaf')) {
      return false;
    }
    if (ti.selectable) {
      return false;
    }
    if (ti === this.transItem) {
      return false;
    }
    const tiData: TreeItemData = TreeItemData.extract(ti);
    const cnsNode: CnsNodeIfc = tiData.cnsNode;
    if (!cnsNode) {
      return false;
    }
    const omName: string = cnsNode.browserObj.Attributes ? cnsNode.browserObj.Attributes.ObjectModelName : undefined;
    if (this.creatableTypesFilter?.some(t => t === omName)) {
      return false;
    }
    // Leaf nodes can be hidden in the tree if they are not selectable, not of a creatable type, and
    // not the item currently being edited/created.
    return true;
  }

  private getRootDesignation(systemName?: string): string {
    let designation: string;
    systemName = systemName || this.core.localSystemName;
    if (this.rootArr) {
      const tiRoot: TreeItem = this.roots.find(r => TreeItemData.extract(r).cnsNode.systemName === systemName);
      if (tiRoot) {
        designation = TreeItemData.extract(tiRoot).cnsNode.designation;
      }
    }
    return designation;
  }

  private createTreeItems(cnsNodeArr: CnsNodeIfc[], tiParent?: TreeItem): TreeItem[] {
    let tiArr: TreeItem[];
    if (cnsNodeArr) {
      tiArr = cnsNodeArr
        .map(cnsNode => {
          let ti: TreeItem;
          try {
            ti = this.createTreeItem(cnsNode, tiParent);
            if (this.isHideableLeaf(ti)) {
              // Do not add to list a tree-item that is a hideable leaf node!
              ti = undefined;
            }
          } catch (err) {
            this.traceSvc.error('Failed to create tree-item for cns-node: node=%s, %s', cnsNode.designation, err);
          }
          return ti;
        })
        .filter(ti => !isNullOrUndefined(ti));
    }
    return tiArr || [];
  }

  // Used when a new tree-item is created by reconciliation with server-side data (there is an existing CNS node behind it)
  private createTreeItem(cnsNode: CnsNodeIfc, tiParent?: TreeItem): TreeItem {
    if (!cnsNode || !cnsNode.browserObj) {
      throw new Error('missing browser-object');
    }
    if (!cnsNode.browserObj.Attributes) {
      throw new Error('missing browser-object attributes');
    }
    const ti: TreeItem = {
      parent: tiParent,
      level: tiParent?.level + 1
    };
    const tiData: TreeItemData = TreeItemData.create(ti, cnsNode, this.itemTemplateTranslator);
    // Sanity check:
    // TreeItemData must always be accessible from the tree-item provided on creation
    if (tiData !== TreeItemData.extract(ti)) {
      throw new Error('internal error');
    }
    ti.icon = Common.transparentIcon;
    tiData.iconObjectType = undefined;
    tiData.iconObjectSubType = undefined;
    this.updateTreeItem(ti);
    return ti;
  }

  private updateTreeItem(ti: TreeItem): void {
    if (!ti) {
      return;
    }
    this.updateDisplayLabels(ti, false);
    const cnsNode: CnsNodeIfc = TreeItemData.extract(ti).cnsNode;
    const bo: BrowserObject = cnsNode.browserObj;
    if (bo.HasChild) {
      if (isNullOrUndefined(ti.state) || ti.state === 'leaf') {
        ti.state = 'collapsed';
      }
    } else {
      ti.state = 'leaf';
      ti.children = [];
    }
    ti.selectable = this.isObjectModelFilterMatch(cnsNode);
  }

  // Used when a new tree-item is created through client-side editing (no cns-node for tree-item yet)
  private createTreeItemTransient(tiParent: TreeItem, omName: string): void {
    if (!tiParent) {
      // Consider allowing this in the future; not a use-case currently
      throw new Error('cannot create new root nodes');
    }
    if (this.transItem) {
      throw new Error('multiple transient tree-items not allowed');
    }
    const ti: TreeItem = {
      parent: tiParent,
      level: tiParent?.level + 1
    };

    const tiData: TreeItemData = TreeItemData.create(ti, undefined, this.itemTemplateTranslator);
    // Sanity check:
    // TreeItemData must always be accessible from the tree-item provided on creation
    if (tiData !== TreeItemData.extract(ti)) {
      throw new Error('internal error');
    }
    // Initial value of tree-item data
    // This will be filled in by the view layer (through data-binding to this tree-item) and
    // ultimately written to the server on a call to the `saveItem` method.
    ti.icon = Common.transparentIcon;
    tiData.iconObjectType = undefined;
    tiData.iconObjectSubType = undefined;
    ti.label = '';
    ti.dataField1 = '';
    ti.dataField2 = '';
    ti.state = 'leaf';
    ti.children = [];
    ti.selectable = false;
    this.transItem = ti;
    this.transItemOmName = omName;
    this.transientItemDescription = undefined;
  }

  private deleteTreeItemTransient(): void {
    if (!this.transItem) {
      return;
    }
    const ti: TreeItem = this.transItem;
    const tiData: TreeItemData = TreeItemData.extract(ti);
    const tiParent: TreeItem = ti.parent;
    // Remove transient tree-item
    const pos: number = tiParent.children.findIndex(item => item === ti);
    if (pos >= 0) {
      tiParent.children.splice(pos, 1);
    }
    this.clearTransient();
    // Update the parent after removing/adding children in case it has now become a leaf node!
    this.updateTreeItem(tiParent);
    // View modification results in a view state change
    this.viewStateChangedInd.next();
  }

  private clearTransient(): void {
    this.transItem = undefined;
    this.transItemOmName = undefined;
    this.transientItemDescription = undefined;
  }

  private updateDisplayLabels(ti: TreeItem, recurse: boolean): void {
    if (!ti) {
      return;
    }
    let labels: string[] = [];
    const cnsNode: CnsNodeIfc = TreeItemData.extract(ti).cnsNode;
    const bo: BrowserObject = cnsNode.browserObj;
    if (bo) {
      labels = this.svcBlk.cnsHelperService.getCnsLabelsOrdered(bo) || [];
    }
    const labelSuffix: string = this.createTreeItemLabelSuffix(cnsNode);
    ti.label = labels.length > 0 ? labels[0] + labelSuffix : undefined;
    ti.dataField1 = labels.length > 1 ? labels[1] : undefined;
    if (recurse && ti.children) {
      ti.children.forEach(tiChild => this.updateDisplayLabels(tiChild, true));
    }
  }

  private createTreeItemLabelSuffix(cnsNode: CnsNodeIfc): string {
    let suffix: string;
    if (this.core.isDistributedSystem && cnsNode && cnsNode.isRoot) {
      suffix = `  (${cnsNode.systemName})`;
    }
    return suffix || '';
  }

  private setIcon(ti: TreeItem): Observable<void> {
    if (!ti) {
      return of(undefined);
    }
    const tiData: TreeItemData = TreeItemData.extract(ti);
    let typeId: number = tiData.iconObjectType;
    let subTypeId: number = tiData.iconObjectSubType;
    // If the tree-item contains a cns-node, get the latest object-type info from it;
    // otherwise, this is a transient-item for which we use the `iconObjectType` field instead
    if (tiData.cnsNode) {
      typeId = tiData.cnsNode.browserObj.Attributes.TypeId;
      subTypeId = tiData.cnsNode.browserObj.Attributes.SubTypeId;
    }
    return this.svcBlk.iconMapperService.getGlobalIcon(TablesEx.ObjectSubTypes, subTypeId, typeId)
      .pipe(
        map(icon => {
          ti.icon = icon;
          // Update the TreeItemData with the currently loaded icon's object type and sub-type.
          // This allows us to detect changes in the DP at the server and reload the icon if needed.
          tiData.iconObjectType = typeId;
          tiData.iconObjectSubType = subTypeId;
        }),
        catchError(err => {
          this.traceSvc.error('Failed to load icon: type-id=%s, subtype-id=%s, %s', typeId, subTypeId, err);
          return of(undefined);
        }));
  }
}
