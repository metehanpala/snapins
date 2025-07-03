import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { BrowserObject, CnsLabel, CnsLabelEn } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { MenuItem, ViewType } from '@simpl/element-ng';

@Component({
  selector: 'gms-tile-body',
  templateUrl: './tile-body.component.html',
  styleUrl: './tile-body.component.scss',
  standalone: false
})
export class TileBodyComponent implements OnChanges {

  @Input() public actionBarViewType?: ViewType = 'collapsible';
  @Input() public primaryActions?: MenuItem[];
  @Input() public secondaryActions?: MenuItem[];
  @Input() public dataItem: any;
  @Input() public cnsLabel: CnsLabel;
  @Input() public selectedObject: BrowserObject;
  /**
   * Emitter for click on body
   */
  @Output() public readonly clickBody: EventEmitter<any> = new EventEmitter<any>();

  public title = '';

  public ngOnChanges(): void {
    this.assignHeading(this.cnsLabel, this.dataItem);
  }

  public expanded(event: any): void {
    // console.log(event);
  }

  public onBody(dataItem: any): void {
    this.clickBody.next(dataItem);
  }

  private assignHeading(label: CnsLabel, tileItem: BrowserObject): void {
    if (isNullOrUndefined(label)) {
      this.title = tileItem.Name;
    } else {
      if (
        label.cnsLabel === CnsLabelEn.Description ||
        label.cnsLabel === CnsLabelEn.DescriptionAndAlias ||
        label.cnsLabel === CnsLabelEn.DescriptionAndName
      ) {
        this.title = tileItem.Descriptor;
      } else {
        this.title = tileItem.Name;
      }
    }
  }

}
