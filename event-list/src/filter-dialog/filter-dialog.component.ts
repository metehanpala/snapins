import { Component, Input, OnInit } from '@angular/core';
import { EventDateTimeFilterValues, EventFilter } from '@gms-flex/services';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationDialogResult, SiActionDialogService, TreeItem } from '@simpl/element-ng';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, Subject, Subscription } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { checked, DialogData, DialogExitCode, FilterStringType } from './filter-dialog.model';

@Component({
  selector: 'gms-event-list-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrl: '../gms-event-list-snapin.scss',
  standalone: false
})

export class EventFilterDlgComponent implements OnInit {
  public aliasFilterLabel = ''; // "Alias";
  public nameFilterLabel = ''; // "Name";
  public descriptionFilterLabel = ''; // "Description";
  public dateTimeFilterLabel = ''; // "Date and time";
  public hiddenEventsFilterLabel = ''; // "Hidden Events";
  public timeEmptyFilterLabel = ''; // "Always";
  public timeLastQuarterHourFilterLabel = ''; // "Last quarter of an hour";
  public timeLastHalfHourFilterLabel = ''; // "Last half an hour";
  public timeLastHourFilterLabel = ''; // "Last hour";
  public timeLastNightFilterLabel = ''; // "Last night";
  public timeYesterdayFilterLabel = ''; // "Yesterday";
  public timeTodayFilterLabel = ''; // "Today";
  public searchFilterWatermark = ''; // "Search";
  public disciplineFilterLabel = ''; // "Discipline";
  public categoryFilterLabel = ''; // "Category";
  public stateFilterLabel = ''; // "Event State";
  public srcStateFilterLabel = ''; // "Source State";
  public stringPattern = '';
  public filterDlgTitle = ''; // "Filter"
  public filterCancelBtn = ''; // "Cancel"
  public filterApplyBtn = ''; // "Apply"

  public saveFilterName: string;
  public isSaveFilterInProgress: boolean;
  public saveFilterNameValid = false;
  public isSaveDlgOpen = false;
  public saveErrorMessage: string;
  public saveErrorSeverity: string;
  public filterNotUniqueMessage: string;
  public filterSaveAsLabel: string;
  public savedFilters: EventFilter[];
  public saveDlgStyle = {};
  public availableFilters: string;
  public savedFiltersLabel: string;
  public savedFilterDeleted = false;
  public deleteAllFiltersLabel: string;

  @Input() public eventFilter: EventFilter;
  @Input() public dialogDataSubject: Subject<DialogData>;
  @Input() public disciplineTree: TreeItem[];
  @Input() public categoryTree: TreeItem[];
  @Input() public stateTree: TreeItem[];
  @Input() public srcStateTree: TreeItem[];
  @Input() public hiddenEventsTree: TreeItem[];
  @Input() public disableFilterSaving: boolean;
  @Input() public filtersObs: Observable<EventFilter[]>;

  public constructor(
    public bsModalRef: BsModalRef,
    private readonly siModal: SiActionDialogService,
    private readonly translateService: TranslateService,
    private readonly traceService: TraceService,
    private readonly appContextService: AppContextService) {
  }

  private filterBy: FilterStringType = FilterStringType.Name;
  private readonly subscriptions: Subscription[] = [];
  private userLang: string;
  private _prevEventFilter: EventFilter = null;
  private savedFiltersDefaultLabel = '';
  private deleteAllDlgHeading = '';
  private deleteAllDlgMessage = '';
  private currentFilterLabel = '';

