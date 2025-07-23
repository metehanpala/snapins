import { ChangeDetectorRef } from '@angular/core';
import { BrowserObject } from '@gms-flex/services';
import { Observable } from 'rxjs';

import { GridData, GridVirtualizedArgs } from '../textual-viewer-data.model';

/**
 * SnapIn view-model interface definition.
 */
export interface TextualViewerSnapInViewModelBase {

  /**
   * Id of the VM (typically the snapId of the associated snapin).
   */
  readonly id: string;

  /**
   * Property list for display.  This is the standard or extended property list
   * depending on the setting of the `showPropertyListExt` property value.
   */
  readonly objectList: GridData[];

  /**
   * List of grid objects currently selected. Used to restore the selection state
   * of the grid control when reactivating the textual viewer.
   */
  readonly currentSelection: GridData[];

  /**
   * Indicates when reading data from server to load a new selection context starts and completes.
   */
  readonly loading: Observable<boolean>;

  /**
   * Called by client to dispose of internal resources before view-model is destructed.
   */
  dispose(): void;

  /**
   * This method can be called by the view-model client to disable any
   * resourses the view-model is managing that can be regained through a
   * call to activate.
   *
   * The main scenario is the snap-in view ngComponent is destroyed
   * (taken out of view) and later re-created and initialized.
   * During the time it is 'away' the subscriptions it has open should
   * be closed.  They will be re-opened on a call to 'activate' when
   * the snap-in re-registers for the view-model instance.
   */
  deactivate(): void;

  /**
   * Called to resurrect a dormant vm
   */
  activate(locale: string, cdf: ChangeDetectorRef): void;

  /**
   * Closes any subscriptions, clears out all row information.
   */
  clear(): void;

  /**
   * Set the selection; returns true if different than old selection.
   */
  setContext(context: BrowserObject[]): void;

  /**
   * Set some strings.
   * @param {string} propAbs - text to be displayed when the property is absent
   * @param {string} commErr - text to be displayed when there is a comm error
   */
  setText(propAbs: string, commErr: string): void;

  /*
   * the user has selected N rows of the grid
   */
  getBrowserObjectsForSelection(selection: GridData[]): BrowserObject[];

  /*
   * the user has scrolled up and down resulting in some rows
   * becoming virtualized and others 'non-virtualized'
   */
  onGridVirtualizedChanged(args: GridVirtualizedArgs): void;
}
