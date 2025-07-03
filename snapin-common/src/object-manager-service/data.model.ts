import { BrowserObject } from '@gms-flex/services';
import { ViewFilter } from '../object-manager-core/view-model/types';

// export { ViewFilter };
// export { AggregateViewId };

/**
 * singleSelection - a single object may be selected
 * hideSearch - hide the search capability
 * root - initial tree(s) of the dialog, if views are provided the root nodes are retrieved from the views, specified as the node designation(s)
 * views - views to be displayed
 * selectedNode - initially selected node specified as the node designation
 * selectableTypes - list of the object types that can be selected
 * createableTypes - list of the objects that can be created
 * newItemBtnTxt - string to be used for the "new" button instead of the default text
 * defaultSaveObjectName - string to be the save item name, which is checked for validity and editable
 * defaultSaveObjectDesc - string to be the save item description, which is checked for validity and editable
 * dlgCommands - list of commands (add folder, add DP) per tree node
 * dlgCommandFilter - list of filter commands per tree node
 */
export interface ObjectManagerServiceModalOptions {
  singleSelection?: boolean;
  hideSearch?: boolean;
  roots?: string[];
  views?: ViewFilter;
  selectedNode?: string;
  selectableTypes?: string[];
  creatableTypes?: string[];
  newItemBtnTxt?: string;
  defaultSaveObjectName?: string;
  defaultSaveObjectDesc?: string;
  // dlgCommands?: DlgCommand[];
  // dlgCommandFilter?: DlgCommandFilter[]
}

/**
 * Result of the Object Manager Service modal dialog
 *
 * Cancelled - modal dialog cancelled by the user
 * Ok - selection was made by the user
 */
export enum ModalDialogResult {
  Hidden,
  Cancelled,
  Ok
}

/**
 * result - Object Manager Service modal dialog
 * selection - selection made by user, if any
 */
export interface ObjectManagerServiceModalResult {
  action: ModalDialogResult;
  selection?: BrowserObject[];
}
export interface LogViewDefinationModel {
  lvdName: string;
  lvdDescription: string;
  lvdDesignation: string;
}
