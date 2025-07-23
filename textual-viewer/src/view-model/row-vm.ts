import { NgZone } from '@angular/core';
import { BrowserObject, GmsSubscription, PropertyDetails, SubscriptionState, ValueDetails } from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { CovFormatter } from '@gms-flex/snapin-common';
import { Subscription } from 'rxjs';

import { GridData } from '../textual-viewer-data.model';
import { TvColumnIds, TvTraceModules } from './globals';

export class TextualViewerRowViewModel {

  private propertyAbsentText: string;
  private comErrorText: string;
  private receivedText = false;
  private pd: PropertyDetails = null;
  private functionPd: PropertyDetails = null;
  private pdCurrentPriority: PropertyDetails = null;
  private defaultPropertyFormatter: CovFormatter = null;
  private defaultFunctionPropertyFormatter: CovFormatter = null;
  private currentPriorityPropertyFormatter: CovFormatter = null;
  private gridRowObject: GridData;
  private propValue: ValueDetails;

  private statusSubscription: GmsSubscription<ValueDetails>;
  private propertyValueSubscription: GmsSubscription<ValueDetails>;
  private functionPropertyValueSubscription: GmsSubscription<ValueDetails>;
  private propertyCurrentPrioritySubscription: GmsSubscription<ValueDetails>;
  private summaryStatusSub: Subscription;
  private defPropertySub: Subscription;
  private defFunctionPropertySub: Subscription;
  private defCurrentPrioritySub: Subscription;
  private readFunctionPropertyValid: boolean = null;

  private readonly summaryStatusPropertyName: string;
  private readonly defaultCurrentPriorityPropertyName: string;
  private defaultPropertyName: string;
  private functionDefaultPropertyName: string;
  private readonly traceModule: string = TvTraceModules.tv;
  private readonly statusSummaryDpeName: string = '.StatusPropagation.AggregatedSummaryStatus';
  private readonly currentPriorityName: string = '.Current_Priority'

  public get gridRow(): GridData {
    return this.gridRowObject;
  }

  public set gridRow(gd: GridData) {
    this.gridRowObject = gd;
  }

  public get browserObject(): BrowserObject {
    return this.browserObj;
  }

  public get propertyName(): string {
    return this.defaultPropertyName;
  }

  public get currentPriorityPropertyName(): string {
    return this.defaultCurrentPriorityPropertyName;
  }

  public get functionPropertyName(): string {
    return this.functionDefaultPropertyName;
  }

  public get statusName(): string {
    return this.summaryStatusPropertyName;
  }

  public get isSubscribed(): boolean {
    return this.statusSubscription != null || this.propertyValueSubscription != null || this.functionPropertyValueSubscription != null;
  }

  public setFunctionText(propAbs: string, commErr: string): void {
    this.propertyAbsentText = propAbs;
    this.comErrorText = commErr;
    this.receivedText = true;
    this.processFunctionCovIfReady();
  }

  public setFunctionPropertyDetails(pd: PropertyDetails): void {
    this.functionPd = pd;
    this.processFunctionCovIfReady();
  }

  public setText(propAbs: string, commErr: string): void {
    this.propertyAbsentText = propAbs;
    this.comErrorText = commErr;
    this.receivedText = true;
    this.processCovIfReady();
  }

  public setPropertyDetails(pd: PropertyDetails): void {
    this.pd = pd;
    this.processCovIfReady();
  }

  public setCurrentPriorityPropertyDetails(pd: PropertyDetails): void {
    this.pdCurrentPriority = pd;
    this.processCurrentPriorityCovIfReady();
  }

  public subscribeStatus(statusSub: GmsSubscription<ValueDetails>): void {
    if (statusSub != null) {
      this.ngZone.runOutsideAngular(() => {
        this.statusSubscription = statusSub;
        this.summaryStatusSub = this.statusSubscription.changed.subscribe(
          vd => this.onStatusChanged(vd),
          er => this.onStatusChangedError(er)
        );
        this.statusSubscription.stateChanged.subscribe(
          state => this.onStatusSubscriptionStateChanged(state)
        );
      });
    } else {
      this.statusSubscription = null;
      this.summaryStatusSub = null;
    }
  }

