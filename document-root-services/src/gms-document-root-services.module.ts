import { NgModule } from '@angular/core';
import { IPreselectionService, IStorageService } from '@gms-flex/core';

import { DocumentPreselectService } from './services/document-preselect.service';
import { DocumentStorageService } from './services/document-storage.service';

@NgModule({
  providers: [{ provide: IPreselectionService, useClass: DocumentPreselectService, multi: true },
    { provide: IStorageService, useClass: DocumentStorageService, multi: true }]
})
export class GmsDocumentRootServicesModule {}
