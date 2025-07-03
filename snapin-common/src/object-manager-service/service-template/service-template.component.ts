import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BrowserObject } from '@gms-flex/services';
import { Platform } from '@angular/cdk/platform';
import { ObjectManagerConfig, SelectedItemsChangedArgs } from '../../object-manager/object-manager.types';
import { ViewFilter } from '../../object-manager-core/view-model/types';
import { ModalDialogResult } from '../data.model';

@Component({
  selector: 'gms-om-service-template',
  templateUrl: './service-template.component.html',
  styleUrl: './service-template.component.scss',
  standalone: false
})
export class ServiceTemplateComponent implements OnInit {

  public singleSelection: boolean;
  public title: string;
  public hideSearch: boolean;
  public roots: string[];
  public selectionReceived: BrowserObject[];
  public receivedDesignation: string;
  public views: ViewFilter;
  public selectedNode: string;
  public selectableTypes: string[];
  public creatableTypes: string[];
  public buttonDisabled = true;
  public newItemBtnTxt = '';
  public defaultSaveObjectDesc = '';
  public defaultSaveObjectName = '';
  public saveCallback: any;
  public isMobileDevice: boolean;

  @Output() public readonly dialogBtnResult: EventEmitter<ModalDialogResult> = new EventEmitter<ModalDialogResult>();
  @Output() public readonly selectionChanged: EventEmitter<BrowserObject[]> = new EventEmitter<BrowserObject[]>();
  @Output() public readonly saveBOComplete: EventEmitter<BrowserObject> = new EventEmitter<BrowserObject>();

  public get enableUserFilter(): boolean {
    return !Boolean(this.hideSearch);
  }

  public get objectManagerConfig(): ObjectManagerConfig {
    return {
      viewConfig: {
        customRoots: this.roots,
        viewFilter: this.views,
        selectableTypes: this.selectableTypes,
        creatableTypes: this.creatableTypes
      },
      initialSelection: this.selectedNode,
      newItemBtnTxt: this.newItemBtnTxt,
      dialogCmdBtns: true,
      defaultSaveObjectName: this.defaultSaveObjectName,
      defaultSaveObjectDesc: this.defaultSaveObjectDesc      
    };
  }

  constructor(private readonly platform: Platform) {
    if (this.platform.ANDROID || this.platform.IOS) {
      this.isMobileDevice = true;
    } else {
      this.isMobileDevice = false;
    }
  }

  public ngOnInit(): void {
    this.onSelection(undefined);
  }

  public onSelection(sel: SelectedItemsChangedArgs): void {
    if (!sel || !sel.objects || sel.objects.length === 0) {
      return;
    }
    this.selectionChanged.emit(sel.objects);
    this.buttonDisabled = false;
  }

  public onCancel(): void {
    this.dialogBtnResult.emit(ModalDialogResult.Cancelled);
  }

  // send up the button that was used to close the modal
  public onDialogClosed(event: boolean): void {
    this.dialogBtnResult.emit(event ? ModalDialogResult.Ok : ModalDialogResult.Cancelled);
  }

  public onSavedBO(event: BrowserObject): void {
    this.saveBOComplete.emit(event);
  }
}
