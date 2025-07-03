import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Category, CategoryService, Event, EventColors, EventService, EventStates } from '@gms-flex/services';
import { TranslateService } from '@ngx-translate/core';
import { BlinkService, ResizeObserverService } from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable';
import { Subscription } from 'rxjs/internal/Subscription';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatatableComponent } from '@siemens/ngx-datatable';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { GridData, HeaderData } from '../../events/event-data.model';
import { EventsCommonServiceBase } from '../services/events-common.service.base';
import { ActivatedRoute } from '@angular/router';
import { FullSnapInId, IHfwMessage, ISnapInConfig, SnapInBase } from '@gms-flex/core';
const INVESTIGATIVE_MODE = 'investigative';

const enum OnNewEvent {
  DoNothing = 'DoNothing',
  OpenEventList = 'OpenEventList',
  StartFastTreatment = 'StartFastTreatment',
  StartInvestigativeTreatment = 'StartInvestigativeTreatment',
  StartAssistedTreatment = 'StartAssistedTreatment'
}

const enum CloseTreatmentWhen {
  EventAcknowledged = 'EventAcknowledged',
  SourceToNormal = 'SourceToNormal',
  EventReset = 'EventReset',
  EventClosed = 'EventClosed',
  Timeout = 'Timeout'
}

interface SortingData {
  dir: number;
  colName: string;
}

/**
 * @Input compactMode - sets limited representation which can be used in event details
 * @Output configurationChanged
 * @Output selectEvent
 * @Output public unselectedAll
 * @Output public btnClick
 * @Output public initialTableWidth - table width
 * @Output public tableResize - table width on resize
 * @Output public columnResize - column resize data
 * @Output public reorder
 * @Output public sortColumn
 * @Output public rowHeight - returns actula row height
 * @Output public isMinified
 */
