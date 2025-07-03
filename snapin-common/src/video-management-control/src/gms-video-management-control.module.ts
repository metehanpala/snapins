import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HfwControlsModule, TilesViewModule } from '@gms-flex/controls';
import { TraceService } from '@gms-flex/services-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SiCardModule, SiEmptyStateModule, SiSearchBarModule, SiSelectModule } from '@simpl/element-ng';

import { VideoManagementControlComponent } from './control/video-management-control.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/video-management/i18n/', '.json');

@NgModule({ declarations: [VideoManagementControlComponent],
  exports: [VideoManagementControlComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule, FormsModule,
    /* GmsSnapInCommonModule, */ HfwControlsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient, TraceService]
      },
      isolate: true
    }),
    ReactiveFormsModule,
    SiCardModule, SiEmptyStateModule, SiSearchBarModule, SiSelectModule, TilesViewModule], providers: [provideHttpClient(withInterceptorsFromDi())] })

export class GmsVideoManagementControlModule {
  public static forRoot(): ModuleWithProviders<GmsVideoManagementControlModule> {
    return {
      ngModule: GmsVideoManagementControlModule,
      providers: [
        // { provide: HFW_TRANSLATION_FILE_TOKEN, useValue: './@gms-flex/snapin-common/i18n/', multi: true },
        // { provide: ObjectManagerServiceBase, useClass: ObjectManagerService },
        // { provide: ObjectManagerCoreServiceBase, useClass: ObjectManagerCoreService },
        // { provide: EventsCommonServiceBase, useClass: EventsCommonService },
        // { provide: TablesService, useClass: TablesService },
        // { provide: EventService, useClass: EventService },
        // { provide: AboutObjectServiceBase, useClass: AboutObjectService },
        // { provide: MemoPopoverServiceBase, useClass: MemoPopoverService },
        // { provide: IObjectSelection, useClass: ObjectSelectionService },
        // { provide: IQParamService, useClass: SystemQParamService, multi: true },
        // { provide: IQParamService, useClass: EventQParamService, multi: true }
      ]
    };
  }
}
