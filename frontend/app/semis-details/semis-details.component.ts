import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
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
  selector: 'app-semis-details',
  templateUrl: './semis-details.component.html',
  styleUrls: ['./semis-details.component.scss']
})
export class SemisDetailsComponent implements OnInit {

 
  sowingForm: FormGroup;
  dataSource = new MatTableDataSource<Semis>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];

  selectedAction: any = null;

  onActionSelected(action: any) {
    this.selectedAction = action;
  }

  constructor(private fb: FormBuilder,public router: Router ) {
    this.sowingForm = this.fb.group({
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
    return this.sowingForm.get('replicats') as FormArray;
  }
  addNewGermination(){
  }


  get replicatsControls() {
    return (this.sowingForm.get('replicats') as FormArray).controls;
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
    (this.sowingForm.get('replicats') as FormArray).push(this.createReplicat());
  }
  

  ngOnInit(): void {
    this.sowingForm.patchValue({
      reference: 'Contrat ABC',
      provenance: 'Test 123',
      numeroSemis: 'SEM123',
      numeroSemence: 'SEED456',
      preparation: 'Some remarks',
      contenant: 'Scarification process',
      substrat: 'Peat moss'
    });
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
    if (this.sowingForm.valid) {
      const formData = this.sowingForm.value;
      console.log('Formulaire soumis :', formData);
    }
  }
  
  } 