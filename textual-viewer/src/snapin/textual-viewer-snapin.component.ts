import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FullSnapInId,
  IHfwMessage,
  ISnapInActions,
  ISnapInConfig,
  ParamsSendMessage,
  QParam,
  SnapInBase
} from '@gms-flex/core';
import { BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn, GmsMessageData } from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, ViewType } from '@simpl/element-ng';
import { Subject, Subscription } from 'rxjs';

import { GridSelectionService } from '../services/grid-selection.service';
import { TextualViewerSnapInService } from '../services/textual-viewer-snapin.service';
import { TextualViewerStateStorageService } from '../services/textual-viewer-state-storage.service';
import {
  EnumColumnGroup, EnumColumnType, EnumGridComm, EnumGridUsageType, GridData, GridSettings, GridVirtualizedArgs,
  HeaderData, IGridComm
} from '../textual-viewer-data.model';
import { TextualHeaderSettings } from '../view-model/TextualHeaderSettings';
import { TvColumnIds, TvTraceModules } from '../view-model/globals';
import { TextualViewerSnapInViewModelBase } from '../view-model/snapin-vm.base';

enum GridSelectionUpdate {
  Restore = 0,
  Clear = 1
}

@Component({
  selector: 'gms-text-snapin',
  providers: [GridSelectionService],
  templateUrl: './textual-viewer-snapin.component.html',
  styleUrl: '../gms-textual-viewer-snapin.scss',
  standalone: false
})
export class TextualViewerSnapInComponent extends SnapInBase implements AfterViewInit, OnInit, OnDestroy {

  @HostBinding('class.hfw-flex-container-column') public guardFrame = true;
  @HostBinding('class.hfw-flex-item-grow') public guardGrow = true;
  @HostBinding('class.snapin-container') public guardSnapIn = true;
  @HostBinding('class.snapin-container-overflow-auto') public guardOverflow = true;
  @HostBinding('class.elevation-1') public guardElevation = true;

  public scrollIntoView: Subject<GridData> = new Subject<GridData>();
  public activeItemsChanged: Subject<void> = new Subject<void>();
  public reattachInd: Subject<void> = new Subject<void>();
  public deattachInd: Subject<void> = new Subject<void>();
  public startTime: any = undefined;
  public isLoading: boolean;
  public isLoadingSpinnerEnabled: boolean;

  private hdrData: HeaderData[] = [];
  private subscriptions: Subscription[] = [];
  private messageSubscription: Subscription;

  private readonly updateGridVirt: Subject<void> = new Subject<void>();
  private readonly updateHdrInit: Subject<void> = new Subject<void>();

  private readonly settingsForGrid: any = {
    gridUsageType: EnumGridUsageType.CustomWidthSystem,
    texts: {
      customizationModalTitle: 'Customize Columns',
      customizationModalDescription: 'Customize view by selecting content or ordering',
      customizationModalYesBtn: 'Apply',
      customizationModalCancelBtn: 'Cancel',
      customizationModalVisibleLabel: 'Visible',
      customizationModalHiddenLabel: 'Hidden'
    },
    smallScreenDivStyleClasses: ['hfw-auto-top-margin hfw-auto-bottom-margin'],
    commOutSubject: new Subject<IGridComm>(),
    commInSubject: new Subject<IGridComm>()
  };

  private snapInId: string;
  private snapInVm: TextualViewerSnapInViewModelBase;
  private cnsLabelSetting: CnsLabel;
  private locale: string;
  private headerStatus: string;
  private headerName: string;
  private headerDescription: string;
  private headerAlias: string;
  private headerValue: string;
  private headerType: string;
  private headerCurrentPriority: string;
  private headerConfigurationData = '';
  private propertyAbsentText: string;
  private comErrorText: string;

  private hldlFullConfig: any;
  private avoidPreselectOnSecondarySelection: boolean;

  private readonly ruleName: string = 'SecondarySelection';
  private readonly settingId: string = 'Web_TextualViewer_GridSettings';
  private readonly traceModule: string = TvTraceModules.tv;
  private readonly textualViewerContentActions: {
    primaryActions?: MenuItem[];
    secondaryActions?: MenuItem[];
    viewType?: ViewType;
  } = {};

