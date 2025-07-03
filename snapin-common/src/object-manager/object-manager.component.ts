import { DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { asyncScheduler, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, first, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { TreeItem } from '@simpl/element-ng';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { BrowserObject, CNS_DESCRIPTION_REGEX, CNS_NAME_REGEX, CnsLocation, Designation, ViewNode } from '@gms-flex/services';
import { HfwFilterPillData } from '@gms-flex/controls';
import { TraceModules } from '../shared/trace-modules';
import { TraceServiceDelegate } from '../shared/trace-service-delegate';
import { SelectionRequest } from '../object-manager-core/view-model/types';
import { Filter, FilterSetting, PatternNamespaceType } from '../object-manager-core/view-model/filter';
import { AggregateViewId } from '../object-manager-core/data-model/types';
import { ObjectManagerViewModel, ObjectManagerViewModelIfc } from '../object-manager-core/view-model/object-manager-vm';
import { ObjectTypeInfo, ObjectViewIfc } from '../object-manager-core/view-model/object-view';
import { FilterState } from '../object-manager-core/view-model/filter-view';
import { ItemTemplateTranslator, TreeItemData, TreeItemlLifeCycleState } from '../object-manager-core/view-model/tree-item-data';
import { ObjectManagerCoreServiceBase } from '../object-manager-core/object-manager-core.service.base';
import { BrowserViewComponent, TreeStyle } from './browser-view/browser-view.component';
import { ObjectManagerConfig, ObjectManagerSaveAction, ObjectManagerSaveActionResult, ObjectManagerViewConfig,
  SelectedItemsChangedArgs, SelectionMenuItem } from './object-manager.types';

export enum DisplayState {
  Browser,
  FilterSelector,
  SearchInProgress,
  FilterResults
}

@Component({
  selector: 'gms-object-manager',
  templateUrl: './object-manager.component.html',
  styleUrl: './object-manager.component.scss',
  standalone: false
})
export class ObjectManagerComponent implements OnInit, OnDestroy, ItemTemplateTranslator {

  @Input() public clientId: string;
  @Input() public reset: boolean;
  // The configuration block is treated as one-time binding and will be evaluated only at time of
  // component initialization.  Further, configuration settings will apply only to a component being
  // created for the first time (newly registered view-model) or being `reset`.
  @Input() public config: ObjectManagerConfig;
  @Input() public title: string;
  @Input() public treeStyle: TreeStyle;
  @Input() public singleSelection: boolean;
  @Input() public showValue: boolean;
  @Input() public showStatus: boolean;
  @Input() public enableUserFilter: boolean;
  @Input() public enableSelectionMenu: boolean;
  @Input() public set selectionMenuItems(value: SelectionMenuItem[]) {
    this.menuItems = value;
  }
  @Input() public creatableTypes: string[];
  @Input() public saveCallback: ObjectManagerSaveAction;
  @Input() public dialogContainer: boolean;

  @Output() public readonly dialogBtnClicked: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public readonly saveBrowserObj: EventEmitter<BrowserObject> = new EventEmitter<BrowserObject>();

  public readonly eDisplayState: any = DisplayState;

  public vm: ObjectManagerViewModelIfc;
  public objectDescription: string;
  public objectName: string;  
  public filterPills: HfwFilterPillData[];
  public isSavePending = false;
  public menuItems: SelectionMenuItem[];

  public descriptionLabel: string;
  public desciptionLabelError: string;
  public nameLabel: string;
  public nameLabelError: string;
  public locationLabel: string;
  public namespaceCnsNameLabel: string;
  public namespaceCnsDescriptionLabel: string;
  public namespaceAliasLabel: string;
  public disciplineLabel: string;
  public objectTypeLabel: string;
  public alarmSuppressionLabel: string;
  public searchWithinLabelShort: string;
  public multipleFiltersLabel: string;
  public filterClearMessage: string;
  public searchInProgressMessage: string;
  public genericCreateLabel: string;
  public genericCreateCancelLabel: string;
  public genericCreateSaveLabel: string;
  public genericCreateErrorMessage: string;
  public dialogCancelLabel: string;
  public dialogSelectLabel: string;
  public dialogSaveLabel: string;
  public objectSaveErrorMessage: string;
  public dialogErrorMessage: string;
  public filterShowAriaLabel: string;
  public filterCancelAriaLabel: string;
  public readonly nameMaxLength: number = 255;

  private previousObjectName = '';
  private readonly traceSvc: TraceServiceDelegate;
  private readonly translateService: TranslateService;
  private postActiveViewFlag: boolean;
  private readonly selectedItemsChangedInd: EventEmitter<SelectedItemsChangedArgs> = new EventEmitter<SelectedItemsChangedArgs>();
  private readonly selectedViewChangedInd: EventEmitter<AggregateViewId> = new EventEmitter<AggregateViewId>();
  private selectionRequestInd: Observable<SelectionRequest>;
  private selectionSubscription: Subscription;
  private reattachInd: Observable<void>;
  private reattachSubscription: Subscription;
  private destroyInd: Subject<void>;
  private readonly emptyArray: readonly any[] = [];  

  @ViewChild(BrowserViewComponent) private readonly currentBrowserView: BrowserViewComponent;

  // NOTE: The consumer of this component should bind a ReplaySubject to this input property to ensure
  //   selection requests generated prior to the binding being updated are received and processed by
  //   this component.
  @Input() public set updateSelection(ind: Observable<SelectionRequest>) {
    this.setSelectionRequestIndicator(ind);
  }

  @Input() public set reattachIndication(ind: Observable<void>) {
    this.setReattachIndicator(ind);
  }

  @Input() public set postActiveView(flag: boolean) {
    this.postActiveViewFlag = flag;
    if (this.vm) {
      this.vm.enableSelectedViewReporting(this.postActiveViewFlag);
    }
  }

  @Output() public get selectedItemsChanged(): EventEmitter<SelectedItemsChangedArgs> {
    return this.selectedItemsChangedInd;
  }

  // Applies only when OM is displaying aggregate-views.  If custom views have been configured,
  // changes between custom views are not indicated to the client.
  // This indication is ONLY to allow the System Browser to write the last-view-selected to
  // user-settings on the server so that this view can be redisplayed on application startup.
  // There are no such requirements for scenarios involving custom views!
  @Output() public get selectedViewChanged(): EventEmitter<AggregateViewId> {
    return this.selectedViewChangedInd;
  }
  public readonly trackByIndex = (index: number): number => index;  

  public onNameChange(event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    const filteredValue = newValue.replace(CNS_NAME_REGEX, '');   
    
    if (newValue !== filteredValue) {      
      inputElement.value = filteredValue; // Update the input field directly to prevent cursor jumping
    } 
   
    const previousObjectNameTransformed: string = this.NameToDescTransform(this.previousObjectName);
    if (previousObjectNameTransformed === this.objectDescription) {
      this.objectDescription = this.NameToDescTransform(filteredValue);
    }
    this.previousObjectName = filteredValue;
    
    // workaround to have the red highlight after entering only one invalid char
    asyncScheduler.schedule(() => { this.objectName = filteredValue; }, 10);
  }

  public onDescriptionChange(event: any): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    const filteredValue = newValue.replace(CNS_DESCRIPTION_REGEX, '');
   
    if (newValue !== filteredValue) {      
      inputElement.value = filteredValue; // Update the input field directly to prevent cursor jumping
    }

    // workaround to have the red highlight after entering only one invalid char
    asyncScheduler.schedule(() => { this.objectDescription = filteredValue; }, 10);
  }

  public get isSaveDialog(): boolean {
    return !isNullOrUndefined(this.saveCallback);
  }

  public get genericCreateButtonLabel(): string {
    let label: string = this.config ? this.config.newItemBtnTxt : undefined;
    if (label) {
      return label;
    }
    label = this.genericCreateLabel;
    if (!(this.vm?.selectedView)) {
      return label;
    }
    const otInfo: readonly ObjectTypeInfo[] = this.genericCreateTypes;
    if (otInfo.length === 1) {
      label = `${label} ${otInfo[0].description}`;
    }
    return label;
  }

  public get genericCreateTypes(): readonly ObjectTypeInfo[] {
    if (!(this.vm?.selectedView)) {
      return this.emptyArray; // always return the same empty array for bindings!
    }
    return this.vm.selectedView.selectedItemCreatableTypes;
  }

  public get isGenericCreateEnabled(): boolean {
    if (this.vm?.selectedView) {
      return this.displayState === DisplayState.Browser && this.vm.selectedView.isGenericCreationEnabled;
    }
    return false;
  }

  public get isGenericCreateActive(): boolean {
    return this.vm?.selectedView ? !isNullOrUndefined(this.vm.selectedView.transientItem) : false;
  }

  public get isGenericItemDefined(): boolean {
    if (this.isGenericCreateActive) {
      return CnsLocation.checkNodeDescription(this.vm.selectedView.transientItemDescription);
    }
    return false;
  }

  public get isItemSelected(): boolean {
    return this.selectedItems.length > 0;
  }

  public get selectedItems(): readonly TreeItem[] {
    if (this.displayState === DisplayState.Browser && this.vm.selectedView) {
      return this.vm.selectedView.selectedItems;
    }
    if (this.displayState === DisplayState.FilterResults && this.vm.filter) {
      return this.vm.filter.selectedItems;
    }
    return this.emptyArray;
  }

  public get showDialogButtons(): boolean {
    if (this.displayState === DisplayState.FilterSelector || this.displayState === DisplayState.SearchInProgress) {
      return false;
    }
    return true;
  }

  public get isFilterActive(): boolean {
    return Boolean(this.vm?.filter && !this.vm.filter.isIdle);
  }

  public get displayState(): DisplayState {
    const fstate: FilterState = this.vm?.filter ? this.vm.filter.state : FilterState.Idle;
    let dstate: DisplayState = DisplayState.Browser;
    switch (fstate) {
      case FilterState.Configure:
        dstate = DisplayState.FilterSelector;
        break;
      case FilterState.Executing:
        dstate = DisplayState.SearchInProgress;
        break;
      case FilterState.Results:
        dstate = DisplayState.FilterResults;
        break;
      case FilterState.Idle:
      default:
        break;
    }
    return dstate;
  }

  public get disableToolbarFilterControls(): boolean {
    return this.displayState === DisplayState.SearchInProgress;
  }

  public get showToolbar(): boolean {
    return this.enableUserFilter;
  }

  public constructor(
    private readonly ngZone: NgZone,
    private readonly cdRef: ChangeDetectorRef,
    private readonly ds: DomSanitizer,
    private readonly traceService: TraceService,
    private readonly objectManagerCoreService: ObjectManagerCoreServiceBase) {

    this.translateService = objectManagerCoreService.commonTranslateService;
    this.traceSvc = new TraceServiceDelegate(this.traceService, TraceModules.objectManager);
    this.destroyInd = new Subject<void>();

    this.translateService.get('OM-DESCRIPTION-LABEL').subscribe(s => this.descriptionLabel = s);
    this.translateService.get('OM-DESCRIPTION-ERROR').subscribe(s => this.desciptionLabelError = s);
    this.translateService.get('OM-NAME-LABEL').subscribe(s => this.nameLabel = s);
    this.translateService.get('OM-NAME-ERROR').subscribe(s => this.nameLabelError = s);
    this.translateService.get('OM-LOCATION-LABEL').subscribe(s => this.locationLabel = s);        
    this.translateService.get('OM-FILTER-NAMESPACE-CNS-NAME-LABEL').subscribe(s => this.namespaceCnsNameLabel = s);
    this.translateService.get('OM-FILTER-NAMESPACE-CNS-DESCRIPTION-LABEL').subscribe(s => this.namespaceCnsDescriptionLabel = s);
    this.translateService.get('OM-FILTER-NAMESPACE-ALIAS-LABEL').subscribe(s => this.namespaceAliasLabel = s);
    this.translateService.get('OM-FILTER-DISCIPLINE-LABEL').subscribe(s => this.disciplineLabel = s);
    this.translateService.get('OM-FILTER-OBJECT-TYPE-LABEL').subscribe(s => this.objectTypeLabel = s);
    this.translateService.get('OM-FILTER-ALARM-SUPPRESSION-LABEL').subscribe(s => this.alarmSuppressionLabel = s);
    this.translateService.get('OM-FILTER-SEARCH-WITHIN-LABEL-SHORT').subscribe(s => this.searchWithinLabelShort = s);
    this.translateService.get('OM-FILTER-MULTIPLE-VALUES-LABEL').subscribe(s => this.multipleFiltersLabel = s);
    this.translateService.get('OM-FILTER-CLEAR-MESSAGE').subscribe(s => this.filterClearMessage = s);
    this.translateService.get('OM-SEARCH-IN-PROGRESS-MESSAGE').subscribe(s => this.searchInProgressMessage = s);
    this.translateService.get('OM-GENERIC-CREATE-LABEL').subscribe(s => this.genericCreateLabel = s);
    this.translateService.get('OM-GENERIC-CREATE-CANCEL-LABEL').subscribe(s => this.genericCreateCancelLabel = s);
    this.translateService.get('OM-GENERIC-CREATE-SAVE-LABEL').subscribe(s => this.genericCreateSaveLabel = s);
    this.translateService.get('OM-GENERIC-CREATE-ERROR').subscribe(s => this.genericCreateErrorMessage = s);
    this.translateService.get('OM-CANCEL-LABEL').subscribe(s => this.dialogCancelLabel = s);
    this.translateService.get('OM-OBJECT-SELECT-LABEL').subscribe(s => this.dialogSelectLabel = s);
    this.translateService.get('OM-OBJECT-SAVE-LABEL').subscribe(s => this.dialogSaveLabel = s);
    this.translateService.get('OM-OBJECT-SAVE-ERROR').subscribe(s => this.objectSaveErrorMessage = s);
    this.translateService.get('OM-SHOW-FILTER-BUTTON-ARIA-LABEL').subscribe(s => this.filterShowAriaLabel = s);
    this.translateService.get('OM-CANCEL-FILTER-BUTTON-ARIA-LABEL').subscribe(s => this.filterCancelAriaLabel = s);
  }

  public ngOnInit(): void {
    // Establish view-model id and whether view-model should be "reset" (re-created)
    let id: string = this.clientId;
    let resetFlag = Boolean(this.reset);
    if (!id) {
      id = '_ObjectManagerGeneric';
      resetFlag = true;
    }
    if (resetFlag) {
      this.traceSvc.debug('Reset object-manager view-model: id=%s', id);
      this.objectManagerCoreService.unregisterViewModel(id); // force VM to be re-created
    }

    // Register new/existing view-model
    this.vm = this.objectManagerCoreService.registerViewModel(id, this.ngZone);
    if (!this.vm) {
      throw new Error('view-model registration failed');
    }
    this.traceSvc.debug('Registered view-model: id=%s, userLocale=%s', id, this.vm.locale);

    // Initialize and configure view-model
    if (!this.vm.isInitialized) {
      // Configure view-model prior to first use
      this.vm.injectItemTemplateTranslator(this);
      const vconfig: ObjectManagerViewConfig = this.config ? this.config.viewConfig : undefined;
      const initsel: string = this.config ? this.config.initialSelection : undefined;
      this.vm.setViewConfig(vconfig, initsel);
    }
    this.vm.enableSelectedViewReporting(this.postActiveViewFlag);
    // Re-set the selection request indicator to establish a subscription now that the VM is created
    this.setSelectionRequestIndicator(this.selectionRequestInd);
    this.setReattachIndicator(this.reattachInd);

    this.objectName = '';
    if (this.config?.defaultSaveObjectName) {      
      this.objectName = this.config.defaultSaveObjectName;
      this.previousObjectName = this.objectName;
    }

    this.objectDescription = '';
    if (this.config?.defaultSaveObjectDesc) {
      this.objectDescription = this.config.defaultSaveObjectDesc;
    }   

    // Activate the view-model
    this.vm.activate(this.ds).subscribe(
      () => {
        // Post activation.
        // When the filter settings change, update the pill data
        this.vm.filter.filterChanged
          .pipe(
            takeUntil(this.destroyInd))
          .subscribe(() => this.onFilterChanged());
        // In the event VM data is changed outside of Angular change detection, manually trigger
        // change detection in order to keep UI control data bindings up to date.
        // Indications to this handler are throttled to avoid rapid CD cycles.
        this.vm.filter.dataChangedUndetected
          .pipe(
            debounceTime(100),
            takeUntil(this.destroyInd))
          .subscribe(() => this.cdRef.detectChanges());
      });
  }

  public ngOnDestroy(): void {
    this.vm.deactivate();
    this.updateSelection = undefined;
    this.reattachIndication = undefined;
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }

  public getItemTemplateName(state: TreeItemlLifeCycleState): string {
    return BrowserViewComponent.mapLifeCycleStateToTemplateName(state);
  }

  // TEMPORARY!!!  Allows CNS views to be exposed to System Browser until searching
  //  can be incorporated into OM.
  public getCnsViewsForBrowserObject(bo: BrowserObject): ViewNode[] {
    const omVm: ObjectManagerViewModel = this.vm as ObjectManagerViewModel;
    if (omVm) {
      return omVm.getCnsViewsByBrowserObject(bo);
    }
    return undefined;
  }

  public onGenericCreate(index?: number): void {
    if (!this.currentBrowserView) {
      return;
    }
    this.dialogErrorMessage = undefined;
    this.currentBrowserView.genericCreate(index || 0);
  }

  public onGenericCreateCancel(): void {
    if (!this.currentBrowserView) {
      return;
    }
    this.currentBrowserView.genericCreateCancel();
  }

  public onGenericCreateSave(event?: KeyboardEvent): void {
    if (event && event.key === 'Enter') {
      event.preventDefault();
    }
    if (!this.currentBrowserView) {
      return;
    }
    this.currentBrowserView.genericCreateSave()
      .subscribe(
        () => {},
        err => {
          this.traceSvc.error('Create new item failed: %s', err);
          this.dialogErrorMessage = err || this.genericCreateErrorMessage;
        }
      );
  }

  public onCancelDialog(): void {
    this.dialogBtnClicked.emit(false);
  }

  public onSelectObject(): void {
    this.dialogBtnClicked.emit(true);
  }

  public onSaveObject(): void {
    if (!this.saveCallback) {
      this.traceSvc.error('Call made to save object with no client-provide callback method');
      this.dialogErrorMessage = this.objectSaveErrorMessage;
      return;
    }
    if (this.isSavePending) {
      this.traceSvc.error('Call made to save object with operation already in progress; duplicate call ignored');
      return;
    }
    // Extract designation from selection (either in browser / filter-results views)
    let parentDesignation: Designation;
    if (this.selectedItems.length > 0) {
      const ti: TreeItem = this.selectedItems[0];
      let dStr: string;
      if (this.displayState === DisplayState.FilterResults) {
        dStr = (ti.customData as BrowserObject).Designation;
      } else {
        dStr = TreeItemData.extract(ti).cnsNode.designation;
      }
      parentDesignation = new Designation(dStr);
    }
    if (!parentDesignation) {
      this.traceSvc.error('Call made to save object with no location selected');
      this.dialogErrorMessage = this.objectSaveErrorMessage;
      return;
    }
    // Execute save action provided by client
    this.dialogErrorMessage = undefined;
    this.isSavePending = true;
    this.saveCallback(this.objectName, this.objectDescription, parentDesignation)
      .pipe(
        first(resp => !isNullOrUndefined(resp), {} as ObjectManagerSaveActionResult))
      .subscribe(
        resp => {
          if (resp.newObject) {
            // Emit saved object (expectation is that this will result in closing of the dialog);
            this.saveBrowserObj.emit(resp.newObject);
            // this.isSavePending = false;    // NOTE: avoid clearing wait-state here as dialog is expected to close
          } else {
            this.dialogErrorMessage = resp.message || this.objectSaveErrorMessage;
            this.isSavePending = false;
          }
        },
        // Handle error thrown by client; display error and restore dialog state
        err => {
          this.dialogErrorMessage = err.message || this.objectSaveErrorMessage;
          this.isSavePending = false;
        });
  }

  public onFilterSelectorClicked(): void {
    // Toggle the filter selector show/hide
    this.vm.filter.showSelector = !this.vm.filter.showSelector;
  }

  public onFilterChanged(): void {
    this.filterPills = this.filterToPillDataArr(this.vm.filter.pillDataFilter);
  }

  public onDeletePill(pillData: HfwFilterPillData): void {
    if (!pillData) {
      return;
    }
    this.vm.filter.clearSetting(pillData.filterId);
  }

  public onSelectedItemsChanged(args: SelectedItemsChangedArgs): void {
    if (!args || !args.objects || args.objects.length === 0) {
      return;
    }
    // This handler may be called during an Angular change-detection cycle when the `updateSelection`
    // input parameter is modified/set (happens on SNI initialization if an HFW selection is waiting).
    // If the output emitter is triggered inside this change-detection cycle, an Angular error
    // ("Expression has changed after it was checked") may occur depending on downstream handling.
    // We avoid this here by emitting the output on the next tick (after the CD cycle has completed).
    setTimeout(() => {
      // Update the filter selection-context if the selection was made directly (i.e., not through
      // the contextual menu) and from the browser view (i.e., not from search results)
      if (isNullOrUndefined(args.menuId) && this.vm.filter.isIdle) {
        this.vm.setUserFilterSelectionContext(args.objects[0]);
      }
      this.selectedItemsChangedInd.emit(args);
    }, 0);
    if (this.isFilterActive && this.vm.selectedView) {
      this.vm.selectedView.clearSelectedItems();
    }
  }

  // NOTE: Applies to non-customized view-models only!
  //  Currently, the OM component will configure only a single custom view.  So, there is no need
  //  for a view selector control (combo box).  Also, the VM does not yet support setting a
  //  currently "selected" custom-view (concept is only supported for aggregate-views).
  public onSelectedViewChanged(index: number): void {
    if (this.vm.isCustomized) {
      return;
    }
    const view: ObjectViewIfc = this.vm.views[index];
    const id: AggregateViewId = view ? view.id : undefined;
    this.vm.setSelectedView(id);
    this.selectedViewChangedInd.emit(id);
  }

  public isSelectedView(view: ObjectViewIfc): boolean {
    return Boolean(this.vm && (this.vm.selectedView === view || this.vm.isCustomized));
  }

  private NameToDescTransform(name: string): string {
    if (!name) {
      return '';
    }

    // Replace all underscores with empty space
    let desc = name.replace(/_/g, ' ');

    // Prefix empty space before all the capital letters preceded by a (non upper case letter or empty space or underscore)
    desc = desc.replace(/([^A-Z\s_])([A-Z])/g, '$1 $2');
    return desc.trim();
  }

  private setSelectionRequestIndicator(ind: Observable<SelectionRequest>): void {
    if (this.selectionRequestInd === ind && this.selectionSubscription) {
      // This indicator is already set AND has been subscribed to
      return; // no change
    }
    // Unsubscribe from previously held selection-request indicator, if necessary, before assigning new ind
    if (this.selectionSubscription && !this.selectionSubscription.closed) {
      this.selectionSubscription.unsubscribe();
    }
    this.selectionRequestInd = ind;
    this.selectionSubscription = undefined;
    // Subscribe to indicator.
    // NOTE: if the VM has not yet been created (pre-initialization), skip subscribing; this method
    //  will be called explicity during initialization and after the VM has been created to re-set
    //  the indicator and establish the subscription.
    if (this.selectionRequestInd && this.vm) {
      this.selectionSubscription = this.selectionRequestInd
        .subscribe(
          sel => {
            if (sel) {
              this.vm.setSelectedItem(sel);
            }
          });
    }
  }

  private setReattachIndicator(ind: Observable<void>): void {
    if (this.reattachInd === ind && this.reattachSubscription) {
      // This indicator is already set AND has been subscribed to
      return; // no change
    }
    // Unsubscribe from previously held indicator, if necessary, before assigning new ind
    if (this.reattachSubscription && !this.reattachSubscription.closed) {
      this.reattachSubscription.unsubscribe();
    }
    this.reattachInd = ind;
    this.reattachSubscription = undefined;
    // Subscribe to indicator.
    // NOTE: if the VM has not yet been created (pre-initialization), skip subscribing; this method
    //  will be called explicity during initialization and after the VM has been created to re-set
    //  the indicator and establish the subscription.
    if (this.reattachInd && this.vm) {
      this.reattachSubscription = this.reattachInd
        .subscribe(
          () => {
            this.vm.views.forEach(v => v.processReattach());
            this.vm.filter.processReattach();
          });
    }
  }

  private filterToPillDataArr(f: Filter): HfwFilterPillData[] {
    const pillDataArr: HfwFilterPillData[] = [];
    if (f && !f.isClear) {
      if (!f.isPatternClear) {
        pillDataArr.push(
          new HfwFilterPillData(
            FilterSetting.Pattern,
            this.namespaceToLabel(f.patternNamespace),
            [f.pattern]));
      }
      if (f.isWithinSelection) {
        pillDataArr.push(
          new HfwFilterPillData(
            FilterSetting.SelectionScope,
            this.searchWithinLabelShort,
            [this.vm.filter.selectionShort]));
      }
      if (!isNullOrUndefined(f.disciplines)) {
        pillDataArr.push(
          new HfwFilterPillData(
            FilterSetting.Discipline,
            this.disciplineLabel,
            Filter.textEntryArrAsStringArr(f.disciplines))
        );
      }
      if (!isNullOrUndefined(f.objectTypes)) {
        pillDataArr.push(
          new HfwFilterPillData(
            FilterSetting.ObjectType,
            this.objectTypeLabel,
            Filter.textEntryArrAsStringArr(f.objectTypes))
        );
      }
      if (f.isAlarmSuppression) {
        pillDataArr.push(
          new HfwFilterPillData(
            FilterSetting.AlarmSuppression,
            this.alarmSuppressionLabel,
            [String(true)])
        );
      }
    }
    return pillDataArr;
  }

  private namespaceToLabel(ns: PatternNamespaceType): string {
    let label = '';
    switch (ns) {
      case PatternNamespaceType.CnsDisplayName:
        label = this.namespaceCnsDescriptionLabel;
        break;
      case PatternNamespaceType.CnsName:
        label = this.namespaceCnsNameLabel;
        break;
      case PatternNamespaceType.DpAlias:
        label = this.namespaceAliasLabel;
        break;
      default:
        break;
    }
    return label;
  }

}
