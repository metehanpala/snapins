/** class imports */
import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';

/** class constants */
const videoCameraOM = 'GMS_VIDEO_Camera';
const videoCameraGroupOM = 'GMS_VIDEO_CameraGroup';
const sequenceOM = 'GMS_VIDEO_Sequence';
const videoRootNode = '.ApplicationView:ApplicationView.Video';
const cameraGroupsRootNode = '.ApplicationView:ApplicationView.Video.CameraGroups';
const camerasRootNode = '.ApplicationView:ApplicationView.Video.Cameras';
const sequencesRootNode = '.ApplicationView:ApplicationView.Video.Sequences';

/**
 * Wrapper class for Object Manager Service
 *
 * @export
 * @class ObjectManager
 */
@Injectable({
  providedIn: 'root'
})
export class ObjectManager {

  /**
   *Creates an instance of ObjectManager.
   * @param {} objectManagerService
   * @memberof ObjectManager
   */
  constructor(
    // private readonly objectManagerService: ObjectManagerService,
    private readonly traceService: TraceService
  ) {
  }

  /**
   * buttonClickOM
   *
   * @param objectManagerService
   * @param {} name
   * @param {} dialogTitle
   * @param {} systemName
   * @param {} selectedObjectName
   * @returns {}
   * @memberof ObjectManager
   */
  public buttonClickOM(objectManagerService: any,
    name: string, dialogTitle: string, systemName: string, selectedObjectName: string): Observable<string[]> {
    this.traceService.debug(TraceModules.videoObjectManager, '$$$(buttonClickOM) %s %s %s %s',
      name, dialogTitle, systemName, selectedObjectName);
    return new Observable(observer => {

      // set object manager service config data
      const availableViews /* : AggregateViewId[]*/ = [];
      const userSystemName = '';
      const userViewSpecification /* : ViewFilter*/ = { viewIds: availableViews, systemName: userSystemName };

      const objectManagerConfig /* : ObjectManagerServiceModalOptions*/ = {
        singleSelection: true,
        hideSearch: false,
        roots: [`${systemName}${videoRootNode}`],
        views: userViewSpecification,
        selectedNode: undefined,
        selectableTypes: [videoCameraOM, videoCameraGroupOM, sequenceOM]
      };

      switch (name) {
        // camera groups
        case 'A_CG':
          objectManagerConfig.selectableTypes = [videoCameraGroupOM];
          objectManagerConfig.roots = [`${systemName}${cameraGroupsRootNode}`];
          break;

          // sequences
        case 'A_Se':
          objectManagerConfig.selectableTypes = [sequenceOM];
          objectManagerConfig.roots = [`${systemName}${sequencesRootNode}`];
          break;

          // cameras
        case 'A_Ca':
          objectManagerConfig.selectableTypes = [videoCameraOM];
          objectManagerConfig.roots = [`${systemName}${camerasRootNode}`];
          break;

          // all (default)
        case 'A':
          break;

          // multi root
        case 'A_MR':
          objectManagerConfig.selectableTypes = [videoCameraOM];
          objectManagerConfig.roots = [`${systemName}${camerasRootNode}`];

          if (this.isMonitorGroup(selectedObjectName)) {
            objectManagerConfig.selectableTypes = objectManagerConfig.selectableTypes.concat([videoCameraGroupOM, sequenceOM]);
            objectManagerConfig.roots = objectManagerConfig.roots.concat([`${systemName}${cameraGroupsRootNode}`,
              `${systemName}${sequencesRootNode}`]);
          }
          break;

        default:
          this.traceService.error(TraceModules.videoObjectManager, `objectManager.buttonClickOM - Unknown name: ${name}`);
          break;
      }

      // call the show method of the object manager service, wait and check the result
      objectManagerService.show(dialogTitle, objectManagerConfig).subscribe(
        resp => {
          this.traceService.debug(TraceModules.videoObjectManager, '$$$(show - resp: %s - config: %s)', resp, objectManagerConfig);
          // Hidden = 0,
          // Cancelled = 1,
          // Ok = 2
          if (resp !== undefined && resp.action === 2 /* ModalDialogResult.Ok */) {
            const len: number = resp.selection.length;
            if (resp.selection[len - 1].Attributes.ObjectModelName === videoCameraOM) {
              // video camera selected => VC
              observer.next(['VC', resp.selection[len - 1].Descriptor, resp.selection[len - 1].Name]);
              observer.complete();
            } else if (resp.selection[len - 1].Attributes.ObjectModelName === videoCameraGroupOM) {
              // video camera group selected => VCG
              observer.next(['VCG', resp.selection[len - 1].Descriptor, resp.selection[len - 1].Name]);
              observer.complete();
            } else if (resp.selection[len - 1].Attributes.ObjectModelName === sequenceOM) {
              // sequence selected => SEQ
              observer.next(['SEQ', resp.selection[len - 1].Descriptor, resp.selection[len - 1].Name]);
              observer.complete();
            } else {
              // invalid object selected
              observer.error(undefined);
              observer.complete();
            }
          } else {
            // either cancel or nothing selected
            observer.error(undefined);
            observer.complete();
          }
        },
        error => {
          this.traceService.error(TraceModules.videoObjectManager, '$$$(show - error: %s)', error);
          // error: nothing selected
          observer.error(undefined);
          observer.complete();
        }
      );
    });
  }

  /**
   * isMonitorGroup
   *
   * @private
   * @param {} selectedObjectName
   * @returns {}
   * @memberof ObjectManager
   */
  private isMonitorGroup(selectedObjectName: string): boolean {
    return selectedObjectName.startsWith('mngr');
  }
}
