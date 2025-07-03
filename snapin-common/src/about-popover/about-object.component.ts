import { Component, DoCheck, EventEmitter, Input, IterableChanges, IterableDiffer, IterableDiffers, NgZone, OnInit, Output } from '@angular/core';
import { BrowserObject } from '@gms-flex/services';
import { AboutObjectServiceBase } from './services/about-object.service.base';
import { ObjectViewModelIfc } from './view-model/object-vm.base';
import { AvailableBSPositions } from 'ngx-bootstrap/positioning';

@Component({
  selector: 'gms-about-popover',
  templateUrl: './about-object.component.html'
  // styleUrls: [""]
  ,
  standalone: false
})
export class AboutObjectComponent implements OnInit, DoCheck {

  @Input() public clientId: string;
  @Input() public objectList: BrowserObject[];
  @Input() public disablePopoverClick: boolean;
  @Input() public excludePopoverContainer: boolean;
  @Output() public readonly openStateChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() public set isPopoverOpen(val: boolean) {
    this.isOpen = val;
  }

  @Input() public set popoverPlacement(val: AvailableBSPositions) {
    this.placement = this.placementAllowedValues.find(s => s === val);
  }
  public get popoverPlacement(): AvailableBSPositions {
    return this.placement || this.placementDefault;
  }

  public vm: ObjectViewModelIfc;
  public isOpen: boolean;
  public excludePopover: boolean;
  public disableClick: boolean;

  private placement: AvailableBSPositions;
  private readonly placementDefault: AvailableBSPositions = 'auto';
  private readonly placementAllowedValues: AvailableBSPositions[] = [
    this.placementDefault,
    'top', 'bottom', 'left', 'right',
    'top left', 'top right', 'left top', 'right top',
    'bottom left', 'bottom right', 'left bottom', 'right bottom'
  ];
  private readonly objectListDiffer: IterableDiffer<any>;

  public constructor(
    private readonly ngZone: NgZone,
    differs: IterableDiffers,
    private readonly aboutObjectService: AboutObjectServiceBase) {

    // Create an object that can detect changes to an array of arbitrary items
    // NOTE: if array elements are objects, this differ will not detect changes to properties of those objects.
    this.objectListDiffer = differs.find([]).create();
  }

  public ngOnInit(): void {
    // These input settings are treated as one-time bindings on initialization
    this.excludePopover = !!this.excludePopoverContainer;
    this.disableClick = !!this.disablePopoverClick;

    this.vm = this.aboutObjectService.registerViewModel(this.clientId, this.ngZone);
  }

  public ngDoCheck(): void {
    if (this.objectListDiffer && this.vm) {
      // Check for changes to the input object-array; set new context of the VM on change
      const changes: IterableChanges<any> = this.objectListDiffer.diff(this.objectList);
      if (changes) {
        this.vm.setContext(this.objectList).subscribe();
      }
    }
  }

  public onOpenStateChange(state: boolean): void {
    this.isOpen = state;
    this.openStateChanged.emit(this.isOpen);
  }

}
