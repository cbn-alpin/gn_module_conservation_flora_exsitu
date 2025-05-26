import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialogRef } from '@angular/material/dialog';

interface Semis {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}
@Component({
  selector: 'app-semis',
  templateUrl: './semis.component.html',
  styleUrls: ['./semis.component.scss']
})
export class SemisComponent implements OnInit {

  semisForm: FormGroup;
  dataSource = new MatTableDataSource<Semis>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];

  constructor(private fb: FormBuilder,public dialogRef: MatDialogRef<SemisComponent>) {
    this.semisForm = this.fb.group({
      code: ['', Validators.required],
      datededebut: ['', Validators.required],
      datedefin: ['', Validators.required],
      modeSemis: [''],
      arrosage: [''],
      profondeur: [''],
      contenant: [''],
      substrat: [''],
      idLocation: [null, Validators.required],
      specificationLocation: [''],
      idMaterial: [null, Validators.required],
      idStorage: [null],
      idActor: [null],
      initialCount: [0],
      replicateCount: [0],
      remarks: [''],
      program: [''],
      replicats: this.fb.array([this.createReplicat()])
    });
  }
  get replicats(): FormArray {
    return this.semisForm.get('replicats') as FormArray;
  }


  get replicatsControls() {
    return (this.semisForm.get('replicats') as FormArray).controls;
  }

  createReplicat(): FormGroup {
    return this.fb.group({
      date: [''],
      plantulesLevees: [0],
      plantulesMortes: [0],
      plantulesRepiques: [0],
      grainesSemees: [0]
    });
  }

  addReplicat(): void {
    (this.semisForm.get('replicats') as FormArray).push(this.createReplicat());
  }
  

  ngOnInit(): void {
    this.dataSource.data = [];
  }

  onDelete(){

  }
  onView(){
    
  }
  onEdit(){
    
  }
  onSubmit() {
    if (this.semisForm.valid) {
      const formData = this.semisForm.value;
      console.log('Formulaire soumis :', formData);
      this.dialogRef.close(formData); // ferme le modal et renvoie les données
    }
  }

  onCancel(){
    this.dialogRef.close();

  }

}