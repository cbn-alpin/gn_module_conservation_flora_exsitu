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
        public constants: ConstantsService
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
            id_material: [null, Validators.required],
            id_place: [null, Validators.required],
            id_dry_type: null,
            initial_quantity: [null, Validators.required],
            current_quantity: [null, Validators.required],
            remarks: '',
            additional_data: this.fb.group({})
        });
    
    }

    getCodesNomenclature(idNomenclature: number): void {    
        this.api.getCodesNomenclature(idNomenclature).subscribe({
          next: (codeNomenclature: string) => {
            if (codeNomenclature) {
              console.log(codeNomenclature);
              this.showDryTypeField = this.constants.DRY_TYPE_CODES.includes(codeNomenclature);
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

    close(): void {
      this.dialogRef.close();
    }
       
}