  public subscribeDefaultProperty(valueSub: GmsSubscription<ValueDetails>): void {
    if (valueSub != null) {
      this.ngZone.runOutsideAngular(() => {
        this.propertyValueSubscription = valueSub;
        this.defPropertySub = this.propertyValueSubscription.changed.subscribe(
          vd => this.onValueChanged(vd),
          er => this.onValueChangedError(er)
        );
        this.statusSubscription.stateChanged.subscribe(
          state => this.onValueSubscriptionStateChanged(state)
        );
      });
    } else {
      this.propertyValueSubscription = null;
      this.defPropertySub = null;
    }
  }

  public subscribeCurrentPriorityProperty(currentPrioritySub: GmsSubscription<ValueDetails>): void {
    if (currentPrioritySub != null) {
      this.ngZone.runOutsideAngular(() => {
        this.propertyCurrentPrioritySubscription = currentPrioritySub;
        this.defCurrentPrioritySub = this.propertyCurrentPrioritySubscription.changed.subscribe(
          vd => this.onCurrentPriorityChanged(vd),
          er => this.onCurrentPriorityChangedError(er)
        );
        this.statusSubscription.stateChanged.subscribe(
          state => this.onCurrentPrioritySubscriptionStateChanged(state)
        );
      });
    } else {
      this.propertyCurrentPrioritySubscription = null;
      this.defCurrentPrioritySub = null;
    }
  }

  public subscribeFunctionDefaultProperty(valueSub: GmsSubscription<ValueDetails>): void {
    if (valueSub != null) {
      this.ngZone.runOutsideAngular(() => {
        this.functionPropertyValueSubscription = valueSub;
        this.defFunctionPropertySub = this.functionPropertyValueSubscription.changed.subscribe(
          vd => this.onFunctionPropertyValueChanged(vd),
          er => this.onFunctionPropertyValueChangedError(er)
        );

        this.statusSubscription.stateChanged.subscribe(
          state => this.onFunctionValueSubscriptionStateChanged(state)
        );
      });
    } else {
      this.functionPropertyValueSubscription = null;
      this.defFunctionPropertySub = null;
    }
  }

  public unsubscribe(): GmsSubscription<ValueDetails>[] {

    const subs: GmsSubscription<ValueDetails>[] = [];

    // dev note: we normally think of these two things (the
    // subscription and gms subscription) as going together,
    // but there are some situations where we have 'disconnected'
    // the subscription from the callback but the service
    // has not been called.

    if (this.summaryStatusSub != null) {
      this.summaryStatusSub.unsubscribe();
    }

    if (this.statusSubscription != null) {
      subs.push(this.statusSubscription);
    }

    if (this.defPropertySub != null) {
      this.defPropertySub.unsubscribe();
    }

    if (this.propertyValueSubscription != null) {
      subs.push(this.propertyValueSubscription);
    }

    this.summaryStatusSub = null;
    this.defPropertySub = null;
    this.statusSubscription = null;
    this.propertyValueSubscription = null;

    return subs;
  }

  public constructor(
    private readonly traceService: TraceService,
    private readonly locale: string,
    private readonly ngZone: NgZone,
    private readonly browserObj: BrowserObject) {

    this.defaultCurrentPriorityPropertyName = '';
    this.summaryStatusPropertyName = '';
    this.defaultPropertyName = '';

    if (browserObj.ObjectId) {

      const delimiter = '.';
      const defPropDpe = '';

      this.defaultCurrentPriorityPropertyName = browserObj.ObjectId + this.currentPriorityName;
      this.summaryStatusPropertyName = browserObj.ObjectId + this.statusSummaryDpeName;
      this.initPropertyName(browserObj);
      this.initFunctionPropertyName(browserObj);
    }

    this.propValue = null;
    this.defaultPropertyFormatter = null;
    this.defaultFunctionPropertyFormatter = null;
    this.summaryStatusSub = null;
    this.defPropertySub = null;
    this.statusSubscription = null;
    this.propertyValueSubscription = null;
    this.receivedText = false;
  }

