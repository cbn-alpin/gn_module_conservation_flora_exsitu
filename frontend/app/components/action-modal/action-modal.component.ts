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
    selector: 'cfe-action-modal',
    templateUrl: './action-modal.component.html',
    styleUrls: ['./action-modal.component.css']
})
export class ActionModalComponent implements OnInit {
    public actionForm: FormGroup;
    public edit: boolean = false;
    additionalDataForm: FormGroup;
    formsDefinition;
    public auteurs_code;

    constructor(
        public dialogRef: MatDialogRef<ActionModalComponent>,
        private fb: FormBuilder,
        public cfg: ConfigService,
        public api: DataService,
    ){

    }

    ngOnInit(): void {
        this.initForm()
        this.auteurs_code = this.cfg.getObsCode()
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['action_form']['additional_data'];
    }

    initForm(){
        this.actionForm = this.fb.group({
            id_storage: [null, Validators.required],
            date_start: [null, Validators.required],
            date_end: [null, Validators.required],
            id_actor: [null, Validators.required],
            id_action_type: [null, Validators.required],
            quantity : null,
            id_destock: null,
            id_destination: null,
            id_humidity_level: null,
            humidity_rate: null,
            id_humidity_device: null,
            remarks: '',
            additional_data: this.fb.group({})
        });
    
    }

    close(): void {
        this.dialogRef.close();
    }
}