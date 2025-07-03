/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewMasterComponent } from './components/preview-master/preview-master.component';
import { ReportViewComponent } from './report-view/report-view.component';
import { SiContentActionBarModule, SiDropdownModule, SiEmptyStateModule, SiFormModule, SiIconModule, SiLoadingSpinnerModule,
  SiMainDetailContainerModule, SiResizeObserverModule, SiSearchBarModule, SiTooltipModule, SiTypeaheadModule } from '@simpl/element-ng';
import { SiDatatableModule } from '@simpl/element-ng/datatable';
import { ReportViewerService } from './services/report-viewer.service';
import { DocumentRenderComponent } from './components/document-render/document-render.component';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HistoryViewComponent } from './components/history-view/history-view.component';
import { ApplicationRulesComponent } from './components/application-rules/application-rules.component';
import { AdvancedReportParametersComponent } from './components/report-parameters/advance-report-parameters.component';
import { SiFormlyModule } from '@simpl/element-ng/formly';
import { TooltipFieldWrapperComponent } from './components/report-parameters/field-tooltip/tooltip-wrapper.component';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FORMLY_CONFIG } from '@ngx-formly/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditableControlsComponent } from './components/editable-controls/editable-controls.component';
import { NgxDatatableModule } from '@siemens/ngx-datatable';

// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './@gms-flex/snapin-common/i18n/', '.json');
}

export function formlyValidationConfig(translate: TranslateService) {
  return {
    validationMessages: [
      {
        name: 'required',
        message() {
          return translate.stream('REPORT-VIEWER.ADVANCE_REPORTING.REQUIRED');
        }
      }
    ]
  };
}
@NgModule({
  declarations: [
    AdvancedReportParametersComponent,
    ApplicationRulesComponent,
    DocumentRenderComponent,
    EditableControlsComponent,
    HistoryViewComponent,
    PreviewMasterComponent,
    ReportViewComponent,
    TooltipFieldWrapperComponent
  ],
  exports: [
    ReportViewComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxDatatableModule,
    ReactiveFormsModule,
    SiContentActionBarModule,
    SiDatatableModule,
    SiDropdownModule,
    SiEmptyStateModule,
    SiFormlyModule.forRoot(
      {
        wrappers: [
          { name: 'tooltip', component: TooltipFieldWrapperComponent }
        ]
      }),
    SiFormModule,
    SiIconModule,
    SiLoadingSpinnerModule,
    SiMainDetailContainerModule,
    SiResizeObserverModule,
    SiSearchBarModule,
    SiTooltipModule,
    SiTypeaheadModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [ReportViewerService,
    { provide: FORMLY_CONFIG, multi: true, useFactory: formlyValidationConfig, deps: [TranslateService] }]
})
export class ReportViewModule { }
