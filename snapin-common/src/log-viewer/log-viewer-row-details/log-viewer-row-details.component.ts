import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  BrowserObject, CnsHelperService, CnsLabel, CnsLabelEn, Control, DetailPane,
  FinalSection,
  HistLogColumnDescription, HistoryApiParams, HistoryLogKind, HistoryLogTable, LogViewerServiceBase, RowDetailsDescription,
  SearchOption, Section, SiIconMapperService,
  SystemBrowserServiceBase, TablesEx
} from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ResizeObserverService, SplitOrientation } from '@simpl/element-ng';
import { ILogViewerObj, PaneControls } from '../services/history-log-view.model';

import { Subscription } from 'rxjs';
import { HistoryLogService } from '../services/history-log.service';
import { TraceModules } from '../shared/trace-modules';
import { View } from '@gms-flex/controls';
import { FullSnapInId } from '@gms-flex/core';
import { Guid } from '../shared/guid';
import { map } from 'rxjs/operators';
import { EventsCommonServiceBase } from '../../events/services/events-common.service.base';
enum Columns {
  Column1,
  Column2
}
@Component({
  selector: 'gms-log-viewer-row-details',
  templateUrl: './log-viewer-row-details.component.html',
  styleUrl: './log-viewer-row-details.compoent.scss',
  standalone: false
})

export class LogViewerRowDetailsComponent implements OnInit, OnDestroy {

  @Input()
  public fromSnapin = false;
  @Input()
  public userLang = '';
  @Input()
  public actionResultBadges: ILogViewerObj = {};
  @Output()
  public readonly noData: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() public snapInId!: FullSnapInId;
  @Input() public systemId!: number;
  public split!: boolean;
  public paneControls: PaneControls = { noOfControls: 0, noOfSections: 0 };
  @Output()
  public readonly paneControlsOp: EventEmitter<PaneControls> = new EventEmitter<PaneControls>();
  public isObjInfoOpen = false;
  public whereIcon: string | undefined = '';
  public cnsLabel!: CnsLabel;
  public selectedBrowserObjects: BrowserObject[] = [];
  public investigateBrowserObjects: BrowserObject[] = [];
  public sourceName = '';
  public sourceDescriptor = '';
  public sourceDescriptorShow = false;
  public alerIdBasedToAlarm: any | null;
  public loader = false;
  public rowData!: any | null;
  public orientation: SplitOrientation = 'horizontal';
  public columnDecriptionMap!: Map<string, HistLogColumnDescription> | null;
  public activityAlertId = '';
  public snapshotId = '';
  public investigativeEventSourceName = '';
  public investigativeEventSourceDescription = '';
  public objInvestigativeEventSourceName = '';
  public objInvestigativeEventSourceDescription = '';
  public eventContextSection = false;
  public fromEventContext = false;
  // Activity Icons
  public icons: DetailPane = {};
  // Detail-Pane
  public detailPaneSectionsLocalized?: ILogViewerObj = {};
  public activitySectionsData?: DetailPane = {};
  public detailPaneControlsLocalized?: ILogViewerObj = {};
  public sectionsFinalized?: FinalSection[] = [];
  public activityIconClass?: string;
  public veryDetailPaneControls: Control[] = [];
  public isCollapsed = true;
  public showDetailsLabel = '';
  public hideDetailsLabel = '';
  public noDataMessage = '';
  public pleaseSelectRow = '';
  public srcObjectName = '';
  public srcObjectDescriptor = '';
  public srcObjectAlias = '';
  public alreadyAddedControlsDetailPane: string[] = [];
  public hiddenColumns: string[] = [];
  public dbColumns: HistLogColumnDescription[] = [];
  public hideLocation = false;
  public dataLoaded = false;
  public snapshotIdsForDiscard: string[] = [];
  private subscriptions: Subscription[] = [];
  private discardSnapshotSubscription!: Subscription;
  private getHistoryLogsSubscription!: Subscription;
  private readonly translateService: TranslateService;
  public readonly trackByIndex = (index: number): number => index;
  constructor(
    private readonly historyLogService: HistoryLogService,
    private readonly traceService: TraceService,
    eventCommonService: EventsCommonServiceBase,
    private readonly resizeObserverService: ResizeObserverService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly iconMapperService: SiIconMapperService,
    private readonly logViewerService: LogViewerServiceBase

  ) {
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnInit(): void {
    this.processData();
    this.traceService.debug('LogviewerRowDetailsComponent', `ngOnInit() end`);
  }
  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
    this.discardSnapshotSubscription?.unsubscribe();
    this.getHistoryLogsSubscription?.unsubscribe();
  }

