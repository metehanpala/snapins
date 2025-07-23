import { ChangeDetectorRef, NgZone, ViewRef } from '@angular/core';
import {
  BrowserObject,
  GmsSubscription,
  PropertyDetails,
  PropertyInfo,
  PropertyServiceBase,
  SiIconMapperService,
  SystemBrowserServiceBase,
  TablesEx,
  ValueDetails,
  ValueSubscription2ServiceBase
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, concatMap, debounceTime, finalize, map, tap } from 'rxjs/operators';

import { RowSubscriptionInfoType } from "../interfaces";
import { EnumIconType, GridData, GridVirtualizedArgs } from '../textual-viewer-data.model';
import { CompareBrowserObjects } from './CompareBrowserObjects';
import { TvColumnIds, TvTraceModules } from './globals';
import { TextualViewerRowViewModel } from './row-vm';
import { TextualViewerSnapInViewModelBase } from './snapin-vm.base';

interface TypeIds {
  objTypeId: number;
  subTypeId: number;
}

class RowSubscriptionInfo {
  public get propertyName(): string {
    return this.propName;
  }
  public get vmRow(): TextualViewerRowViewModel {
    return this.row;
  }
  public get isStatus(): boolean {
    return this.rowSubInfoType === RowSubscriptionInfoType.Status;
  }
  public get isDefaultProperty(): boolean {
    return this.rowSubInfoType === RowSubscriptionInfoType.DefaultProperty;
  }
  public get isFunctionDefaultProperty(): boolean {
    return this.rowSubInfoType === RowSubscriptionInfoType.FunctionDefaultProperty;
  }
  public get isCurrentPriorityProperty(): boolean {
    return this.rowSubInfoType === RowSubscriptionInfoType.CurrentPriorityProperty;
  }
  constructor(
    private readonly propName: string,
    private readonly row: TextualViewerRowViewModel,
    private readonly rowSubInfoType: RowSubscriptionInfoType) {
  }
}

export class TextualViewerSnapInViewModel implements TextualViewerSnapInViewModelBase {

  private valueSubscriptionReg: string;
  private locale: string;
  private propertyAbsentText: string;
  private comErrorText: string;
  private readonly gridRows: GridData[] = [];
  private currSel: GridData[] = [];
  private viewModelRows: TextualViewerRowViewModel[] = [];
  private rowsWithDefProp: TextualViewerRowViewModel[] = [];
  private rowsWithDefFuncProp: TextualViewerRowViewModel[] = [];
  private context: BrowserObject[] = [];
  private isDisposed = false;
  private isActivated = false;
  private awaitingCD = false;
  private receivedText = false;
  private cd: ChangeDetectorRef;

  private readonly gridRowByObjectTypes: Map<TypeIds, GridData[]> = new Map<TypeIds, GridData[]>();

  private readonly activeItemsChanged: Subject<void> = new Subject<void>();
  private readonly loadingInd: Subject<boolean>;
  private pendingSetContext: Subscription;
  private subscriptions: Subscription[] = [];
  private rowsVirtualized: GridData[] = [];
  private rowsNonVirtualized: GridData[] = [];

  private readonly traceModule: string = TvTraceModules.tv;

  private readonly imageTypeSvg: string = 'data:image/svg+xml;utf8,';
  private readonly imageTypePng: string = 'data:image/png;base64,';

  private readonly clearIconPng: string = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

  /**
   * GMS object-type validation
   */
  public static isObjectTypeValid(typeId: number): boolean {
    // If object type is unassigned at the server, its value will be -1 stored
    // as a 16-bit signed int and passed by the WSI as unsigned integer (65535).
    return (!isNaN(typeId) && typeId !== 65535);
  }

  public get id(): string {
    return this.sniId;
  }

  public get objectList(): GridData[] {
    return this.gridRows;
  }

  public get currentSelection(): GridData[] {
    return this.currSel;
  }

  public get loading(): Observable<boolean> {
    return this.loadingInd;
  }

