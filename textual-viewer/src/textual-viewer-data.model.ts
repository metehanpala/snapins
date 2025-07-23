/**
 * Types of cells supported in grid.
 */
import { Subject } from 'rxjs';

export enum EnumColumnType {
  HIDDEN = 0,
  TEXT = 1,
  ICON = 2,
  PIPE = 3,
  BUTTON = 4, // or Button array
  /* eslint-disable-next-line */
  PIPED_ICON_BOX = 6
}

export enum EnumGridUsageType {
  BootstrapWidthSystem = 1,
  CustomWidthSystem = 2,
  StretchableGrid = 3
}

/**
 * This enum is used to communicate with snapins.
 */
export enum EnumGridComm {
  BlinkIcons = 0, // * Blink Icons
  UpdateSelectedRows = 1,
  GridViewInitialized = 2
}

/**
 * NOTE: Small Screen View Mode div styles should be global
 */
export interface SmallScreenConfig {
  headersTitle?: string;
  headers?: HeaderData[];
}

/**
 * This interface contains all CONSTANT texts in grid-control.
 */
export interface GridTexts {
  customizationModalTitle?: string;
  customizationModalDescription?: string;
  customizationModalDefaultBtn?: string;
}

/**
 * Communication interface between snapins and grid-control
 */
export interface IGridComm {
  commType: EnumGridComm | undefined;
  metaData: any | undefined;
  cardView: boolean;
}

/**
 * Enumeration for specifying what to show
 * @readonly
 * @enum {number}
 */
export enum BACnetDateTimeDetail {
  Unspecified = 0,
  DateOnly = 1,
  TimeOnly = 2,
  DateAndTime = 3
}

/**
 * Enumeration for specifying time resolution (when time is to be displayed)
 * @readonly
 * @enum {number}
 */
export enum BACnetDateTimeResolution {
  Seconds = 0,
  Tenths = 1,
  Hundredths = 2
}

/**
 * Global grid-control settings go here.
 */
export interface GridSettings {
  smallScreenDivStyleClasses?: string[];
  texts?: GridTexts;
  gridUsageType: EnumGridUsageType;
  disableCustomizeLeftCols?: number;
  disableCustomizeRightCols?: number;
  smallScreenHeaders?: SmallScreenConfig;
  disableReflectVisibility?: boolean; // * Reflect column visibility setting in the small screen mode
  gridInitialWidths?: boolean; // * This flag is only valid for enumGridUsageType.StretchableGrid.
  // * With this flag, columns can be initialized with any width. Useful when saving headers with width
  enableDefaultColCustomization?: boolean | undefined ;
  // * With this flag set to true, a new button can be seen in column customization modal to request default
  // * settings of snapin.
  commInSubject?: Subject<IGridComm>; // * Subject to communicate from snapin to grid
  commOutSubject?: Subject<IGridComm>; // ! Subject to communicate from grid to snapin. (NOT IMPLEMENTED YET)
}

/**
 * interface for rows of the grid.
 */
export interface GridData {
  rowId?: number;
  enableStatePipe?: boolean;
  statePipeColor?: string;
  firstInGroup?: boolean;
  groupHeader?: string;
  cellData: Map<string, any>;
  cellStyle: Map<string, string>;
  rowStyle: any; // * [ngStyle]
  rowStyleClass: string; // * [ngClass]
  customData?: any;
}

export interface SelectedInfo {
  selected: GridData[];
}

export enum EnumIconType {
  GLYPHICON = 0,
  IMAGE = 1,
  HTML = 2
}

export enum EnumColumnGroup {
  GroupNone = 0,
  GroupOne = 1,
  GroupTwo = 2,
  GroupThree = 3,
  GroupFour = 4,
  GroupFive = 5
}

export interface GridData {
  rowId?: number;
  enableStatePipe?: boolean;
  statePipeColor?: string;
  firstInGroup?: boolean;
  groupHeader?: string;
  cellData: Map<string, any>;
  cellStyle: Map<string, string>;
  rowStyle: any;
  rowStyleClass: string;
  customData?: any;
}

export class GridVirtualizedArgs {
  public gridData: GridData[];
  public virtualized: boolean;
  constructor(gridData: GridData[], virtualized: boolean) {
    this.gridData = gridData;
    this.virtualized = virtualized;
  }
}

export class HeaderData {
  public width?: number; // * Only used if enumGridUsageType.StretchableGrid.
  public headerIconClass?: string;
  public gridName?: string;
  public columnVisible!: boolean;
  public constructor(
    public id?: string, // this is reserved to bind the row data
    public label?: string,
    public widthPercentage?: number,
    public size?: string,
    public columnType?: EnumColumnType,
    public smallScreenOrder = 1,
    public columnGroup?: EnumColumnGroup,
    public showLabel?: boolean,
    public showfilter?: boolean,
    public allowHiding?: boolean,
    public isFixedSize?: boolean,
    public hideResize?: boolean,
    public styleClasses?: string,
    public minColWidth?: number,
    public configButton?: boolean) {
    this.showLabel = true;
    this.showfilter = false;
    this.allowHiding = true;
    this.isFixedSize = false;
    this.hideResize = false;
    this.styleClasses = '';
    this.columnVisible = true;
    this.minColWidth = 0;
    this.configButton = false;
  }
}
