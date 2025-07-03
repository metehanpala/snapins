// import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
// import { FullPaneId, FullSnapInId, IHfwMessage } from '@gms-flex/core';
// import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
//
// import { MessageBrokerStub, MockPreselectionService, MockStorageService, TestUtilities } from '../shared/test-utilities';
// import { OperatorTaskSnapinComponent } from './operator-task-snapin.component';
//
// describe('OperatorTaskSnapinComponent', () => {
//   let component: OperatorTaskSnapinComponent;
//   let fixture: ComponentFixture<OperatorTaskSnapinComponent>;
//   const msgBroker = new MessageBrokerStub(new MockPreselectionService(), new MockStorageService(), 'qParam');
//   const fullSnapinId = new FullSnapInId('frameId_Test', 'snapInId_Test');
//   const fullPaneId = new FullPaneId('frameId_Test', 'paneId_Test');
//   const providerArray: any[] = [
//     TestUtilities.getSnapinBaseMockProvider(),
//     TestUtilities.getActiveRouteMockProvider(fullPaneId, fullSnapinId),
//     TestUtilities.getTraceServiceMockProvider(),
//     TestUtilities.getEndpointServiceMockProviders(),
//     TestUtilities.getProductServiceMockProviders(),
//     TestUtilities.getAppContextMockProviders(),
//     TestUtilities.getAuthenticationServiceMockProvider(),
//     TestUtilities.getTranslateServiceMockProvider(),
//     { provide: IHfwMessage, useValue: msgBroker }
//   ];
//
//   beforeEach(waitForAsync(() => {
//     TestBed.configureTestingModule({
//       declarations: [OperatorTaskSnapinComponent],
//       imports: [
//         TranslateModule.forRoot({
//           loader: { provide: TranslateLoader, useClass: (TranslateFakeLoader) }
//         })],
//       providers: providerArray
//     }).compileComponents();
//   }));
//
//   beforeEach(() => {
//     fixture = TestBed.createComponent(OperatorTaskSnapinComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });
//
//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });