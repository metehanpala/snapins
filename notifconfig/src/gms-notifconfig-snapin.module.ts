import { CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { notifConfigSnapInRouting } from './gms-notifconfig-snapin.routing';
import { HfwControlsModule } from '@gms-flex/controls';
import { MultiTranslateHttpLoader, ProductService, TraceService } from '@gms-flex/services-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SiAboutModule, SiCardModule, SiMainDetailContainerModule, SiTreeViewModule } from '@simpl/element-ng';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { ModalModule } from 'ngx-bootstrap/modal';

import { AccordionModule } from 'ngx-bootstrap/accordion';

import { NotifConfigSnapInComponent } from './snapin/notifconfig-snapin.component';

export function createTranslateLoader(http: HttpClient, trace: TraceService): MultiTranslateHttpLoader {
  return new MultiTranslateHttpLoader(http, trace, './@gms-flex/notifconfig/i18n/', ['./i18n/']);
}

@NgModule({ declarations: [NotifConfigSnapInComponent],
    exports: [NotifConfigSnapInComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [ButtonsModule, ModalModule,
        TranslateModule.forChild({
            loader: { provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient, TraceService] },
            isolate: true
        }),
        HfwControlsModule,
        CommonModule,
        FormsModule,
        notifConfigSnapInRouting,
        SiAboutModule,
        SiCardModule,
        SiMainDetailContainerModule,
        SiTreeViewModule,
        AccordionModule], providers: [ProductService, provideHttpClient(withInterceptorsFromDi())] })

export class GmsNotifConfigSnapInModule {
  public static forRoot(): ModuleWithProviders<GmsNotifConfigSnapInModule> {
    return {
      ngModule: GmsNotifConfigSnapInModule
    };
  }
}
