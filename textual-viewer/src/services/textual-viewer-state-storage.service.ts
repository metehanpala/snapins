import { Injectable } from '@angular/core';
import { FullSnapInId, IHfwMessage } from '@gms-flex/core';
import { TextStorageService } from '@gms-flex/textual-viewer-root-services';

import { TextualViewerState } from '../interfaces/textual-viewer.state';

@Injectable()
export class TextualViewerStateStorageService {
  public storageService: TextStorageService;
  public fullId: FullSnapInId;

  public initStorageService(messageBroker: IHfwMessage, fullId: FullSnapInId): void {
    this.storageService = messageBroker.getStorageService(fullId) as TextStorageService;
    this.fullId = fullId;
  }

  public getState(): TextualViewerState {
    const textualViewerState: TextualViewerState = this.storageService?.getState(this.fullId);
    return textualViewerState;
  }

  public setState(state: TextualViewerState): void {
    this.storageService?.setState(this.fullId, state);
  }

  public clearState(): void {
    this.storageService?.clearState(this.fullId);
  }

  public get snapinId(): string {
    return this.fullId.snapInId;
  }

  public get hasDefinedState(): boolean {
    return this.getState() !== undefined;
  }
}
