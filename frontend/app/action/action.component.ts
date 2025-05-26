import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
interface Action {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}
@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss']
})
export class ActionComponent implements OnInit {

 
  germinationForm: FormGroup;
  dataSource = new MatTableDataSource<Action>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];
 

  actions = ['Suivi Test', 'Stérilisation', 'Scarification', 'Stratification', 'Traitement'];


  constructor(private fb: FormBuilder,public router: Router,public dialogRef: MatDialogRef<ActionComponent> ) {
    this.germinationForm = this.fb.group({
      typeAction: ['', Validators.required],
    
      reference: [''],
      provenance: [''],
      numeroSemis: [''],
      numeroSemence: [''],
    
      // Suivi Test
      nbGermes: [0],
      nbViables: [0],
      nbRepiques: [0],
      nbMortes: [0],
      totalGermes: [0],
      totalViables: [0],
      totalRepiques: [0],
      totalMortes: [0],
    
      // Stérilisation
      sterilisationLiquide: [''],
      sterilisationDuree: [null],
    
      // Scarification 
      scarificationLiquide: [''],
      scarificationDuree: [null],
      scarificationConcentration: [null],
    
      // Stratification 
      stratificationTempLumiere: [null],
      stratificationTempObscurite: [null],
      stratificationHeuresLumiere: [null],
      stratificationHeuresObscurite: [null]
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
  onTypeChange(): void {
  }
  

  onDelete(){

  }
  onView(){
    
  }
  onEdit(){
    
  }

  onCancel(){
    this.dialogRef.close();
  }
  onSubmit() {
    if (this.germinationForm.valid) {
      const formData = this.germinationForm.value;
      console.log('Formulaire soumis :', formData);
      this.dialogRef.close(formData); // ferme le modal et renvoie les données
    }
  }

  } 