export enum TaskCommandResult {
  Success,
  Error,
  Cancelled
}

export enum CommandResult {
  NoError = 0,
  Error = 1,
  LicenseMissing = 2,
  PropertyNotFound = 10,
  CommandNameNotFound = 11,
  CommandAliasNotFound = 12,
  CommandNotFound = 13,
  NoCommandsAvailable = 14,
  InvalidParameters = 15,
  CommandExecutionError = 16,
  InvalidAffectedProperty = 17,
  ErrorReadingOriginalValues = 18,
  AccessDeniedToCmdGroup = 100,
  AccessDeniedToEventCmd = 101,
  AccessDeniedToProperty = 102,
  AuthorizationAccessDenied = 103,
  AuthorizationError = 104,
  CommandDisabled = 105,
  CommandProviderNotRunning = 106,
  CommandProviderTimeout = 107,
  ParameterMissing = 108,
  ParameterOutOfRange = 109,
  ParameterWrongType = 110
}
