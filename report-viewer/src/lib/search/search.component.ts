import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { TileScrolledEvent, TilesViewComponent, TilesViewDataResult } from '@gms-flex/controls';
import { FullSnapInId, IHfwMessage } from '@gms-flex/core';
import { ReportViewerStorageService, StateData } from '@gms-flex/report-viewer-root-services';
import { BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn, GmsManagedTypes, Page, SystemBrowserServiceBase } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { SiSearchBarComponent, ViewType } from '@simpl/element-ng';
import { Observable, of, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ReportViewerService, TileObject } from '../services/report-viewer.service';

export const isChanged = (propertyName: string, changes: SimpleChanges, skipFirstChange: boolean = true): any => (
  typeof changes[propertyName] !== 'undefined' &&
  (!changes[propertyName].isFirstChange() || !skipFirstChange) &&
  changes[propertyName].previousValue !== changes[propertyName].currentValue
);

@Component({
  selector: 'gms-report-search-view',
  templateUrl: './search.component.html',
  styles: `
    hfw-tiles-view {
      height: inherit;
    }
    .search-field {
      width: 100%;
    }
  `,
  standalone: false
})

export class SearchViewComponent implements OnInit, OnDestroy, OnChanges {

  @Input() public selectedObject: BrowserObject;
  @Input() public fullId: FullSnapInId;
  @Input() public placeholder: string;

  public selectedBrowserObjectName: string;
  public cnsLabelObject: CnsLabel = new CnsLabel();

  public actionBarType: ViewType = 'collapsible';

  public view: TilesViewDataResult;
  public pageSize = 250;
  public skip = 0;
  public loading = false;
  public sizeModel = 'm';

  @ViewChild('tilesView') private readonly tilesView: TilesViewComponent;
  @ViewChild('searchBar') private readonly searchBar: SiSearchBarComponent;

  private restoredScrollTop: number;
  private scrollHasBeenRestored = false;

  private nodes: any[];
  private fullBackupNodes: any[];

  private searchSubscription: Subscription = new Subscription();
  private systemBrowserSubscription: Subscription = new Subscription();
  private searchString = 'Reports*';

  private navigationBrowserObject: TileObject[] = [];
  private readonly subscriptions: Subscription[] = [];
  private storageService: ReportViewerStorageService;
  private search: string = undefined;

