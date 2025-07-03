/**
 * Monitor status from VMS
 *
 * @enum {number}
 */
export enum MonitorStatus {
  NotDefined = 0, // grey (Undefined)     // NotConfigured,
  ConnectStream = 1, // green                // NotReachable,
  DisconnectStream = 2, // black                // Unknown,
  StreamNotAvailable = 3 // yellow               // Reachable
}

/**
 * Monitor colors
 *
 * @export string[]
 */
export const monitorColors: string[] = ['grey', 'green', 'black', 'yellow'];

/**
 * MonitorColorsUtilities
 *
 * @export
 * @class MonitorColorsUtilities
 */
export class MonitorColorsUtilities {

  /**
   * getMonitorColor
   *
   * @static
   * @param {} monitorStatus
   * @returns {}
   * @memberof MonitorColorsUtils
   */
  public static getMonitorColor(monitorStatus: MonitorStatus): string {
    return monitorColors[monitorStatus];
  }

  /**
   * getCommandColor
   *
   * @static
   * @param {} hasCommand
   * @param {} monitorStatus
   * @returns {}
   * @memberof MonitorColorsUtils
   */
  public static getCommandColor(hasCommand: boolean, monitorStatus: MonitorStatus): string {
    if (!hasCommand) {
      return 'black';
    }

    switch (monitorStatus) {
      case MonitorStatus.NotDefined:
      case MonitorStatus.StreamNotAvailable:
        return 'black';

      case MonitorStatus.ConnectStream:
      case MonitorStatus.DisconnectStream:
        return 'white';

      default:
        return '';
    }
  }
}

/**
 * Internal sequence status
 *
 *   0 - no sequence
 *   1 - sequence active - primary monitor
 *   2 - sequence active - not primary monitor
 *
 * @export
 * @enum {number}
 */
export enum SequenceStatus {
  NoSequenceActive,
  SequenceActivePrimaryMonitor,
  SequenceActiveNotPrimaryMonitor
}

/**
 * ErrorFlags
 *
 * @export
 * @class ErrorFlags
 */
export class ErrorFlags {
  // data receive error flags
  public objectNotFound: boolean;
  public videoAPINotReachable: boolean;
  public videoManagerNotReachable: boolean;
  public vmsNotReachable: boolean;
  public vmsSynchronizing: boolean;
  public maxClientsNumber: boolean;
  public videoSourceErrorState: string;

  /**
   * Creates an instance of ErrorFlags.
   * @memberof ErrorFlags
   */
  constructor() {
    // set initial flag values
    this.objectNotFound = false;
    this.videoAPINotReachable = false;
    this.videoManagerNotReachable = false;
    this.vmsNotReachable = false;
    this.vmsSynchronizing = false;
    this.maxClientsNumber = false;
    this.videoSourceErrorState = '';
  }
}

/**
 * Data from VMS for Monitor Wall objects
 *
 * @export
 * @class VMSMonitorWallData
 */
export class VMSMonitorWallData extends ErrorFlags {

  // Monitor group data from VMS
  public monitorGroupId: string;
  public monitorGroupDescription: string;

  public monitorDescription: string;
  public cameraDescription: string;

  // Monitors data from VMS
  public sinks: VMSMonitorData[];

  /**
   * Creates an instance of VMSMonitorWallData.
   * @memberof VMSMonitorWallData
   */
  constructor() {
    super();
    this.sinks = undefined;
  }
}

/**
 * Data from VMS for Monitor objects
 *
 * @export
 * @class VMSMonitorData
 */
export class VMSMonitorData {

  // Monitor texts
  public monitorDescription: string;

  // Monitor status
  public monitorStatus: MonitorStatus;

  // Camera texts
  public cameraName: string;
  public cameraDescription: string;

  // Monitor flags
  public hasPlayback: boolean;

  // Monitor texts
  public id: string;

  // Sequence status
  public sequenceStatus: SequenceStatus;
}

/**
 * SnapshotData
 *
 * @export
 * @class SnapshotData
 * @extends {ErrorFlags}
 */
export class SnapshotData extends ErrorFlags {
  public imageData: string;

  /**
   * Creates an instance of SnapshotData.
   * @memberof SnapshotData
   */
  constructor() {
    super();
    this.imageData = '';
  }
}