@Component({
  selector: 'gms-event-table',
  templateUrl: './event-table.component.html',
  styleUrl: './event-table.component.scss',
  standalone: false
})
export class EventTableComponent
  extends SnapInBase
  implements OnInit, OnDestroy {
  @Input() public allowMultiselection = true;
  @Input() public isInAssistedTreatment = false;
  @Input() public headerData: HeaderData[];
  @Input() public gridSettings: any;
  @Input() public reattachIndication: any;
  @Input() public selectedEventsIds: Observable<string[]>;
  @Input() public gridItem2select: any;
  @Input() public selectedGridRows: any;
  @Input() public updateHeaderInitialization: any;
  @Input() public compactMode = false;
  @Input() public eventCommandsDisabledObs: Observable<boolean>;
  @Input() public scrollable = true;
  @Input() public sortable = true;
  @Input() public fullSnapinID: FullSnapInId;
  @Input() public isInPopoverMode = false;
  @Input() public set visibleColumns(cols: string[]) {
    if (this.visibleCols?.length === 0) {
      this.visibleCols = cols;
    }
  }

  @Input() public set txtTableObser(allEvents: Observable<GridData[]>) {
    this.txtTableObs = allEvents;
  }

  @Input() public set columnsSettingsDataObs(initValsObj: Observable<string>) {
    this.columnsSettingsObs = initValsObj;
  }

  @Input() public set coloredRows(colRows: boolean) {
    this.colorRows = colRows;
    if (!this.isInPopoverMode && colRows) {
      this.categoryService.getCategories().subscribe(response => this.onGetCategories(response));
    }
  }

  @Output() public readonly configurationChanged: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly selectEvent: EventEmitter<any> = new EventEmitter<Event[]>();
  @Output() public readonly unselectEvent: EventEmitter<any> = new EventEmitter<Event[]>();
  @Output() public readonly unselectedAll: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly btnClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly reorder: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly commandClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly initialTableWidth: EventEmitter<any> = new EventEmitter<number>();
  @Output() public readonly tableResize: EventEmitter<any> = new EventEmitter<number>();
  @Output() public readonly columnResize: EventEmitter<string> = new EventEmitter<string>();
  @Output() public readonly sortColumn: EventEmitter<{ colName: string; dir: number }> = new EventEmitter<{ colName: string; dir: number }>();
  @Output() public readonly rowHeight: EventEmitter<number> = new EventEmitter<number>();
  @Output() public readonly minifiedState: EventEmitter<boolean> = new EventEmitter<boolean>();

  public evtIconColWidth = 80;
  public arrowColWidth = 22;
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public totalElements!: number;
  public selectedPos: number;
  public pageNumber = 0;
  public rows: Event[] = [];
  public actions: any[] = [];
  public cache: any = {};
  public isLoading = 0;
  public txtTable: GridData[] = [];
  public txtTableObs: Observable<GridData[]>;
  public commandTexts: Map<string, string>;
  public commandIcons: Map<string, string>;
  public timerSecondsText: string;
  public timerExpiredText: string;
  public colWidthsMap: Map<string, string> = new Map();
  public hdrData: HeaderData[] = [];
  public categoryDescriptorSortDir = 0;
  public isInInvestigativeMode = false;

  @ViewChild('evtTabeleContainer', { static: true })
  public tableContainer: ElementRef;
  @ViewChild('table') public table: DatatableComponent;
  public tableWidth: number;
  public rowsMinified: any[] = [];
  public minifiedTable = false;
  public blinkOn = false;
  public disableCommands = false;
  public columnsSettings = '';
  public selected: GridData[] = [];
  public selectedOld: GridData[] = [];
  public selectedMini: any[] = [];
  public selectedOldMini: any[] = [];
  private columnsSettingsObs: Observable<string>;
  private readonly subscriptions: Subscription[] = [];
  private serverOffset = 0;
  private commandClicked = false;
  private fixedSizeCols: string[] = [];
  private totalFixedColsWidth = 0;
  private totalColsWidth = 0;
  private visibleCols: string[] = [];
  private colDataOrderingArr: string[] = [];
  private colDataVersion = '';
  private colDataOrdering = '';
  private colDataSorting = '';
  private readonly translateService: TranslateService;
  private userLang: string;
  private isInEventList = false;
  private firstSelectedEventId = null;
  private colorRows = false;

  public readonly trackByIndex = (index: number): number => index;

  public getRowClass = (row: any): string =>
    row.status ? `has-status ${row.status}` : '';

  constructor(
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute,
    private readonly blink: BlinkService,
    private readonly sanitizer: DomSanitizer,
    private readonly eventService: EventService,
    private readonly resizeObserver: ResizeObserverService,
    private readonly snapinConfig: ISnapInConfig,
    private readonly categoryService: CategoryService,
    private readonly eventCommonService: EventsCommonServiceBase
  ) {
    super(messageBroker, activatedRoute);
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnInit(): void {
    // if (!this.isInPopoverMode) {
    //   this.categoryService.getCategories().subscribe(response => this.onGetCategories(response));
    // }

    this.subscriptions.push(
      this.blink.pulse$.subscribe(onOff => (this.blinkOn = onOff))
    );

    if (this.eventCommandsDisabledObs != undefined) {
      this.subscriptions.push(
        this.eventCommandsDisabledObs.subscribe((value: boolean) => {
          this.disableCommands = value;
        })
      );
    }

    this.subscribeResizeObserver();

    if (this.snapinConfig.getAvailableModes()) {
      this.subscriptions.push(
        this.messageBroker
          .getCurrentMode()
          .subscribe(mode => this.onGetCurrentMode(mode.id))
      );
    }

    this.subscribeMainDetailChange();

    this.isInEventList = this.fullSnapinID && this.fullSnapinID.frameId === 'event-list' &&
      this.fullSnapinID.snapInId === 'el';
    this.manageTextsAndPageLoading();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription != null) {
        subscription.unsubscribe();
      }
    });
  }
  public isRowDisabled(row: any): boolean {
    return row.isDisabled;
  }

  public isRowDisabledMinified(row: any): boolean {
    return row.meta.el.isDisabled;
  }

  public getSorting(sorting: boolean): string {
    if (this.sortable) {
      return sorting ? 'true' : 'false';
    }
    return 'false';
  }

  public hasCommands(commands: any[]): boolean {
    if (commands && commands.length > 0) {
      return true;
    }
    return false;
  }

  public getDisciplineColor(currEvent: Event): string {
    return `rgb(${currEvent.category?.colors.get(
      EventColors.ButtonGradientDark
    )})`;
  }

  public getDisciplineIcon(currEvent: Event): string {
    return currEvent.icon;
  }

  public setCellContents(id: any, row: any): any {
    switch (id) {
      case 'cause':
      case 'srcPath':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      case 'creationTime':
        return {
          title: this.getTextLine(row.cellData.get(id), 0),
          subtitle: this.getTextLine(row.cellData.get(id), 1)
        };

      case 'informationalText':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      case 'suggestedAction':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      case 'srcSystemName':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      case 'messageText':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      case 'inProcessBy':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      case 'srcAlias':
        return {
          title: row.cellData.get(id),
          subtitle: undefined
        };

      default:
        // case 'srcSource':
        // case 'belongsTo':
        return {
          title: row.cellData.get(id)[0],
          subtitle: row.cellData.get(id)[1]
        };
    }
  }
  // event.cellData.get('eventId') === this.selected[0].cellData.get('eventId')
  public onSelect(ev): void {
    if ((this.isInInvestigativeMode && this.selectedOld.length > 0) || this.isInAssistedTreatment) {
      this.selected.splice(0, this.selected.length);
      this.selected.push(...this.selectedOld);
      return;
    }
    let selected = ev.selected ?? ev;

    if (selected.length === 1) {
      this.firstSelectedEventId = selected[0].customData.eventItem.id;
    }

    if (
      selected.length === 1 && this.selectedOld.length === 1 && !this.commandClicked) {
      if (selected[0].customData.eventItem.id === this.selectedOld[0].customData.eventItem.id) {
        selected = [];
        // this.unselectEvent.emit(ev.selected);
        this.firstSelectedEventId = null;
      }
    }

    this.onUnselected(this.selectedOld, selected);

    // Set minified table
    const selectedMini: any[] = this.getMinifiedSelected(
      this.rowsMinified,
      selected
    );

    this.selectedMini = selectedMini;
    this.selectedOldMini = selectedMini;

    this.selected.splice(0, this.selected.length);

    if (this.firstSelectedEventId && selected.length > 1) {
      const pos = selected.findIndex(el => el.customData.eventItem.id === this.firstSelectedEventId);
      if (pos != -1) {
        const tmp = selected[0];
        selected[0] = selected[pos];
        selected[pos] = tmp;        
      }    
    }

    this.selected.push(...selected);
    this.selectedOld.splice(0, this.selectedOld.length);
    this.selectedOld.push(...selected);
    this.selectEvent.emit(this.selected);
    this.commandClicked = false;
  }

  /**
   * Scrolls the datatable body to display the row at the specified index.
   * Required for auto-selections on event-list such as auto assisted treatment.
   * @param {number} index - The index of the row to scroll to.
   * @returns {void}
   */
  public scrollToRow(index: number): void {
    const rowHeight = this.getRowHeight();
    const tableBody = document.querySelector('.datatable-body') as HTMLElement;
    if (tableBody && !isNullOrUndefined(index)) {
      tableBody.scrollTop = index * rowHeight;
    }
  }

  public onSelectMini(ev): void {
    if (
      (this.isInInvestigativeMode && this.selectedOld.length > 0 && this.isInEventList) ||
      this.isInAssistedTreatment) {
      this.selectedMini.splice(0, this.selectedMini.length);
      this.selectedMini.push(...this.selectedOldMini);
      return;
    }

    let selected = ev.selected;
    const selectedFull = selected.map(i => i.meta.el);

    if (selected.length === 1) {
      this.firstSelectedEventId = selected[0].meta.el.customData.eventItem.id;
    }
    if (selected.length === 1 && this.selectedOld.length === 1 && !this.commandClicked) {
      if (selected[0].meta.el.customData.eventItem.id === this.selectedOld[0].customData.eventItem.id) {
        selected = [];
        this.unselectEvent.emit(selectedFull);
        this.firstSelectedEventId = null;
      }
    }

    // Set minified table
    const selectedMini: GridData[] = this.getMinifiedSelected(
      this.rowsMinified,
      selectedFull
    );

    this.selectedMini = selectedMini;
    this.selectedOldMini = selectedMini;
    this.onUnselected(this.selectedOld, selectedFull);
    this.selected.splice(0, this.selected.length);

    this.selected.push(...selectedFull);
    this.selectedOld.splice(0, this.selectedOld.length);
    this.selectedOld.push(...selectedFull);
    this.selectEvent.emit(this.selected);
    this.commandClicked = false;
  }
  public onResize(ev): string {
    if (ev.column) {
      let colOrderingStr = '';
      let versionAndOrdering: string = this.colDataVersion + '-';

      this.hdrData.find(hdr => hdr.id === ev.column.prop).width = ev.newValue;

      const cols = this.table._internalColumns.map(c => ({
        width: c.width,
        name: c.name,
        prop: c.prop
      }));

      this.colDataOrderingArr.forEach(column => {
        const id = column.split(',')[0];
        const colData = this.hdrData.find(h => h.id === id);
        if (!isNullOrUndefined(colData)) {
          const col = cols.filter(c => colData.id === c.prop)[0];
          let width: number;
          if (typeof col !== 'undefined') {
            width = Math.round((+col.width * 1000) / 1000);
          } else {
            width = +this.colWidthsMap.get(colData.id) || 50;
          }

          colOrderingStr +=
            colData.id +
            ',' +
            colData.columnVisible.toString() +
            ',' +
            width +
            ';';
        }
      });

      versionAndOrdering += colOrderingStr;
      this.columnResize.emit(versionAndOrdering);
      return versionAndOrdering;
    }
    return '';
  }

  public onSort(ev: any): SortingData {
    if (!this.sortable) {
      return null;
    }
    let dir = 0;
    let colName = ev.column.prop;

    if (ev.column.prop === 'eventIcon') {
      colName = 'categoryDescriptor';
      const currentDir: number = this.categoryDescriptorSortDir;
      dir = currentDir >= 2 ? 0 : currentDir + 1;
      this.categoryDescriptorSortDir = dir;
    } else {
      const idx: number = this.hdrData.findIndex(
        col => col.id === ev.column.prop
      );
      if (idx > -1) {
        const currentDir: number = this.hdrData[idx].sortingDirection;
        dir = currentDir >= 2 ? 0 : currentDir + 1;
        this.hdrData[idx].sortingDirection = dir;
      }
    }
    const result: SortingData = { colName, dir };
    this.sortColumn.emit(result);
    return result;
  }

  public getRowHeight(minifiedTable: boolean = false): number {
    const height = 50;

    if (minifiedTable) {
      this.rowHeight.emit(height);
      return 96;
    }

    this.rowHeight.emit(height);
    return height;
  }

  public getTableRowClass = (row: any): string => {
    if (row.meta) {
      if (((this.isInInvestigativeMode && this.selected.length > 0) || (this.isInAssistedTreatment && this.selected.length > 0)) &&
        row.meta.el.customData.eventItem.eventId == this.selected[0].customData.eventItem.eventId) {
        return this.colorRows ? 'rowColor' + row.meta.el.customData.eventItem.categoryId.toString() : 'alwaysActive';
      } else {
        return this.colorRows ? 'rowColor' + row.meta.el.customData.eventItem.categoryId.toString() : '';
      }
    } else {
      if (((this.isInInvestigativeMode && this.selected.length > 0) || (this.isInAssistedTreatment && this.selected.length > 0)) &&
        row.customData.eventItem.eventId == this.selected[0].customData.eventItem.eventId) {
        return this.colorRows ? 'rowColor' + row.customData.eventItem.categoryId.toString() : 'alwaysActive';
      } else {
        return this.colorRows ? 'rowColor' + row.customData.eventItem.categoryId.toString() : '';
      }
    }
  };

  public isTimerAllowed(event: Event): boolean {
    if (
      event.stateId != EventStates.Closed &&
      event.stateId !== EventStates.WaitingOPCompletion &&
      event.stateId !== EventStates.ReadyToBeClosed
    ) {
      return true;
    }
    return false;
  }

  // return event timer in seconds
  public calculateTimer(event: Event): string {
    // 0001-01-01T00:00:00Z
    const expiration: number = Date.parse(event.timerUtc);
    const currentdate: Date = new Date();
    const now: number = currentdate.getTime() - currentdate.getTimezoneOffset() * 60000 + this.serverOffset;
    const timer: number = Math.floor((expiration - now) / 1000);

    if (timer > 60) {
      const minutes: string = String(Math.floor(timer / 60)).padStart(2, '0');
      const seconds: string = String(timer % 60).padStart(2, '0');
      return ': ' + minutes + ':' + seconds;
    } else if (timer <= 60 && timer > 0) {
      return timer + ' ' + this.timerSecondsText;
    } else if (timer <= 0) {
      return this.timerExpiredText;
    }
  }

  public checkIfEllipsis(e: any): boolean {
    if (!isNullOrUndefined(e)) {
      return e.offsetWidth < e.scrollWidth;
    } else {
      return false;
    }
  }

  public tooltipToBeShown(e: any): boolean {
    if (!isNullOrUndefined(e)) {
      return e.id === 'srcPath' || e.id === 'srcSource';
    } else {
      return false;
    }
  }

  private onGetCategories(cats: Category[]): void {
    // We need to make here this check because is not always granted the coloredColor configuration arrived in time
    // TODO: possible refactoring is to change this to be an observable to which we do subscribe.
    // if (this.coloredRows) {
    this.updateStyleSheet(cats);
    // }
  }

  private updateStyleSheet(cats: Category[]): void {
    let foundRule = false;
    const catColorMap: Map<number, string> = new Map();
    cats.forEach(cat => catColorMap.set(cat.id, 'rgb(' + cat.colors.get(EventColors.ButtonGradientDark) + ', 0.5)'));

    // eslint-disable-next-line no-use-before-define
    for (let i = 0; i < document.styleSheets.length && !foundRule; i++) {
      const sheet = document.styleSheets[i];

      if (sheet?.cssRules.item(10)?.cssText.includes('.event-table')) {
        for (let k = 0; k < sheet.cssRules.length && !foundRule; k++) {
          if (sheet.cssRules.item(k).cssText.includes('rowColor1')) {
            let j = 0;
            let catId = 0;
            do {
              catId = cats[j++].id;
              ((sheet.cssRules.item(k + catId - 1)) as CSSStyleRule).style.setProperty('background-color', catColorMap.get(catId), 'important');
            } while (j < cats.length);
            foundRule = true;
          }
        }
      }
    }
  }

  private manageTextsAndPageLoading(): void {
    this.translateService
      .get([
        'EVENTS.ACK-COMMAND-TEXT',
        'EVENTS.RESET-COMMAND-TEXT',
        'EVENTS.SILENCE-COMMAND-TEXT',
        'EVENTS.UNSILENCE-COMMAND-TEXT',
        'EVENT-TABLE.TIMER-SECONDS',
        'EVENT-TABLE.TIMER-EXPIRED',
        'EVENTS.CLOSE-COMMAND-TEXT'
      ])
      .toPromise().then(strings => this.initLoadPage(strings));
  }

  private onGetCurrentMode(modeId: string): void {
    this.isInInvestigativeMode = modeId === INVESTIGATIVE_MODE ? true : false;

    // TODO: This block recalculates the event-list scrollbar position to synchronize with the currently selected event.
    // While it effectively performs within onSelect() or onSelectMini() methods, it faces issues in scenarios like auto-assisted treatment,
    // where this.selected[0] is frequently returned as undefined. Placing this logic within the corresponding method
    // would ensure its functionality aligns appropriately with the desired behavior. Leaving this at is for now as we're in DCC3
    // quite occupied and I have no more time to spend on this. (This was not feature requirement, but would be a nice touch)
    /*
    // Scroll to the selected event
    this.selectedPos = !isNullOrUndefined(this.selected[0]) ?
      this.txtTable.findIndex(el => el.customData && el.customData.eventItem.id === this.selected[0]?.customData?.eventItem.id) !== -1 ?
        this.txtTable.findIndex(el => el.customData && el.customData.eventItem.id === this.selected[0]?.customData?.eventItem.id) :
        this.selectedPos :
      this.selectedPos;

    this.scrollToRow(this.selectedPos);
    */

    if (!this.isInInvestigativeMode) {
      this.txtTable.forEach(txt => txt.isDisabled = false);
    }
  }

  private processRowDisable(gridData: GridData[]): GridData[] {
    if (this.isInInvestigativeMode || this.isInAssistedTreatment) {
      gridData.forEach(txt => {
        if (txt.customData.eventItem.eventId == this.selected[0]?.customData.eventItem.eventId) {
          txt.isDisabled = false;
        } else {
          txt.isDisabled = true;
        }
      });
    } else {
      gridData.forEach(element => { element.isDisabled = false; });
    }
    return gridData;
  }

  private initData(initVals: string): void {
    if (initVals?.length > 0) {
      this.colDataVersion = '';
      const initValsSections: string[] = initVals.split('-');

      this.fixedSizeCols = this.getFixedCols();

      if (initVals.startsWith('version')) {
        this.colDataVersion = initValsSections[0];
        this.colDataOrdering = initValsSections[1];
        this.colDataSorting = initValsSections[2];
      } else {
        this.colDataOrdering = initValsSections[0];
        this.colDataSorting = initValsSections[1];
      }

      this.setColsSorting(this.colDataSorting);
      this.colDataOrderingArr = this.colDataOrdering.split(';').slice(0, -1);
      this.visibleCols = [];
      this.setColWidths();
    }
  }

  private setColsSorting(sorting: string): void {
    const sortingArr = sorting.split(';');

    for (const hdrDataItem of this.hdrData) {
      const itemParams = sortingArr.find(e => e.startsWith(hdrDataItem.id));
      if (!isNullOrUndefined(itemParams)) {
        hdrDataItem.sortingDirection = +itemParams.split(',')[2];
      } else {
        hdrDataItem.sortingDirection = 0;
      }
    }

    const categoryDescriptorSettings = sortingArr.find(e =>
      e.startsWith('categoryDescriptor')
    );
    if (!isNullOrUndefined(categoryDescriptorSettings)) {
      this.categoryDescriptorSortDir =
        +categoryDescriptorSettings.split(',')[2] || 0;
    }
  }

  private processColumnsSettings(): void {
    if (this.headerData && this.headerData.length > 0) {
      if (
        this.visibleCols.length === 0 &&
        this.colDataOrderingArr.length === 0
      ) {
        this.hdrData = this.headerData;
        return;
      }

      const indexInList = this.rearrangeCols();

      for (let i = 0; i < this.headerData.length; i++) {
        if (i < indexInList) {
          this.headerData[i].columnVisible = true;
        } else {
          this.headerData[i].columnVisible = false;
        }
      }
    }
    this.hdrData = this.headerData;
  }

  private moveItem(from: number, to: number): void {
    const currItem: any = this.headerData.splice(from, 1)[0];
    this.headerData.splice(to, 0, currItem);
  }

  private getTextLine(fullText: string, lineIndex: number): string {
    return fullText.split(',')[lineIndex];
  }

  private loadPage(): void {
    this.pageNumber = 1;

    this.isLoading++;

    if (this.txtTableObs !== undefined) {
      this.subscriptions.push(
        this.txtTableObs.subscribe(gridRows => {

          this.selected = this.getSelected(gridRows, this.selected);
          const rows = this.processRowDisable(gridRows);
          this.txtTable = rows;

          // Unselect if txtTable is empty
          if (gridRows.length === 0) {
            this.unselectEvent.emit([]);
          }
        })
      );

      // Minified table
      this.subscriptions.push(
        this.txtTableObs
          .pipe(map(gridRows => gridRows.map(r => this.setMinifiedRow(r))))
          .subscribe(gridRows => {
            // Set selected
            this.selectedMini = this.getMinifiedSelected(
              gridRows,
              this.selected
            );

            // Update rows
            this.rowsMinified = gridRows;
          })
      );
      // Actions array
      this.subscriptions.push(
        this.txtTableObs
          .pipe(map(gridRows => gridRows.map(r => this.setActionsCell(r))))
          .subscribe(gridRows => {
            this.actions = gridRows;
          })
      );
    }

    this.totalElements = this.txtTable.length;
    this.isLoading--;
  }

  private onCommandClick(cmd: string, event: Event): void {
    this.commandClicked = true;
    const params = {
      cmd,
      event
    };
    this.commandClick.emit(params);
  }

  private subscribeMainDetailChange(): void {
    this.subscriptions.push(this.eventCommonService.mainDetailResize$.subscribe(() => this.table.recalculate()));
  }

  private subscribeResizeObserver(): void {
    this.subscriptions.push(
      this.resizeObserver
        .observe(this.tableContainer.nativeElement, 100, true, true)
        .subscribe(() => this.onTableResize())
    );
  }

  private onTableResize(): void {
    const elem: any = this.tableContainer.nativeElement;
    const prevMinifiedTable = this.minifiedTable;
    const minifiedTable = elem.offsetWidth < 900 ? true : false;
    if (minifiedTable != this.minifiedTable) {
      this.minifiedState.emit(minifiedTable);
    }

    this.minifiedTable = minifiedTable;
    if (typeof this.tableWidth === 'undefined') {
      this.initialTableWidth.emit(elem.offsetWidth);
    }
    this.tableWidth = elem.offsetWidth;
    this.tableResize.emit(elem.offsetWidth);

    // Trigger ngx-datatable recalculation
    if (this.table !== undefined) {
      if (this.isInPopoverMode) {
        this.table.bodyComponent.offsetY = 0;
      }
    }

    this.table.recalculate();
  }

  private initLoadPage(strings: object): void {
    this.commandTexts = new Map([
      ['ack', strings['EVENTS.ACK-COMMAND-TEXT']],
      ['reset', strings['EVENTS.RESET-COMMAND-TEXT']],
      ['silence', strings['EVENTS.SILENCE-COMMAND-TEXT']],
      ['unsilence', strings['EVENTS.UNSILENCE-COMMAND-TEXT']],
      ['close', strings['EVENTS.CLOSE-COMMAND-TEXT']]
    ]);

    this.commandIcons = new Map([
      ['ack', 'element-alarm-tick'],
      ['reset', 'element-undo'],
      ['silence', 'element-horn-off'],
      ['unsilence', 'element-horn'],
      ['close', 'element-cancel']
    ]);

    this.timerSecondsText = strings['EVENT-TABLE.TIMER-SECONDS'];
    this.timerExpiredText = strings['EVENT-TABLE.TIMER-EXPIRED'];

    this.userLang = this.translateService.getBrowserLang();

    this.processColumnsSettings();
    this.updateColumnsWidths();
    this.loadPage();

    if (!this.isInPopoverMode) {
      this.eventService.serverClientTimeDiff().then(res => {
        this.serverOffset = res;
      });
    }

    if (this.columnsSettingsObs != undefined) {
      this.subscriptions.push(
        this.columnsSettingsObs.subscribe(initVals => {
          this.columnsSettings = initVals;
          this.initData(initVals);
          this.processColumnsSettings();
          this.updateColumnsWidths();
          this.loadPage();
        })
      );
    }

    if (this.selectedGridRows != undefined) {
      this.subscriptions.push(
        this.selectedGridRows.subscribe(initVals => {
          if (initVals && initVals.length === 2 && isNullOrUndefined(initVals[1])) {
            this.onSelect([initVals[0]]);
          } else {
          // Set selected rows
            this.selected = initVals;
            if (
              initVals &&
            (initVals as GridData[]).length === 1 &&
            this.selectedOld.length === 0
            ) {
              this.selectedOld = initVals;
            }
            this.selected = this.txtTable.filter(r => {
              if (initVals !== null) {
                for (const sRow of initVals) {
                  if (typeof sRow !== 'undefined') {
                    if (
                      sRow?.customData?.eventItem.id ===
                    r?.customData?.eventItem.id
                    ) {
                      return true;
                    }
                  }
                }
                return false;
              }
            });
          }
        })
      );
    }
  }
  // Find unselected events
  private onUnselected(selectedOld, selectedNew): void {
    if (selectedOld.length !== selectedNew.length) {
      this.refreshSelections(selectedOld, selectedNew);
    } else if (selectedNew.length === 1) {
      this.refreshSelections(selectedOld, selectedNew);
    }
  }

  private refreshSelections(selectedOld, selectedNew): void {
    const unselected: Event[] = [];

    selectedOld.forEach(ev => {
      const findNewEvents = selectedNew.filter(
        newEv =>
          newEv?.customData?.eventItem.id === ev?.customData?.eventItem.id
      );

      if (findNewEvents.length === 0) {
        unselected.push(ev);
      }
    });

    if (unselected.length > 0) {
      this.unselectEvent.emit(unselected);
    }
  }
  private setMinifiedRow(el: Partial<GridData>): any {
    const item = el.customData.eventItem;
    const pipeColor = this.getDisciplineColor(item);
    const eventIcon = this.getDisciplineIcon(item);
    let recursation;
    try {
      recursation = el.cellData.get('recursation')[0].text || 0;
    } catch (err) {
      recursation = 0;
    }
    const srcSource = el.cellData.get('srcSource');
    const timer = el.cellData.get('timer') || undefined;
    const creationTime = el.cellData.get('creationTime') || undefined;

    const minifiedRow = {
      icon: {
        iconData: eventIcon,
        pipeColor,
        state: item.state,
        stateIcon: el.cellData.get('state')[1],
        stateIconColor: el.cellData.get('state')[2],
        stateSecondaryIcon: el.cellData.get('state')[3]
          ? el.cellData.get('state')[3]
          : undefined,
        stateSecondaryIconColor: el.cellData.get('state')[4]
          ? el.cellData.get('state')[4]
          : undefined,
        recursation: +recursation || 0,
        el
      },
      meta: {
        title: srcSource[0] || '',
        subtitle: srcSource[1] || '',
        value: item.cause,
        timer: this.isTimerAllowed(item) ? timer : undefined,
        date: creationTime,
        el
      }
    };
    return minifiedRow;
  }
  private updateColumnsWidths(resizedCol?: string): void {
    if (
      this.tableContainer.nativeElement.offsetWidth !== 0 &&
      this.totalFixedColsWidth !== 0
    ) {
      this.hdrData.forEach(col => {
        if (col.columnVisible === true) {
          if (this.fixedSizeCols.includes(col.id)) {
            // fixed col
            const width = Math.round((+col.minColWidth * 1000) / 1000);
            this.colWidthsMap.set(col.id, width.toString());
          }
        }
      });
    }
  }

  private setActionsCell(el: GridData): any {
    const actions = { primary: [], secondary: [] };
    const commands = el.cellData.get('commands');

    const evt = el.customData.eventItem;
    const cmds = el.customData.eventItem.commands;

    // Set primary action
    let primaryCmd = commands.find(c =>
      evt.suggestedAction?.toLowerCase().startsWith(c)
    );

    if (primaryCmd === "silence" || primaryCmd === "unsilence") {
      if (commands.find(c => c === "reset")) {
        primaryCmd = "reset";
      }
      if (commands.find(c => c === "ack")) {
        primaryCmd = "ack";
      }
    }

    if (commands.length > 0 && primaryCmd === undefined) {
      primaryCmd = commands.find(c => c !== "empty");
    }

    const primaryAction = this.setPrimaryActions(
      primaryCmd,
      cmds,
      commands,
      evt
    );
    const primaryActionId = primaryAction.primaryActionId;

    actions.primary = primaryAction.actions;

    // Set secondary actions
    const secondaryActions = this.setSeconadyActions(
      evt,
      primaryActionId,
      cmds
    );

    actions.secondary = this.cleanSecondaryActions(secondaryActions);

    return actions;
  }

  private setPrimaryActions(primaryCmd, cmds, commands, evt): any {
    let actions = [];
    let primaryActionId = null;
    if (!isNullOrUndefined(primaryCmd)) {
      const primaryAction = {
        title: this.commandTexts.get(primaryCmd.toLowerCase()),
        icon: primaryCmd.glyphicon,
        disabled: this.disableCommands,
        action: (): void => this.onCommandClick(primaryCmd, evt)
      };
      primaryActionId = primaryAction.title;
      actions = [primaryAction];
    } else {
      const suggestedAction = this.getSuggestedAction(evt);
      if (isNullOrUndefined(suggestedAction)) {
        cmds.forEach(cmd => {
          if (cmd.Id !== 'Select' && cmd.Id != 'Suspend') {
            const primaryCommand = commands.find(
              c => cmd.Id.toLowerCase() == c
            );
            if (!isNullOrUndefined(primaryCommand)) {
              const primaryAction = {
                title: this.commandTexts.get(primaryCommand.Id),
                icon: primaryCommand.glyphicon,
                disabled: this.disableCommands,
                action: (): void => this.onCommandClick(primaryCommand, evt)
              };
              primaryActionId = primaryAction.title;
              actions = [primaryAction];
            }
          }
        });
      } else {
        primaryActionId = suggestedAction.title;
        actions = [suggestedAction];
      }
    }

    return { actions, primaryActionId };
  }

  private setSeconadyActions(evt, primaryActionId, cmds): any[] {
    const secondaryActions = [];

    if (this.disableCommands) {
      return secondaryActions;
    }

    this.commandTexts.forEach(cmd => {
      const action = {
        title: cmd,
        disabled: this.checkAllClosed(cmd, evt, primaryActionId),
        action: (): void => this.onCommandClick(secondaryCmd.Id, evt)
      };

      const secondaryCmd = cmds.find(c => c.Id === cmd);
      if (
        !isNullOrUndefined(secondaryCmd) &&
        secondaryCmd.Id !== primaryActionId
      ) {
        secondaryActions.push(action);
      } else {
        if (cmd != primaryActionId) {
          action.disabled = true;
          secondaryActions.push(action);
        }
      }
    });

    return secondaryActions;
  }

  private checkAllClosed(title: string, evt, primaryActionId: string): boolean {
    if (
      evt.groupedEvents.length === 0 &&
      primaryActionId === 'Close' &&
      (title === 'Silence' || title === 'Unsilence')
    ) {
      return true;
    } else if (
      evt.groupedEvents.length > 0 &&
      primaryActionId === 'Close' &&
      (title === 'Silence' || title === 'Unsilence')
    ) {
      let allClose = true;
      evt.groupedEvents.forEach(child => {
        if (child.commands.findIndex(x => x.Id === 'Close') === -1) {
          allClose = false;
        }
      });
      if (allClose === true) {
        return true;
      }
    }
    return false;
  }
  private cleanSecondaryActions(actions): any[] {
    const secondaryActions = actions.map(a => a);
    let idx;
    // Clean up secondary actions
    const silence = secondaryActions.find(c => c.title == 'Silence');
    const unsilence = secondaryActions.find(c => c.title == 'Unsilence');

    if (!isNullOrUndefined(silence) && !silence.disabled) {
      idx = secondaryActions.findIndex(c => c.title == 'Unsilence');
    } else if (!isNullOrUndefined(unsilence) && !unsilence.disabled) {
      idx = secondaryActions.findIndex(c => c.title == 'Silence');
    } else {
      idx = secondaryActions.findIndex(c => c.title == 'Unsilence');
    }

    if (idx > -1) {
      secondaryActions.splice(idx, 1);
    }

    return secondaryActions;
  }

  private getSuggestedAction(evt: any): any {
    const cmd = this.commandTexts.get(evt.suggestedAction.toLowerCase());
    const cmdId = Array.from(this.commandTexts.keys()).find(k =>
      evt.suggestedAction.toLowerCase().startsWith(k)
    );
    if (!isNullOrUndefined(cmd)) {
      const title = cmd;
      const icon = this.commandIcons.get(evt.suggestedAction.toLowerCase());
      const action = (): void => {
        this.onCommandClick(cmdId, evt);
      };
      return { title, icon, action };
    }
    return null;
  }

  private setColWidths(): void {
    this.colDataOrderingArr.forEach(colData => {
      const colDataSplit: string[] = colData.split(',');

      if (colDataSplit[1] === 'true') {
        this.visibleCols.push(colDataSplit[0]);

        if (!this.fixedSizeCols.includes(colDataSplit[0])) {
          // Non fixed col
          this.colWidthsMap.set(colDataSplit[0], colDataSplit[2].toString()); // need to insert the real value
        } else {
          // Fixed col
          const idx = this.hdrData.map(c => c.id).indexOf(colDataSplit[0]);
          const item = this.hdrData[idx];
          const width = Math.round((+item.minColWidth * 1000) / 1000);
          this.colWidthsMap.set(colDataSplit[0], width.toString());
        }
      }
    });
  }

  private getFixedCols(): string[] {
    return this.hdrData.map(hdr => {
      if (hdr.isFixedSize === true) {
        return hdr.id;
      }
    });
  }

  private rearrangeCols(): number {
    let indexVal = 0;
    let indexInList = 0;
    if (this.colDataOrderingArr.length > 0) {
      indexInList = this.setColOrdering(indexVal, indexInList);
    } else {
      for (const colData of this.visibleCols) {
        indexVal = this.headerData.findIndex(col => col.id === colData);
        this.moveItem(indexVal, indexInList++);
      }
    }
    return indexInList;
  }

  private setColOrdering(indexVal: number, indexInList: number): number {
    this.totalFixedColsWidth = 0;
    this.totalColsWidth = this.arrowColWidth;
    for (const colData of this.colDataOrderingArr) {
      const colDataSplit: string[] = colData.split(',');

      if (this.visibleCols.includes(colDataSplit[0])) {
        indexVal = this.headerData.findIndex(
          col => col.id === colDataSplit[0]
        );
        if (typeof this.headerData[indexVal] !== 'undefined') {
          this.headerData[indexVal].columnVisible =
            colDataSplit[1].toUpperCase() === 'TRUE';
        }

        this.totalColsWidth += +colDataSplit[2];

        if (this.fixedSizeCols.includes(colDataSplit[0])) {
          this.totalFixedColsWidth += this.headerData[indexVal].minColWidth;
        }
        this.moveItem(indexVal, indexInList++);
      }
    }
    return indexInList;
  }

  private getMinifiedSelected(rowsMinified, selectedFullItems): GridData[] {
    return rowsMinified.filter(r => {
      for (const sRow of selectedFullItems) {
        if (
          sRow?.customData?.eventItem?.id ===
          r?.meta?.el?.customData?.eventItem?.id
        ) {
          return true;
        }
      }
      return false;
    });
  }

  private getSelected(gridRows, selectedFullItems): GridData[] {
    return gridRows.filter(r => {
      for (const sRow of selectedFullItems) {
        if (sRow?.customData?.eventItem?.id === r?.customData?.eventItem.id) {
          return true;
        }
      }
      return false;
    });
  }
}
