import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxDatatableModule } from '@siemens/ngx-datatable';
import {
  SiCircleStatusModule,
  SiColumnSelectionModalModule,
  SiContentActionBarModule,
  SiLoadingSpinnerModule
} from '@simpl/element-ng';

import { TextSnapInRoutingModule } from './gms-textual-viewer-snapin.routing';
import { TextualViewerDataService } from './services/textual-viewer-data.service';
import { TextualViewerStateStorageService } from './services/textual-viewer-state-storage.service';
import { TextualViewerSnapInComponent } from './snapin/textual-viewer-snapin.component';
import { TextualViewerComponent } from './snapin/view/textual-viewer.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/textual-viewer/i18n/', '.json');

@NgModule({ declarations: [TextualViewerSnapInComponent,
  TextualViewerComponent],
exports: [TextualViewerSnapInComponent],
schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [TranslateModule.forChild({
  loader: { provide: TranslateLoader,
    useFactory: (createTranslateLoader),
    deps: [HttpClient] },
  isolate: true
}), CommonModule,
FormsModule,
SiLoadingSpinnerModule,
TextSnapInRoutingModule,
SiColumnSelectionModalModule,
SiCircleStatusModule,
SiContentActionBarModule,
NgxDatatableModule], providers: [TextualViewerStateStorageService, TextualViewerDataService, provideHttpClient(withInterceptorsFromDi())] })

export class GmsTextualViewerSnapInModule {}
