import { NgModule } from '@angular/core';
import { IPreselectionService, IStorageService } from '@gms-flex/core';

import { EventListPreselectService } from './services/event-list-preselect.service';
import { EventListStorageService } from './services/event-list-storage.service';

@NgModule({
  providers: [{ provide: IStorageService, useClass: EventListStorageService, multi: true }]
})
export class GmsEventListRootServicesModule {}
