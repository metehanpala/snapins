import { NgModule } from '@angular/core';
import { IPreselectionService, IStorageService } from '@gms-flex/core';

import { ReportViewerPreselectService } from './preselect/report-viewer-preselect.service';
import { ReportViewerStorageService } from './storage/report-viewer-storage.service';

@NgModule({
  providers: [
    { provide: IPreselectionService, useClass: ReportViewerPreselectService, multi: true },
    { provide: IStorageService, useClass: ReportViewerStorageService, multi: true }
  ],
  declarations: [],
  imports: [
  ],
  exports: []
})
export class GmsReportViewerRootServicesModule {}