  public constructor(
    private readonly reportSnapinService: ReportViewerService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly messageBroker: IHfwMessage,
    private readonly ngZone: NgZone) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedObject && changes.selectedObject.previousValue !== changes.selectedObject.currentValue) {

      if (changes.selectedObject.isFirstChange()) {
        this.storageService = (
          (this.messageBroker.getStorageService(this.fullId)) as any) as ReportViewerStorageService;

        const storageData: StateData = this.storageService.getState(this.fullId);
        this.skip = storageData ? storageData.skip : 0;
        this.restoredScrollTop = storageData?.tilesScrollTop;

        const search = storageData ? storageData.searchString : '';
        if (search !== undefined && search !== null && search !== '') {
          this.search = search;
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => { this.searchBar.value = this.search; }, 300);
          });
        }
      }

      this.reportSnapinService.setSelectedObject(this.selectedObject);
      this.selectedBrowserObjectName = this.selectedObject.ObjectId;
      this.searchAllNodes(this.selectedObject);
    }
  }

  public ngOnInit(): void {
    this.subscriptions.push(
      this.cnsHelperService.activeCnsLabel.subscribe(label => {
        this.cnsLabelObject = label;
      }));
  }

  public ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    if (this.systemBrowserSubscription) {
      this.systemBrowserSubscription.unsubscribe();
    }

    this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });

    const storageData: StateData = this.storageService.getState(this.fullId);
    storageData.skip = this.skip;
    storageData.tilesScrollTop = this.tilesView.getScrollTop();
    storageData.searchString = this.search;
    storageData.designation = this.selectedObject.Designation;
    this.storageService.setState(this.fullId, storageData);
  }

  public onClickBody(event: any): void {
    if (!isNullOrUndefined(event)) {
      this.selectedObject = event as BrowserObject;
      this.selectedBrowserObjectName = this.selectedObject.ObjectId;
      this.reportSnapinService.onTileClick(this.selectedObject);
    }
  }

  public searchChange(searchKeyword: string): void {
    this.search = searchKeyword;
    if (searchKeyword !== null) {
      this.skip = 0;
      this.fetchData(searchKeyword);
    }
  }

  public resetSearch(): void {
    // this.searchBar.resetForm(event);
    this.searchBar.value = '';
  }

  public handlePageChange(event: TileScrolledEvent): void {
    this.skip = event.skip;
    this.pageSize = event.take;

    this.fetchData();
  }

  public fetchData(searchString?: string): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.loading = true;
    const filterByName: boolean = this.cnsLabelObject.cnsLabel === CnsLabelEn.Name ||
    this.cnsLabelObject.cnsLabel === CnsLabelEn.NameAndDescription ||
    this.cnsLabelObject.cnsLabel === CnsLabelEn.NameAndAlias;

    this.searchSubscription = this.getNodes({ skip: this.skip, take: this.pageSize, search: searchString, filterByName })
      .pipe(finalize(() => this.loading = false))
      .subscribe(res => {
        this.view = res;
        if (!isNullOrUndefined(this.restoredScrollTop) && this.scrollHasBeenRestored === false) {
          setTimeout(() => {
            this.tilesView.scrollTo(this.restoredScrollTop);
            this.scrollHasBeenRestored = true;
          });
        }
      });
  }

  public getNodes(options: { skip?: number; take?: number; search?: string; filterByName?: boolean } = {}): Observable<TilesViewDataResult> {
    const skip: number = options.skip || 0;
    const take: number = options.take || this.navigationBrowserObject.length;

    if (options.search !== undefined) {
      // get full dataset
      this.nodes = JSON.parse(JSON.stringify(this.fullBackupNodes));
      // filter dataset
      if (options.search !== '') {
        let filteredData: TileObject[] = [];
        if (options.filterByName) {
          filteredData = this.nodes.filter(n => this.filterByName(options.search, n));
        } else {
          filteredData = this.nodes.filter(n => this.filterByDescription(options.search, n));
        }
        this.nodes = filteredData;
      }
    }
    return of({
      data: this.nodes.slice(skip, skip + take).map(item => ({ ...item })),
      total: this.nodes.length
    });
  }

  public onBeforeAttach(): void {
    this.tilesView.onBeforeAttach();
  }

  private filterByName(search: string, node: any): boolean {
    const len = this.selectedObject.Designation.length + 1;
    const nameIncludeString = (node.Name as string).toLowerCase().includes(search.trim().toLowerCase()) &&
    (node.Designation as string).toLowerCase()
      .substring(len, node.Designation.length)
      .includes(search.trim().toLowerCase());
    const designationIncludeString = (node.Designation as string).toLowerCase().includes(search.trim().toLowerCase()) &&
    (node.Designation as string).toLowerCase()
      .substring(len, node.Designation.length)
      .includes(search.trim().toLowerCase());

    return (nameIncludeString || designationIncludeString);
  }

  private filterByDescription(search: string, node: any): boolean {
    const len = this.selectedObject.Location.length + 1;
    const descriptionIncludeString = (node.Descriptor as string).toLowerCase().includes(search.trim().toLowerCase()) &&
    (node.Location as string).toLowerCase()
      .substring(len, node.Location.length)
      .includes(search.trim().toLowerCase());

    const locationIncludeString = (node.Location as string).toLowerCase().includes(search.trim().toLowerCase()) &&
    (node.Location as string).toLowerCase()
      .substring(len, node.Location.length)
      .includes(search.trim().toLowerCase());

    return (descriptionIncludeString || locationIncludeString);
  }

  private searchAllNodes(selectObj: BrowserObject): void {
    if (this.systemBrowserSubscription) {
      this.systemBrowserSubscription.unsubscribe();
      this.navigationBrowserObject = [];
    }

    this.searchString = selectObj.Designation + '*';

    this.systemBrowserSubscription = this.systemBrowserService.searchNodes(selectObj.SystemId, this.searchString).subscribe((page: Page) => {
      if (page?.Nodes !== null) {
        page.Nodes.forEach(node => {
          if (node.Attributes.ManagedType !== GmsManagedTypes.REPORTS.id && node.Attributes.ManagedType !== GmsManagedTypes.REPORT_FOLDER.id) {
            const currTileObject: TileObject = new TileObject('element-report', node);
            currTileObject.Designation = node.Designation;
            this.navigationBrowserObject.push(currTileObject);
          }
        });
        this.skip = 0;
        //  this.view = { data: this.navigationBrowserObject, total: this.navigationBrowserObject.length };
        this.nodes = this.navigationBrowserObject;

        const propertiesId: string[] = [];
        this.nodes.forEach(node => {
          propertiesId.push(node.ObjectId + '.' + node.Attributes.DefaultProperty);
        });
        this.fullBackupNodes = JSON.parse(JSON.stringify(this.nodes));
        this.fetchData();
      }
    }
    );
  }
}
