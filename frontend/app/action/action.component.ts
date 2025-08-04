import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute,Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigService } from '../services/config.service';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { MatDialog } from '@angular/material/dialog';
import { ReplicatesModalComponent } from '../replicates/replicates-modal.component';

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
  public idTest: number;
  replicateCount : any;
  germinationForm: FormGroup;
  codeNomenclatureType: any
  replicates_for_form: any = null;

  replicates: any[] = [];
  dataSource = new MatTableDataSource<Action>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];
  public isGermination: boolean =  true;

  actions = ['Suivi Test', 'Stérilisation', 'Scarification', 'Stratification', 'Traitement'];
  code: any = '';
  codeId: any = 'scar';
  type: any;
  hideTypeField = false;
  scarTypeCode: any; 
  replicatesForm: FormGroup;
  replicateLabels: string[] = [];
  replicateDatesUsed: string[] = [];
  public actionTypes: any[] = [];


  constructor(
    private fb: FormBuilder,
    public router: Router,
    public dialogRef: MatDialogRef<ActionComponent>,
    public cfg: ConfigService,
    public api: DataService,
    private dialog: MatDialog,
    private route: ActivatedRoute,

    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private exsituFormService: ExsituFormService
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
  }

  get actionsList(): FormArray {
    return this.germinationForm.get('actionsList') as FormArray;
  }

  ngOnInit(): void {
    this.dataSource.data = [];
    this.observers_list_code = this.cfg.getObsCode();
    this.idTest = this.dialogData?.id_test ?? null;
    const url = this.router.url;

    if (url.includes('viability')) {
      this.codeNomenclatureType = 'CFE_ACTION_VIA_TYPE';
    } else if (url.includes('germination')) {
      this.codeNomenclatureType = 'CFE_ACTION_TYPE';
    } else {
      this.codeNomenclatureType = 'CFE_ACTION_TYPE'; // fallback par défaut
    }
  
    console.log("📍 Type d'action détecté :", this.codeNomenclatureType);
  
    
    // Ajout des champs supplémentaires dynamiques
    if (this.formsDefinition && this.additionalDataForm) {
      this.formsDefinition.forEach(field => {
        const fieldName = field.attribut_name;
        this.additionalDataForm.addControl(fieldName, this.fb.control(''));
      });
    }
  
    // Initialiser le formulaire de réplicats
    this.replicatesForm = this.fb.group({
      germes: this.fb.array([]),
      mortes: this.fb.array([]),
      nonGermes: this.fb.array([]),
      last_replicate: [false]
    });
  
    // Suivi de l’action type (tra, scar, svr...)
    this.germinationForm.controls['id_action_type']?.valueChanges.subscribe(value => {
      if (value) {
        const codeId = value.id_nomenclature || value;
        this.codeId = codeId;
        this.getActionByCode(codeId);
        console.log("🔍 actiontypeCode :", this.codeId);
      }
    });
  
    // Suivi du type de scarification
    this.germinationForm.controls['id_scarification_type']?.valueChanges.subscribe(value => {
      if (value) {
        const id = value.id_nomenclature || value;
        this.api.getActionByCode(id).subscribe({
          next: (result) => {
            this.scarTypeCode = result.cd_nomenclature;
            console.log("✅ scarTypeCode (texte) :", this.scarTypeCode);
          },
          error: (err) => {
            console.error("❌ Erreur scarTypeCode :", err);
          }
        });
      }
    });
  
    // Mode édition
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
  
      if (action?.id_scarification_type) {
        const scarTypeCode = action.id_scarification_type.id_nomenclature || action.id_scarification_type;
        this.getActionByCode(scarTypeCode);
      } else {
        this.getActionByCode(code);
      }
  
      // Charger les réplicats après le code
      if (this.dialogData?.id_action) {
        this.loadReplicatesForForm(this.dialogData.id_action);
      } else {
        console.warn("⚠️ id_action manquant, impossible de charger les réplicats");
      }
          }
  
    if (this.idTest) {
      this.loadTestDetails();
    }
  
  }
  
  
  loadTestDetails(): void {
    this.api.getTestWithLabels(this.idTest).subscribe({
      next: (test) => {
        console.log(" Test chargé :", test);
        this.replicateCount =  test.replicate_count
        this.replicates = test.replicates;

        console.log(this.replicateCount)
      },
      error: (err) => {
        console.error(" Erreur lors du chargement du test :", err);
      }
    });
  }
  
  getActionByCode(id_nomenclature: number): void {
    this.api.getActionByCode(id_nomenclature).subscribe({
      next: (result) => {
        this.code = result.cd_nomenclature;
        if (this.code === 'svr') {
          this.initReplicateFields(this.replicateCount);
          this.loadReplicateDates(); 


        }
        else if (this.code === 'synth') {
          this.replicatesForm.addControl('total_count_germinated', this.fb.control(null));
          this.replicatesForm.addControl('total_count_dead', this.fb.control(null));
          this.replicatesForm.addControl('total_count_viable', this.fb.control(null));
        }
        
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement du code :", err);
      }
    });
  }

  addNewAction(): void {
    if (!this.germinationForm.valid) return;

    const finalForm = this.formatDataFormAction();

    this.api.addActionByTest(this.idTest, finalForm).subscribe({
      next: (res) => {
        console.log('✅ Action enregistrée :', res);

        this.actionAdded.emit(res); 
        this.germinationForm.reset();
        this.additionalDataForm.reset();

        this.germinationForm.patchValue({
          id_actor: [],
          id_action_type: null
        });

        this.germinationForm.get('id_action_type')?.enable();
        this.hideTypeField = false;
        this.code = '';
      },
      error: (err) => {
        console.error("❌ Erreur lors de l'ajout de l'action :", err);
      }
    });
  }
  private parseNumber(value: any): number | null {
    return value === '' || value === null || isNaN(Number(value)) ? null : Number(value);
  }
  

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.germinationForm.valid) return;
  
    const finalForm = this.formatDataFormAction();
  
    if (this.dialogData?.edit && this.dialogData?.id_action) {
      this.api.updateActionData(this.dialogData.id_action, finalForm).subscribe({
        next: (res) => {
          console.log('✅ Action mise à jour :', res);
          this.dialogRef.close(res); 
        },
        error: (err) => {
          console.error("❌ Erreur lors de la modification de l'action :", err);
        }
      });
    } else {
      // création
      this.api.addActionByTest(this.idTest, finalForm).subscribe({
        next: (res) => {
          console.log('✅ Action créée :', res);
          this.dialogRef.close(res); 
        },
        error: (err) => {
          console.error("❌ Erreur lors de la création de l'action :", err);
        }
      });
    }
    
  }
  

  private formatDataFormAction() {
    const rawForm = JSON.parse(JSON.stringify(this.germinationForm.value));
    const cleanedForm = {};
  
    const allowedFields = [
      'id_test',
      'id_sowing',
      'date_start',
      'date_end',
      'id_actor',
      'id_action_type',
      'id_scarification_type',
      'id_scarification_mecanique',
      'temperature_light',
      'temperature_shadow',
      'hour_count_light',
      'hour_count_shadow',
      'id_water_type',
      'duration_water',
      'id_tool',
      'id_chemical_liquid',
      'id_liquid_treatment',
      'duration_chemical_liquid',
      'concentration_chemical_liquid',
      'remarks',
      'additional_data'
    ];
  
    const additionalFields = this.formsDefinition || [];
    const additionalData = rawForm.additional_data || {};
    const cleanedAdditionalData = {};
    
  
    additionalFields.forEach(field => {
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
    const scarificationType = this.germinationForm.value.id_scarification_type;
    rawForm.id_scarification_type = this.germinationForm.value.id_scarification_type?.id_nomenclature || this.germinationForm.value.id_scarification_type || null;

  
    // ✅ Champs classiques
    allowedFields.forEach(field => {
      if (rawForm[field] !== undefined) {
        cleanedForm[field] = rawForm[field];
      }
    });
  
      // ✅ Suivi réplicats
    const replicates = this.replicatesForm?.value;
    if (this.code === 'svr' && replicates && replicates.germes?.length) {
      cleanedForm['replicates'] = {
        germes: replicates.germes.map(this.parseNumber),
        mortes: replicates.mortes.map(this.parseNumber),
        non_germes: replicates.nonGermes.map(this.parseNumber),
        last_replicate: replicates.last_replicate || false
      };
    }
    
    

    // ✅ Synthèse de suivi
    if (this.code === 'synth') {
      cleanedForm['replicates'] = {
        total_count_germinated: this.parseNumber(replicates.total_count_germinated),
        total_count_dead: this.parseNumber(replicates.total_count_dead),
        total_count_viable: this.parseNumber(replicates.total_count_viable)
      };
    }
    
    return cleanedForm;
  }
  

  initReplicateFields(count: number) {
    this.replicateLabels = Array.from({ length: count }, (_, i) =>
      String.fromCharCode(65 + i)
    );
  
    // Crée les FormArray s'ils n'existent pas
    if (!this.replicatesForm.contains('germes')) {
      this.replicatesForm.addControl('germes', this.fb.array([]));
    }
    if (!this.replicatesForm.contains('mortes')) {
      this.replicatesForm.addControl('mortes', this.fb.array([]));
    }
    if (!this.replicatesForm.contains('nonGermes')) {
      this.replicatesForm.addControl('nonGermes', this.fb.array([]));
    }
  
    // Crée les champs synthèse si besoin
    if (!this.replicatesForm.contains('total_count_germinated')) {
      this.replicatesForm.addControl('total_count_germinated', this.fb.control(null));
    }
    if (!this.replicatesForm.contains('total_count_dead')) {
      this.replicatesForm.addControl('total_count_dead', this.fb.control(null));
    }
    if (!this.replicatesForm.contains('total_count_viable')) {
      this.replicatesForm.addControl('total_count_viable', this.fb.control(null));
    }
  
    const germes = this.replicatesForm.get('germes') as FormArray;
    const mortes = this.replicatesForm.get('mortes') as FormArray;
    const nonGermes = this.replicatesForm.get('nonGermes') as FormArray;
  
    germes.clear();
    mortes.clear();
    nonGermes.clear();
  
    for (let i = 0; i < count; i++) {
      germes.push(this.fb.control(''));
      mortes.push(this.fb.control(''));
      nonGermes.push(this.fb.control(''));
    }
  }
  

  loadReplicateDates(): void {
    if (!this.idTest) return;
  
    this.api.getReplicateDatesByTest(this.idTest).subscribe({
      next: (dates: string[]) => {
        this.replicateDatesUsed = dates.map(date => date.slice(0, 10));
        console.log("📆 Dates déjà utilisées pour ce test :", this.replicateDatesUsed);
      },
      error: () => {
        console.warn("Erreur lors du chargement des dates de suivi réplicat.");
      }
    });
  }

  loadReplicatesForForm(idAction: number): void {
    this.api.getActionReplicate(idAction).subscribe({
      next: (replicates) => {
        console.log("✅ Réplicats chargés :", replicates);
        this.replicates_for_form = replicates;
  
        // ✅ Met ici le log une fois que les données sont bien chargées
        console.log("📥 Données reçues :", this.replicates_for_form);
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement des réplicats :", err);
      }
    });
  }
  
  
  
isReplicateDateUsed(): boolean {
  const selectedDate = this.germinationForm.get('date_start')?.value;
  if (!selectedDate || this.dialogData?.edit) return false; // <== ⚠️ ignore en mode édition
  const isoDate = new Date(selectedDate).toISOString().slice(0, 10);
  return this.code === 'svr' && this.replicateDatesUsed.includes(isoDate);
}

  
  
}
