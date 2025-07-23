import { NgModule } from '@angular/core';
import { IPreselectionService, IStorageService } from '@gms-flex/core';

import { TextPreselectService } from './services/text-preselect.service';
import { TextStorageService } from './services/text-storage.service';

@NgModule({
  providers: [{ provide: IPreselectionService, useClass: TextPreselectService, multi: true },
    { provide: IStorageService, useClass: TextStorageService, multi: true }]
})
export class GmsTextualViewerRootServicesModule {}