  public activate(locale: string, cdf: ChangeDetectorRef): void {
    this.checkDisposed('activate');

    if (!this.isActivated) {
      this.locale = locale;
      this.cd = cdf;

      // Only to be done on first activation of the view-model
      if (!this.valueSubscriptionReg) {
        this.valueSubscriptionReg = this.valueSubscriptionService.registerClient(this.sniId);

        this.subscriptions.push(
          this.activeItemsChanged
            .pipe(debounceTime(300))
            .subscribe(() => this.onActiveItemsChanged())
        );
      }

      this.isActivated = true;
    }

    this.traceService.info(this.traceModule, 'Activate view-model: sniId=%s', this.sniId);
  }

  public deactivate(): void {
    this.checkDisposed('deactivate');

    // dev note: we skip checking the activation state here because
    // this method is also called from dispose - and it is entirely
    // possible that the vm has been deactivated.

    this.clearAnyExistingSubscriptions();
    this.isActivated = false;
    this.traceService.info(this.traceModule, 'Deactivate view-model: sniId=%s', this.sniId);
  }

  public dispose(): void {
    if (!this.isDisposed) {
      this.deactivate();
      if (this.valueSubscriptionReg) {
        this.valueSubscriptionService.disposeClient(this.valueSubscriptionReg);
        this.valueSubscriptionReg = undefined;
      }
      this.subscriptions.forEach((sub: Subscription) => {
        if (sub != null) {
          sub.unsubscribe();
        }
      });
      this.subscriptions = [];
      this.receivedText = false;
      this.isDisposed = true;
      this.traceService.info(this.traceModule, 'Disposed view-model: sniId=%s', this.sniId);
    }
  }

  public setText(propAbs: string, commErr: string): void {
    this.propertyAbsentText = propAbs;
    this.comErrorText = commErr;
    this.receivedText = true;
    // this handles the case where we got the text after
    // the grid rows have been set up
    this.viewModelRows.forEach(r => r.setText(propAbs, commErr));
  }

  public setContext(bos: BrowserObject[]): void {
    this.checkDisposed('setContext');
    this.checkActivation('setContext');

    const boArr: BrowserObject[] = (bos || [])
      .filter(bo => !isNullOrUndefined(bo))
      .map(bo => Object.assign({}, bo));

    if (CompareBrowserObjects.sameCollection(this.context, boArr)) {
      this.traceService.debug(this.traceModule, 'Provided selection matches current context; no update required');
      return;
    }

    if (this.pendingSetContext) {
      this.traceService.debug(this.traceModule, 'Aborting in-progress request to set previous selection context');
      this.pendingSetContext.unsubscribe();
    }
    this.pendingSetContext = of(boArr)
      .pipe(
        tap(boa => {
          this.traceService.debug(this.traceModule, 'Set new selection context start: %s', boa[0]?.Name);
          this.loadingInd.next(true);
          this.clear();
          this.context = boa;
        }),
        concatMap(boa => {
          if (boa.length === 1) {
            const parent: BrowserObject = boa[0];
            return this.systemBrowserService.getNodes(parent.SystemId, parent.ViewId, parent.Designation);
          } else {
            return of(undefined);
          }
        }),
        map(children => {
          if (children?.length) {
            this.context.push(...children);
          }
        }),
        tap(() => {
          this.createGridRows();
        }),
        catchError(err => {
          this.traceService.error(this.traceModule, 'Error setting selection context: %s', err);
          return of(undefined);
        }),
        finalize(() => {
          this.pendingSetContext = undefined;
          this.loadingInd.next(false);
          this.traceService.debug(this.traceModule, 'Set new selection context end: %s', boArr[0]?.Name);
        }))
      .subscribe();
  }

  /*
     * the user has selected some row(s) in the grid. we dig out
     * the associated browser objects and pass them back to the
     * snapin, which is responsible for passing the selection
     * on to hfw
     */
  public getBrowserObjectsForSelection(selection: GridData[]): BrowserObject[] {
    this.checkDisposed('getBrowserObjectsForSelection');
    this.checkActivation('getBrowserObjectsForSelection');
    this.currSel = selection;

    // dev note: we could have done this in the snapin, but that
    // would have required the snapin to 'know' something
    // about the grid data <=> row vm relationship.

    return selection.filter(a => a != null)
      .map(b => b.customData.browserObject);
  }

