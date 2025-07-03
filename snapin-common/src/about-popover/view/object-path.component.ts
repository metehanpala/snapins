import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AboutObjectServiceBase } from '../services/about-object.service.base';
import { ObjectItemIfc } from '../view-model/object-item';

@Component({
  selector: 'gms-object-path-view',
  templateUrl: './object-path.component.html',
  styleUrl: './container.component.scss',
  standalone: false
})
export class ObjectPathViewComponent implements AfterViewInit, OnDestroy {

  @Input() public objectRef: ObjectItemIfc;
  @Input() public labelTemplate: TemplateRef<any>;
  @Output() public readonly pathItemSelected: EventEmitter<ObjectItemIfc> = new EventEmitter<ObjectItemIfc>();
  @Output() public readonly backNavigation: EventEmitter<void> = new EventEmitter<void>();

  public headerTitle: string;

  @ViewChild('pathContainer', { static: false, read: ElementRef }) private readonly pathContainer: ElementRef;
  public readonly trackByIndex = (index: number): number => index;

  public get isStartPathPosition(): boolean {
    if (!this.objectRef) {
      return true;
    }
    return this.objectRef.selectedPathPos === 0;
  }

  public get isEndPathPosition(): boolean {
    if (!this.objectRef) {
      return true;
    }
    return this.objectRef.selectedPathPos >= this.objectRef.pathCount - 1;
  }

  constructor(
    aboutObjectService: AboutObjectServiceBase) {

    const ts: TranslateService = aboutObjectService.commonTranslateService;
    ts.get('OM-ABOUT-PATH-TITLE').subscribe(s => this.headerTitle = s);
  }

  public ngAfterViewInit(): void {
    if (!(this.pathContainer?.nativeElement)) {
      return;
    }
    if (this.objectRef.restoreScrollPosPath) {
      this.objectRef.restoreScrollPosPath = false; // reset flag
      this.pathContainer.nativeElement.scrollTop = this.objectRef.lastScrollPosPath;
    }
  }

  public ngOnDestroy(): void {
    if (!(this.pathContainer?.nativeElement)) {
      return;
    }
    // Save last scroll position of the object-path container in case we
    // want to restore it on re-creation of the component.
    this.objectRef.lastScrollPosPath = this.pathContainer.nativeElement.scrollTop || 0;
  }

  public onBack(event: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.backNavigation.emit();
  }

  public onPreviousPath(event: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.objectRef.previousPath();
  }

  public onNextPath(event: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.objectRef.nextPath();
  }

  public onPathItemSelected(event: MouseEvent, item: ObjectItemIfc): void {
    if (event) {
      event.stopPropagation();
    }
    if (item && !item.isSourceObject) {
      this.pathItemSelected.emit(item);
    }
  }

}
