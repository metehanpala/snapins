import { Observable } from 'rxjs';
import { BrowserObject, Designation } from '@gms-flex/services';
import { ViewFilter } from '../object-manager-core/view-model/types';
import { TreeStyle } from './browser-view/browser-view.component';

export { TreeStyle };

export interface SelectionMenuItem {
  description: string;
  id: string;
  icon?: string;
  items?: SelectionMenuItem[];
}

export interface SelectedItemsChangedArgs {
  objects: BrowserObject[];
  menuId?: string;
  sendMessage: boolean;
  customData?: any;
}

export interface ObjectManagerViewConfig {
  customRoots?: string[];
  viewFilter?: ViewFilter;
  selectableTypes?: string[];
  creatableTypes?: string[];
}

export interface ObjectManagerConfig {
  viewConfig: ObjectManagerViewConfig;
  initialSelection?: string;
  dialogCmdBtns?: boolean;
  newItemBtnTxt?: string;
  defaultSaveObjectName?: string;
  defaultSaveObjectDesc?: string;  
}

export interface ObjectManagerSaveActionResult {
  newObject: BrowserObject; // BrowserObject if successful
  message?: string; // message in case of error
}

export type ObjectManagerSaveAction = (name: string, description: string, location: Designation) => Observable<ObjectManagerSaveActionResult>;
