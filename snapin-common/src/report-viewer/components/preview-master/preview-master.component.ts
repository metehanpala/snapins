import { AfterViewChecked, Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BrowserObject, CreateDocumentData, DeleteDocumentData, DocumentTypes, LogViewerServiceBase, RelatedItemsRepresentation, ReportDocumentData,
  ReportExecutionStatus, ReportHistoryData, ReportServiceBase, ReportSubscriptionServiceBase } from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { DeleteConfirmationDialogResult, MenuItem, ResizeObserverService, SiActionDialogService } from '@simpl/element-ng';
import { forkJoin, from, Observable, Subject, Subscription } from 'rxjs';
import { ReportViewerService } from '../../services/report-viewer.service';
import { MultipleHistoryRowSelectionMapData, ParameterRelatedInfo, SelectedRuleDetails, 
  SetActiveReport, ShowReportHistory, StateData } from '../../view-model/storage-vm';
import { ContentActionArgs, HistoryViewComponent } from '../history-view/history-view.component';
import { FullSnapInId } from '@gms-flex/core';
import { DocumentRenderComponent } from '../document-render/document-render.component';

@Component({
  selector: 'gms-preview-master',
  templateUrl: './preview-master.component.html',
  styleUrl: './preview-master.component.scss',
  standalone: false
})
export class PreviewMasterComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {

  @Input() public historyLoaded = true;
  @Input() public relatedItems: RelatedItemsRepresentation[];
  @Input() public selectedObject: BrowserObject;
  @Input() public isHistoryVisible = true;
  @Input() public reportHistoryData: ReportHistoryData[];
  @Input() public createDocumentData: CreateDocumentData;
  @Input() public stateDataObject: StateData;
  @Input() public reportDefinitionId: string;
  @Input() public executionIdMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
  @Input() public isReportDefault: string;
  @Input() public selectedReportName: string;
  @Input() public originSnapInId: string;
  @Input() public fileName: string;
  @Input() public fromEvents: boolean;
  @Input() public canHistoryLoaded: boolean;
  @Input() public isControlEditable: boolean;
  @Input() public isFormOpen = false;
  @Input() public selectedEventOPId: string;
  @Input() public stepId: string;
  @Input() public procedureStepType: string;
  @Input() public fullId: FullSnapInId;

  @Output() public readonly storeObjectEmitter = new EventEmitter<StateData>(); // StateData;
  @Output() public readonly startExecutionCommand = new EventEmitter<DocumentTypes>();
  @Output() public readonly sendToOutputEvent = new EventEmitter();
  @Output() public readonly fillFormEvent = new EventEmitter();
  @Output() public readonly savedSelectedRule = new EventEmitter<SelectedRuleDetails>();
  @Output() public readonly setActiveEvent = new EventEmitter<SetActiveReport>();
  @Output() public readonly showReportEvent = new EventEmitter<ShowReportHistory>();
  @Output() public readonly scrollHandlerEvent = new EventEmitter<number>();
  @Output() public readonly saveTreatmentFormEvent = new EventEmitter<string>();
  @Output() public readonly keydownEventFormultipleHistoryRowSelectionEmitter = new EventEmitter<boolean>();
  @Output() public readonly selectiondocumentMapEmitter = new EventEmitter<Map<string, MultipleHistoryRowSelectionMapData>>();
  @Output() public readonly expandRowEventData = new EventEmitter<number[]>();
  @Output() public readonly reporthistoryData = new EventEmitter<ReportHistoryData[]>();

  public execId: string;
  public displayName: string;
  public isParent: boolean;
  public scrollRetainPosition: number;
  public multipleBrowserObjects = false;
  public isEmpty = true;

  public deleteDocumentData: DeleteDocumentData = {
    /** WSI response is contradicting with camel case hence need to suspend this rule. */
    /* eslint-disable @typescript-eslint/naming-convention */
    SystemId: null,
    DeleteFilters: null
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  public selectedDocuments: any = [];
  public multipleSelectionActive = false;
  public isPreviewed: boolean;
  public responsiveParameter: boolean;
  public docName: string;
  public fileUrl: any = undefined;
  public newTabUrl: SafeResourceUrl = undefined;
  public pdf = false;
  public downloadAvailable: boolean;
  public backBtnText: string;
  public reportPreviewText: string;
  public status = ReportExecutionStatus;
  public isHistoryFirstLoad = true;
  public lastShownDocumentData: ReportDocumentData;
  public isParameterOpen = false;
  public parameterMetaData = null;
  public parameterLoading = false;
  public selectedRule: string;
  public containerWidth: number;
  public ruleObjectId: string;
  public rptDesign: string;
  public fileType: string;
  public isLoading = false;
  @ViewChild('leftColumnWrapper', { static: false }) public leftColumnWrapper: ElementRef;
  @ViewChild('reportSeperator', { static: false }) public reportSeperator: ElementRef;

  private rightColumnWrapper: ElementRef;
  @ViewChild('rightColumnWrapper', { static: false }) public set content(elementContent: ElementRef) {
    if (elementContent) { // initially setter gets called with undefined
      this.rightColumnWrapper = elementContent;
    }
  }

  @ViewChild(HistoryViewComponent) private readonly historyViewComponent: HistoryViewComponent;
  @ViewChild(DocumentRenderComponent) private readonly documentRendererComponent: DocumentRenderComponent;
  private readonly _trModule = 'gmsSnapinsCommon_PreviewMaster';
  private selectedDocumentsMap: Map<string, MultipleHistoryRowSelectionMapData> = new Map<string, MultipleHistoryRowSelectionMapData>(); 
  private selectedDocumentsisParent: Map<string, boolean> = new Map<string, boolean>();
  private oneOfSelectedItemsClicked = false;
  private path: string = undefined;
  private systemId: number;
  private readonly activeClass = 'item-active';
  private resizeSubs?: Subscription;
  // Subscription variables
  private readonly subscriptions: Subscription[] = [];
  private subscription: Subscription;
  private singleDocLeftAfterUnselect = false;
  constructor(private readonly traceService: TraceService,
    private readonly sanitizer: DomSanitizer,
    private readonly element: ElementRef,
    private readonly resizeObserver: ResizeObserverService,
    private readonly siModal: SiActionDialogService,
    private readonly reportService: ReportViewerService,
    private readonly translateService: TranslateService,
    private readonly logViewerService: LogViewerServiceBase) { }

  public handleChildToParent(event): void {
    this.fileName = event;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes?.relatedItems?.currentValue?.length) {
      this.parameterMetaData = null;
    }
    if (changes?.selectedObject?.currentValue?.SystemId) {
      this.systemId = changes.selectedObject.currentValue?.SystemId;
      this.scrollRetainPosition = changes?.stateDataObject?.currentValue?.scrollPosition;
    }
  }

