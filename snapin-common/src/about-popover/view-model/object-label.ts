import { defaultIcon } from '@gms-flex/services';

export interface ObjectLabelIfc {

  readonly primary: string;
  readonly secondary: string;
  iconCls: string;

}

export class ObjectLabel implements ObjectLabelIfc {

  public static readonly empty: ObjectLabel = new ObjectLabel();

  private icon: string;
  private labelArr: string[];

  public get primary(): string {
    return this.labelArr[0] || '';
  }

  public get secondary(): string {
    return this.labelArr[1] || '';
  }

  public get iconCls(): string {
    return this.icon || defaultIcon;
  }

  public set iconCls(val: string) {
    this.icon = val;
  }

  public constructor() {
    this.labelArr = [];
  }

  public update(lArr: string[]): void {
    this.labelArr = lArr || [];
  }

}
