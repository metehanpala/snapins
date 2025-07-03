import { NgModule } from '@angular/core';
import { IPreselectionService, IStorageService } from '@gms-flex/core';

import { OperatorTaskPreselectService } from './preselect/operator-task-preselect.service';
import { OperatorTaskStorageService } from './storage/operator-task-storage.service';

@NgModule({
  providers: [
    { provide: IPreselectionService, useClass: OperatorTaskPreselectService, multi: true },
    { provide: IStorageService, useClass: OperatorTaskStorageService, multi: true }
  ],
  declarations: [],
  imports: [
  ],
  exports: []
})
export class GmsOperatorTaskRootServicesModule {}
