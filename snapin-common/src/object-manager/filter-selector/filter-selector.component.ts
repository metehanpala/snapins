import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, Pipe, PipeTransform } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { eTsResetOperation } from '@gms-flex/controls';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { CheckboxState, TreeItem, TreeItemFolderState } from '@simpl/element-ng';
import { DomSanitizer } from '@angular/platform-browser';
import { ObjectManagerCoreServiceBase } from '../../object-manager-core/object-manager-core.service.base';
import { FilterViewIfc } from '../../object-manager-core/view-model/filter-view';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { TraceModules } from '../../shared/trace-modules';
import { Filter, FilterPreset, PatternNamespaceType } from '../../object-manager-core/view-model/filter';
import { MultiMonitorServiceBase, ObjectMessageType } from '@gms-flex/services';
@Pipe({
  name: 'alarmSuppressionXlator',
  standalone: false
})
export class AlarmSuppressionPipe implements PipeTransform {
  // Maps the alarm-suppression flag value into its place in the object-state tree
  public transform(flag: boolean, objectStateTree: TreeItem[]): TreeItem[] {
    if (!(objectStateTree && objectStateTree.length !== 0)) {
      return [];
    }
    objectStateTree[0].checked = flag ? 'checked' : 'unchecked';
    return objectStateTree;
  }
}

@Component({
  selector: 'gms-filter-selector',
  templateUrl: './filter-selector.component.html',
  styleUrls: ['./filter-selector.component.scss', '../object-manager.component.scss'],
  standalone: false
})
export class FilterSelectorComponent implements OnInit, OnDestroy {

  @Input() public filterView: FilterViewIfc;

  @Input() public enablePresets: boolean;

  public readonly nsDescriptionValue: string = String(PatternNamespaceType.CnsDisplayName);
  public readonly nsNameValue: string = String(PatternNamespaceType.CnsName);
  public readonly nsAliasValue: string = String(PatternNamespaceType.DpAlias);
  public nsCnsDescriptionLabel: string;
  public nsCnsNameLabel: string;
  public nsAliasLabel: string;
  public disciplineLabel: string;
  public disciplineFilterWatermark: string;
  public objectTypeLabel: string;
  public objectTypeFilterWatermark: string;
  public stateLabel: string;
  public savedFiltersLabel: string;
  public recentFiltersLabel: string;
  public presetFilterLabel: string;
  public multipleFiltersLabel: string;
  public searchPatternWatermark: string;
  public searchWithinLabel: string;
  public searchWithinLabelShort: string;
  public saveFilterLabel: string;
  public filterSearchAriaLabel: string;
  public filterSaveAriaLabel: string;
  public filterApplyAriaLabel: string;
  public filterExitAriaLabel: string;

  public resetDisciplineSelector: Subject<eTsResetOperation>;
  public resetObjectTypeSelector: Subject<eTsResetOperation>;
  public resetObjectStateSelector: Subject<eTsResetOperation>;
  public objectStateTree: TreeItem[];
  public isDisciplineOpen: boolean;
  public isObjectTypeOpen: boolean;
  public isObjectStateOpen: boolean;
  public isPresetOpen: boolean;
  public isSaveOpen: boolean;
  public saveFilterName: string;
  public saveFilterNameValid: boolean;
  public isSaveFilterInProgress: boolean;
  public saveErrorMessage: string;
  public saveErrorSeverity: string;
  public filterNotUniqueMessage: string;
  public filterSaveFailedMessage: string;

  private readonly destroyInd: Subject<void>;
  private readonly traceSvc: TraceServiceDelegate;
  private readonly translateService: TranslateService;
  public readonly trackByIndex = (index: number): number => index;
  public get patternNamespaceSelection(): string {
    return String(this.filterView.settings.patternNamespace);
  }

  public set patternNamespaceSelection(val: string) {
    const nval = Number(val);
    if (nval in PatternNamespaceType) {
      this.filterView.settings.patternNamespace = nval;
      // this.filterDirty.setPattern(this.patternString, this.patternNamespace);
    }
  }

