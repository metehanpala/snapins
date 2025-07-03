import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableControlsComponent } from './editable-controls.component';

describe('EditableControlsComponent', () => {
  let component: EditableControlsComponent;
  let fixture: ComponentFixture<EditableControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditableControlsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EditableControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
