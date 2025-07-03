import { NgModule } from "@angular/core";
import { IPreselectionService } from "@gms-flex/core";

import { LicenseRootServicesComponent } from './services/license-preselect.service';

@NgModule({
  providers: [{ provide: IPreselectionService, useClass: LicenseRootServicesComponent, multi: true }]
})
export class GmsLicenseRootServicesModule {}