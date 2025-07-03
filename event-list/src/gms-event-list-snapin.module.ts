import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HfwControlsModule } from '@gms-flex/controls';
import { HFW_TRANSLATION_FILE_TOKEN } from '@gms-flex/services-common';
import { EventsModule, GmsSnapInCommonModule } from '@gms-flex/snapin-common';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SiAccordionModule, SiContentActionBarModule, SiDropdownModule, SiInlineNotificationModule,
  SiPromptDialogButtonsModule, SiSearchBarModule } from '@simpl/element-ng';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { PopoverModule } from 'ngx-bootstrap/popover';

import { EventFilterDlgComponent } from './filter-dialog/filter-dialog.component';
import { eventListSnapInRouting } from './gms-event-list-snapin.routing';
import { EventListSnapInComponent } from './snapin/event-list-snapin.component';

export const createTranslateLoader = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './@gms-flex/event-list/i18n/', '.json');

@NgModule({ declarations: [EventFilterDlgComponent, EventListSnapInComponent],
  exports: [EventListSnapInComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [TranslateModule.forChild({
    loader: { provide: TranslateLoader,
      useFactory: (createTranslateLoader),
      deps: [HttpClient] },
    isolate: false
  }),
  AccordionModule,
  BsDropdownModule,
  CommonModule,
  eventListSnapInRouting,
  EventsModule,
  FormsModule,
  GmsSnapInCommonModule,
  HfwControlsModule,
  ModalModule,
  PopoverModule,
  SiAccordionModule,
  SiContentActionBarModule,
  SiDropdownModule,
  SiInlineNotificationModule,
  SiPromptDialogButtonsModule,
  SiSearchBarModule], providers: [BsModalRef,
    { provide: HFW_TRANSLATION_FILE_TOKEN, useValue: './@gms-flex/event-list/i18n/', multi: true }, provideHttpClient(withInterceptorsFromDi())] })

export class GmsEventListSnapInModule {}
