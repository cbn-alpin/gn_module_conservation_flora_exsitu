import { Component, Input, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors, 
    ValidatorFn, FormControl, FormArray
  } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CommonService } from '@geonature_common/service/common.service';
import { DialogService } from '../confirm-dialog/confirm-dialog.service';
import { ConfigService } from '../../services/config.service';
import { ConstantsService } from '../../services/constants.service';
import { Observable, of, forkJoin } from 'rxjs';

@Component({
    selector: 'cfe-seed-description',
    templateUrl: './seed-description.component.html',
    styleUrls: ['./seed-description.component.css']
})
export class SeddDescriptionComponent implements OnInit {
    public edit: boolean = false
    public seedForm: FormGroup;
    additionalDataForm: FormGroup;
    formsDefinition;
    selectedFile: File | null = null;
    mediaTypeCode: string | null = null;
    mediaTypeId;
    showURLField: boolean = false;
    showPhotoField: boolean = false;
    mediaFileData
    mediaURLData
    selectedFiles: File[] = [];
    mediaUrlControls = new FormArray([]);
    existingPhotoMedias: any[] = [];
    existingUrlMedias: any[] = [];

    
    constructor(
        private dataService: DataService,
        private _commonService: CommonService,
        public dialogRef: MatDialogRef<SeddDescriptionComponent>,
        private fb: FormBuilder,
        private dialogService: DialogService,
        @Inject(MAT_DIALOG_DATA) public data: { id: number, mode: string, seedData: any },
        public cfg: ConfigService,
        public constants: ConstantsService
    ){

    }
    ngOnInit(): void {              
        this.edit = this.data.mode === 'edit';
        this.buildForm(this.data.seedData || {});
        this.additionalDataForm = this.seedForm.get('additional_data') as FormGroup;
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['seed_form']['additional_data'];
        this.seedForm.get('sample_count')?.valueChanges.subscribe(() => this.updateTotalCount());
        this.seedForm.get('sample_mass')?.valueChanges.subscribe(() => this.updateTotalCount());
        this.seedForm.get('total_mass')?.valueChanges.subscribe(() => this.updateTotalCount());

        this.seedForm.controls['id_media_type'].valueChanges.subscribe(value => {      
          if(value) {
              this.getCodesNomenclature(value)
          }
        });                
    }


    private buildForm(seedData: any): void {
        const defaultValues = {
          id_material: this.data.id,
          length: seedData.length ?? null,
          width: seedData.width ?? null,
          thickness: seedData.thickness ?? null,
          total_count: seedData.total_count ?? null,
          id_material_quality: seedData.id_material_quality ?? null,
          total_mass: seedData.total_mass ?? null,
          sample_count: seedData.sample_count ?? null,
          sample_mass: seedData.sample_mass ?? null,
          has_photo: seedData.has_photo ?? false,
          additional_data: seedData.additional_data ?? null,
          remarks: seedData.remarks ?? '',
          id_media_type: seedData.id_media_type ?? null,
        };

        if (this.edit && seedData.media?.length) {
          for (const media of seedData.media) {
            if (media.media_url) {
              this.existingUrlMedias.push(media.media_url);
              this.mediaUrlControls.push(new FormControl(media.media_url)); 
            } else if (media.media_file_name) {
              this.existingPhotoMedias.push(media.media_file_name);
            }
          }
        }
        
        this.seedForm = this.fb.group(
            {
                id_material: [defaultValues.id_material, Validators.required],
                length: [defaultValues.length],
                width: [defaultValues.width],
                thickness: [defaultValues.thickness],
                total_count: [defaultValues.total_count],
                id_material_quality: [defaultValues.id_material_quality],
                total_mass: [defaultValues.total_mass],
                sample_count: [defaultValues.sample_count],
                sample_mass: [defaultValues.sample_mass],
                has_photo: [defaultValues.has_photo],
                additional_data: this.fb.group(defaultValues.additional_data ?? {}),
                remarks: [defaultValues.remarks],
                id_media_type: [defaultValues['id_media_type']],
                media_url_input: [defaultValues['media_url_input']],
                media_file_input: [null]
            },
            {
                validators: this.atLeastOneFieldRequired([
                    'length', 
                    'width', 
                    'thickness', 
                    'total_count', 
                    'id_material_quality',
                    'total_mass', 
                    'sample_count', 
                    'sample_mass',
                    'has_photo',
                    'remarks'
                ])
            }
        );
        this.seedForm.addControl('id_media_type', new FormControl(null));
        this.seedForm.addControl('media_url_input', new FormControl(null)); 
        this.seedForm.addControl('media_file_input', new FormControl(null));
    }

