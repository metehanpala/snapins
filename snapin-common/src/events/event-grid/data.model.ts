import { Category, Event, EventCommand, EventDetailsList, EventStates, GmsMessageData, TextEntry } from '@gms-flex/services';

export interface FilterTables {
  disciplines: TextEntry[];
  objectTypes: TextEntry[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum enumEventStyling {
  None = 0,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Event = 1,
  EventFirstChild = 2,
  EventMiddleChild = 3,
  EventLastChild = 4
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

// eslint-disable-next-line @typescript-eslint/naming-convention

/*
export enum enColumnType {
  Hidden = 0,
  Text = 1,
  EventIcon = 2,
  State = 3,
  Timer = 4,
  Recursation = 6,
  Buttons = 7
}
*/

// export enum enumColumnType {
//   HIDDEN = 0,
//   TEXT = 1,
//   ICON = 2,
//   PIPE = 3,
//   BUTTON = 4,   // or Button array
//   PIPED_ICON_BOX = 6,
//   ICON_AND_TEXT     = 7,
//   DOUBLE_LINE       = 8
// }

export interface FirstEvent {
  event: Event;
  isSingleEvent: boolean;
}
