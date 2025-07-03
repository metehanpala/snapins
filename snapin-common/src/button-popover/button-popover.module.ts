import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonPopoverComponent } from './button-popover.component';
import { PopoverModule } from 'ngx-bootstrap/popover';

@NgModule({
  declarations: [
    ButtonPopoverComponent
  ],
  exports: [
    ButtonPopoverComponent
  ],
  imports: [
    CommonModule,
    PopoverModule
  ]
})
export class ButtonPopoverModule { }
