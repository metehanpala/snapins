import { NavbarItem } from '@simpl/element-ng';

export type NodeType = {
  name: string;
  descriptor: string;
  title: string;
  source: string;
  color: string;
  colorX: string;
  colorPB: string;
  colorS1: string;
  colorS1N: string;
  tooltip: string;
  actions: NavbarItem[];
  actionsStatus: number; // 0 = starting, 1 = no actions, 2 = actions set
  location: string;
  designation: string;
  cameraIcon: string;
  sequenceIcon: string;
};

/**
 * NodeUtilities
 *
 * @export
 * @class NodeUtilities
 */
export class NodeUtilities {

  /**
   * copyNode
   *
   * @static
   * @param {} dest
   * @param {} source
   * @memberof NodeUtilities
   */
  public static copyNode(dest: NodeType, source: NodeType): void {
    if (JSON.stringify(dest) !== JSON.stringify(source)) {
      this.copyNodeGeneralData(dest, source);
      this.copyNodeColors(dest, source);

      if (dest.actionsStatus !== 0) {
        if (dest.actions !== source.actions) {
          dest.actions = source.actions;
        }
      } else {
        dest.actions.push({});
      }

      dest.actionsStatus = 1;
    }
  }

  /**
   * copyNodeGeneralData
   *
   * @private
   * @static
   * @param {} dest
   * @param {} source
   * @memberof NodeUtilities
   */
  private static copyNodeGeneralData(dest: NodeType, source: NodeType): void {
    if (dest.name !== source.name) {
      dest.name = source.name;
    }
    if (dest.descriptor !== source.descriptor) {
      dest.descriptor = source.descriptor;
    }
    if (dest.title !== source.title) {
      dest.title = source.title;
    }
    if (dest.source !== source.source) {
      dest.source = source.source;
    }
    if (dest.tooltip !== source.tooltip) {
      dest.tooltip = source.tooltip;
    }
    if (dest.location !== source.location) {
      dest.location = source.location;
    }
    if (dest.designation !== source.designation) {
      dest.designation = source.designation;
    }
    if (dest.cameraIcon !== source.cameraIcon) {
      dest.cameraIcon = source.cameraIcon;
    }
    if (dest.sequenceIcon !== source.sequenceIcon) {
      dest.sequenceIcon = source.sequenceIcon;
    }
  }

  /**
   * copyNodeColors
   *
   * @private
   * @static
   * @param {} dest
   * @param {} source
   * @memberof NodeUtilities
   */
  private static copyNodeColors(dest: NodeType, source: NodeType): void {
    if (dest.color !== source.color) {
      dest.color = source.color;
    }
    if (dest.colorX !== source.colorX) {
      dest.colorX = source.colorX;
    }
    if (dest.colorPB !== source.colorPB) {
      dest.colorPB = source.colorPB;
    }
    if (dest.colorS1 !== source.colorS1) {
      dest.colorS1 = source.colorS1;
    }
    if (dest.colorS1N !== source.colorS1N) {
      dest.colorS1N = source.colorS1N;
    }
  }
}
