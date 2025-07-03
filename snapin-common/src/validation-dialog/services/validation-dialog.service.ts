import { Injectable, OnDestroy } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { ValidationMenuComponent } from '../validation-menu/validation-menu.component';
import { catchError, firstValueFrom, of, Subject, Subscription } from 'rxjs';
import { ValidationCancelledInfo } from "../utilities/validation-cancelled.info";
import {
  EncryptedPasswordResponse, PasswordEncryptionService,
  ValidateOpInfo,
  ValidateOpResponse,
  ValidationCommandInfo,
  ValidationCommandOpRepresentation,
  ValidationCredentialRepresentation,
  ValidationDialogResponse,
  ValidationDialogResult,
  ValidationEditInfo,
  ValidationEditOpRepresentation,
  ValidationHelperService,
  ValidationResponseErrors,
  ValidationResult,
  ValidationResultStatus
} from '@gms-flex/services';
import { AppContextService, isNullOrUndefined } from '@gms-flex/services-common';
import { first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ValidationDialogService implements OnDestroy {
  public closed: Subject<ValidationDialogResponse> = new Subject<ValidationDialogResponse>();
  public onDialogUpdate: Subject<ValidationResult> = new Subject<ValidationResult>();
  public validationCancelledInfo: ValidationCancelledInfo = new ValidationCancelledInfo();
  public objectIdList: string[] = [];
  public initialState: any = {
    closed: this.closed,
    validateOpResponse: undefined,
    validateOpInfo: undefined,
    validationCancelledInfo: this.validationCancelledInfo
  };
  public subscriptions: Subscription[] = [];
  public modalRef: BsModalRef;
  public readonly traceModule = 'gmsSnapins_ValidationDialog';

  constructor(private readonly customizationModalService: BsModalService,
    private readonly validationHelperService: ValidationHelperService,
    private readonly appContextService: AppContextService,
    private readonly passwordEncryptionService: PasswordEncryptionService) {
    this.subscriptions.push(this.closed.subscribe((validationDialogResponse: ValidationDialogResponse) => {
      if (validationDialogResponse.ValidationDialogResult === ValidationDialogResult.OK) {
        this.handleSubmit(validationDialogResponse);
      } else if (validationDialogResponse.ValidationDialogResult === ValidationDialogResult.CANCEL) {
        this.handleCancel();
      }
    }));
  }

  public processValidationCommandObject(validationCommandInfo: ValidationCommandInfo): void {
    const validationCommandOpRepresentation: ValidationCommandOpRepresentation = {
      propertyIds: validationCommandInfo.PropertyIds,
      cmdGroup: validationCommandInfo.CmdGroup
    };

    this.subscriptions.push(
      this.validationHelperService.getCommandValidationOperation(validationCommandOpRepresentation)
        .subscribe((validateOpResponse: ValidateOpResponse) => {
          this.initialState.validateOpInfo = new ValidateOpInfo(validateOpResponse);
          this.objectIdList = validationCommandInfo.PropertyIds;
          if (!isNullOrUndefined(validateOpResponse)) {
            if (this?.initialState?.validateOpInfo?.IsModalRequired === false) {
              const validationResult: ValidationResult = new ValidationResult(ValidationResultStatus.Success);
              this.handleDialogSuccess(validationResult);
            } else {
              this.showModal();
            }
          }
        })
    );
  }

  public processValidationEditObject(validationEditInfo: ValidationEditInfo): void {
    const validationEditOpRepresentation: ValidationEditOpRepresentation = {
      ObjectIds: validationEditInfo.ObjectIds
    };

    this.objectIdList = validationEditInfo.ObjectIds;

    this.subscriptions.push(
      this.validationHelperService.getEditValidationOperation(validationEditOpRepresentation)
        .subscribe((validateOpResponse: ValidateOpResponse) => {
          this.initialState.validateOpInfo = new ValidateOpInfo(validateOpResponse);
          if (!isNullOrUndefined(validateOpResponse)) {
            if (this?.initialState?.validateOpInfo?.IsModalRequired === false) {
              const validationResult: ValidationResult = new ValidationResult(ValidationResultStatus.Success);
              this.handleDialogSuccess(validationResult);
            } else {
              this.showModal();
            }
          }
        })
    );
  }

  public show(validationInfo: ValidationEditInfo | ValidationCommandInfo): Subject<ValidationResult> {
    if (validationInfo instanceof ValidationCommandInfo) {
      this.processValidationCommandObject(validationInfo);
    } else if (validationInfo instanceof ValidationEditInfo) {
      this.processValidationEditObject(validationInfo);
    } else {
      this.handleDialogError();
    }

    return this.onDialogUpdate;
  }

  public get ValidationCancelled(): string {
    return this?.validationCancelledInfo?.ValidationCancelled;
  }

  public showModal(): void {
    const modalOptions: ModalOptions = {
      ignoreBackdropClick: true,
      keyboard: true,
      animated: true,
      initialState: this.initialState
    };

    this.modalRef = this.customizationModalService.show(ValidationMenuComponent, modalOptions);
  }

  public handleDialogError(error?: string): void {
    const validationResult: ValidationResult = new ValidationResult(ValidationResultStatus.Error, error);
    this.onDialogUpdate.next(validationResult);
    this.modalRef?.hide();
  }

  public handleDialogSuccess(validationResult: ValidationResult): void {
    validationResult.Status = ValidationResultStatus.Success;
    this.onDialogUpdate.next(validationResult);
    this.modalRef?.hide();
  }

  public IsUndefinedValidationResult(validationResult: ValidationResult): boolean {
    return isNullOrUndefined(validationResult?.Password)
      && isNullOrUndefined(validationResult?.SuperName)
      && isNullOrUndefined(validationResult?.SuperPassword);
  }

  public async handleSubmit(validationDialogResponse: ValidationDialogResponse): Promise<void> {
    const validationResult: ValidationResult = validationDialogResponse.Result;
    if (this.IsUndefinedValidationResult(validationResult)) {
      this.handleDialogSuccess(validationResult);
    } else {
      const validationCredentialRepresentation: ValidationCredentialRepresentation = {
        CheckCredentials: this.initialState?.validateOpInfo?.CredentialType,
        Password: validationResult.Password,
        SuperName: validationResult.SuperName,
        SuperPassword: validationResult.SuperPassword,
        ObjectIds: this.objectIdList,
        SessionKey: validationDialogResponse.SessionKey
      };

      if (!isNullOrUndefined(validationCredentialRepresentation?.SessionKey)) {
        validationCredentialRepresentation.SuperPassword = validationDialogResponse.EncryptedSupervisorPassword;
      }

      const userName: string = this?.appContextService?.userNameValue;
      const superName: string = this.initialState?.validateOpInfo?.IsFourEyesEnabled ? validationResult?.SuperName : undefined;
      if (!isNullOrUndefined(superName)) {
        if (!isNullOrUndefined(userName)) {
          const lowerUserName: string = userName.toLowerCase();
          const lowerSuperName: string = superName.toLowerCase();
          if (lowerUserName === lowerSuperName) {
            this.initialState.validateOpInfo.setSameUserAndSuperName();
            return;
          }
        }
      }

      const canAccountsUseValidation: boolean = await firstValueFrom(this.validationHelperService.canAccountsUseValidation(userName, superName)
        .pipe(map((canUseValidationMap: Map<string, boolean>): boolean => {
          let canUseValidation = true;
          for (const [key, value] of canUseValidationMap) {
            canUseValidation = value && canUseValidation;
          }

          const canOperatorValidate: boolean = canUseValidationMap?.get(userName);
          const canSuperUserValidate: boolean = canUseValidationMap?.get(superName);
          if (canOperatorValidate === false) {
            this?.initialState?.validateOpInfo?.setInvalidOperatorState();
          } else if (canSuperUserValidate === false) {
            this?.initialState?.validateOpInfo?.setInvalidSupervisorState();
          }

          return canUseValidation;
        }),
        catchError(() => of(false))
        ));

      if (!canAccountsUseValidation) {
        return;
      }

      this.validateCredential(validationCredentialRepresentation, validationResult);
    }
  }

  public handleValidationResult(oldValidationResult: ValidationResult): void {
    if (this.passwordEncryptionService.isCryptoApiAvailable && !isNullOrUndefined(oldValidationResult.SuperPassword)) {
      this.passwordEncryptionService.getEncryptedPassword(oldValidationResult.SuperPassword).pipe(first()).subscribe({
        next: (result: EncryptedPasswordResponse) => {
          const validationResult: ValidationResult = new ValidationResult(ValidationResultStatus.Success, oldValidationResult.Error,
            oldValidationResult.Comments, oldValidationResult.Password, oldValidationResult.SuperName, result.EncryptedPassword, result.SessionKey);
          this.handleDialogSuccess(validationResult);
        }
      });
    } else {
      this.handleDialogSuccess(oldValidationResult);
    }
  }

  public validateCredential(validationCredentialRepresentation: ValidationCredentialRepresentation, oldValidationResult: ValidationResult): void {
    this.subscriptions.push(
      this.validationHelperService.validateCredential(validationCredentialRepresentation).subscribe({
        next: (): void => {
          this.handleValidationResult(oldValidationResult);
        },
        error: (error: any): void => {
          const id: number = error?.error?.Id;
          switch (id) {
            case ValidationResponseErrors.CREDENTIALS_FAILED:
              this.initialState.validateOpInfo.AuthenticationFailed = true;
              break;
            case ValidationResponseErrors.SUPERVISOR_CANNOT_VALIDATE_SELECTION:
              this.initialState.validateOpInfo.SupervisorCannotValidateSelection = true;
              break;
            default:
              break;
          }
        }
      })
    );
  }

  public handleCancel(): void {
    const validationResult: ValidationResult = new ValidationResult(ValidationResultStatus.Cancelled);
    this.onDialogUpdate.next(validationResult);
    this.modalRef?.hide();
  }

  public ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}
