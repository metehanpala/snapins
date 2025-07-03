enum TraceModulesEn {
  GmsSnapinsEventList,
  GmsSnapinsEventListPerformance
}

export class TraceModules {
  public static eventList: string = TraceModulesEn[TraceModulesEn.GmsSnapinsEventList];
  public static eventListPerformance: string = TraceModulesEn[TraceModulesEn.GmsSnapinsEventListPerformance];
}
