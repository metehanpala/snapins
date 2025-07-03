export enum OperatorTaskStatuses {
  ClosedForMissingLicense = 10,
  Expired = 20,
  ReadyToBeClosed = 30,
  ExecutingCommands = 40,
  RevertingCommands = 50,
  WaitingForConditions = 60,
  Aborting = 70,
  RunningWithException = 80,
  Running = 90,
  Deferred = 95,
  Failed = 100,
  Closed = 110,
  Idle = 120,
  CheckingPreconditions = 130 // if this fails, use previousStatus
}
