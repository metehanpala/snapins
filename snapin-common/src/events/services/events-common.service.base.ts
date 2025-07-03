import { TranslateService } from '@ngx-translate/core';
import { Event } from '@gms-flex/services';
import { Observable, Subject } from 'rxjs';

export abstract class EventsCommonServiceBase {

  public readonly commonTranslateService: TranslateService;

  public abstract resetColumnsToDefault: Subject<boolean>;

  public abstract autoAssistedEvents: Subject<any>;

  public abstract treatedEvent: any;

  public abstract isInAssistedMode: boolean;

  public abstract isInInvestigativeMode: boolean;

  public abstract destinationFrame: string;

  public abstract mainDetailResizeSubject: Subject<boolean>;

  public abstract mainDetailResize$: Observable<boolean>;

  public abstract subscribeColumnsResetting(): Observable<boolean>;

  public abstract goToInvestigativeTreatment(event: Event): void;

  public abstract exitFromInvestigativeTreatment(event: Event): void;

  public abstract goToAssistedTreatment(selectedEvents: any): Observable<any>;

  public abstract exitFromAssistedTreatment(selectedEvents: any): Observable<any>;

  public abstract cacheSelectedEvents(events: Event[]): void;

  public abstract getCachedSelectedEvents(): Event[];

  public abstract hasCachedSelectedEvents(): boolean;

  public abstract resetCachedSelectedEvents(): void;

  public abstract getNoRightsLabel(): Promise<string>;
}
