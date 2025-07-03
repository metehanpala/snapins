import {
  AfterContentChecked, AfterViewInit, ChangeDetectorRef,
  Component, ElementRef, EventEmitter, HostBinding, Input,
  NgZone,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { animationFrameScheduler, Observable, Subject, Subscription } from 'rxjs';
import {
  BOOTSTRAP_BREAKPOINTS, Criterion, CriterionValue, DatepickerInputConfig, MenuItem, ResizeObserverService,
  SearchCriteria, SiFilteredSearchComponent, SiToastNotificationService, SplitOrientation
} from '@simpl/element-ng';
import {
  Absolute,
  BrowserObject,
  Filter,
  FlexUpdateLogViewDefinition,
  GmsMessageData,
  GmsSelectionType,
  HistLogColumnDescription,
  HistoryLogKind,
  LogViewDefinitionInfo,
  LogViewerServiceBase,
  LogViewResult,
  Relative,
  RelativeTimeUnitEnum,
  RowDetailsDescription,
  SystemBrowserServiceBase,
  TimeRangeFilter,
  TimeRangeSelectionEnum
} from '@gms-flex/services';
import { FullSnapInId, IHfwMessage, IStorageService, MobileNavigationService, ParamsSendMessage, SnapInBase, UnsavedDataReason } from '@gms-flex/core';
import { AppContextService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';

import { HistoryLogService } from './services/history-log.service';
import { TraceModules } from './shared/trace-modules';
import { LogViewerTableComponent } from './log-viewer-table/log-viewer-table.component';
import {
  ActivityOriginalEnumValues,
  ColumnSettings,
  CustomDialog,
  ILogViewerObj,
  MasterDetailContainerSettings,
  PaneControls,
  SelectionDetail,
  SendSelectionForHistoryLogs,
  WarningMessageContent
} from './services/history-log-view.model';
import { LogViewerRowDetailsComponent } from './log-viewer-row-details/log-viewer-row-details.component';
import { id } from '@siemens/ngx-datatable';
import { isBuffer } from 'util';
import { debounceTime, take } from 'rxjs/operators';
import { EventsCommonServiceBase } from '../events/services/events-common.service.base';
import { isEqual } from 'lodash';

interface SearchFilterData extends CriterionValue {
  disabledTime?: boolean,
}

enum SourceNames {
  SourceDesignation = 'DefaultViewDesignation',
  SourceLocation = 'DefaultViewLocation'
}

@Component({
  selector: 'gms-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrl: './log-viewer.component.scss',
  providers: [HistoryLogService],
  standalone: false
})
export class LogViewerComponent implements OnInit, OnChanges, OnDestroy, AfterContentChecked, AfterViewInit {
  @ViewChild(LogViewerTableComponent) public logViewertable!: LogViewerTableComponent;
  @ViewChild(LogViewerRowDetailsComponent) public logViewerDetails!: LogViewerRowDetailsComponent;
  @ViewChild('logViewerTable') public logViewerTableElement!: LogViewerTableComponent;
  @ViewChild('logViewer', { static: false, read: ElementRef }) public logViewerElement!: ElementRef;
  @ViewChild('siMasterDetailContainer', { static: false, read: ElementRef }) public siMasterDetailContainer!: ElementRef;
  @ViewChild('rowDetailsPane', { static: false, read: ElementRef }) public rowDetailsPane!: ElementRef;
  @ViewChild(SiFilteredSearchComponent) public siFilteredSearchComponent!: SiFilteredSearchComponent;
  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.snapin-container-overflow-auto') public guardOverflow = true;
  @HostBinding('class.rounded-bottom') public roundedBorder = true;
  @Input()
  public fromSnapin = false;
  @Input()
  public fullId?: FullSnapInId;
  @Input()
  public systemId?: number;
  @Input()
  public managedTypeName?: string;
  @Input()
  public objectId?: string;
  @Input()
  public logViewerChangeDetect: number;
  @Input()
  public readonly storageService: IStorageService;
  @Input()
  public objectDesignationRightPane?: string;
  @Input()
  public objectLocationRightPane?: string;
  @Input()
  public objectIdRightPane?: string;
  @Input()
  public alertIdHistoryLog?: string;
  @Input()
  public recordTypeHistoryLog?: string;
  @Input()
  public dpeNameHistoryLog?: string;
  @Input()
  public clickDiscardChanges: boolean;
  @Input()
  public isHistoryExpanded: boolean;
  @Input()
  public searchPlaceHolder: string;
  @Input()
  public triggerAction!: boolean;
  @Input()
  public receivedViewId: number;
  @Input()
  public showHideEmptySnapin: boolean
  @Output()
  public readonly secondaryRowSelection: EventEmitter<SendSelectionForHistoryLogs> = new EventEmitter<SendSelectionForHistoryLogs>();
  @Output()
  public readonly sendSelectionEvent: EventEmitter<SelectionDetail> = new EventEmitter<SelectionDetail>();
  @Output()
  public readonly dataLength: EventEmitter<number> = new EventEmitter<number>();
  @Output()
  public readonly isLoadingDataEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  public readonly isDetailActive: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  public readonly savedChangesEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  public readonly paneControlsOp: EventEmitter<PaneControls> = new EventEmitter<PaneControls>();
  @Output()
  public readonly criteriaLocLogViewer: EventEmitter<Criterion[]> = new EventEmitter<Criterion[]>();
  // ---------------------------------------------Master detail container-------------------------------------------
  public detailsActive = false; // this is the default
  public largeLayoutBreakpoint = BOOTSTRAP_BREAKPOINTS.mdMinimum; // this is the default
  public truncateHeading = true;
  public resizableParts = true;
  public containerMaxWidth!: number | null;
  public orientation: SplitOrientation = 'horizontal';
  public expanded = false;
  public rowData!: LogViewResult;
  public columnDecriptionMap!: Map<string, HistLogColumnDescription> | null;
  public searchCriteriaSelectable: Criterion[] = [];
  public isToShowWarningMessage = false;
  public viewSize? = 0;
  public warning = '';
  public warningMsg = '';
  public warningMsg1 = '';
  public warningMsg2 = '';
  public searchLabel = '';
  public items = '';
  public noMatch = '';
  public checkHistoryLogSubscription = null;
  public errorFetchingLVD = '';
  public emptySnapinMessage = '';
  public currentNodeInternalName = '';
  public appliedFilterCriteria: SearchCriteria = {
    criteria: [],
    value: ''
  };
  public selectedCriteriaOptions: SearchCriteria = {
    criteria: [],
    value: ''
  };
  public selectionEventDetail: SelectionDetail = {
    internalName: '',
    ruleName: ''
  };
  public split = false;
  public mobileView = false;
  public userLocalizationCulture = '';
  public userLang = '';
  public noDataDetailPane = false;
  public controlsChangedToSmallDevice = false;
  public fromSystemRightPannel = false;
  public snapInObjectId = '';
  // Activity Icons
  public actionResultBadges: ILogViewerObj = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    0: 'bg-danger', 1: 'bg-success', 2: 'bg-warning', 3: 'bg-danger', 4: 'bg-info',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    5: 'bg-danger', 6: 'bg-danger', 7: 'bg-danger', 8: 'bg-default'
  };

  public filterActions?: MenuItem[] = [];
  public columnsActions?: MenuItem[] = [];
  public snapShotId = '';
  public scrollSubject = new Subject<boolean>();
  public settings!: MasterDetailContainerSettings;
  public retainedBrowserObject: BrowserObject;
  public masterContainerWidth = 32;
  public showEmptySnapin = false;
  public relativeFiltersLVD: Map<string, [Absolute, Relative]> = new Map<string, [Absolute, Relative]>;
  public browserObject: BrowserObject;
  public resetTableInit = false;
  private firstLoad = true;
  private subActivityEnumValues!: Subscription | null;
  private checkIfDeleted = false;
  private readonly activityOriginalEnumValues!: ActivityOriginalEnumValues;
  // --------------------------------------------- log view members ------------------------------------------------

  // Store service to persist e.g. scroll bar position
  private snapinTitle!: string | undefined;
  // Used to format real values
  private readonly subscriptions: Subscription[] = [];
  private subLogEnumValues!: Subscription | null;
  private scrollSubjectSubscriptions!: Subscription;
  private discardChangesSubjectSubscriptions: Subscription;
  private readonly translateService: TranslateService;
  private filtersLoaded: Map<string, any> = new Map<string, any>();
  private activityEnums: Map<string, ActivityOriginalEnumValues> = new Map<string, ActivityOriginalEnumValues>();
  // private sourceInformationLabel = '';
  // -------------------------------------------------- c'tor -------------------------------------------------------

  constructor(
    private readonly mobileNavigationService: MobileNavigationService,
    private readonly messageBroker: IHfwMessage,
    private readonly settingsService: SettingsServiceBase,
    activatedRoute: ActivatedRoute,
    private readonly appContextService: AppContextService,
    eventCommonService: EventsCommonServiceBase,
    private readonly traceService: TraceService,
    private readonly logViewerService: LogViewerServiceBase,
    private readonly resizeObserverService: ResizeObserverService,
    private readonly historyLogService: HistoryLogService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly ngZone: NgZone
  ) {
    this.activityOriginalEnumValues = { enum: [], tag: [] };
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.siMasterDetailContainer && !this.checkHistoryLogSubscription) {
      this.subscribeContainerWidthChanges();
    }
    if (!!this.objectDesignationRightPane && !!this.objectLocationRightPane && !this.fromSnapin) {
      this.detailsActive = false;
    }
    if (changes.triggerAction && changes.triggerAction.currentValue) {
      if (this.historyLogService?.selectedObject?.Attributes?.ManagedTypeName === 'LogViewer'
        || this.historyLogService?.selectedObject?.Attributes?.ManagedTypeName === 'LogViewFolder') {
        this.logViewertable.saveAsLogViewerDefinition();
      } else {
        this.logViewertable.saveLogViewDefinition(false, undefined, true);
      }
      // Call function when input changes
    }

    if (changes?.logViewerChangeDetect?.currentValue || changes?.logViewerChangeDetect?.currentValue === 0) {
      if (this.logViewertable) {
        this.logViewertable.tableChangeDetect = changes?.logViewerChangeDetect?.currentValue;
      }
    }
  }

  // --------------------------------------------------- ngOnInit() -------------------------------------------------

  public ngOnInit(): void {
    this.SubscribeDiscardLVD();
    if (this.fromSnapin) {
      this.getTranslations();
      // Initialize translation service and user localization culture
      /*  this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
        if (userCulture != null) {
          this.translateService.use(userCulture).subscribe((_req: any) => {
            this.traceService.info(TraceModules.logViewer, `Use  user culture: ${userCulture}`);
            this.getTranslations();
            this.logViewerDetails?.processData();
          },
          (err: any) => {
            this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
              if (defaultCulture != null) {
                this.translateService.setDefaultLang(defaultCulture);
              } else {
                this.traceService.warn('No default Culture for appContextService');
                this.translateService.setDefaultLang(this.translateService.getBrowserLang()!);
              }
              this.getTranslations();
              this.logViewerDetails?.processData();
            }));
          });
        } else {
          this.traceService.warn(TraceModules.logViewer, 'No user Culture for appContextService');
        }
      })); */

      this.initUserLocalizationCulture();
      // Init message broker service
      this.subscriptions.push(this.messageBroker.getMessage(this.fullId).subscribe(
        (message: GmsMessageData) => {
          // Cleanup any existing subscriptions on node change.
          if (this.logViewertable) {
            this.logViewertable.cleanupContainerWidthChanges();
          }
          // If user selects "Navigate to Log Viewer" option in History section from right Panel,
          // message will recieve custom data.
          // Custom data have details of selected object/node.
          const sourceDesignationLabel = this.translateService.instant('FILTER-COLUMNS.SOURCE-DESIGNATION');
          const sourceLocationLabel = this.translateService.instant('FILTER-COLUMNS.SOURCE-LOCATION');
          let criteria: Criterion;
          if (message.customData) {
            this.fromSystemRightPannel = true;
            // Commenting label and name for Source information.
            if (message.customData[0]?.label === "Object Designation") {
              criteria = {
                // label: this.sourceInformationLabel,
                // name: 'Description'
                label: sourceDesignationLabel,
                name: SourceNames.SourceDesignation,
                options: [],
                value: message.customData[0]?.value || '' // Handle potential undefined or null values
              };
            } else if (message.customData[0]?.label === "Object Location") {
              criteria = {
                // label: this.sourceInformationLabel,
                // name: 'Description'
                label: sourceLocationLabel,
                name: SourceNames.SourceLocation,
                options: [],
                value: message.customData[0]?.value || '' // Handle potential undefined or null values
              };
            }
            // when the ALIAS feature is implement please add that condition here as well
            const messageBody = {
              selectedCriteriaOptions: {
                criteria: [criteria],
                value: ''
              },
              appliedFilterCriteria: {
                criteria: [criteria],
                value: ''
              }
            };

            message.customData = undefined;
            // A location filter (source information) of the object/node from
            // where the navigation took place
            // will be automatically applied (in the filtered search)
            // And the filtered results will be displayed.
            this.storageService.setState(this.fullId, messageBody);
            this.retainLogViewerState();
          }
          if (!!message) {
            this.process(message);
          }
        },
        error => {
          this.traceService.error(TraceModules.logViewer, error);
        })
      );
      // Get history event and activity logs
      this.traceService.debug(TraceModules.logViewer, `ngOnInit() end`);
      this.rowDetailsPane?.nativeElement?.addEventListener('scroll', this.onScroll.bind(this), true);
      this.scrollSubjectSubscriptions = this.scrollSubject.pipe(debounceTime(100)).subscribe(data => {
        this.saveScrollPosition(data);
      });
    }
    this.userLang = this.translateService.getBrowserLang()!;
  }

  public ngAfterContentChecked(): void {
    this.changeDetectorRef.detectChanges();
  }

  // --------------------------------------------ngAfterViewInit()-------------------------------------------------------
  public ngAfterViewInit(): void {
    this.logViewertable.firstNodeLoad = true;
    this.subscribeContainerWidthChanges();
    this.retainLogViewerState();
  }

  // -------------------------------------------- ngOnDestroy() -----------------------------------------------------

  public ngOnDestroy(): void {
    this.traceService.debug(TraceModules.logViewer, `ngOnDestroy() called`);

    // Unsubscribe i18n text subscriptions
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
    if (this.fromSnapin) {
      this.scrollSubjectSubscriptions?.unsubscribe();
      this.discardChangesSubjectSubscriptions?.unsubscribe();
      this.historyLogService.updateLVDObj?.unsubscribe();
      this.saveCurrentState();
      this.rowDetailsPane?.nativeElement?.removeEventListener('scroll', this.onScroll, true);
    }
  }

  public saveCurrentState(): void {
    // Persist scroll offset Y
    let storageData: any = this.storageService.getState(this.fullId);
    if (!storageData) {
      storageData = this.logViewertable?.logViewerRetainState || {};
    }
    // storageData.scrollOffsetY = this.logViewertable.table.element.getElementsByTagName('datatable-body')[0].scrollTop || 0;
    this.historyLogService.logViewDatahideShowVeryDetailPane.subscribe(isCollapse => {
      storageData.hideShowVeryDetailPane = isCollapse;
    });
    if (this.clickDiscardChanges) {
      storageData.appliedFilterCriteria = structuredClone(storageData.appliedServerState);
      storageData.selectedCriteriaOptions = structuredClone(storageData.appliedServerState);
    }
    // on component destroy save the data in retained state (Switching to List View, Events etc...)
    // storing only if it has all the data required in SearchCriteriaSelectable
    if (this.filtersLoaded.size === this.searchCriteriaSelectable.length + 1) {
      if (!storageData.filtersLoaded) {
        storageData.filtersLoaded = new Map();
      }
      storageData.filtersLoaded.set(this.systemId, this.filtersLoaded);
      this.historyLogService.setFilterLoaded(this.filtersLoaded, this.systemId);
    }
    // on component destroy save the data in retained state (Switching to List View, Events etc...)
    // storing only if it has all the data required in SearchCriteriaSelectable
    if (this.filtersLoaded.size === this.searchCriteriaSelectable.length + 1) {
      if (!storageData.filtersLoaded) {
        storageData.filtersLoaded = new Map();
      }
      storageData.filtersLoaded.set(this.systemId, this.filtersLoaded);
      this.historyLogService.setFilterLoaded(this.filtersLoaded, this.systemId);
    }
    storageData.savedBrowserObject = this.historyLogService.selectedObject;
    storageData.isDeleted = this.showEmptySnapin;
    const scrollTop = this.rowDetailsPane?.nativeElement?.scrollTop;
    const scrollLeft = this.rowDetailsPane?.nativeElement?.scrollLeft;
    if (scrollTop > 0 && scrollLeft > 0) {
      storageData.detailPaneScrollPosition = scrollTop;
      storageData.detailPaneScrollLeft = scrollLeft;
    }
    this.storageService.setState(this.fullId, storageData);
  }

  public setfilterData(criteria: Criterion[]): void {
    this.searchCriteriaSelectable = criteria;
    const retainedData = this.storageService?.getState(this.fullId);
    if (this.managedTypeName === 'LogViewDefinition' && this.logViewertable && this.objectId && !retainedData) {
      // Log view deifintion is loading for the first time
      this.logViewertable.firstLVDLoad = true;
      this.logViewertable.lvdActivityType.set('Activity', []);
      this.logViewertable.lvdActivityType.set('ActivityGroup', []);
      this.applyLogViewDefinitionFilter();
    }
  }

  public showHideWarningMessageHandler(warningMessageContent: WarningMessageContent): void {
    this.isToShowWarningMessage = warningMessageContent.isToShowWarningMessage;
    this.viewSize = warningMessageContent.viewSize;
    // adding this async as we reading localization texts for warning message is async.
    setTimeout(() => {
      this.translateService.get('Log_Viewer.LOG-VIEWER-WARNING-MSG.DETAILED-MSG', { viewSize: this.viewSize }).subscribe((res: string) => {
        this.warningMsg = res;
      });
    });
  }

  // this is called from simpl control when user clicks on apply filter button
  public onSearchAppliedFilterChanged(appliedFilterCriteria: SearchCriteria): void {
    this.appliedFilterCriteria = structuredClone(appliedFilterCriteria);
    this.logViewertable?.onSearchAppliedFilterChanged(appliedFilterCriteria, this.activityEnums);
  }

  // this function is called when user checks/unchecks options from filter
  public onSearchFilterChange(selectedCriteriaOptions: SearchCriteria): void {
    this.selectedCriteriaOptions = structuredClone(selectedCriteriaOptions);
    if (this.activityEnums?.size === 0 && this.logViewertable?.activityEnums) {
      this.activityEnums = this.logViewertable?.activityEnums;
    }
    this.logViewertable?.onSearchFilterChange(selectedCriteriaOptions);
  }
  // this function gets the log view definition filters from the backend
  public applyLogViewDefinitionFilter(): void {
    this.logViewerService.getLogViewDefinition(this.systemId, this.objectId.split(':')[1]).subscribe({
      next: response => {
        if (!Object.prototype.hasOwnProperty.call(response, 'ErrorInfo')) {
          const logViewDefinitionData = response.LogViewDefinationInfo;
          // when no filters are present in LVD the condition filter needs to be checked.
          logViewDefinitionData.ConditionFilter = logViewDefinitionData.ConditionFilter.filter(filter => filter.Value?.length > 0);
          // this search object is passed to the SiFilter search
          const searchObject = {
            "criteria": this.mapFilterList(logViewDefinitionData.ConditionFilter, logViewDefinitionData.TimeRangeFilter),
            "value": ""
          };

          // filters those are not supported in flex are ignored in Flex and so we don't show them in Flex and data related to them
          // boolean to check if unsupported filters are present or not
          let areAllfiltersSupportedInFlex = true;
          let filterNoMatchText = '';
          this.subscriptions.push(this.translateService.get([
            'Log_Viewer.SOME_FILTERS_MIGHT_NOT_BE_AVAILABLE'
          ]).subscribe(values => {
            filterNoMatchText = values['Log_Viewer.SOME_FILTERS_MIGHT_NOT_BE_AVAILABLE']
          })
          );
          logViewDefinitionData?.ConditionFilter?.forEach(filterItem => {
            // if value of a filter is null, it means it is non supported filter in Flex
            const filterValue = Array.isArray(filterItem.Value) ? filterItem.Value[0] : filterItem.Value;
            if (filterValue === null) {
              areAllfiltersSupportedInFlex = false;
              return;
            }
            // checks if the value is present under the types we support
            const filterDetails = this.searchCriteriaSelectable.find(filterObj => filterObj.name === filterItem.Name
              && filterItem.Operator === "=");
            if (!filterDetails && !(filterItem.Name === 'Action' || filterItem.Name === 'AlertState' ||
              filterItem.Name === 'RecordType' || filterItem.Name === 'LogType')) {
              areAllfiltersSupportedInFlex = false;
              return;
            }
          });
          // if unsupported filters are found, show a warning toast
          if (!areAllfiltersSupportedInFlex) {
            this.toastNotificationService.queueToastNotification('warning', 'Warning', filterNoMatchText);
          }

          if (searchObject.criteria?.length > 0) {
            const updateState = (): void => {
              const retainedData = this.storageService?.getState(this.fullId) || this.logViewertable?.logViewerRetainState || {};
              retainedData.appliedServerState = structuredClone(searchObject);
              this.storageService.setState(this.fullId, retainedData);
              this.storageService.setDirtyState(this.fullId, false);
            };
            // if all the criterias are time (Exact, Relative no need to get Enums)
            const allCriteriaAreTime = searchObject.criteria.every(criterion => criterion.name === 'Time');
            if (allCriteriaAreTime) {
              // simply send the criteria to simpl.
              updateState();
              this.onSearchFilterChange(searchObject);
              this.onSearchAppliedFilterChanged(searchObject);
            } else {
              this.getEnumAllFilters(this.systemId).then(() => {
                // get enums for all filters before sending criteria to simpl.
                updateState();
                this.onSearchFilterChange(searchObject);
                this.onSearchAppliedFilterChanged(searchObject);
              });
            }
          } else {
            // if no criteria are present, simply send the empty criteria to simpl   
            this.onSearchFilterChange(searchObject);
            this.onSearchAppliedFilterChanged(searchObject);
          }
        } else {
          this.traceService.error(TraceModules.logViewer, response[0].ErrorInfo);
          this.toastNotificationService.queueToastNotification('danger', 'Error', response[0].ErrorInfo);
        }
      },
      error: err => {
        this.traceService.error(TraceModules.logViewer, err);
        this.toastNotificationService.queueToastNotification('danger', 'Error', this.errorFetchingLVD);
      }
    });
  }
  // this function maps the filter object from the backend to what SiFilter search expects
  public mapFilterList(conditionFilters: Filter[], timeRangeFilters: TimeRangeFilter): SearchFilterData[] {
    const newFilterList: SearchFilterData[] = [];
    const activityLabel = this.searchCriteriaSelectable.find(filterObj => filterObj.name === 'Activity').label;
    const activityGroupLabel = this.searchCriteriaSelectable.find(filterObj => filterObj.name === 'ActivityGroup').label;
    const sourceLocDesgnNames = Object.values(SourceNames) as string[];
    // This section will add condition filters to the new filter list.
    if (Array.isArray(conditionFilters) && conditionFilters?.length > 0) {
      conditionFilters.forEach(filterItem => {
        // Ignore filter if it's value is null
        const filterValue = Array.isArray(filterItem.Value) ? filterItem.Value[0] : filterItem.Value;
        if (filterValue === null) {
          return;
        }
        const filterDetails = this.searchCriteriaSelectable.find(filterObj => filterObj.name === filterItem.Name);
        // On the flex we only support = operator for all filter's other than Date/Time. In Date/Time we also support >= & <=.
        if (filterDetails && filterItem.Operator === "=") {
          newFilterList.push({
            name: filterDetails.name,
            label: filterDetails.label,
            // If it's a Source Location/Designation filter, take 0th Value else take the whole.
            value: sourceLocDesgnNames.includes(filterDetails.name) ? filterItem.Value[0] : filterItem.Value
          });
          // In standard client we don't have Activity. So we need to handle it differntly here. Activity is combination of Action & Event State
          // Check if filter is Action/AlertState and add as Activity if true.
        } else if (filterItem.Name === 'Action' || filterItem.Name === 'AlertState') {
          newFilterList.push({ name: 'Activity', label: activityLabel, value: filterItem.Value });
          this.logViewertable.lvdActivityType.get('Activity').push({ type: filterItem.Name, values: filterItem.Value });
          // In standard client we don't have ActivityGroup. So we need to handle it differntly. ActivityGroup is combination of Record & Log Type.
          // Check if filter is Record/Log Type and add as ActivityGroup if true.
        } else if (filterItem.Name === 'RecordType' || filterItem.Name === 'LogType') {
          const filterValues = filterItem.Name === 'RecordType' ? filterItem.Value : filterItem.Value?.map(val => `${val} Activity`);
          newFilterList.push({ name: 'ActivityGroup', label: activityGroupLabel, value: filterValues });
          this.logViewertable.lvdActivityType.get('ActivityGroup').push({ type: filterItem.Name, values: filterValues });
        }
      });
    }
    const addTimeFilter = (operator, value, dateValue, disabledTime = false): void => {
      newFilterList.push({
        operator,
        name: 'Time',
        label: this.searchCriteriaSelectable.find(filterObj => filterObj.name === 'Time').label,
        value,
        dateValue,
        disabledTime
      });
    };
    if (this.relativeFiltersLVD.has(this.objectId) && !(timeRangeFilters.TimeRangeSelectionType == TimeRangeSelectionEnum.Relative)) {
      this.relativeFiltersLVD.delete(this.objectId);
    }
    // This section will add time range filters to the new filter list.
    // Only Absolute, Exact and Relative type of time range filters are supported in flex. Undefined and Null are not supported.
    switch (timeRangeFilters.TimeRangeSelectionType) {
      case TimeRangeSelectionEnum.Absolute:
        // In case of Absolute we will add two  differnt Date/Time filter in flex.
        addTimeFilter("≥", timeRangeFilters.Absolute.From, timeRangeFilters.Absolute.From);
        addTimeFilter("≤", timeRangeFilters.Absolute.To, timeRangeFilters.Absolute.To);
        break;
      case TimeRangeSelectionEnum.Exact:
        // In case of Exact a single Date/Time filter with =, >= , <= operaters will be applied.
        const dateTimeAllowedOperators = ["=", ">=", "<="];
        if (dateTimeAllowedOperators.includes(timeRangeFilters.Absolute.Operator)) {
          const operator = timeRangeFilters.Absolute.Operator;
          const mappedOperator = operator === "=" ? operator : (operator === ">=" ? "≥" : "≤");
          const value = timeRangeFilters.Absolute.From.split('T')[0];
          addTimeFilter(mappedOperator, value, timeRangeFilters.Absolute.From, true);
        }
        break;
      case TimeRangeSelectionEnum.Relative:
        // In case of Relative we will add two differnt Date/Time filter with relative start and end date.
        const now = new Date();
        const offsetUnit = timeRangeFilters.Relative.Unit;
        const startUnitOffset = timeRangeFilters.Relative.Current ? (1 - offsetUnit) : -offsetUnit;
        const endUnitOffset = timeRangeFilters.Relative.Current ? 1 : 0;
        const option = timeRangeFilters.Relative.Option;
        const startDate = this.findAdjustedDate(now, startUnitOffset, option).toISOString();
        const endDate = this.findAdjustedDate(now, endUnitOffset, option).toISOString();
        const absFil: Absolute = {
          From: startDate,
          To: endDate
        };
        const relativefils: Relative = {
          Current: timeRangeFilters.Relative.Current,
          Option: timeRangeFilters.Relative.Option,
          Unit: timeRangeFilters.Relative.Unit
        }
        this.relativeFiltersLVD.set(this.objectId, [absFil, relativefils]);
        this.logViewertable.setRelativeFiltersForLVD(this.relativeFiltersLVD);
        addTimeFilter("≥", startDate, startDate);
        addTimeFilter("≤", endDate, endDate);
      default:
    }
    return newFilterList;
  }
  // This function calculates the relative date
  public findAdjustedDate(now: Date, offset: number, option: number): Date {
    let adjustedDate: Date;
    switch (option) {
      case RelativeTimeUnitEnum.Minutes:
        adjustedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0);
        adjustedDate.setMinutes(now.getMinutes() + offset);
        break;
      case RelativeTimeUnitEnum.Hours:
        adjustedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
        adjustedDate.setHours(now.getHours() + offset);
        break;
      case RelativeTimeUnitEnum.Days:
        adjustedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        adjustedDate.setDate(now.getDate() + offset);
        break;
      case RelativeTimeUnitEnum.Weeks:
        const refDayOfWeek = now.getDay();
        const firstDayOfWeek = 0; // Assuming Sunday as the first day of the week
        adjustedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        if (refDayOfWeek >= firstDayOfWeek) {
          adjustedDate.setDate(now.getDate() - (refDayOfWeek - firstDayOfWeek) + (7 * offset));
        } else {
          adjustedDate.setDate(now.getDate() - 7 + (firstDayOfWeek - refDayOfWeek) + (7 * offset));
        }
        break;
      case RelativeTimeUnitEnum.Months:
        adjustedDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        adjustedDate.setMonth(now.getMonth() + offset);
        break;
      case RelativeTimeUnitEnum.Years:
        adjustedDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        adjustedDate.setFullYear(now.getFullYear() + offset);
      default:
    }
    return adjustedDate;
  }

  // ------------------------------------------- process request ------------------------------------------------------
  public process(message: GmsMessageData): void {
    this.snapInObjectId = message?.data[0]?.ObjectId;
    // In case of invalid message condition , just return
    if (!message?.data?.length) {
      return;
    }
    this.getLogViewerState();
    if (!(this.showEmptySnapin && this.retainedBrowserObject)) {
      this.ngZone.run(() => {
        this.showEmptySnapin = false;
        // Here we are adding change detection
        // This is needed when we delete LVD and come back to log-viewer node
        // Then after setting showEmptySnapin to false logViewertable will not become available immediatly.
        this.changeDetectorRef.detectChanges();
        this.browserObject = message?.data[0];
        // Before switching from partner and master save the filters in historyLogService.
        this.storeFilterInRetainedState();
        if (this.systemId && this.systemId !== this.browserObject.SystemId) {
          this.logViewertable.prevSystemId = this.systemId;
        } else {
          const prevSystemId = this.logViewertable && (this.logViewertable.prevSystemId = null);
        }
        this.historyLogService.setSelectedObject(this.browserObject);
        this.systemId = this.browserObject.SystemId;

        // Log Viewer: Flex Client loses connection after applying filter
        // on every time log viewer node selection from system browser, we should load enumerations for filtering
        // as enumeration values can be different for different systems in distributed environmenet
        this.filtersLoaded = new Map<string, any>();
        // set the filterOptions if present in historyLogs.
        this.setFilterOptions(this.systemId);
        if (!this.fromSystemRightPannel) {
          this.logViewertable.nodeReselection = true;
          this.siFilteredSearchComponent.deleteAllCriteria(new MouseEvent('click'));
        } else {
          this.logViewertable.nodeReselection = false;
          this.fromSystemRightPannel = false;
        }

        this.historyLogService.logViewRowDetails.next(null);
        if (this.resetTableInit) {
          this.logViewertable.resetTable();
        }
        this.logViewerDetails.resetData();
      });
    }
    if (this.retainedBrowserObject) {
      this.historyLogService.selectedObject = this.retainedBrowserObject;
      return;
    }
  }

  /**
   * This method is used to track the scroll position of detail pane
   */
  public onScroll(event: Event): void {
    this.scrollSubject.next(true);
  }

  public onResetTable(resetTable: boolean): void {
    this.resetTableInit = (resetTable);
  }

  public saveScrollPosition(event: boolean): void {
    let storageData: any = this.storageService.getState(this.fullId);
    if (!storageData) {
      storageData = this.logViewertable?.logViewerRetainState || {};
    }
    storageData.detailPaneScrollPosition = this.rowDetailsPane.nativeElement?.scrollTop;
    storageData.detailPaneScrollLeft = this.rowDetailsPane.nativeElement?.scrollLeft;
    this.logViewertable.logViewerRetainState.detailPaneScrollPosition = storageData.detailPaneScrollPosition;
    this.logViewertable.logViewerRetainState.detailPaneScrollLeft = storageData.detailPaneScrollLeft;
    this.storageService.setState(this.fullId, storageData);
  }
  /**
   * This method is used to retain scroll bar position when secondary pane is closed
   */
  public retainScrollBarsInSecondaryInstanceClosed(): void {
    const retainedData = this.storageService.getState(this.fullId);
    if (!!retainedData) {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      this.setScrollPositionForDetailPane(this.logViewertable?.logViewerRetainState?.detailPaneScrollPosition || 0);
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      this.setScrollPositionLeftForDetailPane(this.logViewertable?.logViewerRetainState?.detailPaneScrollLeft || 0);
    }
  }
  /**
   * This method is used to inject the retained applied filter to the child component
   * logviewertable filterCriteria value
   */
  public retainLogViewerState(): void {
    const retainedData = this.storageService?.getState(this.fullId);
    if (!!retainedData) {
      // get the filter options if they are already stored in the retained state corresponding the current system ID
      if (retainedData && retainedData.filtersLoaded && retainedData.filtersLoaded.get(this.systemId)) {
        this.filtersLoaded = retainedData.filtersLoaded.get(this.systemId);
      }
      if (retainedData?.selectedCriteriaOptions) {
        this.selectedCriteriaOptions = retainedData?.selectedCriteriaOptions;
        this.logViewerTableElement.selectedCriteriaOptions = this.selectedCriteriaOptions;
        if (retainedData) {
          if (!(isEqual(retainedData?.appliedServerState, this.selectedCriteriaOptions))) {
            this.storageService.setDirtyState(this.fullId, true);
          } else {
            this.storageService.setDirtyState(this.fullId, false);
          }
        } else {
          this.storageService.setDirtyState(this.fullId, false);
        }
      }
      if (this.logViewertable) {
        this.logViewertable.logViewerRetainState = {};
        this.logViewertable.logViewerRetainState = retainedData;
      }
      this.snapShotId = retainedData?.snapShotId;
      this.historyLogService.logViewDatahideShowVeryDetailPane.next(retainedData?.hideShowVeryDetailPane);
      this.historyLogService.detailPaneIsLoaded.subscribe(isDetailPaneLoaded => {
        if (isDetailPaneLoaded) {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          this.setScrollPositionForDetailPane(this.logViewertable?.logViewerRetainState?.detailPaneScrollPosition || 0);
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          this.setScrollPositionLeftForDetailPane(this.logViewertable?.logViewerRetainState?.detailPaneScrollLeft || 0);
        }
      });
    }
  }
  /**
   * This method is used to set the scroll bar position Y for retained state of detail pane
   *  The scroll bar position Y = 0 means top position.
   */
  public setScrollPositionForDetailPane(scrollOffsetY: number): void {
    if (scrollOffsetY > 0) {
      setTimeout(() => {
        this.rowDetailsPane.nativeElement.scrollTop = scrollOffsetY;
        if (this.snapShotId !== this.logViewertable.logViewerRetainState?.snapShotId) {
          this.logViewertable.logViewerRetainState.detailPaneScrollPosition = 0;
        }
      });
    }
  }

  public setScrollPositionLeftForDetailPane(scrollOffsetY: number): void {
    if (scrollOffsetY > 0) {
      setTimeout(() => {
        this.rowDetailsPane.nativeElement.scrollLeft = scrollOffsetY;
        if (this.snapShotId !== this.logViewertable.logViewerRetainState?.snapShotId) {
          this.logViewertable.logViewerRetainState.detailPaneScrollLeft = 0;
        }
      });
    }
  }
  /**
   * This method is used to set the scroll bar position Y. The scroll bar position Y = 0 means top position.
   */
  public setScrollBarPositionY(scrollOffsetY: number): void {

    // Schedule scroll position to be restored after attach and just prior to view rendering
    if (scrollOffsetY > 0) {
      animationFrameScheduler.schedule(() => {
        // this.logViewertable.table.element.getElementsByTagName('datatable-body')[0].scrollTop = scrollOffsetY;
      });
    }
  }

  // get all filters from backend, this is called only if the LVD has preloaded fiters. Instead of N calls a single call will bring all the filter options
  public getEnumAllFilters(systemId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.filtersLoaded.size === this.searchCriteriaSelectable.length + 1) { resolve(); }
      const columnsName = this.searchCriteriaSelectable
        .filter(item => item.name !== "Time")
        .map(item => item.name);
      if (!columnsName.includes("ActivityTagOnlyForFlex")) {
        columnsName.push("ActivityTagOnlyForFlex");
      }
      if (!columnsName.includes("ActivityGroupTagOnlyForFlex")) {
        columnsName.push("ActivityGroupTagOnlyForFlex");
      }
      const filterOptions = this.historyLogService.getFilterLoaded(this.systemId);
      if (filterOptions) {
        this.filtersLoaded = filterOptions;
        resolve();
      } else {
        this.logViewerService
          .getHistoryLogColumnEnums(systemId, HistoryLogKind.ActivityFeed, columnsName)
          .subscribe({
            next: data => {
              // setting data for search bar filters on Init
              data.ColumnEnumValues.forEach(enumData =>
                this.filtersLoaded.set(enumData.ColumnName, enumData.SupportedEnumValues)
              );
              // store this data in storage service
              // setting data that will be used at the time of save (This data is required in log-viewer-table component)
              const columnsToMap = [
                { key: "Activity", tagKey: "ActivityTagOnlyForFlex" },
                { key: "ActivityGroup", tagKey: "ActivityGroupTagOnlyForFlex" }
              ];

              columnsToMap.forEach(({ key, tagKey }) => {
                const enumData = data.ColumnEnumValues?.find(ele => ele.ColumnName === key);
                const tagData = data.ColumnEnumValues?.find(ele => ele.ColumnName === tagKey);

                if (enumData?.SupportedEnumValues && tagData?.SupportedEnumValues) {
                  this.historyLogService.historylogsactivityEnums.set(key, {
                    enum: enumData.SupportedEnumValues,
                    tag: tagData.SupportedEnumValues
                  });
                }
              });
              resolve();
            },
            error: err => {
              this.traceService.error(TraceModules.logViewer, err);
              reject(err);
            }
          });
      }
    });
  }
  /**
   * This method is used to provide the enum values for a particular category name (i.e. column name). The filtered
   * search control bar loads them lazy from the CC backend, then when needed to be shown to the user.
   */
  public lazyValueProvider = (categoryName: string, typed: string): Observable<string[] | null> => {
    if (categoryName === "Time") {
      return;
    }
    const subject = new Subject<string[] | null>();
    let filteredValues: string[] | null;
    if (!this.subLogEnumValues) {
      // Log Viewer: Flex Client loses connection after applying filter
      // if user is filtering, we dont need to load enumerations everytime.
      // We are keeping them in map and if it is already loaded then dont load same enumeration again, just reuse it
      if (!this.filtersLoaded.has(categoryName)) {
        this.subLogEnumValues = this.logViewerService.getHistoryLogEnumValues(this.systemId, HistoryLogKind.ActivityFeed, categoryName).subscribe(
          data => {
            this.getActivityTypes(categoryName);
            // Insert enum values in search criterion
            const enumValues = data?.EnumValues;
            const enumVals = Object.assign([], data?.EnumValues ?? []);
            if (categoryName.includes('Activity')) {
              this.activityOriginalEnumValues.enum = Object.assign([], data?.EnumValues ?? []);
              this.activityOriginalEnumValues.tag = [];
            }
            filteredValues = enumValues ? enumValues : null as string[] | null;
            filteredValues?.sort();
            this.filtersLoaded.set(categoryName, enumVals);
            subject.next(filteredValues);
            this.subLogEnumValues!.unsubscribe();
            this.subLogEnumValues = null;
          },
          error => {
            this.traceService.error(TraceModules.logViewer, `lazyValueProvider() returned Error = ${JSON.stringify(error)}}`);
          }
        );
      } else {
        // Log Viewer: Flex Client loses connection after applying filter
        // if user is filtering, we dont need to load enumerations everytime.
        // We are keeping them in map and if it is already loaded then dont load same enumeration again, just reuse it
        const arrayList = Object.assign([], this.filtersLoaded.get(categoryName));
        if (categoryName.includes('Activity')) {
          this.activityOriginalEnumValues.enum = Object.assign([], arrayList);
          const categoryNameOnly = categoryName === 'Activity' ? 'ActivityTagOnlyForFlex' : 'ActivityGroupTagOnlyForFlex';
          if (this.filtersLoaded.has(categoryNameOnly)) {
            const arrayListOnly = this.filtersLoaded.get(categoryNameOnly);
            this.activityOriginalEnumValues.tag = Object.assign([], arrayListOnly ?? []);
          }
          if (!this.activityEnums?.has(categoryName)) {
            this.activityEnums?.set(categoryName, Object.assign([], this.activityOriginalEnumValues));
          }
        }
        // adding setTimeout as subject.next(arryList); requires async call and hence adding this setTimeout
        setTimeout(() => {
          arrayList?.sort();
          subject.next(arrayList);
        }, 100);
      }
    }
    return subject.asObservable();
  };

  public getActivityTypes(categoryName: string): void {
    // this needs to be tested for different different languages
    if (!this.subActivityEnumValues && (categoryName === 'Activity' || categoryName === 'ActivityGroup')) {
      const categoryNameOnly = categoryName === 'Activity' ? 'ActivityTagOnlyForFlex' : 'ActivityGroupTagOnlyForFlex';
      this.subActivityEnumValues = this.logViewerService.getHistoryLogEnumValues(this.systemId, HistoryLogKind.ActivityFeed, categoryNameOnly).subscribe(
        data => {
          // Insert enum values in search criterion
          this.activityOriginalEnumValues.tag = Object.assign([], data?.EnumValues ?? []);
          this.filtersLoaded.set(categoryNameOnly, this.activityOriginalEnumValues.tag);
          this.activityEnums.set(categoryName, Object.assign([], this.activityOriginalEnumValues));
          this.subActivityEnumValues!.unsubscribe();
          this.subActivityEnumValues = null;
        },
        error => {
          this.traceService.error(TraceModules.logViewer, `lazyValueProvider() Activity or ActivityGroup returned Error = ${JSON.stringify(error)}}`);
        }
      );
    }
  }

  public onCustomDialogue(custmDialg: CustomDialog): void {
    this.filterActions = custmDialg?.primaryActions;
    this.columnsActions = custmDialg?.secondaryActions;
    if (this.filterActions.length === 0) {
      this.mobileView = true;
    } else {
      this.mobileView = false
    }
  }

  // Will pass the snapIn Objectid to show the log viewer details in the right panel
  public showLogViewerDetails(showDetails: string, alertId: string = "", RecordType: string = ""): void {
    const params: SendSelectionForHistoryLogs = {
      // this is only for the case of detailed log, therefore we send the pageSize - 100
      designation: this.snapInObjectId,
      alertId: "",
      recordType: "",
      internalName: "",
      pageSize: 100
    }
    if (showDetails === 'LogViewerDetails') {
      this.secondaryRowSelection.next(params);
    } else {
      params.alertId = alertId;
      params.recordType = RecordType;
      params.designation = showDetails;
      params.internalName = showDetails;
      this.secondaryRowSelection.next(params);
    }
  }

  public onChangesSavedEvent(value: boolean): void {
    this.savedChangesEvent.next(value);
  }
  public sendSelectionDetails(ruleName: string): void {
    this.selectionEventDetail.internalName = this.currentNodeInternalName;
    this.selectionEventDetail.ruleName = ruleName;
    this.sendSelectionEvent.next(this.selectionEventDetail);
  }

  public onResize(settings: MasterDetailContainerSettings): void {
    if (settings) {
      const str = JSON.stringify(settings);
      this.logViewerService.putSettings(
        'LogViewerSettings',
        `'${str}'`).subscribe();
      this.retainScrollBarsInSecondaryInstanceClosed();
    }
  }

  public onSplitterPositionChange(masterContainerWidthChange: number): void {
    if (!this.firstLoad) {
      this.settings.masterDataContinerSize = masterContainerWidthChange;
      const str = JSON.stringify(this.settings);
    }
  }

  public setSplitterPosition(settings: MasterDetailContainerSettings): void {
    if (settings) {
      this.firstLoad = false;
      this.settings = settings;
      this.masterContainerWidth = typeof (settings.masterDataContinerSize!) === 'string' ? 50 : (settings.masterDataContinerSize ?? 50);
    }
  }

  public criteriaLoc(criteria: Criterion[]): void {
    this.criteriaLocLogViewer.emit(criteria);
  }

  public logTableDataLength(length: number): void {
    this.dataLength.next(length);
  }

  public historyDataFetched(flag: boolean): void {
    this.isLoadingDataEvent.next(flag);
  }

  public detailsActiveChange(event): void {
    if (!this.fromSnapin) {
      this.isDetailActive.next(event);
    }
  }

  public paneControls(event: PaneControls): void {
    this.paneControlsOp.next(event);
  }
  public userLocale(event): void {
    this.userLocalizationCulture = event;
  }

  public noData(value: boolean): void {
    this.noDataDetailPane = value;
    this.changeDetectorRef.detectChanges();
  }

  public onDeleteLogViewDefinition(isLvdDeleted: boolean): void {
    this.showEmptySnapin = isLvdDeleted;
    if (!this.checkIfDeleted) {
      this.checkIfDeleted = isLvdDeleted;
    }
  }

  private subscribeContainerWidthChanges(): void {
    if (!(this.siMasterDetailContainer?.nativeElement)) {
      this.traceService.warn('Unable to locate si-tree-view element in DOM for width monitoring');
      return;
    }

    // Subscribe for size changes on this host element
    this.subscriptions.push(this.resizeObserverService.observe(this.siMasterDetailContainer.nativeElement, 100, true, true)
      .subscribe(dim => { this.containerMaxWidth = (dim?.width) ? dim?.width : null; })
    );

    // Subscribe for size changes on this host element
    this.subscriptions.push(this.resizeObserverService.observe(this.rowDetailsPane.nativeElement, 100, true, true)
      .subscribe(dim => {
        if (dim?.width < 600) {
          this.split = true;
          this.historyLogService.splitDetailControls.next(true);
        } else {
          this.split = false;
          this.historyLogService.splitDetailControls.next(false);

        }
      })
    );
    // Do check if any row is selected
    this.checkHistoryLogSubscription = this.subscriptions.push(this.historyLogService.logViewRowDetails.subscribe((rowData: RowDetailsDescription | null) => {
      this.detailsActive = rowData ? true : false;
      if ((rowData && this.containerMaxWidth != null) || (rowData && this.checkIfDeleted)) {
        this.currentNodeInternalName = rowData?.logViewResult?.HiddenInternalName;
        this.showLogViewerDetails(rowData?.logViewResult?.HiddenInternalName, rowData?.logViewResult?.AlertId, rowData?.logViewResult?.RecordTypeId);
      }
    }));
  }

  // ---------------------------------------------------------------------------------------------------------------

  // ------------------------------------------ Private Methods -----------------------------------------------------

  /**
   * Init user localization culture of logged in user (i.e. corresponds to the browser culture).
   * Use this culture to format values like real values.
   */
  private initUserLocalizationCulture(): void {
    this.subscriptions.push(this.appContextService.userLocalizationCulture.subscribe((userLocCulture: string) => {
      if ((userLocCulture !== null) && (userLocCulture.length > 0)) {
        this.userLocalizationCulture = userLocCulture;
      } else {
        this.traceService.warn(TraceModules.logViewer,
          `No user localization culture set on appContextService! Use the culture set by the browser: ${this.translateService.getBrowserLang()}`);
        this.userLocalizationCulture = this.translateService.getBrowserLang()!;
      }
    }));
  }

  private SubscribeDiscardLVD(): void {
    this.discardChangesSubjectSubscriptions = this.historyLogService.discardChangesSub.subscribe(searchOpts => {
      searchOpts = searchOpts || { criteria: [], value: '' };
      this.onSearchFilterChange(searchOpts);
      this.onSearchAppliedFilterChanged(searchOpts);
    });
  }
  // check if the data is present in history log service and set it in filtersLoaded
  private setFilterOptions(systemId: number): void {
    const filterOptions = this.historyLogService.getFilterLoaded(systemId);
    if (this.filtersLoaded.size === 0 && filterOptions) {
      this.filtersLoaded = filterOptions;
    }
  }
  private storeFilterInRetainedState(): void {
    let storageData: any = this.storageService.getState(this.fullId);
    if (!storageData) {
      storageData = this.logViewertable?.logViewerRetainState || {};
    }
    if (this.filtersLoaded.size === this.searchCriteriaSelectable.length + 1) {
      if (!storageData.filtersLoaded) {
        storageData.filtersLoaded = new Map();
      }
      storageData.filtersLoaded.set(this.systemId, this.filtersLoaded);
      this.historyLogService.setFilterLoaded(this.filtersLoaded, this.systemId);
    }
  }
  private getLogViewerState(): void {
    this.retainedBrowserObject = undefined;
    const res: any = this.storageService.getState(this.fullId);
    if (res) {
      this.retainedBrowserObject = res.savedBrowserObject;
      this.showEmptySnapin = res.isDeleted;
    }
  }

  private getTranslations(): void {
    this.subscriptions.push(this.translateService.get([
      'Log_Viewer.SNAPIN-TITLE',
      'Log_Viewer.WARNING',
      'Log_Viewer.FILTER-PLACEHOLDER',
      'Log_Viewer.SOME_FILTERS_MIGHT_NOT_BE_AVAILABLE',
      'Log_Viewer.SEARCH_LABEL',
      // 'FILTER-COLUMNS.SOURCE-INFORMATION',
      'Log_Viewer.FILTERED_ITEMS',
      'Log_Viewer.NO_MATCHING_CRITERIA',
      'Log_Viewer.LVD_ERROR_MESSAGES.UNABLE_FETCH_LVD',
      'Log_Viewer.EMPTY_SNAPIN_TEXT_TITLE'
    ]).subscribe(values => {
      this.snapinTitle = values['Log_Viewer.SNAPIN-TITLE'];
      HistoryLogService.snapinTitle = this.snapinTitle;
      // eslint-disable-next-line @typescript-eslint/dot-notation
      this.searchPlaceHolder = values['Log_Viewer.FILTER-PLACEHOLDER'];
      this.searchLabel = values['Log_Viewer.SEARCH_LABEL'];
      // this.sourceInformationLabel = values['FILTER-COLUMNS.SOURCE-INFORMATION'];
      this.items = values['Log_Viewer.FILTERED_ITEMS'];
      this.noMatch = values['Log_Viewer.NO_MATCHING_CRITERIA'];
      this.errorFetchingLVD = values['Log_Viewer.LVD_ERROR_MESSAGES.UNABLE_FETCH_LVD'];
      this.emptySnapinMessage = values['Log_Viewer.EMPTY_SNAPIN_TEXT_TITLE'];
    })
    );
  }
}