  public ngOnInit(): void {
    this.traceService.debug(this._trModule, 'Component initialization started.');
    this.systemId = this.selectedObject.SystemId;
    this.resizeSubs = this.resizeObserver
      .observe(this.element.nativeElement, 100, true, true)
      .subscribe(() => this.onResize());

    this.traceService.debug(this._trModule, 'Component initialized.');
    this.subscriptions.push(this.reportService.paramatersRelatedInfo.subscribe({
      next: (paramatersRelatedInfo: ParameterRelatedInfo) => {
        ({ parameterMetaData: this.parameterMetaData, selectedRule: this.selectedRule,
          parametersLoading: this.parameterLoading, ruleObjectId: this.ruleObjectId, rptdesign: this.rptDesign }
          = paramatersRelatedInfo);
        if (this.parameterLoading || this.parameterMetaData == null) {
          this.isParameterOpen = false;
        }
      }
    }));
    this.subscription = this.reportService.reportPreviewLoading.subscribe(res => {
      this.isLoading = res;
    });
  }

  public ngAfterViewChecked(): void {
    this.resizeSubs = this.resizeObserver
      .observe(this.element.nativeElement, 100, true, true)
      .subscribe(dim => {
        this.containerWidth = dim.width;
        this.onResize();
        this.resizeSubs.unsubscribe();
      });
  }

  public ngOnDestroy(): void {
    // this.saveScrollState();
    // this.saveStorage();
    // this.storeObjectEmitter.emit(this.storeObject);
    this.resizeSubs.unsubscribe();
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscription?.unsubscribe();
  }

