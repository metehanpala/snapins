import { SearchOption } from '@gms-flex/services';

export class EventNote {
  public messageText: string;
  public time: string;
  public userName: string;
}

export class SystemBrowserInfo {
  public srcSystemId: number;
  public srcPropertyId: string;
  public searchOption: SearchOption;
}
