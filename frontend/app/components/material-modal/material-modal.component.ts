import { Component, Inject , OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DataService } from '../../services/data.service';
import { MaterialFormService } from '../../material/material-form/material-form.service';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { ConfigService } from '../../services/config.service';
import { Observable } from 'rxjs';
import { map, startWith, switchMap, debounceTime } from 'rxjs/operators';
import { DialogService } from '../confirm-dialog/confirm-dialog.service';


@Component({
    selector: 'app-material-modal',
    templateUrl: './material-modal.component.html',
    styleUrls: ['./material-modal.component.css']
})
export class MaterialModalComponent implements OnInit {
    materialForm: FormGroup;
    codeMaterialExists: boolean = false;
    allowMultipleTaxons: boolean = false;
    additionalDataForm: FormGroup;
    formsDefinition;
    codeMaterialControl = new FormControl();
    filteredMaterials$: Observable<string[]>;

    private initialFormState: any = null;
    private initialParentCode: string = '';

    constructor(
        public dialogRef: MatDialogRef<MaterialModalComponent>,
        public exsituFormService: ExsituFormService,
        public api: DataService,
        public materialFormService: MaterialFormService,
        private constants: ConstantsService,
        public cfg: ConfigService,
        private dialogService: DialogService
    ){

    }

    ngOnInit(): void {
        this.initializeMaterialForm();    
        this.filteredMaterials$ = this.codeMaterialControl.valueChanges.pipe(
              startWith(''),
              debounceTime(300),
              switchMap(value => this.api.getMaterialsCodeParent(this.exsituFormService.idHarvest).pipe(
                map(materials => materials.filter(material =>
                  material.code_material.toLowerCase().includes(value.toLowerCase())
                ))
              ))
        ); 

        this.additionalDataForm = this.materialForm.get('additional_data') as FormGroup;
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['material_form']['additional_data']; 
        this.materialForm.get('code_material')?.valueChanges.subscribe(value => {
            if (this.exsituFormService.mode === 'add' || (this.materialFormService.code_material !== null && value !== this.materialFormService.code_material)) {
                this.checkCodeMaterial(value);        
            } else {
                this.codeMaterialExists = false;
            }
        });
        this.materialForm.controls['id_material_type'].valueChanges.subscribe(value => {   
            if(value) {
              this.api.getCodesNomenclature(value).subscribe({
                next: (code: string) => {
                  this.allowMultipleTaxons = this.constants.MULTIPLE_TAXON_CODES.includes(code);
                  if (!this.allowMultipleTaxons && this.materialFormService.taxons.length > 1) {
                    this.materialFormService.taxons.clear();
                  }
                },
                error: (error) => {
                  console.log(error);
                }
              });
            }
        });


        this.initialFormState =
          JSON.parse(
            JSON.stringify(
              this.materialForm.getRawValue()
            )
          );

        this.initialParentCode =
          this.codeMaterialControl.value ||
          this.initialFormState?.code_parent ||
          '';

        this.codeMaterialControl.setValue(
          this.initialParentCode,
          {
            emitEvent: false
          }
        );
    }

    private initializeMaterialForm() {
        this.materialForm = this.materialFormService.form
    }

    checkCodeMaterial(codeMaterial: string): void {
      if (codeMaterial) {
        this.api.checkCodeMaterial(codeMaterial).subscribe(
          response => {
            this.codeMaterialExists = response.exists;            
            const control = this.materialForm.get('code_material');
            if (this.codeMaterialExists) {
              control?.setErrors({ codeExists: true });
            }
          },
          error => {
            console.error('Erreur lors de la vérification du code material', error);
          }
        );
      }
    }


    onReset(): void {
      if (!this.initialFormState) {
        return;
      }

      const isEdit =
        !!this.materialFormService
          .occurrence
          .getValue();

      this.dialogService
        .confirmDialog({
          message: isEdit
            ? 'Êtes-vous certain de vouloir réinitialiser les modifications de ce matériel récolté ?'
            : 'Êtes-vous certain de vouloir réinitialiser cette fiche de matériel récolté ?'
        })
        .subscribe((yes) => {
          if (!yes) {
            return;
          }

          const formState =
            JSON.parse(
              JSON.stringify(
                this.initialFormState
              )
            );

          const initialTaxons =
            formState.taxons || [];

          delete formState.taxons;

          const taxonsArray =
            this.materialForm.get(
              'taxons'
            ) as FormArray;

          taxonsArray.clear();

          this.materialForm.reset(
            formState
          );

          initialTaxons.forEach(
            (taxon) => {
              taxonsArray.push(
                this.materialFormService
                  .createTaxonControl(
                    taxon.parentFormControl
                  )
              );
            }
          );

          this.codeMaterialControl.reset(
            this.initialParentCode
          );

          this.materialForm.markAsPristine();
          this.materialForm.markAsUntouched();
          this.materialForm.updateValueAndValidity();
        });
    }


    close(): void {
        this.materialFormService.occurrence.next(null);
        this.dialogRef.close();
    }

    onTaxonSelected(event: any) {     
      const selectedTaxon = event?.item;      
      if (!selectedTaxon) return;
      this.materialFormService.addTaxon(selectedTaxon, this.allowMultipleTaxons);
      event.preventDefault();
    }
    
    submetData(){
        let finalForm = this.formatDataFormHarvest();            
        this.materialFormService.submitOccurrence(finalForm);
        this.close()
    }

    private formatDataFormHarvest() {
        const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));

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

        if(this.codeMaterialControl){
          finalForm.code_parent = this.codeMaterialControl.value;
        }
        
        if(finalForm.taxons)
          finalForm.taxons = finalForm.taxons.map(taxon => taxon.parentFormControl.cd_nom);
        delete finalForm.taxonInput;
        
    
        return finalForm;
    }

    isValidTaxonSelected(): boolean {
      const val = this.materialForm?.controls?.taxonInput?.value;
      return val && typeof val === 'object' && 'cd_nom' in val;
    }
    
}
