import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportViewerRootServicesComponent } from './report-viewer-root-services.component';

describe('ReportViewerRootServicesComponent', () => {
  let component: ReportViewerRootServicesComponent;
  let fixture: ComponentFixture<ReportViewerRootServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportViewerRootServicesComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportViewerRootServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
