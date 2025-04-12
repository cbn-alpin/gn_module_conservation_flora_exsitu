import { Component, Input, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormControl,
  } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CommonService } from '@geonature_common/service/common.service';

@Component({
    selector: 'cfe-seed-description',
    templateUrl: './seed-description.component.html',
    styleUrls: ['./seed-description.component.css']
})
export class SeddDescriptionComponent implements OnInit {
    public edit: boolean = false
    public seedForm: FormGroup;
    constructor(
        private dataService: DataService,
        private _commonService: CommonService,
        public dialogRef: MatDialogRef<SeddDescriptionComponent>,
        private fb: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: { id: number, mode: string, seedData: any }
    ){

    }
    ngOnInit(): void {              
        this.edit = this.data.mode === 'edit';
        this.buildForm(this.data.seedData || {});
    }


    private buildForm(seedData: any): void {
        const defaultValues = {
          id_material: this.data.id,
          length: seedData.length ?? null,
          width: seedData.width ?? null,
          thickness: seedData.thickness ?? null,
          total_count: seedData.total_count ?? null,
          total_mass: seedData.total_mass ?? null,
          sample_count: seedData.sample_count ?? null,
          sample_mass: seedData.sample_mass ?? null,
          has_photo: seedData.has_photo ?? false,
          remarks: seedData.remarks ?? ''
        };
    
        this.seedForm = this.fb.group({
          id_material: [defaultValues.id_material, Validators.required],
          length: [defaultValues.length],
          width: [defaultValues.width],
          thickness: [defaultValues.thickness],
          total_count: [defaultValues.total_count],
          total_mass: [defaultValues.total_mass],
          sample_count: [defaultValues.sample_count],
          sample_mass: [defaultValues.sample_mass],
          has_photo: [defaultValues.has_photo],
          remarks: [defaultValues.remarks]
        });
    }

    submetData(){
        const formData = this.seedForm.value;
        this.dataService.addSeedToMaterial(this.data.id, formData).subscribe(
            (response)=>{
                console.log(response);
                this._commonService.translateToaster('info', 'Semence ajoutée avec succès');
                this.close()
            },
            (error) => {
                this._commonService.translateToaster('warning', 'Erreur lors de l\'ajout de la semence');
            }
        )
        
    }

    close(): void {
        this.dialogRef.close();
    }

}