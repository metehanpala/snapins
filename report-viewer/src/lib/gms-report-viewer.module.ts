/* eslint-disable */
import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HfwControlsModule, SearchApi, TilesViewModule } from '@gms-flex/controls';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SiAccordionModule, SiActionDialogModule, SiActionDialogService, SiCardModule, SiContentActionBarModule, SiDropdownModule, SiEmptyStateModule, SiLoadingSpinnerModule, SiResizeObserverModule, SiSearchBarModule, SiToastNotificationService } from '@simpl/element-ng';
import { REPORT_VIEWER_SNAPIN_ROUTING } from './gms-report-viewer.routing';
import { ReportViewerSnapInComponent } from './snapin';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ReportViewerService } from './services';
import { SearchViewComponent } from './search';
import { GmsSnapInCommonModule, ReportViewModule } from '@gms-flex/snapin-common';
import { ModalModule } from 'ngx-bootstrap/modal';
//import { SearchApiService } from './shared/report-search.api';

export function createTranslateLoader(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './@gms-flex/report-viewer/i18n/', '.json');
}

// export function SearchApiFactory(searchService: ReportViewerService): SearchApiService {
//   return new SearchApiService(searchService);
// }

@NgModule({ declarations: [ReportViewerSnapInComponent, SearchViewComponent],
    exports: [ReportViewerSnapInComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
        FormsModule,
        GmsSnapInCommonModule,
        HfwControlsModule,
        ModalModule,
        REPORT_VIEWER_SNAPIN_ROUTING,
        SiAccordionModule,
        SiActionDialogModule,
        SiEmptyStateModule,
        SiSearchBarModule,
        SiCardModule,
        ReportViewModule,
        SiContentActionBarModule,
        SiDropdownModule,
        SiLoadingSpinnerModule,
        SiResizeObserverModule,
        TilesViewModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            },
            isolate: true
        })], providers: [ReportViewerService, SiActionDialogService, SiToastNotificationService, provideHttpClient(withInterceptorsFromDi())] })

export class GmsReportViewerModule { }
