import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { TraceService } from '@gms-flex/services-common';
import { TraceModules } from '../../shared/trace-modules';
import { TraceServiceDelegate } from '../../shared/trace-service-delegate';
import { AboutObjectServiceBase } from '../services/about-object.service.base';
import { ContextState, ObjectViewModelIfc, ViewState } from '../view-model/object-vm.base';
import { ObjectItemIfc } from '../view-model/object-item';

export interface LabelTemplateContext {
  objectRef: ObjectItemIfc;
  selectorEnabled: boolean;
}

@Component({
  selector: 'gms-about-object-container',
  templateUrl: './container.component.html',
  styleUrl: './container.component.scss',
  standalone: false
})
export class AboutObjectContainerComponent implements OnInit, OnDestroy {

  @Input() public vm: ObjectViewModelIfc;

  // Facilitates binding to enum values in HTML template
  public eContextState: typeof ContextState = ContextState;
  public eViewState: typeof ViewState = ViewState;

  private readonly traceSvc: TraceServiceDelegate;
  private readonly translateService: TranslateService;
  private destroyInd: Subject<void>;

  public get listViewEnabled(): boolean {
    return Boolean(this.vm && this.vm.contextState === ContextState.MultipleObjects);
  }

  constructor(
    private readonly cdRef: ChangeDetectorRef,
    traceService: TraceService,
    aboutObjectService: AboutObjectServiceBase) {

    this.traceSvc = new TraceServiceDelegate(traceService, TraceModules.aboutObject);
    this.translateService = aboutObjectService.commonTranslateService;
    this.destroyInd = new Subject<void>();
  }

  public ngOnInit(): void {
    this.vm.showDefaultView();
    this.vm.dataChangedUndetected
      .pipe(
        debounceTime(100),
        takeUntil(this.destroyInd))
      .subscribe(() => {
        this.cdRef.detectChanges();
      });
    this.vm.contextChanged
      .pipe(
        takeUntil(this.destroyInd))
      .subscribe(() => {
        this.vm.showDefaultView();
      });
  }

  public ngOnDestroy(): void {
    this.destroyInd.next();
    this.destroyInd.complete();
    this.destroyInd = undefined;
  }

  public onListItemSelected(item: ObjectItemIfc): void {
    if (!this.vm) {
      return;
    }
    this.vm.showObject(item);
  }

  public onPathSelected(): void {
    if (!this.vm) {
      return;
    }
    this.vm.showPaths(true);
  }

  public onPathItemSelected(item: ObjectItemIfc): void {
    if (!this.vm) {
      return;
    }
    this.vm.showObjectAncestor(item);
  }

  public onDetailBackNavigation(): void {
    if (!this.vm) {
      return;
    }
    this.vm.showList();
  }

  public onPathBackNavigation(): void {
    if (!this.vm) {
      return;
    }
    this.vm.showObject();
  }

  public onAncestorDetailsBackNavigation(): void {
    if (!this.vm) {
      return;
    }
    this.vm.showPaths();
  }
}
