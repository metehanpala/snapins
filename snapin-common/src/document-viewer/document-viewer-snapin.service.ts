/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import {
  BrowserObject,
  CnsHelperService,
  CnsLabel,
  DocumentServiceBase
} from '@gms-flex/services';
import { Subject } from 'rxjs';
import { isNullOrUndefined } from '@gms-flex/services-common';

@Injectable({
  providedIn: 'root'
})

export class DocumentViewerSnapinService {
  public selectedObject: BrowserObject;
  public objectTypeFilter = '{"2600":[2601]}';
  // public documentTileSelectionSub: Subject<DocumentSearchedItem> = new Subject<DocumentSearchedItem>();
  public documentTileSelectionSub: Subject<any> = new Subject<any>();
  public cnsValue: CnsLabel;

  private _whitelist: string[] = [];

  constructor(
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

  public findWhitelist(url: string): boolean {
    if (this._whitelist.find(x => x === url) !== undefined) {
      return true;
    } else {
      return false;
    }
  }
}
