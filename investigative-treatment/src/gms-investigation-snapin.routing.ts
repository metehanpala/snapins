import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { InvestigationComponent } from "./snapin/investigation.component";

const investigationRoutes: Routes = [
  {
    path: "",
    component: InvestigationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(investigationRoutes)],
  exports: [RouterModule]
})
export class GmsinvestigationSnapInRoutingModule {}
