import { Subscription } from 'rxjs';
import { GmsSubscription, ValueDetails } from '@gms-flex/services';
import { TreeItem } from '@simpl/element-ng';

export class SubscriptionData {
  public valueSubscription: GmsSubscription<ValueDetails>;
  public valueChangedSubscription: Subscription = undefined;
  public stateChangedSubscription: Subscription = undefined;
  public get propertyName(): string {
    return this.dpe;
  }
  public get treeItem(): TreeItem {
    return this.ti;
  }
  public get isStatusProperty(): boolean {
    return Boolean(this.statusProp);
  }
  public constructor(
    private readonly dpe: string,
    private readonly ti: TreeItem,
    private readonly statusProp: boolean
  ) {
    if (!dpe || !ti) {
      throw new Error('invalid argument');
    }
  }
}
