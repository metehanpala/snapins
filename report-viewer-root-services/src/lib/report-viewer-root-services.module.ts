import { NgModule } from '@angular/core';
import { IPreselectionService, IStorageService } from '@gms-flex/core';

import { ReportViewerPreselectService } from './preselect/report-viewer-preselect.service';
import { ReportViewerRootServicesComponent } from './report-viewer-root-services.component';
import { ReportViewerStorageService } from './storage/report-viewer-storage.service';

@NgModule({
  declarations: [
    ReportViewerRootServicesComponent
  ],
  imports: [
  ],
  exports: [
    ReportViewerRootServicesComponent
  ],
  providers: [{ provide: IPreselectionService, useClass: ReportViewerPreselectService, multi: true },
    { provide: IStorageService, useClass: ReportViewerStorageService, multi: true }]
})

export class ReportViewerRootServicesModule { }
