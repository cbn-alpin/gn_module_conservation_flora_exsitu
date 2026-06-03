import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigService } from '../services/config.service';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';

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

  constructor(
    private fb: FormBuilder,
    public router: Router,
    public dialogRef: MatDialogRef<ActionComponent>,
    public cfg: ConfigService,
    public api: DataService,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private exsituFormService: ExsituFormService,
    private dialogService: DialogService
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
  
  onSubmit(): void {
    if (!this.germinationForm.valid) return;
    const finalForm = this.formatDataFormAction();

    if (this.dialogData?.edit && this.dialogData?.id_action) {
      this.api.updateActionData(this.dialogData.id_action, finalForm).subscribe({
        next: (res) => this.dialogRef.close(res),
        error: (err) => console.error("Erreur modification action :", err)
      });
    } else {
      const request$ = this.idSowing
        ? this.api.addActionBySowing(this.idSowing, finalForm)
        : this.api.addActionByTest(this.idTest!, finalForm);

      request$.subscribe({
        next: (res) => this.dialogRef.close(res),
        error: (err) => console.error("Erreur création action :", err)
      });
    }
  }

  private formatDataFormAction() {
    const rawForm = JSON.parse(JSON.stringify(this.germinationForm.value));
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
