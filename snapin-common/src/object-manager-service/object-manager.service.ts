import { Injectable } from '@angular/core';
import { Observable, Observer, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { BrowserObject, Designation, Page, SystemBrowserServiceBase } from '@gms-flex/services';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { ObjectManagerSaveAction } from '../object-manager/object-manager.types';
import { ObjectManagerServiceBase } from './object-manager.service.base';
import { ModalDialogResult, ObjectManagerServiceModalOptions, ObjectManagerServiceModalResult } from './data.model';
import { ServiceTemplateComponent } from './service-template/service-template.component';

@Injectable({
  providedIn: 'root'
})
export class ObjectManagerService extends ObjectManagerServiceBase {

  private readonly _trModule: string = 'gmsSnapins_ObjectManager_Service';
  private modalRef: BsModalRef;
  private selection: BrowserObject[];
  private activeObserver: Observer<ObjectManagerServiceModalResult> = undefined;

  /**
   * Constructor
   * @param traceService The trace service
   * @param systemBrowserService The system browser service
   * @param modalService The modal service
   *
   * @memberOf ObjectManagerServiceBase
   */
  public constructor(
    private readonly traceService: TraceService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly modalService: BsModalService) {

    super();
    this.traceService.info(this._trModule, 'Object Manager Service created');
  }

  /**
   * Invokes the dialog
   * @param title the title to be displayed in the dialog
   * @param config the configuration specifying the behavior of the dialog
   *
   * @returns
   *
   * @memberOf ObjectManagerServiceBase
   */
  public show(title: string, config?: ObjectManagerServiceModalOptions): Observable<ObjectManagerServiceModalResult> {
    return new Observable(observer => {
      // Is a dialog already active?
      if (!this.modalRef) {
        /* eslint-disable-next-line */
        const _initialState: any = {
          title,
          singleSelection: false,
          hideSearch: true,
          roots: undefined,
          views: undefined,
          selectedNode: undefined,
          selectableTypes: undefined,
          creatableTypes: undefined,
          newItemBtnTxt: undefined,
          defaultSaveObjectDesc: undefined,
          defaultSaveObjectName: undefined,
          saveCallback: undefined
        };
        const modalConfig: ModalOptions = {
          class: 'gms-object-manager-service',
          animated: true,
          ignoreBackdropClick: true,
          keyboard: false,
          show: true,
          initialState: _initialState
        };

        this.activeObserver = observer;

        // update modal options with provided configuration (if provided)
        if (config) {
          Object.assign(modalConfig.initialState, config);
        }

        this.modalRef = this.modalService.show(ServiceTemplateComponent, modalConfig);

        if (this.modalRef) {
          this.modalRef.content.selectionChanged.subscribe(resp => this.selection = resp);

          this.modalRef.content.dialogBtnResult.subscribe(resp => {
            if (resp === ModalDialogResult.Cancelled) {
              this.selection = undefined;
            }
            this.internalHide(resp, this.selection);
          }
          );
        }
      } else {
        observer.error(new Error('ObjectManager Dialog already active'));
      }
    });
  }

  /**
   * Invokes the object manager save dialog
   * @param title the title to be displayed in the dialog
   * @param saveCallback method that will be used to save the object
   * @param config the configuration specifying the behavior of the dialog
   *
   * @returns
   *
   * @memberOf ObjectManagerServiceBase
   */
  public save(title: string, saveCallback: ObjectManagerSaveAction, config?: ObjectManagerServiceModalOptions): Observable<ObjectManagerServiceModalResult> {
    return new Observable(observer => {
      // Is a dialog already active?
      if (!this.modalRef) {
        /* eslint-disable-next-line */
        const _initialState: any = {
          title,
          singleSelection: true,
          hideSearch: true,
          roots: undefined,
          views: undefined,
          selectedNode: undefined,
          selectableTypes: undefined,
          creatableTypes: undefined,
          newItemBtnTxt: undefined,
          defaultSaveObjectDesc: undefined,
          defaultSaveObjectName: undefined,
          saveCallback
        };
        const modalConfig: ModalOptions = {
          class: 'gms-object-manager-service',
          animated: true,
          ignoreBackdropClick: true,
          keyboard: false,
          show: true,
          initialState: _initialState
        };

        this.activeObserver = observer;

        // update modal options with provided configuration (if provided)
        if (config) {
          // force single selection for save functionality
          config.singleSelection = true;
          Object.assign(modalConfig.initialState, config);
        }

        this.modalRef = this.modalService.show(ServiceTemplateComponent, modalConfig);

        if (this.modalRef) {
          this.modalRef.content.saveBOComplete.subscribe(resp => {
            if (!isNullOrUndefined(resp)) {
              const btnClicked: ModalDialogResult = ModalDialogResult.Ok;
              const savedBO: BrowserObject[] = [resp];
              this.internalHide(btnClicked, savedBO);
            }
          });

          this.modalRef.content.dialogBtnResult.subscribe(resp => {
            this.internalHide(resp, undefined);
          }
          );
        }
      } else {
        observer.error(new Error('ObjectManager Dialog already active'));
      }
    });
  }

  /**
   * verifies the provided string is a unique CNS name
   *
   * @param parentNode parent node for checking uniqueness of provided cnsName
   * @param cnsName CNS name for which to verify uniqueness
   *
   * @returns
   *
   * @memberOf ObjectManagerServiceBase
   */
  public checkCnsNameUnique(parentNode: BrowserObject, cnsName: string): Observable<boolean> {
    if (!(parentNode && Designation.checkNodeName(cnsName))) {
      return throwError(new Error('Invalid arguments'));
    }
    const fqCnsName: string = Designation.appendNodeName(parentNode.Designation, cnsName);
    return this.systemBrowserService.searchNodes(parentNode.SystemId, fqCnsName)
      .pipe(
        // If the search result-page contains one or more nodes, the provided cnsName is not unique
        map((result: Page) => result?.Nodes && result.Nodes.length > 0 ? false : true));
  }

  /**
   * Closes the dialog
   *
   * @returns
   *
   * @memberOf ObjectManagerServiceBase
   */
  public hide(): boolean {
    let success = false;

    success = this.internalHide(ModalDialogResult.Hidden, undefined);

    return success;
  }

  /**
   * Closes the dialog
   * @param action the modal dialog action
   * @param selection the modal dialog selection
   * @returns
   *
   * @memberOf ObjectManagerService
   */
  private internalHide(action: ModalDialogResult, selection: BrowserObject[]): boolean {
    let success = false;

    if (this.activeObserver) {
      const omsmr: ObjectManagerServiceModalResult = { action, selection };

      this.activeObserver.next(omsmr);
      this.activeObserver.complete();

      this.activeObserver = undefined;
    }

    // verify that there is an active dialog
    if (this.modalRef) {

      if (this.activeObserver) {
        const omsmr: ObjectManagerServiceModalResult = { action, selection };

        this.activeObserver.next(omsmr);
        this.activeObserver.complete();

        this.activeObserver = undefined;
      }

      this.modalRef.hide();

      this.modalRef = undefined;

      success = true;
    }

    return success;
  }

}
