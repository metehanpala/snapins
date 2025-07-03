import { Observable, Observer, of } from 'rxjs';
import { Injectable } from '@angular/core';

import { IQParamService, MessageParameters } from '@gms-flex/core';
import { isNullOrUndefined, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { BrowserObject, Designation, GmsMessageData, MultiMonitorServiceBase, SystemBrowserServiceBase, ViewType } from '@gms-flex/services';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { TraceModules } from '../shared/trace-modules';
import { AggregateViewId } from '../object-manager-core/view-model/object-view';
import { AggregateViewIfc, ObjectManagerCoreServiceBase } from '../object-manager-core/object-manager-core.service.base';
@Injectable({
  providedIn: 'root'
})
export class SystemQParamService implements IQParamService {
  public typeId = 'SystemQParamService';
  private readonly _settingId: string = 'Web_SystemBrowser_SelectedHierarchy';
  private readonly _startUpNodeSettingsId: string = 'Web_Account_SelectedNode';

  private _userSettingsFirstView: AggregateViewId;

  constructor(private readonly traceService: TraceService,
    private readonly omCoreService: ObjectManagerCoreServiceBase,
    private readonly multimonitorService: MultiMonitorServiceBase,
    private readonly settingsService: SettingsServiceBase) {
    this.traceService.debug(TraceModules.systemQParamSvc, 'SystemBrowserQParamService created.');
  }

  public getMessageParameters(param: string, paramValue: string): Observable<MessageParameters> {
    this.traceService.info(TraceModules.systemQParamSvc, 'getMessageParameters() called from HFW:\paramValue=%s', paramValue);

    const messageObs: Observable<MessageParameters> = new Observable((observer: Observer<MessageParameters>) => {
      this.onGetMessageParametersSubscription(observer, param, paramValue);
      return (): void => this.teardownLogic();
    });
    return messageObs;
  }

  public getFirstAutomaticSelection(frameId: string): Observable<MessageParameters> {
    this.traceService.info(TraceModules.systemQParamSvc, 'getFirstAutomaticSelection() called from HFW.s');

    const messageObs: Observable<MessageParameters> = new Observable((observer: Observer<MessageParameters>) => {
      this.onGetFirstAutomaticSelectionSubscription(observer, frameId);
      return (): void => this.teardownLogic();
    });
    return messageObs;
  }

  private onGetMessageParametersSubscription(observer: Observer<MessageParameters>,
    param: string, paramValue: string): void {
    const ds: Designation = new Designation(paramValue);
    if (ds != null) {
      this.omCoreService.findObject(ds.designation)
        .subscribe(bo => {
          if (bo) {
            const gmsMessageData: GmsMessageData = new GmsMessageData([bo]);
            const messageParameters: MessageParameters = {
              messageBody: gmsMessageData,
              types: [bo.Attributes.ManagedTypeName],
              qParam: { name: param, value: bo.Designation }
            };
            this.pushToClientAndDispose(observer, messageParameters);
          } else {
            this.pushToClientAndDispose(observer, null);
          }
        },
        err => {
          this.traceService.error(TraceModules.systemQParamSvc, err);
          this.pushToClientAndDispose(observer, null);
        }
        );
    } else {
      this.pushToClientAndDispose(observer, null);
    }
  }

  private findBOSubscription(observer: Observer<MessageParameters>,
    param: string, paramValue: string): Observable<boolean> {
    return new Observable(observerRet => {
      const ds: Designation = new Designation(paramValue);
      if (ds != null) {
        this.omCoreService.findObject(ds.designation)
          .subscribe(bo => {
            if (bo) {
              const gmsMessageData: GmsMessageData = new GmsMessageData([bo]);
              const messageParameters: MessageParameters = {
                messageBody: gmsMessageData,
                types: [bo.Attributes.ManagedTypeName],
                qParam: { name: param, value: bo.Designation }
              };
              this.pushToClientAndDispose(observer, messageParameters);
              observerRet.next(true);
            } else {
              observerRet.error(new Error(`Node not found  ${paramValue}`));
            }
          },
          err => {
            this.traceService.error(TraceModules.systemQParamSvc, err);
            observerRet.error(err);
          }
          );
      } else {
        // this.pushToClientAndDispose(observer, null);
        observerRet.next(false);
      }
    });
  }

  private onGetFirstAutomaticSelectionSubscription(observer: Observer<MessageParameters>, frameId: string): void {
    let startupNodeObs: Observable<string>;
    if (this.multimonitorService.runsInElectron) {
      if (this.multimonitorService.synchronizeWithUserSettings()) {
        startupNodeObs = this.settingsService.getSettings(this._startUpNodeSettingsId);
      } else {
        const startUpDes = this.multimonitorService.getStartupNode();
        startupNodeObs = of(startUpDes);
      }
    } else {
      startupNodeObs = this.settingsService.getSettings(this._startUpNodeSettingsId);
    }

    // Test if it's saved startUpNode
    startupNodeObs.pipe(
      // TODO: single check 'primary' parameter
      concatMap((settings: string) =>
        this.findBOSubscription(observer, frameId + '.SystemQParamService.primary', settings)),
      catchError(err => {
        // if not, manage view--rootNode and saved it as startUpNode
        this.settingsService.getSettings(this._settingId).pipe(
          tap(settings => this.setSettings(settings)),
          concatMap(() => this.omCoreService.getViews()),
          tap(agViews => this.onViewRecieved(agViews, observer, frameId)),
          catchError(_err => {
            this.traceService.error(TraceModules.systemQParamSvc, _err);
            this.pushToClientAndDispose(observer, null);
            return of(undefined);
          })).subscribe(
          () => {
            this.traceService.debug(TraceModules.systemQParamSvc, 'onGetFirstAutomaticSelection completed.');
          });
        return of(undefined);
      })).subscribe(
      val => {
        if (!isNullOrUndefined(val)) {
          this.traceService.debug(TraceModules.systemQParamSvc, 'onGetFirstAutomaticSelection: %s ', val.valueOf.toString());
          this.traceService.debug(TraceModules.systemQParamSvc, 'onGetFirstAutomaticSelection completed.');
        }
      },
      err => this.traceService.error(TraceModules.systemQParamSvc, err));
  }

  private setSettings(settings: string): Observable<boolean> {
    return new Observable(observerRet => {
      if (!isNullOrUndefined(settings)) {
        const parts: string[] = settings.split('.');
        if (parts && parts.length === 2) {
          this._userSettingsFirstView = {
            type: parseInt(parts[0], 10),
            description: parts[1]
          };
          observerRet.next(true);
        } else {
          observerRet.next(false);
        }
      } else {
        observerRet.next(false);
      }
    });
  }

  private onViewRecieved(agViews: readonly AggregateViewIfc[],
    observer: Observer<MessageParameters>, frameId: string): void {
    let initialView: AggregateViewIfc;
    if (agViews && agViews.length > 0) {
      if (this._userSettingsFirstView != null) {
        initialView = agViews.find(v => v.isIdMatch(this._userSettingsFirstView));
      }
      if (!initialView) {
        initialView = agViews.find(v => v.type === ViewType.Application) || agViews[0];
      }
    }
    this.getRootNodeAndComplete(initialView, observer, frameId);
  }

  private getRootNodeAndComplete(agView: AggregateViewIfc, observer: Observer<MessageParameters>, frameId: string): void {
    if (agView) {
      agView.getRootNodes()
        .subscribe(cnsRoots => {
          if (cnsRoots && cnsRoots.length > 0) {
            const bo: BrowserObject = cnsRoots[0].browserObj;
            const gmsMessageData: GmsMessageData = new GmsMessageData([bo]);
            const messageParameters: MessageParameters = {
              messageBody: gmsMessageData,
              types: [bo.Attributes.ManagedTypeName],
              qParam: { name: frameId + '.SystemQParamService.primary', value: bo.Designation } // TODO: single check 'primary' param
            };
            // save this node as startup node
            this.setStartUpNode(bo.Designation);
            this.pushToClientAndDispose(observer, messageParameters);
          } else {
            this.pushToClientAndDispose(observer, null);
          }
        });
    } else {
      this.pushToClientAndDispose(observer, null);
    }
  }

  private setStartUpNode(nodeDesignation: string): void {
    if (this.multimonitorService.runsInElectron) {
      if (this.multimonitorService.isCurrentMultiMonitorConfigurationChangeAllowed()) {
        // This is true in the following cases:
        // (No default multi monitor configuration available) OR ('OverruleAllowed' flag of the default multi monitor configuration is set) OR
        // (the user owns the application right 'Configure Multi Monitor') AND (closed mode is not enabled)
        this.multimonitorService.setStartupNode(nodeDesignation);
        if (this.multimonitorService.synchronizeWithUserSettings()) {
          this.setStartUpNodeSettings(nodeDesignation);
        }
      }
    } else {
      this.setStartUpNodeSettings(nodeDesignation);
    }
  }

  private setStartUpNodeSettings(nodeDesignation: string): void {
    if (nodeDesignation && nodeDesignation.length > 0) {
      this.settingsService.putSettings(this._startUpNodeSettingsId, nodeDesignation).subscribe(
        val => this.traceService.debug(TraceModules.systemQParamSvc, 'System browser qService: setStartUpNode(): %s', val.valueOf.toString()),
        err => this.traceService.error(TraceModules.systemQParamSvc, err)
      );
    }
  }

  private pushToClientAndDispose(observer: Observer<MessageParameters>, result: MessageParameters): void {
    observer.next(result);
    observer.complete();
  }

  private teardownLogic(): void {
    this.traceService.info(TraceModules.systemQParamSvc, 'teardownLogic() called for EventListModeService.getMessageParameters');
    this.dispose();
  }

  private dispose(): void {
    //
  }
}
