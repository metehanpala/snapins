import { ViewNode, ViewType, ViewTypeConverter } from '@gms-flex/services';

export class AggregateViewId {
  constructor(
    public readonly type: ViewType,
    public readonly description: string) {
  }
  public static createFromViewNode(viewNode: ViewNode): AggregateViewId {
    if (!viewNode) {
      return undefined;
    }
    return new AggregateViewId(
      ViewTypeConverter.toViewType(viewNode.ViewType),
      viewNode.Descriptor
    );
  }
  public static isEqual(x: AggregateViewId, y: AggregateViewId): boolean {
    if (x && y &&
      x.type === y.type &&
      x.description === y.description) {
      return true;
    }
    return false;
  }

}