  public ngOnInit(): void {

    this._prevEventFilter = JSON.parse(JSON.stringify(this.eventFilter));

    this.subscriptions.push(this.appContextService.defaultCulture.subscribe((defaultCulture: string) => {
      if (defaultCulture != null) {
        this.translateService.setDefaultLang(defaultCulture);
      } else {
        this.traceService.warn(TraceModules.eventList, 'No default Culture for appContextService');
        this.translateService.setDefaultLang(this.userLang === undefined ? this.translateService.getBrowserLang() :
          this.userLang);
      }
    }));

    this.subscriptions.push(this.appContextService.userCulture.subscribe((userCulture: string) => {
      if (userCulture != null) {
        this.translateService.use(userCulture).subscribe((res: any) => {
          this.traceService.info(TraceModules.eventList, 'use  user Culture');
        });
      } else {
        this.traceService.warn(TraceModules.eventList, 'No user Culture for appContextService');
      }
    }));

    this.subscriptions.push(this.translateService.get([
      'EVENTS.ALIAS-FILTER-LABEL',
      'EVENTS.NAME-FILTER-LABEL',
      'EVENTS.DESCRIPTION-FILTER-LABEL',
      'EVENTS.DATE-TIME-FILTER-LABEL',
      'EVENTS.TIME-EMPTY-FILTER-LABEL',
      'EVENTS.TIME-LAST-QUARTER-HOUR-FILTER-LABEL',
      'EVENTS.TIME-LAST-HALF-HOUR-FILTER-LABEL',
      'EVENTS.TIME-LAST-HOUR-FILTER-LABEL',
      'EVENTS.TIME-LAST-NIGHT-FILTER-LABEL',
      'EVENTS.TIME-YESTERDAY-FILTER-LABEL',
      'EVENTS.TIME-TODAY-FILTER-LABEL',
      'EVENTS.FILTER-CLEAR-MSG',
      'EVENTS.SEARCH-FILTER-WATERMARK',
      'EVENTS.DISCIPLINE-FILTER-LABEL',
      'EVENTS.CATEGORY-FILTER-LABEL',
      'EVENTS.STATE-FILTER-LABEL',
      'EVENTS.SRC-STATE-FILTER-LABEL',
      'EVENTS.SRC-SYSTEM-FILTER-LABEL',
      'EVENTS.HIDDEN-EVENTS-FILTER-LABEL',
      'EVENTS.HIDDEN-EVENTS-SHOW-LABEL',
      'EVENTS.FILTER-CONTROL.DIALOG-APPLY-BTN',
      'EVENTS.FILTER-CONTROL.DIALOG-CANCEL-BTN',
      'EVENTS.FILTER-CONTROL.DIALOG-TITLE',
      'EVENTS.FILTER-CONTROL.NOT-UNIQUE-MSG',
      'EVENTS.FILTER-CONTROL.SAVEAS-LABEL',
      'EVENTS.FILTER-CONTROL.AVAILABLE-FILTERS',
      'EVENTS.FILTER-CONTROL.SAVED-FILTERS',
      'EVENTS.FILTER-CONTROL.CURRENT-FILTER-LABEL',
      'EVENTS.FILTER-CONTROL.DELETE-ALL-DLG-HEADING',
      'EVENTS.FILTER-CONTROL.DELETE-ALL-DLG-MSG',
      'EVENTS.FILTER-CONTROL.DELETE-ALL-FILTERS-LABEL'
    ]).subscribe(values => this.onTraslateStrings(values)));

    this.subscriptions.push(this.filtersObs.subscribe((filters: EventFilter[]) => {
      this.savedFilters = filters;
      if (this.savedFilters.length > 0) {
        this.traceService.info(TraceModules.eventList, 'Number of stored filters available: %s', filters.length);
      } else {
        this.traceService.info(TraceModules.eventList, 'No stored filters available');
      }
    }
    ));
 
    this.initializeFilter();
  }

  public onDeleteAllFilters(): void {    
    this.subscriptions.push(this.siModal.showActionDialog(
      {
        type: 'confirmation',
        message: this.deleteAllDlgMessage, // All saved filters will be deleted.\nDo you want to proceed?",
        heading: this.deleteAllDlgHeading
      }).subscribe(confirmation => {
      switch (confirmation) {
        case ConfirmationDialogResult.Confirm:
          this.dialogDataSubject.next({
            exitCode: DialogExitCode.DELETEALL 
          });
          break;
        case ConfirmationDialogResult.Decline:
        default:
          return;
      }
    })
    );
  }

  public onSelectSavedFilter(event: MouseEvent, i: number): void {
    if (event.defaultPrevented) {
      return;
    }
    this.eventFilter = { ...this.savedFilters[i] };
    this.initializeFilter();
    this.savedFiltersLabel = this.currentFilterLabel + ' ' + this.eventFilter.filterName;
  }

