import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AboutObjectServiceBase } from '../services/about-object.service.base';
import { ObjectItemIfc } from '../view-model/object-item';
import { MenuItem } from '@simpl/element-ng';
import { CdkMenu, CdkMenuBase, CdkMenuModule, CdkMenuTrigger, Menu } from '@angular/cdk/menu';
@Component({
  selector: 'gms-object-detail-view',
  templateUrl: './object-detail.component.html',
  styleUrl: './container.component.scss',
  standalone: false
})
export class ObjectInfoViewComponent implements AfterViewInit, OnDestroy {

  @Input() public objectRef: ObjectItemIfc;
  @Input() public labelTemplate: TemplateRef<any>;
  @Input() public allowBackNavigation: boolean;
  @Input() public allowPathNavigation: boolean;
  @Output() public readonly pathNavigation: EventEmitter<void> = new EventEmitter<void>();
  @Output() public readonly backNavigation: EventEmitter<void> = new EventEmitter<void>();

  public labelDescription: string;
  public labelName: string;
  public labelAlias: string;
  public labelInformation: string;
  public labelBelongsTo: string;
  public labelShowPath: string;
  public labelDesignation: string;
  public labelCopy: string;
  public items: MenuItem[];
  
  @ViewChild('detailContainer', { static: false, read: ElementRef }) private readonly detailContainer: ElementRef;
  @ViewChild('copyIcon', { static: false, read: ElementRef }) private readonly copyIcon: CdkMenuTrigger;
 
  constructor(
    aboutObjectService: AboutObjectServiceBase) {

    const ts: TranslateService = aboutObjectService.commonTranslateService;
    ts.get('OM-ABOUT-DESCRIPTION-LABEL').subscribe(s => this.labelDescription = s);
    ts.get('OM-ABOUT-NAME-LABEL').subscribe(s => this.labelName = s);
    ts.get('OM-ABOUT-ALIAS-LABEL').subscribe(s => this.labelAlias = s);
    ts.get('OM-ABOUT-INFORMATION-LABEL').subscribe(s => this.labelInformation = s);
    ts.get('OM-ABOUT-BELONGS-TO-LABEL').subscribe(s => this.labelBelongsTo = s);
    ts.get('OM-ABOUT-SHOW-PATH-LABEL').subscribe(s => this.labelShowPath = s);
    ts.get('OM-ABOUT-COPY-LABEL').subscribe(s => this.labelCopy = s);
    ts.get('OM-ABOUT-DESIGNATION-LABEL').subscribe(s => this.labelDesignation = s);
  }

  public ngAfterViewInit(): void {
    if (!(this.detailContainer?.nativeElement)) {
      return;
    }
    if (this.objectRef.restoreScrollPosDetail) {
      this.objectRef.restoreScrollPosDetail = false; // reset flag
      this.detailContainer.nativeElement.scrollTop = this.objectRef.lastScrollPosDetail;

    }
  }

  public ngOnDestroy(): void {
    if (!(this.detailContainer?.nativeElement)) {
      return;
    }
    // Save last scroll position of the object-details container in case we
    // want to restore it on re-creation of the component.
    this.objectRef.lastScrollPosDetail = this.detailContainer.nativeElement.scrollTop || 0;
  }

  public onBack(event: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.backNavigation.emit();
  }

  public onPath(event: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.pathNavigation.emit();
  }

  public onMenu(event: MouseEvent): void {
    this.items = [
      { title: this.labelCopy, isHeading: true },
      { title: '-' },
      { title: this.labelDescription, action: (): void => { navigator.clipboard.writeText(this.objectRef.description); } },
      { title: this.labelName, action: (): void => { navigator.clipboard.writeText(this.objectRef.name); } },
      { title: this.labelAlias, 
        disabled: (this.objectRef.alias == null) ? true : false, action: (): void => { navigator.clipboard.writeText(this.objectRef.alias); } },
      { title: this.labelDesignation, action: (): void => { navigator.clipboard.writeText(this.objectRef.designation); } }
    ];
    if (event) {
      event.stopPropagation();
    }
  }
}
