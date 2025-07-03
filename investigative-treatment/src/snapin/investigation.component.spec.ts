import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { IHfwMessage, ISnapInConfig } from "@gms-flex/core";
import { CnsHelperService, EventCommand, EventService, EventSubscription } from "@gms-flex/services";
import { AppContextService, AppSettingsService, MockProductService,
  ProductService, TraceService } from "@gms-flex/services-common";
import { EventsValidationHelperServiceBase, GmsSnapInCommonModule } from "@gms-flex/snapin-common";
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from "@ngx-translate/core";
import { MenuItem, SiActionDialogService } from "@simpl/element-ng";
import { of } from "rxjs";

import { InvestigationComponent } from "./investigation.component";
const INVESTIGATIVE_MODE_ID = "investigative";

describe("InvestigationComponent", () => {

  const validationInput: any = {
    message: "",
    comments: "Comment",
    password: "12345",
    superName: "SuperAdmin",
    superPassword: "123456"
  };

  // let component: InvestigationComponent;
  let component: any;
  let fixture: ComponentFixture<InvestigationComponent>;

  let mockEventService: any = null;
  const mockSiActionDialogService: any = null;
  let mockTranslateService: any = null;
  let mockIHfwMessage: any = null;

  const commands: EventCommand[] = [
    { EventId: "01", Id: "ack", Configuration: 1 },
    { EventId: "02", Id: "reset", Configuration: 2 },
    { EventId: "03", Id: "close", Configuration: 3 },
  ];
  const testEvent: any = { commands: commands, suggestedAction: "Reset", groupedEvents: [] };

  // Mocks for hfw-core dependencies
  const mockSnapinConfig: any = jasmine.createSpyObj("mockSnapinConfig", ["getSnapInHldlConfig", "getLayouts"]);
  mockSnapinConfig.getLayouts.and.returnValue([]);
  mockSnapinConfig.getSnapInHldlConfig.and.returnValue();

  const mockCnsHelperService: any = jasmine.createSpyObj("CnsHelperService", ["activeCnsLabel"]);

  mockCnsHelperService.activeCnsLabel = of("");

  // Mock eventsValidationHelperService
  const mockEventsValidationHelperService = jasmine.createSpyObj(["eventDetailsValidationService"]);

  beforeEach(async () => {
    mockEventService = jasmine.createSpyObj("EventService", ["createEventSubscription", "destroyEventSubscription", "eventCommand"]);
    mockEventService.createEventSubscription.and.returnValue({ events: of("") });
    mockEventService.destroyEventSubscription.and.returnValue();
    mockEventService.eventCommand.and.returnValue(of(""));

    mockTranslateService = jasmine.createSpyObj("TranslateService", ["get"]);
    mockTranslateService.get.and.returnValue(of(""));

    mockIHfwMessage = jasmine.createSpyObj("IHfwMessage", ["switchToNextFrame", "changeMode"]);
    mockIHfwMessage.switchToNextFrame.and.returnValue();
    mockIHfwMessage.changeMode.and.returnValue(of(""));

    await TestBed.configureTestingModule({
      declarations: [InvestigationComponent],
      imports: [TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
      })],
      providers: [AppContextService, AppSettingsService, TraceService,
        { provide: "productSettingFilePath", useValue: "productMock" },
        { provide: ProductService, useClass: MockProductService },
        { provide: "appSettingFilePath", useValue: "noMatter" },
        { provide: EventsValidationHelperServiceBase, useValue: { mockEventsValidationHelperService } },
        { provide: ISnapInConfig, useValue: mockSnapinConfig },
        { provide: IHfwMessage, useValue: mockIHfwMessage },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: EventService, useValue: mockEventService },
        { provide: CnsHelperService, useValue: mockCnsHelperService },
        { provide: SiActionDialogService, useValue: mockSiActionDialogService },
        { provide: ActivatedRoute, useValue: {
          "snapshot": {
            "data": {
              "frameId": "frameId_Test",
              "paneId": "paneId_Test",
              "snapInId": "snapInId_Test"
            }
          }
        }
        }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvestigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("MessageBroker.switchToNextFrame should be called from switchNextFrame", () => {
    spyOn(component, "switchToNextFrame");

    component.switchNextFrame("default");
    expect(component.messageBroker.switchToNextFrame).toHaveBeenCalled();
  });

  it("unsubscribe to events", () => {
    component.eventSubscription = new EventSubscription(1000, null, null, null);

    component.unSubscribeEvents();
    expect(component.eventSubscription).toEqual(null);
  });

  it("subscribe to events", fakeAsync(() => {
    spyOn(component, "onEventsNotification");
    component.eventSubscription = null;

    component.subscribeEvents();
    tick(100);
    expect(component.onEventsNotification).toHaveBeenCalled();
    expect(component.eventSubscription).toBeDefined();
  }));

  it("onGetCurrentMode should set investigativeMode", () => {
    component.investigativeMode = false;
    component.eventSubscription = { id: 123, events: null, filter: null, connectionState: null };
    const testMode: any = { id: INVESTIGATIVE_MODE_ID, relatedValue: "eventId" };

    spyOn(component, "subscribeEvents");
    component.onGetCurrentMode(testMode);
    expect(component.investigativeMode).toBeTruthy();
    expect(component.subscribeEvents).toHaveBeenCalled();
  });

  it("init load page", () => {
    component.showInSystem = "";
    component.showInEvents = "";
    component.closeDialogTitle = "";
    component.closeDialogText = "";

    const strings: any = {
      "ACK-COMMAND-TEXT": "ACK",
      "RESET-COMMAND-TEXT": "RESET",
      "SILENCE-COMMAND-TEXT": "SILENCE",
      "UNSILENCE-COMMAND-TEXT": "UNSILENCE",
      "CLOSE-COMMAND-TEXT": "CLOSE",
      "SHOW-IN-SYSTEM": "SHOWINSYSTEM",
      "SHOW-IN-EVENTS": "SHOWINEVENTS",
      "CLOSE-DIALOG-TITLE": "CLOSEDIALOGTITLE",
      "CLOSE-DIALOG-TEXT": "CLOSEDIALOGTEXT"
    };

    component.initLoadPage(strings);

    expect(component.showInSystem).toEqual("SHOWINSYSTEM");
    expect(component.showInEvents).toEqual("SHOWINEVENTS");
    expect(component.closeDialogTitle).toEqual("CLOSEDIALOGTITLE");
    expect(component.closeDialogText).toEqual("CLOSEDIALOGTEXT");
  });

  it("has command", () => {
    const ev: any = { commands: commands };

    let retVal: boolean = component.hasCommand(ev, "ACK");
    expect(retVal).toBeFalse();

    retVal = component.hasCommand(ev, "ACK", true);
    expect(retVal).toBeTrue();
  });

  it("skip event", () => {
    const ev: any = { id: "2", oPId: "oPId_2", state: "Closed" };
    const events: any[] = [
      { id: "1", oPId: "oPId_1", state: "Closed", srcState: "Active" },
      { id: "2", oPId: "oPId_2", state: "Acked", srcState: "Quiet" },
      { id: "3", oPId: "oPId_3", state: "Acked", srcState: "Active" }
    ];

    expect(component.skipEvent(events, ev)).toBeFalse();
    events.push({ id: "2", oPId: "oPId_2", state: "ReadyToBeClosed", srcState: "Quiet" });
    expect(component.skipEvent(events, ev)).toBeTrue();
  });

  it("set primary action", () => {
    component.frameInfo = { id: 123 };

    const menuItem: MenuItem = {
      title: "",
      disabled: true,
      action: (): void => component.switchNextFrame("system-manager")
    };

    component.primaryActions.push(menuItem);
    component.setPrimaryAction();
    // if branches
    expect(component.primaryActions[0].disabled).toBeFalse();
    expect(component.primaryActions[0].title).toEqual(component.showInSystem);

    component.primaryActions.length = 0;
    component.frameInfo = { id: "system-manager" };
    component.setPrimaryAction();
    // else branches
    expect(component.primaryActions[0].disabled).toBeFalse();
    expect(component.primaryActions[0].title).toEqual(component.showInEvents);
  });

  it("set content actions", () => {
    // let testEvent: any = { commands: commands, suggestedAction: 'Reset', groupedEvents: [] };

    component.commandTexts = new Map([
      ["ack", "ACK"],
      ["reset", "RESET"],
      ["silence", "SILENCE"],
      ["unsilence", "UNSILENCE"],
      ["close", "CLOSE"]
    ]);

    component.commandIcons = new Map([
      ["ack", "element-alarm-tick"],
      ["reset", "element-undo"],
      ["silence", "element-horn-off"],
      ["unsilence", "element-horn"],
      ["close", "element-cancel"]
    ]);

    component.frameInfo = { id: 123 };
    const menuItem: MenuItem = {
      title: "",
      disabled: true,
      action: (): void => component.switchNextFrame("system-manager")
    };
    component.primaryActions.push(menuItem);

    testEvent.suggestedAction = "Reset";
    component.setContentActions(testEvent);

    expect(component.primaryActions[1].title).toEqual(component.commandTexts.get("reset"));
    expect(component.primaryActions[1].icon).toEqual(component.commandIcons.get("reset"));
    expect(component.primaryActions[1].disabled).toBeFalse();

    expect(component.secondaryActions.length).toEqual(3);
    expect(component.secondaryActions[0].title).toEqual("ACK");
    expect(component.secondaryActions[1].title).toEqual("SILENCE");
    expect(component.secondaryActions[2].title).toEqual("UNSILENCE");

    testEvent.suggestedAction = "Suspend";
    component.setContentActions(testEvent);

    expect(component.primaryActions[1].title).toEqual(component.commandTexts.get("ack"));
    expect(component.primaryActions[1].icon).toEqual(component.commandIcons.get("ack"));
    expect(component.primaryActions[1].disabled).toBeFalse();

    expect(component.secondaryActions.length).toEqual(3);
    expect(component.secondaryActions[0].title).toEqual("ACK");
    expect(component.secondaryActions[1].title).toEqual("RESET");
    expect(component.secondaryActions[2].title).toEqual("SILENCE");
  });

  it("on command click", () => {
    // let testEvent: any = { commands: commands, suggestedAction: 'Reset', groupedEvents: [] };

    component.onCommandClick("close", testEvent);
    expect(mockEventService.eventCommand).toHaveBeenCalled();
    expect(mockEventsValidationHelperService.eventDetailsValidationService.and.returnValue(of(validationInput)));
  });

  it("leaveTreatment", () => {
    spyOn(component, "switchToNextFrame");
    component.currentEventId = "1234";
    component.frameInfo = { id: 123 };

    component.leaveTreatment("TestFrameId");
    expect(component.switchToNextFrame).toHaveBeenCalled();
  });

  it("getSuggestedAction", () => {
    spyOn(component, "onCommandClick");
    component.commandTexts = new Map([
      ["ack", "ACK"],
      ["reset", "RESET"],
      ["silence", "SILENCE"]
    ]);

    component.commandIcons = new Map([
      ["ack", "ACK_Icon"],
      ["reset", "RESET_Icon"],
      ["silence", "SILENCE_Icon"]
    ]);

    let evt = { suggestedAction: "unsilence" };
    expect(component.getSuggestedAction(evt)).toEqual(null);

    evt = { suggestedAction: "Reset" };
    expect(component.getSuggestedAction(evt)).not.toEqual(null);
  });
});
