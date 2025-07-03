import { Component, Input } from '@angular/core';

@Component({
  selector: 'gms-button-popover',
  templateUrl: './button-popover.component.html',
  styleUrl: './button-popover.component.scss',
  standalone: false
})
export class ButtonPopoverComponent {

  public isOpen = false;

  @Input() public icon: string;
  @Input() public iconActivated: string;
  @Input() public color = '';
  @Input() public alertsNum: number;
  @Input() public hideButton = false;
  @Input() public disableButton = false;

  public toggle(): void {
    this.isOpen = !this.isOpen;
  }
  public close(): void {
    this.isOpen = false;
  }
}
