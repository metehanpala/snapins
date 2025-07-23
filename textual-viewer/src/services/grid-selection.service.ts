import { Injectable } from '@angular/core';

@Injectable()
export class GridSelectionService {
  private selection: any[] = [];

  public get selected(): any[] {
    return this.selection;
  }

  public isSelected(object: any): boolean {
    return this.selection.includes(object);
  }

  public select(object: any): void {
    this.selection.push(object);
  }

  public selectExclusive(object: any): void {
    this.selection = [object];
  }

  public unselect(object: any): void {
    const index: number = this.selection.findIndex(item => item === object);
    if (index !== -1) {
      this.selection.splice(index, 1);
    }
  }

  public toggle(object: any): void {
    if (this.isSelected(object)) {
      this.unselect(object);
    } else {
      this.select(object);
    }
  }

  public clear(): void {
    this.selection = [];
  }
}
