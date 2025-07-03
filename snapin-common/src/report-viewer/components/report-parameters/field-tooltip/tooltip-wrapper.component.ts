import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'gms-tooltip-wrapper',
  template: `
      <div [siTooltip] = "props?.helpText">
        <ng-container #fieldComponent />
      </div>
  `,
  standalone: false
})
export class TooltipFieldWrapperComponent extends FieldWrapper {
}
