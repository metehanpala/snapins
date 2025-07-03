import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HfwControlsModule, TilesViewModule } from '@gms-flex/controls';
import { DocumentViewerModule, GmsSnapInCommonModule } from '@gms-flex/snapin-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SiCardModule, SiEmptyStateModule, SiLoadingSpinnerModule, SiSearchBarModule, SiToastNotificationService } from '@simpl/element-ng';

import { documentSnapInRouting } from './gms-document-snapin.routing';
import { SearchViewComponent } from './search/search.component';
import { DocumentSnapinService } from './services/document-snapin.service';
import { DocumentSnapInComponent } from './snapin/document-snapin.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/document/i18n/', '.json');

@NgModule({ declarations: [
  DocumentSnapInComponent,
  SearchViewComponent
],
exports: [DocumentSnapInComponent],
schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule, documentSnapInRouting, DocumentViewerModule, FormsModule, GmsSnapInCommonModule,
  HfwControlsModule, SiCardModule, SiEmptyStateModule,
  SiLoadingSpinnerModule,
  SiSearchBarModule,
  TilesViewModule,
  TranslateModule.forChild({
    loader: { provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [HttpClient] },
    isolate: true
  })], providers: [DocumentSnapinService, SiToastNotificationService, provideHttpClient(withInterceptorsFromDi())] })

export class GmsDocumentSnapInModule {}
