import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { AppContextService, isNullOrUndefined } from '@gms-flex/services-common';
import { ValidationCredentialType } from '@gms-flex/services';
import { CredentialInfo } from '../utilities/credential-info';
import { InputType } from '../utilities/enums/input.type';

@Component({
  selector: 'gms-credentials-ui',
  template: `
      <div class="mb-9">
          <div class="si-body-1 mb-6">
              {{(IsUserAuthentication ? 'VALIDATION-DIALOG.USER-AUTHENTICATION' : 'VALIDATION-DIALOG.SUPERVISOR-AUTHENTICATION') | translate}}
          </div>
          <div class="mb-6">
             <div>
              {{'VALIDATION-DIALOG.USER-NAME' | translate}}
             </div>
              <div class="form-control-has-icon w-100">
                  <input #userNameInput type="text"
                         class="form-control"
                         required
                         (keyup)="onUserUpdate($event)"
                         [readonly]="IsUserAuthentication ? true : null"
                         [attr.data-cy]="'userNameInput'">
              </div>
          </div>
          <div class="mb-6">
              <div>
                {{'VALIDATION-DIALOG.PASSWORD' | translate}}
              </div>
              <div class="form-control-has-icon w-100">
                  <input #passwordInput type="password"
                         class="form-control"
                         [value]="displayPassword"
                         (keydown)="onKeyDown($event)"
                         (beforeinput)="onBeforeInput($event)"
                         [attr.data-cy]="'passwordInput'">
              </div>
          </div>
      </div>
  `,
  styleUrl: './credentials.component.scss',
  standalone: false
})

export class CredentialsComponent implements AfterViewInit {
  public labelWidth = 140;
  public userName: string = undefined;
  public storedPassword = '';
  public displayPassword = '';
  public readonly asterisk: string = '*';
  @Input() public validationCredential: ValidationCredentialType;
  @Output() public readonly fieldsChanged: EventEmitter<CredentialInfo> = new EventEmitter<CredentialInfo>();

  @ViewChild('userNameInput') private readonly userNameInput: ElementRef = undefined;
  @ViewChild('passwordInput') private readonly passwordInput: ElementRef = undefined;

  constructor(private readonly appContextService: AppContextService,
    private readonly cdRef: ChangeDetectorRef) {
  }

  public get IsUserAuthentication(): boolean {
    return this.validationCredential === ValidationCredentialType.UserAuthentication;
  }

  public ngAfterViewInit(): void {
    if (this.IsUserAuthentication) {
      this.userNameInput.nativeElement.value = this.appContextService.userNameValue;
      this.userName = this.appContextService.userNameValue;
    }
  }

  public onUserUpdate(event: KeyboardEvent): void {
    if (this.isEnterKey(event)) {
      return;
    }

    this.userName = this?.userNameInput?.nativeElement?.value || '';
    const credentialInfo: CredentialInfo = new CredentialInfo(this.userName, this.storedPassword);
    this.fieldsChanged.emit(credentialInfo);
  }

  public onKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  public onBeforeInput(event: InputEvent): void {
    event.preventDefault();
    if (event.inputType === InputType.INSERT_TEXT) {
      const str: string = event.data;
      this.addCharacter(str);
      this.emitCredentials();
    } else if (event.inputType === InputType.DELETE_CONTENT) {
      this.handleBackspace();
      this.emitCredentials();
    }
  }

  public emitCredentials(): void {
    const credentialInfo: CredentialInfo = new CredentialInfo(this.userName, this.storedPassword);
    this.fieldsChanged.emit(credentialInfo);
  }

  public isEnterKey(event: KeyboardEvent): boolean {
    return event?.key === 'Enter';
  }

  public get HasSelection(): boolean {
    const selectionStart: number = this?.passwordInput?.nativeElement?.selectionStart;
    const selectionEnd: number = this?.passwordInput?.nativeElement?.selectionEnd;

    if (!isNullOrUndefined(selectionStart) && !isNullOrUndefined(selectionEnd)) {
      const selectionLength: number = selectionEnd - selectionStart;
      return selectionLength !== 0;
    }

    return false;
  }

  public isValidCharacterInput(str: string): boolean {
    if (isNullOrUndefined(str)) {
      return false;
    }

    return str.length === 1;
  }

  private clearPasswordField(): void {
    this.storedPassword = '';
    this.displayPassword = '';
    this.cdRef.detectChanges();
  }

  private handleBackspace(): void {
    if (this.HasSelection) {
      this.clearPasswordField();
    }

    this.storedPassword = this.storedPassword.slice(0, -1);
    this.displayPassword = this.displayPassword.slice(0, -1);
  }

  private addCharacter(str: string): void {
    if (this.isValidCharacterInput(str)) {
      if (this.HasSelection) {
        this.clearPasswordField();
      }

      this.storedPassword += str;
      this.displayPassword += '*';
      this.cdRef.detectChanges();
    }
  }
}
