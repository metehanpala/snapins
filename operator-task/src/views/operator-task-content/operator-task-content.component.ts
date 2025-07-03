import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { UnsavedDataDialogResult, UnsaveDialogService } from '@gms-flex/controls';
import { FullPaneId, FullQParamId, FullSnapInId, IHfwMessage, MobileNavigationService } from '@gms-flex/core';
import {
  BrowserObject,
  GmsMessageData,
  LogMessage,
  OperatorTaskTemplatesResponse,
  ValidationResultStatus
} from '@gms-flex/services';
import { isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ColumnMode, DatatableComponent, SelectionType, TableColumn } from '@siemens/ngx-datatable';
import {
  BOOTSTRAP_BREAKPOINTS,
  DeleteConfirmationDialogResult,
  MenuItem,
  ModalRef,
  ResizeObserverService,
  SiActionDialogService,
  SiModalService,
  ViewType
} from '@simpl/element-ng';
import { SI_DATATABLE_CONFIG } from '@simpl/element-ng/datatable'
import {
  asapScheduler,
  asyncScheduler,
  BehaviorSubject,
  map,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  tap
} from 'rxjs';
import { catchError } from 'rxjs/operators';

import { OperatorTaskModel } from '../../model/operator-task-model';
import { OperatorTaskSnapinDataService } from '../../services/operator-task-data.service';
import { TraceModules } from '../../shared';
import { OperatorTaskTranslations } from '../../shared/operator-task-translations';
import { Utility } from '../../shared/utility';
import { OperatorTaskAlertType, ToastNotificationState } from '../../types/operator-task-alert-type';
import { OperatorTaskCommandId } from '../../types/operator-task-command-names';
import { OperatorTaskErrorTypes } from '../../types/operator-task-error-types';
import { TaskSort, TaskSortDirection } from '../../types/operator-task-sort';
import { OperatorTaskStatuses } from '../../types/operator-task-status';
import { OperatorTaskUserActionType } from '../../types/operator-task-user-action-type';
import { TaskUserSettings } from '../../types/operator-task-user-settings';
import { RevertActionMode } from '../../types/revert-action-mode';
import { OperatorTaskListViewModel, TaskSelection, TaskViewMode } from '../../view-model/operator-task-list-vm';
import { OperatorTaskInfoComponent } from '../operator-task-info/operator-task-info.component';

