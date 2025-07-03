/* eslint-disable @typescript-eslint/naming-convention */
enum TraceModulesEn {
  GmsSnapins_OperatorTaskSnapin,
  GmsSnapins_OperatorTaskDataServices,
  GmsSnapins_OperatorTaskContent,
  GmsSnapins_OperatorTaskDetails,
  GmsSnapins_OperatorTaskModel,
  GmsSnapins_OperatorTaskListVM,
  GmsSnapins_OperatorTaskTargetVM
}
/* eslint-enable @typescript-eslint/naming-convention */

export class TraceModules {
  public static snapinTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskSnapin];
  public static servicesTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskDataServices];
  public static contentTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskContent];
  public static detailsTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskDetails];
  public static modelTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskModel];
  public static vmListTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskListVM];
  public static vmTargetTrace: string = TraceModulesEn[TraceModulesEn.GmsSnapins_OperatorTaskTargetVM];
}