  public onGridVirtualizedChanged(args: GridVirtualizedArgs): void {
    this.checkDisposed('onGridVirtualizedChanged');
    this.checkActivation('onGridVirtualizedChanged');

    if (this.areArgsOk(args)) {
      let isUpdate = false;
      args.gridData.forEach(gd => {
        if (args.virtualized) {
          isUpdate = this.addVirtualizedItem(gd) || isUpdate;
        } else {
          isUpdate = this.addNonVirtualizedItem(gd) || isUpdate;
        }
      });

      // If an update occurred, send trigger the event to process
      // pending items. This subject has a 'debounce' delay set in
      // order to throttle the frequency of subscription requests
      // to the server.

      if (isUpdate) {
        this.activeItemsChanged.next();
      }
    }
  }

  public clear(): void {
    this.checkDisposed('clear');

    this.clearAnyExistingSubscriptions();

    this.gridRows.length = 0;

    this.viewModelRows = [];
    this.rowsWithDefProp = [];
    this.context = [];

    this.gridRowByObjectTypes.clear();
  }

  /*
     * constructor arguments:
     * sniId - snapin identifier, used by snapin service to uniquely
     *         keep track of this instance of the vm
     * systemBrowserService - used to find children
     * propertyService - used to retrieve info for the default property
     * valueSubscriptionService - used to subscribe for property COVs
     * iconMapperService - used to retrieve icon for global object types
     * traceService - tracing service, eh?
     * cd - change detector
     * ngZone - used to separate some behavior from angular
     */
  constructor(
    private readonly sniId: string,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly propertyService: PropertyServiceBase,
    private readonly valueSubscriptionService: ValueSubscription2ServiceBase,
    private readonly iconMapperService: SiIconMapperService,
    private readonly traceService: TraceService,
    private readonly ngZone: NgZone) {
    if (!sniId) {
      throw new Error('sniId cannot be undefined or empty');
    }
    this.loadingInd = new Subject<boolean>();
  }

  private mkRowVm(bo: BrowserObject): TextualViewerRowViewModel {
    return new TextualViewerRowViewModel(
      this.traceService,
      this.locale,
      this.ngZone,
      bo);
  }

  private mkGridRow(bo: BrowserObject): GridData {
    let gh = '';
    let alias = '';
    let desc = '';

    if (bo.Descriptor) {
      desc = bo.Descriptor;
    }

    if (bo.Location) {
      const path: string = bo.Location;
      const index: number = path.lastIndexOf(desc);
      if (index > 0) {
        gh = path.substring(0, index - 1);
      }
    }

    if (bo.Attributes != null) {
      if (bo.Attributes.Alias) {
        alias = bo.Attributes.Alias;
      }
    }

    return {
      enableStatePipe: false,
      statePipeColor: null,
      firstInGroup: false,
      groupHeader: gh,
      cellData: new Map([
        [TvColumnIds.statusId, this.imageTypePng + this.clearIconPng], // old-style icon format (not an Icon object)
        [TvColumnIds.descriptorId, desc],
        [TvColumnIds.nameId, bo.Name],
        [TvColumnIds.aliasId, alias],
        [TvColumnIds.valueId, ''],
        [TvColumnIds.emptyColumnId, ''],
        [TvColumnIds.currentPriorityId, '']
      ]),
      cellStyle: new Map([]),
      rowStyle: '',
      rowStyleClass: 'hfw-grid-cell-style1'
    };
  }

  private addToGridByTypes(types: TypeIds, gd: GridData): void {
    let arr: GridData[] = this.gridRowByObjectTypes.get(types);
    if (arr === undefined) {
      arr = [];
      this.gridRowByObjectTypes.set(types, arr);
    }
    arr.push(gd);
  }

  private compareGridDataByHeader(gd1: GridData, gd2: GridData): number {
    return gd1.groupHeader.localeCompare(gd2.groupHeader);
  }

  private areArgsOk(args: GridVirtualizedArgs): boolean {
    return !isNullOrUndefined(args?.gridData);
  }

  private clearAnyExistingSubscriptions(): void {
    const subs: GmsSubscription<ValueDetails>[] = [];

    this.viewModelRows.filter(a => a.isSubscribed)
      .forEach(b => { subs.push(...b.unsubscribe()); });

    if (subs.length > 0) {
      this.valueSubscriptionService.unsubscribeValues(subs, this.valueSubscriptionReg);
    }
  }

