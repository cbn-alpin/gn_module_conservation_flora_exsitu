import { Component, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    Validators,
    FormControl,
  } from '@angular/forms';

@Component({
    selector: 'cfe-seed-description',
    templateUrl: './seed-description.component.html',
    styleUrls: ['./seed-description.component.css']
})
export class SeddDescriptionComponent implements OnInit {
    public edit: boolean = false
    public seddForm: FormGroup;
    constructor(
        public dialogRef: MatDialogRef<SeddDescriptionComponent>,
        private fb: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: { id: number }
    ){

    }
    ngOnInit(): void {
        this.initForm()
    }

    initForm(){
        this.seddForm = this.fb.group({
            id_material: [this.data.id, Validators.required],
            length: null,
            width: null,
            thickness: null,
            total_count: null,
            total_mass: null,
            sample_count: null,
            sample_mass: null,
            has_photo: false,
            remarks: ''
        });
    }

    submetData(){
        console.log(this.seddForm.value);
        
    }

    close(): void {
        this.dialogRef.close();
    }

}