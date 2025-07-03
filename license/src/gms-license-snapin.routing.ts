import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LicenseSnapinComponent } from './snapin/license-snapin.component';

const licenseSnapinRoutes: Routes = [
  {
    path: '',
    component: LicenseSnapinComponent
  }
];

export const licenseSnapinRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(licenseSnapinRoutes);