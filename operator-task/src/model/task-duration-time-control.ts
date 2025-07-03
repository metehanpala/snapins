import { FormControl } from '@angular/forms';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { AnyProperty, Property } from '@simpl/buildings-ng';
import { TimeDurationValue } from '@simpl/buildings-types';

export class TaskDurationTimeControl {
  public control: FormControl;
  public controlName: string;
  public timeDurationConfig: Property<TimeDurationValue> = {
    // name: 'Timeduration Property',
    value: {
      type: 'time-duration',
      value: 0,
      resolution: 1,
      min: 0,
      // max: 10080,
      typeMin: 0,
      typeMax: 4294967295,
      unit: 's',
      format: 'dd:hh:mm',
      altText: '0',
      readonly: true
    },
    overrideMode: 'normal'// direct will not have a submit button
  };
  // public valueState: ValueState = 'none';// "none" | "loading" | "passed" | "failed" | "partial"

  private readonly validators = [
    minDurationInvalid
  ];

  public getPropertyValue(): number {
    return this.timeDurationConfig.value.value;
  }
  constructor(controlName: string) {
    this.control = new FormControl<Property<TimeDurationValue>>(this.timeDurationConfig);
    this.controlName = controlName;
  }

  public submitted(prop: AnyProperty): void {
    const val = Number(prop.value.value);
    if (val <= 0) {
      this.control.setErrors({ minDurationInvalid: true }, { emitEvent: true });
    } else {
      this.control.setErrors(null);
    }
  }

  public updateConfigValueAndReadonly(isReadOnly: boolean, val: number): void {
    if (isNullOrUndefined(val)) {
      val = 0;
    }
    this.timeDurationConfig = {
      value: {
        type: 'time-duration',
        value: val,
        resolution: 1,
        min: 0,
        // max: 10080,
        typeMin: 0,
        typeMax: 4294967295,
        unit: 's',
        format: 'dd:hh:mm',
        altText: '0',
        readonly: isReadOnly
      },
      overrideMode: 'normal'// direct will not have a submit button
    };
  }

  public editableControl(val: number): void {
    if (isNullOrUndefined(val)) {
      val = 0;      
    }
    this.timeDurationConfig = {
      value: {
        type: 'time-duration',
        value: val,
        resolution: 1,
        min: 0,
        // max: 10080,
        typeMin: 0,
        typeMax: 4294967295,
        unit: 's',
        format: 'dd:hh:mm',
        altText: '0',
        readonly: false
      },
      overrideMode: 'normal'// direct will not have a submit button
    };

    this.control.setValidators(this.validators);
    this.control.setValue(val);

    // asapScheduler.schedule(() => {
    if (val === 0) {
      this.control.setErrors({ minDurationInvalid: true }, { emitEvent: true });
    }
    this.control.updateValueAndValidity()
    // }, 20);
  }

  public updateValueAndDisableControl(val: number): void {
    this.clearUpdateValidators();
    this.timeDurationConfig = {
      value: {
        type: 'time-duration',
        value: val ?? 0,
        resolution: 1,
        min: 0,
        // max: 10080,
        typeMin: 0,
        typeMax: 4294967295,
        unit: 's',
        format: 'dd:hh:mm',
        altText: '0',
        readonly: true
      },
      overrideMode: 'normal'// direct will not have a submit button
    };

  }

  public clearUpdateValidators(): void {
    this.control.clearValidators();
    this.control.setErrors(null);
    this.control.updateValueAndValidity();
  }
}

export const minDurationInvalid: (control) => ({ minDurationInvalid: boolean } | null) = control => {
  if (control.value <= 0) {
    return { minDurationInvalid: true };
  }
  return null;
};