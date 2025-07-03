/* eslint-disable no-restricted-syntax */
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHfwMessage, SnapInBase } from '@gms-flex/core';
import { LicenseOptionsService, LicenseProxyService } from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { LicencseOptions, LicenseWsi } from '@gms-flex/services/wsi-proxy-api/license/data.model';
import { TranslateService } from '@ngx-translate/core';
import { DatatableComponent, SelectionType, TableColumn } from '@siemens/ngx-datatable';
import { ResizeObserverService } from '@simpl/element-ng';
import { SiSearchBarComponent } from '@simpl/element-ng/search-bar';
import { Observable, of as observableOf, Subscription } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';

@Component({
  selector: 'gms-license-snapin',
  templateUrl: './license-snapin.component.html',
  styleUrl: './license-snapin.component.scss',
  standalone: false
})

export class LicenseSnapinComponent extends SnapInBase implements OnInit, OnDestroy {

  @ViewChild(DatatableComponent) public table?: DatatableComponent;
  // @ViewChild('table') public table: DatatableComponent;
  @ViewChild('licenseTabeleContainer', { static: true })
  public tableContainer: ElementRef;
  @ViewChild('statusCellTempl', { static: true }) statusCellTempl!: TemplateRef<any>;
  @Output() public readonly rowHeight: EventEmitter<number> = new EventEmitter<number>();
  @Output() public readonly minifiedState: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public readonly initialTableWidth: EventEmitter<any> = new EventEmitter<number>();
  @Output() public readonly tableResize: EventEmitter<any> = new EventEmitter<number>();
  public noLicense = ''; // "No License to display"
  public licenseFeature = ''; // "License Feature"
  public details = ''; // "Details"
  public description = ''; // "Description"
  public licenseInUse = ''; // "{{Available}} license in use"
  public outOfLicensesUsed = ''; // {{Value1}} used, {{Value2}} available
  public searchBarPlaceholder = ''; // "Search..."
  public inlineFilter = ''; // "Filter"
  public developerMode = ''; // "Developer Mode"
  public engineeringMode = ''; // "Engineering Mode"
  public normalMode = ''; // "License OK"
  public normalModeText = ''; // "Valid until {{date}}"
  public courtesyMode = ''; // "Courtesy Mode"
  public courtesyModeText = ''; // "{{nombre}} day remaining"
  public demoMode = ''; // "Demo Mode"
  public demoModeText = ''; // "{{numero}} min left"
  public sabotageMode = ''; // "Sabotage Mode"
  public sabotageModeText = ''; // "{{attempt}} attempts detected"

  public rows: any[] = [];
  public miniRows: any[] = [];
  public filteredRows: any[] = [];
  public filteredMiniRows: any[] = [];
  public columns!: TableColumn[];
  public miniColumns!: TableColumn[];
  public inlineSeverity = '';
  public inlineHeading = '';
  public inlineMessage = '';
  public inlineTranslation;
  public tableWidth: number;
  public selectionType = SelectionType.single;
  public minifiedTable = false;

  private userLang: string;
  private totalSeconds = 1500; // 25 minutes
  private totalDays = 15; // 15 days
  private intervalID: any;
  private readonly subscriptions: Subscription[] = [];

