import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BrowserObject, CnsLabel, CnsLabelEn } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';

@Component({
  selector: 'gms-tile-footer',
  templateUrl: './tile-footer.component.html',
  styleUrl: './tile-footer.component.scss',
  standalone: false
})
export class TileFooterComponent implements OnChanges {

  @Input() public cnsLabel: CnsLabel;
  @Input() public tileItem: any;
  @Input() public selectedObject: BrowserObject;

  public footerInfo: string;
  public reversedPath: string;
  private isSelectedObjectTopNode: boolean;

  public ngOnChanges(changes: SimpleChanges): void {
    if ((changes.hasOwnProperty('selectedObject') && changes.selectedObject.currentValue.HasChild) || changes.hasOwnProperty('cnsLabel')) {
      this.assignFooterInfo(this.cnsLabel, this.tileItem);
    }
  }

  private assignFooterInfo(activeLabel: CnsLabel, tileItem: any): void {
    if (isNullOrUndefined(activeLabel)) {
      this.footerInfo = this.formatTilePath(this.tileItem.Location, false);
    } else {
      if (
        activeLabel.cnsLabel === CnsLabelEn.Description ||
        activeLabel.cnsLabel === CnsLabelEn.DescriptionAndAlias ||
        activeLabel.cnsLabel === CnsLabelEn.DescriptionAndName
      ) {
        this.footerInfo = this.formatTilePath(this.tileItem.Location, false);
      } else {
        this.footerInfo = this.formatTilePath(this.tileItem.Designation, true);
      }
    }
  }

  private formatTilePath(path: string, isName: boolean): string {
    let splitStr: string;
    let splitIndex: number;
    if (isName) {
      const name = this.selectedObject.Name;
      // count "." character to see if the tile items are located directly under top node.
      this.isSelectedObjectTopNode = this.selectedObject.Designation.split('.').length - 1 === 1;
      // split the designation from the selected node name
      splitStr = this.isSelectedObjectTopNode ? name + '.' : '.' + name + '.';
      splitIndex = path.indexOf(splitStr);
      // update path to take the rest after selected object name
      path = path.slice(splitIndex + splitStr.length);
      // remove name of the tile item from the end
      path = path.replace(this.tileItem.Name, '');
    } else {
      const descriptor = this.selectedObject.Descriptor;
      // count "." character to see if the tile items are located directly under top node.
      this.isSelectedObjectTopNode = this.selectedObject.Location.split('.').length - 1 === 1;
      // split the designation from the selected node name
      splitStr = this.isSelectedObjectTopNode ? descriptor + '.' : '.' + descriptor + '.';
      splitIndex = path.indexOf(splitStr);
      // update path to take the rest after selected object descriptor
      path = path.slice(splitIndex + splitStr.length);
      // remove descriptor of the tile item from the end
      path = path.replace(this.tileItem.Descriptor, '');
    }
    // remove trailing "." if exists
    if (path.slice(-1) === '.') {
      path = path.replace(/\.$/, '');
    }
    return path;
  }

}
