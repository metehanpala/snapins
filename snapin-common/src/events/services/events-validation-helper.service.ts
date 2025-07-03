/* eslint-disable @typescript-eslint/naming-convention */ // Disabled it because ValidationInput data is structured with uppercase
import { Injectable } from '@angular/core';
import { ValidationCommandInfo, ValidationEditInfo, ValidationInput, ValidationResultStatus } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { ValidationDialogService } from '../../validation-dialog/services/validation-dialog.service';
import { catchError, Observable, Subscription, throwError } from 'rxjs';
import { SiToastNotificationService } from '@simpl/element-ng';
import { TranslateService } from '@ngx-translate/core';
import { EventsValidationHelperServiceBase } from './events-validation-helper.service.base';

@Injectable({ providedIn: 'root' })
export class EventsValidationHelperService implements EventsValidationHelperServiceBase {

  public commandValidationCancelled: '';

  constructor(private readonly validationService: ValidationDialogService,
    public traceService: TraceService,
    private readonly toastNotificationService: SiToastNotificationService,
    private readonly translateService: TranslateService) {
    this.getTranslations();
  }

  public get commonTranslateService(): TranslateService {
    return this.translateService;
  }

  public getTranslations(): void {
    this.translateService.get([
      'VALIDATION-DIALOG.VALIDATION-CANCELLED'
    ]).subscribe(res => {
      this.commandValidationCancelled = res['VALIDATION-DIALOG.VALIDATION-CANCELLED'];
    });
  }

  public validateEventCommands(eventIds: string[], traceModule: string): Observable<ValidationInput> {
    const validateMessage = 'Validation for the events - Event: ' + eventIds;
    const observable: Observable<ValidationInput> = new Observable<ValidationInput>(observer => {
      let validationInput: ValidationInput;
      const validationCommand: ValidationCommandInfo = new ValidationCommandInfo(eventIds, 0);
      const validationSubscription = this.validationService.show(validationCommand).subscribe(result => {
        if (result.Status === ValidationResultStatus.Success) {
          validationInput = {
            Message: validateMessage,
            Password: result.Password,
            SuperName: result.SuperName,
            SuperPassword: result.SuperPassword,
            Comments: result.Comments,
            SessionKey: result.SessionKey
          };
          this.traceService.info(traceModule, 'Validate Result: Comment: %s, Username: %s, Super Name: %s, Message: %s, Session Key: %s',
            result.Comments, result.Password, result.SuperName, validationInput.Message, validationInput.SessionKey);
          observer.next(validationInput);
          observer.complete();
        } else if (result.Status === ValidationResultStatus.Cancelled) {
          this.traceService.info(traceModule, 'validateEventCommands(): Validation of event is cancelled.');
          this.toastNotificationService.queueToastNotification('danger', 'EVENTS.EVENT-COMMANDING-FAILURE', this.commandValidationCancelled + '.');
          observer.next(validationInput);
          observer.complete();
        } else {
          this.traceService.error(traceModule, 'ValidationHelper object : Status: %s, Error: %s',
            ValidationResultStatus[result.Status], result.Error);
          observer.error(result.Error);
          observer.complete();
        }
        validationSubscription.unsubscribe();
      });
    });
    return observable;

  }
}
