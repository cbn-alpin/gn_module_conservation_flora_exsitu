import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '@geonature_common/service/common.service';
import { Observable } from 'rxjs';

import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CultureService } from '../culture/culture.service';
import { ConfigService } from '../services/config.service';
import { DataService } from '../services/data.service';
import { FrenchDateAdapter } from '../services/french-date-adapter';

interface CultureActionDialogData {
  idCulture: number;
  codeCulture?: string | null;
  cultureDateStart?: string | null;
  cultureHasSource?: boolean;
  isFirstCultureAction?: boolean;
  isInitialCultureAction?: boolean;
  idAction?: number | null;
  edit?: boolean;
  action?: any;
}

@Component({
  selector: 'app-culture-action',
  templateUrl: './culture-action.component.html',
  styleUrls: ['./culture-action.component.scss'],
  providers: [{ provide: DateAdapter, useClass: FrenchDateAdapter }]
})
export class CultureActionComponent implements OnInit {
  public cultureActionForm: FormGroup;
  public observersListCode: any;
  public cultureActionTypeOptions: any[] = [];

  public transplantationTypeOptions: any[] = [];
  public physiologicalStageOptions: any[] = [];
  public phenologicalStageOptions: any[] = [];
  public mainLocationOptions: any[] = [];
  public isSubmitting = false;
  public formSubmitted = false;
  public shakeActionStartDateField = false;
  public shakeActionEndDateField = false;
  public shakeTransplantationTypeField = false;

