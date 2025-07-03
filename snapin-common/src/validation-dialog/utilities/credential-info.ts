import { isNullOrUndefined } from '@gms-flex/services-common';

export class CredentialInfo {
  private _userName: string = undefined;
  public get UserName(): string {
    return this._userName;
  }

  public set UserName(value: string) {
    this._userName = value;
  }

  private _password: string = undefined;
  public get Password(): string {
    return this._password;
  }

  public set Password(value: string) {
    this._password = value;
  }

  constructor(username?: string, password?: string) {
    this._userName = username;
    this._password = password;
  }

  public get HasMissingFields(): boolean {
    return isNullOrUndefined(this._userName) || this?._userName?.length === 0 || isNullOrUndefined(this._password) || this?._password?.length === 0;
  }
}
