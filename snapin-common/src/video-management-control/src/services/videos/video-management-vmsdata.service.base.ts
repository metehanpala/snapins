/** class imports */
import { Observable } from 'rxjs';

import { SnapshotData, VMSMonitorWallData } from './vms.data.model';

/**
 * Base class for a VMS data service.
 * See the WSI documentation for details.
 *
 * @export
 * @abstract
 * @class VMSDataServiceBase
 */
export abstract class VMSDataServiceBase {

  /**
   * Gets selected node data.
   * See also WSI API specification.
   *
   * @abstract
   * @param {string} nodeObjectModel
   * @param {string} nodeName
   * @returns {Observable<VMSMonitorWallData[]>}
   * @memberof VMSDataServiceBase
   */
  public abstract getSelectedNodeData(nodeObjectModel: string, nodeName: string): Observable<VMSMonitorWallData>;

  /**
   * Gets operating monitor group data.
   * See also WSI API specification.
   *
   * @abstract
   * @param {string} hostname
   * @returns {Observable<VMSMonitorWallData>}
   * @memberof VMSDataServiceBase
   */
  public abstract getOperatingMonitorGroupData(hostname: string): Observable<VMSMonitorWallData>;

  /**
   * Gets snapshot data.
   * See also WSI API specification.
   *
   * @abstract
   * @param {string} videoSourceId
   * @param {string} p2
   * @param {string} p3
   * @param {string} p4
   * @param {string} p5
   * @returns {Observable<SnapshotData>}
   * @memberof VMSDataServiceBase
   */
  public abstract getSnapshotData(videoSourceId: string, p2: string, p3: string, p4: string, p5: string): Observable<SnapshotData>;
}