  private cancelDialogOpen = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CultureActionComponent>,
    private cultureService: CultureService,
    private dataService: DataService,
    private cfg: ConfigService,
    private dialogService: DialogService,
    private toast: CommonService,
    @Inject(MAT_DIALOG_DATA) public dialogData: CultureActionDialogData
  ) {
    this.cultureActionForm = this.fb.group(
      {
        id_action_type: [
          null,
          Validators.required
        ],

        date_start: [
          null,
          Validators.required
        ],

        date_end: [null],
        id_actor: [[]],
        id_type: [null],
        intervention_quantity: [null, Validators.min(1)],
        in_progress_quantity: [null, Validators.min(0)],
        packaging: ['', Validators.maxLength(100)],
        substrat: this.fb.array([]),
        id_physiological_development_stage: [null],
        id_main_location: [null],
        precise_location: ['', Validators.maxLength(100)],
        individual_count: [null],
        id_phenological_stage: [null],
        disease_or_deficiency: ['', Validators.maxLength(50)],
        treatment_type: ['', Validators.maxLength(50)],
        success: [null],
        quantity: [null],
        remarks: ['']
      },
      { validators: [this.dateRangeValidator] }
    );
  }

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    this.observersListCode = this.cfg.getObsCode();
    this.configureInitialCultureActionRules();
    this.loadNomenclatures();

    this.cultureActionForm
      .get('id_action_type')
      ?.valueChanges
      .subscribe(() => {
        if (!this.dialogData?.edit) {
          this.resetSpecificActionFields();
        }
      });

    this.cultureActionForm.get('id_type')?.valueChanges.subscribe(() => {
      if (!this.showPackagingField) {
        this.cultureActionForm.get('packaging')?.setValue('', { emitEvent: false });
      }
    });

    this.dialogRef.backdropClick().subscribe(() => this.onCancel());
    this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.onCancel();
      }
    });
  }

  get substrates(): FormArray {
    return this.cultureActionForm.get('substrat') as FormArray;
  }

  private getSelectedCultureActionCode(): string {

    const selectedId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions.find(
        option =>
          Number(
            option?.id_nomenclature
          ) === selectedId
      );


    return String(
      selectedActionType
        ?.cd_nomenclature ||
      ''
    )
      .trim()
      .toLowerCase();
  }


  get showTransplantationForm(): boolean {
    return (
      this.getSelectedCultureActionCode() ===
      'transp'
    );
  }


  get showObservationForm(): boolean {
    return (
      this.getSelectedCultureActionCode() ===
      'obs'
    );
  }


  get showCultureTreatmentForm(): boolean {
    return (
      this.getSelectedCultureActionCode() ===
      'tracult'
    );
  }


  get showSamplingForm(): boolean {
    return (
      this.getSelectedCultureActionCode() ===
      'prel'
    );
  }


  get isInitialCultureActionContext(): boolean {
    return !!(
      this.dialogData?.isFirstCultureAction ||
      this.dialogData?.isInitialCultureAction
    );
  }


  private configureInitialCultureActionRules(): void {

    const dateStartControl =
      this.cultureActionForm
        .get('date_start');

    const transplantationTypeControl =
      this.cultureActionForm
        .get('id_type');


    if (this.isInitialCultureActionContext) {

      transplantationTypeControl
        ?.setValidators(
          Validators.required
        );

      dateStartControl
        ?.setValue(
          this.parseDateForForm(
            this.dialogData
              ?.cultureDateStart
          ),
          {
            emitEvent: false
          }
        );

      dateStartControl
        ?.disable({
          emitEvent: false
        });

    } else {

      transplantationTypeControl
        ?.clearValidators();

      dateStartControl
        ?.enable({
          emitEvent: false
        });
    }


    transplantationTypeControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }


  private applyInitialCultureActionDefaults(): void {

    if (
      !this.dialogData?.isFirstCultureAction ||
      this.dialogData?.edit
    ) {
      return;
    }


    const transplantationActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            String(
              option?.cd_nomenclature ||
              ''
            )
              .trim()
              .toLowerCase() ===
            'transp'
        );


    this.cultureActionForm.patchValue({
      id_action_type:
        transplantationActionType
          ?.id_nomenclature ||
        null,

      date_start:
        this.parseDateForForm(
          this.dialogData
            ?.cultureDateStart
        )
    }, {
      emitEvent: false
    });
  }


  private resetSpecificActionFields(): void {

    this.substrates.clear();


    this.cultureActionForm.patchValue({
      id_type: null,
      intervention_quantity: null,
      in_progress_quantity: null,
      packaging: '',
      id_physiological_development_stage: null,
      id_main_location: null,
      precise_location: '',
      individual_count: null,
      id_phenological_stage: null,
      disease_or_deficiency: '',
      treatment_type: '',
      success: null,
      quantity: null,
      remarks: ''
    }, {
      emitEvent: false
    });
  }


  get showPackagingField(): boolean {
    const selectedId = Number(this.cultureActionForm.get('id_type')?.value);
    const selected = this.transplantationTypeOptions.find(
      option => Number(option?.id_nomenclature) === selectedId
    );
    const code = String(selected?.cd_nomenclature || '').trim().toLowerCase();
    return code === 'repiq' || code === 'remp';
  }

  get substratePercentageTotal(): number {
    return this.substrates.controls.reduce((total, control) => {
      const value = Number(control.get('percentage')?.value);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  addSubstrate(): void {
    this.substrates.push(
      this.fb.group({
        type: [''],
        category: [null],
        percentage: [null, [Validators.min(0), Validators.max(100)]]
      })
    );
    this.cultureActionForm.markAsDirty();
  }

  removeSubstrate(index: number): void {
    this.substrates.removeAt(index);
    this.cultureActionForm.markAsDirty();
  }

  onReset(): void {
    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-reset',
        entityLabel:
          this.dialogData?.edit
            ? 'les modifications de cette action de culture'
            : 'cette action de culture',
        disableClose: false
      })
      .subscribe(yes => {

        if (!yes) {
          return;
        }


        if (
          this.dialogData?.edit &&
          this.dialogData?.action
        ) {

          this.populateEditForm(
            this.dialogData.action
          );


          return;
        }


        this.substrates.clear();


        this.cultureActionForm.reset({
          id_action_type: null,
          date_start: null,
          date_end: null,
          id_actor: [],
          id_type: null,
          intervention_quantity: null,
          in_progress_quantity: null,
          packaging: '',
          id_physiological_development_stage: null,
          id_main_location: null,
          precise_location: '',
          individual_count: null,
          id_phenological_stage: null,
          disease_or_deficiency: '',
          treatment_type: '',
          success: null,
          quantity: null,
          remarks: ''
        });


        this.applyInitialCultureActionDefaults();


        this.formSubmitted =
          false;


        this.cultureActionForm
          .markAsPristine();

        this.cultureActionForm
          .markAsUntouched();

      });
  }


  private toBoldItalicText(
    value: string
  ): string {

    const boldItalicChars:
      Record<string, string> = {

      A: '𝑨', B: '𝑩', C: '𝑪',
      D: '𝑫', E: '𝑬', F: '𝑭',
      G: '𝑮', H: '𝑯', I: '𝑰',
      J: '𝑱', K: '𝑲', L: '𝑳',
      M: '𝑴', N: '𝑵', O: '𝑶',
      P: '𝑷', Q: '𝑸', R: '𝑹',
      S: '𝑺', T: '𝑻', U: '𝑼',
      V: '𝑽', W: '𝑾', X: '𝑿',
      Y: '𝒀', Z: '𝒁',

      a: '𝒂', b: '𝒃', c: '𝒄',
      d: '𝒅', e: '𝒆', f: '𝒇',
      g: '𝒈', h: '𝒉', i: '𝒊',
      j: '𝒋', k: '𝒌', l: '𝒍',
      m: '𝒎', n: '𝒏', o: '𝒐',
      p: '𝒑', q: '𝒒', r: '𝒓',
      s: '𝒔', t: '𝒕', u: '𝒖',
      v: '𝒗', w: '𝒘', x: '𝒙',
      y: '𝒚', z: '𝒛',

      0: '𝟎', 1: '𝟏', 2: '𝟐',
      3: '𝟑', 4: '𝟒', 5: '𝟓',
      6: '𝟔', 7: '𝟕', 8: '𝟖',
      9: '𝟗'
    };


    return value.replace(
      /[A-Za-z0-9]/g,
      char =>
        boldItalicChars[char] ||
        char
    );
  }


  private formatDateForToaster(
    value: any
  ): string {

    const formattedDate =
      this.formatDateForApi(
        value
      );


    if (!formattedDate) {
      return '-';
    }


    const [
      year,
      month,
      day
    ] =
      formattedDate.split('-');


    return `${day}/${month}/${year}`;
  }


  private showCultureActionSuccessToaster(
    isEdit: boolean
  ): void {

    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    const actionLabel =
      [
        this.dialogData?.codeCulture || '',
        actionTypeLabel
      ]
        .filter(Boolean)
        .join(' - ');


    const dateStart =
      this.formatDateForToaster(
        this.cultureActionForm
          .get('date_start')
          ?.value
      );


    this.toast
      .translateToaster(
        isEdit
          ? 'info'
          : 'success',
        `Action ${
          this.toBoldItalicText(
            actionLabel
          )
        } ${
          isEdit
            ? 'mise à jour'
            : 'créée'
        } avec succès.\nDate de début : ${
          this.toBoldItalicText(
            dateStart
          )
        }`
      );
  }


  private triggerActionStartDateFieldShake(): void {
    this.shakeActionStartDateField = false;

    setTimeout(() => {
      this.shakeActionStartDateField = true;

      setTimeout(() => {
        this.shakeActionStartDateField = false;
      }, 400);
    }, 0);
  }


  private triggerActionEndDateFieldShake(): void {
    this.shakeActionEndDateField = false;

    setTimeout(() => {
      this.shakeActionEndDateField = true;

      setTimeout(() => {
        this.shakeActionEndDateField = false;
      }, 400);
    }, 0);
  }


  private triggerTransplantationTypeFieldShake(): void {
    this.shakeTransplantationTypeField = false;

    setTimeout(() => {
      this.shakeTransplantationTypeField = true;

      setTimeout(() => {
        this.shakeTransplantationTypeField = false;
      }, 400);
    }, 0);
  }


  public hasTransplantationTypeRequiredError(): boolean {
    return !!(
      this.formSubmitted &&
      this.isInitialCultureActionContext &&
      this.cultureActionForm
        .get('id_type')
        ?.hasError('required')
    );
  }


  public hasCultureActionStartDateRequiredError(): boolean {
    return !!(
      this.formSubmitted &&
      this.cultureActionForm
        .get('date_start')
        ?.hasError('required')
    );
  }


  public hasCultureActionEndDateRangeError(): boolean {
    return !!(
      this.formSubmitted &&
      this.cultureActionForm
        .get('date_end')
        ?.hasError('dateEndBeforeStart')
    );
  }


  public refreshCultureActionDateRangeError(): void {
    const dateStartControl =
      this.cultureActionForm
        .get('date_start');

    const dateEndControl =
      this.cultureActionForm
        .get('date_end');


    if (!dateEndControl) {
      return;
    }


    const currentErrors = {
      ...(dateEndControl.errors || {})
    };

    delete currentErrors[
      'dateEndBeforeStart'
    ];


    const startValue =
      dateStartControl?.value;

    const endValue =
      dateEndControl.value;


    if (
      startValue &&
      endValue
    ) {
      const startDate =
        new Date(startValue);

      const endDate =
        new Date(endValue);


      if (
        !Number.isNaN(
          startDate.getTime()
        ) &&
        !Number.isNaN(
          endDate.getTime()
        ) &&
        endDate < startDate
      ) {
        currentErrors[
          'dateEndBeforeStart'
        ] = true;
      }
    }


    dateEndControl.setErrors(
      Object.keys(currentErrors).length
        ? currentErrors
        : null
    );
  }


  private getCultureActionSaveRequest(
    isEdit: boolean
  ): Observable<any> | null {

    const actionCode =
      this.getSelectedCultureActionCode();


    const payload =
      this.buildPayload();


    if (isEdit) {

      const idAction =
        Number(
          this.dialogData?.idAction
        );


      if (!idAction) {
        return null;
      }


      switch (actionCode) {

        case 'transp':
          return this.cultureService
            .updateCultureTransplantation(
              idAction,
              payload
            );

        case 'obs':
          return this.cultureService
            .updateCultureObservation(
              idAction,
              payload
            );

        case 'tracult':
          return this.cultureService
            .updateCultureTreatment(
              idAction,
              payload
            );

        case 'prel':
          return this.cultureService
            .updateCultureSampling(
              idAction,
              payload
            );

        default:
          return null;
      }
    }


    switch (actionCode) {

      case 'transp':
        return this.cultureService
          .createCultureTransplantation(
            this.dialogData.idCulture,
            payload
          );

      case 'obs':
        return this.cultureService
          .createCultureObservation(
            this.dialogData.idCulture,
            payload
          );

      case 'tracult':
        return this.cultureService
          .createCultureTreatment(
            this.dialogData.idCulture,
            payload
          );

      case 'prel':
        return this.cultureService
          .createCultureSampling(
            this.dialogData.idCulture,
            payload
          );

      default:
        return null;
    }
  }


  onSubmit(): void {
    this.formSubmitted = true;


    const dateStartControl =
      this.cultureActionForm
        .get('date_start');

    const dateEndControl =
      this.cultureActionForm
        .get('date_end');

    const transplantationTypeControl =
      this.cultureActionForm
        .get('id_type');


    if (
      transplantationTypeControl
        ?.hasError('required')
    ) {
      transplantationTypeControl
        .markAsTouched();

      this.triggerTransplantationTypeFieldShake();
    }


    if (
      dateStartControl?.hasError(
        'required'
      )
    ) {
      dateStartControl.markAsTouched();

      this.triggerActionStartDateFieldShake();
    }


    this.refreshCultureActionDateRangeError();


    if (
      dateEndControl?.hasError(
        'dateEndBeforeStart'
      )
    ) {
      dateEndControl.markAsTouched();

      this.triggerActionEndDateFieldShake();
    }


    if (
      !this.dialogData?.idCulture ||
      this.cultureActionForm.invalid ||
      this.isSubmitting
    ) {

      this.cultureActionForm
        .markAllAsTouched();

      return;
    }


    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-save',

        entityLabel:
          this.dialogData?.edit
            ? 'les modifications de l’action de culture'
            : 'l’action de culture',

        entityCode:
          actionTypeLabel ||
          undefined,

        disableClose: false
      })
      .subscribe(yes => {

        if (!yes) {
          return;
        }


        this.isSubmitting =
          true;


        const isEdit =
          !!(
            this.dialogData?.edit &&
            this.dialogData?.idAction
          );


        const request$ =
          this.getCultureActionSaveRequest(
            isEdit
          );


        if (!request$) {

          this.isSubmitting =
            false;


          this.toast
            .translateToaster(
              'error',
              'Type d’action de culture non pris en charge.'
            );


          return;
        }


        request$
          .subscribe({

            next: result => {

              this.showCultureActionSuccessToaster(
                isEdit
              );


              this.dialogRef.close(
                result
              );

            },

            error: error => {

              this.isSubmitting =
                false;


              console.error(
                isEdit
                  ? 'Erreur lors de la modification de l’action de culture :'
                  : 'Erreur lors de la création de l’action de culture :',
                error
              );


              this.toast
                .translateToaster(
                  'error',
                  isEdit
                    ? 'Impossible de modifier l’action de culture.'
                    : 'Impossible de créer l’action de culture.'
                );

            }

          });

      });
  }


  addNewAction(): void {
    this.formSubmitted = true;


    const transplantationTypeControl =
      this.cultureActionForm
        .get('id_type');


    if (
      transplantationTypeControl
        ?.hasError('required')
    ) {
      transplantationTypeControl
        .markAsTouched();

      this.triggerTransplantationTypeFieldShake();
    }


    if (
      !this.dialogData?.idCulture ||
      this.cultureActionForm.invalid ||
      this.isSubmitting
    ) {

      this.cultureActionForm
        .markAllAsTouched();

      return;
    }


    this.isSubmitting = true;


    const request$ =
      this.getCultureActionSaveRequest(
        false
      );


    if (!request$) {

      this.isSubmitting =
        false;


      this.toast
        .translateToaster(
          'error',
          'Type d’action de culture non pris en charge.'
        );


      return;
    }


    request$
      .subscribe({

        next: () => {

          this.showCultureActionSuccessToaster(
            false
          );


          this.substrates.clear();


          this.cultureActionForm.reset({
            id_action_type: null,
            date_start: null,
            date_end: null,
            id_actor: [],
            id_type: null,
            intervention_quantity: null,
            in_progress_quantity: null,
            packaging: '',
            id_physiological_development_stage: null,
            id_main_location: null,
            precise_location: '',
            individual_count: null,
            id_phenological_stage: null,
            disease_or_deficiency: '',
            treatment_type: '',
            success: null,
            quantity: null,
            remarks: ''
          });


          if (
            this.dialogData?.isFirstCultureAction
          ) {
            this.dialogData.isFirstCultureAction = false;
            this.configureInitialCultureActionRules();
            this.loadNomenclatures();
          }


          this.formSubmitted = false;
          this.isSubmitting = false;


          this.cultureActionForm
            .markAsPristine();

          this.cultureActionForm
            .markAsUntouched();

        },

        error: error => {

          this.isSubmitting = false;


          console.error(
            'Erreur lors de la création de l’action de culture :',
            error
          );


          this.toast
            .translateToaster(
              'error',
              'Impossible de créer l’action de culture.'
            );

        }

      });
  }


  private getCultureActionCancelLabel(): string {

    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    if (!actionTypeLabel) {
      return '';
    }


    return [
      this.dialogData?.codeCulture || '',
      actionTypeLabel
    ]
      .filter(Boolean)
      .join(' - ');
  }


  private showCultureActionCancelToaster(): void {

    const actionLabel =
      this.getCultureActionCancelLabel();


    const dateStart =
      this.formatDateForToaster(
        this.cultureActionForm
          .get('date_start')
          ?.value
      );


    const hasDateStart =
      dateStart !== '-';


    const dateLine =
      hasDateStart
        ? `\nDate de début : ${
            this.toBoldItalicText(
              dateStart
            )
          }`
        : '';


    if (this.dialogData?.edit) {

      this.toast.translateToaster(
        'info',
        `Action ${
          this.toBoldItalicText(
            actionLabel
          )
        } non modifiée${dateLine}`
      );


      return;
    }


    if (actionLabel) {

      this.toast.translateToaster(
        'info',
        `Action ${
          this.toBoldItalicText(
            actionLabel
          )
        } non créée${dateLine}`
      );


      return;
    }


    this.toast.translateToaster(
      'info',
      `Création de l’action annulée${dateLine}`
    );
  }


  onCancel(): void {
    if (
      this.cancelDialogOpen ||
      this.isSubmitting
    ) {
      return;
    }


    this.cancelDialogOpen = true;


    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    const dateStart =
      this.cultureActionForm
        .get('date_start')
        ?.value;


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-exit',

        actionCancellation: true,

        actionCancellationMode:
          this.dialogData?.edit
            ? 'edit'
            : 'create',

        actionContextLabel:
          'de culture',

        entityLabel:
          actionTypeLabel ||
          undefined,

        entityDate:
          dateStart ||
          undefined,

        disableClose: false
      })
      .subscribe({

        next: yes => {

          this.cancelDialogOpen = false;


          if (!yes) {
            return;
          }


          this.showCultureActionCancelToaster();


          this.dialogRef.close();

        },

        error: () => {
          this.cancelDialogOpen = false;
        }

      });
  }

  private populateEditForm(
    action: any
  ): void {

    const actionCode =
      this.getCultureActionCodeFromAction(
        action
      );


    const cultureActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            String(
              option?.cd_nomenclature ||
              ''
            )
              .trim()
              .toLowerCase() ===
            actionCode
        );


    this.substrates.clear();


    const substrates =
      Array.isArray(action?.substrat)
        ? action.substrat
        : [];


    substrates.forEach(
      substrate => {

        this.substrates.push(
          this.fb.group({
            type: [
              substrate?.type || ''
            ],

            category: [
              substrate?.category || null
            ],

            percentage: [
              substrate?.percentage ?? null,
              [
                Validators.min(0),
                Validators.max(100)
              ]
            ]
          })
        );

      }
    );


    this.cultureActionForm.patchValue({
      id_action_type:
        cultureActionType
          ?.id_nomenclature ||
        null,

      date_start:
        this.parseDateForForm(
          this.dialogData
            ?.isInitialCultureAction
            ? this.dialogData
                ?.cultureDateStart
            : action?.date_start
        ),

      date_end:
        this.parseDateForForm(
          action?.date_end
        ),

      id_actor:
        action?.id_actor
          ? [
              {
                id_role:
                  action.id_actor
              }
            ]
          : [],

      id_type:
        action?.id_type ?? null,

      intervention_quantity:
        action?.intervention_quantity ??
        null,

      in_progress_quantity:
        action?.in_progress_quantity ??
        null,

      packaging:
        action?.packaging || '',

      id_physiological_development_stage:
        action
          ?.id_physiological_development_stage ??
        null,

      id_main_location:
        action?.id_main_location ?? null,

      precise_location:
        action?.precise_location || '',

      individual_count:
        action?.individual_count ?? null,

      id_phenological_stage:
        action?.id_phenological_stage ??
        null,

      disease_or_deficiency:
        action?.disease_or_deficiency ||
        '',

      treatment_type:
        action?.type || '',

      success:
        action?.success ?? null,

      quantity:
        action?.quantity ?? null,

      remarks:
        action?.remarks || ''
    }, {
      emitEvent: false
    });


    this.formSubmitted = false;


    this.cultureActionForm
      .markAsPristine();

    this.cultureActionForm
      .markAsUntouched();
  }


  private getCultureActionCodeFromAction(
    action: any
  ): string {

    const explicitCode =
      String(
        action?.code_action_type ||
        ''
      )
        .trim()
        .toLowerCase();


    if (explicitCode) {
      return explicitCode;
    }


    if (
      action
        ?.id_culture_action_transplantation
      !== undefined
    ) {
      return 'transp';
    }


    if (
      action
        ?.id_culture_action_observation
      !== undefined
    ) {
      return 'obs';
    }


    if (
      action
        ?.id_culture_action_treatment
      !== undefined
    ) {
      return 'tracult';
    }


    if (
      action
        ?.id_culture_action_sampling
      !== undefined
    ) {
      return 'prel';
    }


    return '';
  }


  private parseDateForForm(
    value: any
  ): Date | null {

    if (!value) {
      return null;
    }


    const datePart =
      String(value)
        .split('T')[0];


    const [
      year,
      month,
      day
    ] =
      datePart.split('-');


    if (
      year &&
      month &&
      day
    ) {

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );
    }


    const date =
      new Date(value);


    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }


  getOptionLabel(option: any): string {
    return (
      option?.label_fr ||
      option?.label_default ||
      option?.mnemonique ||
      '-'
    );
  }

  private loadNomenclatures(): void {
    this.loadNomenclature(
      'CFE_ACTION_TYPE',

      options => {

        const cultureActionCodes =
          this.dialogData
            ?.isFirstCultureAction
            ? [
                'transp'
              ]
            : [
                'transp',
                'obs',
                'tracult',
                'prel'
              ];


        this.cultureActionTypeOptions =
          options
            .filter(
              option =>
                cultureActionCodes.includes(
                  String(
                    option?.cd_nomenclature ||
                    ''
                  )
                    .trim()
                    .toLowerCase()
                )
            )
            .sort(
              (optionA, optionB) => {

                const codeA =
                  String(
                    optionA?.cd_nomenclature ||
                    ''
                  )
                    .trim()
                    .toLowerCase();

                const codeB =
                  String(
                    optionB?.cd_nomenclature ||
                    ''
                  )
                    .trim()
                    .toLowerCase();


                return (
                  cultureActionCodes.indexOf(
                    codeA
                  ) -
                  cultureActionCodes.indexOf(
                    codeB
                  )
                );
              }
            );


        if (
          this.dialogData?.edit &&
          this.dialogData?.action
        ) {
          this.populateEditForm(
            this.dialogData.action
          );
        } else {
          this.applyInitialCultureActionDefaults();
        }
      },

      'types d’action de Culture'
    );

    this.loadNomenclature(
      'CFE_TRANSPLANTATION_TYPE',
      options => {

        const allowedCodes =
          this.isInitialCultureActionContext
            ? this.dialogData
                ?.cultureHasSource
              ? [
                  'repiq'
                ]
              : [
                  'remp',
                  'plant'
                ]
            : [
                'remp',
                'plant'
              ];


        this.transplantationTypeOptions =
          options.filter(
            option =>
              allowedCodes.includes(
                String(
                  option?.cd_nomenclature ||
                  ''
                )
                  .trim()
                  .toLowerCase()
              )
          );
      },
      'types de transplantation'
    );
    this.loadNomenclature(
      'CFE_PHYSIOLOGICAL_STAGE',
      options => (this.physiologicalStageOptions = options),
      'stades physiologiques'
    );
    this.loadNomenclature(
      'CFE_PHENOLOGICAL_STAGE',
      options => (this.phenologicalStageOptions = options),
      'stades phénologiques'
    );
    this.loadNomenclature(
      'CFE_MAIN_LOCATION',
      options => (this.mainLocationOptions = options),
      'localisations principales'
    );
  }

  private loadNomenclature(
    typeCode: string,
    assign: (options: any[]) => void,
    errorLabel: string
  ): void {
    this.dataService.getNomenclaturesByTypeCode(typeCode).subscribe({
      next: options => assign(this.sortNomenclatures(options)),
      error: error => {
        console.error(`Erreur lors du chargement des ${errorLabel} :`, error);
        assign([]);
      }
    });
  }

  private sortNomenclatures(options: any[] | null | undefined): any[] {
    return [...(options || [])].sort((a, b) => {
      const hierarchyA = String(a?.hierarchy || '');
      const hierarchyB = String(b?.hierarchy || '');
      if (hierarchyA !== hierarchyB) return hierarchyA.localeCompare(hierarchyB, 'fr');
      return this.getOptionLabel(a).localeCompare(this.getOptionLabel(b), 'fr');
    });
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startValue = control.get('date_start')?.value;
    const endValue = control.get('date_end')?.value;
    if (!startValue || !endValue) return null;

    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    return end < start ? { dateEndBeforeStart: true } : null;
  }

  private buildPayload(): any {
    const raw = this.cultureActionForm.getRawValue();
    const observer = Array.isArray(raw.id_actor) ? raw.id_actor[0] : raw.id_actor;

    const action = {
      date_start: this.formatDateForApi(raw.date_start),
      date_end: this.formatDateForApi(raw.date_end),
      id_actor: observer?.id_role ?? null
    };

    const actionCode =
      this.getSelectedCultureActionCode();


    if (actionCode === 'obs') {
      return {
        action,
        observation: {
          individual_count:
            this.parseOptionalNumber(
              raw.individual_count
            ),
          id_phenological_stage:
            raw.id_phenological_stage ??
            null,
          remarks:
            this.cleanText(
              raw.remarks
            )
        }
      };
    }


    if (actionCode === 'tracult') {
      return {
        action,
        treatment: {
          id_physiological_development_stage:
            raw.id_physiological_development_stage ??
            null,
          disease_or_deficiency:
            this.cleanText(
              raw.disease_or_deficiency
            ),
          type:
            this.cleanText(
              raw.treatment_type
            ),
          success:
            raw.success === true
              ? true
              : raw.success === false
                ? false
                : null
        }
      };
    }


    if (actionCode === 'prel') {
      return {
        action,
        sampling: {
          quantity:
            this.parseOptionalNumber(
              raw.quantity
            ),
          remarks:
            this.cleanText(
              raw.remarks
            )
        }
      };
    }


    const substrat = (raw.substrat || [])
      .map((item: any) => ({
        type: this.cleanText(item?.type),
        category: item?.category || null,
        percentage: this.parseOptionalNumber(item?.percentage)
      }))
      .filter(
        (item: any) => !!item.type || !!item.category || item.percentage !== null
      );

    return {
      action,
      transplantation: {
        id_type: raw.id_type ?? null,
        intervention_quantity: this.parseOptionalNumber(raw.intervention_quantity),
        in_progress_quantity: this.parseOptionalNumber(raw.in_progress_quantity),
        packaging: this.cleanText(raw.packaging),
        substrat: substrat.length ? substrat : null,
        id_physiological_development_stage:
          raw.id_physiological_development_stage ?? null,
        id_main_location: raw.id_main_location ?? null,
        precise_location: this.cleanText(raw.precise_location),
        remarks: this.cleanText(raw.remarks)
      }
    };
  }

  private formatDateForApi(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseOptionalNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private cleanText(value: any): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }
}