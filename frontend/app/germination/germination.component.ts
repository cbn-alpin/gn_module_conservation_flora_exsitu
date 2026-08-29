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
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';


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
  public supportOptions: any[] = [];
  public substrateOptions: any[] = [];

  public codeMaterial: string | null = null;

  private initialFormState: any = null;
  private cancelDialogOpen = false;

  private readonly supportOrder = [
    'Boite de pétri',
    'Pastilles de Tourbe',
    'Terrine',
    'Autre'
  ];

  private readonly substrateOrder = [
    'Papier filtre',
    'Sable',
    'Terreau',
    'Tourbe'
  ];

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
    private dialogService: DialogService,


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


private loadAssociatedMaterialCode(): void {
  if (!this.idMaterial) {
    return;
  }

  this.api
    .getMaterialInfos(this.idMaterial)
    .subscribe({
      next: (material) => {
        this.codeMaterial =
          material?.code_material || null;
      },

      error: () => {
        this.codeMaterial = null;
      }
    });
}


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
  
    this.idMaterial =
      this.exsituFormService.idMaterial;

    this.idSeed =
      this.exsituFormService.idSeed;

    this.loadAssociatedMaterialCode();

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
    this.loadSupportOptions();
    this.loadSubstrateOptions();
  
    if (this.data?.edit && this.data?.test) {
      console.log(
        '📦 Test reçu pour édition :',
        this.data.test
      );

      this.patchForm(this.data.test);
    }


    /*
    * En création :
    * mémorise les valeurs vides et les valeurs par défaut.
    *
    * En modification :
    * mémorise les valeurs chargées depuis le test existant.
    */
    this.initialFormState =
      JSON.parse(
        JSON.stringify(
          this.germinationForm.getRawValue()
        )
      );


    this.exsituFormService.id_storage.subscribe((id) => {
      this.idStorage = id;
    });

    this.dialogRef.disableClose = true;

    this.dialogRef.backdropClick().subscribe(() => {
      this.onCancel();
    });

    this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.onCancel();
      }
    });

    console.log(this.idStorage)
  }

  private loadSupportOptions(): void {
    this.api.getNomenclaturesByTypeCode('CFE_TG_SUPPORT').subscribe({
      next: (supports) => {
        this.supportOptions = supports || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des supports :', err);
      }
    });
  }

  public getOrderedSupportOptions(): any[] {
    const orderMap = new Map(
      this.supportOrder.map((label, index) => [label, index])
    );

    return [...this.supportOptions].sort((a, b) => {
      const labelA = a?.label_default || a?.label_fr || '';
      const labelB = b?.label_default || b?.label_fr || '';

      const indexA = orderMap.has(labelA) ? orderMap.get(labelA)! : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(labelB) ? orderMap.get(labelB)! : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return String(labelA).localeCompare(String(labelB), 'fr');
    });
  }

  private loadSubstrateOptions(): void {
    this.api.getNomenclaturesByTypeCode('CFE_TEST_SUBSTRATE').subscribe({
      next: (substrates) => {
        this.substrateOptions = substrates || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des substrats :', err);
      }
    });
  }

  public getOrderedSubstrateOptions(): any[] {
    const orderMap = new Map(
      this.substrateOrder.map((label, index) => [label, index])
    );

    return [...this.substrateOptions].sort((a, b) => {
      const labelA = a?.label_default || a?.label_fr || '';
      const labelB = b?.label_default || b?.label_fr || '';

      const indexA = orderMap.has(labelA) ? orderMap.get(labelA)! : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(labelB) ? orderMap.get(labelB)! : Number.MAX_SAFE_INTEGER;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return String(labelA).localeCompare(String(labelB), 'fr');
    });
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
    if (
      Array.isArray(finalForm['id_actor']) &&
      finalForm['id_actor'].length > 0
    ) {
      finalForm['id_actor'] =
        finalForm['id_actor'][0]?.id_role ?? null;
    } else {
      finalForm['id_actor'] = null;
    }

    finalForm['id_material'] = this.idMaterial;
    finalForm['id_test_type'] = this.idGermination;
    finalForm['id_storage'] = this.idStorage;
    
    return finalForm;

  }
  onDelete(): void {
  }


  onReset(): void {
    if (!this.initialFormState) {
      return;
    }

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'wb_sunny',
        variant: 'germination-reset',
        entityLabel: this.data?.edit
          ? 'les modifications de ce test de germination'
          : 'cette fiche de germination',
        disableClose: false
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.germinationForm.reset(
          JSON.parse(
            JSON.stringify(
              this.initialFormState
            )
          )
        );

        this.germinationForm.markAsPristine();
        this.germinationForm.markAsUntouched();
        this.germinationForm.updateValueAndValidity();
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
      this.germinationForm.get('code')?.value ||
      this.initialFormState?.code ||
      '';

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'wb_sunny',
        variant: 'germination-exit',
        entityLabel: currentCode
          ? 'le test de germination'
          : 'cette fiche de germination',
        entityCode: currentCode || undefined,
        disableClose: false
      })
      .subscribe((yes) => {
        this.cancelDialogOpen = false;

        if (yes) {
          if (this.data?.edit) {
            this._commonService.translateToaster(
              'info',
              currentCode
                ? `Test de germination ${this.toBoldText(currentCode)} non modifié`
                : 'Test de germination non modifié'
            );
          } else if (currentCode) {
            this._commonService.translateToaster(
              'info',
              `Test de germination ${this.toBoldText(currentCode)} non créé`
            );
          } else {
            this._commonService.translateToaster(
              'info',
              'Création du test de germination annulée'
            );
          }

          this.dialogRef.close();
        }
      });
  }

  onView(): void {
  }

  onEdit(): void {
  }
  onSubmit(): void {
    if (!this.idMaterial) {
      console.error("idMaterial est manquant !");
      return;
    }

    const currentCode =
      this.germinationForm.get('code')?.value
      || '';

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'wb_sunny',
        variant: 'germination-save',
        entityLabel: this.data?.edit
          ? 'les modifications du test de germination'
          : 'le test de germination',
        entityCode: currentCode || undefined,
        disableClose: false
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        const finalForm =
          this.formatDataFormHarvest();

        if (
          this.data?.edit
          && this.data?.test?.id_test
        ) {
          this.api
            .updateTest(
              this.idMaterial,
              this.data.test.id_test,
              finalForm
            )
            .subscribe({
              next: (res) => {
                this._commonService.translateToaster(
                  'success',
                  'Test mis à jour avec succès'
                );
                this.dialogRef.close(res);
              },
              error: (err) => {
                console.error(
                  "Erreur lors de la mise à jour du test :",
                  err
                );
              }
            });
        } else {
          this.api
            .createTest(
              finalForm,
              this.idMaterial
            )
            .subscribe({
              next: (res) => {
                this._commonService.translateToaster(
                  'info',
                  'Test créé avec succès'
                );
                this.dialogRef.close(res);
              },
              error: (err) => {
                console.error(
                  "Erreur lors de la création du test :",
                  err
                );
              }
            });
        }
      });
  }
  
}