  public get presetFilterSelectionText(): string {
    return this.filterView.presetSelectionText || this.presetFilterLabel;
  }

  public get isSaveError(): boolean {
    return !isNullOrUndefined(this.saveErrorMessage) && this.saveErrorMessage.length > 0;
  }

  public get isPatternClear(): boolean {
    return isNullOrUndefined(this.filterView.settings.pattern) || this.filterView.settings.pattern.length === 0;
  }

  public get isModifiedFilterClear(): boolean {
    return false;
  }

  public constructor(
    traceService: TraceService,
    private readonly coreService: ObjectManagerCoreServiceBase,
    private readonly domSanitizer: DomSanitizer,
    private readonly cdRef: ChangeDetectorRef,
    private readonly multiMonitorService: MultiMonitorServiceBase) {

    this.translateService = coreService.commonTranslateService;
    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.objectManager);
    this.destroyInd = new Subject<void>();
    this.resetDisciplineSelector = new Subject<eTsResetOperation>();
    this.resetObjectTypeSelector = new Subject<eTsResetOperation>();
    this.resetObjectStateSelector = new Subject<eTsResetOperation>();

    // Create object-state "tree" (used in tree-selector control)
    // Currently, only a single state
    this.objectStateTree = [];
    this.objectStateTree.push(
      {
        label: '', // to be loaded by translateService
        state: 'leaf',
        showCheckbox: true,
        showOptionbox: false
      });

