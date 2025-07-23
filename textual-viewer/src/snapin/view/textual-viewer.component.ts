import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CnsHelperService, CnsLabel, CnsLabelEn } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { DatatableComponent } from '@siemens/ngx-datatable';
import {
  Column,
  ColumnSelectionDialogResult,
  MenuItem,
  ResizeObserverService,
  SiColumnSelectionDialogConfig,
  SiColumnSelectionDialogService
} from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Subject, Subscription } from 'rxjs';

import { TextualViewerState } from '../../interfaces/textual-viewer.state';
import { TextualViewerDataService } from '../../services/textual-viewer-data.service';
import { TextualViewerStateStorageService } from '../../services/textual-viewer-state-storage.service';
import {
  EnumColumnType,
  EnumGridUsageType,
  EnumIconType,
  GridData,
  GridVirtualizedArgs,
  HeaderData, SelectedInfo
} from '../../textual-viewer-data.model';

@Component({
  selector: 'gms-textual-viewer',
  templateUrl: './textual-viewer.component.html',
  styleUrl: './textual-viewer.component.scss',
  standalone: false
})

export class TextualViewerComponent implements AfterViewInit, OnDestroy, OnInit {
  @Input() public gridSettings: any = {
    gridUsageType: EnumGridUsageType.BootstrapWidthSystem,
    texts: {
      customizationModalTitle: 'Customize Columns',
      customizationModalDescription: 'Customize view by selecting content or ordering',
      customizationModalYesBtn: 'Apply',
      customizationModalCancelBtn: 'Cancel',
      customizationModalVisibleLabel: 'Visible',
      customizationModalHiddenLabel: 'Hidden'
    }
  };
  @Input() public updateGridDisplay: Subject<void>;
  @Input() public updateHeaderInitialization: Subject<void> = new Subject<void>();
  @Input() public reattachIndication: Subject<void>;
  @Input() public deattachIndication: Subject<void>;
  @Input() public scrollIntoView: Subject<GridData> = new Subject<GridData>();
  @Input() public textTable: GridData[] = [];
  @Input() public compactMode = false;

  @Output() public configurationChanged = new EventEmitter<any>();
  @Output() public selectionChanged = new EventEmitter<any>();
  @Output() public gridVirtualizedChanged = new EventEmitter<GridVirtualizedArgs>();
  @Output() public gridEvents: EventEmitter<any> = new EventEmitter<any>();
  @Output() public rowHeight: EventEmitter<number> = new EventEmitter<number>();
  @Output() public showContentActionBarChanged: EventEmitter<MenuItem[]> = new EventEmitter<MenuItem[]>();

  @ViewChild('table') public table: DatatableComponent;
  @ViewChild('textualViewerContainer') public textualViewerContainer: ElementRef;

  @Input()
  public set headerDataInput(hdrData: HeaderData[]) {
    this.headerData = hdrData;
    this.managedHeaderData = [...hdrData];
    this.managedHeaderData.sort(this.smallScreenSortCompare);
  }

  @Input()
  public set txtTable(txtTable: GridData[]) {
    for (let i = 0; i < txtTable.length; i++) {
      txtTable[i].rowId = i;
    }

    this.textTable = txtTable;
    this.virtualizeGrid();
  }

  public get datatableBody(): HTMLElement {
    if (this.table !== undefined) {
      const datatableBodyTag = 'datatable-body';
      const datatableBody: HTMLElement = this.textualViewerContainer.nativeElement.querySelector(datatableBodyTag);
      return datatableBody;
    }
  }

  public colFilter: string;
  public colText: number;
  public colPipe: number;
  public colIcon: number;
  public colButton: number;
  public colPipedIconBox: number;
  public nameColumn: string;
  public descColumn: string;
  public valueColumn: string;
  public statusColumn: string;
  public infoText = 'informationalText';
  public readonly firstColumnId: string = 'data1';
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public initialized: boolean;
  public enumIconType: typeof EnumIconType = EnumIconType;
  public tempHeaderData: HeaderData[] = [];
  public headerData: HeaderData[] = [];
  public managedHeaderData: any[] = [];
  public readonly subscriptions: Subscription[] = [];
  public cnsLabelObject: CnsLabel = new CnsLabel();
  public readonly iconColWidth: number = 80;

  // NOTE: Add translations
  public headerTitle = 'Customize columns';
  public bodyTitle = 'Customize view by selecting content or ordering';

  private defaultHeaderData: HeaderData[] = [];
  private readonly colLabelList: string[] = ['Status', 'Description', 'Name', 'Alias', 'Value'];
  private readonly closed: EventEmitter<ColumnSelectionDialogResult> = new EventEmitter<ColumnSelectionDialogResult>();
  private readonly expandedViewHeight: number = 32;
  private readonly condensedTwoLabelHeight: number = 55;
  private readonly condensedThreeLabelHeight: number = 70;
  private readonly modalRef: BsModalRef;
  private _selected: GridData[] = [];

