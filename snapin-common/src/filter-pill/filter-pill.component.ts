import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { FilterPillData } from './filter-pill.model';

@Component({
  selector: 'gms-event-list-filter-pill',
  templateUrl: './filter-pill.component.html',
  styleUrl: '../gms-event-list-snapin.scss',
  standalone: false
})
export class FilterPillComponent implements OnDestroy {

  private static readonly emptyValueLabel: string = '';
  private static multipleValuesLabel = '';

  @Input()
  public pillData: FilterPillData = undefined;

  @Output()
  public readonly deleteClick: EventEmitter<FilterPillData> = new EventEmitter<FilterPillData>();

  private readonly subscriptions: Subscription[] = [];

  public constructor(
    private readonly translateService: TranslateService) {
  }
  /**
   * Convenience property for access filter title.
   */
  public get filterTitle(): string {
    return !isNullOrUndefined(this.pillData) ? this.pillData.title : '';
  }

  /**
   * Number of values associated with this filter.
   */
  public get filterValuesCount(): number {
    return !isNullOrUndefined(this.pillData) ? this.pillData.valuesCount : 0;
  }

  public get displayIcons(): boolean {
    return this.pillData.icons;
  }

  public getPillDataValues(): string[] {
    return this.pillData.values;
  }

  /**
   * Format the array of filter values to a string for display in the pill UI.
   */
  public get filterValuesString(): string {
    let vstr = '';
    const c: number = this.filterValuesCount;
    if (c > 1) {
      vstr = c.toString();
    } else if (c > 0) {
      vstr = this.pillData.values[0]; // single filter value
    }
    return vstr;
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => { if (subscription != null) { subscription.unsubscribe(); } });
  }

  /**
   * Delete button click handler.
   */
  public onDeleteClick(): void {
    this.deleteClick.emit(this.pillData);
  }

  private onTraslateStrings(strings: any): void {
    FilterPillComponent.multipleValuesLabel = strings['MULTIPLE-FILTER-PILL-LABEL'];
  }
}
