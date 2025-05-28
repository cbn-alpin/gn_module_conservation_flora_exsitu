import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
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
  selector: 'app-viability',
  templateUrl: './viability.component.html',
  styleUrls: ['./viability.component.scss']
})
export class ViabilityComponent implements OnInit {

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

  constructor(private fb: FormBuilder,public dialogRef: MatDialogRef<ViabilityComponent> ) {
    this.germinationForm = this.fb.group({
      code: ['', Validators.required],
      idTestParent: [null, Validators.required], 
      idMaterial: [null, Validators.required],
      idActor: [null, Validators.required],
      idTestType: [null, Validators.required], 
      idStorage: [null], 
      seedInitialCount: [null],
      replicateCount: [1],
      idSubstrate: [null],
      idSupport: [null],
      program: [''],
      remarks: ['']
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
    // Initialize with sample data if needed
    this.dataSource.data = [];
  }

  onDelete(){

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


  onCancel(){
    this.dialogRef.close();

  }
}