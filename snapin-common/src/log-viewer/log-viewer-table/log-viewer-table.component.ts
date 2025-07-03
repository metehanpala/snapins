import { Component, ElementRef, EventEmitter, HostBinding, input, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChange, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, iif, Observable, of, Subject, Subscription } from 'rxjs';
import { DeviceType, FullSnapInId, IHfwMessage, IObjectSelection, IStorageService, MobileNavigationService,
  SnapInBase, UnsavedDataReason } from '@gms-flex/core';
import { AppContextService, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { LogViewerValidationHelperService } from '../services/log-viewer-validation-helper.service';
import {
  Absolute,
  ActivityIcon,
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  CnsLabelEn,
  CNSNode,
  Designation,
  DetailPane,
  Filter,
  FlexUpdateLogViewDefinition,
  GmsMessageData,
  GmsSelectionType,
  HistLogColumnDescription,
  HistoryApiParams,
  HistoryLogKind,
  HistoryLogTable,
  LogViewDefinitionInfo,
  LogViewerServiceBase,
  LogViewResult,
  Relative,
  RowDetailsDescription,
  SortColumnData,
  SystemBrowserService,
  TimeRangeFilter,
  TimeRangeSelectionEnum,
  ValidationInput,
  ValueServiceBase,
  ViewNode
} from '@gms-flex/services';
import { Column, ColumnSelectionDialogResult, Criterion, DeleteConfirmationDialogResult, MenuItem, ResizeObserverService,
  // eslint-disable-next-line max-len
  SearchCriteria, SiActionDialogService, SiColumnSelectionDialogConfig, SiColumnSelectionDialogService, SiFilteredSearchComponent, SiModalComponent, SiModalService,
  SiToastNotificationService } from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable';
import { ColumnMode, DatatableComponent, SelectionType, TableColumnProp } from '@siemens/ngx-datatable';
import { ColHeaderData } from '../../events/event-data.model';
import { debounceTime, findIndex, map, mergeMap, take, tap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { LogViewDefinationModel } from '../../object-manager-service';
import { isEqual } from 'lodash'

import { ActivityOriginalEnumValues,
  ColumnSettings,
  CustomDialog,
  GridHeaderData,
  ILogViewerObj,
  LogViewerRetainState,
  MasterDetailContainerSettings,
  ScrollData,
  SystemViewNode,
  WarningMessageContent
} from '../services/history-log-view.model';
import { HistoryLogService } from '../services/history-log.service';
import { TraceModules } from '../shared/trace-modules';
import { Guid } from '../shared/guid';
import { EventsCommonServiceBase } from '../../events/services/events-common.service.base';
import { fileURLToPath } from 'url';

interface CriterionMultiple extends Criterion {
  hasMultipleValues?: boolean;
  values?: any[];
}

enum DefaultColumns {
  Icon = 'Icon',
  Activity = 'Activity',
  ActivityMessage = 'ActivityMessage',
  Time = 'Time',
  DefaultViewDesignation = 'DefaultViewDesignation'
}

enum DefaultColumnsWidth {
  Icon = 80,
  Activity = 150,
  SourceName = 150,
  Time = 110,
  SourceDescription = 150
}

enum SourceNames {
  SourceDesignation = 'DefaultViewDesignation',
  SourceLocation = 'DefaultViewLocation'
}

@Component({
  selector: 'gms-log-viewer-table',
  templateUrl: './log-viewer-table.component.html',
  styleUrl: './log-viewer-table.component.scss',
  providers: [LogViewerValidationHelperService],
  standalone: false
})
export class LogViewerTableComponent implements OnChanges, OnInit, OnDestroy {

  @Input()
  public fromSnapin = false;

  @Input() public fullId!: FullSnapInId;

  @Input() public systemId!: number;

  @Input() public managedTypeName: string;

  @Input() public objectId: string;

  @Input() public browserObject: BrowserObject;

  @Input()
  public siFilteredSearch!: SiFilteredSearchComponent;

  @Input()
  public tableChangeDetect: number;

  @Output()
  public readonly colResizeEvent: EventEmitter<MasterDetailContainerSettings> = new EventEmitter<MasterDetailContainerSettings>();

  @Output()
  public readonly splitterPositionEvent: EventEmitter<MasterDetailContainerSettings> = new EventEmitter<MasterDetailContainerSettings>();

  @Output()
  public readonly filterDataEvent: EventEmitter<Criterion[]> = new EventEmitter<Criterion[]>();

  @Output()
  public readonly showHideWarningMessage: EventEmitter<WarningMessageContent> = new EventEmitter<WarningMessageContent>();
  @Output()
  public readonly showCustomDialogueEvent: EventEmitter<CustomDialog> = new EventEmitter<CustomDialog>();
  @Output()
  public readonly criteriaLoc: EventEmitter<Criterion[]> = new EventEmitter<Criterion[]>();
  @Input()
  public actionResultBadges: ILogViewerObj = {};
  @Input()
  public storageService: IStorageService;
  @Input()
  public objectDesignationRightPane?: string;
  @Input()
  public alertIdHistoryLog?: string;
  @Input()
  public recordTypeHistoryLog?: string;
  @Input()
  public dpeNameHistoryLog?: string;
  @Input()
  public objectLocationRightPane?: string;
  @Input()
  public objectIdRightPane?: string;
  @Input()
  public isHistoryExpanded: boolean;
  @Input()
  public viewId: number;
  @Output()
  public readonly isLoadingDataEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  public readonly dataLength: EventEmitter<number> = new EventEmitter<number>();
  @Output()
  public readonly userLocale: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  public readonly showLogViewerProperties: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  public readonly sendSelectionEvent: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  public readonly savedChangesEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  public readonly resetTableInit: EventEmitter<boolean> = new EventEmitter();
  @Output() 
  public readonly lvdDeleted: EventEmitter<boolean> = new EventEmitter();
  // Reference to ngx datatable

  @ViewChild(DatatableComponent) public table!: DatatableComponent;
  @ViewChild(DatatableComponent) public compactTable!: DatatableComponent;
  @ViewChild('logViewerTable', { static: true, read: ElementRef }) public logViewerTableElement!: ElementRef;
  @ViewChild('table', { static: false, read: ElementRef }) public logViewerTable!: ElementRef;

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.snapin-container-overflow-auto') public guardOverflow = true;
  // ------------------------------------------ ngx table related members -------------------------------------------

  // Default set of initialized variables that are typically used for the ngx data table
  public systems: SystemViewNode | undefined;
  public readonly firstColumnId: string = 'Icon';
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public selectionType = SelectionType;
  public selectedRows: LogViewResult[] = [];
  public totalElements = 0;
  public columnMode = ColumnMode.standard;
  public showCompact!: boolean | null;
  public tempShowCompact!: boolean;
  public filterActions: MenuItem[] = [];
  public columnsActions: MenuItem[] = [];
  public relativeFiltersLVDMap: Map<string, [Absolute, Relative]> = new Map<string, [Absolute, Relative]>;
  public isFilterClear = false;
  public gridControlCustomizeTitle = '';
  public gridControlLogViewerTitle = '';
  public customizationModalYesBtn = '';
  public customizationModalVisibleBtn = '';
  public customizationModalHiddenBtn = '';
  public customizationModalCancelBtn = '';
  public restoreToDefault = '';
  public gridControlNavigateTo = '';
  public bodyTitle = '';
  public rowIndex!: number;
  public isEventsFilterSelectorOpen = false;
  public updatedColumns: ColHeaderData[] = [];
  public tempUpdatedColumns: ColHeaderData[] = [];
  public showColumnSelectionDlgSubj: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public showColumnSelectionDlg: Observable<boolean> = this.showColumnSelectionDlgSubj.asObservable();
  public compactColumnWidth = 60;
  public pageLimit = 100;
  public pageNumber = 0;
  public limit = 0;
  public responsiveTableWidth = 700;
  public refreshButtonTitle = '';
  public saveButtonLogViewerTitle = '';
  public discardChangesButtonTitle = '';
  public saveAsButtonLogViewerTitle = '';
  public deleteButtonLogViewerTitle = '';
  public deleteTitle = '';
  public deleteMessage = '';
  public newFolder = '';
  public successMessage = '';
  public errorMessage = '';
  public successDeleteMessage = '';
  public errorDeleteMessage = '';
  public relativeFilterModifiedMessage = '';
  public relativeFilterIgnoredMessage = '';
  public exactDateTimeIgnoredMessage = '';
  public createErrorMessage = '';
  public colSettingsDefault: Map<TableColumnProp, number> = new Map();
  public masterContainerSettings: MasterDetailContainerSettings = {};
  public columnSettings?: ColumnSettings[] = [];
  public sort?: SortColumnData[] = [];
  public activitiesLabel = '';
  public itemsLabel = '';
  public scrollSubject = new Subject<ScrollData>();
  public prevSystemId!: number | null;
  public firstLoad!: boolean;
  public userLocalizationCulture = '';
  public userLang = '';
  public deviceInfo = '';
  public compactRowHeight = 104;
  public tabularRowHeight = 64;
  public tabularHeaderHeight = 40;
  public compactHeaderHeight = 42;
  public isToShowWarningMessage!: boolean;
  public rowDetailsData!: RowDetailsDescription;
  public hiddenColumnWidth = 0;
  public activityIconLabel = '';
  public activityEnums: Map<string, ActivityOriginalEnumValues> = new Map<string, ActivityOriginalEnumValues>();
  public refreshTable = false;
  public hideLocation = false;
  public firstLVDLoad = false;
  public firstNodeLoad = false;
  public lvdActivityType: Map<string, { type: string, values: string[] }[]> = 
    new Map<string, { type: string, values: string[] }[]>([['Activity', []], ['ActivityGroup', []]]);
  // The messageTable.emptyMessage is defaulted and subsequently initialized with a multi-lingual text since it is displayed
  // in the central function snapin; i.e. the total- and selectedMessage only needed when the page footer is visualized.
  public messageTable = {
    emptyMessage: 'No data',
    totalMessage: 'total',
    selectedMessage: 'selected'
  };
  public joinedFilters!: string | undefined;
  // Used to start and stop the loading spinner
  public loadingOnRequest = false;
  public loading = false;

  // Column header texts
  public gridHeaderData = new GridHeaderData();

  // Result of history log read service request
  public histLogResult: LogViewResult[] = [];

  // Search criteriacriteria that can be selected by the user (i.e. depends from cns label kind)
  public searchCriteriaSelectable: Criterion[] = [];
  public refreshDataAvailable = false;
  public onDefault = false;
  public tableOffset = 0;
  public reverseFlag!: boolean;
  public nodeReselection!: boolean;
  public CustomDialog: CustomDialog;
  public selectedCriteriaOptions: SearchCriteria = {
    criteria: [],
    value: ''
  };
 
  // Activity Icons
  public logViewerRetainState: LogViewerRetainState = {};
  public isCompletedRetainSortedColumn = false;
  public icons: DetailPane = {};
  public sourceName = false;
  public sourceDescription = false;
  public tableChangeDetected = -1;
  // ------------------------------------------ private log view members -------------------------------------------

  private columnDescriptionsMap: Map<string, HistLogColumnDescription> = new Map<string, HistLogColumnDescription>();
  private subscriptions: Subscription[] = [];
  private historyLogsubscriptions!: Subscription;
  private scrollSubjectSubscriptions!: Subscription;
  private resizeObserverSubscriptions!: Subscription;
  private LogViewerValidationHelperSubscription: Subscription;
  private alertIdSDescriptor: string;
  // Search criteria type is provided to the Simpl si-filtered-search element:
  // I.e. usage of Criterion data structure:
  // - name:    name of filter criteria (non-translatable) that is used like a key
  // - label:   display label (multi-lingual); i.e. used in si-filtered-search; corresponds with resp. grid header title
  // - options: proposed filter criteria options like Fault, Off Normal, etc. for the Status property
  private searchCriteria: Criterion[] = [];

  // Used to keep the search criteria as provided by the user
  private appliedFilterCriteria: SearchCriteria = {
    criteria: [],
    value: ''
  };
  private deleteSubscription: Subscription;
  private defaultColumnsHeaderData: ColHeaderData[] = [];
  private closedCustomDlgEvent: EventEmitter<ColumnSelectionDialogResult> = new EventEmitter<ColumnSelectionDialogResult>();
  private readonly modalRef;
  private isDistributed: boolean | undefined = undefined;
  private textForNoData = '';
  private backenResponseWithErrorCode = '';
  private newTableWidth = 0;
  private readonly subLogEnumValues!: Subscription;
  // Store service to persist e.g. scroll bar position
  // private storageService!: IStorageService;
  private expanded = false;
  private snapshotId!: string;
  private newSnapshotCreated = false;
  private onfilter!: boolean;
  private onSorted!: boolean;
  private selectedRowPageNumber!: number;
  private discardSnapshotSubscription!: Subscription;
  private fromDate: Date | undefined;
  private toDate: Date | undefined;
  private objectLocation = '';
  private objectDesignation = '';
  private filterObjectDesignation = '';
  private filterObjectLocation = '';
  private activityOriginalEnumValues!: ActivityOriginalEnumValues;
  private readonly activityGroupOriginalEnumValues!: ActivityOriginalEnumValues;
  private readonly translateService: TranslateService;
  private criteriaLocData: Criterion[] = [{
    label: '',
    name: 'Description',
    value: ''
  }];
  public readonly trackByIndex = (index: number): number => index;
  
  // -------------------------------------------------- c'tor -------------------------------------------------------
  constructor(
    private readonly mobileNavigationService: MobileNavigationService,
    public readonly messageBroker: IHfwMessage,
    public activatedRoute: ActivatedRoute,
    private readonly appContextService: AppContextService,
    private readonly objectSelectionService: IObjectSelection,
    eventCommonService: EventsCommonServiceBase,
    private readonly traceService: TraceService,
    private readonly logViewerService: LogViewerServiceBase,
    private readonly historyLogService: HistoryLogService,
    private readonly systemBrowserService: SystemBrowserService,
    private readonly resizeObserverService: ResizeObserverService,
    private readonly elementRef: ElementRef,
    private readonly modalService: SiColumnSelectionDialogService,
    private readonly siModal: SiActionDialogService,
    private readonly valueService: ValueServiceBase,
    private readonly settingsService: SettingsServiceBase,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly logViewerValidationHelperService: LogViewerValidationHelperService
  ) {
    this.activityOriginalEnumValues = { enum: [], tag: [] };
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!!this.objectDesignationRightPane && !!this.objectLocationRightPane && !this.fromSnapin && this.isHistoryExpanded) {
      this.histLogResult = [];
      this.totalElements = 0;
      this.showCompact = true;
      this.historyLogsubscriptions?.unsubscribe();
      this.discardSnapshot();
      this.loadingOnRequest = true;
      this.subscriptions.push(this.logViewerService.getHistoryLogColumnDescripton(this.systemId, HistoryLogKind.ActivityFeed).subscribe(
        data => {

          // get AlertId descriptor which is should be sent to wsi to filter data for selected even, for german language
          const alertIdIndex = data.findIndex(item => item.Name === 'AlertId');
          if (alertIdIndex != -1) {
            this.alertIdSDescriptor = data[alertIdIndex]?.Descriptor;
          }
          const indexDefaultViewDesignation = data.findIndex(item => item.Name === 'DefaultViewDesignation');
          const indexDefaultViewLocation = data.findIndex(item => item.Name === 'DefaultViewLocation');
          const defaultViewDesignationVal = data[indexDefaultViewDesignation].Descriptor;
          const defaultViewLocationVal = data[indexDefaultViewLocation].Descriptor;
          const filterLocation = this.sourceName ? defaultViewDesignationVal : defaultViewLocationVal;
          const filterLocationValue = this.sourceName ? this.objectDesignationRightPane : this.objectLocationRightPane;
          this.joinedFilters = `'${filterLocation}' = "${filterLocationValue}"`;
          this.criteriaLocData = [{
            label: filterLocation,
            name: 'Description',
            value: filterLocationValue
          }];
          this.criteriaLoc.emit(this.criteriaLocData);
          this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(cnsLabel => {
            this.updateSourceBasedOnLayout(cnsLabel);
          }));
          this.readHistoryLogs(undefined, [this.objectDesignationRightPane],
            (!this.sort && this.sort?.length >= 1 ? this.sort! : undefined), 100, undefined, this.snapshotId);
        }
      ));
    }

    if (changes?.tableChangeDetect?.currentValue || changes?.tableChangeDetect?.currentValue === 0) {
      this.tableChangeDetected = changes.tableChangeDetect.currentValue;
    }
  }

  // --------------------------------------------------- ngOnInit() -------------------------------------------------

  public ngOnInit(): void {
    if (this.fromSnapin) {
      // Initialize translation service and user localization culture
      this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
        if (userCulture != null) {
          this.translateService.use(userCulture).subscribe((_req: any) => {
            this.traceService.info(TraceModules.logViewer, `Use  user culture: ${userCulture}`);
          },
          (err: any) => {
            this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
              if (defaultCulture != null) {
                this.translateService.setDefaultLang(defaultCulture);
              } else {
                this.traceService.warn('No default Culture for appContextService');
                this.translateService.setDefaultLang(this.translateService.getBrowserLang()!);
              }
            }));
          });
        } else {
          this.traceService.warn(TraceModules.logViewer, 'No user Culture for appContextService');
        }
      }));
      this.initUserLocalizationCulture();
      window.onunload = (): void => {
        localStorage.setItem(`${this.fullId.snapInId}-refreshed`, 'true');
      };
      localStorage.removeItem(`refreshed`);
      if (localStorage.getItem(`${this.fullId.snapInId}`) && !localStorage.getItem(`${this.fullId.snapInId}-retain`) && (
        localStorage.getItem(`${this.fullId.snapInId}-refreshed`) ||
        localStorage.getItem(`${this.fullId.snapInId}-comparison-refreshed`))) {
        const snapshotId = localStorage.getItem(this.fullId.snapInId);
        if (snapshotId?.length) {
          this.subscriptions.push(this.logViewerService.discardSnapshot(this.systemId, HistoryLogKind.ActivityFeed, snapshotId as string)
            .subscribe(val => {
              this.traceService.info(TraceModules.logViewer, `snapshot is discarded - ${snapshotId}`);
              localStorage.removeItem(this.fullId.snapInId);
              localStorage.removeItem(`${this.fullId.snapInId}-refreshed`);
            }));
        }
      }
      if (localStorage.getItem(`${this.fullId.snapInId}-retain`)) {
        localStorage.removeItem(`${this.fullId.snapInId}-retain`);
      }
    }
    this.subscriptions.push(this.systemBrowserService.getViews().subscribe((viewNode: ViewNode[]) => {
      this.systems = { views: [...viewNode], IsDistributed: false };
      const systemIds = {};
      this.systems.views.forEach(ele => {
        if (!systemIds[ele.SystemId]) {
          systemIds[ele.SystemId] = true;
        }
      });
      if (Object.keys(systemIds).length > 1) {
        this.systems.IsDistributed = true;

      } else {
        this.systems.IsDistributed = false;
      }
      this.firstLoad = true;
      this.logViewerService.getActivityIconJson().subscribe(data => {
        this.icons = data as DetailPane;
        this.process();
        this.resetTableInit.emit(true);
      });
    }));
    this.userLang = this.translateService.getBrowserLang()!;
    // Get device information
    this.deviceInfo = this.mobileNavigationService.getDeviceInfo();
    /* const state = this.storageService?.getState(this.fullId);
    if (!(state?.historylogsactivityEnums.has("Activity") &&
          state?.historylogsactivityEnums
            .has("ActivityGroup"))) {
      this.logViewerService
        .getHistoryLogColumnEnums(this.systemId, HistoryLogKind.ActivityFeed, [
          "Activity",
          "ActivityGroup",
          "ActivityTagOnlyForFlex",
          "ActivityGroupTagOnlyForFlex"
        ])
        .subscribe(data => {
          const columnsToMap = [
            { key: "Activity", tagKey: "ActivityTagOnlyForFlex" },
            { key: "ActivityGroup", tagKey: "ActivityGroupTagOnlyForFlex" }
          ];

          columnsToMap.forEach(({ key, tagKey }) => {
            const enumData = data.ColumnEnumValues.find(ele => ele.ColumnName === key);
            const tagData = data.ColumnEnumValues.find(ele => ele.ColumnName === tagKey);

            if (enumData && tagData) {
              this.historyLogService.historylogsactivityEnums.set(key, {
                enum: enumData.SupportedEnumValues,
                tag: tagData.SupportedEnumValues
              });
            }
          });
          if (state) {
            state.historylogsactivityEnums = this.historyLogService?.historylogsactivityEnums;
            this.storageService?.setState(this.fullId, state);
          }

        });
    } */

    // To update descriptor when new logviewdefinition is created
    this.historyLogService.updateLVDObj.subscribe(LVDConfig => {
      if (LVDConfig) {
        const browserObject = new Array<BrowserObject>();
        browserObject.push(this.historyLogService.selectedObject);
        browserObject[0].Descriptor = LVDConfig.Descriptor;
        this.objectSelectionService.setSelectedObject(this.fullId, new GmsMessageData(browserObject, GmsSelectionType.Object));
      }
    });
    this.traceService.debug(TraceModules.logViewer, `ngOnInit() end`);
  }

  public getLocation(rowData: any): string {
    this.hideLocation = false;
    let activity: ActivityIcon | undefined;
    if (rowData?.RecordTypeId === '1') {
      activity = this.icons?.actions?.activityIcons![rowData?.ActionId];
    } else if (rowData?.RecordTypeId === '2') {
      activity = this.icons?.events?.activityIcons![rowData?.EventStateId];
    }
    if (!!activity && !activity?.hideMasterLocation) {
      const locationColumnName = activity.locationColumnName;
      if (!!locationColumnName && (!!rowData[locationColumnName] || !!rowData?.Value)) {
        // 71 "descriptor": "Station Identification" , if it is succeeded user rowData.Value else rowData.Workstation
        if (rowData?.ActionId === '71' && rowData?.Status === 'Succeeded') {
          rowData.Workstation = '';
          return rowData?.Value ?? rowData[locationColumnName]; // value="md3a..." and workStation="WEBCLIENT";
        } else {
          return rowData[locationColumnName]; // Workstation
        }
      } else {
        if (this.sourceDescription) {
          return (rowData?.DefaultViewLocation?.split(':'))?.[1];
        } else if (this.sourceName) {
          return (rowData?.DefaultViewDesignation?.split(':'))?.[1];
        }
      }
      return '';
    }
    return '';
  }

  // -------------------------------------------- Reset Data ------------------------------------------------------------

  public resetTable(): void {
    this.activityOriginalEnumValues = { enum: [], tag: [] };
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
    this.colResizeEvent.emit(undefined);
    this.splitterPositionEvent.emit(undefined);
    this.tableConfig = SI_DATATABLE_CONFIG;
    this.selectionType = SelectionType;
    this.selectedRows = [];
    this.totalElements = 0;
    this.showCompact = null;
    this.columnMode = ColumnMode.standard;
    this.filterActions = [];
    this.columnsActions = [];
    this.isFilterClear = false;
    this.isEventsFilterSelectorOpen = false;
    this.updatedColumns = [];
    this.showColumnSelectionDlgSubj = new BehaviorSubject<boolean>(false);
    this.showColumnSelectionDlg = this.showColumnSelectionDlgSubj.asObservable();
    this.compactColumnWidth = 60;
    this.pageLimit = 100;
    this.pageNumber = 0;
    this.tableOffset = 0;
    this.onfilter = false;
    this.onSorted = false;
    this.firstLoad = true;
    this.newTableWidth = 0;
    this.limit = this.pageLimit;
    this.responsiveTableWidth = 700;
    this.colSettingsDefault = new Map();
    this.columnSettings = [];
    this.userLocalizationCulture = '';
    this.joinedFilters = undefined;
    this.loadingOnRequest = false;
    this.gridHeaderData = new GridHeaderData();
    this.histLogResult = Array.from([]);
    this.searchCriteriaSelectable = [];
    this.refreshDataAvailable = false;
    this.onDefault = false;
    this.columnDescriptionsMap = new Map<string, HistLogColumnDescription>();
    this.subscriptions = [];
    this.searchCriteria = [];
    this.appliedFilterCriteria = {
      criteria: [],
      value: ''
    };
    this.selectedCriteriaOptions = {
      criteria: [],
      value: ''
    };
    this.defaultColumnsHeaderData = [];
    this.closedCustomDlgEvent = new EventEmitter<ColumnSelectionDialogResult>();
    this.isDistributed = undefined;
    this.backenResponseWithErrorCode = '';
    this.expanded = false;
    if (this.table?.sorts) {
      this.table.sorts = [];
    }
    this.sort = [];
    this.historyLogsubscriptions?.unsubscribe();
    this.scrollSubjectSubscriptions?.unsubscribe();
    this.refreshTable = false;
    this.tableChangeDetected = -1;
    this.tableChangeDetect = -1;
    this.selectedRowPageNumber = 1;
    this.alertIdSDescriptor = "";
    this.process();
  }
  
  /* This method will call retain methods for retaining state
   *
   */
  public retainLogViewerState(): void {
    this.readRetainedAppliedFilter();
  }

  public saveScrollPosition(): void {
    const storageData = this.storageService.getState(this.fullId);
    const selector = this.table?.element?.querySelector('.datatable-body');
    if (!!storageData && (!!selector?.scrollTop || selector?.scrollTop === 0)) {
      storageData.scrollOffsetY = selector.scrollTop;
      this.storageService.setState(this.fullId, storageData);
    } else if (!!selector?.scrollTop || selector?.scrollTop === 0) {
      this.logViewerRetainState = this.logViewerRetainState || {};
      this.logViewerRetainState.scrollOffsetY = selector.scrollTop;
      this.storageService.setState(this.fullId, this.logViewerRetainState);
    }
  }
  // ----------------------------------------Mobile to tablular responsiveness code -------------------------------------
  public subscribeContainerWidthChanges(): void {
    if (!(this.logViewerTableElement?.nativeElement)) {
      this.traceService.warn('Unable to locate si-tree-view element in DOM for width monitoring');
      return;
    }
    // Detach any previously established subscriptions on this element
    this.cleanupContainerWidthChanges();
    let firstResizeEvent = true;
    // Subscribe for size changes on this host element)
    this.resizeObserverSubscriptions = this.resizeObserverService.observe(this.logViewerTableElement.nativeElement, 100, false, false)
      .pipe(tap(dim => {
        if (!firstResizeEvent) { // If it's not first event, then only we need to handle the column width.
          this.handlingColumnWidth(dim.width)
        }
      }), debounceTime(400))
      .subscribe(dim => {
        this.traceService.info(TraceModules.logViewer, `dim-width ${dim.width}`);
        if (this.fromSnapin && !firstResizeEvent) { // If it's not the first event, in that case only we need to save the settings.
          this.colResizeEvent.emit(this.masterContainerSettings);
        } else { // Apply retained sorting and scroll position only on first resize event.
          this.applyRetainedSortingAndScrollPosition();
        }
        if (firstResizeEvent) {
          firstResizeEvent = false;
        }
      });
  }

  public cleanupContainerWidthChanges(): void {
    if (this.resizeObserverSubscriptions) {
      this.resizeObserverSubscriptions.unsubscribe();
      this.resizeObserverSubscriptions = undefined;
    }
  }

  // Initilize the table Columns on Snapin Load
  public initFilterColumnsStrings(): void {
    this.logViewerRetainState = this.storageService.getState(this.fullId);
    this.subscriptions.push(this.settingsService.getSettings('LogViewerSettings')
      .subscribe(colSettings => {
        colSettings = colSettings?.replace('SourceDesignation', 'DefaultViewDesignation');
        colSettings = colSettings?.replace('SourceLocation', 'DefaultViewLocation');
        this.isDistributed = this.systems?.IsDistributed;
        this.traceService.info('Log_Viewer_Component', 'onGetSettings() : %s', true);
        this.masterContainerSettings = colSettings ? JSON.parse(colSettings) : {};
        this.columnSettings = this.masterContainerSettings?.colSettings;
        this.updatedColumns = (this.masterContainerSettings?.columnHeaderData) ?
          (this.masterContainerSettings?.columnHeaderData?.map(columnHeader => {
            if (!columnHeader?.id || columnHeader?.id === DefaultColumns.Icon) {
              columnHeader.title = this.activityIconLabel;
            }
            return columnHeader;
          })) : JSON.parse(JSON.stringify(this.defaultColumnsHeaderData));
        if (this.columnSettings) {
          this.refreshDataAvailable = true;
        }
        if (this.columnSettings?.length) {
          if (this.masterContainerSettings.tableWidth! > this.responsiveTableWidth) {
            this.columnSettings.forEach(col => {
              this.colSettingsDefault.set(col.id!, Math.round(col.width!));
            });
            this.tempShowCompact = false;
          } else {
            this.tempShowCompact = true;
          }
        } else {
          this.tempShowCompact = true;
          Object.keys(DefaultColumns).forEach(col => {
            this.colSettingsDefault.set(col, 0);
          });
        }
        this.initializeFilter();

        // Get Current CNS Label based on layout
        this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(cnsLabel => {
          this.updateSourceBasedOnLayout(cnsLabel);
          if (!this.logViewerRetainState) {
            if (!(this.historyLogService.selectedObject?.Attributes?.ManagedTypeName === 'LogViewDefinition')) {
              this.discardSnapshot();
            }
          } else {
            this.retainLogViewerState();
          }
        }));
        this.subscriptions.push(this.closedCustomDlgEvent.subscribe((value: ColumnSelectionDialogResult) => {
          this.onUpdateColumns(value);
        }
        ));
      },
      err => { this.traceService.error('Log_Viewer_Component', 'onGetSettingsError() error: %s', err.toString()); }
      ));
  }

  // ----------------- --------------------------s-filtered-search related methods -----------------------------------

  /**
   * The method onSearchFilterChanged() is called by the html tag si-filtered-search when the user enters some
   * filter criteria and does apply on search .
   */
  public onSearchAppliedFilterChanged(appliedFilterCriteria: SearchCriteria, activityEnums: Map<string, ActivityOriginalEnumValues>): void {
    this.appliedFilterCriteria = structuredClone(appliedFilterCriteria);
    this.activityEnums = activityEnums;
    //  If we select any filter containing activity or activity group but doesn't apply it and navigate somewhere else , 
    //  then after we come back and apply retained selected filter , this.activityEnums should be retained otherwise In
    //  createConditionFilter it will create wrong condition filter.
    if (this.logViewerRetainState?.activityEnums?.size !== 0 && activityEnums?.size == 0) {
      this.activityEnums = this.logViewerRetainState?.activityEnums;
    }
    this.joinedFilters = this.createConditionFilter(appliedFilterCriteria);
    this.logViewerRetainState = this.logViewerRetainState || {};
    // For retain handling, we need to save applied search criteria in selectedCriteriaOptions
    this.logViewerRetainState.selectedCriteriaOptions = appliedFilterCriteria;
    this.logViewerRetainState.activityEnums = this.activityEnums;
    this.logViewerRetainState.appliedFilterCriteria = appliedFilterCriteria;
    this.historyLogService.logViewRowDetails.next(null);
    this.histLogResult = [];
    this.totalElements = 0;
    this.showHideWarningMessage.emit({ isToShowWarningMessage: false, viewSize: this.totalElements });
    this.isToShowWarningMessage = false;
    this.translateService.get('Log_Viewer.ITEMS_LABEL', { elements: this.totalElements }).subscribe((res: string) => {
      this.itemsLabel = res;
    });
    if (!this.nodeReselection) {
      this.onfilter = true;
      // snapshot should be discarded always whenever user clicks on filter button irrespective of older one is completed or not.
      this.newSnapshotCreated = false;
      this.discardSnapshot();
    } else {
      this.nodeReselection = false;
    }
  }

  // only when the user selects different filters  on the search bar and not applied are fetched on this function.
  public onSearchFilterChange(selectedCriteriaOptions: SearchCriteria): void {
    this.selectedCriteriaOptions = structuredClone(selectedCriteriaOptions);
    const retainedData = this.storageService?.getState(this.fullId);
    if (retainedData) {
      retainedData.appliedServerState ??= { criteria: [], value: '' };
    }
    if (!(isEqual(retainedData?.appliedServerState, this.selectedCriteriaOptions))
      && !(retainedData == undefined && this.selectedCriteriaOptions.criteria.length == 0)) {
      this.storageService.setDirtyState(this.fullId, true);
    } else {
      this.storageService.setDirtyState(this.fullId, false);
    }
  }

  public getWidth(id: string): number {
    if (!this.colSettingsDefault.get(id)) {
      id = id === 'DefaultViewDesignation' ? 'DefaultViewLocation' : 'DefaultViewDesignation';
    }
    return this.colSettingsDefault.get(id)!;
  }

  public onScroll(offsetY: number, firstTime?: boolean): void {
    if (firstTime && !this.totalElements) {
      this.totalElements = 0;
    }
    this.scrollSubject.next({ offsetY, firstTime });
  }

  public scrollHandler(offsetY: number, dualData?: boolean): void {
    const headerHeight = this.tempShowCompact ? this.compactHeaderHeight : this.tabularHeaderHeight;

    // total height of all rows in the viewport
    const viewHeight = this.elementRef.nativeElement?.getBoundingClientRect().height - headerHeight;

    const rowHeight = this.tempShowCompact ? this.compactRowHeight : this.tabularRowHeight;

    const pageSize = Math.ceil(viewHeight / rowHeight);

    /* change the limit to pageSize such that we fill the first page entirely
    (otherwise, we won't be able to scroll past it) */
    this.limit = Math.max(pageSize, this.pageLimit);

    /* Calculate CurrentPageNumber
    on basis of scroll position  and number of rows of definte height  in each page
    */

    let calculatePageNumber = Math.floor((offsetY + viewHeight) / (this.limit * rowHeight)) + 1;
    const lastPage = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
    if (this.totalElements && this.totalElements > this.limit && calculatePageNumber > lastPage) {
      calculatePageNumber = lastPage;
    }
    if (offsetY !== undefined && offsetY > this.tableOffset) {
      this.reverseFlag = false;
      if (this.pageNumber !== calculatePageNumber) {
        if (this.loadingOnRequest) {
          this.historyLogsubscriptions?.unsubscribe();
        }
        if (dualData) {
          this.loadPage(this.limit, calculatePageNumber, true);
        } else {
          /*  // if due to fast scroll we scroll down to page where data is not loaded
          then load current and next page */
          if (typeof this.histLogResult[(calculatePageNumber - 1) * this.limit] !== 'object') {
            const rows = [...this.histLogResult];
            const spliceNumber = this.pageNumber === 1 ? this.pageNumber - 1 : this.pageNumber - 2;
            // if there are only three pages then no need to clean the cache
            if (lastPage > 3) {
              if (calculatePageNumber - this.pageNumber < 2) {
                rows.splice(spliceNumber * this.limit, this.limit, ...new Array<LogViewResult>(this.limit));
              } else {
                rows.splice(spliceNumber * this.limit, 3 * this.limit, ...new Array<LogViewResult>(3 * this.limit));
              }
            }
            this.histLogResult = [...rows];
            // if dragged to last page then to load only one page this condition is present
            if (calculatePageNumber !== lastPage) {
              this.loadPage(this.limit, calculatePageNumber, true);
            } else {
              this.loadPage(this.limit, calculatePageNumber);
            }
          } else {
            const rows = [...this.histLogResult];
            if (calculatePageNumber !== (Math.floor(this.totalElements / this.limit))) {
              this.loadPage(this.limit, calculatePageNumber + 1);
            }
          }
        }
        this.pageNumber = calculatePageNumber;
      }
      this.tableOffset = offsetY;
    } else if (offsetY !== undefined && offsetY < this.tableOffset) {
      if (this.pageNumber !== calculatePageNumber) {
        this.reverseFlag = true;
        if (this.loadingOnRequest) {
          this.historyLogsubscriptions.unsubscribe();
        }
        if (dualData) {
          this.loadPage(this.limit, calculatePageNumber, true);
        } else {
          if (typeof this.histLogResult[(calculatePageNumber - 1) * this.limit] !== 'object') {
            const rows = [...this.histLogResult];
            let spliceLimit;
            // if you drag in reverse and jump some pages
            if (this.pageNumber - calculatePageNumber > 2) {
              switch (lastPage) {
                /* suppose you drag to page 13 and lastPage = 14 now if you drag scroll back and  reach to
                  page 11 and it is not available then you have to remove page 13 and last page data */
                case (this.pageNumber + 1): spliceLimit = this.limit + (this.totalElements % this.limit || this.limit);
                  break;
                /* suppose you come from normal scroll and have data of 12 ,13 and lastPage = 14 data,
                 now if you scroll back and  reach to
                page 10 and it is not available then you have to remove lastPage(14) + page 13 and 12 data as we only
                preserve current, previous i.e 10 , 9 as it is in reversal mode */
                case (this.pageNumber + 2): spliceLimit = 2 * this.limit + (this.totalElements % this.limit || this.limit);
                  break;
                /* // suppose you drag to lastPage = 14 now if you scroll back and  reach to
                page 11 and it is not available then you have to remove last page data as we only
                preserve current, previous i.e 12 , 11 as it is in reversal mode */
                case (this.pageNumber): spliceLimit = (this.totalElements % this.limit || this.limit);
                  break;
                default: spliceLimit = 3 * this.limit;
                  break;
              }
              rows.splice((this.pageNumber! - 1) * this.limit, spliceLimit, ...new Array<LogViewResult>(spliceLimit));
            } else {
              // if you scroll back normally and its not from last page
              if (this.pageNumber !== lastPage) {
                /* // suppose you drag to page 13 and lastPage = 14 now if you scroll back and  reach to
                  page 12 and it is not available then you have to remove last page data as we only
                  preserve current, previous and next page data i.e 12 , 13 & 11  as it is in reversal mode */
                spliceLimit = this.pageNumber + 1 === lastPage ? (this.totalElements % this.limit || this.limit) : this.limit;
                rows.splice((this.pageNumber! - 1) * this.limit, spliceLimit, ...new Array<LogViewResult>(spliceLimit));
              }
            }
            this.histLogResult = [...rows];
            /* if during back scroll we reach first page then we require first & next page
            thus we reverse flag */
            this.reverseFlag = calculatePageNumber === 1 ? false : true;
            this.loadPage(this.limit, calculatePageNumber, true);
          } else {
            // if scroll has reached top no need to load another page just clear cached previous data
            const rows = [...this.histLogResult];
            if (calculatePageNumber === 1 && lastPage > 3) {
              const spliceLimit = this.pageNumber + 2 === lastPage ? (this.totalElements % this.limit || this.limit) : this.limit;
              rows.splice(2 * this.limit, spliceLimit, ...new Array<LogViewResult>(spliceLimit));
              this.histLogResult = [...rows];
            } else {
              /* // suppose we have data for page 13 and 14 and we scroll upto page 13 from 14
             now as we have data here on this page we load next page (12) in advance and
             clear previous page 14 */
              // if currentPage is 13 load page 12 in advance
              const pageToLoad = calculatePageNumber - 1;
              if (lastPage > 3 && calculatePageNumber + 2 <= lastPage) {

                const spliceLimit = ((calculatePageNumber + 2) === lastPage) ? (this.totalElements % this.limit || this.limit) : this.limit;
                /* As array index starts from 0 thus for page 14 index starts from 13
               as pageToLoad is already 12 so pagetoLoad + 1 gives currect index to remove elements  */
                if (typeof rows[(calculatePageNumber! + 1) * this.limit] === 'object') {
                  rows.splice((calculatePageNumber! + 1) * this.limit, spliceLimit, ...new Array<LogViewResult>(spliceLimit));
                  this.histLogResult = [...rows];
                }
              }
              // load next page in reverse order eg: currentPage = 14 loadPage=13
              this.loadPage(this.limit, pageToLoad);
            }
          }
        }
        this.pageNumber = calculatePageNumber;
      }
      this.tableOffset = offsetY;
    }
  }

  public setRelativeFiltersForLVD(relativeFil: Map<string, [Absolute, Relative]>): void {
    this.relativeFiltersLVDMap = relativeFil;
  }
 
  /**
   * This method is called when a table row is selected by the user.
   */
  public onSelect(selected: { selected: LogViewResult[] }): void {
    if (selected.selected[0]) {
      this.selectedRows = [selected.selected[0]];
      this.rowIndex = selected?.selected[0]?.Index as number;
      this.selectedRowPageNumber = this.pageNumber;
      this.rowDetailsData = { logViewResult: selected.selected[0], columnDescriptionMap: this.columnDescriptionsMap };
      this.historyLogService.logViewRowDetails.next(this.rowDetailsData);
      this.expanded = !this.expanded;
    }
  }

  public onSelected(selected: { selected: LogViewResult[] }, rowIndex: number): void {
    const selectedRows = [selected.selected[0]];
  }

  /**
   * This method is used for date time sorting
   */

  public onSort(event: any): void {
    if (event?.newValue) {
      this.sort = [];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      this.sort?.push({ Name: DefaultColumns.Time, SortType: event?.newValue?.includes('asc') ? 'Ascending' : 'Descending' });
      this.historyLogService.logViewRowDetails.next(null);
      this.onSorted = true;
      this.discardSnapshot();
    } else {
      this.setScrollBarPositionY(this.logViewerRetainState?.scrollOffsetY ?
        this.logViewerRetainState?.scrollOffsetY : 0);
    }
  }

  public onShowColumnSelectionDlg(): void {
    if (this.isEventsFilterSelectorOpen === true) {
      this.isEventsFilterSelectorOpen = false;
      this.showColumnSelectionDlgSubj.next(true);
    } else {
      this.showColumnSelectionDlgSubj.next(true);
      this.showColumnSelectionDlgSubj.next(false);
    }
  }

  // Will emit an event to inform the log viewer snap to show log viewer properties
  public onShowLogViewerProperties(): void {
    this.showLogViewerProperties.emit('LogViewerDetails');
  }

  public sendSelectionMessage(): void {
    this.sendSelectionEvent.emit('new-primary-selection');
  }

  // Handle Custom Diaogue Box to manage the Columns
  public showColumnDialog(): void {
    this.tempUpdatedColumns = this.updatedColumns.map(x => Object.assign({}, x));
    const colData: Column[] = this.createColHeaderDataArr(this.updatedColumns);
    const initialState: SiColumnSelectionDialogConfig = {
      columns: colData,
      heading: this.gridControlCustomizeTitle,
      bodyTitle: this.bodyTitle,
      restoreEnabled: true,
      submitBtnName: this.customizationModalYesBtn,
      cancelBtnName: this.customizationModalCancelBtn,
      restoreToDefaultBtnName: this.restoreToDefault,
      visibleText: this.customizationModalVisibleBtn,
      hiddenText: this.customizationModalHiddenBtn
      
    };
    this.modalService.showColumnSelectionDialog(initialState).subscribe((result: ColumnSelectionDialogResult) => {
      this.onUpdateColumns(result);
    });
  }

  public onColumnResize(ev: any): void {
    if (ev.column) {
      const colReplace = { 'sourceLocation': 'DefaultViewLocation', 'sourceDesignation': 'DefaultViewDesignation' };
      this.colSettingsDefault.set(colReplace[ev.column.prop as keyof typeof colReplace] ?
        colReplace[ev.column.prop as keyof typeof colReplace] : ev.column.prop, ev.newValue);
      this.masterContainerSettings.tableWidth = this.table._innerWidth;
      const cols: ColumnSettings[] = [];
      this.colSettingsDefault.forEach((values, keys) => {
        cols.push({ id: keys, width: values });
      });
      this.masterContainerSettings.colSettings = cols;
      this.refreshDataAvailable = false;
      this.colResizeEvent.emit(this.masterContainerSettings);
    }
  }

  public updateSourceBasedOnLayout(currCnsLabel: CnsLabel): void {
    if (currCnsLabel != null) {
      switch (currCnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
        case CnsLabelEn.DescriptionAndAlias:
        case CnsLabelEn.DescriptionAndName:
          this.updatedColumns = this.updatedColumns.map(col =>
            col.id === 'DefaultViewLocation' || col.id === 'DefaultViewDesignation'
              ? { ...col, id: 'DefaultViewLocation', title: this.objectLocation! }
              : col
          );
          this.defaultColumnsHeaderData = this.defaultColumnsHeaderData.map(col =>
            col.id === 'DefaultViewLocation' || col.id === 'DefaultViewDesignation'
              ? { ...col, id: 'DefaultViewLocation', title: this.objectLocation! }
              : col);
          this.sourceDescription = true;
          this.sourceName = false;
          break;
        case CnsLabelEn.Name:
        case CnsLabelEn.NameAndAlias:
        case CnsLabelEn.NameAndDescription:
          this.updatedColumns = this.updatedColumns.map(col =>
            col.id === 'DefaultViewLocation' || col.id === 'DefaultViewDesignation'
              ? { ...col, id: 'DefaultViewDesignation', title: this.objectDesignation! }
              : col
          );
          this.defaultColumnsHeaderData = this.defaultColumnsHeaderData.map(col =>
            col.id === 'DefaultViewLocation' || col.id === 'DefaultViewDesignation'
              ? { ...col, id: 'DefaultViewDesignation', title: this.objectDesignation! }
              : col);
          this.sourceName = true;
          this.sourceDescription = false;
          break;
        default:
          break;
      }
    }
  }

  public saveLogViewDefinition(newNode: boolean, data: LogViewDefinationModel, fromSaveConfirmationPopUp: boolean = false): void {
    if (!(this.historyLogService.historylogsactivityEnums.has("Activity") ||
      this.historyLogService.historylogsactivityEnums.has("ActivityGroup"))) {
      this.getActivityEnums().then(() => this.checkValidationAndSave(newNode, data, fromSaveConfirmationPopUp));
    } else {
      this.checkValidationAndSave(newNode, data, fromSaveConfirmationPopUp);
    }
  }

  public saveAsLogViewerDefinition(): void {
    this.historyLogService.getLogViewObservable.pipe(take(1)).subscribe(data => {
      this.saveLogViewDefinition(true, data);
    });
    if (this.historyLogService.selectedObject?.Attributes?.ManagedTypeName === 'LogViewer'
      || this.historyLogService?.selectedObject?.Attributes?.ManagedTypeName === 'LogViewFolder') {
      this.historyLogService.selectDataPointsWithSave(this.systemId, this.userLang, undefined);
    } else {
      this.historyLogService.selectDataPointsWithSave(this.systemId, this.userLang, this.historyLogService.selectedObject);
    }
  }

  // -------------------------------------------- ngOnDestroy() -----------------------------------------------------
  public ngOnDestroy(): void {
    this.traceService.debug(TraceModules.logViewer, `ngOnDestroy() called`);
    this.resetTableInit.emit(false);
    // Unsubscribe i18n text subscriptions
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
    this.scrollSubjectSubscriptions?.unsubscribe();
    this.historyLogsubscriptions?.unsubscribe();
    this.resizeObserverSubscriptions?.unsubscribe();
    this.LogViewerValidationHelperSubscription?.unsubscribe();
    this.loadingOnRequest = false;
    if (this.fromSnapin) {
      this.saveAppliedFilterInRetainState();
      this.saveColumnSortingInRetainState();
    }
    this.histLogResult = [];
    if ((this.tableChangeDetected === UnsavedDataReason.NewSelection)) {
      // when we open primary pane and secondary pane of log-viewer
      // we switch to another node, primary pane gets changed and log-viewer snapshot of primary pane gets discarded
      // now close the secondary pane of log-viewer, it will discard secondary pane only once.
      // Previously it was discarding twice with same snapshot id.
      if (localStorage.getItem(this.fullId.snapInId)?.length) {
        this.discardSnapshotSubscription = this.logViewerService.discardSnapshot(this.systemId, HistoryLogKind.ActivityFeed, this.snapshotId)
          .subscribe(val => {
            this.traceService.info(TraceModules.logViewer, `snapshot is discarded - ${this.snapshotId}`);
            this.discardSnapshotSubscription!.unsubscribe();
            this.tableChangeDetected = -1;
            localStorage.removeItem(this.fullId.snapInId);
            localStorage.removeItem(`${this.fullId.snapInId}-refreshed`);
          });
      }
    }
  }

  // -------------------------------------------- Process Data-----------------------------------------------------------

  private process(): void {
    // Initialize grid messages texts, operators, enum values and search criteria
    this.lvdDeleted.emit(false);
    this.initializeGridMessageTexts();
    this.subscriptions.push(this.showColumnSelectionDlg.subscribe(showDlg => {
      if (showDlg) {
        this.showColumnDialog();
      }
    }));
    // Initialize column descriptions map and grid rows header texts
    if (this.fromSnapin) {
      if (this.browserObject) {
        this.translateService.get('Log_Viewer.CONFIRM_DELETE_MESSAGE', { filterName: this.browserObject?.Name }).subscribe(resp => {
          this.deleteMessage = resp;
        })
      }
      this.initializeColumnDescriptionsMap();
      this.scrollSubjectSubscriptions = this.scrollSubject.pipe(debounceTime(100)).subscribe((data: ScrollData) => {
        this.scrollHandler(data.offsetY, data.firstTime);
        this.saveScrollPosition();
      });
    }
  }  

  /**
   * Init translate service with defaultCulture
   */
  private initTranslationServiceWithDefaultCulture(): void {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if ((defaultCulture !== null) && (defaultCulture.length > 0)) {
        // Init translate service with defaultCulture of the project
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.traceService.warn(TraceModules.logViewer,
          `No default culture set on appContextService! Use the culture set by the browser: ${this.translateService.getBrowserLang()}`);
        this.translateService.setDefaultLang(this.translateService.getBrowserLang()!);
      }
    }));
  }

  /**
   * Init translate service with user culture (i.e. corresponds to the CC User culture).
   */
  // private initTranslationSerivceWithUserCulture(): void {
  //   this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
  //     if ((userCulture !== null) && (userCulture.length > 0)) {
  //       // Init translate service with user culture of the logged in user
  //       this.translateService.use(userCulture).subscribe((_res: any) => {
  //         this.traceService.info(TraceModules.logViewer, `Use  user culture: ${userCulture}`);
  //       });
  //     } else {
  //       this.traceService.warn(TraceModules.logViewer, 'No user culture set on appContextService!');
  //     }
  //   }));
  // }

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
      this.userLocale.next(this.userLocalizationCulture);
    }));
  }

  /**
   * This method initializes the column descriptions map and the grid header column texts.
   */
  private initializeColumnDescriptionsMap(): void {

    // Get the column descriptions map from backend
    this.subscriptions.push(this.logViewerService.getHistoryLogColumnDescripton(this.systemId, HistoryLogKind.ActivityFeed).subscribe(
      data => {
        this.traceService.info(TraceModules.logViewer, `getHistoryLogColumnDescripton(): Notification with history log column descriptions received`);
        const immutableColumnsDesription = JSON.parse(JSON.stringify(data));
        const columnDescriptions = data as HistLogColumnDescription[];
        this.columnDescriptionsMap = new Map(columnDescriptions.map(columnDesc => [columnDesc.Name, columnDesc]));
        this.historyLogService.logViewerColumnDescriptionMap.next(columnDescriptions);
        this.initializeGridHeaderTexts(this.columnDescriptionsMap);
        this.initializeSearchCriteria(immutableColumnsDesription);
        this.initFilterColumnsStrings();
      },
      error => {
        this.traceService.info(TraceModules.logViewer, `getHistoryLogColumnDescripton() returned Error = ${JSON.stringify(error)}}`);
        this.messageTable.emptyMessage = `${this.backenResponseWithErrorCode}`;
        this.firstLoad = false;
      }
    ));
  }

  /**
   * This method is used to initialize the SearchCriteria. The language of the label texts are dependent from
   * the user and loaded from the CC backend.
   */
  private initializeSearchCriteria(columnDescriptions: HistLogColumnDescription[]): void {
    const filterColumns = [
      'Time',
      'ActivityGroup',
      'Activity',
      'UserName',
      'Supervisor',
      'Status',
      // 'Description',
      'DefaultViewDesignation',
      'DefaultViewLocation',
      'AlertId',
      'EventCause',
      'EventMessageText',
      'AlarmCategory',
      'Discipline',
      'SubDiscipline',
      'Value',
      'Quality'
    ];
    const diffNamesMessageKeys = [
      // 'FILTER-COLUMNS.SOURCE-INFORMATION',
      'FILTER-COLUMNS.SOURCE-LOCATION',
      'FILTER-COLUMNS.SOURCE-DESIGNATION'
    ];
    this.subscriptions.push(this.translateService.get(diffNamesMessageKeys).subscribe(successMessage => {
      // const sourceInformation = successMessage['FILTER-COLUMNS.SOURCE-INFORMATION'];
      const sourceLocationLabel = successMessage['FILTER-COLUMNS.SOURCE-LOCATION'];
      const sourceDesignationLabel = successMessage['FILTER-COLUMNS.SOURCE-DESIGNATION'];
      // Commenting code to add souce information label.
      // const diffNames: { [key: string]: string } = {};
      // diffNames.Description = sourceInformation;
      /* eslint-disable @typescript-eslint/naming-convention*/
      columnDescriptions.forEach(columnDesc => {
        if (columnDesc.Name === 'DefaultViewDesignation') {
          this.filterObjectDesignation = columnDesc.Descriptor;
        } else if (columnDesc.Name === 'DefaultViewLocation') {
          this.filterObjectLocation = columnDesc.Descriptor;
        }
        if (filterColumns.includes(columnDesc.Name)) {
          // If it's not a source localtion/designation filter
          if (columnDesc.Name !== SourceNames.SourceDesignation && columnDesc.Name !== SourceNames.SourceLocation) {
            this.searchCriteria.push({
              name: columnDesc.Name,
              label: columnDesc.Descriptor,
              validationType: columnDesc.DataType.includes('String') ? 'string' :
                columnDesc.DataType.includes('Int') ? 'integer' :
                  new RegExp('/Float|Double/').test(columnDesc.DataType) ? 'float' :
                    columnDesc.DataType.includes('DateTime') ? 'date-time' : 'string',
              multiSelect: columnDesc.IsEnum,
              operators: columnDesc.Name.toLowerCase().includes('time') ? ['≤', '≥', '='] : []
            });
            if (columnDesc.DataType.includes('DateTime')) {
              this.searchCriteria[this.searchCriteria.length - 1].datepickerConfig = {
                showTime: true,
                todayText: 'Today',
                weekStartDay: 'monday',
                hideWeekNumbers: false,
                showMinutes: true,
                showSeconds: true,
                showMilliseconds: false,
                mandatoryTime: false,
                disabledTime: false,
                enabledTimeText: 'Consider time',
                disabledTimeText: 'Ignore time'
              };
            }
          } else { // Adding Source Location and Source Designation to search criteria
            this.searchCriteria.push({
              name: columnDesc.Name,
              label: columnDesc.Name === SourceNames.SourceLocation ? sourceLocationLabel : sourceDesignationLabel,
              validationType: "string",
              multiSelect: false,
              operators: []
            });
          }
        }
      });
      // Sort search criteria alphabetically according to labels
      this.searchCriteria.sort((criteria1, criteria2): number => {
        const labelA = criteria1.label !== undefined ? criteria1.label.toUpperCase() : '';
        const labelB = criteria2.label !== undefined ? criteria2.label.toUpperCase() : '';
        return labelA.localeCompare(labelB);
      });
      this.searchCriteriaSelectable = [...this.searchCriteria];
      // to set criteria and category data in filter placed imn snapin component
      this.filterDataEvent.emit(this.searchCriteriaSelectable);
    }));
  }

  /**
   *  This method initialized the grid column header texts.
   */
  private initializeGridHeaderTexts(columnDescriptionsMap: Map<string, HistLogColumnDescription>): void {
    // Initialized the grid column header texts
    for (const column in DefaultColumns) {
      if (isNaN(Number(column))) {
        if (column === DefaultColumns.Icon) {
          this.createDefaultColumnHeaderData(DefaultColumns.Icon);
        } else {
          const columnName = columnDescriptionsMap.get(column);
          if (columnName?.Name === DefaultColumns.DefaultViewDesignation) {
            columnName!.Descriptor = this.objectDesignation;
          }
          this.createDefaultColumnHeaderData(
            columnName?.Name,
            columnName?.Descriptor
          );
        }
      }
    }
  }

  /**
   * This method initializes the grid message texts.
   */
  private initializeGridMessageTexts(): void {
    const messageKeys: string[] = [
      'Log_Viewer.WAITING_FOR_DATA_MSG',
      'Log_Viewer.TEXT_FOR_NO_DATA',
      'Log_Viewer.LOG-VIEWER-GRID.COLUMN-CUSTOMIZE-TITLE',
      'Log_Viewer.GRID_CONTROL_LOG_VIEWER_TITLE',
      'Log_Viewer.LOG-VIEWER-GRID.customizationModalYesBtn',
      'Log_Viewer.LOG-VIEWER-GRID.customizationModalCancelBtn',
      'Log_Viewer.LOG-VIEWER-GRID.RESTORE_TO_DEFAULT',
      'Log_Viewer.GRID_CONTROL_NAVIGATE_TO',
      'Log_Viewer.LOG-VIEWER-GRID.COLUMN-CUSTOMIZE-DESCRIPTION',
      'Log_Viewer.REFRESH_BUTTON_TITLE',
      'Log_Viewer.SAVE_LOG_VIEWER_BUTTON_TITLE',
      'Log_Viewer.SAVE_AS_LOG_VIEWER_BUTTON_TITLE',
      'Log_Viewer.DISCARD_LOG_VIEWER_BUTTON_TITLE',
      'Log_Viewer.DELETE_LOG_VIEWER_TITLE',
      'Log_Viewer.CONFIRM_DELETE_TITLE',
      'Log_Viewer.NEW_FOLDER',
      'Log_Viewer.SUCCESSFULLY_SAVED',
      'Log_Viewer.ERROR_ON_SAVE',
      'Log_Viewer.SUCCESSFULLY_DELETED',
      'Log_Viewer.ERROR_ON_DELETE',
      'Log_Viewer.RELATIVE_FILTER_MODIFIED',
      'Log_Viewer.RELATIVE_FILTER_IGNORED',
      'Log_Viewer.ACTIVITIES_LABEL',
      'Log_Viewer.TEXT_FOR_TOTAL',
      'Log_Viewer.QUALITY_ISSUE',
      'Log_Viewer.DISAPPEARED',
      'Log_Viewer.APPEARED',
      'Log_Viewer.VALUE',
      'Log_Viewer.EXACT_DATE_TIME_IGNORE',
      'Log_Viewer.ACTIVITY_ICON',
      'Log_Viewer.OBJECT_LOCATION',
      'Log_Viewer.OBJECT_DESIGNATION',
      'Log_Viewer.BACKEND_RESPONSE_WITH_ERROR_CODE',
      'HFW_CONTROLS.GRID_COL_DIALOG_VISIBLE',
      'HFW_CONTROLS.GRID_COL_DIALOG_HIDDEN',
      'Log_Viewer.LOGVIEW_CREATE_ERROR'
    ];
    this.subscriptions.push(this.translateService.get(messageKeys).subscribe(success => {
      if (success) {
        this.objectLocation = success['Log_Viewer.OBJECT_LOCATION'];
        this.objectDesignation = success['Log_Viewer.OBJECT_DESIGNATION'];
        this.textForNoData = success['Log_Viewer.TEXT_FOR_NO_DATA'];
        this.gridControlCustomizeTitle = success['Log_Viewer.LOG-VIEWER-GRID.COLUMN-CUSTOMIZE-TITLE'];
        this.gridControlLogViewerTitle = success['Log_Viewer.GRID_CONTROL_LOG_VIEWER_TITLE'];
        this.customizationModalYesBtn = success['Log_Viewer.LOG-VIEWER-GRID.customizationModalYesBtn'];
        this.customizationModalCancelBtn = success['Log_Viewer.LOG-VIEWER-GRID.customizationModalCancelBtn'];
        this.restoreToDefault = success['Log_Viewer.LOG-VIEWER-GRID.RESTORE_TO_DEFAULT'];
        this.bodyTitle = success['Log_Viewer.LOG-VIEWER-GRID.COLUMN-CUSTOMIZE-DESCRIPTION'];
        this.refreshButtonTitle = success['Log_Viewer.REFRESH_BUTTON_TITLE'];
        this.saveButtonLogViewerTitle = success['Log_Viewer.SAVE_LOG_VIEWER_BUTTON_TITLE'];
        this.saveAsButtonLogViewerTitle = success['Log_Viewer.SAVE_AS_LOG_VIEWER_BUTTON_TITLE'];
        HistoryLogService.savePopupTitle = this.saveAsButtonLogViewerTitle;
        this.discardChangesButtonTitle = success['Log_Viewer.DISCARD_LOG_VIEWER_BUTTON_TITLE'];
        this.deleteButtonLogViewerTitle = success['Log_Viewer.DELETE_LOG_VIEWER_TITLE'];
        this.deleteTitle = success['Log_Viewer.CONFIRM_DELETE_TITLE'];
        this.newFolder = success['Log_Viewer.NEW_FOLDER'];
        this.successMessage = success['Log_Viewer.SUCCESSFULLY_SAVED'];
        this.errorMessage = success['Log_Viewer.ERROR_ON_SAVE'];
        this.successDeleteMessage = success['Log_Viewer.SUCCESSFULLY_DELETED'];
        this.errorDeleteMessage = success['Log_Viewer.ERROR_ON_DELETE'];
        this.relativeFilterModifiedMessage = success['Log_Viewer.RELATIVE_FILTER_MODIFIED'];
        this.exactDateTimeIgnoredMessage = success['Log_Viewer.EXACT_DATE_TIME_IGNORE'];
        this.relativeFilterIgnoredMessage = success['Log_Viewer.RELATIVE_FILTER_IGNORED']
        this.activitiesLabel = success['Log_Viewer.ACTIVITIES_LABEL'];
        this.itemsLabel = success['Log_Viewer.ITEMS_LABEL'];
        this.activityIconLabel = success['Log_Viewer.ACTIVITY_ICON'];
        this.gridControlNavigateTo = success['Log_Viewer.GRID_CONTROL_NAVIGATE_TO'];
        this.backenResponseWithErrorCode = success['Log_Viewer.BACKEND_RESPONSE_WITH_ERROR_CODE'];
        this.customizationModalVisibleBtn = success['HFW_CONTROLS.GRID_COL_DIALOG_VISIBLE'];
        this.customizationModalHiddenBtn = success['HFW_CONTROLS.GRID_COL_DIALOG_HIDDEN'];
        this.createErrorMessage = success['Log_Viewer.LOGVIEW_CREATE_ERROR'];
        this.messageTable.emptyMessage = this.textForNoData;
      } else {
        this.traceService.error(TraceModules.logViewer, 'initializeGridMessageTexts(): Translation text could not be loaded.');
      }
    }));
  }

  /**
   * Create filter string for the passed in filter criteria.
   */

  private createConditionFilter(filterCriteria: SearchCriteria, retainState?: boolean): string | undefined {
    this.traceService.info(TraceModules.logViewer, `### createConditionFilter(): filterCriteria = ${JSON.stringify(filterCriteria)}`);

    // Create filter string for the passed in filter criteria
    this.joinedFilters = '';
    if (!filterCriteria.criteria.map(criteria => criteria.name).includes('Time')) {
      this.toDate = undefined;
      this.fromDate = undefined;
    }

    // Defect 2061884: Log Viewer: Daterange filter is not applied correctly
    // reset from and to date on every filter click. whenver user clicks on enter, then we are reseting it to default
    // and based on selection by user it will be overwritten further
    this.fromDate = new Date('1970-01-01T00:00:00');
    this.toDate = new Date();

    Array.from(filterCriteria.criteria).forEach(criteria => {
      let newFilter = '';
      const filterBackupObj = JSON.parse(JSON.stringify(criteria));
      if (filterBackupObj.value === '' && !!filterBackupObj.dateValue) {
        filterBackupObj.value = new Date(filterBackupObj.dateValue).toLocaleString();
      }
      // if user has applied empty filter by mistake then it should not consider empty filter
      if (filterBackupObj.value !== '') {
        // for all string type filters
        if (typeof filterBackupObj.value === 'string') {
          if (filterBackupObj?.name === SourceNames.SourceDesignation || filterBackupObj?.name === SourceNames.SourceLocation) {
            filterBackupObj.label = filterBackupObj.name === SourceNames.SourceDesignation ? this.filterObjectDesignation : this.filterObjectLocation;
          }
          // for datetime filter. Datetime is string type filter
          if (filterBackupObj!.name!.includes('Time') && filterBackupObj.value.length) {
            if (['=', '≤'].includes(filterBackupObj.operator!)) {
              if (filterBackupObj.operator! === '=') {
                // if time is not selected
                if (!filterBackupObj.value.includes('Z')) {
                  const date = new Date(filterBackupObj.value);
                  // Manually setting time to 0,0,0 i.e. 12 AM.
                  // Since direct conversion of Date using filterBackupObj.value doesn't work correctly for Dates >= 10.
                  this.fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                  this.toDate = new Date((filterBackupObj as any).dateValue);
                  this.toDate.setHours(23, 59, 59);
                } else {
                  // if date and time is selected
                  filterBackupObj.dateValue = new Date(filterBackupObj.dateValue);
                  this.fromDate = (filterBackupObj as any).dateValue;
                  this.toDate = new Date((filterBackupObj as any).dateValue);
                  this.toDate.setSeconds(this.toDate.getSeconds() + 1, this.toDate.getMilliseconds() + 1);
                }
              } else {
                filterBackupObj.dateValue = new Date(filterBackupObj.dateValue);
                this.toDate = filterBackupObj.dateValue;
                // If time is not selected, then we should set toDate to the end of the day
                if (!filterBackupObj.value.includes('Z')) {
                  this.toDate.setHours(23, 59, 59);
                }
              }
            } else {
              // if >= operator is applied
              // Here we are resetting toDate to currentDate if already set in case of >= operator is applied
              this.fromDate = new Date(filterBackupObj!.value);
            }
          } else {
            // other than date time filter and a string type. this is for all the string type filters
            // eslint-disable-next-line @typescript-eslint/quotes
            if (filterBackupObj!.value.includes("")) {
              filterBackupObj!.value = filterBackupObj!.value.replace(/"/g, '\\"');
            }

            // add ** for source location and source designation filters
            if (filterBackupObj!.label!.includes(this.filterObjectDesignation) || filterBackupObj!.label!.includes(this.filterObjectLocation)) {
              newFilter = `'${filterBackupObj.label}'="*${filterBackupObj!.value}*"`;
            } else if (filterBackupObj!.name!.includes('Value') && !isNaN(+filterBackupObj!.value)) {
              newFilter = `'${filterBackupObj.label}'= ${+filterBackupObj!.value}`;
            } else {
              newFilter = `'${filterBackupObj.label}'="${filterBackupObj!.value}"`;
            }
          }
        } else if (filterBackupObj?.value?.length && typeof filterBackupObj.value === 'object') {
          // for non string type filters

          // for Activitya and ActivityGroup, we are applying filter on Action, AlertState, Record Type and LogType
          // all these 4 columns names are given hardcoded, need to test with languages to check how they behave
          if (filterBackupObj!.name!.includes('Activity')) {
            if (!this.firstLVDLoad && this.activityEnums?.has(filterBackupObj!.name)) {
              const enumValues = filterBackupObj.value as string[];
              const matchingEnums: string[] = [];
              for (const val of enumValues) {
                matchingEnums.push(this.activityEnums?.get(filterBackupObj!.name)?.tag[this.activityEnums?.get(filterBackupObj!.name)?.enum?.indexOf(val)]);
              }
              const allEqual = matchingEnums.every(val => val === matchingEnums[0]);
              if (allEqual && matchingEnums[0] === 'Action') {
                newFilter = `'${this.columnDescriptionsMap.get('Action')!.Descriptor!}'={"${(filterBackupObj.value as string[]).join('";"')}"}`;
              } else if (allEqual && matchingEnums[0] === 'AlertState') {
                newFilter = `'${this.columnDescriptionsMap.get('AlertState')!.Descriptor!}'={"${(filterBackupObj.value as string[]).join('";"')}"}`;
              } else if (allEqual && matchingEnums[0] === 'RecordType') {
                newFilter = `'${this.columnDescriptionsMap.get('RecordType')!.Descriptor!}'={"${(filterBackupObj.value as string[]).join('";"')}"}`;
              } else if (allEqual && matchingEnums[0] === 'LogType') {
                const updatedEnumArray: string[] = [];
                (filterBackupObj.value as string[]).forEach(element => {
  
                  // hardcoded space is added on serverside between logType and Activity text.
                  updatedEnumArray.push(element.substring(0, element.lastIndexOf(' ')));
                });
                newFilter = `'${this.columnDescriptionsMap.get('LogType')!.Descriptor!}'={"${(updatedEnumArray).join('";"')}"}`;
              } else if (matchingEnums[0] && matchingEnums[1]) {
                // Unique enums can be set of ['Action', 'AlertState'] OR ['RecordType', 'LogType']
                const uniqueEnums = [...new Set(matchingEnums)];
                const getMatchingEnumValues = (enumType): string[] => {
                  let values = enumValues.filter((val, idx) => enumType === matchingEnums[idx]);
                  if (enumType === 'LogType') { // Remove Activity suffix text from values if enumType is LogType
                    values = values.map(val => val.substring(0, val.lastIndexOf(' ')));
                  }
                  return values;
                };
                const firstEnumValues = getMatchingEnumValues(uniqueEnums[0]);
                const secondEnumValues = getMatchingEnumValues(uniqueEnums[1]);
                const newFilter1 = `'${this.columnDescriptionsMap.get(uniqueEnums[0])!.Descriptor!}'={"${(firstEnumValues as string[]).join('";"')}"}`;
                const newFilter2 = `'${this.columnDescriptionsMap.get(uniqueEnums[1])!.Descriptor!}'={"${(secondEnumValues as string[]).join('";"')}"}`;
                newFilter = `${newFilter1} AND ${newFilter2}`;
              } else {
                newFilter = `'${filterBackupObj.label}'={"${(filterBackupObj.value as string[]).join('";"')}"}`;
              }
            } else { // If Log view definition is loaded for the first time, We can directly create filter. Activity Enums are not required.
              // This function returns the type of the filter based on the values.
              const getFilterType = (filters: { type: string, values: string[] }[]): string => {
                const matchingFilter = filters.find(filterObj =>
                  filterObj.values.every((value, index) => value === filterBackupObj.value[index])
                );
                return matchingFilter ? matchingFilter.type : '';
              }
              const activityFilters = this.lvdActivityType.get(filterBackupObj!.name);
              const filterType = getFilterType(activityFilters);
              if (filterType.length > 0) {
                const values = filterType === "LogType" 
                  ? filterBackupObj.value.map(val => val.substring(0, val.lastIndexOf(' '))) : filterBackupObj.value;
                newFilter = `'${this.columnDescriptionsMap.get(filterType)!.Descriptor!}'={"${(values as string[]).join('";"')}"}`;
              } else {
                newFilter = `'${filterBackupObj.label}'={"${(filterBackupObj.value as string[]).join('";"')}"}`;
              }
            }
          } else if (filterBackupObj!.name!.includes('Quality')) {
            // for quality, use in operator instead of equal to operator (as per discussion)
            newFilter = `'${filterBackupObj.label}'<-{"${(filterBackupObj.value as string[]).join('";"')}"}`;
          } else {
            newFilter = `'${filterBackupObj.label}'={"${(filterBackupObj.value as string[]).join('";"')}"}`;
          }
        }
      }

      // appending all filters together to pass them as param to HTTP call
      if (this.joinedFilters?.length) {
        this.joinedFilters = newFilter.length ? [this.joinedFilters, newFilter].join(' AND ') : this.joinedFilters;
      } else {
        this.joinedFilters = newFilter;
      }
    });
    if (!retainState) {
      this.showCompact = null;
      this.firstLoad = true;
      if (this.logViewerRetainState?.scrollOffsetY) {
        this.logViewerRetainState.scrollOffsetY = 0;
      }
    }

    this.traceService.info(TraceModules.logViewer, `### z(): joinedFilters = ${JSON.stringify(this.joinedFilters)}`);
    return this.joinedFilters;
  }

  // --------------------------------------------------------------------------------------------------------------------

  // ----------------------------------------------------NgxTable related methods---------------------------------------
  /**
   * Get history logs to show them in the ngx data table (i.e. master view of master-detail view).
   */
  private readHistoryLogs(
    conditionFilter: string | undefined,
    nameFilter?: string[] | undefined,
    sortColumnData?: SortColumnData[] | undefined,
    pageSize?: number,
    pageNumber?: number,
    snapshotId?: string): void {
    this.isLoadingDataEvent.next(true);
    let additionalInfo: string;
    const lastPageNumber = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
    if (pageNumber === lastPageNumber) {
      this.loadingOnRequest = true;
    }
    /* Defect 2289754 - Passing the AlertId value against the AlertIdentifier key when the request is received from the
      event and passing the ViewId value when request from the system browser througth additionalInfo
      We not passing both keys for just expand and collapse history log from right pane. */

    if (this.objectIdRightPane) {
      additionalInfo = this.viewId ? 'ViewId' + '=' + this.viewId + ',' : undefined;
      if (this.dpeNameHistoryLog) {
        additionalInfo += 'selectedLogDpeName' + '=' + this.dpeNameHistoryLog + ',';
      }
      /* Defect 25766223 -
         Alert Identifier is sent under additional Infromation when we select detailed Log / History Log in Event List
         This Alert Identifier is converted to alertId in WSI.
         Example -
         Alert Identifier = Alert ID$$$System1:ManagementView_FieldNetworks_GMSBacnet_2.NetworkState:_alert_hdl.2._value~638791321868810000~0~8526
      */
      if (this.alertIdSDescriptor) {
        additionalInfo += 'AlertIdentifier' + ' = ' + this.alertIdSDescriptor + "$$$" + this.objectIdRightPane;
      } else {
        additionalInfo += 'AlertIdentifier' + ' = ' + this.objectIdRightPane;
      }
    } else {
      additionalInfo = this.viewId ? 'ViewId' + '=' + this.viewId + ',' : undefined;
      if (this.dpeNameHistoryLog) {
        additionalInfo += 'selectedLogDpeName' + '=' + this.dpeNameHistoryLog + ',';
      }

      /* Defect 25766223 -
         In case of getting detailed log from Log-viewer we already have alert Id therefore we dont need the alert Identifier.
         Eg. alertId = 1.pSn2.A.N.2.T3O.r5JxI1J5.
      */
      // In report Manager the event type is stored as a constant with id = 2 and activity as = 1,
      // therefore we have hardcoded this value.
      if (this.recordTypeHistoryLog === "2" && this.alertIdHistoryLog) {
        additionalInfo += 'alertId' + '=' + this.alertIdHistoryLog + ',';
      }
    }
    const parentColumns = undefined;
    const childColumns = undefined;
    const fromDate = this.fromDate ?? new Date('1970-01-01T00:00:00');
    const toDate = this.toDate ?? new Date();
    const size = pageSize;
    // const nameFilter = this.isDistributed ? ['*'] : undefined;
    this.traceService.info(TraceModules.logViewer, `getHistoryLogs(): called`);

    const params: HistoryApiParams = {
      systemId: this.systemId,
      historyLogKind: HistoryLogKind.ActivityFeed,
      conditionFilter,
      fromDate,
      toDate,
      size,
      snapshotSize: this.fromSnapin ? 1000 : 100,
      sortColumnData,
      nameFilter: !this.objectIdRightPane ? nameFilter?.[0] ? nameFilter : undefined : undefined,
      pageNumber,
      snapshotId,
      additionalInfo
    };
    const systemName = this.systems?.views.filter(s => s.SystemId === this.systemId)[0]?.SystemName ?? '';
    const valueSubscription = this.valueService.readValue(systemName + ':LogViewer.Viewsize').subscribe(valueDetails => {
      params.snapshotSize = Number(valueDetails[0]?.Value?.Value ?? params.snapshotSize);
      valueSubscription.unsubscribe();
      this.historyLogsubscriptions = this.logViewerService.getHistoryLogs(params)
        .pipe(map((data: HistoryLogTable) => {
          data.Result = data.Result.map((value: LogViewResult, index) => {
            value.Index = (pageNumber! - 1) * this.limit + index;
            return value;
          });
          return data;
        })).subscribe({
          next:
            (data: HistoryLogTable) => {
              if (this.firstLVDLoad) { // If snapin is succesfully loaded for the first time.
                this.firstLVDLoad = false;
              }
              if (this.firstNodeLoad) { // If node is loaded for fisrt time and we get the data.
                this.firstNodeLoad = false;
              }
              if (!!this.objectDesignationRightPane && !!this.objectLocationRightPane && !this.fromSnapin && this.isHistoryExpanded) {
                if (data?.Result.length > 0) {
                  this.criteriaLocData[0].value = this.sourceName ? data?.Result[0]?.DefaultViewDesignation : data?.Result[0]?.DefaultViewLocation;
                }
                this.criteriaLoc.emit(this.criteriaLocData);
              }
              this.setResultDataSet(data, params);
              this.isLoadingDataEvent.next(false);
              this.dataLength.next(data.Result.length);
              this.traceService.info(TraceModules.logViewer,
                `getHistoryLogs(): Notification with ${data.TableName} history log data received:

           Total = ${data.Total}; Page = ${data.Page};
           Size = ${data.Size}; Number of Rows = ${data.Result.length}`);
              if (this.newSnapshotCreated) {
                this.newSnapshotCreated = false;
                this.traceService.info(TraceModules.logViewer,
                  `New snapshot created with id -${this.snapshotId}`);
              }
              if (data.Result.length > 0) {
                // set total only in case of history
                if (!!this.objectDesignationRightPane && !!this.objectLocationRightPane && !this.fromSnapin && this.isHistoryExpanded) {
                  this.setTotalElements(params, size, data);
                }
                if (!this.histLogResult.length) {
                  this.setTotalElements(params, size, data);
                  this.histLogResult = new Array<LogViewResult>(this.totalElements ?? 0);
                }
                const rows = [...this.histLogResult];
                const lastPage = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
                /* if last page append according to available data not according to the limit
                so as to avoid appending extra rows */
                const limit = pageNumber === lastPage ? (this.totalElements % this.limit || this.limit) : this.limit;
                rows.splice((pageNumber! - 1) * this.limit, limit, ...data.Result);
                if (!this.reverseFlag) {
                  if (pageNumber! >= 4 && typeof rows[(pageNumber! - 4) * this.limit] === 'object') {
                    rows.splice((pageNumber! - 4) * this.limit, this.limit, ...new Array<LogViewResult>(this.limit));
                  }
                }
                this.histLogResult = [...rows];
                if (this.rowIndex !== undefined && (this.selectedRowPageNumber === this.pageNumber)) {
                  this.selectedRows = [this.histLogResult[this.rowIndex]];
                }
              } else if (data.Total) {
                this.histLogResult = [...this.histLogResult];
              } else {
                // setting totalElements only when readHistoryLogs is called from right pane.
                if (!!this.objectDesignationRightPane && !!this.objectLocationRightPane && !this.fromSnapin && this.isHistoryExpanded) {
                  // setting totalElements to 0 only when readHistoryLogs returns no data i.e. data.Result.length && data.Total is 0.
                  this.totalElements = data.Total;
                }
                this.messageTable.emptyMessage = this.textForNoData;
                this.firstLoad = false;
                this.histLogResult = [];
                this.translateService.get('Log_Viewer.ITEMS_LABEL', { elements: this.totalElements }).subscribe((res: string) => {
                  this.itemsLabel = res;
                });
                this.showHideWarningMessage.emit({ isToShowWarningMessage: false, viewSize: this.totalElements });
                this.isToShowWarningMessage = false;
              }
              this.loadingOnRequest = false;
              if (this.refreshTable) {
                setTimeout(() => {
                  this.table.element.getElementsByTagName('datatable-body')[0].scrollTop = 2;
                  this.table.element.getElementsByTagName('datatable-body')[0].scrollTop = 0;
                });
                if (this.histLogResult.length) {
                  this.onSelect({ selected: [this.histLogResult[0]] });
                }
                this.refreshTable = false;
              }
            },
          error: error => {
            this.traceService.error(TraceModules.logViewer, `getHistoryLogs(): Notification with error received: Error = ${JSON.stringify(error)}`);
            // To hide the row-detail section and show the error message on UI.
            this.isLoadingDataEvent.next(false);
            this.historyLogService.logViewRowDetails.next(null);
            this.loadingOnRequest = false;
            this.totalElements = 0;
            this.messageTable.emptyMessage = `${this.backenResponseWithErrorCode}`;
            this.firstLoad = false;
            // To show the total items as 0 when server responds with error.
            this.translateService.get('Log_Viewer.ITEMS_LABEL', { elements: this.totalElements }).subscribe((res: string) => {
              this.itemsLabel = res;
            });
            // Concept of immutable object:
            // i.e. to cause a change detection in the ngx table, the rows object ref. must change
            this.histLogResult = Array.from([]);
          }
        });
    });
  }

  private setResultDataSet(data: HistoryLogTable, params: HistoryApiParams): void {
    data.Result = data.Result.length > (params.snapshotSize ?? 0) ? data.Result.slice(0, params.snapshotSize) : data.Result;
  }

  private setTotalElements(params: HistoryApiParams, size: number | undefined, data: HistoryLogTable): void {
    // if the number of records found in HDB are less than view size, then total should be what we found in HDB
    const viewSize = params.snapshotSize ?? 0;
    const pageSizeSentToWSI = size ?? 0;
    // if HDB has more data than view size OR view is creatred of 1000 items and we are loading 100 items in flex in first page
    // Ex pageSizeSentToWSI = 100, data.Total = 1001, viewSize = 1000
    // pageSizeSentToWSI = 100, viewSize = 100, data.Total = 101
    // pageSizeSentToWSI = 100, viewSize = 10, data.Total = 11
    if (data.Total > viewSize) {
      this.totalElements = viewSize;
      this.showHideWarningMessage.emit({ isToShowWarningMessage: true, viewSize });
      this.isToShowWarningMessage = true;
    } else if (pageSizeSentToWSI <= viewSize && data.Total <= viewSize) {
      // this use case can be reproduced by typing a search text as follows
      // Ex pageSizeSentToWSI = 100, viewSize = 1000, data.Total = 700
      // pageSizeSentToWSI = 100, viewSize = 1000, data.Total = 1000
      // pageSizeSentToWSI = 100, viewSize = 100, data.Total = 70
      this.totalElements = data.Total;
      this.showHideWarningMessage.emit({ isToShowWarningMessage: false, viewSize });
      this.isToShowWarningMessage = false;
    }
    this.translateService.get('Log_Viewer.ITEMS_LABEL', { elements: this.totalElements }).subscribe((res: string) => {
      this.itemsLabel = res;
    });
  }

  private readtwoPagesHistoryLogs(
    conditionFilter: string | undefined,
    sortColumnData?: SortColumnData[] | undefined,
    pageSize?: number,
    pageNumber?: number,
    snapshotId?: string): void {
    // Clear result of previous history logs request
    // this.histLogResult = Array.from([]);
    this.loadingOnRequest = true;
    // Design decision: always query all columns data
    const parentColumns = undefined;
    const childColumns = undefined;
    const fromDate = this.fromDate ?? new Date('1970-01-01T00:00:00');
    const toDate = this.toDate ?? new Date();
    const size = pageSize;
    const nameFilter = this.isDistributed ? ['*'] : undefined;
    this.traceService.info(TraceModules.logViewer, `getHistoryLogs(): called`);
    const params: HistoryApiParams = {
      systemId: this.systemId,
      historyLogKind: HistoryLogKind.ActivityFeed,
      conditionFilter,
      fromDate,
      toDate,
      size,
      snapshotSize: 1000,
      sortColumnData,
      nameFilter: nameFilter?.[0] ? nameFilter : undefined,
      pageNumber,
      snapshotId
    };
    const systemName = this.systems?.views.filter(s => s.SystemId === this.systemId)[0]?.SystemName ?? '';
    const filterData = this.onfilter;
    const valueSubscription = this.valueService.readValue(systemName + ':LogViewer.ViewSize').subscribe(valueDetails => {
      params.snapshotSize = Number(valueDetails[0]?.Value?.Value ?? params.snapshotSize);
      valueSubscription?.unsubscribe();
      this.historyLogsubscriptions = this.logViewerService.getHistoryLogs(params).pipe(map((data: HistoryLogTable) => {
        data.Result = data.Result.map((value, index) => {
          value.Index = (pageNumber! - 1) * this.limit + index;
          return value;
        });
        return data;
      }), mergeMap((data: HistoryLogTable) => {
        if (data.Result.length > 0) {
          data.Result = data.Result.length > (params.snapshotSize ?? 0) ? data.Result.slice(0, params.snapshotSize) : data.Result;
          if (!this.histLogResult.length || this.onfilter || this.onSorted) {
            this.setTotalElements(params, size, data);
            this.onfilter = false;
            this.onSorted = false;
            this.histLogResult = new Array<LogViewResult>(this.totalElements ?? 0);
          }
          this.messageTable.emptyMessage = '';
          const rows = [...this.histLogResult];
          const limit = this.totalElements < this.limit ? this.totalElements : this.limit;
          rows.splice((pageNumber! - 1) * this.limit, limit, ...data.Result);
          this.histLogResult = [...rows];
        } else if (data.Total) {
          this.totalElements = data.Total;
          this.histLogResult = [...this.histLogResult];
        } else {
          this.totalElements = data.Total;
          this.showHideWarningMessage.emit({ isToShowWarningMessage: false, viewSize: this.totalElements });
          this.isToShowWarningMessage = false;
          this.histLogResult = [];
          this.translateService.get('Log_Viewer.ITEMS_LABEL', { elements: this.totalElements }).subscribe((res: string) => {
            this.itemsLabel = res;
          });
          this.messageTable.emptyMessage = this.textForNoData;
        }
        const lastPage = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
        // const nextPage = this.reverseFlag ? --pageNumber! : ++pageNumber!; 
        // implement the following two lines instead of the above commented line to avoid "Parsing error: Invalid left-hand side expression in unary operation"
        const nextPage = this.reverseFlag ? pageNumber - 1 : pageNumber + 1;
        pageNumber = this.reverseFlag ? pageNumber - 1 : pageNumber + 1;
        return iif(() => data.Total > this.limit && (nextPage < lastPage || lastPage === 2),
          this.logViewerService.getHistoryLogs({ ...params, pageNumber: nextPage }), of(null));
      })).pipe(map((data: HistoryLogTable | null) => {
        if (data) {
          data.Result = data.Result.map((value, index) => {
            value.Index = (pageNumber! - 1) * this.limit + index;
            return value;
          });
        }
        return data;
      })).subscribe({
        next: (data: HistoryLogTable | null) => {
          if (this.firstLVDLoad) { // If snapin is succesfully loaded for the first time.
            this.firstLVDLoad = false;
          }
          if (this.firstNodeLoad) { // If node is loaded for fisrt time and we get the data.
            this.firstNodeLoad = false;
          }
          const rows = [...this.histLogResult];
          if (this.newSnapshotCreated) {
            this.newSnapshotCreated = false;
            this.traceService.info(TraceModules.logViewer,
              `New snapshot created with id -${this.snapshotId}`);
            localStorage.setItem(this.fullId.snapInId, this.snapshotId);
          }
          if (data) {
          /*   //if last page append according to available data not according to the limit
            so as to avoid appending extra rows */
            const lastPage = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
            const limit = pageNumber === lastPage ? (this.totalElements % this.limit || this.limit) : this.limit;
            rows.splice((pageNumber! - 1) * this.limit, limit, ...data.Result);
          }
          this.histLogResult = [...rows];
          if (filterData && this.histLogResult?.length) {
            this.selectedRows = [this.histLogResult[0]];
          }
          if (this.firstLoad) {
          // initially to select first row
            if (this.histLogResult.length) {
              this.selectedRows = [this.histLogResult[0]];
            }
            // to set splitter position as user has set during its session previously
            this.splitterPositionEvent.emit(this.masterContainerSettings);
            this.showCompact = this.tempShowCompact;
            // during retain state we are setting seletected row data from retained data
            if (!this.logViewerRetainState?.selectedRowPageNumber) {
              if (this.histLogResult.length) {
                // on Initial load and on navigating from 'Got to log-viewer'
                if (this.deviceInfo === DeviceType.Android || this.deviceInfo === DeviceType.Iphone) {
                  this.selectedRows = [];
                } else {
                  this.onSelect({ selected: [this.histLogResult[0]] });
                }
              }
            } else if (this.rowIndex !== undefined && (this.selectedRowPageNumber === this.pageNumber)) {
              this.selectedRows = [this.histLogResult[this.rowIndex]];
              this.onSelect({ selected: [this.histLogResult[this.rowIndex]] });
            } else if (this.logViewerRetainState?.selectedRowDetailsData && this.rowDetailsData) {
              this.historyLogService.logViewRowDetails.next(this.rowDetailsData);
            }
            this.subscribeContainerWidthChanges();
            this.firstLoad = false;
          } else {
            if (this.rowIndex !== undefined && (this.selectedRowPageNumber === this.pageNumber)) {
              if (this.histLogResult.length) {
                this.selectedRows = [this.histLogResult[this.rowIndex]];
              }
            }
          }
          if (this.refreshTable) {
            setTimeout(() => {
              this.table.element.getElementsByTagName('datatable-body')[0].scrollTop = 2;
              this.table.element.getElementsByTagName('datatable-body')[0].scrollTop = 0;
            });

            if (this.histLogResult.length) {
              // On refresh
              if (this.deviceInfo === DeviceType.Android || this.deviceInfo === DeviceType.Iphone) {
                this.selectedRows = [];
              } else {
                this.onSelect({ selected: [this.histLogResult[0]] });
              }
            }
            this.refreshTable = false;
          }
          this.loadingOnRequest = false;
        },
        error: error => {
          this.traceService.error(TraceModules.logViewer, `getHistoryLogs(): Notification with error received: Error = ${JSON.stringify(error)}`);
          // To hide the row-detail section and show the error message on UI.
          this.historyLogService.logViewRowDetails.next(null);
          this.loadingOnRequest = false;
          this.totalElements = 0;
          this.messageTable.emptyMessage = `${this.backenResponseWithErrorCode}`;
          this.firstLoad = false;
          // To show the total items as 0 when server responds with error.
          this.translateService.get('Log_Viewer.ITEMS_LABEL', { elements: this.totalElements }).subscribe((res: string) => {
            this.itemsLabel = res;
          });
          // Concept of immutable object:
          // i.e. to cause a change detection in the ngx table, the rows object ref. must change
          this.histLogResult = Array.from([]);
        }
      });
    });
  }

  private loadPage(limit: number, pageNumber: number, dualPageData?: boolean): void {
    if (dualPageData) {
      this.readtwoPagesHistoryLogs((!!this.joinedFilters?.length ? this.joinedFilters : undefined),
        (!!this.sort && this.sort?.length >= 1 ? this.sort! : undefined), limit, pageNumber, this.snapshotId);
    } else {
      this.readHistoryLogs((this.joinedFilters ?? undefined), [this.objectDesignationRightPane],
        (!!this.sort && this.sort?.length >= 1 ? this.sort! : undefined), limit, pageNumber, this.snapshotId);
    }
  }

  /**
   * This method is used to set the scroll bar position Y. The scroll bar position Y = 0 means top position.
   */
  private setScrollBarPositionY(scrollOffsetY: number): void {

    // Schedule scroll position to be restored after attach and just prior to view rendering
    if (scrollOffsetY > 0) {
      setTimeout(() => {
        this.logViewerRetainState = this.logViewerRetainState || {};
        this.table.element.getElementsByTagName('datatable-body')[0].scrollTop = scrollOffsetY - 2;
        this.table.element.getElementsByTagName('datatable-body')[0].scrollTop = scrollOffsetY;
        if (this.rowDetailsData) {
          this.historyLogService.logViewRowDetails.next(this.rowDetailsData);
        }
        if (this.snapshotId !== this.logViewerRetainState?.snapShotId) {
          this.logViewerRetainState.scrollOffsetY = 0;
        }
      });
    }
  }

  // --------------------------------------------------------------------------------------------------------------------//

  // -------------------------------------------Custom Column Dialog Methods--------------------------------------------------//
  private initializeFilter(): void {
    // Show log viewer properties option should only be shown for LogViewer node.
    const items = this.historyLogService?.selectedObject?.Attributes?.ManagedTypeName === 'LogViewer' ? [
      {
        action: (): void => { this.onShowLogViewerProperties(); },
        title: this.gridControlLogViewerTitle
      }
    ] : [];
    
    // If the device is Android or iphone (small screen/mobile phone), change content action accordingly
    if (this.deviceInfo === DeviceType.Android || this.deviceInfo === DeviceType.Iphone) {
      this.filterActions = [];
      this.columnsActions = [];
      items.forEach(res => {
        this.columnsActions.push(res);
      })
      
    } else {
      this.filterActions = [
        {
          action: (): void => {
            this.discardChangesLogViewer();
          },
          title: this.discardChangesButtonTitle,
          disabled: !this.historyLogService.GetConfigureRights()
        },
        {
          action: (): void => {
            if (this.historyLogService?.selectedObject?.Attributes?.ManagedTypeName === 'LogViewer'
              || this.historyLogService?.selectedObject?.Attributes?.ManagedTypeName === 'LogViewFolder') {
              this.saveAsLogViewerDefinition();
            } else {
              this.saveLogViewDefinition(false, undefined);
            }
          },
          title: this.saveButtonLogViewerTitle,
          disabled: !this.historyLogService.GetConfigureRights()
        }
      ];
      const commonActions = [
        {
          action: (): void => { this.saveAsLogViewerDefinition(); },
          title: this.saveAsButtonLogViewerTitle,
          disabled: !this.historyLogService.GetConfigureRights()
        },
        {
          title: '-' 
        },
        {
          action: (): void => { this.onShowColumnSelectionDlg(); },
          title: this.gridControlCustomizeTitle
        }
      ];
      if (this.historyLogService.GetConfigureRights() && this.historyLogService.selectedObject?.Attributes?.ManagedTypeName === 'LogViewDefinition') {
        this.columnsActions = [
          ...commonActions.slice(0, 1),  
          {
            action: (): void => { this.deleteLogViewDefinition(); },
            title: this.deleteButtonLogViewerTitle,
            disabled: !(this.historyLogService.GetConfigureRights() ?
              (this.historyLogService.selectedObject?.Attributes?.ManagedTypeName === 'LogViewDefinition') : false)
          },
          ...commonActions.slice(1) 
        ];
      } else {
        this.columnsActions = commonActions;
      }
      items.forEach(res => {
        this.columnsActions.push(res);
      })
    }   
    const custmDialg: CustomDialog = {};
    custmDialg.primaryActions = this.filterActions;
    custmDialg.secondaryActions = this.columnsActions;
    this.CustomDialog = custmDialg;
    this.showCustomDialogueEvent.emit(custmDialg);
  }
  private refreshData(): void {
    // On Refresh button clicked, loadingOnRequest is set to "true" to avoid multiple requests.
    if (!this.loadingOnRequest) {
      this.toDate = new Date();
      this.loadingOnRequest = true;
      this.histLogResult = [];
      this.tableOffset = 0;
      this.pageNumber = 0;
      this.refreshTable = true;
      this.historyLogService.logViewRowDetails.next(null);
      this.logViewerRetainState = this.logViewerRetainState || {};
      this.discardSnapshot();
    }
  }

  private checkValidationAndSave(newNode: boolean, data: LogViewDefinationModel, fromSaveConfirmationPopUp: boolean = false): void {
    const objectId = this.historyLogService.selectedObject.Attributes.ObjectId;
    if (!newNode) {
      // Save LogViewDefinition, in this case we check for validation Profile before moving forward with the save.
      this.LogViewerValidationHelperSubscription = this.logViewerValidationHelperService
        .LogViewerValidationService([objectId], "GmsSnapin_LogViewerComponenet")
        .subscribe({
          next: (validationInput: ValidationInput) => {
            if (validationInput) {
              this.processSaveLogViewDefinition(
                newNode, 
                data, 
                fromSaveConfirmationPopUp, 
                validationInput
              );
            }
            this.LogViewerValidationHelperSubscription?.unsubscribe();
          },
          error: error => {
            this.traceService.error(TraceModules.logViewer, error);
            this.LogViewerValidationHelperSubscription?.unsubscribe();
          }
        });
    } else {
      // Save As, No Validation required for creating a new LogViewDefiniton
      this.processSaveLogViewDefinition(newNode, data, fromSaveConfirmationPopUp, {} as ValidationInput);
    }
  }

  private processSaveLogViewDefinition(
    newNode: boolean, data: LogViewDefinationModel,
    fromSaveConfirmationPopUp: boolean = false,
    validationInput: ValidationInput): void {
    const objectId = this.historyLogService.selectedObject.Attributes.ObjectId;
    // Initializing an empty FlexUpdateLogViewDefinition 
    const flexCreateUpdateLogViewDef: FlexUpdateLogViewDefinition = Object.assign({
      FlexLogViewDefinition: {} as LogViewDefinitionInfo,
      Designation: '',
      CNSNode: new CNSNode(),
      LvdObjectId: '',
      ValidationInput: {} as ValidationInput
    });
    try {
      if (newNode) {
        flexCreateUpdateLogViewDef.CNSNode.Name = data.lvdName;
        flexCreateUpdateLogViewDef.CNSNode.Description = data.lvdDescription;
        flexCreateUpdateLogViewDef.Designation = data.lvdDesignation;
      }

      const logviewData: LogViewDefinitionInfo = {} as LogViewDefinitionInfo;
      const filters: Filter[] = [];
      const timeRangeFilter: TimeRangeFilter = {} as TimeRangeFilter;
      const timeFilters: any[] = [];
      let changeRelativeFilter = false;
      const searchFiltersApplied = JSON.parse(JSON.stringify(this.selectedCriteriaOptions))
      if (searchFiltersApplied?.criteria.length > 0) {
        for (const element of this.selectedCriteriaOptions?.criteria ?? []) {
          if (element.name == "Time") {
            timeFilters.push(element);
          } else if (["Activity", "ActivityGroup"].includes(element.name)) {
            const filtersMap: { [key: string]: string[] } = {
              "Action": [],
              "AlertState": [],
              "LogType": [],
              "RecordType": []
            };
            // Push the value to the appropriate filter category          
            const matchingEnumVals = this.historyLogService.historylogsactivityEnums.get(element.name);
            for (const item of element.value) {
              const index = matchingEnumVals.enum.indexOf(item);
              const tagVal = matchingEnumVals.tag[index];

              if (filtersMap.hasOwnProperty(tagVal)) {
                filtersMap[tagVal].push(item);
              }
            }
            Object.keys(filtersMap).forEach(key => {
              if (filtersMap[key].length > 0) {
                const label = key === "AlertState" ? "EventState" : key;
                this.createAndAddFilter(label, key, filtersMap[key], filters);
              }
            });
          } else {
            // Default case: Handle other filter types
            const filter: Filter = {
              Name: element.name,
              Label: element.label,
              Operator: element.operator ?? "=",
              Value: typeof element.value === "string" ? [element.value] : element.value ?? []
            };
            filters.push(filter);
          }
        }
      }
      const relativeFilter = this.relativeFiltersLVDMap.get(this.objectId);
      // Process time filters if available
      if (timeFilters.length) {
        const fromFilter = timeFilters.find(ele => ele.operator === "≥");
        const toFilter = timeFilters.find(ele => ele.operator === "≤");

        if (relativeFilter) {
          if (!newNode) {
            const isFromUnchanged = relativeFilter[0]?.From === fromFilter.value;
            const isToUnchanged = relativeFilter[0]?.To === toFilter.value;
            if (!isFromUnchanged || !isToUnchanged) {
              changeRelativeFilter = true;
              this.toastNotificationService.queueToastNotification('warning', this.relativeFilterModifiedMessage, ' ');
            }
            timeRangeFilter.TimeRangeSelectionType = TimeRangeSelectionEnum.Relative;
            timeRangeFilter.Relative = { Current: relativeFilter[1]?.Current, Option: relativeFilter[1]?.Option, Unit: relativeFilter[1]?.Unit };
          } else {
            this.ExtractAbsoluteFilters(fromFilter, toFilter, timeRangeFilter, timeFilters);
            this.toastNotificationService.queueToastNotification('warning', this.relativeFilterIgnoredMessage, ' ');
          }
        } else {
          this.ExtractAbsoluteFilters(fromFilter, toFilter, timeRangeFilter, timeFilters);
          if (timeFilters.length === 1 && timeFilters[0].value.includes('T') && timeFilters[0].value.includes('Z')) {
            this.toastNotificationService.queueToastNotification('warning', this.exactDateTimeIgnoredMessage, ' ');
          }
        }
      } else {
        timeRangeFilter.TimeRangeSelectionType = TimeRangeSelectionEnum.None;
      }
      logviewData.ConditionFilter = filters;
      logviewData.TimeRangeFilter = timeRangeFilter;
      logviewData.LogViewDefinitionId =
        this.historyLogService.selectedObject?.Attributes?.ManagedTypeName === 'LogViewDefinition'
          ? (newNode ? "" : this.historyLogService.selectedObject?.ObjectId.split(':')[1])
          : "";
      // it should be name or desc?
      logviewData.LogViewDefinitionName =
        (newNode ? data.lvdName : this.historyLogService.selectedObject.Descriptor)

      flexCreateUpdateLogViewDef.FlexLogViewDefinition = logviewData;
      flexCreateUpdateLogViewDef.LvdObjectId = this.historyLogService.selectedObject?.Attributes?.ManagedTypeName === 'LogViewDefinition'
        ? (newNode ? "" : this.historyLogService.selectedObject?.ObjectId)
        : "";
      flexCreateUpdateLogViewDef.ValidationInput = {
        ...validationInput,
        Message: validationInput.Message ?? ''
      };
      this.historyLogService.selectedObject.Name = (newNode ? data.lvdName : this.historyLogService.selectedObject.Name)
      this.logViewerService.createUpdateLogViewDefinition(this.systemId, flexCreateUpdateLogViewDef).subscribe(Lvd => {
        if (!Lvd.ErrorInfo && Lvd.LogViewDefinationInfo) {
          let retainedData = this.storageService?.getState(this.fullId);
          if (!retainedData) {
            retainedData = this.logViewerRetainState || {};
          }
          if (changeRelativeFilter) {
            const filteredSearchCriteria = searchFiltersApplied?.criteria
              .filter(filter => filter.name !== "Time")
              .sort((a, b) => a.name.localeCompare(b.name));
            const filteredRetainedCriteria = retainedData?.appliedServerState?.criteria
              .filter(filter => filter.name !== "Time")
              .sort((a, b) => a.name.localeCompare(b.name));
            const areFiltersEqual = JSON.stringify(filteredSearchCriteria) === JSON.stringify(filteredRetainedCriteria);
            if (!areFiltersEqual) {
              changeRelativeFilter = false;
            }
          }

          if (!(changeRelativeFilter)) {
            this.toastNotificationService.queueToastNotification('success', this.successMessage, ' ');
          }
          // this.historyLogService.selectedObject.Descriptor = Lvd.LogViewDefinationInfo.LogViewDefinitionName;
          if (relativeFilter) {
            const filteredCriteria = searchFiltersApplied?.criteria?.filter(criterion => criterion.name !== "Time");
            const filteredtimeCriteria = retainedData?.appliedServerState?.criteria?.filter(criterion => criterion.name === "Time");
            const combinedCriteria = [...(filteredCriteria || []), ...(filteredtimeCriteria || [])];
            const searchCriteriaRelative: SearchCriteria = {
              value: '',
              criteria: combinedCriteria
            }
            retainedData.appliedServerState = structuredClone(searchCriteriaRelative);
          } else {
            retainedData.appliedServerState = structuredClone(searchFiltersApplied);
            retainedData.appliedFilterCriteria = structuredClone(searchFiltersApplied);
            retainedData.selectedCriteriaOptions = structuredClone(searchFiltersApplied);
          }
          this.historyLogService.searchNewNode(this.objectId.split(':')[0] + ":" + Lvd.LogViewDefinationInfo.LogViewDefinitionId
            .replaceAll('-', '_'), this.systemId).subscribe(newNodes => {
            const newNodeBrowserObject = newNodes[0].Nodes[0];
            this.historyLogService.setSelectedObject(newNodeBrowserObject);
            retainedData.savedBrowserObject = newNodeBrowserObject;
            this.historyLogService.updateLVDObj.next(newNodeBrowserObject);
            this.storageService.setState(this.fullId, retainedData);
            this.savedChangesEvent.next(true);
            if (!fromSaveConfirmationPopUp) {
              this.storageService.setDirtyState(this.fullId, false);
            }
            this.initializeFilter();
            this.showCustomDialogueEvent.emit(this.CustomDialog);
          });

        } else {
          this.toastNotificationService.queueToastNotification('danger', this.errorMessage, ' ');
          this.savedChangesEvent.next(false);
        }
      }, error => {
        this.toastNotificationService.queueToastNotification('danger', this.createErrorMessage, error.message);
        this.savedChangesEvent.next(false);
      })
    } catch (error) {
      this.traceService.error(TraceModules.logViewer, error);
      this.toastNotificationService.queueToastNotification('danger', this.errorMessage, ' ');
      this.savedChangesEvent.next(false);
    }
  }
  private ExtractAbsoluteFilters(fromFilter: any, toFilter: any, timeRangeFilter: TimeRangeFilter, timeFilters: any[]): void {
    const hasBothFilters = fromFilter && toFilter;

    timeRangeFilter.TimeRangeSelectionType = hasBothFilters
      ? TimeRangeSelectionEnum.Absolute
      : TimeRangeSelectionEnum.Exact;

    timeRangeFilter.Absolute = hasBothFilters
      ? { From: fromFilter.value, To: toFilter.value }
      : {
        From: timeFilters[0].value, Operator: timeFilters[0].operator === "="
          ? timeFilters[0].operator : (timeFilters[0].operator === "≥" ? ">=" : "<=")
      };
  }

  private createAndAddFilter(label: string, name: string, values: string[], filters: Filter[]): void {
    if (values.length > 0) {
      const filter: Filter = {
        Label: label,
        Name: name,
        Operator: "=",
        Value: [...values] // directly assign the values array
      };

      // if Activity Group is like "Event Activity" then we save it as "Event"
      if (filter.Name == "LogType") {
        filter.Value = filter.Value.map(val => val.substring(0, val.lastIndexOf(' ')));
      }
      filters.push(filter);
    }
  }

  private deleteLogViewDefinition(): void {
    const objectId = this.historyLogService.selectedObject.Attributes.ObjectId;
    this.deleteSubscription = this.siModal.showDeleteConfirmationDialog(this.deleteMessage, this.deleteTitle).subscribe(confirmation => {
      switch (confirmation) {
        case DeleteConfirmationDialogResult.Delete:
          {
            this.LogViewerValidationHelperSubscription = this.logViewerValidationHelperService
              .LogViewerValidationService([objectId], "GmsSnapin_LogViewerComponenet")
              .subscribe((validationInput: ValidationInput) => {
                if (validationInput) {
                  this.deleteYesClicked(validationInput);
                }
                this.LogViewerValidationHelperSubscription?.unsubscribe();
              });
          } 
          break;
        default:
          this.deleteSubscription.unsubscribe();
          break;
      }
      if (this.deleteSubscription) {
        this.deleteSubscription.unsubscribe();
      }
    });
  }

  private getActivityEnums(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logViewerService
        .getHistoryLogColumnEnums(this.systemId, HistoryLogKind.ActivityFeed, [
          "Activity",
          "ActivityGroup",
          "ActivityTagOnlyForFlex",
          "ActivityGroupTagOnlyForFlex"
        ])
        .subscribe({
          next: data => {
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
            resolve(); //
          },
          error: err => {
            this.traceService.error(TraceModules.logViewer, err);
            reject(err);
          }
        });
    });
  }
  
  private deleteYesClicked(validationInput: ValidationInput): void {
    this.logViewerService.deleteLogViewDefinition(this.systemId, this.historyLogService.selectedObject.Attributes.ObjectId, validationInput).subscribe(Lvd => {
      if (Lvd) {
        this.toastNotificationService.queueToastNotification('success', this.successDeleteMessage, ' ');
        this.lvdDeleted.emit(true);
      } else {
        this.toastNotificationService.queueToastNotification('danger', this.errorDeleteMessage, ' ');
        this.lvdDeleted.emit(false);
      }
    },
    error => {
      this.traceService.debug(TraceModules.logViewer, error);
    });
  }
  
  private discardChangesLogViewer(): void {
    const retainedData = this.storageService?.getState(this.fullId);
    this.historyLogService.discardChangesSub.next(retainedData?.appliedServerState);
  }

  private createColumn(hdrData: ColHeaderData): Column {
    let isDraggable = true;
    let isDisabled = false;

    if (hdrData.id === this.firstColumnId) {
      isDraggable = false;
      isDisabled = true;
    }

    const result: Column = {
      id: hdrData.id,
      title: hdrData.title,
      visible: hdrData.visible,
      draggable: isDraggable,
      disabled: isDisabled
    };
    return result;
  }

  private createColHeaderDataArr(hdrDataList: ColHeaderData[]): Column[] {
    const colHeaderData: Column[] = hdrDataList.filter(header => header?.title?.length !== 0).map(hdrData => this.createColumn(hdrData));
    return colHeaderData;
  }

  // --------------------------------------------------------------------------------------------------------------------//
  // Handle Column Actions
  private onUpdateColumns(value: ColumnSelectionDialogResult): void {
    if (value.type == 'instant') {
      for (const updatedheaderData of this.updatedColumns) {
        const colData: Column = value.columns.find(colHeaderData => colHeaderData.title === updatedheaderData.title);
        if (colData !== undefined && updatedheaderData !== undefined) {
          updatedheaderData.visible = colData.visible;
        }
      }
      const newHeaderData: ColHeaderData[] = [];
      for (const column of value.columns) {
        const targetHeaderIndex: number = this.updatedColumns.findIndex(header => column.title === header.title);
        if (targetHeaderIndex > -1) {
          newHeaderData.push(this.updatedColumns[targetHeaderIndex]);
        }
      }
      this.updatedColumns = [...newHeaderData];

    } else if (value.type == 'ok') {
      
      for (const updatedheaderData of this.updatedColumns) {
        const colData: Column = value.columns.find(colHeaderData => colHeaderData.title === updatedheaderData.title);
        if (colData !== undefined && updatedheaderData !== undefined) {
          updatedheaderData.visible = colData.visible;
        }
      }
      this.hiddenColumnWidth = 0;
      this.updatedColumns.forEach(column => {
        if (!column.visible) {
          this.hiddenColumnWidth = this.hiddenColumnWidth + this.columnIds(column.id);
        }
      });
      this.colSettingsDefault = new Map();
      let fixedColumns = 0;
      let activityColumnPresent = false;
      const fixedWidth = Object.values(this.table._internalColumns).reduce((initialWidth, columns) => {
        let width = 0;
        if (columns?.prop === DefaultColumns.Activity) {
          activityColumnPresent = true;
        }
        if (!columns.prop) {
          width = columns.width!;
          fixedColumns++;
        } else if (columns.prop === 'Time') {
          width = columns.width!;
          fixedColumns++;
        }
        return initialWidth + width;
      }
      , 0);
      const resizableColumns = this.table._internalColumns.length - fixedColumns;
      const colWidth = (this.table._innerWidth - fixedWidth) / resizableColumns;
      const cols = this.table._internalColumns.map(c => {
        if (c?.prop !== undefined && c?.prop !== DefaultColumns.Icon && c?.prop !== DefaultColumns.Time) {
          const colReplace = { 'sourceLocation': 'DefaultViewLocation', 'sourceDesignation': 'DefaultViewDesignation' };
          const prop = colReplace[c.prop as keyof typeof colReplace] || c.prop;
          let updatedWidth = 0;
          if (this.table._internalColumns.length === 5) {
            if (colReplace[c.prop as keyof typeof colReplace]) {
              updatedWidth = colWidth + 35;
            }
            if (c?.prop === DefaultColumns.ActivityMessage) {
              updatedWidth = colWidth + 35;
            }
            if (c?.prop === DefaultColumns.Activity) {
              updatedWidth = colWidth - 70;
            }
          }
          this.colSettingsDefault.set(prop, updatedWidth || colWidth!);
          return { id: prop, width: updatedWidth || colWidth };
        } else {
          const prop = c.prop ? c.prop : 'Icon';
          this.colSettingsDefault.set(prop, c.width!);
          return { id: prop, width: c.width! };
        }
      });
      this.masterContainerSettings.colSettings = cols;
      this.masterContainerSettings.columnHeaderData = this.updatedColumns;
      this.colResizeEvent.emit(this.masterContainerSettings);
      let str = JSON.stringify(this.masterContainerSettings);
      str = '\'' + str + '\'';
      this.logViewerService.putSettings('LogViewerSettings', str).subscribe();
      this.modalRef.hide();

    } else if (value.type == 'cancel') {
      this.updatedColumns = this.tempUpdatedColumns.map(x => Object.assign({}, x));
      
      this.modalRef.hide();

    } else {
      this.updatedColumns = JSON.parse(JSON.stringify(this.defaultColumnsHeaderData));
      value.updateColumns(this.updatedColumns);
      this.onDefault = true;
    }
  }
  private createColHeaderDataBySettings(settings: ColHeaderData[]): void {
    this.updatedColumns = [...settings];
  }

  // Creating Column Header Data
  private createDefaultColumnHeaderData(prop?: string, descriptor?: string): void {

    const columnDef: ColHeaderData = {
      id: prop!,
      title: prop! === DefaultColumns.Icon ? this.activityIconLabel : descriptor!,
      visible: true,
      draggable: true,
      disabled: prop !== DefaultColumns.Icon ? false : true
    };
    this.defaultColumnsHeaderData.push(columnDef);
  }

  private handlingColumnWidth(width: number): void {
    if (width) {
      this.hiddenColumnWidth = 0;
      this.updatedColumns.forEach(column => {
        if (!column.visible) {
          this.hiddenColumnWidth = this.hiddenColumnWidth + this.columnIds(column.id);
        }
      });
      if (width > this.responsiveTableWidth) {
        // during resize if table changes then to reload data from same scroll position
        if (this.showCompact) {
          const viewHeight = this.elementRef.nativeElement.getBoundingClientRect().height;
          const scrollPageNumber = Math.floor((this.tableOffset) / (this.limit * this.compactRowHeight));
          const lastPage = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
          let rowAdjustment = 0;
          // In rowCalculation we calculate top row number of current view
          const rowCalculation = this.tableOffset && +((((this.tableOffset) / (this.limit * this.compactRowHeight)) + '').split('.')[1].slice(0, 2));
          rowAdjustment = rowCalculation * this.tabularRowHeight;
          // If on a displayed page we have any selected row
          if (this.rowIndex !== undefined && (this.selectedRowPageNumber === (scrollPageNumber + 1))) {
            const pageRowIndex = this.rowIndex % this.limit;
            /* calculating if the selected row lies inside displayed view eg:
            selected row is 59
            top row displayed is 50
            then calculate row adjustment according to selected row*/
            if (pageRowIndex > rowCalculation) {
              rowAdjustment = this.rowIndex % this.limit * this.tabularRowHeight;
            }
          }
          const offsetY = (scrollPageNumber * this.limit * this.tabularRowHeight) + rowAdjustment;
          this.tempShowCompact = false;
          this.tableOffset = 0;
          this.onScroll(offsetY, true);
          if (this.logViewerRetainState) {
            this.logViewerRetainState.scrollOffsetY = offsetY;
          }
          this.applyRetainedSortingAndScrollPosition();
        } else {
          this.applyRetainedSortingAndScrollPosition();
        }
        this.showCompact = false;
        this.tempShowCompact = false;
        const oldTableWidth = this.newTableWidth;
        this.newTableWidth = width;
        this.masterContainerSettings.tableWidth = width;
        // To reset the column setting to default and set its value to 0
        if (this.colSettingsDefault.size == 1) {
          this.colSettingsDefault = new Map();
          Object.keys(DefaultColumns).forEach(col => {
            this.colSettingsDefault.set(col, 0);
          });
        }
        const len = this.colSettingsDefault.size;
        /* date-time and icons columns have fixed width of 110 and 80 respectively
         but date time can be toggled thus fixed width of column changes */
        const fixedWidth = this.colSettingsDefault.get('Time') ? 190 : 80;
        /* date-time and icons columns are fixed
          but date time can be toggled thus number of fixed column changes */
        const fixedColumns = this.colSettingsDefault.get('Time') ? 2 : 1;
        const colWidth = (this.masterContainerSettings.tableWidth! - fixedWidth) / (len - fixedColumns);
        /* Initially first time using log view when column width are not specified
         assign equal values to all columns */
        if (!this.masterContainerSettings?.colSettings) {
          this.colSettingsDefault.forEach((values, keys) => {
            if (keys !== DefaultColumns.Icon && keys !== DefaultColumns.Time) {
              if (keys === DefaultColumns.Activity) {
                this.colSettingsDefault.set(keys, colWidth! - 70);
              } else {
                this.colSettingsDefault.set(keys, colWidth! + 35);
              }
            }
          });

          /* If after refresh data is present just set that data in
                columns and make this flag false */
        } else if (this.refreshDataAvailable) {
          this.refreshDataAvailable = false;
          /* If after inital refresh data is thiere is change in table width
              according to increase and decrease in width of table change columns width
            columns and make this flag false */
        } else {
          if (this.newTableWidth > oldTableWidth) {
            const diff = (this.newTableWidth - oldTableWidth) / (len - fixedColumns);
            this.colSettingsDefault.forEach((values, keys) => {
              if (keys !== DefaultColumns.Icon && keys !== DefaultColumns.Time) {
                this.colSettingsDefault.set(keys, Math.round(values + diff));
              }
            });
          } else {
            const diff = (oldTableWidth - this.newTableWidth) / (len - fixedColumns);
            this.colSettingsDefault.forEach((values, keys) => {
              if (keys !== DefaultColumns.Icon && keys !== DefaultColumns.Time) {
                this.colSettingsDefault.set(keys, Math.round(values - diff));
              }
            });
          }

        }
        /* After  the processing of column width just update these values
        in masterContainerSettings object */
        const cols: ColumnSettings[] = [];
        this.colSettingsDefault.forEach((values, keys) => {
          cols.push({ id: keys, width: values });
        });
        this.masterContainerSettings.colSettings = cols;
      } else {
        if (this.showCompact !== null && !this.showCompact) {
          const viewHeight = this.elementRef.nativeElement.getBoundingClientRect().height;
          const scrollPageNumber = Math.floor((this.tableOffset) / (this.limit * this.tabularRowHeight));
          const lastPage = Math.floor(this.totalElements / this.limit) + (this.totalElements % this.limit ? 1 : 0);
          let rowAdjustment = 0;
          // In rowCalculation we calculate top row number of current view
          const rowCalculation = this.tableOffset &&
           +((((this.tableOffset) / (this.limit * this.tabularRowHeight)) + '').split('.')[1].slice(0, 2));
          rowAdjustment = rowCalculation * this.compactRowHeight;
          // If on a displayed page we have any selected row
          if (this.rowIndex !== undefined && (this.selectedRowPageNumber === (scrollPageNumber + 1))) {
            const pageRowIndex = this.rowIndex % this.limit;
            /* calculating if the selected row lies inside displayed view eg:
            selected row is 59
            top row displayed is 50
            then calculate row adjustment according to selected row*/
            if (pageRowIndex > rowCalculation) {
              rowAdjustment = this.rowIndex % this.limit * this.compactRowHeight;
            }
          }
          const offsetY = (scrollPageNumber * this.limit * this.compactRowHeight) + rowAdjustment;
          this.tempShowCompact = true;
          this.tableOffset = 0;
          this.onSelect({ selected: [this.histLogResult[this.rowIndex ]] });
          this.onScroll(offsetY, true);
          if (this.logViewerRetainState) {
            this.logViewerRetainState.scrollOffsetY = offsetY;
          }
          this.applyRetainedSortingAndScrollPosition();
        } else {
          this.applyRetainedSortingAndScrollPosition();
        }
        this.showCompact = true;
        this.tempShowCompact = true;
        this.masterContainerSettings.tableWidth = width;
        this.masterContainerSettings.colSettings = undefined;
      }
    }
  }

  private discardSnapshot(): void {
    if (this.snapshotId?.length) {
      if (this.discardSnapshotSubscription === undefined || this.discardSnapshotSubscription?.closed) {
        if (this.newSnapshotCreated) {
          this.snapshotId = Guid.newGuid();
          this.tableOffset = 0;
          this.pageNumber = 0;
          this.rowIndex = 0;
          this.onScroll(1, true);
        } else {
          this.tableOffset = 0;
          this.pageNumber = 0;
          this.rowIndex = 0;  
          const prevSnapshotId = this.snapshotId;
          this.snapshotId = Guid.newGuid();
          this.newSnapshotCreated = true;
          this.discardSnapshotSubscription = this.logViewerService.discardSnapshot(
            this.prevSystemId ?? this.systemId,
            HistoryLogKind.ActivityFeed, prevSnapshotId)
            .subscribe({
              next: val => {
                this.prevSystemId = this.prevSystemId && null;
                this.discardSnapshotSubscription!.unsubscribe();
                this.traceService.info(TraceModules.logViewer, `snapshot is discarded - ${this.snapshotId}`);
                this.onScroll(1, true);
              }, error: error => {
                this.prevSystemId = this.prevSystemId && null;
                this.discardSnapshotSubscription!.unsubscribe();
                this.onScroll(1, true);
                this.traceService.error('Log_Viewer_Component', 'discardSnapshot() error', error.toString());
              }
            });
        }
      }
    } else {
      this.tableOffset = 0;
      this.pageNumber = 0;
      this.snapshotId = Guid.newGuid();
      this.newSnapshotCreated = true;
      this.onScroll(1, true);
    }
  }

  /* This method is to set the current applied filter state to retain later */
  private saveAppliedFilterInRetainState(): void {
    if (!!this.fullId) {
      this.logViewerRetainState = this.logViewerRetainState || {};
      let retainedData = this.storageService?.getState(this.fullId);
      if (!!this.appliedFilterCriteria?.criteria && this.appliedFilterCriteria.criteria?.length >= 1) {
        this.logViewerRetainState.appliedFilterCriteria = this.appliedFilterCriteria;
      }
      if (!!this.selectedCriteriaOptions?.criteria && this.selectedCriteriaOptions.criteria?.length >= 1) {
        this.logViewerRetainState.selectedCriteriaOptions = this.selectedCriteriaOptions;
      }
      this.logViewerRetainState.totalElements = this.totalElements;
      this.logViewerRetainState.newSnapshotCreated = this.newSnapshotCreated;
      this.logViewerRetainState.selectedRowIndex = this.rowIndex;
      this.logViewerRetainState.activityEnums = this.activityEnums;
      this.logViewerRetainState.historylogsactivityEnums = this.historyLogService.historylogsactivityEnums;
      this.logViewerRetainState.selectedRowPageNumber = this.selectedRowPageNumber;
      this.logViewerRetainState.selectedRowDetailsData = this.rowDetailsData;
      this.logViewerRetainState.snapShotId = this.snapshotId;
      const selector = this.table?.element?.querySelector('.datatable-body');
      if (!!selector?.scrollTop || selector?.scrollTop === 0) {
        this.logViewerRetainState.scrollOffsetY = selector.scrollTop;
      }
      if (!!retainedData) {
        retainedData.appliedFilterCriteria = this.logViewerRetainState?.appliedFilterCriteria;
        retainedData.activityEnums = this.activityEnums;
        retainedData.relativeFiltersLVDMap = this.relativeFiltersLVDMap;
        retainedData.historylogsactivityEnums = this.historyLogService.historylogsactivityEnums;
        retainedData.selectedCriteriaOptions = structuredClone(retainedData.appliedServerState);
        retainedData.scrollOffsetY = this.logViewerRetainState?.scrollOffsetY;
        retainedData.snapShotId = this.logViewerRetainState?.snapShotId;
        retainedData.selectedRowIndex = this.logViewerRetainState?.selectedRowIndex;
        retainedData.selectedRowPageNumber = this.logViewerRetainState?.selectedRowPageNumber;
        retainedData.selectedRowDetailsData = this.logViewerRetainState?.selectedRowDetailsData;
      } else if (retainedData === undefined) {
        retainedData = this.logViewerRetainState;
      }
      this.storageService.setState(this.fullId, retainedData);
    }
  }

  /* This method is to retain applied filter state */
  private readRetainedAppliedFilter(): void {
    if (!!this.fullId) {
      const storageData = this.storageService.getState(this.fullId);
      if (storageData) {
        this.logViewerRetainState = storageData;
        this.snapshotId = storageData?.snapShotId;
        this.activityEnums = this.logViewerRetainState?.activityEnums;
        if (storageData.relativeFiltersLVDMap) {
          this.relativeFiltersLVDMap = storageData.relativeFiltersLVDMap;
        }
        if (this.logViewerRetainState?.appliedFilterCriteria) {
          this.joinedFilters = this.createConditionFilter(this.logViewerRetainState?.appliedFilterCriteria, true);
        }
        this.snapshotId = storageData?.snapShotId;
      }
      this.readRretainedColumnSorting();
    }
  }

  /* This method is to set the current sorted column state to retain later */
  private saveColumnSortingInRetainState(): void {
    if (!!this.sort && this.sort?.length >= 1 && this.fullId !== undefined) {
      const currentState = this.storageService.getState(this.fullId);
      if (currentState) {
        currentState.sortedColumns = this.sort[this.sort?.length - 1];
        this.storageService.setState(this.fullId, currentState);
      } else {
        this.logViewerRetainState.sortedColumns = this.sort[this.sort?.length - 1];
        this.storageService.setState(this.fullId, this.logViewerRetainState);
      }
    }
  }

  /* This method is to retain sorted columns by Time in applied filter state */
  private readRretainedColumnSorting(): void {
    if (!!this.fullId) {
      const storageData = this.storageService.getState(this.fullId);
      if (storageData) {
        this.logViewerRetainState = storageData;
        if (!!this.logViewerRetainState?.sortedColumns) {
          this.sort = [];
          // eslint-disable-next-line @typescript-eslint/naming-convention
          this.sort?.push({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Name: DefaultColumns.Time, SortType:
              this.logViewerRetainState?.sortedColumns.SortType.includes('Asc') ? 'Ascending' : 'Descending'
          });
        }
        this.rowIndex = this.logViewerRetainState?.selectedRowIndex as number;
        this.selectedRowPageNumber = this.logViewerRetainState?.selectedRowPageNumber as number;
        this.rowDetailsData = this.logViewerRetainState?.selectedRowDetailsData as RowDetailsDescription;
        this.totalElements = this.logViewerRetainState.totalElements!;
        if (this.logViewerRetainState.newSnapshotCreated) {
          this.snapshotId = Guid.newGuid();
          this.newSnapshotCreated = true;
          this.onScroll(storageData?.scrollOffsetY || 1, true);
        } else {
          this.onScroll(storageData?.scrollOffsetY || 1, true);
        }
      }
    }
  }

  /* This method is to retain the sort icon position
   */
  private applyRetainedSortedColumn(sort?: SortColumnData): void {
    if (sort?.SortType && !this.isCompletedRetainSortedColumn) {
      const nativeElement = this?.table?.element.getElementsByClassName('sort-btn undefined')[0] ??
        this?.table?.element.getElementsByClassName('sort-asc')[0] ??
        this?.table?.element.getElementsByClassName('sort-desc')[0];
      if (nativeElement?.className) {
        if (sort?.SortType === 'Ascending') {
          this.isCompletedRetainSortedColumn = true;
          const currentSort = [{ prop: sort?.Name, dir: 'asc' }];
          // to sync sort type for ngx-datatable (sort) function with our current sort order
          this.table.onColumnSort({ sorts: currentSort });
          nativeElement.className = this.tableConfig.cssClasses.sortAscending;
        } else {
          this.setScrollBarPositionY(this.logViewerRetainState?.scrollOffsetY ?
            this.logViewerRetainState?.scrollOffsetY : 0);
        }
      }
      if (this.snapshotId !== this.logViewerRetainState?.snapShotId) {
        this.logViewerRetainState.sortedColumns = undefined;
      }
    }
  }

  /* This method is used to set sort icon position ascending or descending based on retained
  sort type and also to set retained scroll position of logview result
   */
  private applyRetainedSortingAndScrollPosition(): void {
    this.logViewerRetainState = this.storageService.getState(this.fullId);
    if (this.logViewerRetainState?.sortedColumns) {
      this.applyRetainedSortedColumn(this.logViewerRetainState?.sortedColumns);
    } else {
      this.setScrollBarPositionY(this.logViewerRetainState?.scrollOffsetY ?
        this.logViewerRetainState?.scrollOffsetY : 0);
      if (!this.firstLoad) {
        this.historyLogService.detailPaneIsLoaded.next(true);
      }
    }
  }

  private columnIds(id: string): number {
    switch (id) {
      case DefaultColumns.Icon:
        return DefaultColumnsWidth.Icon;
      case DefaultColumns.Activity:
        return DefaultColumnsWidth.Activity;
      case 'SourceName':
        return DefaultColumnsWidth.SourceName;
      case 'DefaultViewLocation':
        return DefaultColumnsWidth.SourceDescription;
      case 'DefaultViewDesignation':
        return DefaultColumnsWidth.SourceDescription;
      case DefaultColumns.Time:
        return DefaultColumnsWidth.Time;
      default:
        return 0;
    }
  }
}
