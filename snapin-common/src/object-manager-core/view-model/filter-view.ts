import { from, Observable, Observer, of, Subject, throwError } from 'rxjs';
import { catchError, concatMap, debounceTime, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BrowserObject, CnsLabelEn, Designation, Tables, TablesEx, TextEntry, ViewNode } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { DomSanitizer } from '@angular/platform-browser';
import { NgZone } from '@angular/core';
import { addChildItem, boxClicked, hasChildren, setBoxStateRecursive, TreeItem } from '@simpl/element-ng';
import { Common } from '../object-manager-core-common';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { ObjectManagerCoreIfc } from '../object-manager-core';
import { AggregateViewId } from '../data-model/types';
import { Filter, FilterPreset, FilterSetting, PatternNamespaceType } from './filter';
import { AggregateViewDelegate } from './object-view-aggregate';
import { ObjectManagerServiceCatalog } from './types';

export { AggregateViewId };

export enum FilterState {
  Idle = 0,
  Configure,
  Executing,
  Results
}

export interface RootScope {
  cnsView: ViewNode;
  cnsRoot?: BrowserObject;
}

interface FilterContext {
  scopeAgView?: AggregateViewDelegate;
  // scopeArr?: ViewNode[];
  scopeCustomArr?: RootScope[];
  selectionCnsView?: ViewNode;
  selectionCnsNode?: BrowserObject;
}

export interface FilterViewIfc {

  readonly state: FilterState;
  readonly recentFilters: readonly Filter[];
  readonly savedFilters: readonly FilterPreset[];
  readonly disciplineTree: TreeItem[];
  readonly objectTypeTree: TreeItem[];
  readonly presetSelectionText: string;
  readonly settings: Filter;
  readonly selectionPath: string;
  readonly selectionShort: string;
  readonly isSecondaryLabelEnabled: boolean;
  readonly isContextSet: boolean;
  readonly isIdle: boolean;
  readonly isSearchInProgress: boolean;
  readonly selectedItems: readonly TreeItem[];
  readonly results: TreeItem[];
  readonly resultsErrorMessage: string;
  readonly isResultsError: boolean;
  readonly isResultsEmptySet: boolean;
  readonly isResultsClear: boolean;
  readonly resultsChanged: Observable<void>;
  readonly pillDataFilter: Filter;
  readonly filterChanged: Observable<void>;
  readonly filterReset: Observable<void>;
  readonly viewReattached: Observable<void>;
  readonly dataChangedUndetected: Observable<void>;
  showSelector: boolean;
  activate(ds: DomSanitizer): Observable<void>;
  deactivate(): void;
  setScope(agView: AggregateViewDelegate): void;
  setCustomScope(rootArr: RootScope[]): void;
  setSelection(cnsView: ViewNode, cnsNode: BrowserObject): void;
  updateDisciplines(): void;
  updateObjectTypes(): void;
  selectRecentFilter(idx: number): void;
  deleteRecentFilter(idx: number): void;
  selectSavedFilter(idx: number): void;
  addSavedFilter(name: string, f: Filter): Observable<boolean>;
  deleteSavedFilter(name: string): Observable<boolean>;
  updateFilters(): Observable<void>;
  cancelChanges(): void;
  clearSetting(setting: FilterSetting): void;
  reset(): void;
  execute(autoExecute?: boolean): void;
  abort(): void;
  clearSelectedItems(): void;
  updateSelectedItems(): void;
  processReattach(): void;

}

export class FilterView implements FilterViewIfc {

  public disciplineTree: TreeItem[];
  public objectTypeTree: TreeItem[];
  public presetSelectionText: string;

  private active: boolean;
  private readonly filterDirty: Filter;
  private readonly filterSet: Filter;
  private filterState: FilterState;
  private readonly context: FilterContext;
  private savedFilterArr: FilterPreset[];
  private readonly recentFilterArr: Filter[];
  private currentCnsLabel: CnsLabelEn;
  private searchLimit: number;
  private searchAutoExecute: boolean;
  private searchCnsRootArr: RootScope[];
  private searchAbortFlag: boolean;
  private selectedItemArr: TreeItem[];
  private resultsTree: TreeItem[];
  private resultsError: any;
  private readonly resultsChangedInd: Subject<void>;
  private readonly filterChangedInd: Subject<void>;
  private readonly resetInd: Subject<void>;
  private readonly viewReattachedInd: Subject<void>;
  private readonly dataChangedUndetectedInd: Subject<void>;
  private readonly setIconInd: Subject<TreeItem>;
  private domSanitizer: DomSanitizer;
  private readonly abortInd: Subject<void>;
  private destroyInd: Subject<void>;

