import { of } from 'rxjs';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { EventPopoverComponent } from './event-popover.component';
import { EventContentComponent } from '../event-content/event-content.component';

describe('EventPopoverComponent', () => {
  let fixture: ComponentFixture<EventPopoverComponent>;
  let component: any;
  const eventContentComponent = jasmine.createSpyObj('EventContentComponent', ['toggle', 'close']);

  beforeEach(() => {

    TestBed.configureTestingModule({
      declarations: [EventPopoverComponent, EventContentComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TraceService, useClass: MockTraceService }
      ]
    });

    fixture = TestBed.createComponent(EventPopoverComponent);

    // fixture.detectChanges();
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Should call toggle() method of event-content.component', () => {
    component.popover = eventContentComponent;
    component.toggle();
    expect(eventContentComponent.toggle).toHaveBeenCalled();
  });

  it('Should call close() method of event-content.component', () => {
    component.popover = eventContentComponent;
    component.close();
    expect(eventContentComponent.close).toHaveBeenCalled();
  });

});