  public constructor(
    private readonly resizeObserver: ResizeObserverService,
    private readonly traceService: TraceService,
    private readonly appContextService: AppContextService,
    private readonly translateService: TranslateService,
    private readonly licenseOptionsServices: LicenseOptionsService,
    private readonly licenseProxyService: LicenseProxyService,
    private readonly changeDetectorerRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    messageBroker: IHfwMessage,
    activatedRoute: ActivatedRoute
  ) {
    super(messageBroker, activatedRoute);
  }
  public ngOnInit(): void {
    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture !== null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.traceService.warn(TraceModules.license, `No default Culture for appContextService: ${defaultCulture}`);
        this.translateService.setDefaultLang(this.userLang === undefined ? this.translateService.getBrowserLang() :
          this.userLang);
      }
    }));
    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture !== null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.license, `use user Culture: ${userCulture}`);
        });
      } else {
        this.traceService.warn(TraceModules.license, `No user Culture for appContextService: ${userCulture}`);
      }
      this.subscriptions.push(this.translateService.get([
        'LICENSE.NO-LICENSE',
        'LICENSE.LICENSE-FEATURE',
        'LICENSE.DETAILS',
        'LICENSE.DESCRIPTION',
        'LICENSE.LICENSE-IN-USE',
        'LICENSE.USED-AVAILABLE',
        'LICENSE.SEARCH-BAR-PLACEHOLDER',
        'LICENSE.DEVELOPER-MODE',
        'LICENSE.ENGINEERING-MODE',
        'LICENSE.NORMAL-MODE',
        'LICENSE.NORMAL-MODE-TEXT',
        'LICENSE.COURTESY-MODE',
        'LICENSE.COURTESY-MODE-TEXT',
        'LICENSE.DEMO-MODE',
        'LICENSE.DEMO-MODE-TEXT',
        'LICENSE.SABOTAGE-MODE',
        'LICENSE.SABOTAGE-MODE-TEXT'
      ]).subscribe(values => this.onTraslateStrings(values)));
      this.subscribeResizeObserver();      
    }));
    this.subscriptions.push(this.licenseProxyService.licenseNotification().subscribe(license => this.onLicenseNotification(license)));
  }

  public ngOnDestroy(): void {
    clearInterval(this.intervalID);
    clearInterval(this.intervalID);
    this.subscriptions.forEach((subscription: Subscription) => {
      if (!isNullOrUndefined(subscription)) {
        subscription.unsubscribe();
      }
    });
  }
  public setupData(): void {
    this.licenseOptionsServices.getLicenseOptionsRightsAll().subscribe(licenses => {
      const data = [];
      const miniData = [];
      licenses.forEach(license => {
        if (license.Remaining == '-1' || license.Remaining == 'Unlimited') {
        // {{Available}} used, {{Remaining}} available
          license.Remaining = 'Unlimited';
          if (license.Available == '-1') {
            license.Available = 'Unlimited';
          }
          data.push({
            description: license.Description,
            licenseFeature: license.Id,
            details: this.translateService.instant('LICENSE.USED-AVAILABLE', { Value1: license.Available, Value2: license.Remaining }),
            remaining: license.Remaining,
            required: license.Required
          });
          miniData.push({
            miniDescription: license.Description + '<br>' + license.Id + '<br>' + 
            this.translateService.instant('LICENSE.USED-AVAILABLE', { Value1: license.Available, Value2: license.Remaining }),
            remaining: license.Remaining,
            required: license.Required
          })
        } else if (license.Required > license.Available) {
          // {{Required}} used, {{Remaining}} available
          data.push({
            description: license.Description,
            licenseFeature: license.Id,
            details: this.translateService.instant('LICENSE.REQUIRED-AVAILABLE', { Value1: license.Required, Value2: license.Remaining }),
            remaining: license.Remaining,
            required: license.Required
          });
          miniData.push({
            miniDescription: license.Description + '<br>' + license.Id + '<br>' + 
            this.translateService.instant('LICENSE.REQUIRED-AVAILABLE', { Value1: license.Required, Value2: license.Remaining }),
            remaining: license.Remaining,
            required: license.Required
          })
        } else {
        // {{Available}} used, {{Available + Remaining}} available
          data.push({
            description: license.Description,
            licenseFeature: license.Id,
            details: this.translateService.instant('LICENSE.USED-AVAILABLE', { Value1: license.Available, Value2: license.Available + license.Remaining }),
            remaining: license.Remaining,
            required: license.Required
          });
          miniData.push({
            miniDescription: license.Description + '<br>' + license.Id + '<br>' + 
            this.translateService.instant('LICENSE.USED-AVAILABLE', { Value1: license.Available, Value2: license.Available + license.Remaining }),
            remaining: license.Remaining,
            required: license.Required
          })
        }
      });

      // data.sort((a, b) => a.description.localeCompare(b.description));
      // miniData.sort((a, b) => a.miniDescription.localeCompare(b.miniDescription));
      this.rows = data; 
      this.miniRows = miniData;
      this.filteredRows = data;
      this.filteredMiniRows = miniData;
    });
  }
  public resizeTable(): void {
    this.table.recalculate();
  }

  public getRowHeight(minifiedTable: boolean): number {
    const height = 50;

    if (minifiedTable) {
      this.rowHeight.emit(height);
      return 96;
    }

    this.rowHeight.emit(height);
    return height;
  }

  public searchChange(val: string): void {
    const value = val.toLowerCase();
    const filtRows = this.rows.filter((row: any) => {
      return Object.keys(row).some((key: string) => {
        const cellValue = row[key];
        return cellValue !== null && cellValue !== undefined && cellValue.toString().toLowerCase().includes(value);
      });
    });
    this.filteredRows = filtRows;

    const filtMiniRows = this.miniRows.filter((row: any) => {
      return Object.keys(row).some((key: string) => {
        const cellValue = row[key];
        return cellValue !== null && cellValue !== undefined && cellValue.toString().toLowerCase().includes(value);
      });
    });
    this.filteredMiniRows = filtMiniRows;
  }

  public getStatusIcon(remaining: any, required: any): string {
    if (remaining == 0 && remaining < required) {
      return 'warning';
    }
    // else if () {
    //   return 'danger';
    // }
    return undefined;
  }

  public detailsStatusColor = ({ row, column, value }): any => {
    if (column.prop === 'details') {
      if (row.remaining == 0 && row.remaining < row.required) {
        return 'warning-description';
      }
      // else if () {
      //   return 'danger-description';
      // }
      return undefined;
    }
  }
  public miniDetailsStatusColor = ({ row, column, value }): any => {
    if (column.prop === 'miniDescription') {
      if (row.remaining == 0 && row.remaining < row.required) {
        return 'warning-description';
      } 
      // else if () {
      //   return 'danger-description';
      // }
      return undefined;
    }
  }
  private onTraslateStrings(strings: Map<string, string>): void {
    this.noLicense = strings['LICENSE.NO-LICENSE'];
    this.licenseFeature = strings['LICENSE.LICENSE-FEATURE'];
    this.details = strings['LICENSE.DETAILS'];
    this.description = strings['LICENSE.DESCRIPTION'];
    this.searchBarPlaceholder = strings['LICENSE.SEARCH-BAR-PLACEHOLDER'];
    this.inlineFilter = strings['LICENSE.INLINE-FILTER'];    
    this.developerMode = strings['LICENSE.DEVELOPER-MODE'];
    this.engineeringMode = strings['LICENSE.ENGINEERING-MODE'];
    this.normalMode = strings['LICENSE.NORMAL-MODE'];
    this.normalModeText = strings['LICENSE.NORMAL-MODE-TEXT'];
    this.courtesyMode = strings['LICENSE.COURTESY-MODE'];
    // QUESTO
    this.courtesyModeText = strings['LICENSE.COURTESY-MODE-TEXT'];
    this.demoMode = strings['LICENSE.DEMO-MODE'];
    this.demoModeText = strings['LICENSE.DEMO-MODE-TEXT'];
    this.sabotageMode = strings['LICENSE.SABOTAGE-MODE'];
    this.sabotageModeText = strings['LICENSE.SABOTAGE-MODE-TEXT'];    
    this.userLang = this.translateService.getBrowserLang();
    this.initTableColumns();
    this.setupData();
    this.onInlineState(this.inlineTranslation);
  }

  private subscribeResizeObserver(): void {
    this.subscriptions.push(
      this.resizeObserver
        .observe(this.tableContainer.nativeElement, 100, true, true)
        .subscribe(() => this.onTableResize())
    );
  }

  private onTableResize(): void {
    
    const element: any = this.tableContainer.nativeElement;
    const minifiedTable = element.offsetWidth < 900 ? true : false;
    if (minifiedTable != this.minifiedTable) {
      this.minifiedState.emit(minifiedTable);
    }
    
    this.minifiedTable = minifiedTable;
    
    if (typeof this.tableWidth === 'undefined') {
      this.initialTableWidth.emit(element.offsetWidth);
    }
    this.tableWidth = element.offsetWidth;
    this.tableResize.emit(element.offsetWidth);

    if (this.table !== undefined) {
      this.table.bodyComponent.offsetY = 0;
    }
    this.table.recalculate();
  }

  private onInlineState(state: any): void {
    if (state != undefined || state != null) {
      if (state == 0) {
        // developer mode
        this.inlineSeverity = 'info';
        this.inlineHeading = this.developerMode;
        this.inlineMessage = ""
      } else if (state == 1) {
        // demo mode
        this.inlineSeverity = 'danger';
        this.inlineHeading = this.demoMode;
        this.inlineMessage = this.demoModeText;

        this.updateMinuteDisplay(state);
        this.intervalID = setInterval(() => {
          if (this.totalSeconds <= 0) {
            clearInterval(this.intervalID);
          } else {
            this.totalSeconds -= 60;
            this.updateMinuteDisplay(state);
          }
        }, 1000 * 60);
      } else if (state == 2) {
        // courtesy mode
        this.inlineSeverity = 'warning';
        this.inlineHeading = this.courtesyMode;
        this.inlineMessage = this.courtesyModeText;

        this.updateDayDisplay();
        this.intervalID = setInterval(() => {
          if (this.totalDays <= 0) {
            clearInterval(this.intervalID);
          } else {
            this.totalDays--;
            this.updateDayDisplay();
          }
        }, 1000 * 3600 * 24);
      } else if (state == 3) {
        // engineering mode
        this.inlineSeverity = 'info';
        this.inlineHeading = this.engineeringMode;
        this.inlineMessage = "";
        
        this.updateMinuteDisplay(state);
        this.intervalID = setInterval(() => {
          if (this.totalSeconds <= 0) {
            clearInterval(this.intervalID);
          } else {
            this.totalSeconds -= 60;
            this.updateMinuteDisplay(state);
          }
          
        }, 1000 * 60);
      } else {
        // normal mode
        this.inlineSeverity = 'info';
        this.inlineHeading = this.normalMode;
        this.inlineMessage = this.normalModeText;
      }
      // this.inlineSeverity = 'warning';
      //   this.inlineHeading = this.sabotageMode;
      //   this.inlineMessage = this.sabotageModeText;
    }
  }
  private onLicenseNotification(license: LicenseWsi): void {
    // 0 developer license
    // 1 demo mode
    // 2 courtesy
    // 3 engineering
    // 4 normal
    
    if (license.LicenseModeValue !== 0 && license.LicenseModeValue !== 4) {
      let start: number;

      if (license.ExpirationTime !== undefined && license.ExpirationTime !== 0) {
        const days: number = Math.floor(license.ExpirationTime / 86400);
        const hours: number = Math.floor((license.ExpirationTime - days * 86400) / 3600);
        const minutes: number = Math.floor((license.ExpirationTime - (days * 86400 + hours * 3600)) / 60);
        let time = '';
        if (days > 0) {
          time = days + ' days ';
        } else {
          time = hours + 'h ' + minutes + 'm';
        }
      }
    }
    // I use this variable to set the inline state after the translation happens
    this.inlineTranslation = license.LicenseModeValue;
    this.onInlineState(license.LicenseModeValue);
    // this.setupData();
  }

  private updateMinuteDisplay(state: number): void {
    const minutes = Math.floor(this.totalSeconds / 60);
    // const seconds = this.totalSeconds % 60;
    const formattedTime = `${minutes}`; // :${seconds < 10 ? '0' : ''}${seconds}
    if (state == 4) {
      this.inlineMessage = this.translateService.instant('LICENSE.DEMO-MODE-TEXT', { time: formattedTime });
    } else {
      this.inlineMessage = this.translateService.instant('LICENSE.ENGINEERING-MODE-TEXT', { time: formattedTime });
    }
  }

  private updateDayDisplay(): void {
    const day = this.totalDays;
    const formattedTime = `${day}`; 
    this.inlineMessage = this.translateService.instant('LICENSE.COURTESY-MODE-TEXT', { days: formattedTime });
  }

  private initTableColumns(): void {
    this.miniColumns = [
      {
        prop: 'miniDescription',
        name: this.description,
        width: 729,
        minWidth: 64,
        resizeable: false,
        canAutoResize: false,
        cellTemplate: this.statusCellTempl,
        checkboxable: true
      }
    ]

    this.columns = [      
      {
        prop: 'description',
        name: this.description,
        width: 329,
        minWidth: 64,
        resizeable: true,
        canAutoResize: false,
        cellTemplate: this.statusCellTempl,
        checkboxable: false
      },
      {
        prop: 'licenseFeature',
        name: this.licenseFeature,
        width: 249,
        minWidth: 64,
        resizeable: true,
        canAutoResize: false,
        cellTemplate: this.statusCellTempl,
        checkboxable: true
      },
      {
        prop: 'details',
        name: this.details,
        width: 246,
        minWidth: 64,
        resizeable: false,
        canAutoResize: false,
        cellTemplate: this.statusCellTempl,
        checkboxable: false
      }
    ];
    
  }
}
