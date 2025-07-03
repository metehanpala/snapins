import { CommonModule } from "@angular/common";
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GmsSnapInCommonModule } from "@gms-flex/snapin-common";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { SiActionDialogModule, SiCircleStatusModule, SiContentActionBarModule } from "@simpl/element-ng";

import { GmsinvestigationSnapInRoutingModule } from "./gms-investigation-snapin.routing";
import { InvestigationComponent } from "./snapin/investigation.component";

export function createTranslateLoader(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, "./@gms-flex/investigative-treatment/i18n/", ".json");
}

@NgModule({ declarations: [
  InvestigationComponent
],
exports: [
  InvestigationComponent
],
schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule, GmsinvestigationSnapInRoutingModule,
  TranslateModule.forChild({
    loader: { provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [HttpClient] },
    isolate: true
  }),
  SiActionDialogModule,
  FormsModule,
  SiContentActionBarModule,
  SiCircleStatusModule,
  GmsSnapInCommonModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class GmsInvestigationSnapinModule { }
