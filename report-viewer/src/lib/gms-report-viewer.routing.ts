import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReportViewerSnapInComponent } from './snapin/report-viewer-snapin.component';

const REPORT_VIEWER_SNAPIN_ROUTES: Routes = [
  {
    path: '',
    component: ReportViewerSnapInComponent
  }
];

export const REPORT_VIEWER_SNAPIN_ROUTING: ModuleWithProviders<RouterModule> = RouterModule.forChild(REPORT_VIEWER_SNAPIN_ROUTES);
