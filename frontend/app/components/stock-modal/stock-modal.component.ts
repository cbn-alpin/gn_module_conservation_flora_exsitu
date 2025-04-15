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

@Component({
    selector: 'cfe-stock-modal',
    templateUrl: './stock-modal.component.html',
    styleUrls: ['./stock-modal.component.css']
})
export class StockModalComponent implements OnInit {
    public stockForm: FormGroup;
    public edit: boolean = false;
    additionalDataForm: FormGroup;
    formsDefinition
    constructor(
        public dialogRef: MatDialogRef<StockModalComponent>,
        private fb: FormBuilder,
        public cfg: ConfigService
    ){

    }

    ngOnInit(): void {              
        this.initForm();
        this.additionalDataForm = this.stockForm.get('additional_data') as FormGroup;
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['stock_form']['additional_data'];
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
}