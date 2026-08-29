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
    public codeMaterial: string | null = null;

    private initialFormState: any = null;
    private initialMediaUrls: string[] = [];
    private cancelDialogOpen = false;

    
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
        this.loadAssociatedMaterialCode();
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


        this.initialFormState =
          JSON.parse(
            JSON.stringify(
              this.seedForm.getRawValue()
            )
          );

        this.initialMediaUrls =
          JSON.parse(
            JSON.stringify(
              this.mediaUrlControls.getRawValue()
            )
          );

        this.dialogRef.backdropClick().subscribe(() => {
          this.onCancel();
        });

        this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            this.onCancel();
          }
        });
    }

    private loadAssociatedMaterialCode(): void {
      this.dataService
        .getMaterialInfos(this.data.id)
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
        const currentCode =
          this.codeMaterial || '';

        this.dialogService
          .confirmDialog({
            message: '',
            icon: 'description',
            variant: 'seed-save',
            entityLabel: this.edit
              ? 'les modifications de la semence du matériel'
              : 'la semence du matériel',
            entityCode: currentCode || undefined,
            disableClose: false
          })
          .subscribe((yes) => {
            if (!yes) {
              return;
            }

            const formData =
              this.formatDataForm();

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
                        this.close();
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
          });
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

    onReset(): void {
      if (!this.initialFormState) {
        return;
      }

      this.dialogService
        .confirmDialog({
          message: '',
          icon: 'description',
          variant: 'seed-reset',
          entityLabel: this.edit
            ? 'les modifications de cette description de semence'
            : 'cette description de semence',
          disableClose: false
        })
        .subscribe((yes) => {
          if (!yes) {
            return;
          }

          this.seedForm.reset(
            JSON.parse(
              JSON.stringify(
                this.initialFormState
              )
            )
          );

          this.mediaUrlControls.clear();

          this.initialMediaUrls.forEach(
            (url) => {
              this.mediaUrlControls.push(
                new FormControl(url)
              );
            }
          );

          this.selectedFiles = [];

          this.seedForm.markAsPristine();
          this.seedForm.markAsUntouched();
          this.seedForm.updateValueAndValidity();
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


    private hasCreationChanges(): boolean {
      if (!this.initialFormState) {
        return false;
      }

      const formChanged =
        JSON.stringify(
          this.seedForm.getRawValue()
        ) !==
        JSON.stringify(
          this.initialFormState
        );

      const mediaUrlsChanged =
        JSON.stringify(
          this.mediaUrlControls.getRawValue()
        ) !==
        JSON.stringify(
          this.initialMediaUrls
        );

      const hasSelectedFiles =
        this.selectedFiles.length > 0;

      return (
        formChanged ||
        mediaUrlsChanged ||
        hasSelectedFiles
      );
    }


    onCancel(): void {
      if (this.cancelDialogOpen) {
        return;
      }

      this.cancelDialogOpen = true;

      const currentCode = this.codeMaterial || '';

      this.dialogService
        .confirmDialog({
          message: '',
          icon: 'description',
          variant: 'seed-exit',
          entityLabel: currentCode
            ? 'la semence du matériel'
            : 'cette fiche de semence',
          entityCode: currentCode || undefined,
          disableClose: false
        })
        .subscribe((yes) => {
          this.cancelDialogOpen = false;

          if (!yes) {
            return;
          }

          if (this.edit) {
            this._commonService.translateToaster(
              'info',
              this.codeMaterial
                ? `Semence du matériel ${this.toBoldText(this.codeMaterial)} non modifiée`
                : 'Semence non modifiée'
            );
          } else if (this.hasCreationChanges()) {
            this._commonService.translateToaster(
              'info',
              this.codeMaterial
                ? `Semence du matériel ${this.toBoldText(this.codeMaterial)} non créée`
                : 'Semence non créée'
            );
          } else {
            this._commonService.translateToaster(
              'info',
              'Création de la semence annulée'
            );
          }

          this.close();
        });
    }


    close(): void {
        this.dialogRef.close();
    }

    deleteDescription(){
        this.dialogService
          .confirmDialog({
            message: '',
            icon: 'description',
            variant: 'seed',
            entityCode: this.codeMaterial || '',
            disableClose: false
          })
          .subscribe((yes) => {
            if (yes) {
                this.dataService.deleteSeed(this.data.seedData.id_seed).subscribe({
                    next: () => {
                      const currentCode = this.codeMaterial || '';

                      this._commonService.translateToaster(
                        'error',
                        currentCode
                          ? `Semence du matériel ${this.toBoldText(currentCode)} supprimée avec succès`
                          : 'Semence supprimée avec succès'
                      );

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