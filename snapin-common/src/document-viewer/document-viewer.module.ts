import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentViewerComponent, SafePipe } from './document-viewer.component';
import { SiEmptyStateModule, SiLoadingSpinnerModule } from '@simpl/element-ng';
import { HfwControlsModule } from '@gms-flex/controls';

@NgModule({
  declarations: [
    DocumentViewerComponent,
    SafePipe
  ],
  exports: [
    DocumentViewerComponent
  ],
  imports: [
    CommonModule,
    HfwControlsModule,
    SiEmptyStateModule,
    SiLoadingSpinnerModule
  ]
})
export class DocumentViewerModule { }
