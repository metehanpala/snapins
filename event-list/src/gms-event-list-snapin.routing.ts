import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EventListSnapInComponent } from './snapin/event-list-snapin.component';

const eventListSnapInRoutes: Routes = [
  {
    path: '',
    component: EventListSnapInComponent
  }
];

export const eventListSnapInRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(eventListSnapInRoutes);