  public onDeleteSavedFilter(event: MouseEvent, filter: EventFilter): void {
    event?.preventDefault();
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.REMOVE,
      eventFilter: JSON.parse(JSON.stringify(filter))  
    });
    if (this.eventFilter.filterName === filter.filterName) {
      this._prevEventFilter.filterName = '';
      this.savedFilterDeleted = true;
      this.savedFiltersLabel = this.savedFiltersDefaultLabel;
    }
    // Form stays open if there are still saved filters
    if (this.savedFilters.length > 0 || this.savedFilters.length > 1) {
      event?.stopPropagation();
    }
  }

  public get isFilterChanged(): boolean {
    if (this.eventFilter.empty && this._prevEventFilter.empty) {
      return false;
    }
    return JSON.stringify(this.eventFilter).localeCompare(JSON.stringify(this._prevEventFilter)) !== 0;
  }

  public get isSaveError(): boolean {
    return !isNullOrUndefined(this.saveErrorMessage) && this.saveErrorMessage.length > 0;
  }

  public apply(dec: number = DialogExitCode.APPLY): void {
    this.dialogDataSubject.next({
      exitCode: dec,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
    this.bsModalRef.hide();
    this.subscriptions.forEach((subscription: Subscription) => {
      if (!isNullOrUndefined(subscription)) {
        subscription.unsubscribe();
      }
    });
  }

  public cancel(): void {
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.CANCEL,
      eventFilter: JSON.parse(JSON.stringify(this._prevEventFilter))
    });
    this.bsModalRef.hide();
    this.subscriptions.forEach((subscription: Subscription) => {
      if (!isNullOrUndefined(subscription)) {
        subscription.unsubscribe();
      }
    });
  }

  public onDisciplineSelectionChanged(): void {
    this.eventFilter.disciplines = [];
    this.disciplineTree.forEach((value, index) => {
      if (value.checked === checked) {
        this.eventFilter.disciplines.push(value.customData);
        this.eventFilter.empty = false;
      }
    });
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public onCategorySelectionChanged(): void {
    this.eventFilter.categories = [];
    this.categoryTree.forEach(value => {
      if (value.checked === checked) {
        this.eventFilter.categories.push(value.customData);
        this.eventFilter.empty = false;
      }
    });
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public onStateSelectionChanged(): void {
    this.eventFilter.states = [];
    this.stateTree.forEach(value => {
      if (value.checked === checked) {
        this.eventFilter.states = this.eventFilter.states.concat(value.customData);
        this.eventFilter.empty = false;
      }
    });
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public onSrcStateSelectionChanged(): void {
    this.eventFilter.srcState = [];
    this.srcStateTree.forEach(value => {
      if (value.checked === checked) {
        this.eventFilter.srcState = this.eventFilter.srcState.concat(value.customData[0]);
        this.eventFilter.empty = false;
      }
    });
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public onHiddenEventsSelectionChanged(): void {
    this.eventFilter.hiddenEvents = false;
    this.hiddenEventsTree.forEach(value => {
      if (value.checked === checked) {
        this.eventFilter.hiddenEvents = true;
        this.eventFilter.empty = false;
      }
    });
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public onStringPatternInputChange(param?: string): void {
    this.stringPattern = '';
  
    if (isNullOrUndefined(param)) {
      return;
    }

    this.stringPattern = param;
  
    this.eventFilter.srcName = '';
    this.eventFilter.srcDescriptor = '';
    this.eventFilter.srcAlias = '';

    if (this.stringPattern.length > 0) {
      if (this.filterBy === FilterStringType.Name) {
        this.eventFilter.srcName = this.stringPattern;
      } else if (this.filterBy === FilterStringType.Description) {
        this.eventFilter.srcDescriptor = this.stringPattern;
      } else if (this.filterBy === FilterStringType.Alias) {
        this.eventFilter.srcAlias = this.stringPattern;
      }
      this.eventFilter.empty = false;
    }

    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public get stringPatternSelection(): string {
    if (this.filterBy === FilterStringType.Description) {
      return this.descriptionFilterLabel;
    } else if (this.filterBy === FilterStringType.Alias) {
      return this.aliasFilterLabel;
    } else {
      return this.nameFilterLabel;
    }
  }

  public set stringPatternSelection(val: string) {
    if (val === this.descriptionFilterLabel) {
      this.filterBy = FilterStringType.Description;
    } else if (val === this.aliasFilterLabel) {
      this.filterBy = FilterStringType.Alias;
    } else {
      this.filterBy = FilterStringType.Name;
    }
    this.onStringPatternInputChange();
  }

  public get timeSelection(): string {
    if (this.eventFilter === null) {
      return this.timeEmptyFilterLabel;
    }
    if (this.eventFilter.creationDateTime === undefined || this.eventFilter.creationDateTime === EventDateTimeFilterValues.None) {
      return this.timeEmptyFilterLabel;
    }
    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastQuarterHour) {
      return this.timeLastQuarterHourFilterLabel;
    }
    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastHalfHour) {
      return this.timeLastHalfHourFilterLabel;
    }
    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastHour) {
      return this.timeLastHourFilterLabel;
    }
    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.LastNight) {
      return this.timeLastNightFilterLabel;
    }
    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.Today) {
      return this.timeTodayFilterLabel;
    }
    if (this.eventFilter.creationDateTime === EventDateTimeFilterValues.Yesterday) {
      return this.timeYesterdayFilterLabel;
    }
  }

  public set timeSelection(val: string) {
    if (val === this.timeEmptyFilterLabel) {
      this.eventFilter.creationDateTime = EventDateTimeFilterValues.None;
    } else {
      if (val === this.timeLastQuarterHourFilterLabel) {
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.LastQuarterHour;
      }
      if (val === this.timeLastHalfHourFilterLabel) {
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.LastHalfHour;
      }
      if (val === this.timeLastHourFilterLabel) {
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.LastHour;
      }
      if (val === this.timeLastNightFilterLabel) {
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.LastNight;
      }
      if (val === this.timeYesterdayFilterLabel) {
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.Yesterday;
      }
      if (val === this.timeTodayFilterLabel) {
        this.eventFilter.creationDateTime = EventDateTimeFilterValues.Today;
      }
      this.eventFilter.empty = false;
    }
    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });
  }

  public isFilterSavingEnabled(): boolean {
    return (!this.isFilterChanged && !this.savedFilterDeleted && !this.disableFilterSaving);
  }
  
  public checkFilterName(): void {
    const name: string = (this.saveFilterName || '').trim();
    if (isNullOrUndefined(name) || name.length === 0) {
      this.saveErrorMessage = undefined;
      this.saveErrorSeverity = undefined;
      this.saveFilterNameValid = false;
      return;
    }
    if (this.savedFilters?.some(item => item.filterName === this.saveFilterName)) {
      this.saveErrorMessage = this.filterNotUniqueMessage;
      this.saveErrorSeverity = 'warning';
      this.saveFilterNameValid = false;
      return;
    }
    this.saveErrorMessage = undefined;
    this.saveErrorSeverity = undefined;
    this.saveFilterNameValid = true;
  }

  public showSave(show: boolean): void {
    this.isSaveDlgOpen = show;
  }

  public onNewFilter(update: boolean): void {    
    if (update) { // save settings
      this.eventFilter.filterName = this.saveFilterName;   
      this.saveFilterName = "";
      this.savedFilterDeleted = false;
      this.apply(DialogExitCode.NEW);
    } else { // cancel settings
      this.isSaveDlgOpen = false;
    }

    this.saveFilterNameValid = false;
    this.saveErrorMessage = undefined;
    this.saveErrorSeverity = undefined;
  }

  private onTraslateStrings(strings: Map<string, string>): void {
    this.aliasFilterLabel = strings['EVENTS.ALIAS-FILTER-LABEL'];
    this.nameFilterLabel = strings['EVENTS.NAME-FILTER-LABEL'];
    this.descriptionFilterLabel = strings['EVENTS.DESCRIPTION-FILTER-LABEL'];
    this.dateTimeFilterLabel = strings['EVENTS.DATE-TIME-FILTER-LABEL'];
    this.timeEmptyFilterLabel = strings['EVENTS.TIME-EMPTY-FILTER-LABEL'];
    this.timeLastQuarterHourFilterLabel = strings['EVENTS.TIME-LAST-QUARTER-HOUR-FILTER-LABEL'];
    this.timeLastHalfHourFilterLabel = strings['EVENTS.TIME-LAST-HALF-HOUR-FILTER-LABEL'];
    this.timeLastHourFilterLabel = strings['EVENTS.TIME-LAST-HOUR-FILTER-LABEL'];
    this.timeLastNightFilterLabel = strings['EVENTS.TIME-LAST-NIGHT-FILTER-LABEL'];
    this.timeYesterdayFilterLabel = strings['EVENTS.TIME-YESTERDAY-FILTER-LABEL'];
    this.timeTodayFilterLabel = strings['EVENTS.TIME-TODAY-FILTER-LABEL'];
    this.searchFilterWatermark = strings['EVENTS.SEARCH-FILTER-WATERMARK'];
    this.disciplineFilterLabel = strings['EVENTS.DISCIPLINE-FILTER-LABEL'];
    this.categoryFilterLabel = strings['EVENTS.CATEGORY-FILTER-LABEL'];
    this.stateFilterLabel = strings['EVENTS.STATE-FILTER-LABEL'];
    this.srcStateFilterLabel = strings['EVENTS.SRC-STATE-FILTER-LABEL'];
    this.hiddenEventsFilterLabel = strings['EVENTS.HIDDEN-EVENTS-FILTER-LABEL'];
    this.filterApplyBtn = strings['EVENTS.FILTER-CONTROL.DIALOG-APPLY-BTN'];
    this.filterCancelBtn = strings['EVENTS.FILTER-CONTROL.DIALOG-CANCEL-BTN'];
    this.filterDlgTitle = strings['EVENTS.FILTER-CONTROL.DIALOG-TITLE'];
    this.filterNotUniqueMessage = strings['EVENTS.FILTER-CONTROL.NOT-UNIQUE-MSG'];
    this.filterSaveAsLabel = strings['EVENTS.FILTER-CONTROL.SAVEAS-LABEL'];
    this.availableFilters = strings['EVENTS.FILTER-CONTROL.AVAILABLE-FILTERS'];
    this.savedFiltersLabel = this.savedFiltersDefaultLabel = strings['EVENTS.FILTER-CONTROL.SAVED-FILTERS'];
    this.currentFilterLabel = strings['EVENTS.FILTER-CONTROL.CURRENT-FILTER-LABEL']; 
    this.deleteAllDlgHeading = strings['EVENTS.FILTER-CONTROL.DELETE-ALL-DLG-HEADING'];
    this.deleteAllDlgMessage = strings['EVENTS.FILTER-CONTROL.DELETE-ALL-DLG-MSG'];
    this.deleteAllFiltersLabel = strings['EVENTS.FILTER-CONTROL.DELETE-ALL-FILTERS-LABEL'];
    this.userLang = this.translateService.getBrowserLang();
  }

  private initializeFilter(): void {
    // string pattern
    if (this.eventFilter.srcName != null && this.eventFilter.srcName.length > 0) {
      this.stringPattern = this.eventFilter.srcName;
      this.filterBy = FilterStringType.Name;
    } else if (this.eventFilter.srcDescriptor != null && this.eventFilter.srcDescriptor.length > 0) {
      this.stringPattern = this.eventFilter.srcDescriptor;
      this.filterBy = FilterStringType.Description;
    } else if (this.eventFilter.srcAlias != null && this.eventFilter.srcAlias.length > 0) {
      this.stringPattern = this.eventFilter.srcAlias;
      this.filterBy = FilterStringType.Alias;
    } else {
      this.stringPattern = '';
    }
    if (this.eventFilter?.filterName?.length > 0 && this.savedFilters.findIndex(filter => filter.filterName === this.eventFilter.filterName) >= 0) {
      this.savedFiltersLabel = this.currentFilterLabel + ' ' + this.eventFilter.filterName;
    }

    this.dialogDataSubject.next({
      exitCode: DialogExitCode.UPDATE,
      eventFilter: JSON.parse(JSON.stringify(this.eventFilter))
    });

  }
}
