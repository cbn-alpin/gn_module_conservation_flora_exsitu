import { Component, OnInit, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SemisService } from './semis.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import { CommonService } from '@geonature_common/service/common.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-semis',
  templateUrl: './semis.component.html',
  styleUrls: ['./semis.component.scss']
})
export class SemisComponent implements OnInit {
  public semisForm: FormGroup;
  public formSubmitted = false;
  public shakeCodeField = false;
  public shakeStartDateField = false;
  public shakeEndDateField = false;
  public shakeDepthField = false;
  public shakeContainerField = false;
  public shakeMethodField = false;
  public shakeSubstrateField = false;
  public shakeWateringField = false;
  public shakeActorField = false;
  public shakeLocationField = false;
  public shakeInitialCountField = false;
  public shakeReplicateCountField = false;
  private cancelDialogOpen = false;
  private initialFormState: any = null;
  public sowingLocationOptions: any[] = [];

  private readonly sowingLocationOrder = [
    'Pleine terre',
    'Serre',
    'Chassis',
    'Salle de culture',
    'Jardin alpin',
    'Autre'
  ];

  public sowingSubstrateOptions: any[] = [];

  private readonly sowingSubstrateOrder = [
    'Terreau',
    'Tourbe',
    'Terre de bruyère',
    'Sable',
    'Perlite',
    'Vermiculite',
    'Sol prélevé in-situ',
    'Autre'
  ];

  public sowingMethodOptions: any[] = [];

  private readonly sowingMethodOrder = [
    'Individuel',
    'En poquets',
    'En ligne',
    'A la volée'
  ];

  public sowingWateringOptions: any[] = [];

  private readonly sowingWateringOrder = [
    'Aspersion',
    'Capillarité'
  ];

  public observers_list_code: any;
  public idMaterial!: number;
  public idStorage: number | null = null;
  public existingSowings: any[] = [];

  public additionalDataForm!: FormGroup;
  public formsDefinition: any[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SemisComponent>,
    private semisService: SemisService,
    private exsituFormService: ExsituFormService,
    private dataService: DataService,
    private cfg: ConfigService,
    private toast: CommonService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public modalData: any
  ) {
    this.semisForm = this.fb.group({
      code: ['', [Validators.required, this.sowingSequenceValidator]],
      start_date: [null, Validators.required],
      end_date: [null],

      id_actor: [[]],
      id_watering_method: [null],
      id_sowing_method: [null, Validators.required],
      id_substrate: [null, Validators.required],

      container: ['', Validators.required],
      depth: [null, [Validators.min(1)]],
      id_location: [null],
      specification_location: [''],

      initial_count: [null, [Validators.required, Validators.min(1)]],
      replicate_count: [1, [Validators.required, Validators.min(1)]],

      remarks: [''],
      additional_data: this.fb.group({})
    }, { validators: this.dateRangeValidator });
  }

  sowingSequenceValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value || typeof value !== 'string') {
      return null;
    }

    const match = value.match(/^S\d{4}_(\d{4})$/);

    if (!match) {
      return null;
    }

    return match[1] === '0000' ? { sowingSequenceInvalid: true } : null;
  }

  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('start_date')?.value;
    const endDate = control.get('end_date')?.value;
    const codeControl = control.get('code');
    const code = codeControl?.value;
    const startDateControl = control.get('start_date');
    const endDateControl = control.get('end_date');

    const errors: ValidationErrors = {};

    const hasDateRangeInvalid = !!(startDate && endDate && startDate >= endDate);

    if (hasDateRangeInvalid) {
      errors['dateRangeInvalid'] = true;
    }

    let startYear: string | null = null;
    const codeMatch = typeof code === 'string' ? code.match(/^S(\d{4})_(?!0000)\d{4}$/) : null;

    if (typeof startDate === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        startYear = startDate.slice(0, 4);
      } else {
        const frenchDateMatch = startDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (frenchDateMatch) {
          startYear = frenchDateMatch[3];
        }
      }
    }

    if (!startYear && startDate) {
      const parsedDate = new Date(startDate);
      if (!isNaN(parsedDate.getTime())) {
        startYear = parsedDate.getFullYear().toString();
      }
    }

    const hasCodeYearMismatch = !!(codeMatch && startYear && codeMatch[1] !== startYear);

    if (startDateControl) {
      const currentErrors = { ...(startDateControl.errors || {}) };

      if (hasCodeYearMismatch) {
        currentErrors['codeYearMismatch'] = true;
      } else {
        delete currentErrors['codeYearMismatch'];
      }

      startDateControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
    }

    if (endDateControl) {
      const currentErrors = { ...(endDateControl.errors || {}) };

      if (hasDateRangeInvalid) {
        currentErrors['dateRangeInvalid'] = true;
      } else {
        delete currentErrors['dateRangeInvalid'];
      }

      endDateControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
    }

    if (codeControl) {
      const currentErrors = { ...(codeControl.errors || {}) };

      if (hasCodeYearMismatch) {
        currentErrors['codeYearMismatch'] = true;
      } else {
        delete currentErrors['codeYearMismatch'];
      }

      codeControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
    }

    return Object.keys(errors).length ? errors : null;
  }

  private handleSowingSaveError(err: any): void {
    const backendError = err?.error?.error || '';

    if (typeof backendError === 'string' && backendError.includes('uq_t_sowing_code')) {
      this.setDuplicateCodeError();
      return;
    }

    console.error('Erreur semis :', err);
  }

  private setDuplicateCodeError(): void {
    const codeControl = this.semisForm.get('code');

    if (codeControl) {
      codeControl.setErrors({
        ...(codeControl.errors || {}),
        duplicateCode: true
      });
      codeControl.markAsTouched();
      codeControl.markAsDirty();
    }

    this.formSubmitted = true;
    this.triggerCodeFieldShake();
  }

  private isDuplicateSowingCode(existingSowings: any[], currentCode: string): boolean {
    const normalizedCode = (currentCode || '').trim();
    const currentSowingId = this.modalData?.edit ? this.modalData?.test?.id_sowing : null;

    return existingSowings.some((sowing: any) => {
      const existingCode = (sowing?.code || '').trim();
      const existingId = sowing?.id_sowing ?? null;

      return existingCode === normalizedCode && existingId !== currentSowingId;
    });
  }

  private validateDuplicateCode(currentCode?: string): void {
    const codeControl = this.semisForm.get('code');
    if (!codeControl) return;

    const normalizedCode = (currentCode ?? codeControl.value ?? '').trim();
    const currentErrors = { ...(codeControl.errors || {}) };

    if (!normalizedCode) {
      if (currentErrors['duplicateCode']) {
        delete currentErrors['duplicateCode'];
        codeControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
      }
      return;
    }

    const isDuplicate = this.isDuplicateSowingCode(this.existingSowings, normalizedCode);

    if (isDuplicate) {
      codeControl.setErrors({
        ...currentErrors,
        duplicateCode: true
      });
    } else if (currentErrors['duplicateCode']) {
      delete currentErrors['duplicateCode'];
      codeControl.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
    }
  }

  ngOnInit(): void {
    this.idMaterial = this.exsituFormService.idMaterial;
    this.exsituFormService.id_storage.subscribe(id => this.idStorage = id ?? null);

    this.observers_list_code = this.cfg.getObsCode();

    this.additionalDataForm = this.semisForm.get('additional_data') as FormGroup;
    this.formsDefinition = this.cfg.getModuleConfigExsitu()?.['harvest_form']?.['additional_data'] ?? [];
    this.formsDefinition.forEach(field => {
      const name = field.attribut_name;
      if (!this.additionalDataForm.contains(name)) {
        this.additionalDataForm.addControl(name, this.fb.control(''));
      }
    });

    this.initializeFormState();

    if (this.idMaterial) {
      this.semisService.getSowingsByMaterial(this.idMaterial).subscribe({
      next: (sowings) => {
        this.existingSowings = sowings || [];
        this.validateDuplicateCode();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des semis existants :', err);
        this.existingSowings = [];
      }
    });
  }

  this.semisForm.get('code')?.valueChanges.subscribe((value) => {
    this.validateDuplicateCode(value);
  });

  this.dialogRef.backdropClick().subscribe(() => {
    this.onCancel();
  });

  this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
    }
  });

  this.dataService.getNomenclaturesByTypeCode('CFE_SOWING_LOCATION').subscribe({
    next: (locations) => {
      this.sowingLocationOptions = locations || [];
    },
    error: (err) => {
      console.error('Erreur lors du chargement des localisations de semis :', err);
      this.sowingLocationOptions = [];
    }
  });

  this.dataService.getNomenclaturesByTypeCode('CFE_SOWING_SUBSTRATE').subscribe({
    next: (substrates) => {
      this.sowingSubstrateOptions = substrates || [];
    },
    error: (err) => {
      console.error('Erreur lors du chargement des substrats de semis :', err);
      this.sowingSubstrateOptions = [];
    }
  });

  this.dataService.getNomenclaturesByTypeCode('CFE_SOWING_METHOD').subscribe({
    next: (methods) => {
      this.sowingMethodOptions = methods || [];
    },
    error: (err) => {
      console.error('Erreur lors du chargement des méthodes de semis :', err);
      this.sowingMethodOptions = [];
    }
  });

  this.dataService.getNomenclaturesByTypeCode('CFE_WATERING_METHOD').subscribe({
    next: (wateringMethods) => {
      this.sowingWateringOptions = wateringMethods || [];
    },
    error: (err) => {
      console.error('Erreur lors du chargement des modes d’arrosage :', err);
      this.sowingWateringOptions = [];
    }
  });

  }

  public getOrderedSowingLocations(): any[] {
    const orderMap = new Map(
      this.sowingLocationOrder.map((label, index) => [label, index])
    );

    return [...this.sowingLocationOptions].sort((a, b) => {
      const labelA = a?.label_default || '';
      const labelB = b?.label_default || '';

      const indexA = orderMap.has(labelA) ? orderMap.get(labelA)! : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(labelB) ? orderMap.get(labelB)! : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return String(labelA).localeCompare(String(labelB), 'fr');
    });
  }

  public getOrderedSowingSubstrates(): any[] {
    const orderMap = new Map(
      this.sowingSubstrateOrder.map((label, index) => [label, index])
    );

    return [...this.sowingSubstrateOptions].sort((a, b) => {
      const labelA = a?.label_default || '';
      const labelB = b?.label_default || '';

      const indexA = orderMap.has(labelA) ? orderMap.get(labelA)! : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(labelB) ? orderMap.get(labelB)! : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return String(labelA).localeCompare(String(labelB), 'fr');
    });
  }

  public getOrderedSowingMethods(): any[] {
    const orderMap = new Map(
      this.sowingMethodOrder.map((label, index) => [label, index])
    );

    return [...this.sowingMethodOptions].sort((a, b) => {
      const labelA = a?.label_default || '';
      const labelB = b?.label_default || '';

      const indexA = orderMap.has(labelA) ? orderMap.get(labelA)! : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(labelB) ? orderMap.get(labelB)! : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return String(labelA).localeCompare(String(labelB), 'fr');
    });
  }

  public getOrderedSowingWateringMethods(): any[] {
    const orderMap = new Map(
      this.sowingWateringOrder.map((label, index) => [label, index])
    );

    return [...this.sowingWateringOptions].sort((a, b) => {
      const labelA = a?.label_default || '';
      const labelB = b?.label_default || '';

      const indexA = orderMap.has(labelA) ? orderMap.get(labelA)! : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(labelB) ? orderMap.get(labelB)! : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return String(labelA).localeCompare(String(labelB), 'fr');
    });
  }

  patchForm(data: any): void {
    const formState = {
      code: data.code || '',
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,

      id_actor: data.id_actor ? [{ id_role: data.id_actor }] : [],

      id_watering_method: data.id_watering_method ?? null,
      id_sowing_method: data.id_sowing_method ?? null,
      id_substrate: data.id_substrate ?? null,

      container: data.container || '',
      depth: data.depth ?? null,
      id_location: data.id_location ?? null,
      specification_location: data.specification_location || '',

      initial_count: data.initial_count ?? null,
      replicate_count: data.replicate_count ?? 1,

      remarks: data.remarks || '',
      additional_data: {}
    };

    this.semisForm.reset(formState);

    if (data.additional_data && this.additionalDataForm) {
      Object.keys(data.additional_data).forEach(key => {
        if (this.additionalDataForm.contains(key)) {
          this.additionalDataForm.get(key)?.patchValue(data.additional_data[key]);
        }
      });
    }

    this.semisForm.markAsPristine();
    this.semisForm.markAsUntouched();
  }

  private formatFormData(): any {
    const raw = this.semisForm.value;
    const payload: any = { ...raw };

    if (payload.additional_data) {
      const cleaned: any = {};
      Object.keys(payload.additional_data).forEach(k => {
        const v = payload.additional_data[k];
        if (v !== null && v !== undefined && v !== '') cleaned[k] = v;
      });
      if (Object.keys(cleaned).length) {
        payload.additional_data = cleaned;
      } else {
        delete payload.additional_data;
      }
    }

    if (Array.isArray(raw.id_actor) && raw.id_actor.length > 0) {
      payload.id_actor = raw.id_actor[0]?.id_role ?? null;
    } else {
      payload.id_actor = null;
    }

    payload.id_material = this.idMaterial;
    payload.id_storage = this.idStorage;

    if (!payload.replicate_count) payload.replicate_count = 1;
    if (!payload.end_date) delete payload.end_date;

    if (
      payload.id_substrate !== null &&
      payload.id_substrate !== undefined &&
      payload.id_substrate !== ''
    ) {
      payload.substrate = { id_nomenclature: payload.id_substrate };
    }
    delete payload.id_substrate;

    if (payload.start_date instanceof Date && !isNaN(payload.start_date.getTime())) {
      payload.start_date = payload.start_date.toISOString().slice(0, 10);
    }

    if (payload.end_date instanceof Date && !isNaN(payload.end_date.getTime())) {
      payload.end_date = payload.end_date.toISOString().slice(0, 10);
    }

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

  private triggerDepthFieldShake(): void {
    this.shakeDepthField = false;

    setTimeout(() => {
      this.shakeDepthField = true;

      setTimeout(() => {
        this.shakeDepthField = false;
      }, 400);
    }, 0);
  }

  private triggerContainerFieldShake(): void {
    this.shakeContainerField = false;

    setTimeout(() => {
      this.shakeContainerField = true;

      setTimeout(() => {
        this.shakeContainerField = false;
      }, 400);
    }, 0);
  }

  private triggerMethodFieldShake(): void {
    this.shakeMethodField = false;

    setTimeout(() => {
      this.shakeMethodField = true;

      setTimeout(() => {
        this.shakeMethodField = false;
      }, 400);
    }, 0);
  }

  private triggerSubstrateFieldShake(): void {
    this.shakeSubstrateField = false;

    setTimeout(() => {
      this.shakeSubstrateField = true;

      setTimeout(() => {
        this.shakeSubstrateField = false;
      }, 400);
    }, 0);
  }

  private triggerWateringFieldShake(): void {
    this.shakeWateringField = false;

    setTimeout(() => {
      this.shakeWateringField = true;

      setTimeout(() => {
        this.shakeWateringField = false;
      }, 400);
    }, 0);
  }

  private triggerActorFieldShake(): void {
    this.shakeActorField = false;

    setTimeout(() => {
      this.shakeActorField = true;

      setTimeout(() => {
        this.shakeActorField = false;
      }, 400);
    }, 0);
  }

  private triggerLocationFieldShake(): void {
    this.shakeLocationField = false;

    setTimeout(() => {
      this.shakeLocationField = true;

      setTimeout(() => {
        this.shakeLocationField = false;
      }, 400);
    }, 0);
  }

  private triggerInitialCountFieldShake(): void {
    this.shakeInitialCountField = false;

    setTimeout(() => {
      this.shakeInitialCountField = true;

      setTimeout(() => {
        this.shakeInitialCountField = false;
      }, 400);
    }, 0);
  }

  private triggerReplicateCountFieldShake(): void {
    this.shakeReplicateCountField = false;

    setTimeout(() => {
      this.shakeReplicateCountField = true;

      setTimeout(() => {
        this.shakeReplicateCountField = false;
      }, 400);
    }, 0);
  }

  public hasControlError(controlName: string, errorCode: string): boolean {
    return this.formSubmitted && !!this.semisForm.get(controlName)?.hasError(errorCode);
  }

  public hasDateRangeError(): boolean {
    return this.formSubmitted && !!this.semisForm.hasError('dateRangeInvalid');
  }

  public isSubmittedValid(controlName: string): boolean {
    const control = this.semisForm.get(controlName);
    return !!(this.formSubmitted && control && control.valid);
  }

  public isStartDateValidated(): boolean {
    return !!(
      this.formSubmitted &&
      this.semisForm.get('start_date')?.valid &&
      !this.semisForm.hasError('dateRangeInvalid')
    );
  }

  public isEndDateValidated(): boolean {
    return !!(
      this.formSubmitted &&
      this.semisForm.get('end_date')?.value &&
      !this.semisForm.hasError('dateRangeInvalid')
    );
  }

  private buildEmptyFormState(): any {
    const additionalData: any = {};

    Object.keys(this.additionalDataForm.controls).forEach(key => {
      additionalData[key] = '';
    });

    return {
      code: '',
      start_date: null,
      end_date: null,
      id_actor: [],
      id_watering_method: null,
      id_sowing_method: null,
      id_substrate: null,
      container: '',
      depth: null,
      id_location: null,
      specification_location: '',
      initial_count: null,
      replicate_count: 1,
      remarks: '',
      additional_data: additionalData
    };
  }

  private initializeFormState(): void {
    if (this.modalData?.edit && this.modalData?.test) {
      this.patchForm(this.modalData.test);

      this.initialFormState = this.semisForm.getRawValue();
      return;
    }

    const emptyState = this.buildEmptyFormState();
    this.semisForm.reset(emptyState);
    this.semisForm.markAsPristine();
    this.semisForm.markAsUntouched();

    this.initialFormState = this.semisForm.getRawValue();
  }

  onReset(): void {
    if (!this.initialFormState) {
      return;
    }

    this.dialogService
      .confirmDialog({
        message: this.modalData?.edit
          ? 'Étes vous certain de vouloir réinitialiser les modifications de ce semis ?'
          : 'Étes vous certain de vouloir réinitialiser cette fiche de semis ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.semisForm.reset(this.initialFormState);
        this.semisForm.markAsPristine();
        this.semisForm.markAsUntouched();
        this.semisForm.updateValueAndValidity();

        this.formSubmitted = false;

        this.shakeCodeField = false;
        this.shakeStartDateField = false;
        this.shakeEndDateField = false;
        this.shakeDepthField = false;
        this.shakeContainerField = false;
        this.shakeMethodField = false;
        this.shakeSubstrateField = false;
        this.shakeWateringField = false;
        this.shakeActorField = false;
        this.shakeLocationField = false;
        this.shakeInitialCountField = false;
        this.shakeReplicateCountField = false;

        this.validateDuplicateCode(this.semisForm.get('code')?.value);
      });
  }

  private toBoldText(value: string): string {
    const boldChars: Record<string, string> = {
      A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉',
      K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓',
      U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
      a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣',
      k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭',
      u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
      0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
    };

    return value.replace(/[A-Za-z0-9]/g, (char) => boldChars[char] || char);
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.semisForm.invalid) {
      this.semisForm.markAllAsTouched();

      if (this.semisForm.get('code')?.invalid) {
        this.triggerCodeFieldShake();
      }

      if (this.semisForm.get('start_date')?.hasError('required')) {
        this.triggerStartDateFieldShake();
      }

      if (
        this.semisForm.get('code')?.hasError('codeYearMismatch') ||
        this.semisForm.get('start_date')?.hasError('codeYearMismatch')
      ) {
        this.triggerCodeFieldShake();
        this.triggerStartDateFieldShake();
      }

      if (this.semisForm.hasError('dateRangeInvalid')) {
        this.triggerStartDateFieldShake();
        this.triggerEndDateFieldShake();
      }

      if (this.semisForm.get('depth')?.invalid) {
        this.triggerDepthFieldShake();
      }

      if (this.semisForm.get('container')?.invalid) {
        this.triggerContainerFieldShake();
      }

      if (this.semisForm.get('id_sowing_method')?.invalid) {
        this.triggerMethodFieldShake();
      }

      if (this.semisForm.get('id_substrate')?.invalid) {
        this.triggerSubstrateFieldShake();
      }

      if (this.semisForm.get('id_watering_method')?.invalid) {
        this.triggerWateringFieldShake();
      }

      if (this.semisForm.get('id_actor')?.invalid) {
        this.triggerActorFieldShake();
      }

      if (this.semisForm.get('id_location')?.invalid) {
        this.triggerLocationFieldShake();
      }

      if (this.semisForm.get('initial_count')?.invalid) {
        this.triggerInitialCountFieldShake();
      }

      if (this.semisForm.get('replicate_count')?.invalid) {
        this.triggerReplicateCountFieldShake();
      }

      return;
    }

    if (!this.idMaterial) {
      console.error('idMaterial est manquant !');
      return;
    }

    const currentCode = this.semisForm.get('code')?.value || '';

    this.semisService.getSowingsByMaterial(this.idMaterial).subscribe({
      next: (existingSowings) => {
        if (this.isDuplicateSowingCode(existingSowings || [], currentCode)) {
          this.setDuplicateCodeError();
          return;
        }

        this.dialogService
          .confirmDialog({
            message: this.modalData?.edit
              ? 'Étes vous certain de vouloir modifier ce semis ?'
              : 'Étes vous certain de vouloir enregistrer ce semis ?'
          })
          .subscribe((yes) => {
            if (!yes) {
              return;
            }

            const finalForm = this.formatFormData();

            if (this.modalData?.edit && this.modalData?.test?.id_sowing) {
              this.semisService.updateSowing(this.idMaterial!, this.modalData.test.id_sowing, finalForm).subscribe({
                next: (res) => {
                  this.toast.translateToaster(
                    'info',
                    `Semis ${this.toBoldText(currentCode)} mis à jour avec succès`
                  );
                  this.dialogRef.close(res);
                },
                error: (err) => this.handleSowingSaveError(err)
              });
            } else {
              this.semisService.addSowing(this.idMaterial!, finalForm).subscribe({
                next: (res) => {
                  this.toast.translateToaster('success', `Semis ${currentCode} créé avec succès`);
                  this.dialogRef.close(res);
                },
                error: (err) => this.handleSowingSaveError(err)
              });
            }
          });
      },
      error: (err) => {
        console.error('Erreur lors de la vérification du code semis :', err);
      }
    });
  }

  onCancel(): void {
    if (this.cancelDialogOpen) {
      return;
    }

    this.cancelDialogOpen = true;

    this.dialogService
      .confirmDialog({
        message: 'Étes vous certain de vouloir annuler ?'
      })
      .subscribe((yes) => {
        this.cancelDialogOpen = false;

        if (yes) {
          this.dialogRef.close();
        }
      });
  }
}