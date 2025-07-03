import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocumentSnapInComponent } from './snapin/document-snapin.component';

const documentSnapInRoutes: Routes = [
  {
    path: '',
    component: DocumentSnapInComponent
  }
];

export const documentSnapInRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(documentSnapInRoutes);
