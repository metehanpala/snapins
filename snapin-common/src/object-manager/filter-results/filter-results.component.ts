import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { animationFrameScheduler, Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';
import { ItemsVirtualizedArgs, MenuItem, TreeItem } from '@simpl/element-ng';
import { BrowserObject, Designation } from '@gms-flex/services';
import { DomSanitizer } from '@angular/platform-browser';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TraceModules } from '../../shared/trace-modules';
import { ObjectManagerCoreServiceBase } from '../../object-manager-core/object-manager-core.service.base';
import { FilterViewIfc } from '../../object-manager-core/view-model/filter-view';
import { SelectedItemsChangedArgs, SelectionMenuItem } from '../object-manager.types';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';

@Component({
  selector: 'gms-filter-results',
  templateUrl: './filter-results.component.html',
  styleUrls: ['./filter-results.component.scss', '../object-manager.component.scss'],
  standalone: false
})
export class FilterResultsComponent implements OnInit, OnDestroy {

  @Input() public filterView: FilterViewIfc;

  @Input() public singleSelection: boolean;

  @Input() public enableMenu: boolean;

  @Output() public readonly selectedItemsChanged: EventEmitter<SelectedItemsChangedArgs> = new EventEmitter<SelectedItemsChangedArgs>();

  @ViewChild('treeComponent', { static: false, read: ElementRef }) public treeEl: ElementRef;

  public updateVirtualizationInd: Subject<void>;
  public commandItems: MenuItem[];
  public noObjectsFoundMessage: string;

  private selectionMenuItems: SelectionMenuItem[];
  private destroyInd: Subject<void>;
  private readonly traceSvc: TraceServiceDelegate;
  private readonly translateService: TranslateService;

  @Input() public set menuItems(items: SelectionMenuItem[]) {
    if (this.selectionMenuItems !== items) {
      this.selectionMenuItems = items;
      // Map to si-tree-view MenuItem object for binding to tree
      this.commandItems = undefined;
      if (this.selectionMenuItems) {
        this.commandItems = this.selectionMenuItems.map(i => ({
          title: i.description,
          icon: i.icon,
          action: (arg: any) => this.onMenuSelection(arg as TreeItem, i.id)
        } as MenuItem));
      }
    }
  }

  public constructor(
    traceService: TraceService,
    private readonly coreService: ObjectManagerCoreServiceBase,
    private readonly domSanitizer: DomSanitizer,
    private readonly cdRef: ChangeDetectorRef) {

    this.translateService = this.coreService.commonTranslateService;
    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.objectManager);
    this.updateVirtualizationInd = new Subject<void>();
    this.destroyInd = new Subject<void>();
    this.translateService.get('OM-NO-OBJECTS-FOUND-MESSAGE').subscribe(s => this.noObjectsFoundMessage = s);
  }

  public ngOnInit(): void {
    if (!this.filterView) {
      throw new Error('filter view-model is undefined');
    }
    // Notify the tree-view control to updated is virtualized item list whenever
    // the search results tree is updated.
    this.filterView.resultsChanged
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.updateVirtualizationInd.next(undefined);
        });
    // Subscribe for indications that the SNI has been re-attached to the DOM
    // This indication is sent just prior to the view being re-attached.
    this.filterView.viewReattached
      .pipe(takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.onViewReattached();
        }
      );
    // Activate the VM
    // this.filterView.activate(this.domSanitizer)
    //   .subscribe();
  }

  public ngOnDestroy(): void {
    // this.filterView.deactivate();
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
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
  }

  public onItemsVirtualizedChanged(args: ItemsVirtualizedArgs): void {
    // Currently no work to do when the list of virtualized tree-items changes
    return;
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
    this.filterView.updateSelectedItems();
    this.notifySelectedItemsChanged(this.filterView.selectedItems);
  }

  public onMenuSelection(ti: TreeItem, menuId: string): void {
    if (!ti) {
      return;
    }
    // If the menu selection was made on a tree-item that is part of larger set of selected
    // tree-items, issue the selection on the entire selection set.  Otherwise, we will
    // send the selection on this one tree-item only!
    if (ti.selected) {
      this.notifySelectedItemsChanged(this.filterView.selectedItems, menuId);
    } else {
      this.notifySelectedItemsChanged([ti], menuId);
    }
  }

  public notifySelectedItemsChanged(tiArr: readonly TreeItem[], menuId?: string): void {
    const boArr: BrowserObject[] = (tiArr || [])
      .map(ti => ti.customData as BrowserObject)
      .filter(bo => !isNullOrUndefined(bo));
    if (boArr.length > 0) {
      this.selectedItemsChanged.emit({
        objects: boArr,
        menuId,
        sendMessage: true,
        customData: undefined
      });
    }
  }

}
