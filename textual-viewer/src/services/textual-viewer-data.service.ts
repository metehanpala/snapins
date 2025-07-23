import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { GridData, GridVirtualizedArgs } from '../textual-viewer-data.model';

@Injectable()
export class TextualViewerDataService {
  public gridVirtualizedChanged: Subject<GridVirtualizedArgs> = new Subject<GridVirtualizedArgs>();
  private items: GridData[];
  public resetVirtualizedItemList(itemsAll: GridData[]): void {
    this.items = itemsAll;
    this.gridVirtualizedChanged.next(new GridVirtualizedArgs(this.items, true));
  }
}
