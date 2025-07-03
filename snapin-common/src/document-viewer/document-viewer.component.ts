import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit,
  Output, Pipe, PipeTransform, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ApplicationRight, AppRightsService, BrowserObject, DocumentServiceBase, MultiMonitorServiceBase, Operation } from '@gms-flex/services';
import { AppContextService, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { isNullOrUndefined } from '@siemens/ngx-datatable';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { EventsCommonServiceBase } from '../events/services/events-common.service.base';
import { DocumentViewerSnapinService } from './document-viewer-snapin.service';
import { ResolveExecutionResult, ResolveExecutionStatus } from '../events/event-data.model';
import { DeviceType, MobileNavigationService } from '@gms-flex/core';

@Pipe({
  name: 'safe',
  standalone: false
})
export class SafePipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) { }
  public transform(url): SafeUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'gms-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
  standalone: false
})

export class DocumentViewerComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('iframe', { static: false }) public iframe: ElementRef;

  @Input() public browserMsg: any = undefined;
  @Input() public snapInId = undefined;

  // input and ouputs for the OP step resolve execution
  @Input() public resolveObs: BehaviorSubject<boolean> = new BehaviorSubject(null);
  @Output() public readonly resolveExecutionResult: EventEmitter<ResolveExecutionResult> = new EventEmitter<ResolveExecutionResult>();

  public emptyTitleFileLabel = '';
  public notSupportedMessage = '';
  public newTabLabel = '';
  public fileUrl: any = undefined;
  public pdf = false;
  public tileView = false;
  public newTabUrl: SafeResourceUrl = undefined;
  public selectedObject: BrowserObject;
  public error = false;
  public loaded = false;
  public docuList: any = [];
  public appRights = true;
  public noAppRightsLabel = '';
  public noDocumentLabel = '';
  public isMobileDevice = false;
  public deviceInfo: DeviceType | null = null;
  private docuIndex = 0;
  private readonly _subscriptions: Subscription[] = [];
  private readonly _trModule = 'gmsSnapins_DocumentViewer';
  private appRightsDocument: ApplicationRight;
  private readonly documentSnapinId = 12;
  private readonly showAppRights = 384;

  public constructor(
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    private readonly traceService: TraceService,
    private readonly translateService: TranslateService,
    private readonly eventCommonService: EventsCommonServiceBase,
    private readonly documentService: DocumentServiceBase,
    private readonly sanitizer: DomSanitizer,
    private readonly documentSnapinService: DocumentViewerSnapinService,
    private readonly appContextService: AppContextService,
    private readonly multiMonitorService: MultiMonitorServiceBase,
    private readonly appRightsService: AppRightsService
  ) {
    this.translateService = eventCommonService.commonTranslateService;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.docuList = changes.browserMsg?.currentValue;

    if (this.docuList?.length > 0) {
      this.loadUrl(this.docuList[this.docuIndex]);
    } else {
      this.fileUrl = null;
    }
  }

  public ngOnInit(): void {
    this._subscriptions.push(
      this.appContextService.userCulture.subscribe((cult: string) => {
        if (cult != null) {
          this.translateService.use(cult).subscribe((res: any) => {
            this.traceService.info(this._trModule, 'Use user Culture');
            this.getTranslations();
          },
          (err: any) => {
            this._subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
              if (defaultCulture != null) {
                this.translateService.setDefaultLang(defaultCulture);
              } else {
                this.traceService.warn(this._trModule, 'No default Culture for appContextService');
                this.translateService.setDefaultLang(this.translateService.getBrowserLang());
              }
              this.getTranslations();
            }));
          });
        } else {
          this.traceService.warn(this._trModule, 'No user Culture for appContextService');
        }
      })
    );

    this.resolveObs.subscribe(res => {
      if (res === true) {
        // execute stuff on resolve button pressed, in case of the document viewer, nothing is done, and the execution is always a success
        // here you can also specify an error message to pass to the stepper on failure, it will show in a toast notification
        const resolveResult: ResolveExecutionResult = {
          status: ResolveExecutionStatus.Success
        }
        this.resolveExecutionResult.next(resolveResult);
      }
    })

    // Get device information
    this.deviceInfo = this.mobileNavigationService.getDeviceInfo();

    // If Android Device or iOS open the report in new tab as it is not yet supported by default PDF library
    this.isMobileDevice = this.deviceInfo === DeviceType.Iphone || this.deviceInfo === DeviceType.Ipad || this.deviceInfo === DeviceType.Android;

    this._subscriptions.push(
      this.getAppRights().subscribe(res => {
        this.appRights = res;
      })
    );
  }

  public ngOnDestroy(): void {
    this._subscriptions.forEach(sub => {
      if (!isNullOrUndefined(sub)) {
        sub.unsubscribe();
      }
    });
  }

  public onIframeLoaded(): void {
    // set iframe color always to black text on white bg
    if (!isNullOrUndefined(this.iframe)) {
      this.iframe.nativeElement.contentWindow.document.body.style.backgroundColor = 'white';
      this.iframe.nativeElement.contentWindow.document.body.style.color = 'black';
    }
  }

  public switchDocument(dir: number): void {
    if (dir === 0) {
      if (this.docuIndex > 0) {
        this.docuIndex--;
      } else {
        this.docuIndex = this.docuList.length - 1;
      }
    } else {
      if (this.docuIndex < this.docuList.length - 1) {
        this.docuIndex++;
      } else {
        this.docuIndex = 0;
      }
    }

    this.loadUrl(this.docuList[this.docuIndex]);
  }

  private getAppRights(): Observable<boolean> {
    this.appRightsDocument = this.appRightsService.getAppRights(this.documentSnapinId);
    if (this.appRightsDocument != null) {
      const showRightDocument: Operation[] = this.appRightsDocument.Operations.filter(f => f.Id === this.showAppRights);
      return (showRightDocument.length > 0) ? observableOf(true) : observableOf(false);
    } else {
      return observableOf(false);
    }
  }

  private getTranslations(): void {
    this._subscriptions.push(
      this.translateService.get([
        'DOCUMENT-VIEWER.NEW-TAB-BUTTON',
        'DOCUMENT-VIEWER.NEW-TAB-BUTTON-ELECTRON',
        'DOCUMENT-VIEWER.EMPTY-TITLE-FILE',
        'REPORT-VIEWER.WEBAPP-NOT-SUPPORTED',
        'DOCUMENT-VIEWER.NO-DOCUMENT'
      ]).subscribe(strings => {
        this.emptyTitleFileLabel = strings['DOCUMENT-VIEWER.EMPTY-TITLE-FILE'];
        this.notSupportedMessage = strings['REPORT-VIEWER.WEBAPP-NOT-SUPPORTED'];
        this.noDocumentLabel = strings['DOCUMENT-VIEWER.NO-DOCUMENT'];

        if (this.multiMonitorService.runsInElectron) {
          this.newTabLabel = strings['DOCUMENT-VIEWER.NEW-TAB-BUTTON-ELECTRON'];
        } else {
          this.newTabLabel = strings['DOCUMENT-VIEWER.NEW-TAB-BUTTON'];
        }
      })
    );

    this.eventCommonService.getNoRightsLabel().then(string => {
      this.noAppRightsLabel = string;
    });
  }

  private async loadUrl(message: any): Promise<void> {
    this.traceService.debug(this._trModule, 'Loading document...');
    this.fileUrl = undefined;
    this.error = false;

    await this.documentService.getUrl(message, message.Designation).then(url => {
      if (url.type === 'url') {
        if (this.documentSnapinService.findWhitelist(url.path) === false) {
          this.error = true;
        }
        let encodedURL = url.url;
        // encode URL parameters
        if (url.url.search(/\?/g) !== -1 && url.url.search(/&/g) !== -1) {
          const params = url.url.split('?')[1].split('&');
          const encodedParams = [];
          params.forEach(p => {
            encodedParams.push(p.split('=')[0] + '=' + encodeURIComponent(p.split('=')[1]));
          });
          encodedURL = url.url.split('?')[0] + '?' + encodedParams.join('&');
        }
        this.fileUrl = encodedURL;
        this.newTabUrl = url.url;
        this.pdf = false;
      } else if (url.type === 'file') {
        if ((url.path.split('.').pop() === 'rtf')) {
          this.fileUrl = URL.createObjectURL(url.url);
          this.error = true;
          this.pdf = false;
          this.newTabUrl = this.fileUrl;
        } else {
          this.error = false;

          if (url.type === 'file' && url.path.split('.').pop().toLowerCase() === 'pdf') {
            this.fileUrl = URL.createObjectURL(url.url);
            this.newTabUrl = URL.createObjectURL(url.url);
            this.pdf = true;

            // Android doesn't load PDFs on mobile
            const isAndroid: boolean = (/Android/i).test(navigator.userAgent);
            if (isAndroid) {
              this.error = true;
            }

          } else {
            const blob = new Response(url.url).text().then(r => {
              if (url.type === 'file' && url.path.split('.').pop() === 'txt') {
                this.fileUrl = URL.createObjectURL(new Blob(['\ufeff', r], { type: 'text/plain' }));
              } else if (url.type === 'file' && url.path.split('.').pop() === 'html') {
                this.fileUrl = URL.createObjectURL(new Blob(['\ufeff', r], { type: 'text/html' }));
              } else {
                this.fileUrl = URL.createObjectURL(url.url);
              }
              this.newTabUrl = this.fileUrl;
              this.pdf = false;
            });
          }
        }
      }
    });

    this.loaded = true;
  }
}