    this.translateService.get('OM-FILTER-NAMESPACE-CNS-DESCRIPTION-LABEL').subscribe(s => this.nsCnsDescriptionLabel = s);
    this.translateService.get('OM-FILTER-NAMESPACE-CNS-NAME-LABEL').subscribe(s => this.nsCnsNameLabel = s);
    this.translateService.get('OM-FILTER-NAMESPACE-ALIAS-LABEL').subscribe(s => this.nsAliasLabel = s);
    this.translateService.get('OM-FILTER-DISCIPLINE-LABEL').subscribe(s => this.disciplineLabel = s);
    this.translateService.get('OM-FILTER-DISCIPLINE-WATERMARK').subscribe(s => this.disciplineFilterWatermark = s);
    this.translateService.get('OM-FILTER-OBJECT-TYPE-LABEL').subscribe(s => this.objectTypeLabel = s);
    this.translateService.get('OM-FILTER-OBJECT-TYPE-WATERMARK').subscribe(s => this.objectTypeFilterWatermark = s);
    this.translateService.get('OM-FILTER-STATE-LABEL').subscribe(s => this.stateLabel = s);
    this.translateService.get('OM-FILTER-ALARM-SUPPRESSION-LABEL').subscribe(s => this.objectStateTree[0].label = s);
    this.translateService.get('OM-FILTER-SEARCH-PATTERN-WATERMARK').subscribe(s => this.searchPatternWatermark = s);
    this.translateService.get('OM-FILTER-SEARCH-WITHIN-LABEL').subscribe(s => this.searchWithinLabel = s);
    this.translateService.get('OM-SAVED-FILTERS-LABEL').subscribe(s => this.savedFiltersLabel = s);
    this.translateService.get('OM-RECENT-FILTERS-LABEL').subscribe(s => this.recentFiltersLabel = s);
    this.translateService.get('OM-PRESET-FILTER-LABEL').subscribe(s => this.presetFilterLabel = s);
    this.translateService.get('OM-FILTER-SEARCH-WITHIN-LABEL-SHORT').subscribe(s => this.searchWithinLabelShort = s);
    this.translateService.get('OM-FILTER-MULTIPLE-VALUES-LABEL').subscribe(s => this.multipleFiltersLabel = s);
    this.translateService.get('OM-SAVE-FILTER-LABEL').subscribe(s => this.saveFilterLabel = s);
    this.translateService.get('OM-NOT-UNIQUE-FILTER-NAME-LABEL').subscribe(s => this.filterNotUniqueMessage = s);
    this.translateService.get('OM-FILTER-SAVE-FAILED').subscribe(s => this.filterSaveFailedMessage = s);
    this.translateService.get('OM-SAVE-FILTER-BUTTON-ARIA-LABEL').subscribe(s => this.filterSaveAriaLabel = s);
    this.translateService.get('OM-APPLY-FILTER-BUTTON-ARIA-LABEL').subscribe(s => this.filterApplyAriaLabel = s);
    this.translateService.get('OM-EXIT-FILTER-BUTTON-ARIA-LABEL').subscribe(s => this.filterExitAriaLabel = s);
    this.translateService.get('OM-SEARCH-FIELD-ARIA-LABEL').subscribe(s => this.filterSearchAriaLabel = s);
  }

  public ngOnInit(): void {
    if (!this.filterView) {
      throw new Error('filter view-model is undefined');
    }
    this.filterView.filterReset
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(
        () => {
          this.onFilterReset();
        });
    // KLUDGE: The si-accordion opens the first si-collapsible-panel on initialization.  In this
    // filter-selector this is the discipline selector. There is currently no way to change this
    // behavior in the host.  Further, this state is NOT indicated through a `toggle` event, so we
    // have manually set the local flag that tracks this state on initialization of the host (here).
    this.isDisciplineOpen = true;
  }

  public ngOnDestroy(): void {
    this.destroyInd.next();
    this.destroyInd.complete();
  }

  public recentFilterDescription(f: Filter): string {
    let s: string;
    if (f) {
      if (!f.customData) {
        f.customData = this.filterToDescription(f);
      }
      s = f.customData as string;
    }
    return s;
  }

  public checkFilterName(): void {
    const name: string = (this.saveFilterName || '').trim();
    if (isNullOrUndefined(name) || name.length === 0) {
      this.saveErrorMessage = undefined;
      this.saveErrorSeverity = undefined;
      this.saveFilterNameValid = false;
      return;
    }
    const fArr: readonly FilterPreset[] = this.filterView.savedFilters;
    if (fArr?.some(item => item.name === this.saveFilterName)) {
      this.saveErrorMessage = this.filterNotUniqueMessage;
      this.saveErrorSeverity = 'warning';
      this.saveFilterNameValid = false;
      return;
    }
    this.saveErrorMessage = undefined;
    this.saveErrorSeverity = undefined;
    this.saveFilterNameValid = true;
  }

  public showSave(flag: boolean): void {
    this.isSaveOpen = flag;
  }

  public saveFilter(): void {
    this.isSaveFilterInProgress = true;
    this.filterView.addSavedFilter(this.saveFilterName, this.filterView.settings)
      .subscribe(isSuccess => {
        this.isSaveFilterInProgress = false;
        if (isSuccess) {
          this.saveErrorMessage = undefined;
          this.saveErrorSeverity = undefined;
          this.isSaveOpen = false;
          this.saveFilterName = undefined;
          if (this.multiMonitorService.runsInElectron) {
            this.multiMonitorService.sendObjectToAllWindows({ type: ObjectMessageType.SystemBrowserFilter, data: null });
          }
        } else {
          this.saveErrorMessage = this.filterSaveFailedMessage;
          this.saveErrorSeverity = 'danger';
        }
      });
  }

  public onSelectRecentFilter(event: MouseEvent, i: number): void {
    if (event.defaultPrevented) {
      return;
    }
    this.filterView.selectRecentFilter(i);
  }

  public onDeleteRecentFilter(event: MouseEvent, i: number): void {
    event.preventDefault();
    this.filterView.deleteRecentFilter(i);
    // If still menu items, keep menu from closing on delete button click
    if (this.filterView.recentFilters.length > 0 || this.filterView.savedFilters.length > 0) {
      event.stopPropagation();
    }
  }

  public onSelectSavedFilter(event: MouseEvent, i: number): void {
    if (event.defaultPrevented) {
      return;
    }
    this.filterView.selectSavedFilter(i);
  }

  public onDeleteSavedFilter(event: MouseEvent, name: string): void {
    event.preventDefault();
    this.filterView.deleteSavedFilter(name).subscribe(isSuccess => {
      if (isSuccess) {
        if (this.multiMonitorService.runsInElectron) {
          this.multiMonitorService.sendObjectToAllWindows({ type: ObjectMessageType.SystemBrowserFilter, data: null });
        }
      }
    });
    // If still menu items, keep menu from closing on delete button click
    if (this.filterView.recentFilters.length > 0 || this.filterView.savedFilters.length > 1) {
      event.stopPropagation();
    }
  }

  public clearPattern(): void {
    this.filterView.settings.pattern = undefined;
  }

  public onPresetOpenChange(isOpen: boolean): void {
    this.isPresetOpen = isOpen;
  }

  public onFilterPatternChange(pattern?: string): void {
    this.filterView.settings.pattern = pattern || '';
  }

  public onObjectStateChanged(): void {
    if (!this.objectStateTree) {
      return;
    }
    this.filterView.settings.isAlarmSuppression = (this.objectStateTree[0].checked !== 'unchecked');
  }

  public onSet(event?: KeyboardEvent): void {
    // check if enter key is used and prevent angular zones from clearing search terms
    if (event && event.key === 'Enter') {
      event.preventDefault();
    }
    this.filterView.execute(false);
  }

  public onCancel(): void {
    this.filterView.cancelChanges();
  }

  private onFilterReset(): void {
    // Results in all accordions closing
    this.showSave(false);
    // this.isDisciplineOpen = false;
    // this.isObjectTypeOpen = false;
    // this.isObjectStateOpen = false;
    this.resetDisciplineSelector.next(eTsResetOperation.Clear);
    this.resetObjectTypeSelector.next(eTsResetOperation.Clear);
    this.resetObjectStateSelector.next(eTsResetOperation.Clear);
  }

  private appendString(base: string, addOn: string): string {
    if (base) {
      return `${base}, ${addOn}`;
    }
    return addOn;
  }

  private filterToDescription(f: Filter): string {
    let desc: string;
    if (f) {
      if (!f.isPatternClear) {
        desc = this.namespaceToLabel(f.patternNamespace) + ' = ' + f.pattern;
      }
      if (f.isWithinSelection) {
        desc = this.appendString(desc, this.searchWithinLabelShort);
      }
      if (f.disciplines && f.disciplines.length > 0) {
        const discList: string[] = Filter.textEntryArrAsStringArr(f.disciplines);
        if (discList.length === 1) {
          desc = this.appendString(desc, discList[0]);
        } else {
          desc = this.appendString(desc, discList.length + ' ' + this.disciplineLabel + ' ' + this.multipleFiltersLabel);
        }
      }
      if (f.objectTypes && f.objectTypes.length > 0) {
        const otList: string[] = Filter.textEntryArrAsStringArr(f.objectTypes);
        if (otList.length === 1) {
          desc = this.appendString(desc, otList[0]);
        } else {
          desc = this.appendString(desc, otList.length + ' ' + this.objectTypeLabel + ' ' + this.multipleFiltersLabel);
        }
        // desc += ", " + this.objectTypeLabel + ": ";
        // let otList: string[] = Filter.textEntryArrAsStringArr(f.objectTypes);
        // desc += otList.length === 1 ? otList[0] : otList.length + " " + this.multipleFiltersLabel;
      }
      if (f.isAlarmSuppression) {
        desc = this.appendString(desc, this.objectStateTree[0].label);
      }
    }
    return desc;
  }

  private namespaceToLabel(ns: PatternNamespaceType): string {
    let label = '';
    switch (ns) {
      case PatternNamespaceType.CnsDisplayName:
        label = this.nsCnsDescriptionLabel;
        break;
      case PatternNamespaceType.CnsName:
        label = this.nsCnsNameLabel;
        break;
      case PatternNamespaceType.DpAlias:
        label = this.nsAliasLabel;
        break;
      default:
        break;
    }
    return label;
  }

}
