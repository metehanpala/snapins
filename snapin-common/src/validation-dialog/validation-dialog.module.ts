import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ValidationMenuComponent } from './validation-menu/validation-menu.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SiFormModule, SiInlineNotificationModule } from '@simpl/element-ng';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CredentialsComponent } from './validation-menu/credentials.component';
import { ValidationDialogService } from './services/validation-dialog.service';
import { CommonModule } from '@angular/common';

export const createTranslateLoaderLocal = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/snapin-common/i18n/', '.json');

@NgModule({ declarations: [
  CredentialsComponent,
  ValidationMenuComponent
],
exports: [ValidationMenuComponent], imports: [CommonModule,
  SiFormModule,
  TranslateModule.forChild({
    loader: {
      provide: TranslateLoader,
      useFactory: (createTranslateLoaderLocal),
      deps: [HttpClient]
    },
    isolate: true
  }),
  SiInlineNotificationModule], providers: [ValidationDialogService, provideHttpClient(withInterceptorsFromDi())] })

export class ValidationDialogModule { }
