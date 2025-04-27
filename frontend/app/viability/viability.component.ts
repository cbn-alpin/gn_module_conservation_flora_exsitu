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
}