  private updateFirstInGroup(gridRows: GridData[]): void {
    let currentGroupHeader: string = null;
    gridRows.forEach((gd: GridData) => {
      if (gd.groupHeader !== currentGroupHeader) {
        gd.firstInGroup = true;
        currentGroupHeader = gd.groupHeader;
      }
    });
  }

  private checkDisposed(fcn: string): void {
    if (this.isDisposed) {
      throw new Error(`View model has been disposed: Id=${this.sniId} Function=${fcn}`);
    }
  }

  private checkActivation(fcn: string): void {
    if (!this.isActivated) {
      throw new Error(`View model has not been activated: Id=${this.sniId} Function=${fcn}`);
    }
  }
  private addVirtualizedItem(gd: GridData): boolean {
    if (gd != null) {
      return this.addToCollection(gd, this.rowsVirtualized);
    }
    return false;
  }

  private addNonVirtualizedItem(gd: GridData): boolean {
    if (gd != null) {
      return this.addToCollection(gd, this.rowsNonVirtualized);
    }
    return false;
  }

  private addToCollection(gd: GridData, col: GridData[]): boolean {
    let didIt = false;
    if (!col.includes(gd)) {
      col.push(gd);
      didIt = true;
    }
    return didIt;
  }

  private findToSub(): RowSubscriptionInfo[] {
    const subInfo: RowSubscriptionInfo[] = [];

    this.rowsVirtualized.forEach(gd => {
      const vmRow: TextualViewerRowViewModel = gd.customData;
      if (!vmRow.isSubscribed) {
        if (vmRow.statusName) {
          const rsi: RowSubscriptionInfo = new RowSubscriptionInfo(vmRow.statusName, vmRow, RowSubscriptionInfoType.Status);
          subInfo.push(rsi);
        }

        if (!isNullOrUndefined(vmRow?.propertyName)) {
          const rsi: RowSubscriptionInfo = new RowSubscriptionInfo(vmRow.propertyName, vmRow, RowSubscriptionInfoType.DefaultProperty);
          subInfo.push(rsi);
        }

        if (!isNullOrUndefined(vmRow?.functionPropertyName)) {
          const rsi: RowSubscriptionInfo = new RowSubscriptionInfo(vmRow.functionPropertyName, vmRow, RowSubscriptionInfoType.FunctionDefaultProperty);
          subInfo.push(rsi);
        }

        if (!isNullOrUndefined(vmRow?.currentPriorityPropertyName)) {
          const rsi: RowSubscriptionInfo = new RowSubscriptionInfo(vmRow.currentPriorityPropertyName, vmRow, RowSubscriptionInfoType.CurrentPriorityProperty);
          subInfo.push(rsi);
        }
      }
    });

    this.rowsVirtualized = [];

    return subInfo;
  }

  private findToUnsub(): GmsSubscription<ValueDetails>[] {
    const subsToDelete: GmsSubscription<ValueDetails>[] = [];

    this.rowsNonVirtualized.forEach(gd => {
      const vmRow: TextualViewerRowViewModel = gd.customData;
      if (vmRow.isSubscribed) {
        subsToDelete.push(...vmRow.unsubscribe());
      }
    });

    this.rowsNonVirtualized = [];

    return subsToDelete;
  }

  private subImpl(): void {
    const subInfo: RowSubscriptionInfo[] = this.findToSub();
    if (subInfo.length > 0) {
      const propNames: string[] = subInfo.map(i => i.propertyName);
      const subs: GmsSubscription<ValueDetails>[] = this.valueSubscriptionService.subscribeValues(propNames, this.valueSubscriptionReg);
      subs.forEach((s, i) => {
        const r: TextualViewerRowViewModel = subInfo[i].vmRow;
        if (subInfo[i].isStatus) {
          r.subscribeStatus(s);
        } else if (subInfo[i].isDefaultProperty) {
          r.subscribeDefaultProperty(s);
        } else if (subInfo[i].isFunctionDefaultProperty) {
          r.subscribeFunctionDefaultProperty(s);
        } else if (subInfo[i].isCurrentPriorityProperty) {
          r.subscribeCurrentPriorityProperty(s);
        }
      });
    }
  }

  private unsubImpl(): void {
    const subs: GmsSubscription<ValueDetails>[] = this.findToUnsub();
    if (subs.length > 0) {
      this.valueSubscriptionService.unsubscribeValues(subs, this.valueSubscriptionReg);
    }
  }

