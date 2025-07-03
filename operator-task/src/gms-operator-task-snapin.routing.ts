import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OperatorTaskSnapinComponent } from './snapin/operator-task-snapin.component';

const operatorTaskSnapInRoutes: Routes = [
  {
    path: '',
    component: OperatorTaskSnapinComponent
  }
];

export const operatorTaskSnapInRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(operatorTaskSnapInRoutes);
