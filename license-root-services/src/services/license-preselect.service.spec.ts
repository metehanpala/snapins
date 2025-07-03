import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseRootServicesComponent } from './license-preselect.service';

describe('LicenseRootServicesComponent', () => {
  let component: LicenseRootServicesComponent;
  let fixture: ComponentFixture<LicenseRootServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LicenseRootServicesComponent]
    })
      .compileComponents();
    
    fixture = TestBed.createComponent(LicenseRootServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