@Component({
  selector: 'gms-operator-task-content',
  styleUrl: './operator-task-content.component.scss',
  templateUrl: './operator-task-content.component.html',
  standalone: false
})
export class OperatorTaskContentComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() public fullSnapinID: FullSnapInId = null;
  @Input() public fullQParamID: FullQParamId;
  @Input() public fullPaneID: FullPaneId;
  @Input() public saveEvent: Observable<void>;

  @Input() public set gmsMessageData(data: any) {
    this._gmsMessageData = data;
    this.traceMessageData();
    if (this.infoComponent) {
      this.initInfoComponent();
    }
  }

  public get gmsMessageData(): GmsMessageData {
    return this._gmsMessageData;
  }

  @ViewChild(DatatableComponent) public table?: DatatableComponent;
  @ViewChild('tableContainer') public tableContainer: ElementRef;
  @ViewChild('infoComponent') public infoComponent: OperatorTaskInfoComponent;
  @ViewChild('modalWarningTemplate', { static: true }) public modalWarningTemplate!: TemplateRef<any>;

  /**
   * si-master-detail-container
   */
  public showCompact = false;
  public containerMaxWidth: number | undefined;
  public largeLayoutBreakpoint = BOOTSTRAP_BREAKPOINTS.mdMinimum;
  public resizableParts = true;

  // Defect 2658758: Operator task - in iPhone view unable to save or customize new task
  // Initialize to false to show the tasklist in compact
  public detailsActive = false;
  public truncateHeading = true;
  public detailsHeading = '';
  public minMasterSize = 380;
  public minDetailSize = 460;
  public compactColumnWidth = 64;
  public compactRowHeight = 90;
  public compactHeaderHeight = 0;
  public masterContainerWidth: number = undefined;
  public contextColumnWidth = 50;
  public statusColumnWidth = 80;
  public taskNameColumnWidth = 250;
  public statusDetailsColumnWidth = 250;
  public ownerColumnWidth = 150;
  public comfortableTableFit = 800; // used for show compact
  public containerClass = '';
  public containerWidth: number;

  // always set the action bar to expanded since we only have a max of three
  // and they can all be primary actions
  public viewType: ViewType = 'expanded';
  /**
   * si-content-action-bar
   */
  public masterActions: MenuItem[];
  public addMenu: MenuItem;
  public editMenu: MenuItem;
  public saveMenu: MenuItem;
  public deleteMenu: MenuItem;
  public duplicateMenu: MenuItem;
  public detailActions: MenuItem[] = [];
  /**
   * Master data (table)
   */
  public cache: any = {};
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public ColumnMode = ColumnMode;
  public isLoading = 0;
  public pageSize = 50;
  public getTasks$ = of(this.getTasks());
  public updateTasks$: BehaviorSubject<string> = new BehaviorSubject<string>('updatetasks');
  public updateSort$: BehaviorSubject<string> = new BehaviorSubject<string>('updateSort');
  public taskSortConfig: TaskSort[] = [{ prop: 'status', dir: undefined }
    , { prop: 'name', dir: undefined }
    , { prop: 'statusDetails', dir: undefined }
    , { prop: 'createdBy', dir: undefined }];
  public getSortConfig$ = of(this.getSortConfig());
  public taskSorts$: Observable<TaskSort[]> = undefined;
  public rows$: Observable<OperatorTaskModel[]> = undefined;
  public selectedEntity: OperatorTaskModel;
  public selectedEntities: any[] = [];
  public selectionType = SelectionType.single;
  public tableConfig: any = SI_DATATABLE_CONFIG;
  public totalElements!: number;
  public isLarge = true;
  public columns!: TableColumn[];
  public emptyStateContent = '';
  public emptyHeading = '';
  public modalWarningTitle = '';
  public modalWarningMessage = '';
  public yesTitle = '';
  public cancel = '';
  public changeTimeText;
  public manualRevertNote;

  public get rows (): OperatorTaskModel[] {
    return this.taskListVm !== undefined ? this.taskListVm.tasks : []
  }

  /**
   * Detail data
   */
  public ownerTitle: string;
  public statusDetailsTitle: string;
  public statusIconTitle: string;
  public nameTitle: string;
  public addTitle: any | string;
  public duplicateTitle: any | string;
  public deleteTitle: any | string;
  public editTitle: any | string;
  public saveTitle: any | string;
  public taskViewType: TaskViewMode = TaskViewMode.NoSelection;
  public saveEventsSubject: Subject<void> = new Subject<void>();
  public taskListVm: OperatorTaskListViewModel;
  public isMobileView = false;

  public otSecondary = 'otl-comparison';
  public otFrame = 'otl';

  protected readonly isNullOrUndefined = isNullOrUndefined;
  protected readonly utility = Utility;
  private snapInTitle = '';
  private duplicateErrorTarget = '';
  private duplicateError = '';
  private readonly siModalSubscriptions: Subscription[] = [];
  private duplicateMessage = '';
  private deleteMessage1 = '';
  private deleteMessage2 = '';
  private taskSavedTitle = '';
  private taskSavedMsg = '';
  private changesSaved = '';

  private errorCommandValidation: string;
  private errorTargetNotPresent: string;

  private currentSortProperty: string = undefined;
  private currentDirection: string = undefined;
  private readonly subscriptions: Subscription[] = [];
  private formStatusChangesSubscription: Subscription;
  private readonly selectDebounceSubject = new Subject<any>();
  private errorFromWsi: string;
  private startCommandText = '';
  private taskDuplicatedHeading = ''
  private keepSource = '';
  private deleteSource = '';
  private manualRevertShort = '';
  private _gmsMessageData: GmsMessageData;

  public constructor(
    public readonly messageBroker: IHfwMessage,
    public readonly changeDetectorRef: ChangeDetectorRef,
    public readonly resizeObserverService: ResizeObserverService,
    public readonly settingsService: SettingsServiceBase,
    private readonly traceService: TraceService,
    private readonly dataService: OperatorTaskSnapinDataService,
    private readonly translateService: TranslateService,
    private readonly siModal: SiActionDialogService,
    private readonly siModalSvc: SiModalService,
    private readonly unsavedDataDialog: UnsaveDialogService,
    @Inject(MobileNavigationService) private readonly mobileNavigationService: MobileNavigationService,
    private readonly ngZone: NgZone
  ) {
  }

  public ngOnInit(): void {
    this.taskListVm = new OperatorTaskListViewModel(this.dataService, this.traceService);
    this.subscriptions.push(this.mobileNavigationService.mobileOnlyVisibility$.subscribe((isVisible: boolean) => {
      asyncScheduler.schedule(() => { this.isMobileView = isVisible; }, 10);
    }));

    this.subscriptions.push(this.dataService.translations.translationsChanged.subscribe(available => {
      if (available) {
        this.translateStrings();
      }
    }));

    this.ngZone.runOutsideAngular(() => {
      this.dataService.systemInfoReadSubject.subscribe({
        next: (isSystemRead => {
          if (isSystemRead) {
            if (this.isInfoComponentOnly()) {
              this.initInfoComponent();
            } else {
              this.taskListVm.sendReadTask().subscribe({
                next: (read => {
                  if (read) {
                    this.ngZone.run(() => {
                      this.initializeActionBar();
                      this.taskListVm.unsubscribeReadTask();
                      this.updateTasks$.next('hello');
                    });
                  }
                }),
                error: (err => {
                  this.traceService.warn(TraceModules.contentTrace, `readTaskAndTemplates() error= ${err}`);
                  this.taskListVm.unsubscribeReadTask();
                })
              });
            }
          }
        }),
        error: (err => {
          this.traceService.warn(TraceModules.contentTrace, `systemInfoReadSubject() error= ${err}`);
          this.taskListVm.unsubscribeReadTask();
        })
      });
    });
  }

  public ngAfterViewInit(): void {
    if (!this.isInfoComponentOnly()) {
      this.subscriptions.push(this.resizeObserverService.observe(this.tableContainer.nativeElement, 200, true, true).subscribe(() => this.onContainerResize()));

      this.subscriptions.push(this.settingsService.getSettings(this.fullSnapinID.snapInId)
        .subscribe(
          userSettings => {
            this.onGetSettings(decodeURIComponent(decodeURIComponent(userSettings)));
            const withLatestSort = this.updateSort$.asObservable();
            this.taskSorts$ = withLatestSort.pipe(map((sorts: any) => this.getSortConfig()));
            if (isNullOrUndefined(userSettings)) {
              this.masterContainerWidth = 45;
              this.showCompact = this.canShowCompact();
              this.subscriptions.push(this.settingsService.putSettings(this.fullSnapinID.snapInId, this.getCurrentSettingsToPut())
                .subscribe(
                  status => this.onPutSettings(status),
                  error => this.onPutSettingsError(error)
                ));
            }
          },
          err => this.onGetSettingsError(err)
        ));

      const withLatest = this.updateTasks$.asObservable();
      this.rows$ = withLatest.pipe(
        tap((update: string) => {
          this.totalElements = this.taskListVm.tasks.length;
        }),
        map((update: string) => this.getTasks()),
        tap((rows: OperatorTaskModel[]) => {
          asapScheduler.schedule(() => this.table.recalculate(), 0);

          if (this.selectedEntity) {
            // synchronize the selectedEntities to ensure on edit, the updated task is set. Use cases:
            // duplicate -> start -> edit - should update state of form
            // duplicate -> edit -> save - should retain edits
            const updatedRow = rows.find(row => row.id === this.selectedEntities[0].id);
            if (updatedRow !== undefined && updatedRow?.targetDpIds !== undefined) {
              const prev = this.selectedEntity;
              this.selectedEntities = [updatedRow];
              this.selectedEntity = updatedRow;
              this.table.selected = [updatedRow];

              this.traceService.info(TraceModules.contentTrace,
                `Updating selected entity from backend: \nPrevious=${prev.traceData()} \n\n Updated= ${this.selectedEntity.traceData()} `);
            }
          }
        })
      );

      // gets called from  `onTaskChangeNotification()
      this.taskListVm.tasks$.subscribe(rows => {
        this.updateTasks$.next('taskListVm.tasks$');
      });

      this.selectDebounceSubject.subscribe(event => {
        asyncScheduler.schedule(() => {
          if (event) {
            this.selectedEntities = [...event];
            this.selectedEntity = this.selectedEntities[0];
            this.unsubscribeFormStatusChanges('datatableOnSelect');
            this.updateState(this.selectedEntity, TaskViewMode.View);
          }
        }
        );
      });

      this.taskListVm.subscribeTaskChangeNotification();
    }
  }

  public ngOnDestroy(): void {
    this.dataService.HasChanges = false;
    this.dataService.HasValidationErrors = false;
    this.taskListVm.unsubscribeTaskChangeNotification();

    if (this.updateTasks$ !== undefined) {
      this.updateTasks$.unsubscribe();
    }

    if (this.updateSort$ !== undefined) {
      this.updateSort$.unsubscribe();
    }

    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        subscription.unsubscribe();
      }
    });

    const settings: string = this.getCurrentSettingsToPut();
    if (!(isNullOrUndefined(settings))) {
      this.settingsService.putSettings(this.fullSnapinID.snapInId, settings).subscribe(
        val => this.onPutSettings(val),
        err => this.onPutSettingsError(err)
      );
    }

    this.siModalSubscriptions.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        subscription.unsubscribe();
      }
    });
    this.unsubscribeFormStatusChanges('ngOnDestroy');
    this.selectDebounceSubject?.unsubscribe();
  }

  // PCR - 2604352: This helps ngxdatatable to track the selected row
  public rowIdentity(row: any): any {
    return row?.id;
  }

  public onNotify(): void {
    this.initializeActionBar();
  }

  public onSplitterPositionChange(masterContainerWidthChange: number): void {
    this.masterContainerWidth = masterContainerWidthChange;
    this.table.recalculate();
    asapScheduler.schedule(() => this.checkUpdateCompact(), 0);
  }

  public checkUpdateCompact(): void {
    this.showCompact = this.canShowCompact();
  }

  public onSort(event: any): void {
    if (event === undefined || event.sorts.length === 0) {
      return;
    }

    const sortProperty: string = event.column.prop;
    const sortDirection: string = event.newValue;

    this.taskSortConfig.forEach(element => {
      if (element.prop !== sortProperty) {
        element.dir = undefined;
      } else {
        element.dir = sortDirection;
      }
    });

    this.currentDirection = sortDirection;
    this.currentSortProperty = sortProperty;

    this.updateSort$.next(sortDirection);
    this.updateTasks$.next(sortDirection);
  }

  public datatableOnSelect(event: any): void {
    if (event === undefined || event.selected.length === 0) {
      return;
    }

    if (this.isSame(event.selected, [this.selectedEntity])) {
      // When creating a task, ensure that a user can navigate between list and info on small screen
      this.detailsActive = true;
      return;
    }

    if (this.selectedEntity === undefined) {
      this.selectDebounceSubject.next(event.selected);
      return;
    }

    if (this.dataService.HasChanges === true || this.dataService.HasValidationErrors
      || this.selectedEntity.HasTargetChanges || this.selectedEntity.HasTargetErrors) {
      const subscription = this.showUnsavedDataDialog(this.selectedEntity).subscribe(value => {
        if (value === true) { // save or discard
          this.dataService.HasChanges = false;
          this.dataService.HasValidationErrors = false;
          this.selectedEntity.resetChangeAndErrorFlags();
          this.selectDebounceSubject.next(event.selected);
        }
        subscription.unsubscribe();
      });
    } else {
      this.selectDebounceSubject.next(event.selected);
    }
  }

  public showUnsavedDataDialog(task?: OperatorTaskModel): Observable<boolean> {
    const observable: Observable<boolean> = new Observable(observer => {
      this.subscriptions.push(this.unsavedDataDialog.showDialog(this.snapInTitle).subscribe((res: UnsavedDataDialogResult) => {
        switch (res) {
          case UnsavedDataDialogResult.Yes:
            this.unsavedDataDialog.closeDialog();
            if (this.dataService.HasValidationErrors === true || task.HasTargetErrors === true) {
              // force stay back
              const ref: ModalRef<any> = this.infoComponent.showSaveTaskWarning();
              const subscription = ref.hidden.subscribe(() => {
                // retain selection
                this.table.selected = [task];
                subscription.unsubscribe();
                observer.next(false);
                observer.complete();
              });
            } else {
              // save the task before leave
              this.onSave(task).subscribe({
                complete: () => {
                  observer.next(true);
                  observer.complete();
                }
              });
            }
            break;
          case UnsavedDataDialogResult.No:
            if (task.isNew === true) {
              // discard the new task
              this.discardDeleteTask(task).subscribe({
                complete: () => {
                  observer.next(true);
                  observer.complete();
                }
              })
            } else {
              observer.next(true);
              observer.complete();
            }
            break;
          case UnsavedDataDialogResult.Cancel:
          default:
            // retain selection
            this.table.selected = [this.selectedEntity];
            observer.next(false);
            observer.complete();
            break;
        }
      }));
    });
    return observable;
  }

  private isSame(arr1: any[], arr2: any[]): boolean {
    return arr1.length === arr2.length && arr1.every(element => arr2.includes(element));
  }

  private onContainerResize(): void {
    this.table.recalculate();
    this.showCompact = this.canShowCompact();
  }

  private canShowCompact(): boolean {
    return this.tableContainer?.nativeElement?.offsetWidth < this.comfortableTableFit;
  }

  private initializeActionBar(): void {
    this.deleteMenu = {
      title: 'MASTER-ACTION-DELETE',
      icon: 'element-delete',
      disabled: !this.taskListVm?.canDeleteTask,
      action: (): void => this.onDelete(this.selectedEntity)
    };

    this.addMenu = {
      title: 'MASTER-ACTION-ADD',
      icon: 'element-plus',
      items: this.createInitialTemplates(),
      disabled: !this.taskListVm?.canAddTask,
      action: (): void => {
        asapScheduler.schedule(() => {
          this.getTemplates();
        }, 20);
      }
    };

    this.duplicateMenu = {
      title: 'MASTER-ACTION-DUPLICATE',
      icon: 'element-copy',
      disabled: !this.taskListVm?.canDuplicateTask,
      action: (): void => this.onDuplicate(this.selectedEntity)
    };

    // Details action bar
    this.saveMenu = {
      title: 'DETAIL-ACTION-SAVE',
      icon: 'element-save',
      disabled: true, // state managed in form changes
      action: (): void => this.onSaveAction(this.selectedEntity)
    };

    this.editMenu = {
      title: 'DETAIL-ACTION-EDIT',
      icon: 'element-edit',
      disabled: !this.taskListVm?.canEditTask,
      action: (): void => this.onEdit(this.selectedEntity)
    };

    if (this.isInfoComponentOnly()) {
      this.masterActions = [this.editMenu, this.saveMenu, this.deleteMenu];
    } else {
      this.masterActions = [this.addMenu, this.deleteMenu, this.duplicateMenu];
      this.detailActions = [this.editMenu, this.saveMenu];
    }

  }

  private createInitialTemplates(): MenuItem[] {
    // workaround for menuitems not properly sized on first click
    // this will initialize the addMenuItems when the action bar is created, not when the Add Menu is clicked.
    const items: MenuItem[] = [];
    this.dataService.initialTaskTemplates.forEach(item => {
      const name = isNullOrUndefined(item.TemplateName) || item?.TemplateName === ''
        ? item.TemplateNameLocalized
        : item.TemplateName;

      const menuItem: MenuItem = {
        title: name,
        disabled: false,
        action: () => this.onAddNewTask(item)
      };

      if (!isNullOrUndefined(menuItem)) {
        items.push(menuItem);
      }
    });

    return items;
  }

  private getTemplates(): void {
    const methodName = 'getTemplates(): ';
    this.dataService.getOperatorTaskTemplates().subscribe({
      next: response => {
        if (response) {
          const items: MenuItem[] = [];
          response.forEach(item => {
            const name = isNullOrUndefined(item.TemplateName) || item?.TemplateName === ''
              ? item.TemplateNameLocalized
              : item.TemplateName;

            const menuItem: MenuItem = {
              title: name,
              disabled: false,
              action: () => this.onAddNewTask(item)
            };

            if (!isNullOrUndefined(menuItem)) {
              items.push(menuItem);
            }
          });

          this.addMenu.items = items;
          this.traceService.debug(TraceModules.contentTrace, `${methodName} Response= ${items.length}`);
        }
      },
      error: err => {
        this.traceService.warn(TraceModules.contentTrace, `${methodName} Error= ${err}`);
      },
      complete: () => {
        this.traceService.debug(TraceModules.contentTrace, `${methodName} completed.`);
      }
    });
  }

  private getTasks(): any[] {
    if (this.currentSortProperty === undefined) {
      return this.taskListVm !== undefined ? this.taskListVm.tasks : undefined;
    } else {
      const rows: OperatorTaskModel[] = this.taskListVm !== undefined ? this.taskListVm.tasks.slice(0) : [];
      switch (this.currentSortProperty) {
        case 'status':
          rows.sort((a, b) => this.compareByStatus(a, b, this.currentDirection));
          break;
        case 'statusDetails':
          rows.sort((a, b) => this.compareByStatusDetails(a, b, this.currentDirection));
          break;
        case 'name':
          if (this.currentDirection === TaskSortDirection.ASCENDING) {
            rows.sort((a, b) => a.taskNameLocalized.localeCompare(b.taskNameLocalized, undefined, {
              numeric: true,
              sensitivity: 'base'
            }));
          } else {
            rows.sort((a, b) => b.taskNameLocalized.localeCompare(a.taskNameLocalized, undefined, {
              numeric: true,
              sensitivity: 'base'
            }));
          }
          break;
        case 'createdBy':
          if (this.currentDirection === TaskSortDirection.ASCENDING) {
            rows.sort((a, b) => a.createdBy.localeCompare(b.createdBy, undefined, {
              numeric: true,
              sensitivity: 'base'
            }));
          } else {
            rows.sort((a, b) => b.createdBy.localeCompare(a.createdBy, undefined, {
              numeric: true,
              sensitivity: 'base'
            }));
          }
          break;
        default:
          break;
      }
      return rows;
    }
  }

  private compareByStatus(a: OperatorTaskModel, b: OperatorTaskModel, sortDirection: string): number {
    let returnVal: number = sortDirection === TaskSortDirection.ASCENDING ? (a.status - b.status) : (b.status - a.status);

    if (returnVal !== 0) {
      return returnVal;
    }

    // If the status of the 2 tasks is the same, sort the tasks according ascending time
    // sort the elements according ascending time
    if (a.StatusUpdateDateTime === undefined && b.StatusUpdateDateTime !== undefined) {
      returnVal = -1;
    } else if (a.StatusUpdateDateTime !== undefined && b.StatusUpdateDateTime === undefined) {
      returnVal = 1;
    } else if (a.StatusUpdateDateTime.getTime() === b.StatusUpdateDateTime.getTime()) {
      returnVal = 0;
    } else {
      returnVal = (a.StatusUpdateDateTime.getTime() > b.StatusUpdateDateTime.getTime()) ? 1 : -1;
    }
    return returnVal;
  }

  private compareByStatusDetails(a: OperatorTaskModel, b: OperatorTaskModel, sortDirection: string): number {
    let returnVal = 0;
    // In case of idle tasks, there is the possibility that a task was started but the command check failed.
    // In this case, the StatusUpdateDateTime of the task is initialized (even if it is not displayed) and it can modify the ordering.
    // So the idle tasks are forced to be in the top or the bottom part of the list......
    if (a.status === OperatorTaskStatuses.Idle && b.status === OperatorTaskStatuses.Idle) {
      returnVal = 0;
    } else if (a.status === OperatorTaskStatuses.Idle && b.status !== OperatorTaskStatuses.Idle) {
      returnVal = (sortDirection === TaskSortDirection.ASCENDING) ? -1 : 1;
    } else if (a.status !== OperatorTaskStatuses.Idle && b.status === OperatorTaskStatuses.Idle) {
      returnVal = (sortDirection === TaskSortDirection.ASCENDING) ? 1 : -1;
    } else if (a.StatusUpdateDateTime === undefined && b.StatusUpdateDateTime === undefined) {
      returnVal = 0;
    } else if (a.StatusUpdateDateTime === undefined && b.StatusUpdateDateTime !== undefined) {
      returnVal = -1;
    } else if (a.StatusUpdateDateTime !== undefined && b.StatusUpdateDateTime === undefined) {
      returnVal = 1;
    } else if (a.StatusUpdateDateTime.getTime() === b.StatusUpdateDateTime.getTime()) {
      returnVal = 0;
    } else {
      const dateCompare: number = (a.StatusUpdateDateTime.getTime() > b.StatusUpdateDateTime.getTime()) ? 1 : -1;
      returnVal = sortDirection === TaskSortDirection.ASCENDING ? dateCompare : ((-1) * dateCompare);
    }

    return returnVal;
  }

  private getSortConfig(): TaskSort[] {
    return this.taskSortConfig;
  }

  private onAddNewTask(item: OperatorTaskTemplatesResponse): void {
    this.traceService.debug(TraceModules.contentTrace, `addNew() ${item}`);

    this.taskListVm.createNewTask(item, this.dataService.user).subscribe(vm => {
      this.subscribeToFormStatusChanges();
      this.infoComponent.form.markAsDirty();
      this.traceService.debug(TraceModules.contentTrace, `addNew() ${vm}`);
      this.taskListVm.tasks.push(vm);
      this.updateSelectedTaskOnSaveAndAddTable(vm, TaskViewMode.Add);
    });

    asapScheduler.schedule(() => this.table.element.querySelector('.datatable-body')
      .scrollTop = ((this.taskListVm.tasks.length - 1) * (this.table.rowHeight as number)), 20);
  }

  private updateSelectedTaskOnSaveAndAddTable(vm: OperatorTaskModel, taskViewType: TaskViewMode): void {
    // select the point and enable editing in the details pane
    this.setSelectedTaskOnTable(vm, taskViewType);
    this.traceService.info(TraceModules.contentTrace, `updateSelectedTaskOnSaveAndAddTable(): selected= ${vm?.taskNameLocalized}`);
  }

  private setSelectedTaskOnTable(vm: OperatorTaskModel, taskViewType: TaskViewMode): void {
    this.selectedEntities = [...[vm]];
    this.selectedEntity = vm;
    this.table.selected = [vm];
    this.updateState(vm, taskViewType)
    this.updateTasks$.next('setSelectedTaskOnTable');
    this.traceService.info(TraceModules.contentTrace, `setSelectedTaskOnTable(): selected= ${vm?.taskNameLocalized}`);
  }

  private onDuplicate(ot: OperatorTaskModel): void {
    if (isNullOrUndefined(ot)) {
      this.traceService.warn(TraceModules.contentTrace, 'onDuplicate(): task is undefined.');
      return;
    }
    const errorMsg = this.isValidForDuplication();
    if (errorMsg) {
      this.showAlertDialog(this.duplicateError + errorMsg, this.duplicateTitle);
      return;
    }

    // PCR - 2604352: changed the subscription flow, added traces
    this.traceService.debug(TraceModules.contentTrace, `onDuplicate() Started for ${ot.taskNameLocalized}`);
    this.taskListVm.checkTaskNameForDuplicate(ot).pipe(
      switchMap(dupResponse => this.taskListVm.sendSaveTask(dupResponse, true)),
      catchError(error => {
        const msg = Utility.createErrorMessage(error, this.duplicateError);
        this.dataService.showToastNotification(ToastNotificationState.Danger, this.duplicateTitle, msg);
        return of(null);
      }),
      switchMap(saveResponse => {
        if (saveResponse?.response === 0) {
          const name = saveResponse?.task.taskNameLocalized;
          this.duplicateMessage = this.translateService.instant('MSG-BOX-DUPLICATE-TEXT', { clone: name, source: ot.taskNameLocalized });
          return this.siModal.showDeleteConfirmationDialog(
            this.duplicateMessage,
            this.taskDuplicatedHeading,
            this.deleteSource,
            this.keepSource
          ).pipe(
            catchError(err => {
              this.traceService.error(TraceModules.contentTrace, `onDuplicate() modal sub error: ${err}`);
              throw err;
            }),
            switchMap(result => {
              this.traceService.debug(TraceModules.contentTrace, `onDuplicate() source= ${ot.taskNameLocalized}
              | clone = ${saveResponse.task.taskNameLocalized}
              | delete source = ${result === DeleteConfirmationDialogResult.Delete} `);
              switch (result) {
                case DeleteConfirmationDialogResult.Delete:
                  return this.validate(OperatorTaskUserActionType.Delete, ot, saveResponse.task).pipe(
                    catchError(err => {
                      this.traceService.error(TraceModules.contentTrace, `onDuplicate() validation error: ${err}`);
                      return of(null);
                    })
                  );
                case DeleteConfirmationDialogResult.Cancel:// Keep source
                default:
                  this.updateSelectedTaskOnSaveAndAddTable(saveResponse.task, TaskViewMode.View);
                  return of(null);
              }
            })
          );
        } else {
          this.dataService.showToastNotification(ToastNotificationState.Danger, this.duplicateTitle, this.duplicateError);
          this.traceService.warn(TraceModules.contentTrace, `onDuplicate() Saving duplicated task returned unsuccessful.`);
          return of(null);
        }
      })
    ).subscribe({
      complete: () => {
        this.unsubscribeFormStatusChanges('onDuplicate');
        this.traceService.info(TraceModules.contentTrace, `onDuplicate()Completed: ${this.selectedEntity?.traceData()}`);
      },
      error: err => {
        this.traceService.error(TraceModules.contentTrace, `onDuplicate() error: ${err}`);
      }
    });
  }

  /* private onDuplicateValidated(task: any): void {
    this.taskListVm.checkTaskNameForDuplicate(task).pipe(
      switchMap(dupResponse => this.taskListVm.sendSaveTask(dupResponse, true)),
      catchError(error => {
        this.traceService.error(TraceModules.contentTrace, `Error during duplicate(): ${error}`);
        const msg = Utility.createErrorMessage(error, this.duplicateError);
        this.dataService.showToastNotification(ToastNotificationState.Danger, this.duplicateTitle, msg);
        return of(null);
      })
    ).subscribe(saveResponse => {
      if (saveResponse?.response === 0) {
        const name = saveResponse?.task.taskNameLocalized;
        this.dataService.showToastNotification(ToastNotificationState.Success, this.saveTitle, `${this.taskSavedMsg} ${name}`);
        // before selecting the duplicated task, ask for deletion
        const msg = this.duplicateMessage + `\'` + task.taskNameLocalized + `\?'`;
        this.siModalSubscriptions.push(this.siModal
          .showConfirmationDialog(
            msg,
            this.duplicateTitle)
          .subscribe(confirmation => {
            switch (confirmation) {
              case ConfirmationDialogResult.Confirm:
                this.onDeleteValidated(task, true, saveResponse.task);
                break;
              case ConfirmationDialogResult.Decline:
              default:
                this.updateSelectedTaskOnSaveAndAddTable(saveResponse.task, TaskViewMode.View);
                break;
            }
          }));
      } else {
        this.dataService.showToastNotification(ToastNotificationState.Danger, this.duplicateTitle, this.duplicateError);
        this.traceService.warn(TraceModules.contentTrace, `Saving duplicated task returned: ${saveResponse}`);
      }
    });
  }*/

  private showAlertDialog(error: string, title: string): void {
    this.siModalSubscriptions.push(this.siModal
      .showActionDialog(
        {
          type: "alert",
          message: error,
          heading: title
        }
      )
      .subscribe(response => {
        this.traceService.info(TraceModules.contentTrace, `${title}: Alert dialog response: ${response} - Message: ${error}`);
      }));
  }

  private isValidForDuplication(): string {
    // Note that WPF allows saving a task with invalid target parameter values
    // this is to align the implementation
    let result: string;
    if (this.selectedEntity.targetDpIds) {
      // check if the target has valid parameters.
      // do not check if targets are in system, this is done when commanding
      for (const t of this.selectedEntity.targetDpIds) {
        if (t.datapointDoesNotExist || isNullOrUndefined(t.bo)) {
          continue;
        }

        // if (this.selectedEntity.hasOverridableParameters) {
        //   if (t.isTargetMissingParameters()) {
        //     result = this.duplicateErrorTarget;
        //     break;
        //   }
        // }
        if (t.isTargetMissingParameters()) {
          result = this.duplicateErrorTarget;
          break;
        }
      }
    }
    return result;
  }

  // private isTargetMissingParameters(tc: TargetCommandActionParameter): boolean {
  //   if (tc?.canShowParameter) {
  //     const value = tc?.runtimeVariant?.b;
  //     if (!tc.useOriginalValue && isNullOrUndefined(value)) {
  //       return true;
  //     }
  //   }
  //
  //   return false;
  // }

  private onDelete(selectedTask: OperatorTaskModel): void {
    this.deleteMessage1 = this.translateService.instant('MSG-BOX-DELETE-TITLE', { name: selectedTask.taskNameLocalized });
    this.deleteMessage2 = this.translateService.instant('MSG-BOX-DELETE-TEXT');

    this.siModalSubscriptions.push(this.siModal
      .showActionDialog({
        type: "delete-confirm",
        message: (this.deleteMessage1 + '\'\n' + this.deleteMessage2),
        heading: this.deleteTitle
      }
      )
      .subscribe(result => {
        switch (result) {
          case DeleteConfirmationDialogResult.Delete:
            if (!selectedTask.isNew) {
              this.validate(OperatorTaskUserActionType.Delete, selectedTask).subscribe();
            } else {
              this.deleteTask(selectedTask);
            }
            break;
          case DeleteConfirmationDialogResult.Cancel:
            this.traceService.debug(TraceModules.contentTrace, `onDelete() cancelled`);
            break;
          default:
            break;
        }
      }));
  }

  private deleteTask(task: any, savedTask?: any): void {
    if (!task.isNew) {
      task.ClientRemoved = true;
      this.taskListVm.sendDeleteTask(task).subscribe(
        response => {
          this.traceService.debug(TraceModules.contentTrace, `onDelete(): response=${response}`);
          if (response === 0) {
            const msg = this.translateService.instant('TOAST-NOTIFICATION-MSG-TASK-DELETE', { taskName: task.taskNameLocalized });

            this.dataService.showToastNotification(ToastNotificationState.Success, this.deleteTitle, msg);
            this.traceService.debug(TraceModules.contentTrace, `deleteTask() not new: deleted= ${task.taskNameLocalized} | ${savedTask?.taskNameLocalized}`);
            this.updateTableOnDelete(task, savedTask);
          }
        },
        error => {
          this.dataService.showToastNotification(ToastNotificationState.Danger, this.deleteTitle, Utility.createErrorMessage(error, this.errorFromWsi));
        }
      );
    } else {
      this.traceService.warn(TraceModules.contentTrace, `deleteTask() new: deleted= ${task.taskNameLocalized} | ${savedTask?.taskNameLocalized}`);
      this.updateTableOnDelete(task, savedTask);
    }
  }

  private discardDeleteTask(task: OperatorTaskModel): Observable<void> {
    const deleteObservable = new Observable<void>(observer => {
      const indexDelete = this.taskListVm.tasks.findIndex(t => t.id === task.id);
      this.taskListVm.tasks.splice(indexDelete, 1);
      this.updateTasks$.next('Task Deleted');
      observer.complete();
    });
    return deleteObservable
  }

  private updateTableOnDelete(task: any, savedTask?: any): void {
    const indexDelete = this.taskListVm.tasks.findIndex(t => t.id === task.id);
    if (this.isInfoComponentOnly()) {
      if (!task.isNew) {
        this.taskListVm.tasks.splice(indexDelete, 1);
      }
      this.unSubscribeToSingleTaskChange();
      return;
    }

    // Check for out of bounds
    if (indexDelete < 0 || indexDelete >= this.taskListVm.tasks.length) {
      this.traceService.warn(TraceModules.contentTrace, `updateTableOnDelete(): The index is out of bounds.`);
      return;
    }

    if (!isNullOrUndefined(savedTask)) {
      this.traceService.debug(TraceModules.contentTrace, `updateTableOnDelete() Deleting task from duplicate:
      '${task.taskNameLocalized}' and setting selected task ${savedTask.taskNameLocalized}`);
      this.taskListVm.tasks.splice(indexDelete, 1);
      this.updateTasks$.next('Task Deleted');
      this.updateSelectedTaskOnSaveAndAddTable(savedTask, TaskViewMode.View);
      return;
    }

    // Deleting new task when there is only one task
    if (indexDelete === 0 && indexDelete === this.taskListVm.tasks.length - 1) {
      this.deleteAndUpdateSelected(indexDelete, TaskViewMode.NoSelection, undefined);
      return;
    }

    // Calculate the task to be selected based on the sorted array
    const sorted = this.getTasks();
    const indexTask = sorted.findIndex(t => t.id === task.id);
    let indexNext;
    if (indexTask === sorted.length - 1) {
      indexNext = (indexTask - 1 + sorted.length) % sorted.length;
    } else {
      indexNext = (indexTask + 1) % sorted.length;
    }

    this.deleteAndUpdateSelected(indexDelete, TaskViewMode.View, sorted[indexNext]);
  }

  private deleteAndUpdateSelected(indexToDelete: number, taskViewType: TaskViewMode, task: any): void {
    const deleted = this.taskListVm.tasks[indexToDelete]?.taskNameLocalized;

    this.taskListVm.tasks.splice(indexToDelete, 1);
    this.updateTasks$.next('Task Deleted');

    this.setSelectedTaskOnTable(task, TaskViewMode.View);

    this.traceService.debug(TraceModules.contentTrace, `deleteAndUpdateSelected(): deleted= ${deleted}`);
  }

  private onEdit(ot: OperatorTaskModel): void {
    this.updateState(this.selectedEntity, TaskViewMode.Edit);
    this.subscribeToFormStatusChanges();
  }

  private onSaveAction(task: OperatorTaskModel): void {
    this.onSave(task).subscribe();
  }

  private onSave(task: OperatorTaskModel): Observable<void> {
    const saveObservable = new Observable<void>(observer => {
    // Validation is not applied on new tasks and in case of running or expired task is applied in the command
      if (task === undefined) {
        return;
      }

      if (task.isNew) {
        this.onSaveValidated(task).subscribe({
          complete: () => {
            observer.complete();
          }
        });
      } else if (!Utility.isRunningOrExpiredStatus(task.status)) {
        this.validate(OperatorTaskUserActionType.Save, task).subscribe({
          complete: () => {
            observer.complete();
          }
        });
      } else if (Utility.isRunningOrExpiredStatus(task.status)) {
        if (task.revertActionMode === RevertActionMode.Manual) {
          let msg = '';
          if (task.status === OperatorTaskStatuses.Expired) {
            this.yesTitle = this.startCommandText;
            msg = this.manualRevertNote;
          } else {
            this.yesTitle = this.changeTimeText;
            msg = this.manualRevertShort;
          }

          const modalRef = this.showModalWarning(this.changeTimeText, msg);
          const subscription = modalRef.hidden.subscribe(value => {
            if (value == true) {
              this.validate(OperatorTaskUserActionType.ChangeTime, task).subscribe({
                complete: () => {
                  observer.complete();
                }
              });
            }

            subscription.unsubscribe();
          });
        } else {
          this.validate(OperatorTaskUserActionType.ChangeTime, task).subscribe({
            complete: () => {
              observer.complete();
            }
          });
        }
      }
    });
    return saveObservable;

  }

  private onSaveValidated(task: any): Observable<void> {
    const saveObservable = new Observable<void>(observer => {
      this.saveEventsSubject.next();
      if (task.isNew) {
        this.taskListVm.sendSaveTask(task, false).subscribe({
          next: v => {
            if (v.response === 0) {
            // reset new flags
              task.isNew = false;
              task.targetDpIds.forEach(target => {
                target.targetIsNew = false;
              })

              this.dataService.showToastNotification(ToastNotificationState.Success, this.taskSavedTitle, this.changesSaved);
            } else {
              this.dataService.showToastNotification(ToastNotificationState.Danger, this.taskSavedTitle, Utility.createErrorMessage(v, ''));
            }
          },
          complete: () => {
            this.traceService.debug(TraceModules.contentTrace, 'onSaveValidated(): complete');

            if (this.isInfoComponentOnly()) {
              this.saveSingleTask(true);
            }

            this.updateState(task, TaskViewMode.View);
            this.unsubscribeFormStatusChanges('onSave');
            observer.complete();
          }
        })
      } else {
        this.taskListVm.sendUpdateTask(task).subscribe({
          next: v => {
            if (v === 0) {
            // reset new flags
              if (task.targetDpIds) {
                task.targetDpIds?.forEach(target => {
                  target.targetIsNew = false;
                })
              }

              this.dataService.showToastNotification(ToastNotificationState.Success, this.taskSavedTitle, this.changesSaved);
            } else {
              this.dataService.showToastNotification(ToastNotificationState.Danger, this.taskSavedTitle, Utility.createErrorMessage(v, ''));
            }
          },
          complete: () => {
            this.traceService.debug(TraceModules.contentTrace, 'onSaveValidated(): complete');
            this.updateState(task, TaskViewMode.View);
            this.unsubscribeFormStatusChanges('onSave');
            observer.complete();
          }
        })
      }
    });
    return saveObservable;
  }

  private updateState(task: any, viewMode: TaskViewMode): void {
    this.taskViewType = viewMode;
    // this.updateSelectedTaskOnSaveAndAddTable()
    const taskToUpdate = isNullOrUndefined(task) ? this.selectedEntity : task;
    if (!this.isInfoComponentOnly()) {
      this.detailsActive = !isNullOrUndefined(taskToUpdate);
    }

    this.taskListVm.updateSelectedTaskDataAndStateMachine(new TaskSelection(taskToUpdate, viewMode));
    this.initializeActionBar();
  }

  private validate(action: OperatorTaskUserActionType, task: any, savedTask?: any): Observable<void> {
    const validate = new Observable<void>(observer => {
      const dps = this.taskListVm.getTaskTargetsForValidation(true);
      if (typeof dps === 'number') {
        switch (dps as OperatorTaskErrorTypes) {
          case OperatorTaskErrorTypes.OperatorTaskFolderMissing:
            this.infoComponent.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Danger,
              this.infoComponent.errorCommandValidation, this.infoComponent.modalWarningTitle);
            this.traceService.warn(TraceModules.contentTrace,
              `validate() Cannot ${this.infoComponent.modalWarningTitle} ${this.selectedEntity.taskNameLocalized}
             because cnspath of Operator Task is missing.`);
            break;
          case OperatorTaskErrorTypes.TimeExpired:
          case OperatorTaskErrorTypes.TargetDeleted:
            this.infoComponent.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Danger, this.errorTargetNotPresent, this.infoComponent.modalWarningTitle);
            this.traceService.warn(TraceModules.snapinTrace,
              `validate() Cannot ${this.infoComponent.modalWarningTitle}
              ${this.selectedEntity.taskNameLocalized} because a target does not exist.`);
            break;
          case OperatorTaskErrorTypes.TargetNotReachable:
            this.infoComponent.opeAlertModalWithIconTemplate(OperatorTaskAlertType.Danger, this.errorCommandValidation, this.infoComponent.modalWarningTitle);
            this.traceService.warn(TraceModules.snapinTrace,
              `validate() Cannot ${this.infoComponent.modalWarningTitle}
              ${this.selectedEntity.taskNameLocalized} because a target is not reachable.`);
            break;
          case OperatorTaskErrorTypes.None:
          default:
            break;
        }
        observer.next();
      } else {
        this.taskListVm.showValidationDialog(dps, action).subscribe(response => {
          const status = response?.result?._status;
          const comment: string = response?.result?._comments?.CommonText;
          switch (status as ValidationResultStatus) {
            case ValidationResultStatus.Success:
              switch (action) {
                case OperatorTaskUserActionType.Add:
                // Validation is not applied on new tasks and in case of running or expired task is applied in the command
                  break;
                case OperatorTaskUserActionType.Delete:
                  // PCR - 2604352: Pass the saved task since validate response is after duplicate
                  // sequence has completed
                  this.deleteTask(task, savedTask);
                  observer.complete();
                  break;
                case OperatorTaskUserActionType.Edit:
                  observer.complete();
                  break;
                case OperatorTaskUserActionType.ChangeTime:
                // Command for Change Time
                  this.infoComponent.selectedCommand = OperatorTaskCommandId.ChangeTime;
                  if (task.notesRequired === 1) {

                    this.infoComponent.createNote(this.infoComponent.modalWarningTitle, LogMessage.ChangeExpiration, comment, task);
                  } else {
                    this.infoComponent.executeCommand(undefined, task);
                  }
                  this.updateState(task, TaskViewMode.View);
                  observer.complete();
                  break;
                case OperatorTaskUserActionType.Save:
                  this.onSaveValidated(task).subscribe({
                    complete: () => {
                      observer.complete();
                    }
                  });
                  break;
                  // Handled in OperatorTaskInfo
                case OperatorTaskUserActionType.Start:
                case OperatorTaskUserActionType.Revert:
                case OperatorTaskUserActionType.Close:
                case OperatorTaskUserActionType.Abort:
                  observer.complete();
                  break;
                case OperatorTaskUserActionType.NotSupported:
                default:
                  this.traceService.warn(TraceModules.contentTrace, `${OperatorTaskUserActionType[action]} not supported`);
                  observer.complete();
                  break;
              }
              break;

            case ValidationResultStatus.Cancelled:
              this.infoComponent.validationCancelled(action);
              observer.complete();
              break;
            case ValidationResultStatus.Error:
            // Note validation service doesnt return error
              observer.complete();
              break;
            default:
              observer.complete();
              break;
          }
        });
      }
    });
    return validate;
  }

  private getCurrentSettingsToPut(): string {
    return encodeURIComponent(encodeURIComponent(JSON.stringify({
      MasterContainerWidth: this.masterContainerWidth
      , SortColumn: this.currentSortProperty, SortDirection: this.currentDirection
    })));
  }

  private onPutSettings(isSuccess: boolean): void {
    this.traceService.info(TraceModules.snapinTrace, 'onPutSettings - isSuccess: ' + isSuccess);
  }

  private onPutSettingsError(error: any): void {
    this.traceService.info(TraceModules.snapinTrace, 'onPutSettingsError - error: ' + error);
  }

  private onGetSettings(userSettings: string): void {
    if (userSettings === undefined) {
      return;
    }

    try {
      const settings: TaskUserSettings = JSON.parse(userSettings) as TaskUserSettings;
      this.masterContainerWidth = settings.MasterContainerWidth;
      this.currentSortProperty = settings.SortColumn;
      this.currentDirection = settings.SortDirection;
      this.taskSortConfig.forEach(element => {
        if (element.prop !== settings.SortColumn) {
          element.dir = undefined;
        } else {
          element.dir = settings.SortDirection;
        }
      });

      this.showCompact = this.canShowCompact();
      asapScheduler.schedule(() => this.updateSort$.next('initial settings'), 100);
      asapScheduler.schedule(() => this.table.recalculate(), 50);
      this.traceService.info(TraceModules.snapinTrace, 'onGetSettings - MasterContaineWidth: ' + this.masterContainerWidth);
    } catch (ex) {
      this.traceService.warn(TraceModules.snapinTrace, 'onGetSettings error: ' + ex);
    }

  }

  private onGetSettingsError(error: any): void {
    this.traceService.info(TraceModules.snapinTrace, 'onGetSettingsError - error: ' + error);
  }

  private translateStrings(): void {
    const translations: OperatorTaskTranslations = this.dataService.translations;
    if (translations === undefined) {
      return;
    }

    this.snapInTitle = translations.snapInTitle;
    this.emptyStateContent = translations.emptyHeading;
    this.emptyHeading = translations.emptyHeading;
    this.statusIconTitle = translations.statusIconTitle;
    this.nameTitle = translations.nameTitle;
    this.ownerTitle = translations.ownerTitle;
    this.statusDetailsTitle = translations.statusDetailsTitle;
    this.addTitle = translations.addTitle;
    this.editTitle = translations.editTitle;
    this.saveTitle = translations.saveTitle;
    this.duplicateTitle = translations.duplicateTitle;
    this.deleteTitle = translations.deleteTitle;
    this.duplicateMessage = translations.duplicateMessage;
    this.changeTimeText = translations.changeTimeText;
    this.manualRevertNote = translations.manualRevertNote;
    this.duplicateErrorTarget = translations.duplicateErrorTarget;
    this.duplicateError = translations.duplicateError;
    this.errorFromWsi = translations.errorFromWsi;
    this.taskSavedMsg = translations.taskSavedMsg;
    this.taskSavedTitle = translations.taskSavedTitle;
    this.changesSaved = translations.changesSaved;
    this.errorCommandValidation = translations.errorCommandValidation;
    this.errorTargetNotPresent = translations.errorTargetNotPresent;
    // this.yesTitle = translations.yesTitle;
    this.cancel = translations.cancelTitle;
    this.startCommandText = translations.startCommandText;
    this.taskDuplicatedHeading = translations.taskDuplicatedHeading;
    this.keepSource = translations.keepSource;
    this.deleteSource = translations.deleteSource;
    this.manualRevertShort = translations.manualRevertShort;
  }

  private unsubscribeFormStatusChanges(method: string): void {
    this.traceService.debug(TraceModules.contentTrace, `Unsubsribe form status changes called from ${method}`);
    this.formStatusChangesSubscription?.unsubscribe();
    this.formStatusChangesSubscription = null;
  }

  private subscribeToFormStatusChanges(): void {
    this.formStatusChangesSubscription = this.infoComponent?.form?.statusChanges.subscribe(status => {
      switch (status) {
        case 'VALID':
          this.saveMenu.disabled = false;
          this.dataService.HasValidationErrors = false;
          this.dataService.HasChanges = this.infoComponent.form.dirty;
          break;
        case 'INVALID':
          this.saveMenu.disabled = true;
          this.dataService.HasValidationErrors = true;
          this.dataService.HasChanges = this.infoComponent.form.dirty;

          for (const controlsKey in this.infoComponent.form.controls) {
            if (this.infoComponent.form.controls[controlsKey].status === 'INVALID') {
              this.traceService.info(TraceModules.contentTrace, `${controlsKey} -- status=${this.infoComponent.form.controls[controlsKey].status}`);
            }
          }
          break;
        case 'DISABLED':
          this.dataService.HasValidationErrors = false;
          this.dataService.HasChanges = false;
          break;
        case 'PENDING':
        default:
          break;
      }
    });
  }

  private showModalWarning(modalTitle: string, msg: string): ModalRef<any> {
    // modal with warning icon and yes no button
    this.modalWarningMessage = msg;
    this.modalWarningTitle = modalTitle;

    const modalRef = this.siModalSvc.show(this.modalWarningTemplate, {
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      // class: this.centeredModalClass,
      ariaLabelledBy: 'sample-modal-title'
    });

    return modalRef;
  }

  private debugTrace(from: string, task: OperatorTaskModel): void {
    let msg = '';
    if (Array.isArray(task)) {
      msg = task[0].traceData();
    } else if (!isNullOrUndefined(task)) {
      msg = task.traceData();
    } else {
      msg = 'undefined'
    }
    this.traceService.debug(TraceModules.contentTrace, `${from} : ${msg}`);
  }

  private isInfoComponentOnly(): boolean {
    return this.fullSnapinID.snapInId === this.otSecondary;
  }
  private subscribeToSingleTaskChange(): void {
    if (!this.isInfoComponentOnly()) {
      return;
    }

    this.taskListVm.subscribeTaskChangeNotification(this.selectedEntity.id);
    this.taskListVm.tasks$.subscribe(rows => {
      this.updateTasks$.next('taskListVm.tasks$');
      if (isNullOrUndefined(rows) || rows?.length < 1) {
        // initial notification
        return;
      }

      if (rows.length !== 1) {
        this.traceService.warn(TraceModules.contentTrace, `Received multiple tasks`);
        return;
      }

      if (rows[0].id !== this.selectedEntity.id) {
        this.traceService.warn(TraceModules.contentTrace, `The current task is not the same as `);
        return;
      }

      if (rows[0] !== undefined && rows[0]?.targetDpIds !== undefined) {
        this.selectedEntity = rows[0];
      }
    });

    this.subscriptions.push(this.taskListVm.selectedTaskChanged.subscribe(task => {
      if (task === undefined) {
        // task is removed by parallel client
        this.unSubscribeToSingleTaskChange();
      }
    }));
  }

  private initInfoComponent(): void {
    const templatePath = this.gmsMessageData.data[0].Designation;
    this.taskListVm.initSingleTask(templatePath).subscribe({
      next: (resp => {
        if (resp) {
          this.ngZone.run(() => {
            this.selectedEntity = resp;
            this.taskListVm.updateSelectedTaskDataAndStateMachine(new TaskSelection(resp, TaskViewMode.Edit));
            this.initializeActionBar();
            this.subscribeToFormStatusChanges();
            this.infoComponent.form.markAsDirty();
          });
        }
      }),
      error: (err => {
        this.traceService.warn(TraceModules.contentTrace, `initSingleTask() error= ${err}`);

      })
    }
    );
  }

  private unSubscribeToSingleTaskChange(): void {
    this.dataService.HasChanges = false;
    this.dataService.HasValidationErrors = false;

    if (this.updateTasks$ !== undefined) {
      this.updateTasks$.unsubscribe();
    }

    if (this.updateSort$ !== undefined) {
      this.updateSort$.unsubscribe();
    }

    this.subscriptions.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        subscription.unsubscribe();
      }
    });

    this.siModalSubscriptions.forEach((subscription: Subscription) => {
      if (subscription !== null) {
        subscription.unsubscribe();
      }
    });

    this.unsubscribeFormStatusChanges('unSubscribeToSingleTaskChange');
    if (!this.selectedEntity?.isNew) {
      this.taskListVm.unsubscribeTaskChangeNotification();
    }

    this.selectedEntity = undefined;
    this.taskListVm.updateSelectedTaskDataAndStateMachine(new TaskSelection(undefined, TaskViewMode.NoSelection));
    this.initializeActionBar();
  }

  private traceMessageData(): void {
    if (isNullOrUndefined(this.gmsMessageData)) {
      this.traceService.debug(TraceModules.contentTrace, `GmsMessageData Received:: ${JSON.stringify(this.fullSnapinID)}
   gmsMessageData is null`)
      return;
    }
    let customData: BrowserObject[] = this.gmsMessageData?.customData || [];
    customData = customData?.filter(o => o != null);
    const customDataids = customData?.map(o => o.ObjectId).join('\n');

    let data = this.gmsMessageData?.data || [];
    data = data?.filter(o => o != null);
    const dataIds = data?.map(o => o.ObjectId).join('\n');
    this.traceService.debug(TraceModules.contentTrace, `GmsMessageData Received:: ${JSON.stringify(this.fullSnapinID)}
    | Received Template= ${this.gmsMessageData.data[0].Descriptor} | ${this.gmsMessageData.data[0].Designation}
    | customData \n${customDataids}
    | data= \n$${dataIds}`)
  }

  private saveSingleTask(isNew: boolean): void {
    if (isNew) {
      this.taskListVm.tasks.push(this.selectedEntity);
      this.subscribeToSingleTaskChange();
    }
    this.updateState(this.selectedEntity, TaskViewMode.View);
    this.unsubscribeFormStatusChanges('onSave');
  }
}
