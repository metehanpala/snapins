import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { HFW_TRANSLATION_FILE_TOKEN } from '@gms-flex/services-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxDatatableModule } from "@siemens/ngx-datatable";
import { SiCircleStatusModule, SiEmptyStateModule, SiInlineNotificationComponent, SiResizeObserverModule, SiSliderModule } from "@simpl/element-ng";
import { SI_DATATABLE_CONFIG, SiDatatableModule } from "@simpl/element-ng/datatable";
import { SiSearchBarComponent } from '@simpl/element-ng/search-bar';

import { licenseSnapinRouting } from "./gms-license-snapin.routing";
import { LicenseSnapinComponent } from './snapin/license-snapin.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/license/i18n/', '.json');

@NgModule({ declarations: [LicenseSnapinComponent],
  exports: [LicenseSnapinComponent], imports: [CommonModule,
    licenseSnapinRouting,
    NgxDatatableModule.forRoot(SI_DATATABLE_CONFIG),
    SiCircleStatusModule,
    SiDatatableModule,
    SiEmptyStateModule,
    SiInlineNotificationComponent,
    SiResizeObserverModule,
    SiSearchBarComponent,
    SiSliderModule,
    TranslateModule.forChild({
      loader: { provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient] },
      isolate: true
    })], providers: [{ provide: HFW_TRANSLATION_FILE_TOKEN, useValue: './@gms-flex/license/i18n/', multi: true }, provideHttpClient(withInterceptorsFromDi())]})
export class GmsLicenseSnapinModule {}