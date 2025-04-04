import { Component, Inject , OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DataService } from '../../services/data.service';
import { MaterialFormService } from '../../material/material-form/material-form.service';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';


@Component({
    selector: 'app-material-modal',
    templateUrl: './material-modal.component.html',
    styleUrls: ['./material-modal.component.css']
})
export class MaterialModalComponent implements OnInit {
    materialForm: FormGroup;
    idHarvest: number | null = null;
    harvest: any;
    codeMaterialExists: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<MaterialModalComponent>,
        public exsituFormService: ExsituFormService,
        public api: DataService,
        public materialFormService: MaterialFormService,
        private fb: FormBuilder
    ){

    }

    ngOnInit(): void {
        this.initializeMaterialForm();
        this.materialForm.get('code_material')?.valueChanges.subscribe(value => {
            if (this.exsituFormService.mode === 'add' || (this.materialFormService.code_material !== null && value !== this.materialFormService.code_material)) {
                this.checkCodeMaterial(value);
            } else {
                this.codeMaterialExists = false;
            }
        });
    }

    private initializeMaterialForm() {
        this.materialForm = this.materialFormService.form
    }

    checkCodeMaterial(codeMaterial: string): void {
        if (codeMaterial) {
          this.api.checkCodeMaterial(codeMaterial).subscribe(
            response => {
              this.codeMaterialExists = response.exists;
            },
            error => {
              console.error('Erreur lors de la vérification du code material', error);
            }
          );
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    submetData(){
        let finalForm = this.formatDataFormHarvest();   
        console.log('final',finalForm);
         
        this.materialFormService.submitOccurrence(finalForm);
        this.close()
    }

    private formatDataFormHarvest() {
        const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));
        
        if(finalForm.taxons)
          finalForm.taxons = finalForm.taxons.map(taxon => taxon.parentFormControl.cd_nom);
        delete finalForm.taxonInput;
        
    
        return finalForm;
    }
}
