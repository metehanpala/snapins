import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { CnsHelperService, CnsLabel, DocumentServiceBase, SystemBrowserServiceBase } from '@gms-flex/services';
import { MockTraceService, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';

import { DocumentSnapinService, TileObject } from './document-snapin.service';

export class MockCnsHelperService {
  public activeCnsLabelValue: CnsLabel = new CnsLabel(undefined, null, null);

  public get activeCnsLabel(): Observable<any> {
    /* eslint-disable-next-line */
    return of({ ActiveCnsLabelValue: new CnsLabel(undefined, null, null) });
  }
}

export class MockSystemBrowserService {
  public searchNodes(systemId: number, searchString: string, viewId: number): Observable<any> {
    /* eslint-disable-next-line */
    return of({ Nodes: [{ Designation: 'test' }] });
  }
}

describe('DocumentSnapinService', () => {
  /* eslint-disable */
  const mockBrowserObject = {
    Attributes: undefined,
    Descriptor: 'test',
    Designation: 'test',
    HasChild: false,
    Name: 'test',
    Location: 'test',
    ObjectId: 'test',
    SystemId: 9,
    ViewId: 8,
    ViewType: 7
  };
  /* eslint-enable */
  const mockTileObject = new TileObject('test', mockBrowserObject);
  const mockDocumentService = jasmine.createSpyObj('DocumentServiceBase', ['getWhitelist', 'getUrl', 'openTab']);
  mockDocumentService.getWhitelist.and.returnValue(of({ whitelist: ['https://www.google.it', 'https://www.youtube.com'] }));

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: SystemBrowserServiceBase, useClass: MockSystemBrowserService },
        { provide: CnsHelperService, useClass: MockCnsHelperService },
        { provide: DocumentServiceBase, useValue: mockDocumentService },
        { provide: TileObject, useValue: mockTileObject }
      ]
    })
      .compileComponents();
  }));

  it('should create DocumentSnapinService',
    inject([DocumentSnapinService], (documentSnapinService: DocumentSnapinService) => {
      expect(documentSnapinService instanceof DocumentSnapinService).toBe(true);
    }));

  it('should create TileObject', () => {
    expect(mockTileObject instanceof TileObject).toBe(true);
    expect(mockTileObject.Attributes).toEqual(mockBrowserObject.Attributes);
    expect(mockTileObject.ViewId).toEqual(mockBrowserObject.ViewId);
  });

  it('should set cns value',
    inject([DocumentSnapinService], (documentSnapinService: DocumentSnapinService) => {
      expect(documentSnapinService.cnsValue).toEqual(new CnsLabel(undefined, null, null));
    }));

  it('should find URL in a whitelist',
    inject([DocumentSnapinService], async (documentSnapinService: DocumentSnapinService) => {
      await mockDocumentService.getWhitelist.and.returnValue(of({ whitelist: ['https://www.google.it', 'https://www.youtube.com'] }));
      expect(documentSnapinService.findWhitelist('https://www.google.it')).toBeTrue();
      expect(documentSnapinService.findWhitelist('https://www.bing.com')).toBeFalse();
      expect(documentSnapinService.findWhitelist(undefined)).toBeFalse();
    }));

  it('should open document on tile click',
    inject([DocumentSnapinService], async (documentSnapinService: DocumentSnapinService) => {
      const spyNext = spyOn(documentSnapinService.documentTileSelectionSub, 'next');
      /* eslint-disable */
      const mockTile: any = {
        SystemId: 1,
        Designation: 'test',
        ViewId: 3
      };
      /* eslint-enable */
      let returnValue = Promise.resolve({});

      // if this.findWhitelist(res.path) === false
      returnValue = Promise.resolve({
        type: 'url',
        path: 'https://www.bing.com',
        url: ''
      });
      mockDocumentService.getUrl.and.returnValue(returnValue);
      mockDocumentService.openTab.and.returnValue(undefined);

      await documentSnapinService.onTileClick(mockTile);
      expect(await mockDocumentService.openTab).toHaveBeenCalledTimes(1);

      // else
      returnValue = Promise.resolve({
        type: 'url',
        path: 'https://www.google.it',
        url: ''
      });
      mockDocumentService.getUrl.and.returnValue(returnValue);

      await documentSnapinService.onTileClick(mockTile);
      expect(await spyNext).toHaveBeenCalledTimes(1);

      // else if
      returnValue = Promise.resolve({
        type: 'file',
        path: 'https://www.google.it',
        url: ''
      });
      mockDocumentService.getUrl.and.returnValue(returnValue);

      await documentSnapinService.onTileClick(mockTile);
      expect(await spyNext).toHaveBeenCalledTimes(2);
    }));

  it('should set selected object',
    inject([DocumentSnapinService], (documentSnapinService: DocumentSnapinService) => {
      documentSnapinService.setSelectedObject(mockBrowserObject);
      expect(documentSnapinService.selectedObject).toEqual(mockBrowserObject);
      expect(documentSnapinService.selectedObject.Descriptor).toEqual('test');
      expect(documentSnapinService.selectedObject.ViewId).toEqual(8);
    }));

  it('should get target navigation browser object',
    inject([DocumentSnapinService], (documentSnapinService: DocumentSnapinService) => {
      /* eslint-disable */
      const mockTile: any = {
        SystemId: 1,
        Designation: 'test',
        ViewId: 3
      };
      /* eslint-enable */

      documentSnapinService.getTargetNavigationBrowserObj(mockTile).subscribe(res => {
        expect(res.Nodes[0].Designation).toEqual('test');
      });
    }));
});
