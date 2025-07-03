import { Injectable } from '@angular/core';
import { ValidationEditInfo, ValidationInput, ValidationResult, ValidationResultStatus } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { ValidationDialogService } from '../../validation-dialog/services/validation-dialog.service';
import { Observable } from 'rxjs';

/* eslint-disable @typescript-eslint/naming-convention */

@Injectable({ providedIn: 'root' })
export class LogViewerValidationHelperService {
  constructor(private readonly validationService: ValidationDialogService,
    public traceService: TraceService) { }

  public LogViewerValidationService(objectIds: string[], traceModule: string): Observable<ValidationInput> {
    const observable: Observable<ValidationInput> = new Observable<ValidationInput>(observer => {
      let validationInput: ValidationInput;
      const validationInfo = new ValidationEditInfo(objectIds);
      const validationSubscription = this.validationService.show(validationInfo).subscribe((result: ValidationResult) => {
        if (result.Status === ValidationResultStatus.Success) {
          validationInput = {
            Message: '',
            Password: result.Password,
            SuperName: result.SuperName,
            SuperPassword: result.SuperPassword,
            Comments: result.Comments,
            SessionKey: result.SessionKey
          };
          this.traceService.info(traceModule, 'Validate Result: User Comment: %s, Super Name: %s, Message: %s ',
            result.Comments, result.SuperName, validationInput.Message);
          observer.next(validationInput);
        } else if (result.Status === ValidationResultStatus.Cancelled) {
          this.traceService.info(traceModule, 'getValidationProfileInput(): Validation of object is cancelled.');
          observer.next(validationInput);
        } else {
          this.traceService.error(traceModule, 'Validate object : Status: %s, Error: %s',
            ValidationResultStatus[result.Status], result.Error);
          observer.next(null);
        }
        observer.complete();
        validationSubscription.unsubscribe();
      });
    });
    return observable;
  }
}
