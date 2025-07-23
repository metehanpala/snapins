import { GridData } from '../textual-viewer-data.model';

export class TextualViewerState {
  public selectedItems: GridData[];
  public scrollYPercentage: number;
  public designation: string;

  constructor(selectedItems: GridData[], scrollYPercentage: number, designation: string) {
    this.selectedItems = selectedItems;
    this.scrollYPercentage = scrollYPercentage;
    this.designation = designation;
  }
}