  private onActiveItemsChanged(): void {
    this.subImpl();
    this.unsubImpl();

    this.traceService.debug(this.traceModule, 'onActiveItemsChanged()');
  }

  private getPropertyDetails(): void {
    // note here that a row may not have a default property, so we create
    // a subset that will match one-for-one with the returned properties
    this.rowsWithDefProp = this.viewModelRows.filter(a => a.propertyName);

    const propNames: string[] = this.rowsWithDefProp.map(b => b.propertyName);

    if (propNames.length > 0) {
      const readType = 2;
      const readAllProps = false;

      this.propertyService.readPropertiesMulti(propNames, readType, readAllProps)
        .subscribe(
          pds => this.onGetPropertyDetails(pds),
          err => this.onGetPropertyDetailsError(err)
        );
    }
  }

  private getFunctionPropertyDetails(): void {
    // note here that a row may not have a default property, so we create
    // a subset that will match one-for-one with the returned properties
    this.rowsWithDefFuncProp = this.viewModelRows.filter(a => a.functionPropertyName);

    const propNames: string[] = this.rowsWithDefFuncProp.map(b => b.functionPropertyName);

    if (propNames.length > 0) {
      const readType = 2;
      const readAllProps = false;

      this.propertyService.readPropertiesMulti(propNames, readType, readAllProps)
        .subscribe(
          pds => this.onGetFunctionPropertyDetails(pds),
          err => this.onGetFunctionPropertyDetailsError(err)
        );
    }
  }

  private onGetFunctionPropertyDetails(props: PropertyInfo<PropertyDetails>[]): void {
    if (props.length === this.rowsWithDefFuncProp.length) {
      props.forEach((pi, i) => {
        const pd: PropertyDetails = this.getDetails(pi);
        if (pd !== null) {
          this.rowsWithDefFuncProp[i].setFunctionPropertyDetails(pd);
          // we checked for text when we created the row, but
          // between then and now we may have received it -
          // so let's check again and set if we can
          if (this.receivedText) {
            this.rowsWithDefFuncProp[i].setFunctionText(this.propertyAbsentText, this.comErrorText);
          }
        }
      });
    }
    this.rowsWithDefFuncProp = [];
  }

  private onGetPropertyDetails(props: PropertyInfo<PropertyDetails>[]): void {
    if (props.length === this.rowsWithDefProp.length) {
      props.forEach((pi, i) => {
        const pd: PropertyDetails = this.getDetails(pi);
        if (pd !== null) {
          this.rowsWithDefProp[i].setPropertyDetails(pd);
          // we checked for text when we created the row, but
          // between then and now we may have received it -
          // so let's check again and set if we can
          if (this.receivedText) {
            this.rowsWithDefProp[i].setText(this.propertyAbsentText, this.comErrorText);
          }
        }
      });
    }
    this.rowsWithDefProp = [];
  }

  private onGetCurrentPriorityPropertyDetails(props: PropertyInfo<PropertyDetails>[]): void {
    if (props.length === this.rowsWithDefFuncProp.length) {
      props.forEach((pi, i) => {
        const pd: PropertyDetails = this.getDetails(pi);
        if (pd !== null) {
          this.rowsWithDefFuncProp[i].setCurrentPriorityPropertyDetails(pd);
          // we checked for text when we created the row, but
          // between then and now we may have received it -
          // so let's check again and set if we can
          if (this.receivedText) {
            this.rowsWithDefFuncProp[i].setFunctionText(this.propertyAbsentText, this.comErrorText);
          }
        }
      });
    }
    this.rowsWithDefFuncProp = [];
  }

  private onGetFunctionPropertyDetailsError(err: any): void {
    this.traceService.error(this.traceModule, `onGetFunctionPropertyDetailsError: ${err}`);
  }

  private onGetPropertyDetailsError(err: any): void {
    this.traceService.error(this.traceModule, `onGetPropertyDetailsError: ${err}`);
  }

  private onGetCurrentPriorityPropertyDetailsError(err: any): void {
    this.traceService.error(this.traceModule, `onGetCurrentPriorityPropertyDetailsError: ${err}`);
  }

  private hasProperties(pds: PropertyDetails[]): boolean {
    return pds !== undefined && pds !== null && pds.length > 0;
  }

