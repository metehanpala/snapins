import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseSnapinComponent } from './license-snapin.component';

describe('LicenseSnapinComponent', () => {
  let component: LicenseSnapinComponent;
  let fixture: ComponentFixture<LicenseSnapinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicenseSnapinComponent]
    })
      .compileComponents();
    
    fixture = TestBed.createComponent(LicenseSnapinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