  public constructor(
    public textualViewerDataService: TextualViewerDataService,
    private readonly resizeObserver: ResizeObserverService,
    private readonly modalService: SiColumnSelectionDialogService,
    private readonly textualViewerStateStorageService: TextualViewerStateStorageService,
    public cnsHelperService: CnsHelperService,
    public changeDetector: ChangeDetectorRef
  ) {
  }

  public getRowClass = (row: any): string => row.status ? `has-status ${row.status}` : '';

  @HostListener('window:keydown.control.a', ['$event'])
  public selectAllRows(event: KeyboardEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.selected = [...this.textTable];
  }

  public ngOnInit(): void {
    this.colFilter = '';
    this.colText = EnumColumnType.TEXT;
    this.colIcon = EnumColumnType.ICON;
    this.colPipe = EnumColumnType.PIPE;
    this.colButton = EnumColumnType.BUTTON;
    this.colPipedIconBox = EnumColumnType.PIPED_ICON_BOX;
    this.statusColumn = 'data1';
    this.nameColumn = 'data3';
    this.descColumn = 'data2';
    this.valueColumn = 'data5';

    this.defaultHeaderData = [...this.headerData];
    this.subscriptions.push(
      this.closed.subscribe((result: ColumnSelectionDialogResult) => {

        // NOTE: Check if this line is necessary
        if (this.tempHeaderData === undefined || this.tempHeaderData.length === 0) {
          this.tempHeaderData = [...this.headerData];
        }

        this.changeDetector.detectChanges();
      })
    );

    this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(label => this.cnsLabelObject = label));
    this.subscriptions.push(this.updateGridDisplay?.subscribe(() => this.onUpdateGridDisplay()));
    this.subscriptions.push(this.textualViewerDataService.gridVirtualizedChanged.subscribe((event: GridVirtualizedArgs) =>
      this.gridVirtualizedChanged.next(event)));

    // Defect 2255549: Flex - Data points/textual viewer does not display or partially displays DP in layout change
    this.subscriptions.push(this.deattachIndication.subscribe(() => {
      this.saveTextualViewerSettings();
    }));

