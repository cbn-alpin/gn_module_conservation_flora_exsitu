import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

interface Viability {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}
@Component({
  selector: 'app-viability-details',
  templateUrl: './viability-details.component.html',
  styleUrls: ['./viability-details.component.scss']
})
export class ViabilityDetailsComponent implements OnInit {

  selectedAction: any = null;

  germinationForm: FormGroup;
  dataSource = new MatTableDataSource<Viability>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];

  constructor(private fb: FormBuilder,public router: Router ) {
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

  onActionSelected(action: any) {
    this.selectedAction = action;
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
  onView(){
    
  }
  onEdit(){
    
  }
  onBack(){
    window.history.back();

  }

  onCancel(){
    
  }
  onSubmit() {
    if (this.germinationForm.valid) {
      const formData = this.germinationForm.value;
      console.log('Formulaire soumis :', formData);
     // this.dialogRef.close(formData); // ferme le modal et renvoie les données
    }
  }
  

  } 