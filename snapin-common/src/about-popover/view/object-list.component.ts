import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AboutObjectServiceBase } from '../services/about-object.service.base';
import { ObjectItemIfc } from '../view-model/object-item';

@Component({
  selector: 'gms-object-list-view',
  templateUrl: './object-list.component.html',
  styleUrl: './container.component.scss',
  standalone: false
})
export class ObjectListViewComponent { // implements OnInit, OnDestroy {

  @Input() public objectList: Readonly<ObjectItemIfc>;
  @Input() public labelTemplate: TemplateRef<any>;
  @Output() public readonly itemSelected: EventEmitter<ObjectItemIfc> = new EventEmitter<ObjectItemIfc>();

  public headerTitle: string;

  constructor(
    aboutObjectService: AboutObjectServiceBase) {

    const ts: TranslateService = aboutObjectService.commonTranslateService;
    ts.get('OM-ABOUT-MULTI-SELECTION-TITLE').subscribe(s => this.headerTitle = s);
  }
  public readonly trackByIndex = (index: number): number => index;

  public onItemSelected(event: MouseEvent, item: ObjectItemIfc): void {
    if (!item) {
      return;
    }
    if (event) {
      event.stopPropagation();
    }
    this.itemSelected.emit(item);
  }

}