    this.initialized = true;
    this.virtualizeGrid();
  }

  public ngAfterViewInit(): void {
    this.subscriptions.push(this.resizeObserver.observe(this.textualViewerContainer.nativeElement, 100, true, true).subscribe(() => this.onTableResize()));
    this.virtualizeGrid();
    this.restoreTextualViewerSettings();
  }

  public ngOnDestroy(): void {
    this.reattachIndication = undefined;
    this.deattachIndication = undefined;
    for (const subscription of this.subscriptions) {
      subscription?.unsubscribe();
    }
    this.textualViewerStateStorageService.clearState();
  }

  public saveTextualViewerSettings(): void {
    const scrollYPercentage: number = this.calculateScrollYPercentage();
    const firstItem: GridData = this.textTable[0];
    const designation = firstItem?.customData?.browserObject?.Designation;
    const textualViewerState: TextualViewerState = new TextualViewerState(this.selected, scrollYPercentage, designation);
    this.textualViewerStateStorageService?.setState(textualViewerState);
  }

  public restoreTextualViewerSettings(): void {
    if (this.textualViewerStateStorageService.hasDefinedState) {
      const textualViewerState: TextualViewerState = this.textualViewerStateStorageService.getState();
      const scrollYPercentage: number = textualViewerState.scrollYPercentage;
      const firstItem: GridData = this.textTable[0];
      const designation = firstItem?.customData?.browserObject?.Designation;

      const dataTableBodyElement: HTMLElement = this.datatableBody;
      if (dataTableBodyElement !== undefined) {
        const scrollHeight: number = dataTableBodyElement.scrollHeight;
        const scrollTopTarget: number = scrollYPercentage * scrollHeight;
        dataTableBodyElement.scrollTop = scrollTopTarget;
      }

      if (designation !== undefined && designation === textualViewerState.designation) {
        this.selected = [...textualViewerState.selectedItems];
      }
    }
  }

  public calculateScrollYPercentage(): number {
    const dataTableBodyElement: HTMLElement = this.datatableBody;
    if (dataTableBodyElement !== undefined && dataTableBodyElement !== null) {
      const scrollY: number = dataTableBodyElement.scrollTop;
      const scrollHeight: number = dataTableBodyElement.scrollHeight;
      return scrollY / scrollHeight;
    }

    return 0;
  }

  public showContentActionBar(): void {
    let secondaryActions: MenuItem[];

    if (this.compactMode) {
      secondaryActions = [];
    } else {
      const showColumnDialogHelper: () => void = this.showColumnDialog.bind(this);
      secondaryActions = [{ title: this.gridSettings.texts.customizationModalTitle, action: (): void => showColumnDialogHelper() }];
    }

    this.showContentActionBarChanged.emit(secondaryActions);
  }

  public onSelect(selectedInfo: SelectedInfo): void {
    const gridDataArr: GridData[] = selectedInfo.selected;
    const selected: GridData[] = [];
    for (const gridData of gridDataArr) {
      const numKeys: number = Object?.keys(gridData)?.length || 0;
      if (numKeys > 1) {
        selected.push(gridData);
      }
    }

    this.selected = selected;
    this.saveTextualViewerSettings();
  }

  public onUpdateGridDisplay(): void {
    this.resetItemList();
  }

  public getRowColor(row: GridData): string {
    if (row !== undefined) {
      return row.statePipeColor;
    }

    const defaultColor = '#206ED9';
    return defaultColor;
  }

  public smallScreenSortCompare(a: any, b: any): number {
    if (a.smallScreenOrder < b.smallScreenOrder) {
      return -1;
    }
    if (a.smallScreenOrder > b.smallScreenOrder) {
      return 1;
    }
    return 0;
  }

  public splitAfterLastPeriod(inputString: string): string {
    let path: string;

    if (inputString !== undefined) {
      const colonCharacter = ':';
      const periodCharacter = '.';

      const subIndex: number = inputString.indexOf(colonCharacter);
      const subString = inputString.slice(subIndex);

      let lastIndex: number = subString.lastIndexOf(periodCharacter);
      if (lastIndex < 0) {
        lastIndex = 0;
      }

      const targetIndex: number = lastIndex + subIndex;
      if (targetIndex <= inputString.length) {
        path = inputString.slice(0, targetIndex);
      }
    }

    return path;
  }

  public getRowHeader(row: GridData): string {
    let path: string;
    if (this.cnsLabelObject.cnsLabel === CnsLabelEn.Description
      || this.cnsLabelObject.cnsLabel === CnsLabelEn.DescriptionAndName
      || this.cnsLabelObject.cnsLabel === CnsLabelEn.DescriptionAndAlias) {
      const location: string = row?.customData?.browserObject?.Location;
      path = this.splitAfterLastPeriod(location);
    } else {
      const designation: string = row?.customData?.browserObject?.Designation;
      path = this.splitAfterLastPeriod(designation);
    }

    if (path === undefined) {
      path = row.groupHeader;
    }

    return path;
  }

  public get selected(): GridData[] {
    return this._selected;
  }

  public set selected(gridDataArr: GridData[]) {
    this._selected = gridDataArr;
    if (!isNullOrUndefined(this?._selected?.length) && this?._selected?.length !== 0) {
      this.selectionChanged.emit(gridDataArr);
    }
  }

  public get managedTextTable(): any[] {
    const resTable: any[] = [];

    for (const row of this.textTable) {
      if (row.firstInGroup) {
        const groupHeaderTitleValue = this.getRowHeader(row);
        const header: any = { groupHeaderTitle: groupHeaderTitleValue };
        resTable.push(header);
      }

      resTable.push(row);
    }

    return resTable;
  }

  public onTableResize(): void {
    const elem: any = this.textualViewerContainer.nativeElement;
    const boundaryWidth = 850;
    const isCompact: boolean = elem.offsetWidth < boundaryWidth;
    this.compactMode = isCompact;
    this.showContentActionBar();
    this.changeDetector.detectChanges();
    this.restoreTextualViewerSettings();
  }

  public onSubmitChanges(): void {
    this.configurationChanged.emit(this.headerData);
  }

  public virtualizeGrid(): void {
    this.resetItemList();
  }

  public getRowHeight(row: any): number {
    if (row.groupHeaderTitle !== undefined) {
      return this.expandedViewHeight;
    }

    const isShowingThreeLabels: boolean = this.cnsLabelObject.cnsLabel === CnsLabelEn.DescriptionAndName
      || this.cnsLabelObject.cnsLabel === CnsLabelEn.NameAndDescription;

    if (isShowingThreeLabels && this.compactMode) {
      return this.condensedThreeLabelHeight;
    }

    return this.condensedTwoLabelHeight;
  }

  // The cell-data for a PIPE column-type cell is used to represent the icon to be displayed next to the pipe.
  // The icon can be represented in one of two ways:
  // 1) a string, which is interpreted as an encoded IMAGE (originally the only icon representation supported and
  //  is maintained here for backward compatibility).
  // 2) an object, which is assumed to implement the `Icon` interface.  This can be used to represent icons
  //  in different formats, including IMAGE, TTF, and HTML.  There is also an optional property for providing
  //  css class information for custom styling.
  public isIconIfcCompliant(cd: any): boolean {
    // Detect if cell data is an object that complies with the `Icon` interface
    if (cd && (cd.iconType !== undefined || cd.iconData !== undefined)) {
      return true;
    }
    return false; // old style icon; expect to be string or sanitized string (i.e., SafeValueImpl object)
  }

  public getPipeIconType(cellData: any, id: string): EnumIconType {
    let type: EnumIconType;
    const icon: any = cellData ? cellData.get(id) : undefined;
    if (icon) {
      if (this.isIconIfcCompliant(icon)) {
        type = icon.iconType;
      }
      if (type === undefined) {
        type = EnumIconType.GLYPHICON; // if not `Icon` object or not specified, expect data is an encoded image
      }
    }
    return type;
  }

  public getPipeIconData(cellData: any, id: string): string {
    let data: string;
    let icon: any = cellData ? cellData.get(id) : undefined;
    if (this.isIconIfcCompliant(icon)) {
      switch (icon.iconType) {
        case EnumIconType.GLYPHICON:
          data = icon.iconData || icon.iconStyleClass;
          break;
        case EnumIconType.IMAGE:
        case EnumIconType.HTML:
        default:
          data = icon.iconData;
          break;
      }
    } else {
      icon = 'element-special-object';
      data = icon;
    }

    return data;
  }

  public getColumnCellClass(headerData: HeaderData, cellStyle: string): string {
    if (cellStyle === undefined) {
      return headerData.size;
    } else {
      return headerData.size + ' ' + cellStyle;
    }
  }

  public getPipeIconClass(cellData: any, id: string): string {
    let cls: string;
    const icon: any = cellData ? cellData.get(id) : undefined;
    if (this.isIconIfcCompliant(icon)) {
      cls = icon.iconStyleClass;
    }
    return cls;
  }

  public firstColumnVisibleId(): string {
    for (const header of this.headerData) {
      if (header.columnVisible) {
        return header.id;
      }
    }
  }

  private createColumn(hdrData: HeaderData): Column {
    let isDraggable = true;
    let isDisabled = false;

    if (hdrData.id === this.firstColumnId) {
      isDraggable = false;
      isDisabled = true;
    }

    const result: Column = {
      id: hdrData.id,
      title: hdrData.label,
      visible: hdrData.columnVisible,
      draggable: isDraggable,
      disabled: isDisabled
    };

    return result;
  }

  private createColHeaderDataArr(hdrDataList: HeaderData[]): Column[] {
    const colHeaderData: Column[] = hdrDataList.filter(header => header?.label?.length !== 0).map(hdrData => this.createColumn(hdrData));
    return colHeaderData;
  }

  private showColumnDialog(): void {
    this.tempHeaderData = this.headerData.map(x => Object.assign({}, x));
    const colData: Column[] = this.createColHeaderDataArr(this.headerData);

    const initialColumnState: SiColumnSelectionDialogConfig = {
      columns: colData,
      heading: this.gridSettings.texts.customizationModalTitle,
      bodyTitle: this.gridSettings.texts.customizationModalDescription,
      hiddenText: this.gridSettings.texts.customizationModalHiddenLabel,
      visibleText: this.gridSettings.texts.customizationModalVisibleLabel,
      submitBtnName: this.gridSettings.texts.customizationModalYesBtn,
      cancelBtnName: this.gridSettings.texts.customizationModalCancelBtn
    };

    this.modalService.showColumnSelectionDialog(initialColumnState).subscribe(result => {
      this.onUpdateColumns(result);
    })
  }

  private resetItemList(): void {
    this.textualViewerDataService.resetVirtualizedItemList(this.textTable);
  }

  private onUpdateColumns(result: ColumnSelectionDialogResult): void {
    if (result.type === 'instant') {
      for (const headerData of this.headerData) {
        const colData: Column = result.columns.find(colHeaderData => colHeaderData.title === headerData.label);
        if (colData !== undefined && headerData !== undefined) {
          headerData.columnVisible = colData.visible;
        }
      }

      const newHeaderData: HeaderData[] = [];
      for (const column of result.columns) {
        const targetHeaderIndex: number = this.headerData.findIndex(header => column.title === header.label);
        if (targetHeaderIndex > -1) {
          newHeaderData.push(this.headerData[targetHeaderIndex]);
        }
      }

      this.headerData = [...newHeaderData];
    }

    if (result.type === 'ok') {
      this.tempHeaderData.length = 0;
      this.onSubmitChanges();
      this.modalRef?.hide();
    }

    if (result.type === 'cancel') {
      this.headerData = [...this.tempHeaderData];
      this.tempHeaderData.length = 0;
      this.modalRef?.hide();
    }
  }
}
