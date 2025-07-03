/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import { ApplicationRight, AppRightsService, LicenseOptionsService } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, forkJoin, Observable, of as observableOf, of } from 'rxjs';

import { TraceModules } from '../shared';

const operatorTaskSnapinId = 110000;
const createNewTask = 3520000;
const deleteTask = 3520001;
const stopTaskRunning = 3520002;
const updateAnyTasks = 3520003;
const showSnapin = 3520004;
const configure = 3520005;
const allowAutoRevert = 3520006;
const operatorTaskLicenseId = 'sbt_gms_opt_operatortasks';

@Injectable()
export class OperatorTaskRightsService {

  public operatorTasksAccess: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public canShowSnapIn: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private canCreateNewTask = false;
  public get CanCreateNewTask(): boolean {
    return this.canCreateNewTask;
  }

  private canDeleteTask = false;
  public get CanDeleteTask(): boolean {
    return this.canDeleteTask;
  }

  private canStopRunningTasks = false;
  public get CanStopRunningTasks(): boolean {
    return this.canStopRunningTasks;
  }

  private canUpdateAnyTasks = false;
  public get CanUpdateAnyTasks(): boolean {
    return this.canUpdateAnyTasks;
  }

  private canConfigure = false;
  public get CanConfigure(): boolean {
    return this.canConfigure;
  }

  private canAllowAuomaticRevert = false;
  public get CanAllowAuomaticRevert(): boolean {
    return this.canAllowAuomaticRevert;
  }

  private appRightsOperatorTask: ApplicationRight;

  constructor(private readonly appRightsService: AppRightsService,
    private readonly licenseOptionsServices: LicenseOptionsService,
    private readonly traceService: TraceService) { }

  public initialize(): void {
    this.appRightsOperatorTask = this.appRightsService.getAppRights(operatorTaskSnapinId);

    if (this.appRightsOperatorTask === undefined) {
      return;
    }

    const ids = this.appRightsOperatorTask?.Operations?.map(value => value.Id);
    this.operatorTasksAccess.next(true);

    forkJoin({ license: this.getLicenseOptionsRight(), showRight: of(ids?.includes(showSnapin)) })
      .subscribe(({ license, showRight }) => {
        this.traceService.info(TraceModules.snapinTrace, `Operator Task - License permission:${license}, Snapin show right:${showRight}`);
        this.canShowSnapIn.next(license && showRight);
      });

    this.canCreateNewTask = ids?.includes(createNewTask);
    this.canDeleteTask = ids?.includes(deleteTask);
    this.canStopRunningTasks = ids?.includes(stopTaskRunning);
    this.canUpdateAnyTasks = ids?.includes(updateAnyTasks);
    this.canConfigure = ids?.includes(configure);
    this.canAllowAuomaticRevert = ids?.includes(allowAutoRevert);
    this.traceService.info(TraceModules.snapinTrace, 'Operator Tasks Rights Service Initialized');
  }

  private getLicenseOptionsRight(): Observable<boolean> {
    const licenseOptionsDocument = this.licenseOptionsServices.getLicenseOptionsRights(operatorTaskLicenseId);
    if (licenseOptionsDocument) {
      if (licenseOptionsDocument?.Available === -1) {
        return observableOf(true);
      } else {
        return licenseOptionsDocument.Required <= (licenseOptionsDocument.Available) ? observableOf(true) : observableOf(false);
      }
    }
    return observableOf(false);
  }
}