  public resetData(): void {
    this.loader = false;
    this.eventContextSection = false;
    this.activityAlertId = '';
    this.snapshotId = '';
    this.investigativeEventSourceName = '';
    this.investigativeEventSourceDescription = '';
    this.objInvestigativeEventSourceName = '';
    this.objInvestigativeEventSourceDescription = '';
    this.alerIdBasedToAlarm = null;
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    });
    this.subscriptions = [];
    this.rowData = null;
    this.orientation = 'horizontal';
    this.columnDecriptionMap = null;
    this.icons = {};
    this.activityIconClass = '';
    this.detailPaneSectionsLocalized = {};
    this.activitySectionsData = {};
    this.detailPaneControlsLocalized = {};
    this.veryDetailPaneControls = [];
    this.sectionsFinalized = [];
    this.isCollapsed = true;
    this.processData();
  }

  public readRetainedData(): void {
    this.historyLogService.logViewDatahideShowVeryDetailPane.subscribe(isCollapsed => {
      this.isCollapsed = isCollapsed!;
    });
  }

  // --------------------------------------  Toggle Activity Details Section --------------------------------

  public hideShowVeryDetailPane(): void {
    if (this.isCollapsed) {
      this.isCollapsed = false;
    } else {
      this.isCollapsed = true;
    }
    this.historyLogService.logViewDatahideShowVeryDetailPane.next(this.isCollapsed);
  }

  // -------------------------------------- Process Data --------------------------------------------------

  public processData(): void {
    const messageKeys: string[] = [
      'Log_Viewer.DETAIL_PANE_SECTIONS',
      'Log_Viewer.DETAIL_PANE_CONTROLS',
      'Log_Viewer.QUALITY_ISSUE',
      'Log_Viewer.DISAPPEARED',
      'Log_Viewer.APPEARED',
      'Log_Viewer.VALUE',
      'Log_Viewer.SHOW_DETAILS',
      'Log_Viewer.HIDE_DETAILS',
      'Log_Viewer.TEXT_FOR_NO_DATA',
      'Log_Viewer.PLEASE_SELECT_ROW'
    ];
    this.subscriptions.push(this.translateService.get(messageKeys).subscribe(success => {
      if (success) {
        this.logViewerService.getActivityIconJson().subscribe(data => {
          this.icons = data as DetailPane;
          if (!!this.icons) {
            this.hiddenColumns = [];
            if (!!this.icons?.hiddenColumns && this.icons?.hiddenColumns.length > 0) {
              this.hiddenColumns = this.icons?.hiddenColumns;
            }
            this.detailPaneSectionsLocalized = success['Log_Viewer.DETAIL_PANE_SECTIONS'];
            this.detailPaneControlsLocalized = success['Log_Viewer.DETAIL_PANE_CONTROLS'];
            this.showDetailsLabel = success['Log_Viewer.SHOW_DETAILS'];
            this.hideDetailsLabel = success['Log_Viewer.HIDE_DETAILS'];
            this.noDataMessage = success['Log_Viewer.TEXT_FOR_NO_DATA'];
            this.pleaseSelectRow = success['Log_Viewer.PLEASE_SELECT_ROW'];
            this.processDetailPane();
            this.readRetainedData();
          }
        });
      }
    }));
  }

  // -------------------------------------- Process DetailPane --------------------------------------------------

  private processDetailPane(): void {
    // Get the column descriptions map from backend
    this.historyLogService.logViewerColumnDescriptionMap.subscribe(
      (cols: HistLogColumnDescription[]) => {
        this.dbColumns = cols;
        this.dbColumns.forEach(x => {
          if (x.IsHidden) {
            this.hiddenColumns.push(x.Name);
          }
        });
        this.historyLogService.logViewRowDetails.subscribe(
          (data: RowDetailsDescription | null) => {
            this.rowData = data?.logViewResult;
            if (!!this.rowData) {
              this.noData.emit(false);
              // if selected row is activity and selected row has different alert id than the olde row, then it means we need to new load data
              if (!!this.rowData?.AlertId && this.rowData?.RecordTypeId === '1' && this.activityAlertId !== this.rowData?.AlertId) {
                this.eventContextSection = false;
                this.loader = true;
                this.dataLoaded = false;
                this.activityAlertId = this.rowData?.AlertId;
                this.getHistoryLogsSubscription?.unsubscribe();
                this.discardSnapshotSubscription?.unsubscribe();
                const conditionFilter = `'Alert ID'="${this.rowData?.AlertId}"`;
                const snapshotId = Guid.newGuid();
                this.snapshotId = snapshotId;
                this.snapshotIdsForDiscard.push(snapshotId);
                const params: HistoryApiParams = {
                  systemId: this.systemId,
                  historyLogKind: HistoryLogKind.ActivityFeed,
                  conditionFilter,
                  snapshotId
                };
                this.getHistoryLogsSubscription = this.logViewerService.getHistoryLogs(params).subscribe((logData: HistoryLogTable) => {
                  // stop loader once we receive the data from server for event context and we dont need to wait for toher things/
                  // this will make sure we clear the loader always
                  this.loader = false;
                  if (!!logData) {
                    this.alerIdBasedToAlarm = logData?.Result?.find(x => x.RecordTypeId === '2' && x.EventStateId === '1');
                    if (!!this.alerIdBasedToAlarm) {
                      this.eventContextSection = true;
                    }
                    if (this.alerIdBasedToAlarm?.DefaultViewDesignation) {
                      this.systemBrowserService.searchNodes(this.systemId,
                        this.alerIdBasedToAlarm?.DefaultViewDesignation, undefined, SearchOption.designation)
                        .toPromise()
                        .then(page => {
                          if (page!.Nodes.length > 0) {
                            this.objInvestigativeEventSourceName = page!.Nodes[0].Name;
                            this.objInvestigativeEventSourceDescription = page!.Nodes[0].Descriptor;
                            this.investigateBrowserObjects = page!.Nodes.slice(0, 1);
                            this.dataLoaded = true;
                            this.buildDetailPane();
                          }
                        });
                    } else {
                      this.buildDetailPane();
                    }
                    const length = this.snapshotIdsForDiscard?.length;
                    if (length > 0) {
                      for (let i = 0; i < length; i++) {
                        this.discardSnapshotSubscription = this.logViewerService.discardSnapshot(this.systemId, HistoryLogKind.ActivityFeed,
                          this.snapshotIdsForDiscard[i])
                          .subscribe(val => {
                            if (i === length - 1) {
                              this.snapshotIdsForDiscard = [];
                              this.discardSnapshotSubscription?.unsubscribe();
                              this.getHistoryLogsSubscription?.unsubscribe();
                            }
                            this.snapshotId = '';
                          });
                      }
                    }
                  }
                },
                () => {
                  this.loader = false;
                });
              } else {
                // if selected row is event (2) or selected row is activity but selected row doesnt have alertId, then it means
                // activity is not part of corrective action so no need to show event context
                if (this.rowData?.RecordTypeId === '2' || (!this.rowData?.AlertId && this.rowData?.RecordTypeId === '1')) {
                  this.eventContextSection = false;
                  this.buildDetailPane();
                } else if (this.rowData?.RecordTypeId === '1' && this.activityAlertId === this.rowData?.AlertId) {
                  if (this.dataLoaded) {
                    // if selected row is activity and older alertid is same to new row alertId, then dont need to show event context section
                    this.loader = false;
                    this.eventContextSection = true;
                    this.buildDetailPane();
                  }
                }
              }
            } else {
              this.noData.emit(true);
            }
          });
      },
      error => {
        this.traceService.info(TraceModules.logViewer, `getHistoryLogColumnDescripton() returned Error = ${JSON.stringify(error)}}`);
      }
    );
  }
  // -------------------------------------------- Building Detail Pane --------------------------------------------

  private buildDetailPane(): void {
    this.sectionsFinalized = [];
    this.veryDetailPaneControls = [];
    this.fromEventContext = false;
    this.isCollapsed = true;
    this.paneControls.noOfSections = 0;
    this.paneControls.noOfControls = 0;

    // we have removed direct dependency on translation for ui show/hide
    // and make detial section rendering based on sections from activity json data
    this.activitySectionsData = this.icons?.sections;

    if (!!this.detailPaneSectionsLocalized && !!this.detailPaneControlsLocalized) {
      if (Object.keys(this.activitySectionsData).length > 0) {
        Object.keys(this.activitySectionsData).forEach(sec => {
          const section: FinalSection = {};
          section.column1 = [];
          section.column2 = [];
          section.sectionKey = sec;
          // Controls only for Activity
          if (this.rowData?.RecordTypeId === '1') {
            // From Action Activity
            const actionActivityIcons = this.icons?.actions?.activityIcons;
            if (!!actionActivityIcons) {
              const actionActivityIcon = actionActivityIcons![this.rowData?.ActionId];
              this.activityIconClass = actionActivityIcon?.icon;
              const activitySections = actionActivityIcon?.sections;
              if (!!activitySections) {
                const activitySec = activitySections![sec];
                if (!!activitySec) {
                  this.buildDetailPaneSection(activitySec, section);
                }
              }
            }
            // From Actions
            const actionSections = this.icons?.actions?.sections;
            if (!!actionSections) {
              const actionSec = actionSections![sec];
              if (!!actionSec) {
                this.buildDetailPaneSection(actionSec, section);
              }
            }
          } else if (this.rowData?.RecordTypeId === '2') {
            // From Event Activity
            const eventActivityIcons = this.icons?.events?.activityIcons;
            if (!!eventActivityIcons) {
              const eventActivityIcon = eventActivityIcons![this.rowData?.EventStateId];
              this.activityIconClass = eventActivityIcon?.icon;
              const eventActivitySections = eventActivityIcon?.sections;
              if (!!eventActivitySections) {
                const eventActivitySec = eventActivitySections![sec];
                if (!!eventActivitySec) {
                  this.buildDetailPaneSection(eventActivitySec, section);

                }
              }
            }
            // From Events
            const eventSections = this.icons?.events?.sections;
            if (!!eventSections) {
              const eventSec = eventSections![sec];
              if (!!eventSec) {
                this.buildDetailPaneSection(eventSec, section);
              }
            }
          }
          // Common Controls
          if (!!this.activitySectionsData) {
            const commonSec = this.activitySectionsData![sec];

            if (!!commonSec) {
              if (sec === 'user') {
                if (this.rowData?.ValProf !== 'Enabled' || this.rowData?.ValProf !== 'Supervised') {
                  // if translation found, use it as label. And if not found, then show the key mentioned in activity json file
                  section.sectionLabel = Object.keys(this.detailPaneSectionsLocalized).includes(sec) ?
                    this.detailPaneSectionsLocalized[sec] : sec; this.buildDetailPaneSection(commonSec, section);
                  this.sectionsFinalized?.push(section);
                }
              } else if (sec === 'validation') {
                if ((this.rowData?.ValProf === 'Enabled' || this.rowData?.ValProf === 'Supervised')
                  && this.rowData?.AuditFlag === 'Audit Trail' && this.rowData?.ActionId !== 1605) {
                  section.sectionLabel = Object.keys(this.detailPaneSectionsLocalized).includes(sec) ?
                    this.detailPaneSectionsLocalized[sec] : sec; this.buildDetailPaneSection(commonSec, section);
                  this.sectionsFinalized?.push(section);
                }
              } else if (sec === 'eventContext') {
                if (this.eventContextSection) {
                  section.sectionLabel = Object.keys(this.detailPaneSectionsLocalized).includes(sec) ?
                    this.detailPaneSectionsLocalized[sec] : sec; this.fromEventContext = true;
                  this.buildDetailPaneSection(commonSec, section);
                  this.sectionsFinalized?.push(section);
                }
              } else if (sec === 'attachment') {
                if (!!this.rowData?.Attachment) {
                  section.sectionLabel = Object.keys(this.detailPaneSectionsLocalized).includes(sec) ?
                    this.detailPaneSectionsLocalized[sec] : sec; this.buildDetailPaneSection(commonSec, section);
                  this.sectionsFinalized?.push(section);
                }
              } else if (sec === 'activityDetails') {
                section.sectionLabel = Object.keys(this.detailPaneSectionsLocalized).includes(sec) ?
                  this.detailPaneSectionsLocalized[sec] : sec; this.buildVeryDetailPaneSection(section);
                this.sectionsFinalized?.push(section);
                this.readRetainedData();
              } else {
                // this added as a fallback stratergy
                section.sectionLabel = Object.keys(this.detailPaneSectionsLocalized).includes(sec) ?
                  this.detailPaneSectionsLocalized[sec] : sec;
                this.buildDetailPaneSection(commonSec, section);
                this.sectionsFinalized?.push(section);
              }
            }
          }
        });
        if (this.rowData?.DefaultViewDesignation) {
          this.systemBrowserService.searchNodes(this.systemId, this.rowData?.DefaultViewDesignation, undefined, SearchOption.designation)
            .toPromise()
            .then(page => {
              if (page!.Nodes.length > 0) {
                this.srcObjectName = page!.Nodes[0].Name;
                this.srcObjectDescriptor = page!.Nodes[0].Descriptor;
                this.srcObjectAlias = page!.Nodes[0].Attributes.Alias;
                this.getObjectIcon(page!.Nodes[0].Attributes.TypeId);
                this.selectedBrowserObjects = page!.Nodes.slice(0, 1);
                this.subscriptions.push(this.cnsHelperService.activeCnsLabel.subscribe(view => {
                  this.cnsLabel = view;
                  this.getSrcObjectDescription();
                }));

              } else {
                this.traceService.error(TraceModules.logViewer, 'Object related to selected event not found!');
              }
            });
        }

      }
    }
    // this subscribtion is used to set the flag to true that  detail pane is loaded ,
    // in retain state , we will set retained scroll position for this detail pane if any
    this.historyLogService.detailPaneIsLoaded.next(true);
    this.sectionsFinalized.forEach(sec => {
      this.paneControls.noOfSections++;
      this.paneControls.noOfControls += sec.column1.length + sec.column2.length;
    });
    this.paneControlsOp.next(this.paneControls);
    this.subscriptions.push(this.historyLogService.splitDetailControls.subscribe((split: boolean) => {
      this.split = split;
    }));
  }

  // -------------------------------------- Building DetailPane Section --------------------------------------------------

  private buildDetailPaneSection(commonSec: Section, finalSection: FinalSection): void {
    const detailPaneControls = commonSec?.detailPaneControls;
    if (!!detailPaneControls) {
      if (!!detailPaneControls.column1) {
        this.buildDetailPaneControls(detailPaneControls?.column1, finalSection, Columns.Column1);
      }
      if (!!detailPaneControls.column2) {
        this.buildDetailPaneControls(detailPaneControls?.column2, finalSection, Columns.Column2);
      }
    }
  }

  // -------------------------------------- Building DetailPane Controls --------------------------------------------------

  private buildDetailPaneControls(columnControls: string[], finalSection: FinalSection, column: Columns): void {
    const controls = this.icons?.controls;
    if (!!controls) {
      if (columnControls.length > 0) {
        columnControls.forEach(con => {
          const control = this.icons?.controls![con];
          if (!!control) {
            control.label = this.detailPaneControlsLocalized![con];
            if (!!control?.columnName) {
              if (this.eventContextSection && this.fromEventContext) {
                if (control?.columnName === 'InvestigativeEventSourceName') {
                  this.objInvestigativeEventSourceName = this.alerIdBasedToAlarm?.Name;
                  this.objInvestigativeEventSourceDescription = this.alerIdBasedToAlarm?.Description;
                  this.rowData[control?.columnName] = this.objInvestigativeEventSourceName;
                } else if (control?.columnName === 'Error') {
                  control.extraCssClasses = 'error-control-wrap';
                } else if (this.alerIdBasedToAlarm?.[control?.columnName] && this.rowData) {
                  this.rowData[control?.columnName] = this.alerIdBasedToAlarm[control?.columnName];
                }
              } else if (control?.columnName === 'Error' || control?.columnName === 'Comment') {
                control.extraCssClasses = 'error-control-wrap';
              }
              if (!!this.rowData[control?.columnName]) {
                const nullCheck = !!(this.rowData[control?.columnName]).toString().replace(/\s/g, '');
                if (nullCheck) {
                  if (column === Columns.Column1) {
                    finalSection?.column1?.push(control);
                  } else if (column === Columns.Column2) {
                    finalSection?.column2?.push(control);
                  }
                }
              }
            }
            this.alreadyAddedControlsDetailPane.push(control.columnName!);
          }
        });
      }
    }
  }

  // -------------------------------------- Building VeryDetailPane Section --------------------------------------------------

  private buildVeryDetailPaneSection(sec: FinalSection): void {
    let veryDetailPaneColumns = Object.keys(this.rowData);
    if (this.eventContextSection && !veryDetailPaneColumns.includes('EventMessageText')) {
      veryDetailPaneColumns.push('EventMessageText');
    }
    veryDetailPaneColumns = veryDetailPaneColumns.sort();

    // Filter Hidden Columns
    this.filterControls(this.hiddenColumns, veryDetailPaneColumns);

    // Filter Already Added Columns
    this.filterControls(this.alreadyAddedControlsDetailPane, veryDetailPaneColumns);

    const controls = this.icons?.controls;
    if (!!controls) {
      if (!!veryDetailPaneColumns && veryDetailPaneColumns.length > 0) {
        const veryDetailPaneCount = veryDetailPaneColumns.length % 2 === 0 ? veryDetailPaneColumns.length - 1 : veryDetailPaneColumns.length;
        for (let index = 0; index < veryDetailPaneCount; index += 2) {
          let controlCol1: Control = {};
          let controlCol2: Control = {};
          let control1LocalizedKey = '';
          let control2LocalizedKey = '';
          for (const [key, con] of Object.entries(controls!)) {
            if (con.columnName === veryDetailPaneColumns[index]) {
              controlCol1 = con;
              control1LocalizedKey = key;
            }
            if (con.columnName === veryDetailPaneColumns[index + 1]) {
              controlCol2 = con;
              control2LocalizedKey = key;
            }
          }
          if (!!controlCol1 && !!controlCol1.columnName) {
            controlCol1.label = this.detailPaneControlsLocalized![control1LocalizedKey];
          } else {
            const dbControl = this.dbColumns.find(con => con.Name === veryDetailPaneColumns[index]);
            controlCol1.label = dbControl?.Descriptor;
            controlCol1.columnName = dbControl?.Name;
          }
          if (!!controlCol2 && !!controlCol2.columnName) {
            controlCol2.label = this.detailPaneControlsLocalized![control2LocalizedKey];
          } else {
            const dbControl = this.dbColumns.find(con => con.Name === veryDetailPaneColumns[index + 1]);
            controlCol2.label = dbControl?.Descriptor;
            controlCol2.columnName = dbControl?.Name;
          }
          this.buildVeryDetailPaneControls(controlCol1, sec, Columns.Column1);
          this.buildVeryDetailPaneControls(controlCol2, sec, Columns.Column2);
        }
      }
    }
  }
  // -------------------------------------- Filter Controls --------------------------------------------------

  private filterControls(filterControls: string[], controls: string[]): void {
    filterControls.forEach(col => {
      const controlIndex = controls.indexOf(col);
      if (controlIndex > -1) {
        controls.splice(controlIndex, 1);
      }
    });
  }

  // -------------------------------------- Bilding VeryDetailPane Controls --------------------------------------------------

  private buildVeryDetailPaneControls(control: Control, finalSection: FinalSection, column: Columns): void {
    control.veryDetailPane = true;
    // below condition is added to show the  ActionDetails column data without ellipsis.
    if (control.columnName === 'ActionDetails') {
      control.extraCssClasses = 'error-control-wrap';
    }
    if (!!control?.columnName) {
      if (this.eventContextSection && this.fromEventContext) {
        if (control?.columnName === 'EventMessageText') {
          this.rowData[control?.columnName] = this.alerIdBasedToAlarm?.EventMessageText;
        }
      }
      if (!!this.rowData[control?.columnName]) {
        const nullCheck = !!(this.rowData[control?.columnName]).toString().replace(/\s/g, '');
        if (nullCheck) {
          if (column === Columns.Column1) {
            finalSection?.column1?.push(control);
          } else if (column === Columns.Column2) {
            finalSection?.column2?.push(control);
          }
        }
      }
    }
  }

  private getLocation(rowData: any): void {
    this.hideLocation = false;
    if (rowData?.RecordTypeId === '1') {
      const activity = this.icons?.actions?.activityIcons![rowData?.ActionId];
      if (!!activity) {
        const locationColumnName = activity.locationColumnName;
        if (!!locationColumnName && locationColumnName !== 'DefaultViewLocation/DefaultViewDesignation') {
          this.sourceName = rowData[locationColumnName];
          this.sourceDescriptorShow = false;
        } else if (!locationColumnName) {
          this.hideLocation = true;
        }
      }
    } else if (rowData?.RecordTypeId === '2') {
      const activity = this.icons?.events?.activityIcons![rowData?.EventStateId];
      if (!!activity) {
        const locationColumnName = activity.locationColumnName;
        if (!!locationColumnName && locationColumnName !== 'DefaultViewLocation/DefaultViewDesignation') {
          this.sourceName = rowData[locationColumnName];
          this.sourceDescriptorShow = false;
        } else if (!locationColumnName) {
          this.hideLocation = true;
        }
      }
    }
  }

  private getSrcObjectDescription(): void {
    if (!!this.cnsLabel) {
      switch (this.cnsLabel.cnsLabel) {
        case CnsLabelEn.Description:
          this.sourceName = this.srcObjectDescriptor;
          this.sourceDescriptor = '';
          this.investigativeEventSourceName = this.objInvestigativeEventSourceDescription;
          this.investigativeEventSourceDescription = '';
          this.sourceDescriptorShow = false;
          break;
        case CnsLabelEn.Name:
          this.sourceName = this.srcObjectName;
          this.sourceDescriptor = '';
          this.investigativeEventSourceName = this.objInvestigativeEventSourceName;
          this.investigativeEventSourceDescription = '';
          this.sourceDescriptorShow = false;
          break;
        case CnsLabelEn.DescriptionAndName:
          this.sourceName = this.srcObjectDescriptor;
          this.sourceDescriptor = this.srcObjectName;
          this.investigativeEventSourceName = this.objInvestigativeEventSourceDescription;
          this.investigativeEventSourceDescription = this.objInvestigativeEventSourceName;
          this.sourceDescriptorShow = true;

          break;
        case CnsLabelEn.NameAndDescription:
          this.sourceName = this.srcObjectName;
          this.sourceDescriptor = this.srcObjectDescriptor;
          this.investigativeEventSourceName = this.objInvestigativeEventSourceName;
          this.investigativeEventSourceDescription = this.objInvestigativeEventSourceDescription;
          this.sourceDescriptorShow = true;

          break;
        case CnsLabelEn.DescriptionAndAlias:
          this.sourceName = this.srcObjectDescriptor;
          this.sourceDescriptor = '';
          this.investigativeEventSourceName = this.objInvestigativeEventSourceDescription;
          this.investigativeEventSourceDescription = '';
          this.sourceDescriptorShow = false;
          if (!!this.srcObjectAlias) {
            this.sourceDescriptor = this.srcObjectAlias;
            this.sourceDescriptorShow = true;
          }
          break;
        case CnsLabelEn.NameAndAlias:
          this.sourceName = this.srcObjectName;
          this.sourceDescriptorShow = false;
          this.sourceDescriptor = '';
          this.investigativeEventSourceName = this.objInvestigativeEventSourceName;
          this.investigativeEventSourceDescription = '';
          if (!!this.srcObjectAlias) {
            this.sourceDescriptor = this.srcObjectAlias;
            this.sourceDescriptorShow = true;
          }
          break;
        default:
          break;
      }
    }
  }

  private getObjectIcon(objectIconId: number): void {
    this.iconMapperService.getGlobalIcon(TablesEx.ObjectTypes, objectIconId).toPromise()
      .then(iconString => this.whereIcon = iconString);
  }
}
