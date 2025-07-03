import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { AppContextService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import {
  CommentsInput,
  EncryptedPasswordResponse,
  PasswordEncryptionService,
  ValidateOpInfo,
  ValidationCredentialType,
  ValidationDialogResponse,
  ValidationDialogResult,
  ValidationResult
} from '@gms-flex/services';
import { CredentialInfo } from '../utilities/credential-info';
import { first } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { ValidationCancelledInfo } from '../utilities/validation-cancelled.info';

@Component({
  selector: 'gms-validation-menu',
  template: `
    <div class="modal-header mb-9 pb-0">
      <span [attr.data-cy]="'modalTitle'" class="modal-title">{{ 'VALIDATION-DIALOG.VALIDATION-REQUIRED' | translate }}</span>
      <button
        type="button"
        class="btn btn-circle btn-sm btn-ghost element-cancel validation-exit-button"
        aria-label="Close"
        [attr.data-cy]="'closeButton'"
        (click)="cancelValidation()"
      ></button>
    </div>
    <div class="modal-body p-0">
      <form>
        <div class="px-4">
          <gms-credentials-ui *ngIf="validateOpInfo.IsReauthenticationRequired" [attr.data-cy]="'currentUserSection'"
                              [validationCredential]="validationCredentialEnum.UserAuthentication"
                              (fieldsChanged)="onUserAuthInfoUpdate($event)"/>
          <gms-credentials-ui *ngIf="validateOpInfo.IsFourEyesEnabled" [attr.data-cy]="'fourEyesSection'"
                              [validationCredential]="validationCredentialEnum.SupervisorAuthentication"
                              (fieldsChanged)="onSupervisorAuthInfoUpdate($event)"/>
          <div *ngIf="validateOpInfo.IsCommentMandatory" class="si-body-1 mb-6">
            {{ 'VALIDATION-DIALOG.COMMENT' | translate }}
          </div>
          <div *ngIf="validateOpInfo.IsCommentMandatory && validateOpInfo.HasPredefinedComment"  class="si-body-1 mb-6">
            <select aria-label="number" class="form-control" (input)="onTextAreaChange($event)" [attr.data-cy]="'predefinedCommentsDropDown'">
              <option selected disabled
                      hidden>{{ 'VALIDATION-DIALOG.SELECT-PREDEFINED-COMMENT' | translate }}
              </option>
              <option *ngFor="let predefinedComment of validateOpInfo?.PredefinedComments;
                                trackBy: trackByIndex;" [attr.data-cy]="'comment-' + predefinedComment.Value">{{ predefinedComment.Text }}
              </option>
            </select>
          </div>
          <div *ngIf="validateOpInfo.IsCommentMandatory">
                        <textarea
                          #textAreaElement
                          [readonly]="validateOpInfo.HasPredefinedComment"
                          style="resize: none;"
                          type="text"
                          class="form-control"
                          placeholder=""
                          (input)="onTextAreaChange($event)"
                          [attr.data-cy]="'commentTextBox'"
                        ></textarea>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer pt-0">
      <div class="col-sm-6 text-end">
        <button type="button" class="btn btn-secondary" style="margin-right: 12px;" (click)="cancelValidation()"
                [attr.data-cy]="'cancelButton'">
          {{ 'VALIDATION-DIALOG.CANCEL' | translate }}
        </button>
        <button type="button" class="btn btn-primary" (click)="handleSubmitValidation()"
                [ngClass]="DisableOKButton ? 'disabled-ok-button' : null"
                [attr.disabled]="DisableOKButton ? 'disabled' : null" [attr.data-cy]="'okButton'">
          {{ 'VALIDATION-DIALOG.OK' | translate }}
        </button>
      </div>
      <div *ngIf="validateOpInfo?.HasSameUserAndSuperName" class="w-100">
        <si-inline-notification
          class="mb-6"
          severity="danger"
          heading="Error"
          [message]="'VALIDATION-DIALOG.HAS-SAME-USER-AND-SUPER-NAME' | translate"
          [attr.data-cy]="'sameUserAndSupervisorError'" />
      </div>
      <div *ngIf="!validateOpInfo?.IsValidOperatorState" class="w-100">
        <si-inline-notification
          class="mb-6"
          severity="danger"
          heading="Error"
          [message]="'VALIDATION-DIALOG.INVALID-ACCOUNT-FOR-OPERATOR' | translate"
          [attr.data-cy]="'userAccountTypeError'" />
      </div>
      <div *ngIf="!validateOpInfo?.IsValidSupervisorState" class="w-100">
        <si-inline-notification
          class="mb-6"
          severity="danger"
          heading="Error"
          [message]="'VALIDATION-DIALOG.INVALID-ACCOUNT-FOR-SUPERVISOR' | translate"
          [attr.data-cy]="'supervisorAccountTypeError'" />
      </div>
      <div *ngIf="validateOpInfo.AuthenticationFailed" class="w-100">
        <si-inline-notification
          class="mb-6"
          severity="danger"
          heading="Error"
          [message]="'VALIDATION-DIALOG.WRONG-USER-NAME-OR-PASSWORD' | translate"
          [attr.data-cy]="'wrongUserAndPasswordError'"/>
      </div>
      <div *ngIf="validateOpInfo.SupervisorCannotValidateSelection" class="w-100">
        <si-inline-notification
          class="mb-6"
          severity="danger"
          heading="Error"
          [message]="'VALIDATION-DIALOG.SUPERVISOR-MISSING-PRIVILEGE' | translate"
          [attr.data-cy]="'missingPrivilegeError'"/>
      </div>
    </div>
  `,
  styleUrl: './validation-menu.component.scss',
  providers: [TranslateService],
  standalone: false
})

export class ValidationMenuComponent implements AfterViewInit {
  @Input() public readonly validateOpInfo: ValidateOpInfo;
  @Input() public readonly validationCancelledInfo: ValidationCancelledInfo = new ValidationCancelledInfo();
  @Output() public readonly closed: Subject<ValidationDialogResponse> = new Subject<ValidationDialogResponse>();
  @ViewChild('textAreaElement') public textAreaElement: ElementRef;
  public supervisorCredInfo: CredentialInfo = new CredentialInfo();
  public userCredInfo: CredentialInfo = new CredentialInfo();
  public comment: string = undefined;
  public sessionKey: string = undefined;
  public encryptedSupervisorPassword: string = undefined;
  public validationCredentialEnum: any = ValidationCredentialType;
  public readonly traceModule = 'gmsSnapins_ValidationDialog';
  private readonly regExWhiteSpace = /^\s*$/;

  public readonly trackByIndex = (index: number): number => index;
  public constructor(private readonly traceService: TraceService,
    private readonly passwordEncryptionService: PasswordEncryptionService,
    private readonly translateService: TranslateService,
    private readonly httpClient: HttpClient,
    private readonly appContextService: AppContextService) {
  }

  public ngAfterViewInit(): void {
    this.loadTranslations();
  }

  public loadTranslations(): void {
    const translationPrefix = './@gms-flex/snapin-common/i18n/';
    this.translateService.currentLoader = new TranslateHttpLoader(this.httpClient, translationPrefix, '.json');

    this.appContextService.defaultCulture.pipe(first()).subscribe({
      next: (defaultCulture: string) => {
        if (!isNullOrUndefined(defaultCulture)) {
          this.traceService.info(this.traceModule, `Use default culture: ${defaultCulture} `);
          this.translateService.setDefaultLang(defaultCulture);
        } else {
          this.traceService.warn(this.traceModule, 'No default culture from appContextService');
          this.translateService.setDefaultLang(this.translateService.getBrowserCultureLang());
        }
      }
    });

    this.appContextService.userCulture.pipe(first()).subscribe({
      next: (userCulture: string) => {
        if (!isNullOrUndefined(userCulture)) {
          this.traceService.info(this.traceModule, `Use user culture: ${userCulture}`);
          this.translateService.use(userCulture).pipe(first()).subscribe({
            next: (res: any) => {
              this.traceService.info(this.traceModule, `User user culture loaded: ${userCulture}`);
            }
          });
        }

        this.getTranslations();
      },
      error: (err: any) => {
        this.traceService.warn(this.traceModule, 'No user culture from appContextService');
      }
    });
  }

  public getTranslations(): void {
    this.translateService.get([
      'VALIDATION-DIALOG.VALIDATION-CANCELLED'
    ]).pipe(first()).subscribe({
      next: (res: any) => {
        const validationCancelled: string = res['VALIDATION-DIALOG.VALIDATION-CANCELLED'];
        if (!isNullOrUndefined(this?.validationCancelledInfo)) {
          this.validationCancelledInfo.ValidationCancelled = validationCancelled;
        }
      },
      error: (error: any) => {
        this.traceService.error(this.traceModule, error);
      }
    });
  }

  public get DisableOKButton(): boolean {
    const textValue = this.textAreaElement?.nativeElement?.value || '';

    const isFourEyesEnabledButHasMissingFields: boolean = this.validateOpInfo.IsFourEyesEnabled && this.supervisorCredInfo.HasMissingFields;
    const isReauthenticationRequiredButHasMissingFields: boolean = this.validateOpInfo.IsReauthenticationRequired && this.userCredInfo.HasMissingFields;
    const hasEmptyWhiteSpace: boolean = (!isNullOrUndefined(this.textAreaElement) && this.regExWhiteSpace.test(textValue));

    return isFourEyesEnabledButHasMissingFields
      || isReauthenticationRequiredButHasMissingFields
      || hasEmptyWhiteSpace;
  }

  @HostListener('window:keydown.esc')
  public onEscKey(): void {
    this.cancelValidation();
  }

  @HostListener('window:keydown.enter')
  public onEnterKey(): void {
    this.handleSubmitValidation();
  }

  public cancelValidation(): void {
    const validationDialogResult: ValidationDialogResult = ValidationDialogResult.CANCEL;
    const validationResult: ValidationResult = new ValidationResult();
    const validationDialogResponse: ValidationDialogResponse =
      new ValidationDialogResponse(validationDialogResult, validationResult);
    this.closed.next(validationDialogResponse);
  }

  public handleSubmitValidation(): void {
    if (this.DisableOKButton) {
      return;
    }

    if (this?.validateOpInfo?.IsFourEyesEnabled && this?.supervisorCredInfo?.HasMissingFields === false
      && this?.passwordEncryptionService?.isCryptoApiAvailable) {
      this.passwordEncryptionService.getEncryptedPassword(this.supervisorCredInfo.Password).pipe(first()).subscribe({
        next: (result: EncryptedPasswordResponse) => {
          this.encryptedSupervisorPassword = result.EncryptedPassword;
          this.sessionKey = result.SessionKey;
          this.sendValidationDialogResult();
        },
        error: (error: any) => {
          this.traceService.error(this.traceModule, 'Cannot encrypt super password', error);
        }
      });
    } else {
      this.sendValidationDialogResult();
    }
  }

  public sendValidationDialogResult(): void {
    const comments: CommentsInput = { CommonText: this.comment, MultiLangText: undefined };
    const validationResult: ValidationResult = new ValidationResult(undefined, undefined,
      comments, this.userCredInfo.Password, this.supervisorCredInfo.UserName,
      this.supervisorCredInfo.Password);
    const validationDialogResult: ValidationDialogResponse = new ValidationDialogResponse(ValidationDialogResult.OK,
      validationResult, this.sessionKey, this.encryptedSupervisorPassword);
    this.closed.next(validationDialogResult);
  }

  public onTextAreaChange(event: any): void {
    this.comment = event.target.value;
    this.textAreaElement.nativeElement.value = this.comment;
  }

  public resetErrorMessages(): void {
    this.validateOpInfo.resetErrorStates();
  }

  public onSupervisorAuthInfoUpdate(credInfo: CredentialInfo): void {
    this.resetErrorMessages();
    this.supervisorCredInfo = credInfo;
  }

  public onUserAuthInfoUpdate(credInfo: CredentialInfo): void {
    this.resetErrorMessages();
    this.userCredInfo = credInfo;
  }
}
