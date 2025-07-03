import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SystemsServiceBase } from '@gms-flex/services';

import { BrowserObjectService } from './browser-object.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('BrowserObjectService', () => {
  let service: SystemsServiceBase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        SystemsServiceBase,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
    service = TestBed.inject(SystemsServiceBase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
