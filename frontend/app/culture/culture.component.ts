import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { MatDialogRef } from '@angular/material/dialog';

import { CommonService } from '@geonature_common/service/common.service';

import { CultureService } from './culture.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { ConfigService } from '../services/config.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-culture',
  templateUrl: './culture.component.html',
  styleUrls: ['./culture.component.scss']
})
export class CultureComponent implements OnInit {

  public cultureForm: FormGroup;

  public formSubmitted = false;

  public shakeStartDateField = false;
  public shakeEndDateField = false;

  public observersListCode: any;

  public additionalDataForm!: FormGroup;
  public formsDefinition: any[] = [];

  public idMaterial: number | null = null;

  private initialFormState: any = null;
  private cancelDialogOpen = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CultureComponent>,
    private cultureService: CultureService,
    private exsituFormService: ExsituFormService,
    private cfg: ConfigService,
    private toast: CommonService,
    private dialogService: DialogService
  ) {
    this.cultureForm = this.fb.group(
      {
        date_start: [null, Validators.required],
        date_end: [null],

        id_actor: [[], Validators.required],

        remarks: [''],

        additional_data: this.fb.group({})
      },
      {
        validators: this.dateRangeValidator
      }
    );
  }

  ngOnInit(): void {
    this.idMaterial = this.exsituFormService.idMaterial;

    this.observersListCode = this.cfg.getObsCode();

    this.additionalDataForm = this.cultureForm.get(
      'additional_data'
    ) as FormGroup;

    this.formsDefinition =
      this.cfg.getModuleConfigExsitu()?.['culture_form']
        ?.['additional_data'] ?? [];

    this.formsDefinition.forEach((field) => {
      const fieldName = field.attribut_name;

      if (
        fieldName &&
        !this.additionalDataForm.contains(fieldName)
      ) {
        this.additionalDataForm.addControl(
          fieldName,
          this.fb.control('')
        );
      }
    });

    this.initialFormState = this.cultureForm.getRawValue();

    this.dialogRef.backdropClick().subscribe(() => {
      this.onCancel();
    });

    this.dialogRef
      .keydownEvents()
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.onCancel();
        }
      });
  }

  dateRangeValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const startDate = control.get('date_start')?.value;
    const endDateControl = control.get('date_end');
    const endDate = endDateControl?.value;

    const currentErrors = {
      ...(endDateControl?.errors || {})
    };

    if (
      startDate &&
      endDate &&
      new Date(endDate).getTime() <
        new Date(startDate).getTime()
    ) {
      currentErrors['dateRangeInvalid'] = true;

      endDateControl?.setErrors(currentErrors);

      return {
        dateRangeInvalid: true
      };
    }

    delete currentErrors['dateRangeInvalid'];

    endDateControl?.setErrors(
      Object.keys(currentErrors).length
        ? currentErrors
        : null
    );

    return null;
  }

  private formatFormData(): any {
    const raw = this.cultureForm.getRawValue();

    const payload: any = {
      ...raw
    };

    if (
      Array.isArray(raw.id_actor) &&
      raw.id_actor.length > 0
    ) {
      payload.id_actor =
        raw.id_actor[0]?.id_role ?? null;
    } else {
      payload.id_actor = null;
    }

    if (
      payload.date_start instanceof Date &&
      !isNaN(payload.date_start.getTime())
    ) {
      payload.date_start =
        payload.date_start.toISOString();
    }

    if (
      payload.date_end instanceof Date &&
      !isNaN(payload.date_end.getTime())
    ) {
      payload.date_end =
        payload.date_end.toISOString();
    }

    if (!payload.date_end) {
      delete payload.date_end;
    }

    const additionalData =
      payload.additional_data || {};

    const cleanedAdditionalData: any = {};

    Object.keys(additionalData).forEach((key) => {
      const value = additionalData[key];

      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        cleanedAdditionalData[key] = value;
      }
    });

    payload.additional_data =
      cleanedAdditionalData;

    return payload;
  }

  private triggerStartDateFieldShake(): void {
    this.shakeStartDateField = false;

    setTimeout(() => {
      this.shakeStartDateField = true;

      setTimeout(() => {
        this.shakeStartDateField = false;
      }, 400);
    }, 0);
  }

  private triggerEndDateFieldShake(): void {
    this.shakeEndDateField = false;

    setTimeout(() => {
      this.shakeEndDateField = true;

      setTimeout(() => {
        this.shakeEndDateField = false;
      }, 400);
    }, 0);
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.cultureForm.invalid) {
      this.cultureForm.markAllAsTouched();

      if (
        this.cultureForm
          .get('date_start')
          ?.hasError('required')
      ) {
        this.triggerStartDateFieldShake();
      }

      if (
        this.cultureForm
          .get('date_end')
          ?.hasError('dateRangeInvalid')
      ) {
        this.triggerEndDateFieldShake();
      }

      return;
    }

    if (!this.idMaterial) {
      console.error(
        'Impossible de créer la culture : idMaterial manquant.'
      );
      return;
    }

    this.dialogService
      .confirmDialog({
        message:
          'Étes vous certain de vouloir enregistrer cette fiche de culture ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        const payload = this.formatFormData();

        this.cultureService
          .addCulture(
            this.idMaterial!,
            payload
          )
          .subscribe({
            next: (response) => {
              const cultureCode =
                response?.culture?.code_culture;

              this.toast.translateToaster(
                'success',
                cultureCode
                  ? `Culture ${cultureCode} créée avec succès`
                  : 'Culture créée avec succès'
              );

              this.dialogRef.close(
                response?.culture || response
              );
            },

            error: (error) => {
              console.error(
                'Erreur lors de la création de la culture :',
                error
              );

              this.toast.translateToaster(
                'error',
                error?.error?.error ||
                  'Erreur lors de la création de la culture'
              );
            }
          });
      });
  }

  onReset(): void {
    this.dialogService
      .confirmDialog({
        message:
          'Étes vous certain de vouloir réinitialiser cette fiche de culture ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.cultureForm.reset(
          this.initialFormState
        );

        this.cultureForm.markAsPristine();
        this.cultureForm.markAsUntouched();
        this.cultureForm.updateValueAndValidity();

        this.formSubmitted = false;
      });
  }

  onCancel(): void {
    if (this.cancelDialogOpen) {
      return;
    }

    this.cancelDialogOpen = true;

    this.dialogService
      .confirmDialog({
        message:
          'Étes vous certain de vouloir annuler ?'
      })
      .subscribe((yes) => {
        this.cancelDialogOpen = false;

        if (!yes) {
          return;
        }

        this.toast.translateToaster(
          'info',
          'Création de la culture annulée'
        );

        this.dialogRef.close();
      });
  }
}