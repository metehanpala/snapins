'use strict';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColHeaderData, CommData } from '../event-data.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'gms-eventgrid-column-dialog',
  templateUrl: './column-dlg.component.html',
  standalone: false
})
export class ColumnDlgComponent {
  public colHeaderData: ColHeaderData[];

  // @Input() public crolHeaderData: ColHeaderData[];
  @Input() public defaultConfig: ColHeaderData[];
  @Input() public headerTitle: string;
  @Input() public bodyTitle: string;
  @Input() public restoreEnabled: boolean;
  @Input() public set myColHeaderData(cols: ColHeaderData[]) {
    this.colHeaderData = cols;
  }
  @Input() public updateColumnsCnfgSubj: Subject<CommData>;

  @Output() public readonly updateColumns: EventEmitter<CommData> = new EventEmitter<CommData>();

  public onUpdateColumns(colData: CommData): void {
    this.updateColumns.emit(colData); // useless
  }
}
