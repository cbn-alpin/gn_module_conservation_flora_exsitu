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

  public associatedSowingCode:
    string | null = null;

  public associatedTestCode:
    string | null = null;

  public availableSowings: any[] = [];
  public availableTests: any[] = [];

  public selectedSowingId:
    number | null = null;

  public selectedTestId:
    number | null = null;

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

  public get showSourceSelectors(): boolean {

    return !!(
      !this.modalData?.edit &&
      !this.modalData?.id_sowing &&
      !this.modalData?.id_test
    );
  }


  private loadAvailableSources(): void {

    if (
      !this.idMaterial ||
      !this.showSourceSelectors
    ) {
      return;
    }


    this.cultureService
      .getSowingsByMaterial(
        this.idMaterial
      )
      .subscribe({

        next: (sowings) => {

          this.availableSowings =
            sowings || [];
        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement des semis associés :',
            error
          );

          this.availableSowings = [];
        }

      });


    this.cultureService
      .getTestsByMaterial(
        this.idMaterial
      )
      .subscribe({

        next: (tests) => {

          this.availableTests =
            (tests || []).filter(
              test =>
                String(
                  test?.test_type_code ||
                  ''
                )
                  .trim()
                  .toLowerCase() ===
                'ger'
            );
        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement des tests de germination associés :',
            error
          );

          this.availableTests = [];
        }

      });
  }


  public onSowingSelectionChange(
    idSowing: number | null
  ): void {

    this.selectedSowingId =
      idSowing ?? null;

    /*
     * Un Semis sélectionné exclut
     * automatiquement le Test.
     */
    if (this.selectedSowingId) {
      this.selectedTestId = null;
    }
  }


  public onTestSelectionChange(
    idTest: number | null
  ): void {

    this.selectedTestId =
      idTest ?? null;

    /*
     * Un Test sélectionné exclut
     * automatiquement le Semis.
     */
    if (this.selectedTestId) {
      this.selectedSowingId = null;
    }
  }

  ngOnInit(): void {
    this.idMaterial = this.exsituFormService.idMaterial;

    this.loadAssociatedMaterialCode();
    this.loadAvailableSources();

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

    } else if (
      this.modalData?.id_sowing ||
      this.modalData?.id_test
    ) {

      /*
       * Création ouverte depuis le bouton
       * Culture d'un Semis ou d'un Test.
       */
      payload.id_sowing =
        this.modalData?.id_sowing ??
        null;

      payload.id_test =
        this.modalData?.id_test ??
        null;

    } else {

      /*
       * Création directe depuis
       * le matériel récolté.
       */
      payload.id_sowing =
        this.selectedSowingId;

      payload.id_test =
        this.selectedTestId;
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

    const currentCode =
      this.cultureForm.get('code_culture')?.value
      || '';

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-save',
        entityLabel: this.modalData?.edit
          ? 'les modifications de la culture'
          : 'la culture',
        entityCode: currentCode || undefined,
        disableClose: false
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
                    ? `Culture ${this.toBoldText(String(cultureCode))} mise à jour avec succès`
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
                    ? `Culture ${this.toBoldText(String(cultureCode))} créée avec succès`
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
        message: '',
        icon: 'local_florist',
        variant: 'culture-reset',
        entityLabel: this.modalData?.edit
          ? 'les modifications de cette culture'
          : 'cette fiche de culture',
        disableClose: false
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

        if (this.showSourceSelectors) {
          this.selectedSowingId = null;
          this.selectedTestId = null;
        }

        this.formSubmitted = false;
      });
  }

  private toBoldText(value: string): string {
    const boldItalicChars: Record<string, string> = {
      A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
      K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
      U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
      a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
      k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
      u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
      0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
    };

    return value.replace(/[A-Za-z0-9]/g, (char) => boldItalicChars[char] || char);
  }

  onCancel(): void {
    if (this.cancelDialogOpen) {
      return;
    }

    this.cancelDialogOpen = true;

    const currentCode =
      this.cultureForm.get('code_culture')?.value ||
      this.initialFormState?.code_culture ||
      '';

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-exit',
        entityLabel: currentCode
          ? 'la culture'
          : 'cette fiche de culture',
        entityCode: currentCode || undefined,
        disableClose: false
      })
      .subscribe((yes) => {
        this.cancelDialogOpen = false;

        if (!yes) {
          return;
        }

        if (this.modalData?.edit) {
          this.toast.translateToaster(
            'info',
            currentCode
              ? `Culture ${this.toBoldText(currentCode)} non modifiée`
              : 'Culture non modifiée'
          );
        } else if (currentCode) {
          this.toast.translateToaster(
            'info',
            `Culture ${this.toBoldText(currentCode)} non créée`
          );
        } else {
          this.toast.translateToaster(
            'info',
            'Création de la culture annulée'
          );
        }

        this.dialogRef.close();
      });
  }
}