  private initPropertyName(browserObj: BrowserObject): void {
    if (browserObj.ObjectId) {

      const delimiter = '.';
      let defPropDpe = '';

      if (browserObj.Attributes != null) {
        defPropDpe = browserObj.Attributes.DefaultProperty;
      }

      if (defPropDpe) {
        this.defaultPropertyName = browserObj.ObjectId + delimiter + defPropDpe;
      }
    }
  }

  private initFunctionPropertyName(browserObj: BrowserObject): void {
    if (browserObj.ObjectId) {
      const delimiter = '';
      let defPropDpe = '';

      if (browserObj.Attributes != null && browserObj.Attributes.FunctionDefaultProperty) {
        if (browserObj.Attributes.FunctionDefaultProperty) {
          defPropDpe = browserObj.Attributes.FunctionDefaultProperty;
        }
      }

      if (defPropDpe) {
        this.functionDefaultPropertyName = browserObj.ObjectId + delimiter + defPropDpe;
      }
    }
  }

  private processFunctionCovIfReady(): void {
    if (this.functionPd != null && this.receivedText) {
      this.defaultFunctionPropertyFormatter = new CovFormatter(
        this.locale,
        this.propertyAbsentText,
        this.comErrorText,
        this.functionPd);

      this.functionPd = null;
      const vd: ValueDetails = this.propValue;
      this.propValue = null;
      this.setFunctionPropertyValue(vd);
    }
  }

  private processCovIfReady(): void {
    if (this.pd != null && this.receivedText) {
      this.defaultPropertyFormatter = new CovFormatter(
        this.locale,
        this.propertyAbsentText,
        this.comErrorText,
        this.pd);

      this.pd = null;
      const vd: ValueDetails = this.propValue;
      this.propValue = null;
      this.setPropertyValue(vd);
    }
  }

  private processCurrentPriorityCovIfReady(): void {
    if (this.pdCurrentPriority != null && this.receivedText) {
      this.currentPriorityPropertyFormatter = new CovFormatter(
        this.locale,
        this.propertyAbsentText,
        this.comErrorText,
        this.pdCurrentPriority);

      this.pdCurrentPriority = null;
      const vd: ValueDetails = this.propValue;
      this.propValue = null;
      this.setCurrentPriorityValue(vd);
    }
  }

  private onStatusChanged(vd: ValueDetails): void {
    if (this.isValueOk(vd)) {
      if (vd.Value.QualityGood && !vd.Value.IsPropertyAbsent) {
        let stateColor: string;
        if (vd.Value.Value !== '0') {
          const v: any = vd;
          if (v.BackgroundColor !== undefined) {
            stateColor = 'rgba(' +
              v.BackgroundColor.R + ',' +
              v.BackgroundColor.G + ',' +
              v.BackgroundColor.B + ',' +
              v.BackgroundColor.A / 255 + ')';
          }
        }
        this.gridRow.enableStatePipe = true;
        this.gridRow.statePipeColor = stateColor;
      }
    }
  }

  private onStatusChangedError(er: any): void {
    this.traceService.debug(this.traceModule, 'onStatusChangedError: error (%s)', er);
  }

  private onStatusSubscriptionStateChanged(state: SubscriptionState): void {
    if (state === SubscriptionState.Unsubscribed) {
      if (this.summaryStatusSub != null) {
        this.summaryStatusSub.unsubscribe();
        this.summaryStatusSub = null;
      }
    }
  }

