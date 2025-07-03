import { AboutPopoverModule } from './../about-popover/about-popover.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventContentComponent } from './event-content/event-content.component';
import { EventGridComponent } from './event-grid/event-grid.component';
import { EventInfoComponent } from './event-info/event-info.component';
import { EventPopoverComponent } from './event-popover/event-popover.component';
import { EventTableComponent } from './event-table/event-table.component';
import { ButtonPopoverModule } from '../button-popover/button-popover.module';
import { NgxDatatableModule } from '@siemens/ngx-datatable';
import { SiAccordionModule, SiCircleStatusModule,
  SiContentActionBarModule,
  SiEmptyStateModule,
  SiLoadingSpinnerModule, SiMainDetailContainerModule, SiPromptDialogButtonsModule, SiResizeObserverModule, SiTooltipModule } from '@simpl/element-ng';
import { SiDatatableModule } from '@simpl/element-ng/datatable'
import { SiStepperModule } from '@simpl/element-ng/stepper';
import { HfwControlsModule } from '@gms-flex/controls';
import { DocumentViewerModule } from '../document-viewer';
import { GmsVideoManagementControlModule } from '../video-management-control/src/gms-video-management-control.module';
import { ReportViewModule } from '../report-viewer';
import { FormsModule } from '@angular/forms';
import { OwnershipDialogComponent } from './ownership';

@NgModule({
  declarations: [
    // EventAssistedTreatmentComponent,
    EventContentComponent,
    EventGridComponent,
    EventInfoComponent,
    EventPopoverComponent,
    EventTableComponent,
    OwnershipDialogComponent
  ],
  imports: [
    AboutPopoverModule,
    ButtonPopoverModule,
    CommonModule,
    DocumentViewerModule,
    FormsModule,
    GmsVideoManagementControlModule,
    HfwControlsModule,
    NgxDatatableModule,
    ReportViewModule,
    SiAccordionModule,
    SiCircleStatusModule,
    SiContentActionBarModule,
    SiDatatableModule,
    SiEmptyStateModule,
    SiLoadingSpinnerModule,
    SiMainDetailContainerModule,
    SiPromptDialogButtonsModule,
    SiResizeObserverModule,
    SiStepperModule,
    SiTooltipModule
  ],
  exports: [
    // EventAssistedTreatmentComponent,
    EventContentComponent,
    EventGridComponent,
    EventInfoComponent,
    EventPopoverComponent,
    EventTableComponent,
    OwnershipDialogComponent
  ]
})
export class EventsModule { }
