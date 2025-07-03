import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input,
  OnDestroy, OnInit, Output, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { animationFrameScheduler, BehaviorSubject, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { concatMap, debounceTime, map, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ItemsVirtualizedArgs, LoadChildrenEventArgs, MenuItem, MenuItemsProvider,
  ResizeObserverService, SiTreeViewComponent, TreeItem } from '@simpl/element-ng';
import {
  BrowserObject, CnsLocation, Designation, GmsSubscription, NewObjectParameters,
  PropertyDetails, PropertyInfo, PropertyServiceBase,
  SubscriptionState, ValueDetails, ValueSubscription2ServiceBase
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { CovFormatter } from '../../utility/cov-formatter';
import { TreeItemData, TreeItemlLifeCycleState } from '../../object-manager-core/view-model/tree-item-data';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { TraceModules } from '../../shared/trace-modules';
import { ObjectTypeInfo, ObjectViewIfc } from '../../object-manager-core/view-model/object-view';
import { SelectedItemsChangedArgs, SelectionMenuItem } from '../object-manager.types';
import { ObjectManagerCoreServiceBase } from '../../object-manager-core/object-manager-core.service.base';
import { SubscriptionData } from './value-subscription-data';

export enum TreeStyle {
  // Tree will be responsive (flat or expandable depending on size)
  Responsive = 0,
  // Tree will be flat always
  Flat,
  // Tree will be expandable (non-flat) always
  Expandable
}

@Component({
  selector: 'gms-browser-view',
  templateUrl: './browser-view.component.html',
  styleUrls: ['./browser-view.component.scss', '../object-manager.component.scss'],
  standalone: false
})
export class BrowserViewComponent implements AfterViewInit, OnInit, OnDestroy {

  @Input() public view: ObjectViewIfc;
  @Input() public showDefaultPropertyValue: boolean;
  @Input() public singleSelection: boolean;
  @Input() public enableMenu: boolean;

  @Output() public readonly selectedItemsChanged: EventEmitter<SelectedItemsChangedArgs> = new EventEmitter<SelectedItemsChangedArgs>();
  @Output() public readonly selectionChanged: EventEmitter<BrowserObject[]> = new EventEmitter<BrowserObject[]>();
  // send indication to Object-Manager that the save description should be disabled
  @Output() public readonly transIndication: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('treeContainer', { static: true, read: ElementRef }) public treeEl: ElementRef;
  @ViewChild('siTreeViewComponent') public treeViewComponent: SiTreeViewComponent;
  @ViewChildren('transientItemInput') public transientInputElRef: QueryList<any>;

  public newGenericItem: NewObjectParameters;
  public isNewItemBtnOpen: boolean;
  public flatTree = false;
  public updateVirtualizationInd: Subject<void>;
  // Used only to set the tree item that is in a selected state
  public selectedItem: TreeItem;
  // Used only to set the tree-item that has the focus
  public inFocusItem: TreeItem;
  public isLoading: boolean;
  public isLoadingSpinnerEnabled: boolean;

  public commandItems: MenuItem[] = [];
  public selectionMenuItemSubject: BehaviorSubject<SelectionMenuItem[]> = new BehaviorSubject<SelectionMenuItem[]>([]);

  private readonly translateService: TranslateService;
  private filterActive = false;
  private locale: string;
  private readonly virtItems: Map<TreeItem, SubscriptionData[]>;
  private virtItemsToAdd: TreeItem[];
  private virtItemsToRemove: TreeItem[];
  private browserTreeStyle: TreeStyle;
  private resizeSubscription: Subscription;
  private treeWidth: number;
  private readonly treeWidthChangedInd: Subject<void>;
  private readonly updateSubscriptionsInd: Subject<void>;
  private clientId: string;
  private readonly destroyInd: Subject<void>;
  private readonly traceSvc: TraceServiceDelegate;
  private readonly traceSvcValue: TraceServiceDelegate;
  private propertyAbsentText: string;
  private propertyCommErrorText: string;

  public static mapLifeCycleStateToTemplateName(state: TreeItemlLifeCycleState): string {
    let templateName: string;
    switch (state) {
      case TreeItemlLifeCycleState.New:
        templateName = 'new';
        break;
      case TreeItemlLifeCycleState.CreatePending:
        templateName = 'saving';
        break;
      case TreeItemlLifeCycleState.InSync:
        templateName = 'default';
        break;
      case TreeItemlLifeCycleState.Modify:
      case TreeItemlLifeCycleState.UpdatePending:
      case TreeItemlLifeCycleState.DeletePending:
      default:
        templateName = 'default';
        break;
    }
    return templateName;
  }

  /**
   * Extract the background color property from a ValueDetails object.
   * This is a kludgy way of stepping around the fact that the ValueDetails typescript class
   * does not represent the 'BackgroundColor' property, which is nonetheless part of the JS object.
   * Ultimately, this needs to be addressed in gms-services by adding this property to the
   * ValueDetails class.
   */
  private static extractRgbaBackgroundColor(vd: ValueDetails): string {
    let color: string;
    const vdAsObject: any = vd;
    if (vdAsObject?.BackgroundColor) {
      color = 'rgba(' +
        vdAsObject.BackgroundColor.R + ',' +
        vdAsObject.BackgroundColor.G + ',' +
        vdAsObject.BackgroundColor.B + ',' +
        vdAsObject.BackgroundColor.A / 255 + ')';
    }
    return color;
  }

  public commandItemsProvider: MenuItemsProvider = (treeItem: TreeItem) => this.selectionMenuItemSubject.pipe(
    map(items => {
      this.commandItems = items.map(i => ({
        title: i.description,
        icon: i.icon,
        action: (i.items != null || i.id === 'Separator') ? null : (arg: any): void => this.onMenuSelection(arg as TreeItem, i.id),
        items: (i.items != null) ? i.items.map(si => ({
          title: si.description,
          icon: si.icon,
          disabled: si.id === 'CopyAlias' && (treeItem.customData as TreeItemData).cnsNode.browserObj.Attributes.Alias == null,
          action: (arg: any) => this.onMenuSelection(arg as TreeItem, si.id)
        }) as MenuItem) : i.items
      } as MenuItem));

      return this.commandItems;
    })
  );

  @Input() public set treeStyle(ts: TreeStyle) {
    if (this.browserTreeStyle !== ts) {
      this.browserTreeStyle = ts;
      this.evaluateTreeState();
    }
  }

  // detect when filter-view is closed and re-evaluate tree style
  @Input() public set isFilterActive(b: boolean) {
    if (b) {
      this.filterActive = true;
    }
    if (!b && this.filterActive) {
      this.treeWidthChangedInd.next();
      this.filterActive = false;
    }
  }

  /* eslint-disable @typescript-eslint/explicit-function-return-type */
  @Input() public set menuItems(items: SelectionMenuItem[]) {
    if (!(items && items.length > 0)) {
      return;
    }
    // Initialize si-tree-view CommandItem array for binding to tree if not yet set
    if (!this.commandItems || items.length !== this.commandItems.length) {
      this.selectionMenuItemSubject.next(items);
    }
  }

  /* eslint-enaable @typescript-eslint/explicit-function-return-type */
  public get creatableTypes(): readonly ObjectTypeInfo[] {
    const typeArr: readonly ObjectTypeInfo[] = this.view ? this.view.selectedItemCreatableTypes : undefined;
    return typeArr || [];
  }

  public get isTransientItem(): boolean {
    // Indicates if a transient item exists indicating a pending sychronization with server-side data.
    // This flag controls availability of the NEW button, which will not be available when a transient item exists.
    return this.view?.transientItem ? true : false;
  }

  public get isSaveTransient(): boolean {
    return this.isTransientItem;
  }

  public get isEditInProgress(): boolean {
    // Indicates if there is an editable template active in the view.
    // This flag controls the behavior of the dual-purpose OK/CANCEL buttons.
    let flag = false;
    if (this.view?.transientItem) {
      const tiData: TreeItemData = TreeItemData.extract(this.view.transientItem);
      if (tiData.lifeCycleState === TreeItemlLifeCycleState.New || tiData.lifeCycleState === TreeItemlLifeCycleState.Modify) {
        flag = true;
      }
    }
    return flag;
  }

  public get isSelectionMade(): boolean {
    return this.view && this.view.selectedItems.length > 0;
  }

  public get isTransientItemDescriptionInvalid(): boolean {
    if (this.view.transientItemDescription) {
      return !CnsLocation.checkNodeDescription(this.view.transientItemDescription);
    }
    return false;
  }

  public constructor(
    traceService: TraceService,
    private readonly domSanitizer: DomSanitizer,
    private readonly cdRef: ChangeDetectorRef,
    private readonly resizeObserverService: ResizeObserverService,
    private readonly coreService: ObjectManagerCoreServiceBase,
    private readonly valueSubscriptionService: ValueSubscription2ServiceBase,
    private readonly propertyService: PropertyServiceBase) {

    this.translateService = coreService.commonTranslateService;
    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.objectManager);
    this.traceSvcValue = new TraceServiceDelegate(traceService, TraceModules.objectManagerValueSubscriptions);

    this.virtItems = new Map<TreeItem, SubscriptionData[]>();
    this.virtItemsToAdd = [];
    this.virtItemsToRemove = [];
    this.updateSubscriptionsInd = new Subject<void>();
    this.treeWidthChangedInd = new Subject<void>();
    this.destroyInd = new Subject<void>();

    this.translateService.get('OM-PROP-ABSENT').subscribe(s => this.propertyAbsentText = s);
    this.translateService.get('OM-COMM-ERROR').subscribe(s => this.propertyCommErrorText = s);
  }

  public ngOnInit(): void {
    if (!this.view) {
      throw new Error('view binding is undefined');
    }
    this.locale = this.translateService.getBrowserLang();
    this.clientId = this.valueSubscriptionService.registerClient(BrowserViewComponent.name);

    // In the event VM data is changed outside of Angular change detection, manually trigger
    // change detection in order to keep UI control data bindings up to date.
    // Indications to this handler are throttled to avoid rapid CD cycles.
    this.view.dataChangedUndetected
      .pipe(
        debounceTime(100),
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.cdRef.detectChanges();
        });
    // Subscribe for changes in the structure of the view.
    // This can included new items being added/deleted in addition to a node being expanded/collapsed through
    // changes to the tree-item data (rather than a mouse click).
    // Don't throttle these: The CNS state changes from the server are already throttled by the VM, so we
    // should not receive bursts of these indication up here due to server-side engineering activity.  And
    // indications due to node expansions are typically due to an internal selection, which need to be
    // processed immediately.
    this.view.viewStateChanged
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.treeViewComponent?.refresh();
          this.cdRef.detectChanges();
          // setTimeout(() => this.cdRef.detectChanges(), 0);
        }
      );
    // Subscribe for indications of internally executed selections.
    // These are selections made by the SNI through received hfw-message or query parameter change.
    // Such selections are executed by the view-model and reported through this event
    // for the UI to process.
    this.view.selectedItemChangedInternal
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(sendMessage => {
        this.onSelectedItemChangedInternal(sendMessage.sendMessage, sendMessage.customData);
      });
    // Subscribe for indication of root-nodes tree loading from server
    this.view.loading
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(loading => {
        this.isLoading = loading;
        if (this.isLoading) {
          // Delay showing the spinner until we have been waiting a short period of time.
          // This avoids the spinner "blinking" quickly in/out of view on every selection no
          // matter how quickly the new context loads.
          setTimeout(() => this.isLoadingSpinnerEnabled = this.isLoading, 800);
        } else {
          this.isLoadingSpinnerEnabled = false;
        }
      });

    // Activate the VM
    this.view.activate(this.domSanitizer)
      .subscribe(
        () => {
          this.postActivation();
        });
    // Subscribe for indications that the SNI has been re-attached to the DOM
    // This indication is sent just prior to the view being re-attached.
    this.view.viewReattached
      .pipe(takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.onViewReattached();
        }
      );
    // On changes to the width of the tree control container, re-evaluate the tree
    // display state (flat/expanded)
    this.treeWidthChangedInd
      .pipe(
        debounceTime(100),
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.evaluateTreeState();
        });
    // Update value subscriptions based on tree-items being added-to/removed-from
    // the virtualized items list.
    // Indications to this handler are debounced to delay updating of subscriptions
    // until virtualization changes subside.
    this.updateSubscriptionsInd
      .pipe(
        debounceTime(500),
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.onUpdateSubscriptions();
        });

  }

  public ngAfterViewInit(): void {
    this.subscribeContainerWidthChanges();
  }

  public postActivation(): void {
    return;
  }

  public ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
      this.resizeSubscription = undefined;
    }
    this.view.deactivate();
    this.destroyInd.next();
    this.destroyInd.complete();
  }

  public onViewReattached(): void {
    if (!this.treeEl) {
      return;
    }
    const treeInnerEl: any = this.treeEl.nativeElement.querySelector('div.si-tree-view');
    if (treeInnerEl?.scrollTop) {
      // Get tree-view vertical, non-zero scroll position just prior to it being reset by the attach operation
      const top: number = treeInnerEl.scrollTop;
      // Schedule scroll position to be restored after attach and just prior to view rendering
      animationFrameScheduler.schedule(() => {
        treeInnerEl.scrollTop = top;
      });
    }
    // Need to re-establish subscription for changes in container element size
    this.subscribeContainerWidthChanges();
  }

  public onLoadChildren(event: LoadChildrenEventArgs): void {
    const tiParent: TreeItem = event.treeItem;
    this.view.getChildren(tiParent)
      .subscribe(
        children => {
          event.callback(tiParent, children);
        });
  }

  public selectedItemFilterRecursive(ti: TreeItem): TreeItem[] {
    const tiSelArr: TreeItem[] = [];
    if (ti) {
      if (ti.selected) {
        tiSelArr.push(ti);
      }
      if (ti.children) {
        ti.children.forEach(tiChild => tiSelArr.push(...this.selectedItemFilterRecursive(tiChild)));
      }
    }
    return tiSelArr;
  }

  public onSelectedItemsChanged(tiArr: TreeItem[]): void {
    this.view.updateSelectedItems();
    this.notifySelectedItemsChanged(this.view.selectedItems, undefined, true);
  }

  public onMenuSelection(ti: TreeItem, menuId: string): void {
    if (!ti) {
      return;
    }
    // If the menu selection was made on a tree-item that is part of larger set of selected
    // tree-items, issue the selection on the entire selection set.  Otherwise, we will
    // send the selection on this one tree-item only!
    if (ti.selected) {
      this.notifySelectedItemsChanged(this.view.selectedItems, menuId, true);
    } else {
      this.notifySelectedItemsChanged([ti], menuId, true);
    }
  }

  public onSelectedItemChangedInternal(sendMessage: boolean, customData?: any): void {
    if (!this.view.selectedItems || this.view.selectedItems.length === 0) {
      return; // nothing marked selected!
    }
    this.notifySelectedItemsChanged(this.view.selectedItems, undefined, sendMessage, customData);
    // After CD has executed, set the internally selected item to have focus and
    // scroll into view.
    const ti: TreeItem = this.view.selectedItems[0];
    setTimeout(() => {
      this.inFocusItem = ti;
      this.selectedItem = ti;
    }, 0);
  }

  public notifySelectedItemsChanged(tiArr: readonly TreeItem[], menuId: string, sendMessage: boolean, customData?: any): void {

    const boArr: BrowserObject[] = (tiArr || [])
      .map(ti => TreeItemData.extract(ti).cnsNode.browserObj)
      .filter(bo => !isNullOrUndefined(bo));
    if (boArr.length > 0) {
      if (menuId === 'Copy') {
        return;
      } else if (menuId === 'CopyName') {
        if (boArr[0].Name != null) {
          navigator.clipboard.writeText(boArr[0].Name);
        }
      } else if (menuId === 'CopyDescription') {
        if (boArr[0].Descriptor != null) {
          navigator.clipboard.writeText(boArr[0].Descriptor);
        }
      } else if (menuId === 'CopyAlias') {
        if (boArr[0].Attributes.Alias != null) {
          navigator.clipboard.writeText(boArr[0].Attributes.Alias);
        }
      } else if (menuId === 'CopyDesignation') {
        if (boArr[0].Designation != null) {
          navigator.clipboard.writeText(boArr[0].Designation);
        }
      } else {
        this.selectedItemsChanged.emit({
          objects: boArr,
          menuId,
          sendMessage,
          customData
        });
      }
    }
  }

  public genericCreate(index?: number): void {
    const itemIndex: number = index || 0;
    if (itemIndex >= this.view.selectedItemCreatableTypes.length) {
      return;
    }
    if (this.view.selectedItems.length !== 1) {
      return;
    }
    const itemType: string = this.view.selectedItemCreatableTypes[itemIndex].name;
    this.view.newItem(this.view.selectedItems[0], itemType).subscribe(isSuccess => {
      if (isSuccess) {
        this.transIndication.emit(true);
        // TODO: check if this is still needed.
        this.treeViewComponent?.scrollItemIntoView(this.view.transientItem);
        if (this.transientInputElRef) {
          setTimeout(() => {
            this.transientInputElRef.first.nativeElement.focus();
          }, 100);
        }
      }
    });
  }

  public genericCreateCancel(): void {
    this.view.cancelEdit();
    this.transIndication.emit(false);
  }

  public genericCreateSave(): Observable<string> {
    return of(undefined)
      .pipe(
        concatMap(() => this.view.newItemSave(/* this.transientItemDescription */)),
        concatMap(resp => {
          if (resp.browserObj) {
            this.transIndication.emit(false);
            return of(undefined);
          } else {
            this.view.cancelEdit();
            return throwError(new Error(resp.errorMessage));
          }
        }));
  }

  public onItemsVirtualizedChanged(args: ItemsVirtualizedArgs): void {
    let isUpdate = false;
    if (args?.treeItems) {
      args.treeItems.forEach(ti => {
        if (args.virtualized) {
          isUpdate = this.addVirtualizedItem(ti) || isUpdate;
        } else {
          isUpdate = this.removeVirtualizedItem(ti) || isUpdate;
        }
      });
    }
    if (isUpdate) {
      this.updateSubscriptionsInd.next();
    }
  }

  private addVirtualizedItem(ti: TreeItem): boolean {
    let isUpdate = false;
    // If item is pending removal, simply remove it from this pending list
    const pos: number = this.virtItemsToRemove.indexOf(ti);
    if (pos >= 0) {
      this.virtItemsToRemove.splice(pos, 1);
      isUpdate = true;
    // else, if not already subscribed, add item to the pending add list
    } else if (ti && !this.virtItems.has(ti)) {
      this.virtItemsToAdd.push(ti);
      isUpdate = true;
    }
    return isUpdate;
  }

  private removeVirtualizedItem(ti: TreeItem): boolean {
    let isUpdate = false;
    // If item is pending add, simply remove it from the pending list
    const pos: number = this.virtItemsToAdd.indexOf(ti);
    if (pos >= 0) {
      this.virtItemsToAdd.splice(pos, 1);
      isUpdate = true;
    // else, if subscribed, add item to the pending remove list
    } else if (ti && this.virtItems.has(ti)) {
      this.virtItemsToRemove.push(ti);
      isUpdate = true;
    }
    return isUpdate;
  }

  private onUpdateSubscriptions(): void {
    // NOTE: There will be NO overlap in the toRemove and toAdd list (a given item will never
    //  appear in both lists).  As such, there is no benefit in adding subscriptions before removing.
    this.removeSubscriptions(this.virtItemsToRemove);
    this.virtItemsToRemove = [];
    this.addSubscriptions(this.virtItemsToAdd);
    this.virtItemsToAdd = [];
  }

  private addSubscriptions(tiArr: TreeItem[]): void {
    if (!tiArr) {
      return;
    }
    // Build value subscription-info list from tree-item list.
    // This list will be used locally in this method to create value subscriptions and
    // associate them with the tree-items to which they are associated.
    const subDataArr: SubscriptionData[] = [];
    tiArr.forEach(ti => {
      if (!this.virtItems.has(ti)) {
        this.virtItems.set(ti, []);
        let dpe: string;
        dpe = TreeItemData.extract(ti).propertyNameSummaryStatus;
        if (dpe) {
          subDataArr.push(new SubscriptionData(dpe, ti, true));

          dpe = TreeItemData.extract(ti).propertyNameDefault;
          if (dpe && this.showDefaultPropertyValue) {
            subDataArr.push(new SubscriptionData(dpe, ti, false));
          }
        } else {
          // TODO: This is now expected in the case of a newly created tree item!
          this.traceSvcValue.warn('Missing DP information: tree-item=%s', ti.label);
        }
      }
    });
    if (subDataArr.length === 0) {
      return;
    }

    // Subscribe for property values
    const propIds: string[] = subDataArr.map(subData => subData.propertyName);
    const subscriptions: GmsSubscription<ValueDetails>[] = this.valueSubscriptionService.subscribeValues(propIds, this.clientId);
    if (!subscriptions || subscriptions.length !== propIds.length) {
      this.traceSvcValue.error('Value subscription request failed or response is invalid.');
      return;
    }

    // Hook notification handlers to event objects inside value subscription (onValueChange and onStatusChange)
    subDataArr.forEach((subData, idx) => {
      subData.valueSubscription = subscriptions[idx];
      subData.valueChangedSubscription = subData.valueSubscription.changed
        .subscribe(val => {
          this.onPropertyValueChanged(subData, val);
        });
      subData.stateChangedSubscription = subData.valueSubscription.stateChanged
        .subscribe(state => {
          this.onSubscriptionStateChanged(subData, state);
        });
      // Keep subscription data with associated tree-item in collection of virtualized items
      const tiSubDataArr: SubscriptionData[] = this.virtItems.get(subData.treeItem);
      tiSubDataArr.push(subData);
    });

    // In order to format values for DP default values (which are optionally displayed in
    // the tree), we need to read property-info for these DPs.
    const subDataArrFiltered: SubscriptionData[] = subDataArr
      .filter(subData => !subData.isStatusProperty && !TreeItemData.extract(subData.treeItem).hasFormatter);
    const propIdsFiltered: string[] = subDataArrFiltered.map(subData => subData.propertyName);
    if (propIdsFiltered.length > 0) {
      this.propertyService.readPropertiesMulti(propIdsFiltered, 2, false)
        .subscribe(
          propInfoArr => {
            propInfoArr.forEach((pi, idx) => {
              const pd: PropertyDetails = this.getPropertyDetails(pi);
              if (pd != null) {
                TreeItemData.extract(subDataArrFiltered[idx].treeItem).setFormatter(new CovFormatter(
                  this.locale,
                  this.propertyAbsentText,
                  this.propertyCommErrorText,
                  pd));
              } else {
                this.traceSvcValue.error('Failed to read property info: propId=%s', propIdsFiltered[idx]);
              }
            });
          },
          err => {
            this.traceSvcValue.error('Error reading property info: %s', err);
          }
        );
    }
  }

  private removeSubscriptions(tiArr: TreeItem[], suppressServiceReq?: boolean): void {
    if (!tiArr) {
      return;
    }
    const subscriptionData: SubscriptionData[] = [];
    tiArr.forEach(ti => {
      const items: SubscriptionData[] = this.virtItems.get(ti) || [];
      items.forEach(i => subscriptionData.push(i));
      this.virtItems.delete(ti);
    });
    this.unsubscribeValues(subscriptionData, suppressServiceReq);
  }

  private unsubscribeValues(subscriptionData: SubscriptionData[], suppressServiceReq: boolean): void {
    const valueSubscriptions: GmsSubscription<ValueDetails>[] = [];
    if (subscriptionData && subscriptionData.length > 0) {
      subscriptionData.forEach(subData => {
        if (subData.valueChangedSubscription && !subData.valueChangedSubscription.closed) {
          subData.valueChangedSubscription.unsubscribe();
        }
        if (subData.stateChangedSubscription && !subData.stateChangedSubscription.closed) {
          subData.stateChangedSubscription.unsubscribe();
        }
        // Add to list of ValueSubscriptions to unsubscribe in ValueSubscriptionService.
        if (subData.valueSubscription) {
          valueSubscriptions.push(subData.valueSubscription);
        }
      });
    }
    // Unsubscribe all ValueSubscriptions
    // NOTE: This service request can be suppressed by the caller.  This is used, for example,
    // when the subscription has been terminated by the service itself.  In this case,
    // there is no need to send the unsubscribe; it is mostly harmless, but results in
    // trace message 'failed to unsubscribe' which we would like to avoid, when possible.
    if (!suppressServiceReq && valueSubscriptions.length > 0) {
      this.valueSubscriptionService.unsubscribeValues(valueSubscriptions, this.clientId);
    }
  }

  private getPropertyDetails(pi: PropertyInfo<PropertyDetails>): PropertyDetails {
    let pd: PropertyDetails;
    if (pi && pi.ErrorCode === 0) {
      if (pi.FunctionProperties) {
        pd = pi.FunctionProperties[0];
      } else if (pi.Properties) {
        pd = pi.Properties[0];
      }
    }
    return pd;
  }

  private onPropertyValueChanged(subData: SubscriptionData, vd: ValueDetails): void {
    if (!subData || !vd) {
      return;
    }
    const propId: string = subData.valueSubscription.gmsId;
    const val: string = vd.Value ? vd.Value.Value : undefined;
    this.traceSvcValue.debug('Value changed: tree-item=%s, propId=%s, val=%s', subData.treeItem.label, propId, val);
    if (subData.isStatusProperty) {
      let stateColor: string;
      if (val && val !== '0') {
        stateColor = BrowserViewComponent.extractRgbaBackgroundColor(vd);
      }
      subData.treeItem.stateIndicatorColor = stateColor;
    } else {
      // default property has changed. note that the tree-item-data object
      // will cache this value if the formatter has not been determined
      // (and when that happens, the last vd will be formatted for display)
      TreeItemData.extract(subData.treeItem).currentValue = vd;
    }
  }

  private onSubscriptionStateChanged(subData: SubscriptionData, state: SubscriptionState): void {
    if (!subData) {
      return;
    }
    this.traceSvcValue.debug('Value subscription state changed: tree-item=%s, propId=%s, , state=%s, errCode=%s, connectionOk=%s',
      subData.treeItem.label,
      subData.valueSubscription.gmsId,
      state,
      subData.valueSubscription.errorCode,
      subData.valueSubscription.connectionOK);

    // If unsubscribed and the tree-item is still represented in the local subscriptions map,
    // this means we did not explicitly unsubscribe and the termination of the subscription has come
    // from below (in the ValueSubscriptionService).  This could be cause by network disruption or
    // simply app shutdown.
    // In this case, remove the subscription in our map without sending an unsubscribe request to
    // the service.
    if (state === SubscriptionState.Unsubscribed) {
      this.traceSvcValue.info('Subscription terminated by service; unsubscribe all properties for treeItem=%s', subData.treeItem.label);
      this.removeSubscriptions([subData.treeItem], true);
    }
  }

  private subscribeContainerWidthChanges(): void {
    if (!(this.treeEl?.nativeElement)) {
      this.traceSvcValue.warn('Unable to locate si-tree-view element in DOM for width monitoring');
      return;
    }
    // Detach any previously established subscriptions on this element
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
      this.resizeSubscription = undefined;
    }
    // Subscribe for size changes on this host element
    this.resizeSubscription = this.resizeObserverService.observe(this.treeEl.nativeElement, 100, true, true)
      .subscribe(dim => this.onTreeWidthChanged(dim?.width));
  }

  private onTreeWidthChanged(w: number): void {
    if (!isNaN(w) && w !== 0 && w !== this.treeWidth) {
      this.treeWidth = w;
      this.treeWidthChangedInd.next();
    }
  }

  private evaluateTreeState(): void {
    switch (this.browserTreeStyle) {
      case TreeStyle.Responsive:
        this.flatTree = !isNaN(this.treeWidth) && this.treeWidth !== 0 && this.treeWidth < 300 ? true : false;
        break;
      case TreeStyle.Flat:
        this.flatTree = true;
        break;
      case TreeStyle.Expandable:
      default:
        this.flatTree = false;
        break;
    }
  }
}
