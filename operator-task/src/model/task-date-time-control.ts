import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DatepickerInputConfig } from '@simpl/element-ng';
import { interval, Subscription } from 'rxjs';

import { Utility } from '../shared/utility';
import { DateOption } from '../types/operator-task-date-options';
import { OperatorTaskModel } from './operator-task-model';

export class TaskDateTimeControl {
  public control: FormControl;
  public controlName: string;
  public dateConfig: DatepickerInputConfig;

  private readonly validators = [
    minDatetimeValidator()  
  ];

  private rangeValidationSubscription: Subscription = undefined;
  private minDateSubscription: Subscription = undefined;

  constructor(name: string) {
    this.controlName = name;
    this.control = new FormControl(undefined);
    this.dateConfig = this.createDateInputConfig();
  }

  public getValue(): any {
    return this.control.value;
  }  

  public unsubscribeSubscriptions(from: string): void {
    this.control.clearValidators();
    this.minDateSubscription?.unsubscribe();
    this.unsubscribeDateRangeValidation();
  }

  public disableControlAndUnsubscribe(from: string): void {
    this.control.disable();
    this.clearValidatorsAndUnsubscribe(from);
  }

  public clearValidatorsAndUnsubscribe(from: string): void {
    this.minDateSubscription?.unsubscribe();
    this.unsubscribeDateRangeValidation();
    // force to clear all validators, was causing the save button to be disabled on duplicated
    // with expired time, then change type to duration
    this.control.setValidators([]);
    this.control.updateValueAndValidity();
  }

  public clearRangeValidation(): void {
    // remove the range error when other control switches to non datetime
    this.unsubscribeDateRangeValidation();
    this.control.updateValueAndValidity();
  }

  public editableControl(selectedTask: OperatorTaskModel, isStart: boolean): void {
    const currentDate = new Date();
    this.control.setValidators(this.validators);
    if (isStart) {
      const dateToUse = !this.useTimeRunProperty(selectedTask)
        ? new Date(selectedTask.deferTime)
        : new Date(selectedTask.deferTimeRun);
        
      if (dateToUse?.toLocaleString() === Utility.UNSET_DATE_TIME_DATE.toLocaleString()) {        
        this.control.setValue(currentDate);
      } else if (selectedTask.deferTime) {
        this.control.setValue(dateToUse);
      } else {
        this.control.setValue(0);
        this.control.setErrors({ minDate: true });
      }
    } else {
      const dateToUse = !this.useTimeRunProperty(selectedTask)
        ? new Date(selectedTask.expirationTime)
        : new Date(selectedTask.expirationTimeRun);
      
      if (dateToUse?.toLocaleString() === Utility.UNSET_DATE_TIME_DATE.toLocaleString()) {        
        this.control.setValue(currentDate);
      } else if (selectedTask.expirationTime) {
        this.control.setValue(dateToUse);
      } else {
        this.control.setValue(0);
        this.control.setErrors({ minDate: true });
      }
    }

    const value = new Date(this.control.value);
    // force the error when time is expired
    if (currentDate.getTime() >= value.getTime()) {
      this.control.setErrors({ minDate: true }, { emitEvent: true });
      this.control.markAsTouched();
    }

    this.control.updateValueAndValidity();
  }

  public minDateValidation(): void {
    this.minDateSubscription = interval(30000)
      .subscribe(() => {

        if (this.control.disabled === true) {
          return;
        }

        const value = new Date(this.control.value);
        const currentDate = new Date();

        const currentErrors: ValidationErrors = { ...(this.control.errors || {}) };

        if (currentDate.getTime() >= value.getTime()) {
          currentErrors.minDate = true;
        } else {
          delete currentErrors.minDate;
        }

        if (!this.areErrorsEqual(this.control.errors, currentErrors)) {
          this.control.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        }
      });

    this.updateControl(this.control);
  }  

  public unsubscribeDateRangeValidation(): void {
    if (this.rangeValidationSubscription !== undefined) {
      if (!this.rangeValidationSubscription.closed) {
        this.rangeValidationSubscription.unsubscribe();
      }
      this.rangeValidationSubscription = undefined;
    }
  }

  public subscribeDateRangeValidation(otherOption: DateOption, otherControl: FormControl, isStart: boolean): void {

    this.unsubscribeDateRangeValidation();
    // Note this is called at every input as implemented by simpl, not when the modal closes
    this.rangeValidationSubscription = this.control.valueChanges.subscribe(ownValue => {
      if (this.control.disabled === true) {
        return;
      }

      if (otherOption === DateOption.DateTime) {
        const other = otherControl.value;
        const code = isStart ? 'startRangeInvalid' : 'endRangeInvalid';
        const currentErrors: ValidationErrors = { ...(this.control.errors || {}) };

        if (isStart) {
          if (ownValue !== undefined && ownValue >= other) {
            currentErrors[code] = true;
          } else {
            delete currentErrors[code];
          }
        } else {
          if (ownValue !== undefined && ownValue <= other) {
            currentErrors[code] = true;
          } else {
            delete currentErrors[code];
          }
        }

        if (!this.areErrorsEqual(this.control.errors, currentErrors)) {
          this.control.setErrors(Object.keys(currentErrors).length ? currentErrors : null);

          // Force revalidate the other control
          if (otherControl.disabled === false) {
            this.updateControl(otherControl);
          }
        }
      }
    });
  }

  private updateControl(ctrl: FormControl): void {
    const intervalId = setInterval(() => {
      ctrl.updateValueAndValidity({ onlySelf: true });
      clearInterval(intervalId); // only run once
    }, 0);
  }

  private createDateInputConfig(): DatepickerInputConfig {
    const currentDate = new Date();
    return {
      showTime: true,
      showSeconds: false,
      showMinutes: true,
      mandatoryTime: true,
      maxDate: undefined,
      minDate: currentDate,
      enableTimeValidation: true,
      hideWeekNumbers: true,
      weekStartDay: 'sunday',
      showMilliseconds: false,
      disabledTime: false,
      dateFormat: 'dd/MM/yyyy'         
    };
  }

  private areErrorsEqual(errorsA: ValidationErrors | null, errorsB: ValidationErrors | null): boolean {
    if (!errorsA && !errorsB) {
      return true;
    }

    if (!errorsA || !errorsB) {
      return false;
    }

    const keysA = Object.keys(errorsA);
    const keysB = Object.keys(errorsB);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every(key =>
      JSON.stringify(errorsA[key]) === JSON.stringify(errorsB[key])
    );
  }

  private useTimeRunProperty(selectedTask: OperatorTaskModel): boolean {
    // Fix for issue when task is failed, the current date shows instead
    // of the correct value
    return Utility.isRunningOrExpiredStatus(selectedTask.status);
  }
}

export const minDatetimeValidator: () => ValidatorFn = () => (control: AbstractControl): ValidationErrors | null => {
  const currentDate = new Date();
  const value = new Date(control.value);
  if (currentDate >= value) {
    return { minDate: true };
  } else {
    return null;
  }
};