import { Component, Input, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors, 
    ValidatorFn
  } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CommonService } from '@geonature_common/service/common.service';
import { DialogService } from '../confirm-dialog/confirm-dialog.service';
import { ConfigService } from '../../services/config.service';
import { ConstantsService } from '../../services/constants.service';

@Component({
    selector: 'cfe-stock-modal',
    templateUrl: './stock-modal.component.html',
    styleUrls: ['./stock-modal.component.css']
})
export class StockModalComponent implements OnInit {
    public stockForm: FormGroup;
    public edit: boolean = false;
    additionalDataForm: FormGroup;
    formsDefinition;
    showDryTypeField: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<StockModalComponent>,
        private fb: FormBuilder,
        public cfg: ConfigService,
        public api: DataService,
        public constants: ConstantsService,
        private _commonService: CommonService,
        @Inject(MAT_DIALOG_DATA) public data: { id_material: number, mode: string, stockData: any }
    ){

    }

    ngOnInit(): void {                      
        this.initForm();
        this.additionalDataForm = this.stockForm.get('additional_data') as FormGroup;
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['stock_form']['additional_data'];
        this.stockForm.controls['id_place'].valueChanges.subscribe(value => {      
            if(value) {
                this.getCodesNomenclature(value)
            }
          });
    }

    initForm(){
        this.stockForm = this.fb.group({
            id_material: [this.data.id_material, Validators.required],
            id_place: [null, Validators.required],
            id_dry_type: null,
            initial_quantity: [null, Validators.required],
            current_quantity: [null, Validators.required],
            remarks: '',
            additional_data: this.fb.group({})
        });

        this.stockForm.controls.initial_quantity.valueChanges.subscribe(value => {
          if (this.stockForm.controls.current_quantity.pristine) {
            this.stockForm.controls.current_quantity.setValue(value);
          }
        });

        this.stockForm.setValidators(this.currentQuantityNotGreaterThanInitial());
    
    }

    currentQuantityNotGreaterThanInitial(): ValidatorFn {
      return (formGroup: AbstractControl): ValidationErrors | null => {
        const initial = formGroup.get('initial_quantity')?.value;
        const current = formGroup.get('current_quantity')?.value;
    
        if (initial != null && current != null && current > initial) {
          return { quantityMismatch: true };
        }
    
        return null;
      };
    }
    

    getCodesNomenclature(idNomenclature: number): void {    
        this.api.getCodesNomenclature(idNomenclature).subscribe({
          next: (codeNomenclature: string) => {
            if (codeNomenclature) {
              this.showDryTypeField = this.constants.DRY_TYPE_CODES.includes(codeNomenclature);
              this.stockForm.controls['id_dry_type'].setValidators([Validators.required]);
            } else {
              this.showDryTypeField = false;
            }
          },
          error: (error) => {
            console.log(error);
            this.showDryTypeField = false;
          }
        });
    }

    submetData(){
      const formData = this.formatDataForm();
      this.api.addStorage(this.data.id_material, formData).subscribe(
        (response)=>{
            this._commonService.translateToaster('info', 'Stockage ajouté avec succès');
            this.close()
        },
        (error) => {
            this._commonService.translateToaster('warning', 'Erreur lors de l\'ajout du stockage');
        }
      )
      
    }

    
    private formatDataForm() {
      const finalForm = this.stockForm.value;

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
      return finalForm;
    }

    close(): void {
      this.dialogRef.close();
    }
       
}