  @HostListener('window:keydown', ['$event'])
  public keydownEvent(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      this.multipleSelectionActive = true;
      this.keydownEventFormultipleHistoryRowSelectionEmitter.emit(this.multipleSelectionActive);
    }
  }

  @HostListener('window:keyup', ['$event'])
  public keyupEvent(event: KeyboardEvent): void {
    this.multipleSelectionActive = false;
  }

  @HostListener('click', ['$event'])
  public click(event: Event): void {
    const target = event.target as HTMLElement;
    if (
      isNullOrUndefined(target.closest('.history-container tbody')) &&
      !isNullOrUndefined(target.closest('.left-column-wrapper')) &&
      isNullOrUndefined(target.closest('button.dropdown-toggle'))
    ) {
      const multipleItemSelected =
        this.selectedDocumentsMap.size > 1 ||
        (this.selectedDocumentsMap.size === 1 && this.selectedDocumentsMap.values().next().value.length > 1);
      // .values().next().value => values of first element of map
      if (multipleItemSelected) {
        this.selectedDocumentsMap.clear();
        this.selectedDocuments = [];
        this.setActive(undefined, undefined, undefined);
        this.showReport(undefined, false);
      }

    }
  }

  public onMouseEnter(event: any): void {
    if (!event.target.classList.contains(this.activeClass)) {
      const dropdownItem = event.target.querySelector('a.dropdown-item');
      if (dropdownItem) {
        // dropdownItem.style.backgroundColor = '#f0f2f5';
      } else {
        dropdownItem.style.backgroundColor = '';
      }
    }
  }

  public onMouseLeave(event: any): void {
    if (!event.target.classList.contains(this.activeClass)) {
      const dropdownItem = event.target.querySelector('a.dropdown-item');
      if (dropdownItem) {
        // dropdownItem.style.backgroundColor = '#fff';
      } else {
        dropdownItem.style.backgroundColor = '';
      }
    }
  }

  public onExpandRow(index: number): void {
    this.historyViewComponent.onExpandRow(index);
  }

  public expandRowEvent(indexes: number[]): void {
    this.expandRowEventData.emit(indexes);
  }

  public showReport(documentData: ReportDocumentData, isManualSelection: boolean = false): Observable<void> {
    if (!this.multipleSelectionActive) {
      this.isPreviewed = isManualSelection;
      if (documentData === undefined) {
        this.docName = null;
      } else {
        this.docName = documentData.DocumentDisplayName;
      }

      if (this.lastShownDocumentData !== documentData) {
        return this.getReportFromWSI(documentData, false);
      } else {
        this.showHidePreview();
      }
    } else {
      if (this.selectedDocuments.length === 0) {
        this.isEmpty = true;
        this.lastShownDocumentData = undefined;
        this.docName = undefined;
      } else if (this.selectedDocuments.length === 1) {
        // find single selected report document data
        const reportExec = this.reportHistoryData?.find(data => data.ReportDocumentData.some(doc => doc.DocumentDisplayName === this.selectedDocuments[0]));
        const docData = reportExec?.ReportDocumentData.find(data => data.DocumentDisplayName === this.selectedDocuments[0]);
        return this.getReportFromWSI(docData, true);
      }
    }
  }

  // setActiveMultiple this function is only for the multiple row selection in the report snapin
  public setActiveMultiple(execId: string, displayName: string, fullId: FullSnapInId, isParent: boolean): void {
    const reportExecMultiple = this.reportHistoryData?.find(exec => exec.ReportExecutionId === execId);
    if (this.stateDataObject.scrollPosition !== undefined) {
      this.historyViewComponent.historyPanel.nativeElement.scrollTop = this.stateDataObject.scrollPosition;
    }
    if (this.stateDataObject?.multipleHistoryRowSelectionMap?.size > 0) {
      for (const [key, value] of this.stateDataObject.multipleHistoryRowSelectionMap.entries()) {
        const execIdOfSelectedDocument = this.stateDataObject.multipleHistoryRowSelectionMap.get(execId);
        if (isParent && execIdOfSelectedDocument.selectedChildNames.length == 0) {
          const rowId = fullId.fullId() + execId + value.parentName;
          if (rowId) {
            const rowEl = document.getElementById(rowId);
            if (rowEl) {
              this.applyActiveStyle(rowEl);
            }
          }
        } else if (isParent && execIdOfSelectedDocument.selectedChildNames.length >= 1) {
          const rowId = fullId.fullId() + execId + value.parentName;
          if (rowId) {
            const rowEl = document.getElementById(rowId);
            if (rowEl) {
              this.applyActiveStyle(rowEl);
            }
          }
          execIdOfSelectedDocument.selectedChildNames.forEach(data => {
            const rowId1 = fullId.fullId() + execId + data;
            if (rowId1) {
              const rowEl = document.getElementById(rowId1);
              if (rowEl) {
                this.applyActiveStyle(rowEl);
              }
            }
          });
        } else {
          if (execIdOfSelectedDocument.selectedChildNames.length >= 1) {
            execIdOfSelectedDocument.selectedChildNames.forEach(data => {
              const rowId1 = fullId.fullId() + execId + data;
              if (rowId1) {
                const rowEl = document.getElementById(rowId1);
                if (rowEl) {
                  this.applyActiveStyle(rowEl);
                }
              }
            });
          }
        }
      }
    }
  }

  public selectSingleDocAfterUnselection(): void {
    this.singleDocLeftAfterUnselect = false;
    // If only single document is being selected, then show that report.
    if (this.selectedDocumentsMap.size === 1) {
      const [key, value] = this.selectedDocumentsMap.entries().next().value;
      const report = this.reportHistoryData?.find(exec => exec.ReportExecutionId === key);
      let doc = null;
      // If we have only one child selected, then show that document.
      if (value?.selectedChildNames?.length === 1) {
        doc = report?.ReportDocumentData?.find(data => data.DocumentDisplayName === value.selectedChildNames[0]);
      } else {
        doc = report.ReportDocumentData[0];
      }
      if (doc) {
        if (this.stateDataObject?.multipleHistoryRowSelectionMap?.size > 1) {
          for (const mapKey of this.stateDataObject.multipleHistoryRowSelectionMap.keys()) {
            if (mapKey !== key) {
              this.stateDataObject.multipleHistoryRowSelectionMap.delete(mapKey); // Delete all keys except the one to keep
            }
          }
        }
        this.singleDocLeftAfterUnselect = true;
        this.multipleSelectionActive = false;
        this.showReport(doc, true);
      }    
    }
  }

  public setActive(execId: string, displayName: string, isParent: boolean): void {
    this.isParent = isParent;
    const listElements = this.getElementById(this.originSnapInId)?.getElementsByClassName('history-row');
    if (this.stateDataObject.scrollPosition !== undefined) {
      this.historyViewComponent.historyPanel.nativeElement.scrollTop = this.stateDataObject.scrollPosition;
    }
    const elArray = listElements ? Array.from(listElements) : [];
    if (!isNullOrUndefined(execId) && !isNullOrUndefined(displayName)) {
      const reportExec = this.reportHistoryData?.find(exec => exec.ReportExecutionId === execId);
      const rowId = this.originSnapInId + execId + displayName;
      if (this.multipleSelectionActive) {
        if (this.stateDataObject.multipleHistoryRowSelectionMap?.size > 0 && this.selectedDocumentsMap.size === 0) {
          for (const [key, value] of this.stateDataObject.multipleHistoryRowSelectionMap.entries()) {
            this.selectedDocumentsMap.set(key, this.stateDataObject.multipleHistoryRowSelectionMap.get(key));
            this.selectedDocumentsisParent.set(key, value.isDocumentParent);
          }
        }
        this.selectedDocumentsisParent.set(execId, isParent);
       
        let index: number;
        // select all in case of clicking on parent with multiple selection active
        if (isParent) {
          const allChildrenSelected = !elArray?.filter(el => el.id.includes(execId)).some(el => !el.classList.contains(this.activeClass));
          if (!allChildrenSelected) { // select all on ctrl + parent click if not already selected
            elArray?.forEach(el => {
              if (el.id.includes(execId)) {
                this.applyActiveStyle(el);
              }
            });
            if (!this.selectedDocumentsMap.get(execId)) {
              this.selectedDocumentsMap.set(execId, {
                selectedChildNames: [] as string[],
                parentName: '',
                isDocumentParent: isParent
              });
            }
            
            const execData = this.selectedDocumentsMap.get(execId);
            // Always set isDocumentParent to true when parent is selected
            execData.isDocumentParent = true;
            execData.parentName = reportExec?.ReportExecutionDisplayName;
            reportExec.ReportDocumentData.forEach(childDoc => {
              if (!execData.selectedChildNames.includes(childDoc.DocumentDisplayName)) {
                execData.selectedChildNames.push(childDoc.DocumentDisplayName);
              }
            });
             
          } else { // deselect all on ctrl + parent click if already selected
            elArray?.forEach(el => {
              if (el.id.includes(execId)) {
                this.applyDeactiveStyle(el);
              }
            });
            this.selectedDocumentsMap.delete(execId);
            this.selectSingleDocAfterUnselection();
          }
        } else {
          const rowEl = document.getElementById(rowId);
          if (rowEl?.classList.contains(this.activeClass)) {
            this.applyDeactiveStyle(rowEl);
            index = this.selectedDocumentsMap.get(execId)?.selectedChildNames.indexOf(displayName);
            if (index > -1) {
              this.selectedDocumentsMap.get(execId)?.selectedChildNames.splice(index, 1);
              this.selectSingleDocAfterUnselection();
            }
          } else {
            this.applyActiveStyle(rowEl);
            if (isNullOrUndefined(this.selectedDocumentsMap.get(execId))) {
              this.selectedDocumentsMap.set(execId, {
                selectedChildNames: [] as string[],
                parentName: '',
                isDocumentParent: isParent
              });
            }
            if (!this.selectedDocumentsMap.get(execId).selectedChildNames.includes(displayName)) {
              this.selectedDocumentsMap.get(execId).selectedChildNames.push(displayName);
            }
          }
          // if there is no child selected, deselect also parent
          const allChildrenDeselected = !elArray?.filter(el => el.id.includes(execId) && el.id !== execId).some(el => el.classList.contains(this.activeClass));
          if (allChildrenDeselected) {
            const parentEl = document.getElementById(execId);
            // this is added for getting error in the console as parentEl is coming null
            if (parentEl) {
              this.applyDeactiveStyle(parentEl);
            }
            this.selectedDocumentsMap.delete(execId);
            this.selectSingleDocAfterUnselection();
          } else {
            //
          }
        }
      } else { // multiple selection not
        // if multiselection is not active, restart selectedDocumentsMap with only current document
        // so it can continue to fill array in case multiselection gets activated
        this.stateDataObject.multipleHistoryRowSelectionMap = new Map();
        this.selectedDocumentsisParent = new Map<string, boolean>();
        this.selectedDocumentsMap = new Map<string, MultipleHistoryRowSelectionMapData>();
        this.selectedDocumentsMap.set(execId, {
          selectedChildNames: [] as string[],
          parentName: '',
          isDocumentParent: isParent
        });
        elArray?.forEach(el => {
          this.applyDeactiveStyle(el);
        });
        const execData = this.selectedDocumentsMap.get(execId);
        if (isParent) {
          execData.parentName = reportExec?.ReportExecutionDisplayName;
        } else {
          if (!execData.selectedChildNames.includes(displayName)) {
            execData.selectedChildNames.push(displayName);
          }
        }
        if (!this.selectedDocumentsisParent.has(execId)) {
          this.selectedDocumentsisParent.set(execId, isParent);
        }
        if (rowId) {
          const rowEl = document.getElementById(rowId);
          if (!!rowEl) {
            this.applyActiveStyle(rowEl);
            this.backBtnText = reportExec?.ReportExecutionDisplayName;
            const rowdetail = rowEl?.innerText;
            if (rowdetail?.includes("xlsx")) {
              this.translateService.get('REPORT-VIEWER.EXCEL_FILE').subscribe(txt => {
                this.reportPreviewText = txt.toString();
              });
            }
          }
        }
      }
    } else { // if execId and displayName undefined, deactivate all rows
      elArray?.forEach(el => {
        this.applyDeactiveStyle(el);
      });
    }
    this.execId = execId;
    if (this.fromEvents) {
      const exec = this.reportHistoryData?.find(data => data.ReportExecutionId === this.execId);
      if (exec && exec.ReportDocumentData.length > 0) {
        this.reportHistoryData = [];
        this.reportHistoryData = [exec];
      }
    }
    this.displayName = displayName;
    this.selectedDocuments = [];
    if (this.selectedDocumentsMap?.size > 1) {
      for (const value of this.selectedDocumentsMap.values()) {
        value?.selectedChildNames?.forEach(val => {
          this.selectedDocuments.push(val);
        });
      }
    } else {
      this.selectedDocuments.push(displayName);
    }
    if (this.multipleSelectionActive) {
      this.updateMultipleHistoryRowSelectionMap(this.selectedDocumentsMap);
 
    }
  }

  public updateMultipleHistoryRowSelectionMap(selectiondocumentMap: Map<string, MultipleHistoryRowSelectionMapData>): void {

    this.stateDataObject.multipleHistoryRowSelectionMap = selectiondocumentMap;
    this.selectiondocumentMapEmitter.emit(this.stateDataObject.multipleHistoryRowSelectionMap);
  }

  public cancelReportExecution(systemId: number, reportExecutionId: string): void {
    this.reportService.cancelReportExecution(systemId, reportExecutionId, this.reportHistoryData);
  }

  public getElementById(id: string): Element {
    return document.getElementById(id);
  }

  public trackByReportExecutionId(index: number, reportHistoryData: ReportHistoryData): string {
    return reportHistoryData.ReportExecutionId;
  }

  public onResize(): void {
    this.traceService.debug(this._trModule, 'Resize detected');
    this.showHidePreview();
  }

  public handleStartExecutionCommand($event): void {
    this.fileType = $event === 0 ? 'Pdf' : $event === 1 ? 'Xlsx' : $event === 2 ? 'both' : undefined;
    if (this.relatedItems?.length) {
      this.fileUrl = undefined;
      this.isParameterOpen = true;
      this.showHidePreview();
    } else {
      this.startExecutionCommand.emit($event);
    }
  }

  public handleSaveClick(event): void {
    this.saveTreatmentFormEvent.emit(event);
  }

  public handleDownloadReportEvent(event): void {
    if (this.stateDataObject?.multipleHistoryRowSelectionMap.size > 0) {
      if (!this.stateDataObject?.multipleHistoryRowSelectionMap?.has(event?.execId)) {
        this.downloadReport(event.reportHistory, event.execId, event.documentDisplayName, event.isParent);
      } else {
        if (this.stateDataObject?.multipleHistoryRowSelectionMap?.has(event?.execId)) {
          const selectedDocumentData = this.stateDataObject.multipleHistoryRowSelectionMap.get(event.execId);
          // added the below lines so that when  event is triggered from the 
          // child document that is not included in the multiselected child list then below if condition will be executed   
          if (!event.isParent && !selectedDocumentData.selectedChildNames.includes(event.documentDisplayName)) {
            this.downloadReport(event.reportHistory, event.execId, event.documentDisplayName, event.isParent);
          } else {
            this.handleDownloadReportMultiDownloadButton();
          }
        }
      }
    } else {
      this.downloadReport(event.reportHistory, event.execId, event.documentDisplayName, event.isParent);
    }
  }

  public async handleDownloadReportMultiDownloadButton(): Promise<void> {

    const itemsToDownload = []
    const chunkSize = 10;
    if (this.stateDataObject.multipleHistoryRowSelectionMap.size > 0) {

      for (const [key, value] of this.stateDataObject.multipleHistoryRowSelectionMap.entries()) {
        const reportExecMultiple = this.reportHistoryData?.find(exec => exec.ReportExecutionId === key);
        const execIdOfSelectedDocument = this.stateDataObject.multipleHistoryRowSelectionMap.get(key);
        const isSelectedDocumentparent = execIdOfSelectedDocument?.isDocumentParent;
        if (isSelectedDocumentparent && value.selectedChildNames.length == 0) {

          reportExecMultiple.ReportDocumentData.forEach(docData => {

            itemsToDownload.push(docData);
          });

        } else {
          if (value.selectedChildNames.length >= 1) {
            value.selectedChildNames.forEach(data => {
              reportExecMultiple.ReportDocumentData.forEach(docData => {
                if (docData.DocumentDisplayName === data) {
                  itemsToDownload.push(docData);
                }
              });
            });

          }
        }

      }
    }

    for (let i = 0; i < itemsToDownload.length; i += chunkSize) {
      const chunk = itemsToDownload.slice(i, i + chunkSize);
      for (const doc of chunk) {
        await this.sleep(50).then(async () => {
          await this.reportService.getDocument(this.createDocumentData.SystemId, doc).then(url => {
            const urlObj = window.URL.createObjectURL(url.url);
            const anchor = document.createElement('a');
            anchor.download = url.path.slice(7, url.path.length);
            anchor.href = urlObj;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          });
        });
      }
    }
  }

  public handleShowHideReportEvent(): void {
    this.isPreviewed = false;
    this.isParameterOpen = false;
    this.showHidePreview();
  }
  public handleShowRelatedReportEvent(event: ContentActionArgs): void {
    this.showRelatedReport(this.reportHistoryData, event.execId, event.displayName, event.isParent);
  }

  public handleDeleteReportDocumentsEvent(event: ContentActionArgs): void {
    this.deleteReportDocuments(this.reportDefinitionId, event.execId, event.displayName, event.isParent);
  }
  public handleShowReportEvent(event: any): void {
    // When deselecting a document, if single doc is selected, then don't call showReport.
    // Since it will be called from isSingleDocSelected method.
    if (!this.singleDocLeftAfterUnselect) {
      this.showReport(event.documentData, event.isManualSelection);
    }
    const showReport: ShowReportHistory = {
      'documentData': event.documentData,
      'isManualSelection': event.isManualSelection
    };
    this.showReportEvent.emit(showReport);
    this.singleDocLeftAfterUnselect = false;
  }

  public handleSetActiveEvent(event: any): void {
    this.setActive(event.execId, event.displayName, event.isParent);
    const setActive: SetActiveReport = {
      'execId': event.execId,
      'displayName': event.displayName,
      'isParent': event.isParent
    };
    this.setActiveEvent.emit(setActive);
  }

  public handlePreviewDownloadReportEvent(): void {
    const itemsToDownload = [];
    if (this.stateDataObject?.multipleHistoryRowSelectionMap.size > 0) {
      for (const [key, value] of this.stateDataObject.multipleHistoryRowSelectionMap.entries()) {
        const historyDatainMultistate = this.findReportFromExecId(key);
        const reportExecMultiple = this.reportHistoryData?.find(exec => exec.ReportExecutionId === key);
        const execIdOfSelectedDocument = this.stateDataObject.multipleHistoryRowSelectionMap.get(key);
        const isSelectedDocumentparent = execIdOfSelectedDocument.isDocumentParent;

        if (isSelectedDocumentparent && value.selectedChildNames.length == 0) {
          reportExecMultiple.ReportDocumentData.forEach(docData => {

            itemsToDownload.push(docData);
          });
          itemsToDownload.forEach(item => {
            this.downloadReportFromPreviewToolbar(key, item.DocumentDisplayName);
          });
        } else {
          if (value.selectedChildNames.length >= 1) {
            value.selectedChildNames.forEach(data => {
              reportExecMultiple.ReportDocumentData.forEach(docData => {
                if (docData.DocumentDisplayName === data) {
                  itemsToDownload.push(docData);
                }
              });
            });
            itemsToDownload.forEach(item => {
              this.downloadReportFromPreviewToolbar(key, item.DocumentDisplayName);
            });

          }
        }
      }
    } else {
      for (const executionId of this.selectedDocumentsMap.keys()) {
        let downloadAllChildren
        if (this.selectedDocuments.length === 1 && this.isParent) {
          downloadAllChildren = true;
        }
        const historyData = this.findReportFromExecId(executionId);
        historyData.ReportDocumentData.forEach(docData => {
          if (downloadAllChildren || this.selectedDocuments.includes(docData.DocumentDisplayName)) {
            this.downloadReportFromPreviewToolbar(executionId, docData.DocumentDisplayName);
          }
        });
      }
    }
  }

  public downloadReportFromPreviewToolbar(execId: string, documentDisplayName: string): void {
    const execData = this.reportHistoryData?.find(data => data.ReportExecutionId === execId);
    const docData = execData?.ReportDocumentData.find(data => data.DocumentDisplayName === documentDisplayName);
    this.reportService.getDocument(this.createDocumentData.SystemId, docData).then(url => {
      const urlObj = window.URL?.createObjectURL(url.url);
      const anchor = document.createElement('a');
      anchor.download = url.path.slice(7, url.path.length);
      anchor.href = urlObj;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });
  }

  public trackByFn(index, item): string {
    return index + item.ItemDescriptor; // or item.id
  }

  private getReportFromWSI(docData: ReportDocumentData, isBackBtn: boolean): Observable<void> {
    // show single selected document
    return from(this.reportService.getDocument(this.createDocumentData.SystemId, docData).then(url => {
      if (url.type === 'file') {
        // this.error = false;
        this.isParameterOpen = false;
        const dotLength = url.path.split('.').length;
        if (url.type === 'file' && (url.path.split('.')[dotLength - 1]).toLowerCase() === 'pdf') {
          // this.spinner = false;
          this.path = url.path;
          this.stateDataObject.path = this.path;
          // Since the fileUrl is changing, the sourceUrl of the documentRendererComponent should be set to undefined.
          // This is to avoid the document renderer component from trying to load the previous file(sourceUrl).
          if (this.documentRendererComponent?.sourceUrl) {
            this.documentRendererComponent.sourceUrl = undefined;
          }
          this.fileUrl = url;
          this.newTabUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(url.url));
          this.pdf = true;
          this.isEmpty = false;
        } else {
          this.isEmpty = true;
          this.pdf = false;
          this.docName = docData.DocumentDisplayName;
          this.translateService.get('REPORT-VIEWER.FILE_FORMAT.XLSX').subscribe(txt => {
            if ((url.path.split('.')[dotLength - 1]).toLowerCase() === txt) {
              this.downloadAvailable = true;
            } else {
              this.downloadAvailable = (url.path.split('.')[dotLength - 1]).toLowerCase() === 'xlsx';
            }
          });
        }
      } else {
        // this.spinner = false;
        this.isEmpty = true;
      }
      this.lastShownDocumentData = docData;
      this.showHidePreview();
      if (isBackBtn) {
        if (this.executionIdMap?.get(this.selectedDocumentsMap.keys().next().value).get(this.selectedDocuments[0])) {
          this.backBtnText = this.executionIdMap.get(this.selectedDocumentsMap.keys().next().value).get(this.selectedDocuments[0]);
        } else {
          this.translateService.get('REPORT-VIEWER.EXCEL_FILE').subscribe(txt => {
            this.reportPreviewText = txt.toString();
          });
          this.backBtnText = docData?.DocumentDisplayName;
        }
      }
    }));
  }

  private showHidePreview(): void {
    const leftWrapper = this.leftColumnWrapper?.nativeElement;
    const rightWrapper = this.rightColumnWrapper?.nativeElement;
    const seperator = this.reportSeperator?.nativeElement;
    const hide = 'hide-sector';

    // This condition is for Assisted Treatment reports, as they do not include a history section.
    if (leftWrapper !== undefined) {
      if (this.element.nativeElement.offsetWidth < 1000) {
        if (this.isPreviewed || this.isParameterOpen) {
          this.responsiveParameter = true;
          if (!leftWrapper?.classList.contains(hide)) {
            leftWrapper.classList.toggle(hide);
          }
          if (rightWrapper?.classList.contains(hide)) {
            rightWrapper?.classList.toggle(hide);
          }
          if (rightWrapper) {
            rightWrapper.style.width = '100%';
          }
        } else {
          this.responsiveParameter = false;
          if (!rightWrapper?.classList.contains(hide)) {
            rightWrapper?.classList.toggle(hide);
          }
          if (leftWrapper?.classList.contains(hide)) {
            leftWrapper.classList.toggle(hide);
          }
          if (leftWrapper?.querySelector('.report-column-left')) {
            leftWrapper.querySelector('.report-column-left').style.width = '100%';
          }
        }
        if (!seperator?.classList.contains(hide)) {
          seperator.classList.toggle(hide);
        }
      } else {
        this.isPreviewed = false;
        this.responsiveParameter = false;
        if (leftWrapper?.classList.contains(hide)) {
          leftWrapper.classList.toggle(hide);
        }
        if (rightWrapper?.classList.contains(hide)) {
          rightWrapper.classList.toggle(hide);
        }
        if (rightWrapper) {
          rightWrapper.style.width = '80%';
        }
        if (seperator?.classList.contains(hide)) {
          seperator.classList.toggle(hide);
        }
      }
    }

    // todo: get rid of this manual trigger for window resize
    window.dispatchEvent(new Event('resize'));
  }

  private async downloadReport(reportHistory: ReportHistoryData[], execId: string, documentDisplayName: string, isParent: boolean): Promise<void> {
    const chunkSize = 10;
    const itemsToDownload = [];
    this.oneOfSelectedItemsClicked = false;
    // check for execId with parent download or displayName for child download
    if (
      isParent && !isNullOrUndefined(this.selectedDocumentsMap.get(execId)) ||
      !isParent && this.selectedDocuments.includes(documentDisplayName)) {
      this.oneOfSelectedItemsClicked = true;
    }

    if (this.oneOfSelectedItemsClicked) {
      for (const executionId of this.selectedDocumentsMap.keys()) {
        let downloadAllChildren;
        if (this.selectedDocuments.length === 1 && isParent) { // only single parent exec selected
          downloadAllChildren = true;
        }
        const historyData = this.findReportFromExecId(executionId);
        historyData.ReportDocumentData.forEach(docData => {
          if (downloadAllChildren || this.selectedDocuments.includes(docData.DocumentDisplayName)) {
            itemsToDownload.push(docData);
          }
        });
      }

      for (let i = 0; i < itemsToDownload.length; i += chunkSize) {
        const chunk = itemsToDownload.slice(i, i + chunkSize);
        for (const doc of chunk) {
          await this.sleep(50).then(async () => {
            await this.reportService.getDocument(this.createDocumentData.SystemId, doc).then(url => {
              const urlObj = window.URL.createObjectURL(url.url);
              const anchor = document.createElement('a');
              anchor.download = url.path.slice(7, url.path.length);
              anchor.href = urlObj;
              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
            });
          });
        }
      }
    } else {
      for (const historyData of reportHistory) {
        if (historyData?.ReportExecutionId === execId) {
          if (documentDisplayName === null || isParent === true) { // click on parent
            // multiple downloads
            for (let i = 0; i < historyData.ReportDocumentData.length; i += chunkSize) {
              const chunk = historyData.ReportDocumentData.slice(i, i + chunkSize);
              for (const doc of chunk) {
                await this.sleep(50).then(async () => {
                  await this.reportService.getDocument(this.createDocumentData.SystemId, doc).then(url => {
                    const urlObj = window.URL.createObjectURL(url.url);
                    const anchor = document.createElement('a');
                    anchor.download = url.path.slice(7, url.path.length);
                    anchor.href = urlObj;
                    document.body.appendChild(anchor);
                    anchor.click();
                    document.body.removeChild(anchor);
                  });
                });
              }
            }
          } else { // click on child
            const reportDoc = historyData.ReportDocumentData.find(doc => doc.DocumentDisplayName === documentDisplayName);
            await this.reportService.getDocument(this.createDocumentData.SystemId, reportDoc).then(url => {
              const urlObj = window.URL.createObjectURL(url.url);
              const anchor = document.createElement('a');
              anchor.download = url.path.slice(7, url.path.length);
              anchor.href = urlObj;
              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
            });
          }
        }
      }
    }
  }

  private sleep(ms): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private findReportFromExecId(execId: string): ReportHistoryData {
    const historyData = this.reportHistoryData?.find(data => data.ReportExecutionId === execId);
    return historyData;
  }

  private showRelatedReport(reportHistory: ReportHistoryData[], execId: string, documentDisplayName: string, isParent: boolean): void {
    for (const historyData of reportHistory) {
      if (historyData?.ReportExecutionId === execId) {
        if (documentDisplayName === null || isParent) { // click on parent
          this.showReport(historyData.ReportDocumentData[0], true);
        } else { // click on child
          const document = historyData.ReportDocumentData.find(doc => doc.DocumentDisplayName === documentDisplayName);
          this.showReport(document, true);
        }
        this.setActive(execId, documentDisplayName, isParent);
      }
    }
  }

  private deleteReportDocuments(reportId: string, execId: string, displayName: string, isParent: boolean): void {
    let deleteMessage = '';
    let multipleDocs = false;
    let showDialog = false;
    const reportExec = this.reportHistoryData?.find(data => data.ReportExecutionId === execId);
    this.isParent = isParent;
    this.oneOfSelectedItemsClicked = false;

    const isClickedParentActive =
      document.getElementById(this.originSnapInId + reportExec?.ReportExecutionId +
        reportExec?.ReportExecutionDisplayName).classList.contains(this.activeClass);

    // check for execId with parent delete (displayName='') or displayName for child delete
    this.oneOfSelectedItemsClicked = (!isNullOrUndefined(this.selectedDocumentsMap.get(execId)) && isClickedParentActive) ||
      this.selectedDocuments.includes(displayName);

    if (this.oneOfSelectedItemsClicked && this.selectedDocuments.length > 1) {
      this.selectedDocuments = [...new Set(this.selectedDocuments)];
      this.translateService.get('REPORT-VIEWER.DELETE.MESSAGE_SELECTED', { selectedReportsCount: this.selectedDocuments.length }).subscribe((res: string) => {
        if (res) {
          deleteMessage = res;
        }
      });
      multipleDocs = true;
      showDialog = true;
    } else {
      if (isParent && reportExec?.ReportDocumentData.length > 1) {
        const message = this.translateService.get('REPORT-VIEWER.DELETE.MESSAGE',
          { reportExecutionName: reportExec?.ReportExecutionDisplayName });
        const associatedMessage = this.translateService.get('REPORT-VIEWER.DELETE.ASSOCIATED_DOCUMENTS',
          { associatedDocumentsCount: reportExec?.ReportDocumentData.length });
        forkJoin([message, associatedMessage]).subscribe((res: string[]) => {
          deleteMessage = res[0].concat('\n', res[1]);
        });
        showDialog = true;
      }
    }

    if (showDialog) {
      forkJoin([this.translateService.get('REPORT-VIEWER.DELETE.DIALOG_HEADING'),
        this.translateService.get('REPORT-VIEWER.BTN.DELETE'),
        this.translateService.get('REPORT-VIEWER.BTN.CANCEL')])
        .subscribe(translation => {
          this.siModal.showDeleteConfirmationDialog(
            deleteMessage,
            translation[0],
            translation[1],
            translation[2])
            .subscribe(result => {
              switch (result) {
                case DeleteConfirmationDialogResult.Delete:
                  this.deleteDocument(reportId, execId, displayName, multipleDocs);
                  break;
                case DeleteConfirmationDialogResult.Cancel:
                  this.traceService.debug(this._trModule, 'Delete operation cancelled.');
                  break;
                default:
                  break;
              }
            });
        });
    } else {
      this.deleteDocument(reportId, execId, displayName);
    }
  }

  private deleteDocument(reportId: string, execId: string, displayName: string, isMultiDocs?: boolean): void {
    const reportExec = this.reportHistoryData?.find(data => data.ReportExecutionId === execId);
    this.deleteDocumentData.SystemId = this.selectedObject.SystemId;
    // after the removal of one document index of the row in the history section was not getting updated so
    // added the below code to get the latest list of documents
    if (!isMultiDocs && this.isParent && reportExec) {
      this.reportHistoryData = this.reportHistoryData.filter(data => data.ReportExecutionId !== execId);
      this.reporthistoryData.emit(this.reportHistoryData);
    }
    this.deleteDocumentData.DeleteFilters = [];
    if (isMultiDocs) { // multiple reports selected
      for (const entry of this.selectedDocumentsMap.entries()) {
        const deleteFilters = {
          /** WSI response is contradicting with camel case hence need to suspend this rule. */
          /* eslint-disable @typescript-eslint/naming-convention */
          ReportDefinitionId: reportId,
          ReportExecutionId: entry[0], // entry[0] => key
          DocumentList: entry[1] // entry[1] => values arr
          /* eslint-enable @typescript-eslint/naming-convention */
        };
        this.deleteDocumentData.DeleteFilters.push({
          ...deleteFilters,
          DocumentList: entry[1].selectedChildNames
        });
      
        this.deleteDocumentData.DeleteFilters.forEach(deletedObject => {
          if (this.isParent) {
            this.reportHistoryData = this.reportHistoryData.filter(data => data.ReportExecutionId !== deletedObject.ReportExecutionId);
            this.reporthistoryData.emit(this.reportHistoryData);
          } 
        });

      }
      if (this.reportHistoryData?.length > 0) {
        // after the deleted of 1 document 1st row should be selected for this added code
      
        this.setActive(this.reportHistoryData[0].ReportExecutionId, this.reportHistoryData[0].ReportExecutionDisplayName, true);
          
        this.showReport(this.reportHistoryData[0].ReportDocumentData[0], false)
      } else {
        this.setActive(undefined, undefined, undefined);
        this.showReport(undefined, false);
      }
    } else { // single report selected
      const documentsToDelete = [];
      if (this.isParent) { // click on parent => delete all children
        reportExec?.ReportDocumentData.forEach(doc => documentsToDelete.push(doc.DocumentDisplayName));
        if (!isNullOrUndefined(this.selectedDocumentsMap.get(execId))) { // show empty page after deleting selected execution
          if (this.reportHistoryData?.length > 0) {
            // after the deleted of 1 document 1st row should be selected for this added code
            this.setActive(this.reportHistoryData[0].ReportExecutionId, this.reportHistoryData[0].ReportExecutionDisplayName, true);
            this.showReport(this.reportHistoryData[0].ReportDocumentData[0], false)
          } else {
            this.setActive(undefined, undefined, undefined);
            this.showReport(undefined, false);
          }
        }
      } else { // click on child => delete single document
        const reportDocument = reportExec?.ReportDocumentData.find(doc => doc.DocumentDisplayName === displayName);
        documentsToDelete.push(reportDocument.DocumentDisplayName);
        if (
          !isNullOrUndefined(this.selectedDocumentsMap.get(execId)) &&
          this.selectedDocumentsMap.get(execId)?.selectedChildNames.includes(reportDocument.DocumentDisplayName)
        ) { // show empty page after deleting selected children entries
          if (this.reportHistoryData?.length > 0) {
            // after the deleted of 1 document 1st row should be selected for this added code
            this.setActive(this.reportHistoryData[0].ReportExecutionId, this.reportHistoryData[0].ReportExecutionDisplayName, true);
            this.showReport(this.reportHistoryData[0].ReportDocumentData[0], false)
          } else {
            this.setActive(undefined, undefined, undefined);
            this.showReport(undefined, false);
          }
        }
      }
      this.deleteDocumentData.DeleteFilters = [{
        /** WSI response is contradicting with camel case hence need to suspend this rule. */
        /* eslint-disable @typescript-eslint/naming-convention */
        ReportDefinitionId: reportId,
        ReportExecutionId: execId,
        DocumentList: documentsToDelete
        /* eslint-enable @typescript-eslint/naming-convention */
      }];
    }
    this.reportService.deleteReportDocuments(this.deleteDocumentData).subscribe(reportDeleteResult => {
      if (reportDeleteResult !== undefined && reportDeleteResult !== null) {
        const deletedReportObjects = reportDeleteResult.Response;
        deletedReportObjects.forEach(deletedObject => {
          const reportExecData = this.reportHistoryData?.find(data => data.ReportExecutionId === deletedObject.ReportExecutionId);
          deletedObject.Result.forEach(resultObject => {
            if (resultObject.IsDocumentDeleted) {
              const deletedDoc = reportExecData?.ReportDocumentData.find(data => data.DocumentDisplayName === resultObject.DocumentName);
              const index = reportExecData?.ReportDocumentData.indexOf(deletedDoc);
              reportExecData?.ReportDocumentData.splice(index, 1);
            }
          });
        });
        if (isMultiDocs) {
          this.selectedDocumentsMap.clear();
          this.selectedDocuments = [];
        }
      }
    });
  }

  private applyDeactiveStyle(element: Element): void {
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

  private applyActiveStyle(element: Element): void {
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
