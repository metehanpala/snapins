/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { FullSnapInId, IStorageService } from '@gms-flex/core';
import { GmsMessageData, RelatedItemsRepresentation, ReportDocumentData } from '@gms-flex/services';
import { TraceService } from '@gms-flex/services-common';

import { TraceModules } from '../shared/trace-modules';

// StateData interface is also created in storage-vm.ts file in report-viewer snapin-common
// whenever we update something here in StateData same should be updated in StateData in storage-vm.ts
export interface StateData {
  path?: string;
  index?: number;
  lastShownDocumentData?: ReportDocumentData;
  scrollTop?: number;
  scrollLeft?: number;
  skip?: number; // the skip for tiles view.
  tilesScrollTop?: number;
  zoomFactor?: number;
  zoomSetting?: number | string | undefined;
  page?: number;
  searchString?: string;
  designation: string;
  storedselectedRule?: SelectedRuleDetails;
  showReportHistory?: ShowReportHistory;
  setActiveReport?: SetActiveReport;
  scrollPosition?: number;
  relatedItems?: RelatedItemsRepresentation[];
  messageData?: GmsMessageData;
  expandedRow?: number[];
  multipleHistoryRowSelectionMap?: Map<string, MultipleHistoryRowSelectionMapData>;
}

export interface MultipleHistoryRowSelectionMapData {
  selectedChildNames: string[];
  parentName: string;
  isDocumentParent: boolean;
}

export interface ShowReportHistory {
  documentData: ReportDocumentData;
  isManualSelection: boolean;
}

export interface SetActiveReport {
  execId: string;
  displayName: string;
  isParent: boolean;
}

export interface SelectedRuleDetails {
  ruleObjectId: string;
  selectionContext: string;
}

@Injectable()
export class ReportViewerStorageService implements IStorageService {

  // This Id must match the 'typeId' of the 'snapInTypes' array specified in the extension HLDL
  // and the 'path' property of the 'Route' object inserted into the 'appRoutes' array
  public typeId = 'ReportViewerSnapInType';
  public state: Map<string, StateData> = new Map<string, StateData >(); 
 
  constructor(private readonly traceService: TraceService) {
    this.traceService.info(TraceModules.reportViewerRootServices, 'ReportViewerStorageService created.');
  }

  public getState(_fullId: FullSnapInId): StateData {
    return this.state.get(_fullId?.fullId());
  }

  public setState(_fullId: FullSnapInId, state: StateData): void {
    const st = this.state.get(_fullId.fullId());
    if (st.designation === state.designation) {
      this.state.set(_fullId.fullId(), state);
    } else {
      this.clearState(_fullId);
      this.state.set(_fullId.fullId(), state);
    }
  }

  public setDeafultState(_fullId: FullSnapInId, designation: string): StateData {
    const state: StateData = {
      designation: designation
    }
    this.state.set(_fullId.fullId(), state);
    return state;
  }

  public clearState(_fullId: FullSnapInId): void {
    this.state.delete(_fullId.fullId());
  }

  public compareStateDesignation(designation: string, _fullId: FullSnapInId): void {
    const state: StateData = this.getState(_fullId);
    if (state !== undefined && state.designation !== designation) {
      this.clearState(_fullId);
    } 
  }
  public getRelatedItemsFromStorage(fullId: FullSnapInId): RelatedItemsRepresentation[] {
    return this.state.get(fullId?.fullId())?.relatedItems;
  }
  public setRelatedItemsFromStorage(fullId: FullSnapInId, relatedItems: RelatedItemsRepresentation[], designation: string): void {
    let state = this.state.get(fullId?.fullId());
    if (state) {
      if (state.designation === designation) {
        state.relatedItems = relatedItems;
      } else {
        this.clearState(fullId);
        state = this.setDeafultState(fullId, designation);
        state.relatedItems = relatedItems;
      }

    } else {
      state = this.setDeafultState(fullId, designation);
      state.relatedItems = relatedItems;
    }
  }

  public getMessageData(fullId: FullSnapInId): GmsMessageData {
    return this.state.get(fullId?.fullId())?.messageData;
  }

  // this function is checking if there is already a state vaialble in map. If available, then set messagedata
  // if not available, then set designation and messagedata
  public setMessageData(fullId: FullSnapInId, messageData: GmsMessageData, designation: string): void {
    let state = this.state.get(fullId?.fullId());
    if (state) {
      if (state.designation === designation) {
        state.messageData = messageData;
      } else {
        this.clearState(fullId);
        state = this.setDeafultState(fullId, designation);
        state.messageData = messageData;
      }
      
    } else {
      state = this.setDeafultState(fullId, designation);
      state.messageData = messageData;
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  getDirtyState(fullId: FullSnapInId): boolean {
  // throw new Error('Method not implemented.');
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  setDirtyState(fullId: FullSnapInId, state: boolean): void {
  // throw new Error('Method not implemented.');
  }
  
}