  private disciplineTexts: TextEntry[];
  private objectTypeTexts: TextEntry[];

  private readonly settingsKeySavedSearchList: string = 'Web_SystemBrowser_SavedSearches';
  private readonly settingsKeyRecentSearchList: string = 'Web_SystemBrowser_RecentSearches';
  private readonly recentFilterMax: number = 5;
  private readonly maxItems: number = 10000; // search result sets will be limited!

  public get state(): FilterState {
    return this.filterState;
  }

  public get settings(): Filter {
    return this.filterDirty;
  }

  public get pillDataFilter(): Filter {
    return this.filterState === FilterState.Results ? this.filterSet : this.filterDirty;
  }

  public get showSelector(): boolean {
    return this.filterState === FilterState.Configure;
  }

  public set showSelector(flag: boolean) {
    if (this.isSearchInProgress) {
      return; // cannot toggle filter selector when a search is in progress!
    }
    if (flag) {
      this.filterState = FilterState.Configure;
    } else {
      this.filterState = this.isResultsClear ? FilterState.Idle : FilterState.Results;
    }
    // Indicate a filter "change" when the selector is shown/hidden because the
    // pill data must reflect either the dirty/set filter based on this state.
    this.filterChangedInd.next(undefined);
  }

  public get savedFilters(): readonly FilterPreset[] {
    return this.savedFilterArr;
  }

  public get recentFilters(): readonly Filter[] {
    return this.recentFilterArr;
  }

  public get isIdle(): boolean {
    return this.filterState === FilterState.Idle;
  }

  public get isContextSet(): boolean {
    return !isNullOrUndefined(this.context.scopeAgView) || !isNullOrUndefined(this.context.scopeCustomArr);
  }

  public get selectionPath(): string {
    const bo: BrowserObject = this.context.selectionCnsNode;
    if (bo) {
      const labels: string[] = this.svcBlk.cnsHelperService.getCnsLabelsOrdered(bo) || [];
      // let labelSuffix: string = this.createTreeItemLabelSuffix(cnsNode);
      const labelSuffix = '';
      return labels.length > 0 ? labels[0] + labelSuffix : '';
    }
    return ''; // no context
  }

  public get selectionShort(): string {
    return this.selectionPath;
  }

  public get isSearchInProgress(): boolean {
    return this.filterState === FilterState.Executing;
  }

  public get selectedItems(): readonly TreeItem[] {
    return this.selectedItemArr || [];
  }

  public get results(): TreeItem[] {
    return this.resultsTree;
  }

  public get resultsErrorMessage(): string {
    if (this.resultsError) {
      return this.resultsError.toString();
    }
    return undefined;
  }

  public get isResultsError(): boolean {
    return !isNullOrUndefined(this.resultsError);
  }

  public get isResultsEmptySet(): boolean {
    return !isNullOrUndefined(this.resultsTree) && this.resultsTree.length === 0;
  }

