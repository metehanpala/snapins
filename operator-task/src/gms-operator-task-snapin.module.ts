import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HfwControlsModule } from '@gms-flex/controls';
import { HfwServicesCommonModule } from '@gms-flex/services-common';
import { AboutPopoverModule, GmsSnapInCommonModule } from '@gms-flex/snapin-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxDatatableModule } from '@siemens/ngx-datatable';
import { SiBigNumberPropertyModule, SiPropertyPopoverModule, SiTimeDurationModule, SiTimedurationPropertyModule } from '@simpl/buildings-ng';
import {
  SiAccordionModule, SiCardModule,
  SiCircleStatusModule,
  SiContentActionBarModule,
  SiDatepickerModule,
  SiEmptyStateModule, SiFormModule, SiIconModule, SiLoadingSpinnerModule,
  SiMainDetailContainerModule,
  SiPromptDialogButtonsModule,
  SiResizeObserverModule, SiSelectModule,
  SiTooltipModule
} from '@simpl/element-ng';
import { SiDatatableModule } from '@simpl/element-ng/datatable';

import { operatorTaskSnapInRouting } from './gms-operator-task-snapin.routing';
import { OperatorTaskSnapinDataService } from './services/operator-task-data.service';
import { OperatorTaskRightsService } from './services/operator-task-rights.service';
import { OperatorTaskSnapinComponent } from './snapin';
import { TaskIdToClipboardDirective } from './views/directives/task-id-clipboard.directive';
import { OperatorTaskContentComponent } from './views/operator-task-content/operator-task-content.component';
import { OperatorTaskInfoComponent } from './views/operator-task-info/operator-task-info.component';

const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/operator-task/i18n/', '.json');

@NgModule({ declarations: [OperatorTaskContentComponent, OperatorTaskInfoComponent, OperatorTaskSnapinComponent, TaskIdToClipboardDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [OperatorTaskSnapinComponent], imports: [AboutPopoverModule,
    CommonModule,
    FormsModule,
    GmsSnapInCommonModule,
    HfwControlsModule,
    HfwServicesCommonModule,
    NgxDatatableModule,
    operatorTaskSnapInRouting,
    ReactiveFormsModule,
    SiAccordionModule,
    SiBigNumberPropertyModule,
    SiCardModule,
    SiCircleStatusModule,
    SiContentActionBarModule,
    SiDatatableModule,
    SiDatepickerModule,
    SiEmptyStateModule,
    SiFormModule,
    SiIconModule,
    SiLoadingSpinnerModule,
    SiMainDetailContainerModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      },
      isolate: true
    }),
    SiPromptDialogButtonsModule,
    SiPropertyPopoverModule,
    SiResizeObserverModule,
    SiSelectModule,
    SiTimeDurationModule,
    SiTimedurationPropertyModule,
    SiTooltipModule], providers: [OperatorTaskRightsService, OperatorTaskSnapinDataService, provideHttpClient(withInterceptorsFromDi())] })
export class GmsOperatorTaskSnapinModule {}