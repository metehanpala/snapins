import { NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ObjectViewModelIfc } from '../view-model/object-vm.base';

export abstract class AboutObjectServiceBase {

  public readonly commonTranslateService: TranslateService;

  public abstract registerViewModel(id: string, ngZone: NgZone): ObjectViewModelIfc;
  public abstract unregisterViewModel(id: string): void;

}
