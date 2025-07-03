import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FrameInfo,
  FullPaneId,
  FullQParamId,
  FullSnapInId,
  IHfwMessage,
  IPreselectionService,
  IStorageService,
  MessageParameters,
  MockSnapInBase,
  QParam,
  SnapInBase,
  SnapinDisplay
} from '@gms-flex/core';
import {
  AppContextService,
  AuthenticationServiceBase,
  MockAuthenticationService,
  MockProductService,
  MockTraceService,
  MockWsiEndpointService,
  ModeData,
  ProductService,
  TraceService
} from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

export class MockPreselectionService implements IPreselectionService {

  public typeId = '';

  public receivePreSelection(_messageTypes: string[], _messageBody: any, _fullId: FullSnapInId): Observable<boolean> {
    return of(true);
  }
}

export class MockStorageService implements IStorageService {

  public typeId = '';

  public getState(_fullId: FullSnapInId): any {}

  public setState(_fullId: FullSnapInId, _state: any): void {}

  public clearState(_fullId: FullSnapInId): void {}

  public getDirtyState(_fullId: FullSnapInId): boolean {
    return false;
  }

  public setDirtyState(_fullId: FullSnapInId, _state: boolean): void {}
}

export class MessageBrokerStub implements IHfwMessage {

  public constructor(
    public preselect: MockPreselectionService,
    public storage: MockStorageService,
    public qParam: string) {}

  public sendMessage(
    _fullId: FullSnapInId, _location: FullPaneId, _types: string[], _messageBody: any,
    _preselection: boolean, _qParamValue: QParam, _broadcast: boolean, _applyRuleId: string): Observable<boolean> {
    return of(true);
  }

  public switchToNextFrame(_frameId: string): Observable<boolean> {
    return of(true);
  }

  public changeMode(_mode: ModeData, _frameId: string, _firstSelectionObj?: MessageParameters): Observable<boolean> {
    return of(true);
  }

  public getCurrentWorkAreaFrameInfo(): Observable<FrameInfo> {
    return of({ id: '', isLayoutLocked: false, isSecondary: false });
  }

  public getCurrentLayoutId(_frameId: string): Observable<string> {
    return of('');
  }

  // public getCurrentMode(_frameId: string): Observable<ModeData> {
  //   return of(new ModeData());
  // }

  public changeLayout(_frameId: string, _layoutId: string): Observable<boolean> {
    return of(true);
  }

  public lockLayout(_frameId: string): void {
  }

  public logout(): void {
  }

  public clearLastMessage(_fullId: FullSnapInId): void {
  }
  public getMessage(_fullId: FullSnapInId): Observable<any> {
    return of(null);
  }

  public getPreselectionService(_fullId: FullSnapInId): IPreselectionService {
    return this.preselect;
  }

  public getStorageService(_fullId: FullSnapInId): IStorageService {
    return this.storage;
  }

  public getQueryParam(_fullId: FullQParamId): Observable<string> {
    return of('');
  }

  public resetFrameSettingsToDefault(_frameId: string): Observable<boolean> {
    return of(true);
  }

  public displaySnapInTab(_snapins: SnapinDisplay[], _context?: any): Observable<boolean> {
    return of(true);
  }

  public calculateUrlOnSelection(_fullId: FullSnapInId, _location: FullPaneId, _types: string[],
    _messageBody: any, _qParam: QParam, _broadcast: boolean, _applyRuleId: string): Observable<string> {
    return of('');
  }

  public canChangeUserRoles(): Observable<boolean> {
    return undefined;
  }

  public fullScreenSnapin(location: FullPaneId, fullScreen: boolean): void {
  }

  public getCurrentMode(): Observable<ModeData | null> {
    return undefined;
  }

  public getRightPanelMessage(frameId: string): Observable<any> {
    return undefined;
  }

  public getUpdatingLocation(fullId: FullSnapInId): FullPaneId {
    return undefined;
  }

  public selectViaQParamService(message: MessageParameters): Observable<boolean> {
    return undefined;
  }

  public sendMessageFromRightPanel(senderId: string, senderFrameId: string,
    communicationId: string, types: string[],
    messageBody: any, preselection: boolean,
    qParam: QParam, broadcast: boolean, applyRuleId: string, secondarySelectionInSinglePane: boolean): Observable<boolean> {
    return undefined;
  }

  public changeView(frameId: string, viewId: string): Observable<boolean> {
    return undefined;
  }

  public getCurrentWorkAreaView(): Observable<string | undefined> {
    return undefined;
  }

}

export class TestUtilities {

  public static getSnapinBaseMockProvider(): Provider {
    return { provide: SnapInBase, useValue: MockSnapInBase };
  }

  public static getActiveRouteMockProvider(paneId: FullPaneId, snapinId: FullSnapInId): Provider {
    return { provide: ActivatedRoute, useValue: { 'snapshot': { 'data': { snapinId, paneId } } } };
  }

  public static getTraceServiceMockProvider(): Provider {
    return { provide: TraceService, useClass: MockTraceService };
  }

  public static getEndpointServiceMockProviders(): Provider[] {
    return [{ provide: MockWsiEndpointService, useClass: MockWsiEndpointService }, { provide: 'wsiSettingFilePath', useValue: 'wsiMock' }];
  }

  public static getProductServiceMockProviders(): Provider[] {
    return [{ provide: ProductService, useClass: MockProductService }, { provide: 'productSettingFilePath', useValue: 'productMock' }];
  }

  public static getAppContextMockProviders(): Provider {
    return [{ provide: AppContextService, useClass: AppContextService }];
  }

  public static getAuthenticationServiceMockProvider(): Provider {
    return { provide: AuthenticationServiceBase, useClass: MockAuthenticationService };
  }

  public static getTranslateServiceMockProvider(): Provider {
    return { provide: TranslateService, useClass: TranslateService };
  }
}