  private onValueChanged(vd: ValueDetails): void {
    if (this.defaultPropertyFormatter === null || this.readFunctionPropertyValid === true) {
      this.propValue = vd;
    } else {
      this.propValue = null;
      this.setPropertyValue(vd);
    }
  }

  private onValueChangedError(er: any): void {
    this.traceService.debug(this.traceModule, 'onValueChangedError: error (%s)', er);
  }

  private onCurrentPriorityChanged(vd: ValueDetails): void {
    this.setCurrentPriorityValue(vd);
  }

  private onCurrentPriorityChangedError(er: any): void {
    this.traceService.debug(this.traceModule, 'onCurrentPriorityChangedError: error (%s)', er);
  }

  private onFunctionPropertyValueChanged(vd: ValueDetails): void {
    this.readFunctionPropertyValid = true;
    if (this.defaultPropertyFormatter === null) {
      this.propValue = vd;
    } else {
      this.propValue = null;
      this.setFunctionPropertyValue(vd);
    }
  }

  private onFunctionPropertyValueChangedError(er: any): void {
    this.readFunctionPropertyValid = false;
    this.traceService.debug(this.traceModule, 'onFunctionPropertyValueChangedError: error (%s)', er);
  }

  private onValueSubscriptionStateChanged(state: SubscriptionState): void {
    if (state === SubscriptionState.Unsubscribed) {
      if (this.defPropertySub != null) {
        this.defPropertySub.unsubscribe();
        this.defPropertySub = null;
      }
    }
  }

  private onCurrentPrioritySubscriptionStateChanged(state: SubscriptionState): void {
    if (state === SubscriptionState.Unsubscribed) {
      if (this.defCurrentPrioritySub != null) {
        this.defCurrentPrioritySub.unsubscribe();
        this.defCurrentPrioritySub = null;
      }
    }
  }

  private onFunctionValueSubscriptionStateChanged(state: SubscriptionState): void {
    if (state === SubscriptionState.Unsubscribed) {
      if (!isNullOrUndefined(this.defFunctionPropertySub)) {
        this.defFunctionPropertySub.unsubscribe();
        this.defFunctionPropertySub = null;
      }
    }
  }

  private isValueOk(vd: ValueDetails): boolean {
    return !isNullOrUndefined(vd?.Value) && vd?.ErrorCode === 0;
  }

  private setPropertyValue(vd: ValueDetails): void {
    if (this.isValueOk(vd)) {
      // dev note: the formatter contains logic regarding absent and com errors
      // but we like having the control here.
      let v: string;
      if (vd.Value.IsPropertyAbsent) {
        v = this.propertyAbsentText;
      } else if (!vd.Value.QualityGood) {
        v = this.comErrorText;
      } else {
        v = this.defaultPropertyFormatter.format(vd);
      }
      this.gridRow.cellData.set(TvColumnIds.valueId, v);
    }
  }

  private setCurrentPriorityValue(vd: ValueDetails): void {
    if (this.isValueOk(vd)) {
      // dev note: the formatter contains logic regarding absent and com errors
      // but we like having the control here.
      let v: string;
      if (vd.Value.IsPropertyAbsent) {
        v = this.propertyAbsentText;
      } else if (!vd.Value.QualityGood) {
        v = this.comErrorText;
      } else {
        v = this.currentPriorityPropertyFormatter.format(vd);
      }
      this.gridRow.cellData.set(TvColumnIds.currentPriorityId, v);
    }
  }

  private setFunctionPropertyValue(vd: ValueDetails): void {
    if (this.isValueOk(vd)) {
      // dev note: the formatter contains logic regarding absent and com errors
      // but we like having the control here.
      let v: string;
      if (vd.Value.IsPropertyAbsent) {
        v = this.propertyAbsentText;
      } else if (!vd.Value.QualityGood) {
        v = this.comErrorText;
      } else {
        v = this.defaultFunctionPropertyFormatter.format(vd);
      }
      this.gridRow.cellData.set(TvColumnIds.valueId, v);
    }
  }
}
