import { Component, Input, ViewChild } from '@angular/core';
import {
  BrowserObject
} from '@gms-flex/services';
import { FullSnapInId } from '@gms-flex/core';
import { ButtonPopoverRef } from './data.model';
import { ButtonPopoverComponent } from '../../button-popover/button-popover.component';

@Component({
  selector: 'gms-event-popover',
  templateUrl: './event-popover.component.html',
  styleUrl: './event-popover.component.scss',
  standalone: false
})

/**
 * Event list popover
 * should receive nodes list in order to view events-list
 *
 * @params
 * Required to provide one of the items arrays:
    @Input public nodes: BrowserObject[];
    @Input public designations: string[];
    @Input public srcPropertyIds: string[];
    @Input public hideButton: boolean = false;
 *
 * The popover can be openeed by a button
 *
 * OR by an external trigger
 * @example
 *   @ViewChild("eventPopover") public eventPopover: any;
 *
 *   public toggleEventPopover(): void {
 *      this.eventPopover.toggle();
 *   }
 *
 *   public closeEventPopover(): void {
 *      this.eventPopover.close();
 *   }
 *
 * If hideButton = true, on init the EventPopoverComponent has to receive
 * a defined array of items. Empty array works as well.
 * Otherwise popover will be opened on doubleclick
 * @example
  <gms-event-popover #eventPopover
    [srcPropertyIds]="[]"
    [hideButton]="'true'">
  </gms-event-popover>
 */
export class EventPopoverComponent {

  public eventsCounter: number;

  @Input() public hideButton = false;
  @Input() public fullSnapinID: FullSnapInId = null;
  @Input() public nodes: BrowserObject[];
  @Input() public designations: string[];

  @ViewChild(ButtonPopoverComponent) public popover: ButtonPopoverRef;

  public toggle(): void {
    if (typeof this.popover !== 'undefined') {
      this.popover.toggle();
    }
  }
  public close(): void {
    if (typeof this.popover !== 'undefined') {
      this.popover.close();
    }
  }

}
