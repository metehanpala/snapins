import { Event, GmsMessageData, TextEntry } from '@gms-flex/services';

export interface FilterTables {
  disciplines: TextEntry[];
  objectTypes: TextEntry[];
}

export class EventSelectionMessage {
  public types: string[];
  public body: GmsMessageData;
}

export class EventUpdateNotificationMessage {
  public constructor(
    public events: Event[],
    public isClosed: boolean = false
  ) {}
}
