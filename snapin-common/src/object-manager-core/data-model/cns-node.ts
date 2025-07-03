import { Observable } from 'rxjs';
import { BrowserObject, ViewNode } from '@gms-flex/services';
import { isNullOrUndefined } from '@gms-flex/services-common';

export interface CnsNodeIfc {

  readonly isDeleted: boolean;
  readonly name: string;
  readonly description: string;
  readonly designation: string;
  readonly isRoot: boolean;
  readonly isLeaf: boolean;
  readonly systemName: string;
  // readonly cnsViewName: string;
  readonly cnsView: ViewNode;

  // DO NOT BIND to this property; it is intended to be used ONLY build short-lived HFW selection messages!!!
  // For binding, use other properties that wrap specific fields of the internal BrowserObject.
  // If you need to bind to a field of the internal BrowserObject and there is no specific accessor property
  // for it in the interface, create one.
  readonly browserObj: BrowserObject;

}

export abstract class CnsNode implements CnsNodeIfc {

  public children: CnsNode[];
  private deleted: boolean;

  public get isDeleted(): boolean {
    return Boolean(this.deleted);
  }

  public get name(): string {
    return this.bo.Name;
  }

  public get description(): string {
    return this.bo.Descriptor;
  }

  public get designation(): string {
    return this.bo.Designation;
  }

  public get isRoot(): boolean {
    return isNullOrUndefined(this.parent);
  }

  public get isLeaf(): boolean {
    return !this.bo.HasChild;
  }

  public get browserObj(): BrowserObject {
    return this.bo;
  }

  public get systemName(): string {
    return this.cnsView.SystemName;
  }

  // public get cnsViewName(): string {
  //   return this.cnsView.Name;
  // }

  public abstract get parent(): CnsNode;

  public abstract get cnsView(): ViewNode;

  protected constructor(private bo: BrowserObject) {
    if (!bo) {
      throw new Error('invalid argument');
    }
  }

  public update(bo: BrowserObject): void {
    if (!bo) {
      throw new Error('invalid argument');
    }
    if (this.isDeleted) {
      throw new Error('attempt to update deleted node');
    }
    this.bo = bo;
  }

  // The aggregate-view will mark the cns-node as 'deleted' when removing it from the view.
  // This allows view-model level objects with tree-item references to the cns-node to more
  // easily synchronize with the data-model once they receive the eventual data-model change
  // indication.
  public markDeleted(): void {
    this.deleted = true;
    if (this.children) {
      this.children.forEach(child => child.markDeleted());
    }
  }

}

export class CnsRootNode extends CnsNode {

  public get cnsView(): ViewNode {
    return this.cnsViewRef;
  }

  public get parent(): CnsNode {
    return undefined;
  }

  public constructor(
    private readonly cnsViewRef: ViewNode,
    bo: BrowserObject) {

    super(bo);
    if (!cnsViewRef) {
      throw new Error('invalid argument');
    }
  }
}

export class CnsSubNode extends CnsNode {

  public get cnsView(): ViewNode {
    return this.parent.cnsView;
  }

  public get parent(): CnsNode {
    return this.parentRef;
  }

  public constructor(
    private readonly parentRef: CnsNode,
    bo: BrowserObject) {

    super(bo);
    if (!parentRef) {
      throw new Error('invalid argument');
    }
  }
}
