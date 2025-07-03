import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NotifConfigSnapInComponent } from './snapin/notifconfig-snapin.component';

const notifConfigSnapInRoutes: Routes = [
  {
    path: '',
    component: NotifConfigSnapInComponent
  }
];

export const notifConfigSnapInRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(notifConfigSnapInRoutes);
