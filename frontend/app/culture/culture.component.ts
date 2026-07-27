import {
  Component,
  Inject,
  OnInit
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { CommonService } from '@geonature_common/service/common.service';

import { CultureService } from './culture.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { ConfigService } from '../services/config.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import {
  DateAdapter
} from '@angular/material/core';

import {
  FrenchDateAdapter
} from '../services/french-date-adapter';

import {
  filter,
  take
} from 'rxjs/operators';

@Component({
  selector: 'app-culture',
  templateUrl: './culture.component.html',
  styleUrls: ['./culture.component.scss'],

  providers: [
    {
      provide: DateAdapter,
      useClass: FrenchDateAdapter
    }
  ]
})

export class CultureComponent implements OnInit {

  public cultureForm: FormGroup;

  public formSubmitted = false;

  public shakeCodeField = false;
  public shakeStartDateField = false;
  public shakeEndDateField = false;

  public observersListCode: any;

  public additionalDataForm!: FormGroup;
  public formsDefinition: any[] = [];

  public idMaterial: number | null = null;
  public codeMaterial: string | null = null;

  public associatedSowingCode: string | null = null;
  public associatedTestCode: string | null = null;

  private existingCultures: any[] = [];
  private initialFormState: any = null;
  private cancelDialogOpen = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CultureComponent>,
    private cultureService: CultureService,
    private exsituFormService: ExsituFormService,
    private cfg: ConfigService,
    private toast: CommonService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public modalData: any
  ) {
    
    this.cultureForm = this.fb.group(
      {
        code_culture: [
          '',
          [
            Validators.required,
            this.cultureSequenceValidator
          ]
        ],

        date_start: [null, Validators.required],
        date_end: [null],

        id_actor: [[]],

        remarks: [''],

        additional_data: this.fb.group({})
      },
      {
        validators: this.dateRangeValidator
      }
    );
  }

  private patchForm(data: any): void {
    if (!data) {
      return;
    }

    const formState = {
      code_culture: data.code_culture || '',

      date_start: data.date_start
        ? new Date(data.date_start)
        : null,

      date_end: data.date_end
        ? new Date(data.date_end)
        : null,

      id_actor: data.id_actor
        ? [{ id_role: data.id_actor }]
        : [],

      remarks: data.remarks || '',

      additional_data: {}
    };

    this.cultureForm.reset(formState);

    if (
      data.additional_data &&
      this.additionalDataForm
    ) {
      Object.keys(
        data.additional_data
      ).forEach((key) => {

        if (
          this.additionalDataForm.contains(key)
        ) {
          this.additionalDataForm
            .get(key)
            ?.patchValue(
              data.additional_data[key]
            );
        }
      });
    }

    this.cultureForm.markAsPristine();
    this.cultureForm.markAsUntouched();
  }

  private isDuplicateCultureCode(
    existingCultures: any[],
    currentCode: string
  ): boolean {

    const normalizedCode =
      (currentCode || '').trim();

    const currentCultureId =
      this.modalData?.edit
        ? this.modalData?.culture?.id_culture
        : null;

    return existingCultures.some(
      (culture: any) => {

        const existingCode =
          (culture?.code_culture || '').trim();

        const existingId =
          culture?.id_culture ?? null;

        return (
          existingCode === normalizedCode &&
          existingId !== currentCultureId
        );
      }
    );
  }


  private validateDuplicateCode(
    currentCode?: string
  ): void {

    const codeControl =
      this.cultureForm.get('code_culture');

    if (!codeControl) {
      return;
    }

    const normalizedCode =
      (
        currentCode ??
        codeControl.value ??
        ''
      ).trim();

    const currentErrors = {
      ...(codeControl.errors || {})
    };

    if (!normalizedCode) {
      delete currentErrors['duplicateCode'];

      codeControl.setErrors(
        Object.keys(currentErrors).length
          ? currentErrors
          : null
      );

      return;
    }

    const duplicate =
      this.isDuplicateCultureCode(
        this.existingCultures,
        normalizedCode
      );

    if (duplicate) {

      codeControl.setErrors({
        ...currentErrors,
        duplicateCode: true
      });

    } else {

      delete currentErrors['duplicateCode'];

      codeControl.setErrors(
        Object.keys(currentErrors).length
          ? currentErrors
          : null
      );
    }
  }

  private loadAssociatedMaterialCode(): void {

    if (!this.idMaterial) {
      return;
    }

    this.exsituFormService.materials$
      .pipe(
        filter(
          (materials) =>
            Array.isArray(materials)
        ),
        take(1)
      )
      .subscribe((materials) => {

        const material =
          materials.find(
            (item: any) =>
              item.id_material === this.idMaterial
          );

        this.codeMaterial =
          material?.code_material || null;

      });
  }

  ngOnInit(): void {
    this.idMaterial = this.exsituFormService.idMaterial;

    this.loadAssociatedMaterialCode();

    /*
    * En modification, on utilise les relations
    * réellement enregistrées dans la Culture.
    *
    * En création, on utilise le contexte depuis
    * lequel la partie Culture a été ouverte.
    */
    if (
      this.modalData?.edit &&
      this.modalData?.culture
    ) {

      this.associatedSowingCode =
        this.modalData.culture.code_sowing ||
        null;

      this.associatedTestCode =
        this.modalData.culture.code_test ||
        null;

    } else {

      this.associatedSowingCode =
        this.modalData?.code_sowing ||
        null;

      this.associatedTestCode =
        this.modalData?.code_test ||
        null;
    }

    if (this.idMaterial) {

    this.cultureService
      .getCulturesByMaterial(
        this.idMaterial
      )
      .subscribe({
        next: (cultures) => {

          this.existingCultures =
            cultures || [];

          this.validateDuplicateCode();
        },

        error: (err) => {

          console.error(
            'Erreur lors du chargement des cultures existantes :',
            err
          );

          this.existingCultures = [];
        }
      });
  }

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

    if (
      this.modalData?.edit &&
      this.modalData?.culture
    ) {
      this.patchForm(
        this.modalData.culture
      );
    }

    this.initialFormState =
      this.cultureForm.getRawValue();

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

    this.cultureForm
      .get('code_culture')
      ?.valueChanges
      .subscribe((value) => {

        this.validateDuplicateCode(value);
      });
  }

  cultureSequenceValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const value = control.value;

    if (!value || typeof value !== 'string') {
      return null;
    }

    const match = value.match(
      /^C\d{4}_(\d{4})$/
    );

    /*
    * Comme pour Semis :
    * si le code ne correspond pas au format standard,
    * on considère qu'il s'agit d'un code libre.
    */
    if (!match) {
      return null;
    }

    return match[1] === '0000'
      ? { cultureSequenceInvalid: true }
      : null;
  }

  dateRangeValidator(
    control: AbstractControl
  ): ValidationErrors | null {

    const codeControl = control.get('code_culture');
    const startDateControl = control.get('date_start');
    const endDateControl = control.get('date_end');

    const code = codeControl?.value;
    const startDate = startDateControl?.value;
    const endDate = endDateControl?.value;

    const errors: ValidationErrors = {};

    /*
    * Règle 1 :
    * Date de fin >= Date de transplantation
    */
    const hasDateRangeInvalid = !!(
      startDate &&
      endDate &&
      new Date(endDate).getTime() <
        new Date(startDate).getTime()
    );

    if (hasDateRangeInvalid) {
      errors['dateRangeInvalid'] = true;
    }

    /*
    * Règle 2 :
    * L'année de CAAAA_NNNN doit correspondre
    * à l'année de la date de transplantation.
    */
    let startYear: string | null = null;

    const codeMatch =
      typeof code === 'string'
        ? code.trim().match(
            /^C(\d{4})_(?!0000)\d{4}$/
          )
        : null;

    if (startDate) {
      const parsedDate = new Date(startDate);

      if (!isNaN(parsedDate.getTime())) {
        startYear =
          parsedDate.getFullYear().toString();
      }
    }

    const hasCodeYearMismatch = !!(
      codeMatch &&
      startYear &&
      codeMatch[1] !== startYear
    );

    /*
    * Erreur sur Date de transplantation
    */
    if (startDateControl) {
      const currentErrors = {
        ...(startDateControl.errors || {})
      };

      if (hasCodeYearMismatch) {
        currentErrors['codeYearMismatch'] = true;
      } else {
        delete currentErrors['codeYearMismatch'];
      }

      startDateControl.setErrors(
        Object.keys(currentErrors).length
          ? currentErrors
          : null
      );
    }

    /*
    * Erreur sur Numéro de Culture
    */
    if (codeControl) {
      const currentErrors = {
        ...(codeControl.errors || {})
      };

      if (hasCodeYearMismatch) {
        currentErrors['codeYearMismatch'] = true;
      } else {
        delete currentErrors['codeYearMismatch'];
      }

      codeControl.setErrors(
        Object.keys(currentErrors).length
          ? currentErrors
          : null
      );
    }

    /*
    * Erreur sur Date de fin
    */
    if (endDateControl) {
      const currentErrors = {
        ...(endDateControl.errors || {})
      };

      if (hasDateRangeInvalid) {
        currentErrors['dateRangeInvalid'] = true;
      } else {
        delete currentErrors['dateRangeInvalid'];
      }

      endDateControl.setErrors(
        Object.keys(currentErrors).length
          ? currentErrors
          : null
      );
    }

    return Object.keys(errors).length
      ? errors
      : null;
  }

  private formatFormData(): any {
    const raw = this.cultureForm.getRawValue();

    const payload: any = {
      ...raw
    };

    /*
    * Relations d'origine de la Culture.
    *
    * Cas actuel :
    * Culture ouverte depuis Matériel récolté
    * => id_sowing = null
    * => id_test = null
    */
    if (
      this.modalData?.edit &&
      this.modalData?.culture
    ) {

      payload.id_sowing =
        this.modalData.culture.id_sowing ??
        null;

      payload.id_test =
        this.modalData.culture.id_test ??
        null;

    } else {

      payload.id_sowing =
        this.modalData?.id_sowing ??
        null;

      payload.id_test =
        this.modalData?.id_test ??
        null;
    }

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

    } else if (!payload.date_end) {

      /*
      * Important en modification :
      * null signifie explicitement que l'utilisateur
      * souhaite supprimer la date de fin existante.
      */
      payload.date_end = null;

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

  private triggerCodeFieldShake(): void {
    this.shakeCodeField = false;

    setTimeout(() => {
      this.shakeCodeField = true;

      setTimeout(() => {
        this.shakeCodeField = false;
      }, 400);
    }, 0);
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
          .get('code_culture')
          ?.invalid
      ) {
        this.triggerCodeFieldShake();
      }

      if (
        this.cultureForm
          .get('code_culture')
          ?.hasError('codeYearMismatch') ||
        this.cultureForm
          .get('date_start')
          ?.hasError('codeYearMismatch')
      ) {
        this.triggerCodeFieldShake();
        this.triggerStartDateFieldShake();
      }

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
        message: this.modalData?.edit
          ? 'Étes vous certain de vouloir modifier cette fiche de culture ?'
          : 'Étes vous certain de vouloir enregistrer cette fiche de culture ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        const payload = this.formatFormData();

        if (
          this.modalData?.edit &&
          this.modalData?.culture?.id_culture
        ) {

          // MODE MODIFICATION
          this.cultureService
            .updateCulture(
              this.idMaterial!,
              this.modalData.culture.id_culture,
              payload
            )
            .subscribe({
              next: (response) => {
                const cultureCode =
                  payload.code_culture;

                this.toast.translateToaster(
                  'success',
                  cultureCode
                    ? `Culture ${cultureCode} mise à jour avec succès`
                    : 'Culture mise à jour avec succès'
                );

                this.dialogRef.close(
                  response?.culture || response
                );
              },

              error: (error) => {
                console.error(
                  'Erreur lors de la modification de la culture :',
                  error
                );

                this.toast.translateToaster(
                  'error',
                  error?.error?.error ||
                    'Erreur lors de la modification de la culture'
                );
              }
            });

        } else {

          // MODE AJOUT
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
        }
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

  onBack(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;

    const idMaterial =
      this.idMaterial ||
      this.exsituFormService.idMaterial;


    /*
    * On récupère l'origine réelle de la Culture.
    *
    * En modification :
    * données enregistrées dans la Culture.
    *
    * En création :
    * contexte transmis depuis la liste Culture.
    */
    const idSowing =
      this.modalData?.culture?.id_sowing ??
      this.modalData?.id_sowing ??
      this.exsituFormService
        .cultureSourceSowingId ??
      null;


    const idTest =
      this.modalData?.culture?.id_test ??
      this.modalData?.id_test ??
      this.exsituFormService
        .cultureSourceTestId ??
      null;


    if (!idHarvest) {

      console.error(
        'Impossible de revenir en arrière : idHarvest manquant.'
      );

      return;
    }


    /*
    * On ferme d'abord la fiche Culture.
    */
    this.dialogRef.close();


    /*
    * Culture provenant d'un Semis
    *
    * A1 | S1 | NULL
    *
    * => retour à Semis
    */
    if (
      idSowing &&
      idMaterial
    ) {

      this.router.navigate([

        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/semis-table`

      ]);

      return;
    }


    /*
    * Culture provenant d'un Test
    * de germination
    *
    * A1 | NULL | T1
    *
    * => retour à Test de germination
    */
    if (
      idTest &&
      idMaterial
    ) {

      this.router.navigate([

        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/germination-table`

      ]);

      return;
    }


    /*
    * Culture provenant directement
    * du matériel récolté
    *
    * A1 | NULL | NULL
    *
    * => retour à Matériel récolté
    */
    this.router.navigate([

      `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material-form`

    ]);

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