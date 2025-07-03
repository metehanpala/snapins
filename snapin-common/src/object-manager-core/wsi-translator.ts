import { BrowserObject, SystemBrowserSubscription, SystemInfo, ViewNode } from '@gms-flex/services';

export abstract class WsiTranslator {

  public static toStringSystemInfo(si: SystemInfo, long?: boolean): string {
    if (!si) {
      return undefined;
    }
    return long ?
      `{sysId=${si.Id}, sysName=${si.Name}, isOnline=${si.IsOnline}}` :
      `${si.SystemId}|${si.Name}`;
  }

  public static toStringViewNode(v: ViewNode, long?: boolean): string {
    if (!v) {
      return undefined;
    }
    return long ?
      `{sysId=${v.SystemId}, viewId=${v.ViewId}, cnsViewType=${v.ViewType}, name=${v.Name}, desc=${v.Descriptor}}` :
      `${v.SystemId}|${v.Name}`;
  }

  public static toStringBrowserObject(b: BrowserObject, long?: boolean): string {
    if (!b) {
      return undefined;
    }
    return long ?
      `{name=${b.Name}, desc=${b.Descriptor}, desig=${b.Designation}}` :
      `${b.Name}|${b.Descriptor}`;
  }

  public static toStringAction(action: number): string {
    let astr = 'actUndef';
    switch (action) { // From PVSSManager doc:
      case 0: astr = 'actNone'; break; // Reserved value for 'no action known'
      case 1: astr = 'actNames'; break; // The observation deals on changing an WinCC OA system-name.
      case 2: astr = 'actViewCreate'; break; // The observation deals on creating a CNS view.
      case 3: astr = 'actViewDelete'; break; // The observation deals on deleting a CNS view.
      case 5: astr = 'actViewChangeNames'; break; // The observation deals on editing CNS view.
      case 6: astr = 'actViewChangeSeparators'; break; // The observation deals on editing a CNS view.
      case 7: astr = 'actTreeCreate'; break; // The observation deals on creating a CNS tree (i.e., a top-node in a view).
      case 8: astr = 'actTreeDelete'; break; // The observation deals on deleting a CNS tree (i.e., a top-node in a view).
      case 9: astr = 'actTreeChange'; break; // The observation deals on editing a CNS Tree (i.e., a top-node in a view).
        //   Due to a wrapper-internal design-decision, this value should never occur.
      case 10: astr = 'actTreeAdd'; break; // The observation deals on adding a CNS tree (i.e., a new node somewhere in a tree.
        //   Even if the node contains child nodes of its own, there will be only this one Observation)
      case 11: astr = 'actChangeNodeNames'; break; // The observation deals on changing a node's Name and DisplayName.
      case 12: astr = 'actChangeNodeData'; break; // The observation deals on changing node data (typically DpIdentifier).
      case 100: astr = 'actCollapsed'; break; // The observation deals on collapsing all nodes in the client-hosted tree.
      case 101: astr = 'actViewChangeType'; break; // The observation deals on changing a view type.
      default: break;
    }
    return `${action}|${astr}`;
  }

  public static toStringChange(change: number): string {
    let cstr = 'chnUndef';
    switch (change) {
      case 0: cstr = 'chnUnknown'; break; // Reserved value for 'no reason known'.
      case 1: cstr = 'chnSystemNameChanged'; break; // The observation is triggered because of a change in the LangText describing the system.
        //   System descriptions are NOT modeled from the PvssMgr CNS-wrapper (but client code might
        //   access it with IDpService.Read())
      case 2: cstr = 'chnViewSeparatorChanged'; break; // The observation is triggered because of a change in Separator.
      case 3: cstr = 'chnTreeNameChanged'; break; //  The observation is triggered because of a change in either DisplayName or Name.
      case 4: cstr = 'chnTreeDataChanged'; break; // The observation is triggered because of a change in CnsNodeType (and thus implicitly
        //   also in DpIdentifier).
      case 5: cstr = 'chnStructureChanged'; break; // The observation is triggered because of a structural change in the spedified view, tree,
        //   or node. This involves creation/delection of a CNS view, a CNS-node, or CNS-subtree.
      case 101: cstr = 'chnViewTypeChanged'; break; // The observation is triggered because of a change of view type.
      default: break;
    }
    return `${change}|${cstr}`;
  }

  public static toStringCnsChange(cnsChange: SystemBrowserSubscription): string {
    let s: string;
    if (cnsChange) {
      const actionStr: string = WsiTranslator.toStringAction(cnsChange.Action);
      const changeStr: string = WsiTranslator.toStringChange(cnsChange.Change);
      const cnsViewStr: string = WsiTranslator.toStringViewNode(cnsChange.View, true);
      const objStr: string = WsiTranslator.toStringBrowserObject(cnsChange.Node, true);
      s = `{action=${actionStr}, change=${changeStr}, cnsView=${cnsViewStr}, obj=${objStr}}`;
    }
    return s;
  }

}
