/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import {
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  DocumentServiceBase,
  ObjectAttributes,
  Page,
  SystemBrowserServiceBase
} from '@gms-flex/services';
import { isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, Subject } from 'rxjs';

export declare class DocumentSearchRequest {
  public parameters: any;
  public searchWords: string;
}

export class DocumentInfo {
  public objectId: string;
  public propertyIndex: string;
  public propertyName: string;
  public collectorObjectOrPropertyId: string;
  public trendseriesId: string;
  public trendedPropertyIdentifier: string;
}

export class TileObject implements BrowserObject {
  public Attributes: ObjectAttributes;
  public Descriptor: string;
  public Designation: string;
  public HasChild: boolean;
  public Name: string;
  public Location: string;
  public ObjectId: string;
  public SystemId: number;
  public ViewId: number;
  public ViewType: number;
  constructor(public iconClass: string, public browserObject: BrowserObject) {
    this.Attributes = browserObject.Attributes;
    this.Descriptor = browserObject.Descriptor;
    this.Designation = browserObject.Designation;
    this.HasChild = browserObject.HasChild;
    this.Name = browserObject.Name;
    this.Location = browserObject.Location;
    this.ObjectId = browserObject.ObjectId;
    this.SystemId = browserObject.SystemId;
    this.ViewId = browserObject.ViewId;
    this.ViewType = browserObject.ViewType;

  }
}

@Injectable({
  providedIn: 'root'
})

export class DocumentSnapinService {
  public selectedObject: BrowserObject;
  public objectTypeFilter = '{"2600":[2601]}';
  // public documentTileSelectionSub: Subject<DocumentSearchedItem> = new Subject<DocumentSearchedItem>();
  public documentTileSelectionSub: Subject<any> = new Subject<any>();
  public cnsValue: CnsLabel;

  private readonly _trModule = 'gmsSnapins_DocumentViewerService';
  private _whitelist: string[] = [];

  constructor(
    private readonly traceService: TraceService,
    private readonly systemBrowserService: SystemBrowserServiceBase,
    private readonly cnsHelperService: CnsHelperService,
    private readonly documentService: DocumentServiceBase
  ) {

    if (this.cnsHelperService) {
      this.cnsHelperService.activeCnsLabel.subscribe(() => {
        if (!isNullOrUndefined(this.cnsHelperService.activeCnsLabelValue)) {
          this.cnsValue = this.cnsHelperService.activeCnsLabelValue;
        }
      });
    }

    this.documentService.getWhitelist().toPromise().then(res => {
      this._whitelist = res.whitelist;
    });
  }

  public onTileClick(/* tile: DocumentSearchedItem*/tile: any): void {
    this.systemBrowserService.searchNodes(tile.SystemId, tile.Designation, tile.ViewId).toPromise().then(search => {
      const node: BrowserObject = search.Nodes[0];
      this.documentService.getUrl(node, node.Designation).then(res => {
        if (res.type === 'url') {
          if (this.findWhitelist(res.path) === false) {
            this.documentService.openTab(res.path);
          } else {
            this.documentTileSelectionSub.next(tile);
          }
        } else if (res.type === 'file') {
          this.documentTileSelectionSub.next(tile);
        }
      });
    });
    this.traceService.debug(this._trModule, 'Tile clicked: ' + tile.Name);
  }

  public findWhitelist(url: string): boolean {
    if (this._whitelist.find(x => x === url) !== undefined) {
      return true;
    } else {
      return false;
    }
  }

  public setSelectedObject(selectedObject: BrowserObject): void {
    this.selectedObject = selectedObject;
  }

  public getTargetNavigationBrowserObj(/* tile: DocumentSearchedItem*/tile: any): Observable<Page> {
    const page: Observable<Page> = this.systemBrowserService.searchNodes(tile.SystemId, tile.Designation, tile.ViewId);
    return page;
  }
}
