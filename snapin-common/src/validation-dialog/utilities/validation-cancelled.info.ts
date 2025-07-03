export class ValidationCancelledInfo {
  private _validationCancelled = 'Validation Cancelled';
  public get ValidationCancelled(): string {
    return this._validationCancelled;
  }

  public set ValidationCancelled(value: string) {
    this._validationCancelled = value;
  }
}