  public get isResultsClear(): boolean {
    return isNullOrUndefined(this.resultsTree) && isNullOrUndefined(this.resultsError);
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

  public get dataChangedUndetected(): Observable<void> {
    return this.dataChangedUndetectedInd;
  }

  public get viewReattached(): Observable<void> {
    return this.viewReattachedInd;
  }

  public get resultsChanged(): Observable<void> {
    return this.resultsChangedInd;
  }

  public get filterChanged(): Observable<void> {
    return this.filterChangedInd;
  }

  public get filterReset(): Observable<void> {
    return this.resetInd;
  }

  private static getParent(bo: BrowserObject, isByName: boolean, isDistributed: boolean): string {
    let name: string;
    if (bo) {
      name = isByName ? bo.Designation : bo.Location;
    }
    if (!name) {
      return undefined;
    }
    // Separate view from path
    let view: string;
    let path: string;
    const parts: string[] = name.split(':');
    if (parts.length > 1) {
      view = parts[0] + ':';
      path = parts[1];
    } else {
      path = name;
    }
    // trim node name from end to establish parent
    let parent = '';
    const pos: number = path.lastIndexOf('.');
    if (pos >= 0) {
      parent = path.substr(0, pos);
    }
    if (isDistributed || parent.length === 0) {
      return view + parent;
    } else {
      return parent;
    }
  }

  private static isRootScopeValid(scope: RootScope): boolean {
    if (scope?.cnsView &&
      scope.cnsRoot &&
      scope.cnsView.SystemId === scope.cnsRoot.SystemId &&
      scope.cnsView.ViewId === scope.cnsView.ViewId) {
      return true;
    }
    return false;
  }

  private static getCheckedEntries(itemArr: TreeItem[]): TextEntry[] {
    if (!itemArr) {
      return undefined;
    }
    const entryCheckedArr: TextEntry[] = [];
    itemArr.forEach(item => {
      const entry: TextEntry = item.customData as TextEntry;
      switch (item.checked) {
        case 'checked':
          entryCheckedArr.push(new TextEntry(entry.value, entry.text, []));
          break;
        case 'indeterminate':
          const subEntryArr: TextEntry[] = [];
          (item.children || []).forEach(subItem => {
            const subEntry: TextEntry = subItem.customData as TextEntry;
            if (subEntry && subItem.checked === 'checked') {
              subEntryArr.push(new TextEntry(subEntry.value, subEntry.text, []));
            }
          });
          entryCheckedArr.push(new TextEntry(entry.value, entry.text, subEntryArr));
          break;
        case 'unchecked':
        default:
          break;
      }
    });
    return entryCheckedArr;
  }

  public constructor(
    protected traceSvc: TraceServiceDelegate,
    protected svcBlk: ObjectManagerServiceCatalog,
    protected readonly vmId: string,
    protected locale: string,
    protected ngZone: NgZone,
    protected core: ObjectManagerCoreIfc,
    protected objectModelFilter: string[]) {
    if (!(traceSvc && svcBlk && core)) {
      throw new Error('invalid argument');
    }
    this.abortInd = new Subject<void>();
    this.destroyInd = new Subject<void>();
    this.filterChangedInd = new Subject<void>();
    this.resetInd = new Subject<void>();
    this.resultsChangedInd = new Subject<void>();
    this.viewReattachedInd = new Subject<void>();
    this.dataChangedUndetectedInd = new Subject<void>();
    this.setIconInd = new Subject<TreeItem>();
    this.filterState = FilterState.Idle;
    this.context = {};
    this.filterDirty = new Filter();
    this.filterSet = new Filter();
    this.savedFilterArr = [];
    this.recentFilterArr = [];

    // Pass filter change indications through to view component
    this.filterDirty.filterChanged
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.presetSelectionText = undefined;
          this.filterChangedInd.next(undefined);
        });
    this.filterSet.filterChanged
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.filterChangedInd.next(undefined);
        });
    // Subscribe to internal requests to load icons.
    // Icons to load are queued up by passing them through the following subscription
    // using a `setIconInd.next(ti)` call.  Each request indication generated is serialized
    // by the `concatMap` operator through the `setIcon` method.
    this.setIconInd
      .pipe(
        concatMap(ti => this.setIcon(ti)),
        takeUntil(this.destroyInd))
      .subscribe();
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
          this.updateResultsDisplayLabels();
        }
      );
  }

  public activate(ds: DomSanitizer): Observable<void> {
    if (this.isDisposed) {
      return throwError(new Error('view has been disposed'));
    }
    if (!ds) {
      return throwError(new Error('undefined argument'));
    }
    this.domSanitizer = ds;
    return of(undefined)
      .pipe(
        concatMap(() => this.loadObjectTypes()),
        concatMap(() => this.loadDisciplines()),
        concatMap(() => this.refreshSavedFilters()),
        tap(() => {
          this.active = true;
        })
      );
  }

  public deactivate(): void {
    this.active = false;
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }

  public processReattach(): void {
    this.viewReattachedInd.next(undefined);
  }

  public selectRecentFilter(idx: number): void {
    const f: Filter = this.recentFilterArr ? this.recentFilterArr[idx] : undefined;
    if (!f) {
      return;
    }
    this.filterDirty.reset(f, true);
    this.restoreTreeSelection(this.objectTypeTree, this.filterDirty.objectTypes);
    this.restoreTreeSelection(this.disciplineTree, this.filterDirty.disciplines);
    this.presetSelectionText = f.customData as string || f.pattern;
    this.dataChangedUndetectedInd.next(undefined);
  }

  public addRecentFilter(f: Filter): void {
    if (!f) {
      return;
    }
    const pos: number = this.recentFilterArr.findIndex(item => item.isEqual(f));
    if (pos >= 0) {
      // Remove matching filter (so we can re-insert it at the head of the list)
      this.recentFilterArr.splice(pos, 1);
    }
    const fInsert: Filter = new Filter();
    fInsert.reset(f);
    this.recentFilterArr.splice(0, 0, fInsert);
    // Trim the list to keep it under the max length
    this.recentFilterArr.length = Math.min(this.recentFilterArr.length, this.recentFilterMax || 5);
  }

  public deleteRecentFilter(idx: number): void {
    if (this.recentFilterArr && idx >= 0 && idx < this.recentFilterArr.length) {
      this.recentFilterArr.splice(idx, 1);
    }
  }

  public selectSavedFilter(idx: number): void {
    const fp: FilterPreset = this.savedFilterArr ? this.savedFilterArr[idx] : undefined;
    if (!fp) {
      return;
    }
    this.filterDirty.reset(fp.filter, true);
    this.restoreTreeSelection(this.objectTypeTree, this.filterDirty.objectTypes);
    this.restoreTreeSelection(this.disciplineTree, this.filterDirty.disciplines);
    this.presetSelectionText = fp.name;
    this.dataChangedUndetectedInd.next(undefined);
  }

  public addSavedFilter(name: string, f: Filter): Observable<boolean> {
    if (!name || !f) {
      return of(false);
    }
    return this.refreshSavedFilters()
      .pipe(
        map(() => {
          let isSuccess = false;
          if (!this.savedFilterArr.some(item => item.name === name)) {
            const fSave: Filter = new Filter();
            fSave.reset(f);
            const preset: FilterPreset = new FilterPreset(name, fSave);
            this.savedFilterArr.push(preset);
            this.savedFilterArr.sort((a, b) => Common.localeCompareSafe(this.locale, a.name, b.name));
            isSuccess = true;
          }
          return isSuccess;
        }),
        concatMap(isSuccess => isSuccess ? this.writeSavedFilters() : of(false)));
  }

  public deleteSavedFilter(name: string): Observable<boolean> {
    return this.refreshSavedFilters()
      .pipe(
        tap(() => {
          const pos: number = this.savedFilterArr.findIndex(item => item.name === name);
          if (pos >= 0) {
            this.savedFilterArr.splice(pos, 1);
          }
        }),
        concatMap(() => this.writeSavedFilters()));
  }

  public reset(): void {
    if (this.isSearchInProgress) {
      return; // cannot reset filter state when a search is executing!
    }
    this.filterDirty.reset();
    this.filterSet.reset();
    this.clearTreeSelection(this.objectTypeTree);
    this.clearTreeSelection(this.disciplineTree);
    this.resultsTree = undefined;
    this.resultsError = undefined;
    // If reset occurred while in configure state, stay in configure state (otherwise, switch back to browsing)
    if (this.filterState !== FilterState.Configure) {
      this.filterState = FilterState.Idle;
    }
    this.resetInd.next(undefined);
  }

  public cancelChanges(): void {
    this.filterDirty.reset(this.filterSet);
    this.restoreTreeSelection(this.objectTypeTree, this.filterDirty.objectTypes);
    this.restoreTreeSelection(this.disciplineTree, this.filterDirty.disciplines);
    this.showSelector = false;
  }

  public clearSetting(setting: FilterSetting): void {
    switch (setting) {
      case FilterSetting.Pattern:
        this.filterDirty.pattern = undefined;
        break;
      // case FilterSetting.PatternNamespace:
      //   break;
      case FilterSetting.SelectionScope:
        this.filterDirty.isWithinSelection = false;
        break;
      case FilterSetting.ObjectType:
        if (this.objectTypeTree) {
          this.clearTreeSelection(this.objectTypeTree);
          this.updateObjectTypes();
        }
        break;
      case FilterSetting.Discipline:
        if (this.disciplineTree) {
          this.clearTreeSelection(this.disciplineTree);
          this.updateDisciplines();
        }
        break;
      case FilterSetting.AlarmSuppression:
        this.filterDirty.isAlarmSuppression = false;
        break;
      default:
        break;
    }
    // If the filter view is showing results, refresh the results by re-executing the search
    // with the updated filter set.
    if (this.filterState === FilterState.Results) {
      if (!this.filterDirty.isClear) {
        this.filterState = FilterState.Configure;
        this.filterChangedInd.next(undefined);
        this.execute(true);
      } else {
        // If the filter is now clear, this is treated as an implicit 'reset'
        this.reset();
      }
    }
  }

  public setScope(agView: AggregateViewDelegate): void {
    this.context.scopeAgView = agView;
  }

  public setCustomScope(rootArr: RootScope[]): void {
    this.context.scopeCustomArr = undefined;
    if (rootArr && rootArr.length > 0 && rootArr.every(root => FilterView.isRootScopeValid(root))) {
      this.context.scopeCustomArr = rootArr.slice(0);
    }
  }

  public setSelection(cnsView: ViewNode, cnsNode: BrowserObject): void {
    this.context.selectionCnsView = undefined;
    this.context.selectionCnsNode = undefined;
    if (cnsView && cnsNode && cnsView.SystemId === cnsNode.SystemId && cnsView.ViewId === cnsNode.ViewId) {
      this.context.selectionCnsView = cnsView;
      this.context.selectionCnsNode = cnsNode;
    }
  }

  public getSearchScope(withinSelection: boolean): RootScope[] {
    let rootArr: RootScope[] = [];
    if (this.context.selectionCnsView && withinSelection) {
      // within selection
      rootArr.push({
        cnsView: this.context.selectionCnsView,
        cnsRoot: this.context.selectionCnsNode
      });
    } else if (this.context.scopeCustomArr) {
      // within custom view
      rootArr = this.context.scopeCustomArr.slice(0);
    } else if (this.context.scopeAgView) {
      // within an aggregate view
      const cnsViews: ViewNode[] = this.context.scopeAgView.viewRef.cnsViews;
      // Sort the views by system name.
      // This will allow the search results to be sorted accordingly.
      cnsViews.sort((a, b) => Common.localeCompareSafe(this.locale, a.SystemName, b.SystemName, {
        sensitivity: 'base', // case insensitive
        ignorePunctuation: false,
        numeric: true // enable numeric collation, "1" < "2" < "10"
      }));
      rootArr = cnsViews.map(
        v => ({
          cnsView: v,
          cnsNode: undefined
        })
      );
    }
    return rootArr;
  }

  public updateDisciplines(): void {
    this.filterDirty.disciplines = FilterView.getCheckedEntries(this.disciplineTree);
  }

  public updateObjectTypes(): void {
    this.filterDirty.objectTypes = FilterView.getCheckedEntries(this.objectTypeTree);
  }

  public clearSelectedItems(): void {
    if (this.results) {
      this.results.forEach(ti => this.clearSelectedItemsRecursive(ti));
    }
    this.selectedItemArr = [];
  }

  public updateSelectedItems(): void {
    // Update selected item array exposed to view
    this.selectedItemArr = [];
    if (this.results) {
      this.results.forEach(ti => this.selectedItemArr.push(...this.getSelectedItemsRecursive(ti)));
    }
  }

  public abort(): void {
    if (this.filterState !== FilterState.Executing) {
      return; // no search in progress!
    }
    this.searchAbortFlag = true;
    this.abortInd.next(undefined);
  }

  public execute(autoExecute?: boolean): void {
    if (this.filterState === FilterState.Executing) {
      this.traceSvc.warn('Search already in-progress; request ignored');
      return;
    }
    // Set search scope
    const rootArr: RootScope[] = this.getSearchScope(this.filterDirty.isWithinSelection);
    if (!rootArr || rootArr.length === 0) {
      this.traceSvc.warn('Search context has not been set; request ignored');
      return;
    }
    this.filterState = FilterState.Executing;
    this.searchCnsRootArr = rootArr;
    this.searchAutoExecute = Boolean(autoExecute);
    this.searchLimit = this.maxItems;
    this.searchAbortFlag = false;
    this.resultsError = undefined;
    this.executeNext(0);
  }

  public executeNext(idx: number, resultsTreePending?: TreeItem[]): void {
    resultsTreePending = resultsTreePending || [];
    const rootArr: RootScope[] = this.searchCnsRootArr || [];
    if (idx < rootArr.length && this.searchLimit > 0) {
      const root: RootScope = rootArr[idx];
      // Map filter to local search request.
      let searchReq: Observable<BrowserObject[]>;
      let pattern: string;
      let patternAlias: string;
      let isByName: boolean;
      switch (this.filterDirty.patternNamespace) {
        case PatternNamespaceType.DpAlias:
          // NOTE: Although there is a `searchAlias` method that treats the alias as the primary search
          //  filter, we cannot use it here because it would not allow us to restrict the search to the
          //  root-scope (for example, if the "search-within" option is being used, or we are searching
          //  in a customized view).
          //  We are left with having to search by-name / by-description (which ever namespace is currently
          //  selected as the primary display label) on ALL nodes within the root-scope and treating
          //  alias as a secondary search filter.
          let cnsLab: CnsLabelEn;
          if (this.svcBlk.cnsHelperService?.activeCnsLabelValue) {
            cnsLab = this.svcBlk.cnsHelperService.activeCnsLabelValue.cnsLabel;
          }
          isByName = cnsLab === CnsLabelEn.Name ||
            cnsLab === CnsLabelEn.NameAndAlias ||
            cnsLab === CnsLabelEn.NameAndDescription;
          pattern = this.buildPattern(root, '*', isByName);
          patternAlias = this.filterDirty.pattern;
          break;
        case PatternNamespaceType.CnsName:
          isByName = true;
          pattern = this.buildPattern(root, this.filterDirty.pattern, true);
          patternAlias = undefined;
          break;
        case PatternNamespaceType.CnsDisplayName:
        default:
          isByName = false;
          pattern = this.buildPattern(root, this.filterDirty.pattern, false);
          patternAlias = undefined;
          break;
      }
      if (isByName) {
        searchReq = this.core.searchName(this.searchLimit, 1, root.cnsView.SystemId, root.cnsView.ViewId,
          pattern,
          patternAlias,
          this.filterDirty.disciplines,
          this.filterDirty.objectTypes,
          this.filterDirty.isAlarmSuppression);
      } else {
        searchReq = this.core.searchDescription(this.searchLimit, 1, root.cnsView.SystemId, root.cnsView.ViewId,
          pattern,
          patternAlias,
          this.filterDirty.disciplines,
          this.filterDirty.objectTypes,
          this.filterDirty.isAlarmSuppression);
      }
      searchReq
        .pipe(
          takeUntil(this.abortInd)
        )
        .subscribe(
          res => {
            // Compile segmented results into results tree
            this.executeCallback(idx, res, resultsTreePending);
          },
          err => {
            // Do not continue on error!
            this.resultsError = err;
            this.executeComplete();
          },
          () => {
            // Each time subscription is completed, check if it was due to the search being aborted
            if (this.searchAbortFlag) {
              this.executeAborted();
            }
          });
    } else {
      this.executeComplete(resultsTreePending); // all segments complete
    }
  }

  public executeCallback(idx: number, boArr: BrowserObject[], resultsTreePending: TreeItem[]): void {
    // Filter results through object-model filter (if set)
    const boArrFiltered: BrowserObject[] = (boArr || []).filter(bo => this.isObjectModelFilterMatch(bo));
    const tiArr: TreeItem[] = this.buildResultsTree(boArrFiltered);
    resultsTreePending.push(...tiArr);
    this.searchLimit = this.searchLimit - (boArrFiltered ? boArrFiltered.length : 0);
    this.executeNext(idx + 1, resultsTreePending);
  }

  public executeComplete(resultsTreePending?: TreeItem[]): void {
    this.resultsTree = resultsTreePending;
    this.resultsChangedInd.next(undefined);
    this.filterSet.reset(this.filterDirty);
    this.addRecentFilter(this.filterSet);
    this.filterState = FilterState.Results;
  }

  public executeAborted(): void {
    if (this.searchAutoExecute) {
      this.filterDirty.reset(this.filterSet);
      this.restoreTreeSelection(this.objectTypeTree, this.filterDirty.objectTypes);
      this.restoreTreeSelection(this.disciplineTree, this.filterDirty.disciplines);
      this.filterState = FilterState.Results;
    } else {
      this.filterState = FilterState.Configure;
    }
  }

  public buildPattern(root: RootScope, pattern: string, isByName: boolean): string {
    let p: string = pattern;
    const delim = '.';
    // Embellish pattern
    if (isNullOrUndefined(p) || p.length === 0) {
      p = '*';
    }
    if (p[0] !== '*') {
      if (p[0] !== delim) {
        p = '*' + delim + p;
      } else {
        p = '*' + p;
      }
    }
    // Build fully assembled pattern string according to namespace and provided root
    let pAssembled: string;
    if (root.cnsRoot) {
      const r: BrowserObject = root.cnsRoot;
      pAssembled = (isByName ? r.Designation : r.Location) + p;
    } else {
      const v: ViewNode = root.cnsView;
      pAssembled = (v.SystemName || this.core.localSystemName) + '.';
      pAssembled += (isByName ? v.Name : v.Descriptor) + ':' + p;
    }
    return pAssembled;
  }

  public updateFilters(): Observable<void> {
    this.savedFilterArr = [];
    return this.refreshSavedFilters();
  }

  private isObjectModelFilterMatch(bo: BrowserObject): boolean {
    if (!bo) {
      return false;
    }
    if (!this.objectModelFilter || this.objectModelFilter.length === 0) {
      return true; // object-model filter not set
    }
    const omName: string = bo.Attributes ? bo.Attributes.ObjectModelName : undefined;
    return this.objectModelFilter.some(val => val === omName);
  }

  private buildResultsTree(boArr: BrowserObject[]): TreeItem[] {
    if (!boArr) {
      return undefined;
    }
    // let isByName: boolean = this.filterDirty.patternNamespace !== PatternNamespace.CnsDisplayName;
    const isByName = false;
    const resultsTree: TreeItem[] = [];
    const resultsMap: Map<string, TreeItem> = new Map<string, TreeItem>();
    const resultsFlat: TreeItem[] = []; // for loading icons
    for (const bo of boArr) {
      if (!bo) {
        continue;
      }
      // Establish first level tree-item where this result will be added as a child
      const parentName: string = FilterView.getParent(bo, isByName, this.core.isDistributedSystem);
      let groupItem: TreeItem = resultsMap.get(parentName);
      if (!groupItem) {
        // Create new parent group item
        groupItem = {
          label: parentName,
          state: 'expanded',
          children: []
        };
        // no children initially
        // groupItem.isSelectable = false;
        resultsTree.push(groupItem);
        resultsMap.set(parentName, groupItem);
      }
      // Create tree-item from browser object return in result list
      const ti: TreeItem = {
        state: 'leaf',
        parent: groupItem,
        children: [],
        customData: bo,
        icon: Common.transparentIcon
      };

      this.updateDisplayLabels(ti);
      // Put result object in results tree
      const pos: number = !isNullOrUndefined(groupItem.children) ? groupItem.children.length : 0;
      addChildItem(groupItem, ti, pos);
      resultsFlat.push(ti);
    }
    resultsFlat.forEach(ti => this.setIconInd.next(ti));
    return resultsTree;
  }

  private updateResultsDisplayLabels(): void {
    if (!this.resultsTree) {
      return;
    }
    // NOTE: We do not update the group tree-item label (just the results underneath)
    this.resultsTree.forEach(group => {
      if (group.children) {
        group.children.forEach(result => this.updateDisplayLabels(result));
      }
    });
  }

  private updateDisplayLabels(ti: TreeItem): void {
    if (!ti || !ti.customData) {
      return;
    }
    const labels: string[] = this.svcBlk.cnsHelperService.getCnsLabelsOrdered(ti.customData) || [];
    const labelSuffix: string = this.createTreeItemLabelSuffix(ti.customData);
    ti.label = labels.length > 0 ? labels[0] + labelSuffix : undefined;
    ti.dataField1 = labels.length > 1 ? labels[1] : undefined;
  }

  private createTreeItemLabelSuffix(bo: BrowserObject): string {
    let suffix: string;
    // Add system name to root nodes in distributed sys env
    if (this.core.isDistributedSystem && bo) {
      const d: Designation = new Designation(bo.Designation);
      if (d.isValid && d.rootNodeNameFull === d.designation) {
        suffix = `  (${d.systemName})`;
      }
    }
    return suffix || '';
  }

  private loadObjectTypes(): Observable<void> {
    if (this.objectTypeTree) {
      return of(undefined); // already loaded!
    }
    return this.svcBlk.tablesService.getGlobalText(Tables.ObjectTypes, true)
      .pipe(
        map(textEntryArr => {
          this.objectTypeTexts = textEntryArr.slice(0);
          this.objectTypeTree = this.mapTextEntryArr(textEntryArr, undefined, [0, 9900]); // 0 = "undefined", 9900 = "other"
        })
      );
  }

  private loadDisciplines(): Observable<void> {
    if (this.disciplineTree) {
      return of(undefined); // already loaded!
    }
    return this.svcBlk.tablesService.getGlobalText(Tables.Disciplines, true)
      .pipe(
        map(textEntryArr => {
          this.disciplineTexts = textEntryArr.slice(0);
          this.disciplineTree = this.mapTextEntryArr(textEntryArr, undefined, [0]); // 0 = "undefined"
        })
      );
  }

  private refreshSavedFilters(): Observable<void> {
    if (!this.savedFilterArr) {
      this.savedFilterArr = [];
    }
    return this.svcBlk.settingsService.getSettings(this.settingsKeySavedSearchList)
      .pipe(
        map(valueEnc => FilterPreset.deserializePresets(valueEnc, this.disciplineTexts, this.objectTypeTexts)),
        map(presets => {
          if (presets) {
            presets.forEach(preset => {
              if (!this.savedFilterArr.some(item => item.name === preset.name)) {
                this.savedFilterArr.push(preset);
              }
            });
            this.savedFilterArr.sort((a, b) => Common.localeCompareSafe(this.locale, a.name, b.name));
          }
        }),
        catchError(err => {
          this.traceSvc.warn('Error reading saved filters: %s', err);
          return of(undefined);
        }));
  }

  private writeSavedFilters(): Observable<boolean> {
    if (!this.savedFilterArr) {
      return of(undefined);
    }
    const valueEnc: string = FilterPreset.serializePresets(this.savedFilterArr);
    return this.svcBlk.settingsService.putSettings(this.settingsKeySavedSearchList, valueEnc)
      .pipe(
        catchError(err => {
          this.traceSvc.error('Error saving filters: %s', err);
          return of(false);
        }));
  }

  private clearTreeSelection(tiArr: TreeItem[]): void {
    if (!tiArr) {
      return;
    }
    tiArr.forEach(ti => setBoxStateRecursive(ti, 'unchecked'));
  }

  private restoreTreeSelection(tiArr: TreeItem[], selectedEntries: TextEntry[]): void {
    if (!tiArr) {
      return;
    }
    this.clearTreeSelection(tiArr); // TODO: This is called too often during recursion!
    if (selectedEntries) {
      selectedEntries.forEach(e => {
        const item: TreeItem = tiArr.find(i => (i.customData as TextEntry).value === e.value);
        if (item) {
          if (hasChildren(item) && e.subText && e.subText.length > 0) {
            this.restoreTreeSelection(item.children, e.subText);
          } else {
            boxClicked(item, true);
          }
        }
      });
    }
  }

  private mapTextEntryArr(textTable: TextEntry[], parent: TreeItem, commonEntryValues?: number[]): TreeItem[] {
    if (isNullOrUndefined(textTable)) {
      return null;
    }
    const items: TreeItem[] = [];
    const commonItems: TreeItem[] = [];
    textTable.forEach(e => {
      if (!isNullOrUndefined(e?.value)) {
        let hasSubText = false;
        if (!isNullOrUndefined(e.subText) && e.subText.length > 0) {
          hasSubText = this.hasNonCommonEntry(e.subText, commonEntryValues);
        }
        const item: TreeItem =
        {
          label: e.text,
          state: hasSubText ? 'collapsed' : 'leaf',
          parent: !isNullOrUndefined(parent) ? parent : undefined,
          customData: e,
          showCheckbox: true,
          showOptionbox: false
        };

        // Map optional sub-text if this is a first-level tree-item.
        if (hasSubText) {
          const subItems: TreeItem[] = this.mapTextEntryArr(e.subText, item, [0]);
          subItems.forEach((val, i) => addChildItem(item, val, i));
        }
        if (commonEntryValues?.includes(e.value)) {
          commonItems.push(item);
        } else {
          items.push(item);
        }
      }
    });
    // Sort before adding common text-items
    items.sort();
    // Add common text-items to the end of the list
    if (commonItems.length > 0) {
      commonItems.sort();
      commonItems.forEach(i => items.push(i));
    }
    return items;
  }

  private hasNonCommonEntry(entryList: TextEntry[], commonEntryValues?: number[]): boolean {
    if (!entryList) {
      return false;
    }
    if (!commonEntryValues) {
      return entryList.length > 0;
    }
    return entryList.some(e => !commonEntryValues.includes(e.value));
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

  private setIcon(ti: TreeItem): Observable<void> {
    if (!ti) {
      return of(undefined);
    }
    const bo: BrowserObject = ti.customData as BrowserObject;
    if (!(bo?.Attributes)) {
      return of(undefined);
    }
    const typeId: number = bo.Attributes.TypeId;
    const subTypeId: number = bo.Attributes.SubTypeId;
    return this.svcBlk.iconMapperService.getGlobalIcon(TablesEx.ObjectSubTypes, subTypeId, typeId)
      .pipe(
        map(icon => {
          ti.icon = icon;
        }),
        catchError(err => {
          this.traceSvc.error('Failed to load icon: type-id=%s, subtype-id=%s, %s', typeId, subTypeId, err);
          return of(undefined);
        }));
  }

}