    atLeastOneFieldRequired(fields: string[]): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
          const formGroup = control as any;
          for (const field of fields) {
            if (formGroup.controls[field].value) {
              return null;
            }
          }
          return { atLeastOneRequired: true };
        };
    }

    submetData(){
        const formData = this.formatDataForm();  
        if(!this.edit){
            this.dataService.addSeedToMaterial(this.data.id, formData).subscribe(
                (response)=>{
                    this.uploadSeedMedia(response.id_seed);
                    this._commonService.translateToaster('info', 'Semence ajoutée avec succès');
                    this.close()
                },
                (error) => {
                    this._commonService.translateToaster('warning', 'Erreur lors de l\'ajout de la semence');
                }
            )
        }else{
            this.dataService.updateSeed(this.data.seedData.id_seed, formData).subscribe(
                ()=>{
                  if (this.seedForm.value.has_photo) {
                    this.uploadSeedMedia(this.data.seedData.id_seed);
                    this._commonService.translateToaster('info', 'Semence modifiée avec succès');
                  } else {
                    this._commonService.translateToaster('info', 'Semence modifiée avec succès');
                    this.close();
                  }
                },
                (error) => {
                    this._commonService.translateToaster('warning', 'Erreur lors de la modification de la semence');
                }
            )
        }
        
    }

    private formatDataForm() {
        const finalForm = this.seedForm.value;
  
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
        if(finalForm.media_file_input){
          this.mediaFileData = finalForm.media_file_input
        }
        if(finalForm.media_url_input){
          this.mediaURLData = finalForm.media_url_input
        }
        if(finalForm.id_media_type){
          this.mediaTypeId = finalForm.id_media_type
        }
        delete finalForm.media_file_input
        delete finalForm.media_url_input
        delete finalForm.id_media_type
        return finalForm;
    }

    close(): void {
        this.dialogRef.close();
    }

    deleteDescription(){
        this.dialogService
          .confirmDialog({ message: 'Voulez-vous vraiment supprimer cette description de semence ?' })
          .subscribe((yes) => {
            if (yes) {
                this.dataService.deleteSeed(this.data.seedData.id_seed).subscribe({
                    next: () => {
                      this._commonService.translateToaster('info', 'Description supprimée avec succès');
                      this.seedForm.reset()
                      this.edit = false
                    },
                    error: () => {
                      this._commonService.translateToaster('warning', 'Erreur lors de la suppression');
                    }
                });
            }
          });
    }

    private updateTotalCount(): void {
      const sampleCount = this.seedForm.get('sample_count')?.value;
      const sampleMass = this.seedForm.get('sample_mass')?.value;
      const totalMass = this.seedForm.get('total_mass')?.value;
    
      if (sampleCount && sampleMass && totalMass && sampleMass !== 0) {
        const calculatedTotal = (sampleCount * totalMass) / sampleMass;
        this.seedForm.get('total_count')?.setValue(Math.round(calculatedTotal), { emitEvent: false });
      }
    }
    
    onMultipleFilesSelected(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files) {
        this.selectedFiles = Array.from(input.files);
      }
      console.log(this.selectedFiles);
      
    }
    
    addUrlField(): void {
      this.mediaUrlControls.push(new FormControl(''));
    }
    
    removeUrlField(index: number): void {
      this.mediaUrlControls.removeAt(index);
    }

    uploadSeedMedia(id_seed: number): void {
      const uploads: Observable<any>[] = [];
    
      const hasExistingMedia = this.data.seedData?.medias?.length > 0;
      const method = hasExistingMedia ? 'upSeedMedia' : 'addSeedMedia';      
    
      for (const file of this.selectedFiles) {
        const formData = new FormData();
        formData.append('media_file', file);
        formData.append('id_media_type', this.mediaTypeId);
        formData.append('title', 'Photo de la semence');
        uploads.push(this.dataService[method](id_seed, formData));
      }
    
      for (const urlControl of this.mediaUrlControls.controls) {
        const formData = new FormData();
        formData.append('media_url', urlControl.value);
        formData.append('id_media_type', this.mediaTypeId);
        formData.append('title', 'Lien média');
        uploads.push(this.dataService[method](id_seed, formData));
      }
    
      if (uploads.length === 0) {
        return;
      }
    
      forkJoin(uploads).subscribe({
        next: () => {
          this._commonService.translateToaster(
            'info',
            hasExistingMedia ? 'Médias mis à jour avec succès' : 'Médias enregistrés avec succès'
          );
          this.close();
        },
        error: () => {
          this._commonService.translateToaster(
            'warning',
            hasExistingMedia ? 'Erreur lors de la mise à jour des médias' : 'Erreur lors de l\'upload des médias'
          );
        }
      });
    }
    
    getCodesNomenclature(idNomenclature: number): void {    
      this.dataService.getCodesNomenclature(idNomenclature).subscribe({
        next: (codeNomenclature: string) => {            
          this.showPhotoField = codeNomenclature === this.constants.MEDIA_TYPE.PHOTO ? true : false
          this.showURLField = codeNomenclature === this.constants.MEDIA_TYPE.URL ? true : false
        },
        error: (error) => {
          
        }
      });
    }

}