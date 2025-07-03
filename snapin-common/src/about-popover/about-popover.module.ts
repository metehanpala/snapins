import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutObjectComponent } from './about-object.component';
import { AboutObjectContainerComponent } from './view/container.component';
import { CdkContextMenuTrigger, CdkMenuTrigger } from '@angular/cdk/menu';
import { ObjectInfoViewComponent } from './view/object-detail.component';
import { ObjectListViewComponent } from './view/object-list.component';
import { ObjectPathViewComponent } from './view/object-path.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { SiAccordionModule, SiInlineNotificationModule } from '@simpl/element-ng';
import { SiMenuModule } from '@simpl/element-ng/menu';

@NgModule({
  declarations: [
    AboutObjectComponent,
    AboutObjectContainerComponent,
    ObjectInfoViewComponent,
    ObjectListViewComponent,
    ObjectPathViewComponent
  ],
  exports: [
    AboutObjectComponent,
    AboutObjectContainerComponent,
    ObjectInfoViewComponent,
    ObjectListViewComponent,
    ObjectPathViewComponent
  ],
  imports: [
    CdkContextMenuTrigger, 
    CdkMenuTrigger,
    CommonModule,
    PopoverModule,
    SiAccordionModule,
    SiInlineNotificationModule,
    SiMenuModule
  ]
})
export class AboutPopoverModule { }
