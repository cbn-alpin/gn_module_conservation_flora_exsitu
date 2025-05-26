import { Component, OnInit,Input } from '@angular/core';
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
  selector: 'app-action-details',
  templateUrl: './action-details.component.html',
  styleUrls: ['./action-details.component.scss']
})
export class ActionDetailsComponent implements OnInit {
  @Input() action: any;

 
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

  constructor(private fb: FormBuilder,public router: Router ) {
    this.germinationForm = this.fb.group({
      reference: ['', Validators.required],
      provenance: ['', Validators.required],
      numeroSemis: ['', Validators.required],
      numeroSemence: ['', Validators.required],
      preparation: [''],
      contenant: [''],
      substrat: [''],
      arrosage: [''],
      modeSemis: [''],
      profondeur: [''],
      dateDebut: ['', Validators.required],
      dateFin: [''],
      traitement: [''],
      remarques: [''],
    
      replicats: this.fb.array([this.createReplicat()])

      
    });
  }
  get replicats(): FormArray {
    return this.germinationForm.get('replicats') as FormArray;
  }
  addNewGermination(){
  }

  onBack(){
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
    this.germinationForm.patchValue({
      reference: 'Contrat ABC',
      provenance: 'Test 123',
      numeroSemis: 'SEM123',
      numeroSemence: 'SEED456',
      preparation: 'Some remarks',
      contenant: 'Scarification process',
    });
  }

  onDelete(){

  }
  onView(){
    
  }
  onEdit(){
    
  }

  onCancel(){
    
  }
  onSubmit() {
    if (this.germinationForm.valid) {
      const formData = this.germinationForm.value;
      console.log('Formulaire soumis :', formData);
    }
  }

  } 