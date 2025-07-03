import { Observable } from 'rxjs';

import { BrowserObject } from '@gms-flex/services';
import { ObjectManagerSaveAction } from '../object-manager/object-manager.types';
import { ObjectManagerServiceModalOptions, ObjectManagerServiceModalResult } from './data.model';

export abstract class ObjectManagerServiceBase {

  /**
   * Invokes the object manager dialog
   * @param title the title to be displayed in the dialog
   * @param config the configuration specifying the behavior of the dialog
   *
   * @returns {Observable<ObjectManagerServiceModalResult>}
   *
   * @memberOf ObjectManagerServiceBase
   */
  public abstract show(title: string, config?: ObjectManagerServiceModalOptions): Observable<ObjectManagerServiceModalResult>;

  /**
   * Invokes the object manager save dialog
   * @param title the title to be displayed in the dialog
   * @param saveCallback method that will be used to save the object
   * @param config the configuration specifying the behavior of the dialog
   *
   * @returns {Observable<ObjectManagerServiceSaveResult>}
   *
   * @memberOf ObjectManagerServiceBase
   */
  public abstract save(title: string, saveCallback: ObjectManagerSaveAction,
    config?: ObjectManagerServiceModalOptions): Observable<ObjectManagerServiceModalResult>;

  /**
   * Closes the dialog
   *
   * @returns {boolean}
   *
   * @memberOf ObjectManagerServiceBase
   */
  public abstract hide(): boolean;

  /**
   * Verifies the provided string is a unique CNS name
   *
   * @param parentNode parent node for checking uniqueness of provided cnsName
   * @param cnsName CNS name for which to verify uniqueness
   *
   * @returns {Observable<boolean>}
   *
   * @memberOf ObjectManagerServiceBase
   */
  public abstract checkCnsNameUnique(parentNode: BrowserObject, cnsName: string): Observable<boolean>;

}
