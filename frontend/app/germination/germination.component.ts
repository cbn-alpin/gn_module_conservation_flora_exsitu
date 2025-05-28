import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

interface Germination {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}
@Component({
  selector: 'app-germination',
  templateUrl: './germination.component.html',
  styleUrls: ['./germination.component.scss']
})
export class GerminationComponent implements OnInit {

 
  germinationForm: FormGroup;
  dataSource = new MatTableDataSource<Germination>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];

  constructor(private fb: FormBuilder,public router: Router,public dialogRef: MatDialogRef<GerminationComponent> ) {
    this.germinationForm = this.fb.group({
      code: [''],
      idTestParent: [null],
      idMaterial: [null],
      idActor: [null],
      idTestType: [null],
      idStorage: [null],
      seedInitialCount: [null],
      replicateCount: [1],
      idSubstrate: [null],
      idSupport: [null],
      program: [''],
      remarks: [''],
    });
  }
  get replicats(): FormArray {
    return this.germinationForm.get('replicats') as FormArray;
  }
  addNewGermination(){
  }


  get replicatsControls() {
    return (this.germinationForm.get('replicats') as FormArray).controls;
  }

  createReplicat(): FormGroup {
    return this.fb.group({
      date: [''],
      plantulesLevees: [''],
      plantulesMortes: [''],
      plantulesRepiques: [''],
      grainesSemees: ['']
    });
  }

  addReplicat(): void {
    (this.germinationForm.get('replicats') as FormArray).push(this.createReplicat());
  }
  

  ngOnInit(): void {
    this.dataSource.data = [];
  }

  onDelete(){

  }
  onCancel(){
    this.dialogRef.close();

  }
  onView(){
    
  }
  onEdit(){
    
  }
  onSubmit() {
    if (this.germinationForm.valid) {
      const formData = this.germinationForm.value;
      console.log('Formulaire soumis :', formData);
      this.dialogRef.close(formData); // ferme le modal et renvoie les données
    }
  }

  } 