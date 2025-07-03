import { Designation, ObjectAttributes, ValueDetails } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';
import { TreeItem } from '@simpl/element-ng';
import { CovFormatter } from '../../utility/cov-formatter';
import { CnsNodeIfc } from '../data-model/cns-node';

export enum TreeItemlLifeCycleState {

  New = 0,
  CreatePending,
  InSync,
  Modify,
  UpdatePending,
  DeletePending

}

export interface ItemTemplateTranslator {

  getItemTemplateName(state: TreeItemlLifeCycleState): string;

}

export class TreeItemData {

  // When the TreeItemData is created, the object-type/subtype used to load the icon
  // into the associated TreeItem is copied from the provided BrowserObject.
  // In the event that the object-(sub)type is later modified at the server, the
  // copy kept here will allow this change to be detected and the icon reloaded.
  // In short, this property should always hold the object-(sub)type associated with
  // the icon currently loaded into the TreeItem.
  public iconObjectType: number;
  public iconObjectSubType: number;

  // This field is used only for new tree-items created on the client.
  // The location at the time of the create request (parent location + user provided
  // description for new tree-item) is used to match the newly created tree-item with
  // the cns-node created by the server and returned in the CNS change indication.
  // We cannot use designation for this since the new node's name is generated at the
  // server.
  public createLocation: string;

  private refCnsNode: CnsNodeIfc;
  private val: ValueDetails;
  private formatter: CovFormatter;
  private lcState: TreeItemlLifeCycleState;

  public get cnsNode(): CnsNodeIfc {
    return this.refCnsNode;
  }

  public get hasFormatter(): boolean {
    return !isNullOrUndefined(this.formatter);
  }

  public set currentValue(vd: ValueDetails) {
    this.val = vd;
    this.refTreeItem.dataField2 = undefined;
    if (this.val && this.hasFormatter) {
      this.refTreeItem.dataField2 = this.formatter.format(this.val);
    }
  }

  public get propertyNameSummaryStatus(): string {
    if (!this.cnsNode) {
      return undefined;
    }
    let propname: string;
    const objname: string = this.refCnsNode.browserObj.ObjectId;
    if (objname) {
      propname = objname + '.StatusPropagation.AggregatedSummaryStatus';
    }
    return propname;
  }

  public get propertyNameDefault(): string {
    if (!this.cnsNode) {
      return undefined;
    }
    let propname: string;
    const objname: string = this.refCnsNode.browserObj.ObjectId;
    const attr: ObjectAttributes = this.refCnsNode.browserObj.Attributes;
    if (objname && attr) {
      if (attr.FunctionDefaultProperty) {
        // For function properties, the '@' delimiter is included with the property-name string
        propname = objname + attr.FunctionDefaultProperty;
      } else if (attr.DefaultProperty) {
        propname = objname + '.' + attr.DefaultProperty;
      }
    }
    return propname;
  }

  public get lifeCycleState(): TreeItemlLifeCycleState {
    return this.lcState;
  }

  public static extract(ti: TreeItem): TreeItemData {
    let tiData: TreeItemData;
    if (ti?.customData) {
      tiData = ti.customData as TreeItemData;
    }
    return tiData;
  }

  public static create(ti: TreeItem, cnsNode: CnsNodeIfc, xlator: ItemTemplateTranslator): TreeItemData {
    const tiData: TreeItemData = new TreeItemData(ti, cnsNode, xlator);
    ti.customData = tiData;
    return tiData;
  }

  protected constructor(
    private readonly refTreeItem: TreeItem,
    cnsNode: CnsNodeIfc,
    xlator: ItemTemplateTranslator) {
    if (!refTreeItem) {
      throw new Error('invalid argument');
    }
    this.setLifeCycleState(TreeItemlLifeCycleState.New, xlator);
    this.setCnsNode(cnsNode, xlator);
  }

  public setCnsNode(cnsNode: CnsNodeIfc, xlator: ItemTemplateTranslator): void {
    if (!cnsNode) {
      return;
    }
    if (this.refCnsNode && this.refCnsNode.designation !== cnsNode.designation) {
      throw new Error('tree-item to cns-node association cannot be changed');
    }
    this.refCnsNode = cnsNode;
    this.setLifeCycleState(TreeItemlLifeCycleState.InSync, xlator);
    this.iconObjectType = this.refCnsNode.browserObj.Attributes.TypeId;
    this.iconObjectSubType = this.refCnsNode.browserObj.Attributes.SubTypeId;
  }

  public markModify(xlator: ItemTemplateTranslator): void {
    if (this.lifeCycleState !== TreeItemlLifeCycleState.InSync) {
      return;
    }
    this.setLifeCycleState(TreeItemlLifeCycleState.Modify, xlator);
  }

  public markModifyCancelled(xlator: ItemTemplateTranslator): void {
    if (this.lifeCycleState !== TreeItemlLifeCycleState.Modify) {
      return;
    }
    this.setLifeCycleState(TreeItemlLifeCycleState.InSync, xlator);
  }

  public markSyncPending(xlator: ItemTemplateTranslator): void {
    switch (this.lifeCycleState) {
      case TreeItemlLifeCycleState.New:
        this.setLifeCycleState(TreeItemlLifeCycleState.CreatePending, xlator);
        break;
      case TreeItemlLifeCycleState.Modify:
        this.setLifeCycleState(TreeItemlLifeCycleState.UpdatePending, xlator);
        break;
      case TreeItemlLifeCycleState.InSync:
        throw new Error('inconsistent state change request');
        break;
      default:
        // Already in an update pending state; ignore
        break;
    }
  }

  public markDeletePending(xlator: ItemTemplateTranslator): void {
    this.setLifeCycleState(TreeItemlLifeCycleState.DeletePending, xlator);
  }

  public setFormatter(fmt: CovFormatter): void {
    this.formatter = fmt;
    // Re-assign current value through setter to force value re-formatting
    this.currentValue = this.val;
  }

  public compareDesignation(d: Designation, withSystem?: boolean): boolean {
    if (!this.cnsNode) {
      return false;
    }
    if (!d || !d.isValid) {
      return false;
    }
    const dLocal: Designation = new Designation(this.refCnsNode.designation);
    if (!withSystem || !d.isSystemValid) {
      return dLocal.designationWoSystem === d.designationWoSystem;
    } else {
      return dLocal.designation === d.designation;
    }
  }

  private setLifeCycleState(state: TreeItemlLifeCycleState, xlator: ItemTemplateTranslator): void {
    this.lcState = state;
    if (xlator) {
      this.refTreeItem.templateName = xlator.getItemTemplateName(this.lifeCycleState) || this.refTreeItem.templateName;
    }
  }
}
