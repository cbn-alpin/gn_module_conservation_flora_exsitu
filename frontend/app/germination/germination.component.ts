import { Component, OnInit, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { GerminationFormService } from './germination-form.service';
import { ConfigService } from '../services/config.service';
import { ActivatedRoute } from '@angular/router';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, switchMap, debounceTime } from 'rxjs/operators';
import { DataService } from '../services/data.service';
import { CommonService } from '@geonature_common/service/common.service';  
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


interface Germination {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}
@Component({
  selector: 'app-germination',
  templateUrl: './germination.component.html',
  styleUrls: ['./germination.component.scss']
})
export class GerminationComponent implements OnInit {

 
  
  germinationForm: FormGroup;
  dataSource = new MatTableDataSource<Germination>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];
  codeT: any= 'ger'
  idGermination:any;
  idStorage:any;
  public observers_list_code;
  additionalDataForm: FormGroup;
  formsDefinition;

  codeTest = new FormControl();
  filteredTest$: Observable<string[]>;

  constructor(
    public router: Router,
    public dialogRef: MatDialogRef<GerminationComponent>,
    public germinationFormService: GerminationFormService,
    public cfg: ConfigService,
    private route: ActivatedRoute,
    private exsituFormService: ExsituFormService,
    private fb: FormBuilder,
    public api: DataService,
    @Inject(MAT_DIALOG_DATA) public data: any,

    private _commonService: CommonService,


   ) {
    this.germinationForm = this.fb.group({
      code: ['', Validators.required],
      // id_test_parent: ['', Validators.required],  
      // id_material: ['', Validators.required],    
      id_actor: [''],
      // id_test_type: [''],
      seed_initial_count: [null, Validators.required],                         
      replicate_count: [1, Validators.required],                       
      id_substrate: [null, Validators.required],
      id_support: [null, Validators.required],
      remarks: [''],
      additional_data: this.fb.group({}),
      
    });
  }
  patchForm(test: any): void {
    this.germinationForm.patchValue({
      code: test.code || '',
      id_storage: this.idStorage || '',                             
      id_material: test.id_material || '',
      id_actor: test.id_actor ? [ { id_role: test.id_actor } ] : [],
      seed_initial_count: test.seed_initial_count ?? null,
      replicate_count: test.replicate_count ?? null,
      id_substrate: test.id_substrate ?? null,
      id_support: test.id_support ?? null,
      remarks: test.remarks || ''
    });
  
    if (test.additional_data && this.additionalDataForm) {
      Object.keys(test.additional_data).forEach(key => {
        if (this.additionalDataForm.contains(key)) {
          this.additionalDataForm.get(key)?.patchValue(test.additional_data[key]);
        }
      });
    }
  }
  

  idMaterial: number;
  idSeed: number;
  ngOnInit(): void {
    this.filteredTest$ = this.codeTest.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(value => this.api.getMaterialsCodeParent(this.exsituFormService.idHarvest).pipe(
        map(materials => materials.filter(material =>
          material.code_material.toLowerCase().includes(value.toLowerCase())
        ))
      ))
    );
  
    this.idMaterial = this.exsituFormService.idMaterial;
    this.idSeed = this.exsituFormService.idSeed;

    this.dataSource.data = [];
  
    this.observers_list_code = this.cfg.getObsCode();
  
    this.additionalDataForm = this.germinationForm.get('additional_data') as FormGroup;
    this.formsDefinition = this.cfg.getModuleConfigExsitu()['harvest_form']['additional_data'];
  
    if (this.formsDefinition && this.additionalDataForm) {
      this.formsDefinition.forEach(field => {
        const fieldName = field.attribut_name;
        this.additionalDataForm.addControl(fieldName, this.fb.control(''));
      });
    }
  
    this.getTestByCode(this.codeT);
  
    if (this.data?.edit && this.data?.test) {
      console.log("📦 Test reçu pour édition :", this.data.test);
      this.patchForm(this.data.test);
    }

    this.exsituFormService.id_storage.subscribe((id) => {
      this.idStorage = id;
    });
    console.log(this.idStorage)
  }
  
  getTestByCode(code :any): void {
    this.api.getActionByCode(code).subscribe({
      next: (test) => {
        this.idGermination=test.id_nomenclature
        console.log(this.idGermination)
        console.log(test)
        console.log(test.id_nomenclature)
      },
      error: (err) => {
        console.error("Erreur lors du chargement du code :", err);
      }
    });
  }
  
  private formatDataFormHarvest() {
    const finalForm = JSON.parse(JSON.stringify(this.germinationForm.value));

    const additionalFields = this.formsDefinition || [];

    if (finalForm.additional_data) {
      const cleanedAdditionalData = {};
    
      additionalFields.forEach(field => {
        const key = field.attribut_name;
        const value = finalForm.additional_data[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedAdditionalData[key] = value;
        }
      });
    
      if (Object.keys(cleanedAdditionalData).length > 0) {
        finalForm.additional_data = cleanedAdditionalData;
      } else {
        delete finalForm.additional_data;
      }
    }
    if(this.codeTest){
      finalForm.code_parent = this.codeTest.value;
    }
    finalForm['id_actor'] = finalForm['id_actor'][0].id_role;
    finalForm['id_material'] = this.idMaterial;
    finalForm['id_test_type'] = this.idGermination;
    finalForm['id_storage'] = this.idStorage;
    
    return finalForm;

  }
  onDelete(): void {
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onView(): void {
  }

  onEdit(): void {
  }
  onSubmit(): void {
    const finalForm = this.formatDataFormHarvest();
  
    if (!this.idMaterial) {
      console.error("idMaterial est manquant !");
      return;
    }
  
    if (this.data?.edit && this.data?.test?.id_test) {
      this.api.updateTest(this.idMaterial, this.data.test.id_test, finalForm).subscribe({
        next: (res) => {
          this._commonService.translateToaster('success', 'Test mis à jour avec succès');
          this.dialogRef.close(res);
        },
        error: (err) => {
          console.error("Erreur lors de la mise à jour du test :", err);
        }
      });
    } else {
      this.api.createTest(finalForm, this.idMaterial).subscribe({
        next: (res) => {
          this._commonService.translateToaster('info', 'Test créé avec succès');
          this.dialogRef.close(res);
        },
        error: (err) => {
          console.error("Erreur lors de la création du test :", err);
        }
      });
    }
  }
  
}
