import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigService } from '../services/config.service';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';

interface Action {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss']
})
export class ActionComponent implements OnInit {
  @Output() actionAdded = new EventEmitter<any>();

  public observers_list_code;
  public formsDefinition: any[] = [];
  public additionalDataForm: FormGroup;
  public idTest: number | null = null;
  public idSowing: number | null = null;
  replicateCount: number;
  germinationForm: FormGroup;
  codeNomenclatureType: string;
  replicates_for_form: any = null;

  replicates: any[] = [];
  dataSource = new MatTableDataSource<Action>([]);
  displayedColumns: string[] = ['numSemis', 'numSemence', 'dateDebut', 'dateFin', 'replicate', 'levage'];
  public isGermination = true;

  code: string = '';
  codeId: any = null;
  type: any;
  hideTypeField = false;
  scarTypeCode: string;
  replicatesForm: FormGroup;
  replicateLabels: string[] = [];
  replicateDatesUsed: string[] = [];
  public actionTypes: any[] = [];
  private cancelDialogOpen = false;
  private initialActionFormState: any = null;
  private initialReplicatesFormState: any = null;
  private initialCode = '';
  private initialCodeId: any = null;
  private initialScarTypeCode = '';
  private initialHideTypeField = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    public dialogRef: MatDialogRef<ActionComponent>,
    public cfg: ConfigService,
    public api: DataService,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private exsituFormService: ExsituFormService,
    private dialogService: DialogService,
    private toast: CommonService
  ) {
    this.additionalDataForm = this.fb.group({});

    this.germinationForm = this.fb.group({
      id_actor: [''],
      id_action_type: [null, Validators.required],
      date_start: [null, Validators.required],
      date_end: [null],
      remarks: [''],
      temperature_light: [null],
      temperature_shadow: [null],
      hour_count_light: [null],
      hour_count_shadow: [null],
      id_water_type: [null],
      duration_water: [null],
      id_scarification_type: [null],
      id_tool: [null],
      id_scarification_mecanique: [null],
      id_chemical_liquid: [null],
      duration_chemical_liquid: [null],
      concentration_chemical_liquid: [null],
      id_liquid_treatment: [null],
      count_germinated: [null],
      count_viable: [null],
      count_transplanted: [null],
      count_dead: [null],
      total_count_transplanted: [null],
      total_count_germinated: [null],
      total_count_dead: [null],
      total_count_viable: [null],
      additional_data: this.additionalDataForm,
      actionsList: this.fb.array([]),
    });

    this.replicatesForm = this.fb.group({
      germes: this.fb.array([]),
      mortes: this.fb.array([]),
      nonGermes: this.fb.array([]),
      last_replicate: [false]
    });
  }

  get actionsList(): FormArray {
    return this.germinationForm.get('actionsList') as FormArray;
  }

  ngOnInit(): void {
    this.dataSource.data = [];
    this.observers_list_code = this.cfg.getObsCode();
    this.idTest = this.dialogData?.id_test ?? null;
    this.idSowing = this.dialogData?.id_sowing ?? null;
    const url = this.router.url;

    this.dialogRef.backdropClick().subscribe(() => {
      this.onCancel();
    });

    this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.onCancel();
      }
    });

    this.codeNomenclatureType = url.includes('viability') ? 'CFE_ACTION_VIA_TYPE' : 'CFE_ACTION_TYPE';
    console.log("📍 Type d'action détecté :", this.codeNomenclatureType);

    if (this.formsDefinition && this.additionalDataForm) {
      this.formsDefinition.forEach(field => {
        this.additionalDataForm.addControl(field.attribut_name, this.fb.control(''));
      });
    }

    this.germinationForm.get('id_action_type')?.valueChanges.subscribe(value => {
      const codeId = value?.id_nomenclature || value;
      this.codeId = codeId;

      if (!codeId) {
        this.code = '';
        return;
      }

      this.getActionByCode(codeId);
    });

    this.germinationForm.get('id_scarification_type')?.valueChanges.subscribe(value => {
      const id = value?.id_nomenclature || value;

      if (!id) {
        this.scarTypeCode = '';
        return;
      }

      this.api.getActionByCode(id).subscribe({
        next: (res) => {
          this.scarTypeCode = res.cd_nomenclature;
        }
      });
    });

    if (this.dialogData?.edit) {
      const action = this.dialogData.action;
      const code = this.dialogData.code;
      const hideTypeField = this.dialogData.hideTypeField;

      if (action.id_actor) {
        action.id_actor = [{ id_role: action.id_actor }];
      }

      this.germinationForm.patchValue(action);
      this.code = code;

      if (hideTypeField) {
        this.hideTypeField = true;
        this.germinationForm.get('id_action_type')?.disable();
      }

      this.api.getActionByCode(code).subscribe({
        next: (result) => {
          this.code = result.cd_nomenclature;
          this.codeId = result.id_nomenclature;

          this.storeInitialFormState();

          if (this.code === 'svr') {
            this.initReplicateFields(this.replicateCount);
            this.loadReplicateDates();
          }

          if (this.code === 'synth') {
            this.replicatesForm.addControl('total_count_germinated', this.fb.control(null));
            this.replicatesForm.addControl('total_count_dead', this.fb.control(null));
            this.replicatesForm.addControl('total_count_viable', this.fb.control(null));
          }

          if (this.dialogData?.id_action) {
            this.loadReplicatesForForm(this.dialogData.id_action);
          }
        }
      });
    }

    if (!this.dialogData?.edit) {
      this.storeInitialFormState();
    }

    if (this.idTest) {
      this.loadTestDetails();
    }
  }

  loadTestDetails(): void {
    this.api.getTestWithLabels(this.idTest).subscribe({
      next: (test) => {
        this.replicateCount = test.replicate_count;
        this.replicates = test.replicates;
      },
      error: (err) => console.error("Erreur test :", err)
    });
  }

  getActionByCode(id_nomenclature: number): void {
    this.api.getActionByCode(id_nomenclature).subscribe({
      next: (result) => {
        this.code = result.cd_nomenclature;

        if (this.code === 'svr') {
          this.initReplicateFields(this.replicateCount);
          this.loadReplicateDates();
        } else if (this.code === 'synth') {
          this.replicatesForm.addControl('total_count_germinated', this.fb.control(null));
          this.replicatesForm.addControl('total_count_dead', this.fb.control(null));
          this.replicatesForm.addControl('total_count_viable', this.fb.control(null));
        }
      },
      error: (err) => console.error("Erreur code action :", err)
    });
  }

  addNewAction(): void {
    if (!this.germinationForm.valid) return;

    const finalForm = this.formatDataFormAction();

    const request$ = this.idSowing
      ? this.api.addActionBySowing(this.idSowing, finalForm)
      : this.api.addActionByTest(this.idTest!, finalForm);

    request$.subscribe({
      next: (res) => {
        this.actionAdded.emit(res);

        this.germinationForm.reset();
        this.additionalDataForm.reset();
        this.replicatesForm.reset();

        this.replicatesForm = this.fb.group({
          germes: this.fb.array([]),
          mortes: this.fb.array([]),
          nonGermes: this.fb.array([]),
          last_replicate: [false]
        });

        this.replicates_for_form = null;
        this.code = '';
        this.codeId = null;
        this.scarTypeCode = '';

        this.germinationForm.patchValue({ id_actor: [], id_action_type: null });
        this.germinationForm.get('id_action_type')?.enable();
        this.hideTypeField = false;
      },
      error: (err) => console.error('Erreur ajout action :', err)
    });
  }

  private toBoldItalicText(value: string): string {
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

  private formatDateForToaster(value: any): string {
    const formattedDate = this.formatDateForApi(value);

    if (!formattedDate) {
      return '-';
    }

    const [year, month, day] = formattedDate.split('-');

    return `${day}/${month}/${year}`;
  }

  private getActionSuccessLabel(): string {
    const sowingCode = this.dialogData?.sowingCode || '';

    const actionTypeLabel =
      this.dialogData?.actionTypeLabel ||
      this.germinationForm.get('id_action_type')?.value?.label_default ||
      this.germinationForm.get('id_action_type')?.value?.mnemonique ||
      '';

    return `${sowingCode} - ${actionTypeLabel}`.trim();
  }

  private showActionSuccessToaster(isEdit: boolean): void {
    const actionLabel = this.getActionSuccessLabel();
    const dateStart = this.formatDateForToaster(this.germinationForm.get('date_start')?.value);

    this.toast.translateToaster(
      isEdit ? 'info' : 'success',
      `Action ${this.toBoldItalicText(actionLabel)} ${isEdit ? 'mise à jour' : 'créée'} avec succès. Date de début : ${this.toBoldItalicText(dateStart)}`
    );
  }
  
  onSubmit(): void {
    if (!this.germinationForm.valid) return;

    this.dialogService
      .confirmDialog({
        message: this.dialogData?.edit
          ? 'Étes vous certain de vouloir modifier cette action ?'
          : 'Étes vous certain de vouloir enregistrer cette action ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        const finalForm = this.formatDataFormAction();

        if (this.dialogData?.edit && this.dialogData?.id_action) {
          this.api.updateActionData(this.dialogData.id_action, finalForm).subscribe({
            next: (res) => {
              this.showActionSuccessToaster(true);
              this.dialogRef.close(res);
            },
            error: (err) => console.error("Erreur modification action :", err)
          });
        } else {
          const request$ = this.idSowing
            ? this.api.addActionBySowing(this.idSowing, finalForm)
            : this.api.addActionByTest(this.idTest!, finalForm);

          request$.subscribe({
            next: (res) => {
              this.showActionSuccessToaster(false);
              this.dialogRef.close(res);
            },
            error: (err) => console.error("Erreur création action :", err)
          });
        }
      });
  }

  private formatDateForApi(value: any): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value.split('T')[0];
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDataFormAction() {
    const rawForm = { ...this.germinationForm.value };

    rawForm.date_start = this.formatDateForApi(this.germinationForm.get('date_start')?.value);
    rawForm.date_end = this.formatDateForApi(this.germinationForm.get('date_end')?.value);

    const cleanedForm = {};
    const allowedFields = [
      'id_test', 'id_sowing', 'date_start', 'date_end',
      'id_actor', 'id_action_type', 'id_scarification_type',
      'id_scarification_mecanique', 'temperature_light', 'temperature_shadow',
      'hour_count_light', 'hour_count_shadow', 'id_water_type', 'duration_water',
      'id_tool', 'id_chemical_liquid', 'id_liquid_treatment',
      'duration_chemical_liquid', 'concentration_chemical_liquid', 'remarks',
      'additional_data'
    ];

    const additionalData = rawForm.additional_data || {};
    const cleanedAdditionalData = {};
    (this.formsDefinition || []).forEach(field => {
      const key = field.attribut_name;
      const value = additionalData[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanedAdditionalData[key] = value;
      }
    });

    if (Object.keys(cleanedAdditionalData).length > 0) {
      rawForm.additional_data = cleanedAdditionalData;
    } else {
      delete rawForm.additional_data;
    }

    rawForm.id_actor = rawForm.id_actor?.[0]?.id_role || null;
    rawForm.id_action_type = this.codeId || null;
    rawForm.id_scarification_type = this.germinationForm.value.id_scarification_type?.id_nomenclature || this.germinationForm.value.id_scarification_type || null;

    allowedFields.forEach(field => {
      if (rawForm[field] !== undefined) {
        cleanedForm[field] = rawForm[field];
      }
    });

    const replicates = this.replicatesForm?.value;

    if (this.code === 'svr' && replicates?.germes?.length) {
      cleanedForm['replicates'] = {
        germes: replicates.germes.map(this.parseNumber),
        mortes: replicates.mortes.map(this.parseNumber),
        non_germes: replicates.nonGermes.map(this.parseNumber),
        last_replicate: replicates.last_replicate || false
      };
    }

    if (this.code === 'synth') {
      cleanedForm['replicates'] = {
        total_count_germinated: this.parseNumber(replicates.total_count_germinated),
        total_count_dead: this.parseNumber(replicates.total_count_dead),
        total_count_viable: this.parseNumber(replicates.total_count_viable)
      };
    }

    return cleanedForm;
  }

  private parseNumber(value: any): number | null {
    return value === '' || value === null || isNaN(Number(value)) ? null : Number(value);
  }

  initReplicateFields(count: number) {
    this.replicateLabels = Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));

    ['germes', 'mortes', 'nonGermes'].forEach(name => {
      if (!this.replicatesForm.contains(name)) {
        this.replicatesForm.addControl(name, this.fb.array([]));
      }
      const array = this.replicatesForm.get(name) as FormArray;
      array.clear();
      for (let i = 0; i < count; i++) {
        array.push(this.fb.control(''));
      }
    });
  }

  loadReplicateDates(): void {
    if (!this.idTest) return;
    this.api.getReplicateDatesByTest(this.idTest).subscribe({
      next: (dates: string[]) => {
        this.replicateDatesUsed = dates.map(date => date.slice(0, 10));
      },
      error: () => console.warn("Erreur chargement des dates de réplicats.")
    });
  }

  loadReplicatesForForm(idAction: number): void {
    this.api.getActionReplicate(idAction).subscribe({
      next: (replicates) => {
        this.replicates_for_form = JSON.parse(JSON.stringify(replicates));
        console.log("📥 Données pré-remplies :", this.replicates_for_form);
        const isObject = replicates && !Array.isArray(replicates);
      const isSynth = this.code === 'synth';
        if (this.code === 'synth' && replicates) {
          if (isSynth && isObject) {
            const {
              total_count_germinated,
              total_count_dead,
              total_count_viable
            } = replicates;
    
            this.replicatesForm.patchValue({
              total_count_germinated: total_count_germinated ?? null,
              total_count_dead: total_count_dead ?? null,
              total_count_viable: total_count_viable ?? null
            });
          }
        }
      },
      error: (err) => console.error("Erreur chargement des réplicats :", err)
    });
  }

  isReplicateDateUsed(): boolean {
    const selectedDate = this.germinationForm.get('date_start')?.value;
    if (!selectedDate || this.dialogData?.edit) return false;
    const isoDate = new Date(selectedDate).toISOString().slice(0, 10);
    return this.code === 'svr' && this.replicateDatesUsed.includes(isoDate);
  }

  private storeInitialFormState(): void {
    this.initialActionFormState = this.germinationForm.getRawValue();
    this.initialReplicatesFormState = this.replicatesForm.getRawValue();

    this.initialCode = this.code;
    this.initialCodeId = this.codeId;
    this.initialScarTypeCode = this.scarTypeCode;
    this.initialHideTypeField = this.hideTypeField;
  }

  onReset(): void {
    if (!this.initialActionFormState) {
      return;
    }

    this.dialogService
      .confirmDialog({
        message: this.dialogData?.edit
          ? 'Étes vous certain de vouloir réinitialiser les modifications de cette action ?'
          : 'Étes vous certain de vouloir réinitialiser cette action ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.code = this.initialCode;
        this.codeId = this.initialCodeId;
        this.scarTypeCode = this.initialScarTypeCode;
        this.hideTypeField = this.initialHideTypeField;

        this.germinationForm.reset(this.initialActionFormState);
        this.replicatesForm.reset(this.initialReplicatesFormState);

        if (this.initialHideTypeField) {
          this.germinationForm.get('id_action_type')?.disable();
        } else {
          this.germinationForm.get('id_action_type')?.enable();
        }

        this.germinationForm.markAsPristine();
        this.germinationForm.markAsUntouched();
        this.germinationForm.updateValueAndValidity();

        this.replicatesForm.markAsPristine();
        this.replicatesForm.markAsUntouched();
        this.replicatesForm.updateValueAndValidity();
      });
  }

  private getSelectedActionTypeLabel(): string {
    const selectedActionType = this.germinationForm.get('id_action_type')?.value;

    return (
      this.dialogData?.actionTypeLabel ||
      selectedActionType?.label_default ||
      selectedActionType?.label_fr ||
      selectedActionType?.label ||
      selectedActionType?.mnemonique ||
      ''
    );
  }

  private getActionCancelLabel(): string {
    const sowingCode = this.dialogData?.sowingCode || '';
    const actionTypeLabel = this.getSelectedActionTypeLabel();

    if (!this.dialogData?.edit && !actionTypeLabel) {
      return '';
    }

    if (sowingCode && actionTypeLabel) {
      return `${sowingCode} - ${actionTypeLabel}`;
    }

    if (this.dialogData?.edit && sowingCode) {
      return sowingCode;
    }

    if (actionTypeLabel) {
      return actionTypeLabel;
    }

    return '';
  }

  private showActionCancelToaster(): void {
    const actionLabel = this.getActionCancelLabel();
    const dateStart = this.formatDateForToaster(this.germinationForm.get('date_start')?.value);
    const hasDateStart = dateStart !== '-';

    if (this.dialogData?.edit) {
      this.toast.translateToaster(
        'info',
        `Action ${this.toBoldItalicText(actionLabel)} non modifiée${hasDateStart ? `. Date de début : ${this.toBoldItalicText(dateStart)}` : ''}`
      );

      return;
    }

    if (actionLabel) {
      this.toast.translateToaster(
        'info',
        `Action ${this.toBoldItalicText(actionLabel)} non créée${hasDateStart ? `. Date de début : ${this.toBoldItalicText(dateStart)}` : ''}`
      );

      return;
    }

    this.toast.translateToaster(
      'info',
      `Création de l’action annulée${hasDateStart ? `. Date de début : ${this.toBoldItalicText(dateStart)}` : ''}`
    );
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
          this.showActionCancelToaster();
          this.dialogRef.close();
        }
      }); 
  }
}
