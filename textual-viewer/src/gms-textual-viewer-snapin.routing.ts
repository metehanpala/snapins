import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TextualViewerSnapInComponent } from './snapin/textual-viewer-snapin.component';

const routes: Routes = [
  {
    path: '',
    component: TextualViewerSnapInComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TextSnapInRoutingModule {}