  // notifies grid of change in data

  public get updateGridVirtualization(): Subject<void> {
    return this.updateGridVirt;
  }

  // notifies grid of change in header information
  public get updateHeaderInit(): Subject<void> {
    return this.updateHdrInit;
  }

  // Data item bound to the template
  public get headerData(): HeaderData[] {
    return this.hdrData;
  }

  // Data item bound to the template
  public set headerData(value: HeaderData[]) {
    if (value != null) {
      this.hdrData = value;
    } else {
      this.traceService.warn(this.traceModule, 'HeaderData value is null or undefined');
    }
  }

  // data item bound to the template
  public get gridSettings(): GridSettings {
    return this.settingsForGrid;
  }

  // data item bound to the template
  public get gridData(): GridData[] {
    return this.snapInVm.objectList;
  }

  public ngOnInit(): void {
    this.snapInId = this.fullId.fullId();
    this.snapInVm = this.snapinService.registerViewModel(this.snapInId);

    this.locale = this.translateService.getBrowserLang();

    this.getHldlConfigs();

    this.subscriptions.push(
      this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
        if (defaultCulture != null) {
          this.traceService.info(this.traceModule, `Use default culture: ${defaultCulture} `);
          this.translateService.setDefaultLang(defaultCulture);
        } else {
          this.traceService.warn(this.traceModule, 'No default culture from appContextService');
          this.translateService.setDefaultLang(this.translateService.getBrowserLang());
        }
      }));

    this.subscriptions.push(
      this.appContextService.userCulture.subscribe((userCulture: string) => {
        if (userCulture != null) {
          this.traceService.info(this.traceModule, `Use user culture: ${userCulture} `);
          this.translateService.use(userCulture).subscribe((res: any) => {
            this.traceService.info(this.traceModule, `Use user culture loaded: ${userCulture} `);
          },
          (err: any) => {
            this.traceService.warn(this.traceModule, `Use user culture loading failed: ${userCulture}; error: ${err}`);
          });
        } else {
          this.traceService.warn(this.traceModule, 'No user culture from appContextService');
        }

        this.readHeaderText();
      }));

    this.subscriptions.push(this.subForCnsLabel());

    this.snapInVm.activate(this.locale, this.cd);

    this.subscriptions.push(
      this.snapInVm.loading.subscribe(loading => {
        if (loading) {
          this.onLoadingStart();
        } else {
          this.onLoadingEnd();
        }
      }));

    this.messageSubscription = this.messageBroker.getMessage(this.fullId).subscribe(
      (m => {
        if (m != null) {
          this.processMessage(m);
        }
      })
    );

    this.traceService.debug(this.traceModule, 'Component initialized.');
    this.storageService.initStorageService(this.messageBroker, this.fullId);
  }

  public ngAfterViewInit(): void {
    this.updateSelectedRows(GridSelectionUpdate.Restore);
  }

  public ngOnDestroy(): void {
    try {
      this.subscriptions.forEach((sub: Subscription) => {
        if (sub != null) {
          sub.unsubscribe();
        }
      });

      if (this.messageSubscription != null) {
        this.messageSubscription.unsubscribe();
        this.messageSubscription = null;
      }

      if (this.snapInVm != null) {
        this.snapInVm.deactivate();
        this.snapInVm = null;
      }

      this.subscriptions = [];

      this.traceService.debug(this.traceModule, 'Component destroyed.');

      this.messageBroker.clearLastMessage(this.fullId);
    } catch (e) {
      this.traceService.debug(this.traceModule, 'Error');
    }
  }

  public onBeforeAttach(): void {
    super.onBeforeAttach();
    this.getHldlConfigs();
    this.reattachInd.next(undefined);
  }

  public onAfterDettach(): void {
    super.onAfterDettach();
    this.deattachInd.next(undefined);
  }

  public onSelectionChanged(selection: GridData[]): void {
    const preselect = !this.avoidPreselectOnSecondarySelection;
    const paramVal: QParam = undefined;
    const broadcast = false;
    const isSecondaryPane = false;

    if (selection != null) {
      if (selection.length > 0) {
        const objs: BrowserObject[] = this.snapInVm.getBrowserObjectsForSelection(selection);
        const msg: GmsMessageData = new GmsMessageData(objs);

        // we make sure the list of managed types is unique: necessary?

        const types: string[] = objs.map(o => o.Attributes.ManagedTypeName)
          .filter(t => t != null)
          .filter((v, i, c) => c.indexOf(v) === i);

        // TO DO: check whether we need this for TV or not?

        const rn: string = isSecondaryPane ? this.ruleName : undefined;
        const messageToSend: ParamsSendMessage = {
          messageBody: msg,
          preselection: preselect,
          qParam: paramVal,
          broadcast,
          applyRuleId: rn
        };

        this.sendMessage(types, messageToSend).subscribe((res: boolean) => {
          this.traceService.debug(this.traceModule, 'sendMessage() completed. result: %s', res);
        });
      }
    }
  }

  public onConfigurationChanged(hd: HeaderData[]): void {
    this.putGridSettings(TextualHeaderSettings.toString(hd));
  }

  public onGridVirtualizedChanged(args: GridVirtualizedArgs): void {
    this.snapInVm.onGridVirtualizedChanged(args);
  }

  public showContentActionBarChanged(secondaryActions: MenuItem[]): void {
    if (this.textualViewerContentActions !== undefined) {
      this.textualViewerContentActions.secondaryActions = secondaryActions;
      this.snapInActions.setSnapInActions(this.fullId, this.textualViewerContentActions);
    }
  }

  public refresh(): void {
    this.snapInVm.clear();
    this.selectionService.clear();
  }

  /**
   * Constructor
   * @param traceService The trace service.
   * @param messageBroker The message broker service
   * @param activatedRoute
   * @param snapinConfig - used to read hldl snap-in instance configs.
   * @param settingsService - used to read/write column settings
   * @param translateService
   * @param selectionService
   * @param cnsHelperService
   * @param snapinService
   * @param ngZone
   * @param appContextService
   * @param cd
   */
  public constructor(
    private readonly traceService: TraceService,
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly snapinConfig: ISnapInConfig,
    private readonly settingsService: SettingsServiceBase,
    private readonly translateService: TranslateService,
    private readonly selectionService: GridSelectionService,
    private readonly cnsHelperService: CnsHelperService,
    private readonly snapinService: TextualViewerSnapInService,
    private readonly snapInActions: ISnapInActions,
    private readonly storageService: TextualViewerStateStorageService,
    private readonly ngZone: NgZone,
    private readonly appContextService: AppContextService,
    private readonly cd: ChangeDetectorRef
  ) {
    super(messageBroker, activatedRoute);
    this.cnsLabelSetting = new CnsLabel(CnsLabelEn.Name);
    this.textualViewerContentActions = {};
  }

  private getHldlConfigs(): void {
    this.hldlFullConfig = this.snapinConfig.getSnapInHldlConfig(this.fullId, this.location);
    if (this.hldlFullConfig != null) {
      this.avoidPreselectOnSecondarySelection = (this.hldlFullConfig.avoidPreselectOnSecondarySelection == null) ?
        false : this.hldlFullConfig.avoidPreselectOnSecondarySelection;
    } else {
      this.avoidPreselectOnSecondarySelection = false;
    }
  }

  private subForCnsLabel(): Subscription {
    return this.cnsHelperService.activeCnsLabel.subscribe(cnsLabel =>
      this.onActiveCnsLabelChanged(cnsLabel));
  }

  private readHeaderText(): void {
    this.headerStatus = '';
    this.headerName = '';
    this.headerDescription = '';
    this.headerAlias = '';
    this.headerValue = '';
    this.headerType = '';
    this.headerCurrentPriority = '';
    this.propertyAbsentText = '';
    this.comErrorText = '';

    this.translateService
      .get([
        'GRID.STATUS',
        'GRID.DESCRIPTION',
        'GRID.NAME',
        'GRID.ALIAS',
        'GRID.VALUE',
        'GRID.TYPE',
        'GRID.CURRENT-PRIORITY',
        'GRID-CUSTOMIZE-TITLE',
        'GRID-CUSTOMIZE-DESCRIPTION',
        'COM-ERROR-TEXT',
        'PROPERTY-ABSENT-TEXT',
        'HFW_CONTROLS.GRID_COL_DIALOG_YESBTN',
        'HFW_CONTROLS.GRID_COL_DIALOG_CANCELBTN',
        'HFW_CONTROLS.GRID_COL_DIALOG_VISIBLE',
        'HFW_CONTROLS.GRID_COL_DIALOG_HIDDEN'
      ])
      .subscribe((res: string) => {
        if (res === undefined || res === null) {
          return;
        }

        this.propertyAbsentText = res['PROPERTY-ABSENT-TEXT'];
        this.comErrorText = res['COM-ERROR-TEXT'];
        this.headerStatus = res['GRID.STATUS'];
        this.headerDescription = res['GRID.DESCRIPTION'];
        this.headerName = res['GRID.NAME'];
        this.headerAlias = res['GRID.ALIAS'];
        this.headerValue = res['GRID.VALUE'];
        this.headerType = res['GRID.TYPE'];
        this.headerCurrentPriority = res['GRID.CURRENT-PRIORITY'];
        this.settingsForGrid.texts.customizationModalTitle = res['GRID-CUSTOMIZE-TITLE'];
        this.settingsForGrid.texts.customizationModalDescription = res['GRID-CUSTOMIZE-DESCRIPTION'];
        this.settingsForGrid.texts.customizationModalYesBtn = res['HFW_CONTROLS.GRID_COL_DIALOG_YESBTN'];
        this.settingsForGrid.texts.customizationModalCancelBtn = res['HFW_CONTROLS.GRID_COL_DIALOG_CANCELBTN'];
        this.settingsForGrid.texts.customizationModalVisibleLabel = res['HFW_CONTROLS.GRID_COL_DIALOG_VISIBLE'];
        this.settingsForGrid.texts.customizationModalHiddenLabel = res['HFW_CONTROLS.GRID_COL_DIALOG_HIDDEN'];

        this.snapInVm.setText(this.propertyAbsentText, this.comErrorText);
        this.getGridSettings();
      });
  }

  private onActiveCnsLabelChanged(cnsLabel: CnsLabel): void {
    if (cnsLabel != null) {
      this.cnsLabelSetting = cnsLabel;
      // the original code only made this call when there was a selection.
      // we had a similar check but this caused problems when refreshing
      // the screen with the 'small' display mode - nothing shows up.
      // it may be that with the original code, some value/array was
      // initialized to null and the downstream code didn't handle it?
      this.createGridHeader();
    }
  }

  private putGridSettings(val: string): void {
    if (val) {
      this.headerConfigurationData = val;
      this.ngZone.runOutsideAngular(() => {
        this.settingsService.putSettings(this.settingId, val).subscribe(
          wasSuccessful => this.onPutGridSettings(wasSuccessful),
          error => this.onPutGridSettingsError(error));
      });
    }
  }

  private onPutGridSettings(isSuccess: boolean): void {
    this.traceService.debug(this.traceModule, 'onPutGridSettings: %s',
      isSuccess.valueOf.toString());
  }

  private onPutGridSettingsError(err: any): void {
    this.traceService.debug(this.traceModule, 'onPutGridSettingsError:');
  }

  private getGridSettings(): void {
    this.settingsService.getSettings(this.settingId).subscribe(
      val => this.onGetGridSettings(val),
      err => this.onGetGridSettingsError(err)
    );
  }

  private onGetGridSettings(settings: string): void {
    this.headerConfigurationData = settings;
    this.createGridHeader();
  }

  private onGetGridSettingsError(err: any): void {
    this.traceService.error(this.traceModule, err);
    this.createGridHeader();
  }

  /**
   * Method to update the selected rows with the current VM selection or clear the selected rows.
   * @param type specify the update type
   */
  private updateSelectedRows(type: GridSelectionUpdate): void {
    switch (type) {
      case GridSelectionUpdate.Restore :
        if (!isNullOrUndefined(this.snapInVm.currentSelection) && this.snapInVm.currentSelection.length > 0) {
          this.gridSettings.commInSubject.next({
            commType: EnumGridComm.UpdateSelectedRows,
            metaData: {
              selected: [...this.snapInVm.currentSelection]
            }
          } as IGridComm);
        }
        this.cd.detectChanges();
        break;

      case GridSelectionUpdate.Clear :
        const empty: GridData[] = [];
        this.gridSettings.commInSubject.next({
          commType: EnumGridComm.UpdateSelectedRows, metaData: {
            selected: [...empty]
          }
        } as IGridComm);
        break;

      default :
        return;
    }
  }

  private createGridHeader(): void {
    const normalColumnType = 'col-md-auto';
    const hiddenColumnType = 'col-md-auto hidden-sm hidden-xs';

    this.hdrData = [];

    let descriptorColumnType: string;
    let nameColumnType: string;
    let aliasColumnType: string;
    let hdr: HeaderData;

    let descriptorScreenOrder: number;
    let nameScreenOrder: number;

    switch (this.cnsLabelSetting.cnsLabel) {
      case CnsLabelEn.DescriptionAndName:
        descriptorColumnType = normalColumnType;
        descriptorScreenOrder = 2;
        nameColumnType = normalColumnType;
        nameScreenOrder = 3;
        aliasColumnType = hiddenColumnType;
        break;

      case CnsLabelEn.NameAndDescription:
        descriptorColumnType = normalColumnType;
        descriptorScreenOrder = 3;
        nameColumnType = normalColumnType;
        nameScreenOrder = 2;
        aliasColumnType = hiddenColumnType;
        break;

      case CnsLabelEn.Description:
        descriptorColumnType = normalColumnType;
        descriptorScreenOrder = 2;
        nameColumnType = hiddenColumnType;
        nameScreenOrder = 3;
        aliasColumnType = hiddenColumnType;
        break;

      case CnsLabelEn.Name:
        descriptorColumnType = hiddenColumnType;
        descriptorScreenOrder = 3;
        nameColumnType = normalColumnType;
        nameScreenOrder = 2;
        aliasColumnType = hiddenColumnType;
        break;

      case CnsLabelEn.DescriptionAndAlias:
        descriptorColumnType = normalColumnType;
        descriptorScreenOrder = 2;
        nameColumnType = hiddenColumnType;
        nameScreenOrder = 3;
        aliasColumnType = normalColumnType;
        break;

      case CnsLabelEn.NameAndAlias:
        descriptorColumnType = hiddenColumnType;
        descriptorScreenOrder = 3;
        nameColumnType = normalColumnType;
        nameScreenOrder = 2;
        aliasColumnType = normalColumnType;
        break;

      default:
        descriptorColumnType = normalColumnType;
        descriptorScreenOrder = 2;
        nameColumnType = normalColumnType;
        nameScreenOrder = 3;
        aliasColumnType = normalColumnType;
        break;
    }

    // status column (status pipe and property icon)

    hdr = {
      id: TvColumnIds.statusId,
      label: this.headerStatus,
      showfilter: false,
      configButton: false,
      headerIconClass: undefined,
      minColWidth: 30,
      showLabel: false,
      styleClasses: '',
      allowHiding: true,
      isFixedSize: true,
      widthPercentage: 0,
      hideResize: false,
      smallScreenOrder: 1,
      columnGroup: EnumColumnGroup.GroupOne,
      columnType: EnumColumnType.PIPE,
      size: 'col-md-auto',
      columnVisible: true
    } as HeaderData;

    this.hdrData.push(hdr);

    // Descriptor

    hdr = new HeaderData(
      TvColumnIds.descriptorId,
      this.headerDescription,
      100,
      descriptorColumnType,
      EnumColumnType.TEXT,
      descriptorScreenOrder,
      EnumColumnGroup.GroupTwo
    );

    this.hdrData.push(hdr);

    // Name

    hdr = new HeaderData(
      TvColumnIds.nameId,
      this.headerName,
      100,
      nameColumnType,
      EnumColumnType.TEXT,
      nameScreenOrder,
      EnumColumnGroup.GroupTwo
    );

    this.hdrData.push(hdr);

    // Alias

    hdr = new HeaderData(
      TvColumnIds.aliasId,
      this.headerAlias,
      100,
      aliasColumnType,
      EnumColumnType.TEXT,
      4,
      EnumColumnGroup.GroupTwo
    );

    this.hdrData.push(hdr);

    // default property value

    hdr = {
      id: TvColumnIds.valueId,
      label: this.headerValue,
      showfilter: false,
      configButton: false,
      headerIconClass: undefined,
      minColWidth: 0,
      showLabel: true,
      styleClasses: '',
      allowHiding: true,
      isFixedSize: false,
      widthPercentage: 100,
      hideResize: false,
      smallScreenOrder: 5,
      columnGroup: EnumColumnGroup.GroupTwo,
      columnType: EnumColumnType.TEXT,
      size: 'col-md-auto',
      columnVisible: true
    } as HeaderData;

    this.hdrData.push(hdr);

    // current priority

    hdr = {
      id: TvColumnIds.currentPriorityId,
      label: this.headerCurrentPriority,
      showfilter: false,
      configButton: false,
      headerIconClass: undefined,
      minColWidth: 0,
      showLabel: true,
      styleClasses: '',
      allowHiding: true,
      isFixedSize: false,
      widthPercentage: 100,
      hideResize: false,
      smallScreenOrder: 6,
      columnGroup: EnumColumnGroup.GroupTwo,
      columnType: EnumColumnType.TEXT,
      size: 'col-md-auto',
      columnVisible: true
    } as HeaderData;

    this.hdrData.push(hdr);

    this.updateHeadersFromConfigData(this.headerConfigurationData);
    this.updateHeaderInit.next();
  }

  private merge(newHdr: HeaderData, oldHdrs: HeaderData[]): HeaderData {
    let h: HeaderData = newHdr;
    const orig: HeaderData = oldHdrs.find(a => a.id === newHdr.id);
    if (orig != null) {
      h = TextualHeaderSettings.mergeHeaders(orig, newHdr);
    }
    return h;
  }

  private updateHeadersFromConfigData(data: string): void {
    if (data) {
      const newHdrs: HeaderData[] = TextualHeaderSettings.fromString(data);
      if (newHdrs.length === this.hdrData.length) {
        const hdrs: HeaderData[] = newHdrs.map(h => this.merge(h, this.hdrData));
        this.hdrData = [];
        this.hdrData.push(...hdrs);
      }
    }
  }

  private processMessage(m: any): void {
    const message: GmsMessageData = m as GmsMessageData;
    let objs: BrowserObject[] = message?.data || [];
    objs = objs.filter(o => o != null);
    const len = objs.length;

    // Debug trace
    if (this.traceService.isDebugEnabled(this.traceModule)) {
      let selStr: string;
      if (len <= 1) {
        selStr = len > 0 ? objs[0].Name : '<empty>';
      } else {
        selStr = `${objs[0].Name} .. ${objs[len - 1].Name} (${len} objects)`;
      }
      this.traceService.debug(this.traceModule, 'Selection message received: %s', selStr);
    }

    this.snapInVm.setContext(objs);
  }

  private onLoadingStart(): void {
    this.updateSelectedRows(GridSelectionUpdate.Clear);
    this.isLoading = true;

    // Delay showing the spinner until we have been waiting a short period of time.
    // This avoids the spinner "blinking" quickly in/out of view on every selection no
    // matter how quickly the new context loads.
    setTimeout(() => this.isLoadingSpinnerEnabled = this.isLoading, 800);
  }

  private onLoadingEnd(): void {
    this.updateGridVirtualization.next();
    this.isLoading = false;
    this.isLoadingSpinnerEnabled = false;
  }
}