  private getDetails(pi: PropertyInfo<PropertyDetails>): PropertyDetails {
    let pd: PropertyDetails = null;

    if (pi.ErrorCode === 0) {
      if (this.hasProperties(pi.FunctionProperties)) {
        pd = pi.FunctionProperties[0];
      } else if (this.hasProperties(pi.Properties)) {
        pd = pi.Properties[0];
      }
    } else {
      this.traceService.debug('getDetails: error code (%s)', pi.ErrorCode.toString());
    }

    return pd;
  }

  private getCurrentPriorityDetails(): void {
    // note here that a row may not have a default property, so we create
    // a subset that will match one-for-one with the returned properties
    this.rowsWithDefFuncProp = this.viewModelRows.filter(a => a.currentPriorityPropertyName);

    const propNames: string[] = this.rowsWithDefFuncProp.map(b => b.currentPriorityPropertyName);

    if (propNames.length > 0) {
      const readType = 2;
      const readAllProps = false;

      this.propertyService.readPropertiesMulti(propNames, readType, readAllProps)
        .subscribe(
          pds => this.onGetCurrentPriorityPropertyDetails(pds),
          err => this.onGetCurrentPriorityPropertyDetailsError(err)
        );
    }
  }

  private getIcons(): void {
    this.gridRowByObjectTypes.forEach((rows, types, c) => {

      this.traceService.debug(this.traceModule, `Requesting icon image: TypeId = ${types.objTypeId}, SubTypeId = ${types.subTypeId}`);

      this.ngZone.runOutsideAngular(() => {
        this.iconMapperService.getGlobalIcon(TablesEx.ObjectSubTypes, types.subTypeId, types.objTypeId).subscribe(
          icon => this.onGetIcon(types, icon),
          err => this.onGetIconError(err)
        );
      });
    });
  }

  private onGetIconError(err: any): void {
    this.traceService.error(this.traceModule, `onGetIconError: ${err}`);
  }

  private forceDetectChanges(): void {
    if (!this.awaitingCD) {
      this.awaitingCD = true;
      setTimeout(() => {
        if (!(this.cd as ViewRef).destroyed) {
          this.cd.detectChanges();
        }
        this.awaitingCD = false;
      }, 300);
    }
  }

  private onGetIcon(types: TypeIds, icon: string): void {

    const rows: GridData[] = this.gridRowByObjectTypes.get(types);

    if (rows !== undefined) {
      rows.forEach(r => r.cellData.set(TvColumnIds.statusId, { iconType: EnumIconType.GLYPHICON, iconData: icon }));

      this.forceDetectChanges();

      this.traceService.debug(this.traceModule, `Updated grid rows for TypeId=${types.objTypeId}, SubTypeId=${types.subTypeId}`);

      this.gridRowByObjectTypes.delete(types);
    } else {
      this.traceService.debug(this.traceModule, `No grid rows for icon for TypeId=${types.objTypeId}, SubTypeId=${types.subTypeId}`);
    }
  }

  private createGridRows(): void {

    const gRows: GridData[] = [];

    this.context.forEach(bo => {

      const rowVm: TextualViewerRowViewModel = this.mkRowVm(bo);
      const gd: GridData = this.mkGridRow(bo);

      gd.customData = rowVm;
      rowVm.gridRow = gd;

      if (this.receivedText) {
        rowVm.setText(this.propertyAbsentText, this.comErrorText);
      }

      this.viewModelRows.push(rowVm);
      gRows.push(gd);

      // keep track of grid rows by object type (for icon)
      // note: no attributes, no object type => no icon

      if (bo.Attributes != null) {
        if (TextualViewerSnapInViewModel.isObjectTypeValid(bo.Attributes.TypeId)) {
          this.addToGridByTypes({ objTypeId: bo.Attributes.TypeId, subTypeId: bo.Attributes.SubTypeId }, gd);
        }
      }
    });

    // we need to sort the grid rows by header so that:
    // 1) for display - they all end up next to each other
    // 2) we can correctly identify the 'first' row in a group

    gRows.sort(this.compareGridDataByHeader);

    this.updateFirstInGroup(gRows);

    this.gridRows.push(...gRows);

    this.getPropertyDetails();
    this.getFunctionPropertyDetails();
    this.getCurrentPriorityDetails();

    this.getIcons();
  }

}
