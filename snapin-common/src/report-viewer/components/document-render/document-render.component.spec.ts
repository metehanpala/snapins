import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockStoreObject } from '../../helpers/test-utilities';
import { DocumentRenderComponent } from './document-render.component';

describe('PdfViewerComponent', () => {
  let component: any;
  let fixture: ComponentFixture<DocumentRenderComponent>;
  let elementRef: ElementRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentRenderComponent],
      providers: [{ provide: ElementRef, useValue: {} }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentRenderComponent);
    component = fixture.componentInstance;
    elementRef = TestBed.get(ElementRef);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // xit('onPdfLoad() should call updateZoomFactor()', () => {
  //   spyOn(component, 'updateZoomFactor');
  //   component.storeObject = mockStoreObject;
  //   component.onPdfLoad();
  //   fixture.detectChanges();

  //   expect(component.updateZoomFactor).toHaveBeenCalled();
  // });

  // it('updateZoomFactor() should set current zoom factor', () => {
  //   component.storeObject = mockStoreObject;
  //   component.updateZoomFactor(12);
  //   fixture.detectChanges();

  //   expect(component.currentZoomFactor).toEqual(12);
  // });

  xit('saveScrollState() should call saveStorage()', () => {
    spyOn(component, 'saveStorage');
    component.fileUrl = '';
    component.path = '';
    component.saveScrollState();
    fixture.detectChanges();

    expect(component.saveStorage).toHaveBeenCalled();
  });
});
