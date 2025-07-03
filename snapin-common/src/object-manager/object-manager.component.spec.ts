import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppContextService, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { FullSnapInId, IHfwMessage, MockSnapInBase, SnapInBase } from '@gms-flex/core';
import { ObjectManagerComponent } from '@gms-flex/snapin-common';
import { TextualViewerSnapInComponent } from '@gms-flex/textual-viewer';

describe('ObjectManagerComponent', () => {

  let fixture: ComponentFixture<ObjectManagerComponent>;
  let comp: ObjectManagerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [],
      providers: [
        { provide: SnapInBase, useValue: MockSnapInBase },
        { provide: TraceService, useClass: MockTraceService },
        MockWsiEndpointService,
        AppContextService,
        { provide: 'wsiSettingFilePath', useValue: 'wsiMock' },
        IHfwMessage
      ]
    });
  });

  describe('initialization', () => {

    beforeEach(waitForAsync(() => {
      fixture = TestBed.createComponent(ObjectManagerComponent);
      comp = fixture.componentInstance;
    }));

    xit('should build without a problem',
      waitForAsync(() => {
        TestBed.compileComponents().then(() => {
          expect(comp instanceof ObjectManagerComponent).toBe(true);
        });
      }));

    xit('should ', () => {
      const value: number = comp.trackByIndex(5);
      const expected = 5;
      expect(value).toEqual(expected);
    });
  });
});

@Component({
  selector: 'gms-object-manager-test',
  template: '<gms-object-manager />',
  standalone: false
})

class TestComponent {}
