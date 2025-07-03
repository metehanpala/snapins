import { BACnetDateTimeDetail } from '@gms-flex/controls';
import {
  CommandParameters,
  EnumerationItem,
  IRuntimeValue,
  PropertyDetails
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { parseLong } from '@gms-flex/snapin-common';
import { AnyProperty, Property, ValueState } from '@simpl/buildings-ng';
import { BigNumberValue } from '@simpl/buildings-types';
import { DatepickerInputConfig, SelectOption } from '@simpl/element-ng';
import Long from 'long';
import { asapScheduler } from 'rxjs';

import { TraceModules } from '../shared';
import { BACnetDateTimeFormatter } from '../shared/BACnetDateTimeFormatter';
import { Utility } from '../shared/utility';
import {
  eGmsDataType,
  OverridableParameters,
  ParameterType
} from '../types/overridable-parameter-types';
import { OperatorTaskTargetViewModel } from '../view-model/operator-task-target-vm';
import { TargetModel } from './target-model';

export enum ParameterControl {
  TextBox = 0,
  Spinner = 1,
  ComboBox = 2,
  DatePicker = 3
}

export class OperatorTaskParameterModel {
  public get disableComboBox(): boolean {
    return this._disableComboBox;
  }

  public set disableComboBox(value: boolean) {
    this._disableComboBox = value;

    if (!this.model.isEditing()) {
      this._disableComboBox = true;
    }
  }
  public get useOriginalValue(): boolean {
    return this._useOriginalValue;
  }

  public set useOriginalValue(value: boolean) {
    this._useOriginalValue = value;
    if (!this.isInitializing) {
      this.vm.parameterValuesChanged = true;
    }
  }

  public get editableValue(): any {
    return this._editableValue;
  }

  public set editableValue(value: any) {
    if (!this.isInitializing) {
      this.vm.parameterValuesChanged = value !== this._editableValue;
    }

    this._editableValue = value;

    if (!isNullOrUndefined(this.editableValue)) {
      // check if there is a default value with same object model
      if (!this.vm.isAligningDefaultValue && this.model.isEditing() && !this.vm.isSavingTarget) {
        const hasDefaultValueSet = this.vm.hasDefaultValueSet(this.model.objectModel);
        if (hasDefaultValueSet) {
          this.vm.alignedToDefaultValue = false;
        }
      }

      if (this.vm.isAligningDefaultValue && !this.vm.isSavingTarget && this.control === ParameterControl.Spinner) {
        this.numberPropertyConfig.value.value = this.editableValue;
      }
    }

    // When editing if this is revert and value is removed, original value is displayed
    // The original value should be converted to the current properties value
    // when the task is started
    if (this.isRevert && this.model.isEditing() && !this.isInitializing) {
      this.useOriginalValue = value === this.vm.isEmptyString || isNullOrUndefined(value);
    }
    this.validateValue();
  }

  public get runtimeVariant(): IRuntimeValue {
    return this._runtimeVariant;
  }

  public set runtimeVariant(value: IRuntimeValue) {
    this._runtimeVariant = value;
  }

  public name: string;
  public label: string;
  public description: string;
  public unit: string;
  public gmsDataType: eGmsDataType;
  public propertyDataType: PropertyDataType;
  public minValue: number | Long;
  public maxValue: number | Long;
  public resolution: number;
  public control: ParameterControl;
  public paramType: ParameterType;
  // Value can come from: template (hardcoded|read current property),
  // or from another target that isDefaultValue=true
  public defaultValue: any;
  public valueState: ValueState = 'none';
  public numberPropertyConfig: Property<BigNumberValue>;
  public dateTimePropertyConfig: DatepickerInputConfig;
  public overridableParameters: OverridableParameters;

  public isMultiSelection = false;
  public hasValidationError = false;
  public optionsList: SelectOption[] = [];
  private _disableComboBox = false;
  private readonly emptyOptionsList: SelectOption[] = [{ id: "0", title: '0 [0]' }];
  // All revert parameters can be made into useoriginalvalue when user removes the value
  // The revert value can be from template -> OverridableParameterRevert.Param
  // Null = useoriginalvalue is true
  // NotNull = useoriginalvalue is false
  private _useOriginalValue = false;

  private _dateTimeToDisplay: Date = new Date();
  public get DateTimeDisplayValue(): Date {
    return this._dateTimeToDisplay;
  }
  public set DateTimeDisplayValue(value: Date) {
    if (!isNullOrUndefined(value) && this._dateTimeToDisplay !== value) {
      this._dateTimeToDisplay = value;
      this.submitDateTimeValue(value);
    }

    if (isNullOrUndefined(value)) {
      this.hasValidationError = true
    }
  }
  private bacnetDateTimeFormatter: BACnetDateTimeFormatter;
  private bACnetDateTimeDetail: number;
  private bACnetDateTimeResolution: number;
  private showDateOnly = false;
  private _runtimeVariant: IRuntimeValue;
  private readonly trace: TraceService;
  private readonly mod = TraceModules.vmTargetTrace;
  private readonly model: TargetModel;
  private _editableValue: any;
  private commandInfo: CommandParameters;
  private propertyDetails: PropertyDetails;
  private readonly isInitializing: boolean = false;

  private sizeBs: number;
  private offsetBs: number;
  private filteredBitLabels = [];// values within min max
  constructor(private readonly vm: OperatorTaskTargetViewModel,
    defaultValue: any,
    private readonly isRevert: boolean) {
    this.isInitializing = true;
    this.trace = this.vm.trace;
    this.model = this.vm.model;
    this.defaultValue = defaultValue;
    this._editableValue = this.model.targetIsNew ? this.defaultValue
      : this.isRevert ? this.model.runtimeValueForRevert?.b : this.model.runtimeValue?.b;

    this.assignPropertiesFromOverridables();
    if (isNullOrUndefined(this.overridableParameters)) {
      this.trace.warn(this.mod, 'Unable to fetch properties from server: Cannot create parameter' +
        ' controls.')
      return;
    }

    this.createRuntimeVariant();
    this.initializeDataType();
    this.setOrResetControlConfig();
    this.isInitializing = false;
  }

  public updateRuntimeValue(): IRuntimeValue {
    const valConverted = this.updateRuntimeValueHelper(this.editableValue);
    if (this.isRevert) {
      if (this.useOriginalValue) {
        this.model.runtimeValueForRevert = { _type: 0, a: false, b: undefined };
      } else {
        this.runtimeVariant = Utility.createRuntimeVariant(this.gmsDataType, valConverted);
      }
    } else {
      this.runtimeVariant.b = valConverted;
    }

    this.hasValidationError = false;
    this.traceHelper(this.runtimeVariant, 'updateRuntimeValue');
    return this.runtimeVariant;
  }

  public setOrResetControlConfig(): void {
    switch (this.control) {
      case ParameterControl.Spinner: {
        this.setSpinnerControlConfig();
        break;
      }
      case ParameterControl.DatePicker: {
        this.setDateTimeControlConfig();
        break;
      }
      case ParameterControl.ComboBox:
        break;
      default:
        break;
    }
  }

  public selectionChanged($event): void {
    if (!this.isInitializing) {
      if (!isNullOrUndefined($event)) {
        this.editableValue = $event;
      }
    }
  }

  public submitDateTimeValue(value: Date): void {
    const isoDateString = value?.toISOString();
    if (this.editableValue !== isoDateString) {
      this.vm.parameterValuesChanged = true;
      this.editableValue = value.toISOString();
    }
  }

  public submitNumericValue(property: AnyProperty): void {
    const propertyConfig: any = property?.value;

    if (propertyConfig.resolution === undefined) {
      this.setBigNumber(property);
    } else {
      this.setNumber(property)
    }
  }

  public traceData(): string {
    // eslint-disable-next-line max-len
    return `dataType: ${PropertyDataType[this.propertyDataType]} | gmsDataType: ${eGmsDataType[this.gmsDataType]} 
    | control: ${this.control}| defaultValue: ${this.defaultValue}| editableValue: ${this.editableValue}
    | min: ${this.minValue} | max: ${this.maxValue}| unit: ${this.unit}| resolution: ${this.resolution}
    | hasError: ${this.hasValidationError}  | RuntimeVariant: ${JSON.stringify(this.runtimeVariant)} `;
  }

  private setSpinnerControlConfig(): void {
    // Allowing min to be '0' makes the big number control unusable.
    const min = this.minValue === 0 || this.isNotFinite(this.minValue) ? undefined : this.minValue;
    const max = this.isNotFinite(this.maxValue) ? undefined : this.maxValue;

    let minValue: string = min !== undefined ? min.toLocaleString() : undefined;
    let maxValue: string = max !== undefined ? max.toLocaleString() : undefined;
    const value = !Number.isNaN(this.editableValue) && this.editableValue !== '' ? String(this.editableValue) : undefined;

    const decimalsAllowed = this.resolution > 0;
    if (this.resolution > 0) {
      minValue = min !== undefined ? min.toLocaleString(Utility.formatLang
        , { minimumFractionDigits: this.resolution, maximumFractionDigits: this.resolution }) : undefined;
      maxValue = max !== undefined ? max.toLocaleString(Utility.formatLang
        , { minimumFractionDigits: this.resolution, maximumFractionDigits: this.resolution }) : undefined;
    }

    // if it is 1 set 0.1, 2 set to 0.01 and so on
    const resolutionString = this.resolution !== undefined ? this.getResolutionString(this.resolution) : undefined;

    this.numberPropertyConfig = {
      overrideMode: 'direct',
      value: {
        type: 'big-number',
        value: value,
        min: minValue,
        max: maxValue,
        unit: this.unit,
        decimalsAllowed: decimalsAllowed,
        resolution: resolutionString
      }
    };
  }

  private isNotFinite(value: number | Long): boolean {
    return Number.NEGATIVE_INFINITY === value || Number.POSITIVE_INFINITY === value;
  }

  private setDateTimeControlConfig(): void {
    const currentDate = new Date();
    const minDate = new Date(Utility.UNSET_DATE_TIME_DATE);

    if (isNullOrUndefined(this._runtimeVariant) || isNullOrUndefined(this._runtimeVariant.b)) {
      this._dateTimeToDisplay = currentDate;
    } else {
      if (this.model.targetIsNew && this.propertyDataType === PropertyDataType.ExtendedDateTime) {
        switch (this.bacnetDateTimeFormatter.BACnetDTDetailEnumTranslator) {
          case BACnetDateTimeDetail.DateOnly:
          case BACnetDateTimeDetail.DateAndTime:
            this._dateTimeToDisplay = new Date(this.formatDateTime());
            break;
          case BACnetDateTimeDetail.TimeOnly:
          case BACnetDateTimeDetail.Unspecified:
          default:
            this.traceHelper(`Unsupported type.`, 'setDateTimeControlConfig()', true);
            break;
        }
      } else {
        this._dateTimeToDisplay = new Date(this._runtimeVariant.b);
      }

    }
    this.editableValue = this._dateTimeToDisplay;

    this.dateTimePropertyConfig = {
      showTime: !this.showDateOnly,
      showSeconds: !this.showDateOnly,
      showMinutes: !this.showDateOnly,
      mandatoryTime: !this.showDateOnly,
      enableTimeValidation: !this.showDateOnly,
      hideWeekNumbers: true,
      minDate: minDate,
      todayText: this.vm.todayText,
      weekStartDay: 'sunday',
      showMilliseconds: false,
      disabledTime: false
    };
  }

  private setBigNumber(property: AnyProperty): void {
    const value = property?.value?.value;

    const valueToValidate = parseLong(value);
    if (valueToValidate === undefined) {
      this.hasValidationError = false;
      this.vm.parameterValuesChanged = true;
      this.editableValue = undefined;
      this.numberPropertyConfig.value.value = undefined;
      return; // don't do anything
    }

    if ((this.minValue !== undefined && valueToValidate?.lessThan(this.minValue))
      || (this.maxValue !== undefined && valueToValidate?.greaterThan(this.maxValue))) {
      this.hasValidationError = true;
      asapScheduler.schedule(() => { this.valueState = 'failed'; }, 10);
    } else {
      this.hasValidationError = false;
      const valueAsString = valueToValidate.toString();
      if (this.editableValue !== valueAsString) {
        this.vm.parameterValuesChanged = true;
        this.editableValue = valueAsString;
      }

      if (this.valueState !== 'none') {
        asapScheduler.schedule(() => { this.valueState = 'none'; }, 10);
      }
    }
  }

  private setNumber(property: AnyProperty): void {
    const value = property?.value?.value;
    const valueString = value as string;
    if (valueString === undefined || valueString.trim() === '') {
      this.hasValidationError = false;
      this.vm.parameterValuesChanged = true;
      this.editableValue = undefined;
      this.numberPropertyConfig.value.value = undefined;
      return; // don't do anything
    }

    const correctedValueString = this.getLocaleDecimalValue(Utility.formatLang, valueString);
    if (correctedValueString !== valueString) {
      this.numberPropertyConfig.value.value = correctedValueString;
    }

    const decimalValue = Number(correctedValueString);
    const minValue = this.isNotFinite(this.minValue) ? undefined : Number(this.minValue);
    const maxValue = this.isNotFinite(this.maxValue) ? undefined : Number(this.maxValue);

    if ((minValue !== undefined && decimalValue < minValue) || (maxValue !== undefined && decimalValue > maxValue)) {
      this.hasValidationError = false;
      this.vm.parameterValuesChanged = true;
      const valueInRange = decimalValue < minValue ? minValue : maxValue;
      this.editableValue = valueInRange;
      this.numberPropertyConfig.value.value = valueInRange.toLocaleString(Utility.formatLang, { minimumFractionDigits: this.resolution });
    } else {
      if (this.editableValue !== decimalValue) {
        this.hasValidationError = false;
        this.vm.parameterValuesChanged = true;
        this.editableValue = decimalValue.toLocaleString(Utility.formatLang, { minimumFractionDigits: this.resolution });
      }

      if (this.valueState !== 'none') {
        asapScheduler.schedule(() => { this.valueState = 'none'; }, 10);
      }
    }
  }

  private updateRuntimeValueHelper(val: any): any {
    let result = val;
    try {
      if (this.control === ParameterControl.ComboBox) {
        if (this.isBool()) {
          result = val === "1" ? true : false
        } else if (this.isBitstring()) {
          if (this.is64BitType()) {
            result = this.encodeValue64();
          } else {
            result = Number(this.encodeValue());
          }
        } else {
          result = Number(val);
        }
      }

      if (this.control === ParameterControl.DatePicker) {
        result = this.editableValue?.toISOString()
      }
    } catch (e) {
      this.traceHelper(e, 'updateRuntimeValueHelper', true);
    }

    return result;
  }

  private initializeDataType(): void {
    if (isNullOrUndefined(this.propertyDataType)) {
      this.trace.error(this.mod, 'initializeDataType() propertyDataType is null; cannot create' +
        ' target parameters.');
      return;
    }

    this.setControlType();

    switch (this.propertyDataType) {
      case PropertyDataType.ExtendedBitString:
      case PropertyDataType.BasicBit32:
      case PropertyDataType.ExtendedEnum:
      case PropertyDataType.BasicBit64:
      case PropertyDataType.ExtendedBitString64:
      case PropertyDataType.ExtendedBool:
      case PropertyDataType.BasicBool:
        this.setMinMaxUnit();
        this.initComboBox();
        break;

      case PropertyDataType.ExtendedDateTime:
        this.bACnetDateTimeDetail = this.commandInfo?.BACnetDateTimeDetail ?? this.propertyDetails?.BACnetDateTimeDetail;
        this.bACnetDateTimeResolution = this.commandInfo?.BACnetDateTimeResolution ?? this.propertyDetails?.BACnetDateTimeResolution;
        this.bacnetDateTimeFormatter = new BACnetDateTimeFormatter(Utility.formatLang, this.bACnetDateTimeResolution, this.bACnetDateTimeDetail);
        this.showDateOnly = this.bacnetDateTimeFormatter?.BACnetDTDetailEnumTranslator === BACnetDateTimeDetail.DateOnly;
        break;

      case PropertyDataType.BasicTime:
        // there are no special set-up needed
        break;
      case PropertyDataType.ExtendedDuration:
        this.setMinMaxUnit();
        break;

      case PropertyDataType.ExtendedInt:
      case PropertyDataType.BasicInt:
        this.setMinMaxUnit();
        break;

      case PropertyDataType.ExtendedInt64:
      case PropertyDataType.BasicInt64:
        this.setMinMaxUnit();
        break;

      case PropertyDataType.ExtendedReal:
      case PropertyDataType.BasicFloat:
        this.setMinMaxUnit();
        this.resolution = this.getResolution();
        break;

      case PropertyDataType.ExtendedUint:
      case PropertyDataType.BasicUint:
        this.setMinMaxUnit();
        break;

      case PropertyDataType.ExtendedUint64:
      case PropertyDataType.BasicUint64:
        this.setMinMaxUnit();
        break;

      case PropertyDataType.BasicString:
      case PropertyDataType.BasicChar:
        break;
      default:
        this.trace.warn(TraceModules.vmTargetTrace, 'setControlType() Not supported datatype', this.propertyDataType);
        break;
    }

  }

  private setControlType(): void {
    switch (this.propertyDataType) {
      case PropertyDataType.ExtendedBitString:
      case PropertyDataType.BasicBit32:
      case PropertyDataType.BasicBit64:
      case PropertyDataType.ExtendedBitString64:
      case PropertyDataType.ExtendedBool:
      case PropertyDataType.BasicBool:
      case PropertyDataType.ExtendedEnum:
        this.control = ParameterControl.ComboBox;
        break;

      case PropertyDataType.ExtendedInt:
      case PropertyDataType.BasicInt:
      case PropertyDataType.ExtendedInt64:
      case PropertyDataType.BasicInt64:
      case PropertyDataType.ExtendedReal:
      case PropertyDataType.BasicFloat:
      case PropertyDataType.ExtendedUint:
      case PropertyDataType.BasicUint:
      case PropertyDataType.ExtendedUint64:
      case PropertyDataType.BasicUint64:
      case PropertyDataType.ExtendedDuration:
        this.control = ParameterControl.Spinner;
        break;

      case PropertyDataType.ExtendedDateTime:
      case PropertyDataType.BasicTime:
        this.control = ParameterControl.DatePicker;
        break;

      case PropertyDataType.BasicString:
      case PropertyDataType.BasicChar:
        this.control = ParameterControl.TextBox;
        break;
      default:
        this.trace.warn(TraceModules.vmTargetTrace, 'setControlType() Not supported datatype', this.propertyDataType);
        break;
    }
  }

  private getLocaleDecimalValue(locale: string, value: string): string {
    const decimalSeparator = this.getDecimalSeparator(locale);
    const invalidSeparator = decimalSeparator === ',' ? '.' : ',';
    value = value.replace(invalidSeparator, decimalSeparator);
    return value;
  }

  private getDecimalSeparator(locale: string): string {
    const decimalNumber = 1.1;
    const separator: string = decimalNumber.toLocaleString(locale).substring(1, 2);
    return separator;
  }

  private getResolutionString(resolution: number): string {
    let resolutionString: string = undefined;

    if (Number.isNaN(resolution) || resolution <= 0) {
      return undefined;
    }

    let controlResolution = 1;
    for (let counter = 1; counter <= resolution; counter++) {
      controlResolution = controlResolution / 10;
    }

    resolutionString = controlResolution.toLocaleString(Utility.formatLang, { minimumFractionDigits: resolution });

    return resolutionString;
  }

  private setMinMaxUnit(): void {
    this.minValue = this.getMin();
    this.maxValue = this.getMax();
    this.unit = this.getUnit();
  }

  private assignPropertiesFromOverridables(): void {
    const targetParameter = this.isRevert ? this.model.parameterRevert : this.model.parameterAction;
    if (targetParameter) {
      this.overridableParameters = targetParameter;
      if (!isNullOrUndefined(targetParameter.ParamInfo)) {
        this.name = targetParameter.ParamInfo.Name;
        this.label = targetParameter.ParamInfo.Description;
        this.description = targetParameter.ParamInfo.Description;
        this.paramType = targetParameter.ParamInfo.ParamType;
        this.gmsDataType = targetParameter.ParamInfo.GmsDataType;
        this.commandInfo = targetParameter.ParamInfo.ParameterDecoration;
        this.propertyDetails = targetParameter.ParamInfo.propertyDetailsRepresentationWithoutValue;
        if (isNullOrUndefined(this.commandInfo) && isNullOrUndefined(this.propertyDetails)) {
          this.trace.warn(this.mod, 'Cannot ');
          this.traceHelper('Undefined property/command info; Cannot determine Datatype', 'assignPropertiesFromOverridables', true);
          return;
        }

        this.propertyDataType = this.commandInfo
          ? PropertyDataType[this.commandInfo.DataType]
          : PropertyDataType[this.propertyDetails.Type];

      } else {
        this.trace.error(this.mod, 'ParamInfo is undefined');
      }
    } else {
      // this should not happen
      this.trace.warn(this.mod, `assignPropertiesFromOverridables(): OverridableParameters is undefined for ${this.model.objectId}`);
    }

  }

  private getUnit(): string {
    let result = '';
    if (this.commandInfo?.UnitDescriptor) {
      result = this.commandInfo?.UnitDescriptor
    } else if (this.propertyDetails?.UnitDescriptor) {
      result = this.propertyDetails.UnitDescriptor;
    }
    return result;
  }

  private getMax(): number | Long {
    let result: number | Long;

    if (this.commandInfo?.Max && !this.isBool()) {
      const maxNumber = Number(this.commandInfo.Max);
      result = maxNumber > Number.MAX_SAFE_INTEGER ? Long.fromNumber(maxNumber) : maxNumber;
    } else if (this.propertyDetails?.Max && !this.isBool()) {
      const maxNumber = Number(this.propertyDetails.Max);
      result = maxNumber > Number.MAX_SAFE_INTEGER ? Long.fromNumber(maxNumber) : maxNumber;
    } else {

      switch (this.propertyDataType) {
        case PropertyDataType.ExtendedBitString:
        case PropertyDataType.BasicBit32:
          result = Utility.BIT32MAX_BIT;
          break;

        case PropertyDataType.BasicBit64:
        case PropertyDataType.ExtendedBitString64:
          result = Utility.BIT64MAX_BIT;
          break;

        case PropertyDataType.ExtendedBool:
        case PropertyDataType.BasicBool:
          result = Utility.BOOLMAX;
          break;

        case PropertyDataType.ExtendedInt:
        case PropertyDataType.BasicInt:
          result = Utility.INT32MAX
          break;

        case PropertyDataType.ExtendedInt64:
        case PropertyDataType.BasicInt64:
          result = Utility.INT64MAX;
          break;

        case PropertyDataType.ExtendedReal:
        case PropertyDataType.BasicFloat:
          result = Number.POSITIVE_INFINITY;
          break;

        case PropertyDataType.ExtendedUint:
        case PropertyDataType.BasicUint:
        case PropertyDataType.ExtendedEnum:
          result = Utility.UINT32MAX
          break;

        case PropertyDataType.ExtendedUint64:
        case PropertyDataType.BasicUint64:
          result = Utility.UINT64MAX;
          break;

        case PropertyDataType.BasicChar:
          result = Utility.CHARMAX;
          break;

        case PropertyDataType.ExtendedDuration:
        case PropertyDataType.BasicString:
        case PropertyDataType.ExtendedDateTime:
        case PropertyDataType.BasicTime:
        default:
          this.trace.debug(this.mod, `getMax() no max for type =  ${PropertyDataType[this.propertyDataType]}`)
          break;
      }
    }
    return result;
  }

  private getMin(): number | Long {
    let result: number | Long = 0;

    if (this.commandInfo?.Min && !this.isBool()) {
      const minNumber = Number(this.commandInfo.Min);
      result = minNumber > Number.MAX_SAFE_INTEGER ? Long.fromNumber(minNumber) : minNumber;
    } else if (this.propertyDetails?.Min && !this.isBool()) {
      const minNumber = Number(this.propertyDetails.Min);
      result = minNumber > Number.MAX_SAFE_INTEGER ? Long.fromNumber(minNumber) : minNumber;
    } else {
      // if there is no min max set by the user
      switch (this.propertyDataType) {
        case PropertyDataType.ExtendedBitString:
        case PropertyDataType.BasicBit32:
        case PropertyDataType.BasicBit64:
        case PropertyDataType.ExtendedBitString64:
          result = Utility.BITMIN;
          break;

        case PropertyDataType.ExtendedBool:
        case PropertyDataType.BasicBool:
          result = Utility.BOOLMIN;
          break;

        case PropertyDataType.ExtendedInt:
        case PropertyDataType.BasicInt:
          result = Utility.INT32MIN
          break;

        case PropertyDataType.ExtendedInt64:
        case PropertyDataType.BasicInt64:
          result = Utility.INT64MIN;
          break;

        case PropertyDataType.ExtendedReal:
        case PropertyDataType.BasicFloat:
          result = Number.NEGATIVE_INFINITY;
          break;

        case PropertyDataType.ExtendedUint:
        case PropertyDataType.BasicUint:
        case PropertyDataType.ExtendedEnum:
          result = Utility.UINT32MIN
          break;

        case PropertyDataType.ExtendedUint64:
        case PropertyDataType.BasicUint64:
          result = Utility.UINT64MIN;
          break;

        case PropertyDataType.BasicChar:
          result = Utility.CHARMAX;
          break;

        case PropertyDataType.ExtendedDuration:
        case PropertyDataType.BasicString:
        case PropertyDataType.ExtendedDateTime:
        case PropertyDataType.BasicTime:
        default:
          this.trace.debug(this.mod, `getMin() no max for type =  ${PropertyDataType[this.propertyDataType]}`)
          break;
      }
    }

    return result;
  }

  private getResolution(): number {
    let result: number;
    if (this.commandInfo?.Resolution) {
      result = this.commandInfo?.Resolution
    } else if (this.propertyDetails?.Resolution) {
      result = this.propertyDetails.Resolution;
    } else {
      result = Utility.Float_DefaultResolution;
    }
    return result;
  }

  private initComboBox(): void {
    const enumText = this.commandInfo?.EnumerationTexts;
    if (!enumText || enumText.length < 1) {
      this.trace.warn(this.mod, `initializeComboBox(): Invalid textgroup
      | propertyDataType= ${PropertyDataType[this.propertyDataType]} 
      | dp= ${this.model.designation}`);
      this.optionsList = this.emptyOptionsList;
      this.editableValue = this._editableValue?.toString();
      return;
    }
    this.optionsList = [];
    this.isMultiSelection = this.isMultiSelect();

    const min = Number(this.minValue);
    const max = Number(this.maxValue);

    const enumTexts: EnumerationItem[] = enumText
      .filter(item => this.isValueInRage(item, min, max));

    enumTexts.forEach(item => {
      const title = `${item.Descriptor} [${item.Value}]`;
      this.optionsList.push({ id: item.Value.toString(), title: title });
    })

    if (this.isBitstring()) {
      this.setBitProperties();
      if (isNullOrUndefined(this.editableValue)) {
        this.editableValue = []; // no value provided in the template
      } else {
        const valueToUse = this.editableValue.toString();
        if (!Utility.isNullOrWhitespace(valueToUse)) {
          const bsValue: number[] = this.translateToSiBitstring(valueToUse, this.sizeBs, this.offsetBs)
          this.editableValue = bsValue.map(num => num.toString());
          this.traceHelper(this.editableValue, 'initializeComboBox - Bit64');
        } else {
          this.trace.warn(this.mod, `initializeComboBox(): No bit value ${this.runtimeVariant?.b}  |${this.model.designation} `)
        }
      }
    } else {
      let index: string;
      if (typeof this.editableValue === "boolean") {
        index = this.editableValue === true ? '1' : '0';
      } else {
        index = this.editableValue?.toString();
        // Note the default value from the template can be out of bounds, there will be no
        // selection and error is shown (not same in WPF)
      }
      this.editableValue = index;
    }
  }

  private isValueInRage(en: EnumerationItem, min: number, max: number): boolean {
    if (en && en.Value >= min && en.Value <= max) {
      return true;
    }
    return false;
  }

  private isBitstring(): boolean {
    let result: boolean;
    switch (this.propertyDataType) {
      case PropertyDataType.ExtendedBitString:
      case PropertyDataType.BasicBit32:
      case PropertyDataType.BasicBit64:
      case PropertyDataType.ExtendedBitString64:
        result = true;
        break;

      default:
        result = false;
        break;
    }
    return result;
  }

  private isBool(): boolean {
    return this.propertyDataType === PropertyDataType.BasicBool
      || this.propertyDataType === PropertyDataType.ExtendedBool;
  }

  private is64BitType(): boolean {
    return this.propertyDataType === PropertyDataType.BasicBit64
      || this.propertyDataType === PropertyDataType.ExtendedBitString64
  }

  private isMultiSelect(): boolean {
    let result: boolean;
    switch (this.propertyDataType) {
      case PropertyDataType.ExtendedBitString:
      case PropertyDataType.BasicBit32:
      case PropertyDataType.BasicBit64:
      case PropertyDataType.ExtendedBitString64:
        result = true;
        break;

      default:
        result = false;
        break;
    }
    return result;
  }

  private setBitProperties(): void {
    const readMin = Number(this.minValue).toString();
    const readMax = Number(this.maxValue).toString();

    if (isNullOrUndefined(readMin) || isNullOrUndefined(readMax)) {
      const min = Utility.BITMIN;
      const max = this.is64BitType() ? Utility.BIT64MAX_BIT : Utility.BIT32MAX_BIT;
    }
    // BitStringLabels is the value
    this.filteredBitLabels = this.propertyDetails.BitStringLabels || [];
    const hiBitMax: number = this.is64BitType() ? 63 : 31;
    this.minValue = parseInt(readMin, 10) || 0; // first-bit (as defined in Object Model)
    this.maxValue = parseInt(readMax, 10) || hiBitMax; // last-bit
    this.sizeBs = Math.max(0, this.maxValue - this.minValue + 1);
    this.offsetBs = this.minValue;
  }

  private translateToSiBitstring(bsString: string, size: number, offset: number): number[] {
    const numberArray: number[] = [];

    if (bsString === undefined) {
      return undefined;
    } else {
      const bitBool: boolean[] = this.decodeBitstring(bsString, size, offset);
      for (let i = 0; i < bitBool.length; i++) {
        if (bitBool[i]) { numberArray.push(i); }
      }
    }

    this.traceHelper(numberArray, 'translateToSiBitstring');
    return numberArray;
  }

  private decodeBitstring(bsString: string, size: number, offset: number): boolean[] {
    if (size < 0 || offset < 0 || size + offset > 64) {
      throw new Error('invalid arg');
    }
    const bitArr: boolean[] = [];
    const bs: Long = parseLong(bsString, true) || Long.UZERO;
    let mask: Long = Long.UONE.shiftLeft(offset);
    for (let idx = 0; idx < size; ++idx) {
      bitArr.push(bs.and(mask).notEquals(Long.UZERO));
      mask = mask.shiftLeft(1);
    }

    this.traceHelper(bitArr, 'decodeBitstring');
    return bitArr;
  }

  // private decodeAndFormatBitstring(bsString: string, size: number, offset: number): string[] {
  //   let bsStringArr: string[];
  //   if (!isNullOrUndefined(bsString)) {
  //     const bitArr: boolean[] = this.decodeBitstring(bsString, size, offset);
  //     if (bitArr) {
  //       bsStringArr = bitArr.map(bitval => String(bitval));
  //     } else {
  //       // this.traceParseError(valEncoded);
  //     }
  //   }
  //   return bsStringArr;
  // }

  // 32-bit version
  private encodeValue(): string {
    let valEnc: string;
    if (this.isBitstring()) {
      let val = 0;
      let invalid = false;
      if (Array.isArray(this.editableValue)) {
        const numbers: number[] = this.editableValue.map(str => Number(str));
        numbers.forEach(bitpos => {
          if (typeof bitpos === 'number') {
            val = this.setBitValue(val, this.offsetBs, bitpos, true);
          } else {
            invalid = true; // non-numeric value in array!
          }
        });
        if (!invalid) {
          valEnc = this.encodeBitstring(val);
        }
      }
    }
    return valEnc;
  }

  /* eslint-disable no-bitwise */
  private setBitValue(bsIn: number, offset: number, bitPos: number, bitValue: boolean): number {
    let bsOut: number;
    if (!isNaN(bsIn) && offset + bitPos < 32) {
      const bitMask: number = 1 << (offset + bitPos);
      if (bitValue) {
        bsOut = bsIn | bitMask; // turn bit on
      } else {
        bsOut = bsIn & ~bitMask; // turn bit off
      }
    }
    this.traceHelper(bsOut, 'setBitValue()');
    return bsOut;
  }

  private encodeBitstring(bs: number): string {
    return !isNaN(bs) ? String(bs >>> 0) : undefined; // zero-fill right shift operator (>>>) applied to ensure an unsigned value
  }
  /* eslint-enable no-bitwise */

  // 64-bit version
  private encodeValue64(): string {
    let valEnc: string;
    if (!this.is64BitType()) {
      this.traceHelper('Incorrect logic', 'encodeValue64', true);
      return '';
    }

    let val: Long = Long.UZERO;
    let invalid = false;
    if (Array.isArray(this.editableValue)) {
      const numbers: number[] = this.editableValue.map(str => Number(str));
      numbers.forEach(bitpos => {
        if (typeof bitpos === 'number') {
          val = this.setBitValue64(val, this.offsetBs, bitpos, true);
        } else {
          invalid = true; // non-numeric value in array!
        }
      });
      if (!invalid) {
        valEnc = this.encodeBitstring64(val);
      }
    }
    this.traceHelper(valEnc, 'encodeValue64');
    return valEnc;
  }

  private setBitValue64(bsIn: Long, offset: number, bitPos: number, bitValue: boolean): Long {
    let bsOut: Long;
    if (bsIn && offset + bitPos < 64) {
      const lmask: Long = Long.UONE.shiftLeft(offset + bitPos);
      if (bitValue) {
        bsOut = bsIn.or(lmask); // turn bit on
      } else {
        bsOut = bsIn.and(lmask.not()); // turn bit off
      }
    }
    this.traceHelper(bsOut, 'setBitValue64');
    return bsOut;
  }

  private encodeBitstring64(bs: Long): string {
    let ubs: Long;
    if (bs) {
      // ubs = new Long(bs.low, bs.high, true); // ensure unsigned value
      ubs = Long.fromBits(bs.low, bs.high, true); // Ensure unsigned value
    }

    this.traceHelper(ubs, 'encodeBitstring64');
    return ubs !== undefined ? ubs.toString() : undefined;
  }
  /* eslint-enable no-bitwise */

  private traceHelper(msg: any, method: string, isWarn: boolean = false): void {
    const message = `${method}(): ${msg} 
    | gmsDataType: ${eGmsDataType[this.gmsDataType]} 
    | propertyDataType: ${PropertyDataType[this.propertyDataType]} 
    | Dp: ${this.model?.designation}`;

    if (isWarn) {
      this.trace.warn(this.mod, message)
    } else {
      this.trace.debug(this.mod, message)
    }
  }

  private validateValue(): void {
    if (this.isRevert && this.useOriginalValue) {
      this.hasValidationError = false;
    } else {
      switch (this.control) {
        case ParameterControl.TextBox:
          this.hasValidationError = isNullOrUndefined(this.editableValue);
          break;
        case ParameterControl.Spinner:
          // handled in control
          break;
        case ParameterControl.ComboBox:
          // if there is no text group - disable the control and show the value
          // if the value is out of range, do not make a selection and set error
          if (this.emptyOptionsList === this.optionsList) {
            this.disableComboBox = true;
            this.optionsList = [{
              id: this.editableValue.toString(),
              title: this.editableValue.toString() }];
            this.hasValidationError = false;
          } else {
            if (!this.isBitstring()) {
              const valid = this.optionsList.find(ol => ol.id === this.editableValue);
              this.hasValidationError = isNullOrUndefined(valid);
            } else {
              // bitstrings are allowed to have no selection - 'None' is shown
              this.hasValidationError = false;
            }
          }
          break;
        case ParameterControl.DatePicker:
          if (!Utility.isValidDate(new Date(this.editableValue))) {
            this.hasValidationError = true;
          } else {
            this.hasValidationError = false;
          }
          break;
        default:
          break;
      }
    }
  }

  private createRuntimeVariant(): void {
    if (this.isRevert) {
      if (this.model.targetIsNew) {
        this.runtimeVariant = Utility.createRuntimeVariant(this.gmsDataType, this.editableValue);
        this.model.useOriginalValueForRevert = isNullOrUndefined(this.editableValue)
          ? this.overridableParameters.Param.UseOriginalValue
          : false;
      } else {
        this.runtimeVariant = this.model.runtimeValueForRevert;
      }
      this.useOriginalValue = this.model.useOriginalValueForRevert;
    } else {
      this.runtimeVariant = this.model.targetIsNew
        ? Utility.createRuntimeVariant(this.gmsDataType, this.editableValue)
        : this.model.runtimeValue;
    }
  }

  private formatDateTime(): string {
    if (this.propertyDataType === 'ExtendedDateTime') {
      const dateTime: string = this.bacnetDateTimeFormatter.formatBACnetDateTime(this.editableValue);
      return this.HandleUnits(dateTime, this.unit, false);
    }
  }

  private HandleUnits(result: string, units: string, noUnitsSpace: boolean): string {
    // handle units
    if (result !== undefined && units !== undefined && units.trim().length > 0) {
      result += (noUnitsSpace ? '' : ' ') + units;
    }
    return result;
  }
}

export enum PropertyDataType {
  ExtendedBitString = 'ExtendedBitString',
  BasicBit32 = 'BasicBit32',
  BasicBit64 = 'BasicBit64',
  ExtendedBitString64 = "ExtendedBitString64",
  ExtendedBool = 'ExtendedBool',
  BasicBool = 'BasicBool',
  ExtendedDateTime = 'ExtendedDateTime',
  BasicTime = 'BasicTime',
  ExtendedEnum = 'ExtendedEnum',
  ExtendedInt = 'ExtendedInt',
  BasicInt = 'BasicInt',
  ExtendedInt64 = 'ExtendedInt64',
  BasicInt64 = 'BasicInt64',
  ExtendedReal = 'ExtendedReal',
  BasicFloat = 'BasicFloat',
  ExtendedUint = 'ExtendedUint',
  BasicUint = 'BasicUint',
  ExtendedUint64 = 'ExtendedUint64',
  BasicUint64 = 'BasicUint64',
  ExtendedDuration = 'ExtendedDuration',
  BasicString = 'BasicString',
  BasicChar = 'BasicChar'
}