/* eslint-disable @typescript-eslint/naming-convention */
enum TraceModulesEn {
  gmsSnapins_LogViewer
}
/* eslint-enable @typescript-eslint/naming-convention */

export class TraceModules {
  public static logViewer: string = TraceModulesEn[TraceModulesEn.gmsSnapins_LogViewer];
}
