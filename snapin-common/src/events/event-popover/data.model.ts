import { ElementRef } from '@angular/core';

export class EventPopoverHeader {
  public primary?: string;
  public secondary?: string;
  public icon?: string;
}

export class ButtonPopoverRef extends ElementRef {
  public toggle(): void {
  }
  public close(): void {
  }
}
