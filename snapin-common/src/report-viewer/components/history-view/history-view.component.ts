import { AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter,
  HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { BrowserObject, DocumentTypes, ParametersMetaData,
  RelatedItemsRepresentation, ReportDocumentData, ReportExecutionStatus, ReportHistoryData } from '@gms-flex/services';
import { MenuItem } from '@simpl/element-ng';
import { ReportViewerService } from '../../services/report-viewer.service';
import { ParameterRelatedInfo, SelectedRuleDetails, StateData } from '../../view-model/storage-vm';
import { Subscription } from 'rxjs';

export interface ContentActionArgs {
  execId: string;
  isParent: boolean;
  displayName: string;
}

@Component({
  selector: 'gms-history-view',
  templateUrl: './history-view.component.html',
  styleUrl: './history-view.component.scss',
  standalone: false
})

export class HistoryViewComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @Input() public selectedObject: BrowserObject;
  @Input() public historyLoaded;
  @Input() public isReportDefault = true;
  @Input() public multipleBrowserObjects = false;
  @Input() public isHistoryVisible = false;
  @Input() public reportHistoryData: ReportHistoryData[];
  @Input() public isParent: boolean;
  @Input() public execId: string;
  @Input() public displayName: string;
  @Input() public executionIdMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
  @Input() public selectedReportName: string;
  @Input() public originSnapInId: string;
  @Input() public applicationRules: RelatedItemsRepresentation[];
  @Input() public fromEvents: boolean;
  @Input() public stateDataObject: StateData;
  @Input() public selectedDocuments: any = [];
  @Output() public readonly startExecutionCommand = new EventEmitter<DocumentTypes>();
  @Output() public readonly downloadReportEvent = new EventEmitter<{ reportHistory: ReportHistoryData[], execId: string, 
    documentDisplayName: string, isParent: boolean }>();
  @Output() public readonly showRelatedReportEvent = new EventEmitter<ContentActionArgs>();
  @Output() public readonly deleteReportDocumentsEvent = new EventEmitter<ContentActionArgs>();
  @Output() public readonly showReportEvent = new EventEmitter<{ documentData: ReportDocumentData; isManualSelection: boolean }>();
  @Output() public readonly setActiveEvent = new EventEmitter<{ execId: string; displayName: string; isParent: boolean }>();
  @Output() public readonly isParameterDialog = new EventEmitter<ParametersMetaData>();
  @Output() public readonly isParamterLoading = new EventEmitter<boolean>();
  @Output() public readonly isSelectedRule = new EventEmitter<string>();
  @Output() public readonly childToParent = new EventEmitter<string>();
  @Output() public readonly savedSelectedRule = new EventEmitter<SelectedRuleDetails>();
  @Output() public readonly scrollHandlerEvent = new EventEmitter<number>();
  @Output() public readonly expandRowEvent = new EventEmitter<number[]>();

  @ViewChild('historyPanel', { static: false }) public historyPanel: ElementRef;
  @ViewChild('generatebtn', { static: false }) public generatebtn: ElementRef;

  public primaryItems: MenuItem[] = [
    { title: 'REPORT-VIEWER.BTN.DOWNLOAD', action: (): any => this.downloadReport(this.reportHistoryData, this.execId, this.displayName, this.isParent) },
    { title: 'REPORT-VIEWER.BTN.PREVIEW', action: (): any => this.showRelatedReport() }
  ];
  public secondaryItems: MenuItem[] = [
    { title: 'REPORT-VIEWER.BTN.DELETE', action: (): any => this.deleteReportDocuments() }
  ];

  public cancelItem: MenuItem[] = [
    { title: 'REPORT-VIEWER.BTN.CANCEL', action: (): any => this.cancelReportExecution(this.selectedObject.SystemId, this.execId) }
  ];

  public expandBtn: Element;
  public expandIndex: number;
  public status = ReportExecutionStatus;
  public isHistoryFirstLoad = true;
  public parameterLoading = false;
  public rptDesign = undefined;
  public expandedRowArray: number[] = [];

  private readonly activeClass = 'item-active';

  private readonly subscriptions: Subscription[] = [];
  private isViewInitialized = false;

  @HostListener('window:scroll', ['$event'])
  public scrollHandler(event): void {
    this.scrollHandlerEvent.emit(this.historyPanel.nativeElement.scrollTop);
  }

  constructor(private readonly reportService: ReportViewerService) { }

  public ngOnInit(): void {
    this.subscriptions.push(this.reportService.paramatersRelatedInfo.subscribe({
      next: (paramatersRelatedInfo: ParameterRelatedInfo) => {
        ({ parametersLoading: this.parameterLoading, rptdesign: this.rptDesign }
          = paramatersRelatedInfo);
      }
    }));
  }

  public ngAfterViewInit(): void {
    this.isViewInitialized = true;
  }

  public ngAfterViewChecked(): void {
    if (this.isViewInitialized && this.reportHistoryData?.length > 0) {
      this.getExpandRowIndex();
      this.isViewInitialized = false;
    }
  }

  public ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  public onMouseEnter(event: any): void {
    if (!event.target.classList.contains('item-active')) {
      const dropdownItem = event.target.querySelector('a.dropdown-item');
      if (dropdownItem) {
        // dropdownItem.style.backgroundColor = '#f0f2f5';
      } else if (dropdownItem?.style) {
        dropdownItem.style.backgroundColor = '';
      }
    }
  }

  public onMouseLeave(event: any): void {
    if (!event.target.classList.contains('item-active')) {
      const dropdownItem = event.target.querySelector('a.dropdown-item');
      if (dropdownItem) {
        // dropdownItem.style.backgroundColor = '#fff';
      } else if (dropdownItem?.style) {
        dropdownItem.style.backgroundColor = '';
      }
    }
  }

  public onExpandRow(index: number): void {
    this.expandIndex = index;
    this.expandBtn = document.querySelector('#expandBtn' + index);
    const exec = this?.reportHistoryData[index];
    const childrenData = exec?.ReportDocumentData;
    const childrenElements = [];

    for (const data of childrenData) {
      childrenElements.push(document.getElementById(this.originSnapInId + exec.ReportExecutionId + data.DocumentDisplayName));
    }

    this.expandBtn?.classList.toggle('rotate');
    if (this.expandBtn?.getAttribute('aria-expanded') == 'false') {
      childrenElements.forEach(element => {
        element?.classList.add('shown');
        element?.classList.remove('hidden');
      });
      this.expandBtn.setAttribute('aria-expanded', 'true');
      if (!this.expandedRowArray.includes(index)) {
        this.expandedRowArray.push(index);
      }
    } else {
      childrenElements.forEach(element => {
        element?.classList.add('hidden');
        element?.classList.remove('shown');
      });
      this.expandBtn?.setAttribute('aria-expanded', 'false');
      this.expandedRowArray = this.expandedRowArray.filter(i => i !== index);
    }
    this.expandRowEvent.emit(this.expandedRowArray);
  }

  public startReportExecution(documentType: DocumentTypes): void {

    this.generatebtn.nativeElement.disabled = true;
    this.startExecutionCommand.emit(documentType);
    setTimeout(() => {
      this.generatebtn.nativeElement.disabled = false;  
    }, 500)
  }

  public downloadReport(reportHistory: ReportHistoryData[], execId: string, documentDisplayName: string, isParent: boolean): void {
    this.downloadReportEvent.emit({ reportHistory, execId, documentDisplayName, isParent });
  }

  public showRelatedReport(): void {
    this.showRelatedReportEvent.emit({
      execId: this.execId,
      isParent: this.isParent,
      displayName: this.displayName
    });
  }

  public emitChildToparent(event): void {
    this.childToParent.emit(event);
  }

  public deleteReportDocuments(): void {
    this.deleteReportDocumentsEvent.emit({
      execId: this.execId,
      isParent: this.isParent,
      displayName: this.displayName
    });
  }

  public setActive(execId: string, displayName: string, isParent: boolean): void {
    this.setActiveEvent.emit({ execId, displayName, isParent });
  }

  public showReport(documentData: ReportDocumentData, isManualSelection: boolean): void {
    this.showReportEvent.emit({ documentData, isManualSelection });
  }

  public onContentBarClick(event: any, execId: string, displayName: string, isParent: boolean): void {
    event.stopPropagation();
    // force content bar dropdowns close when propagation stopped
    document.querySelectorAll('si-dropdown-container si-menu-legacy.dropdown-menu.show').forEach(el => {
      el.classList.remove('show');
    });
    this.execId = execId;
    this.displayName = displayName;
    this.isParent = isParent;
  }

  public trackByReportExecutionId(index: number, reportHistoryData: ReportHistoryData): string {
    return reportHistoryData.ReportExecutionId;
  }

  public cancelReportExecution(systemId: number, reportExecutionId: string): void {
    this.reportService.cancelReportExecution(systemId, reportExecutionId, this.reportHistoryData);
  }

  public getElementById(id: string): Element {
    return document.getElementById(id);
  }

  public getExpandRowIndex(): void {
    if (this.stateDataObject?.expandedRow?.length > 0) {
      this.stateDataObject?.expandedRow.forEach(data => {
        this.onExpandRow(data);
      
      });
    }
  }

  public applyDeactiveStyle(element: Element): void {
    const dropdownItem = element.querySelector('.history-container a.dropdown-item') as HTMLElement;
    const reportIcon = element.querySelector('.history-container i.icon') as HTMLElement;
    if (dropdownItem) {
      // dropdownItem.style.backgroundColor = '#fff';
    }
    if (reportIcon) {
      reportIcon.classList.remove('element-report-filled');
    }
    if (element.className.includes(this.activeClass)) {
      element.classList.remove(this.activeClass);
    }
  }

  public applyActiveStyle(element: Element): void {
    if (!element?.classList.contains(this.activeClass)) {
      element?.classList.add(this.activeClass);
    }
    const cab = element?.querySelector('a.dropdown-item') as HTMLElement;
    if (cab) {
      // cab.style.backgroundColor = '#dee2e5';
    }
    const reportIcon = element?.querySelector('i.icon') as HTMLElement;
    reportIcon?.classList.add('element-report-filled');
  }
}
