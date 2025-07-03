import { Tables, TablesServiceBase } from '@gms-flex/services';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TablesService {

  constructor(
    private readonly tablesService: TablesServiceBase
  ) {}

  public getIcon(iconNum: number): Observable<any> {
    const table: Tables = Tables.ObjectTypes;
    return this.tablesService.getGlobalIconExt(table, iconNum);
  }
}
