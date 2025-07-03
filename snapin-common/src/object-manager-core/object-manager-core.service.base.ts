import { NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { BrowserObject } from '@gms-flex/services';
import { ObjectManagerViewModelIfc } from './view-model/object-manager-vm';
import { AggregateViewIfc } from './data-model/aggregate-view';

export { AggregateViewIfc };

export abstract class ObjectManagerCoreServiceBase {

  public readonly commonTranslateService: TranslateService;

  public abstract getViews(): Observable<readonly AggregateViewIfc[]>;

  public abstract findObject(designation: string): Observable<BrowserObject>;

  public abstract findPathObjects(designation: string): Observable<BrowserObject[]>;

  public abstract registerViewModel(id: string, ngZone: NgZone): ObjectManagerViewModelIfc;

  public abstract unregisterViewModel(id: string): void;

  public abstract updateVmFilter(): void;

}
