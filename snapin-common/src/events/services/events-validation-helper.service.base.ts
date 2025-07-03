import { TranslateService } from '@ngx-translate/core';
import { ValidationInput } from '@gms-flex/services';
import { Observable } from 'rxjs';

export abstract class EventsValidationHelperServiceBase {

  public readonly commonTranslateService: TranslateService;

  public abstract getTranslations(): void;

  public abstract validateEventCommands(eventIds: string[], traceModule: string): Observable<ValidationInput>;
}
