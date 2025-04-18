import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

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

  constructor(private fb: FormBuilder) {
    this.semisForm = this.fb.group({
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
    if (this.semisForm.valid) {
      // Create new Semis entry from form values
      const newEntry: Semis = {
        numSemis: this.semisForm.value.numeroSemis,
        numSemence: this.semisForm.value.numeroSemence,
        dateDebut: this.semisForm.value.dateDebut,
        dateFin: this.semisForm.value.dateFin,
        replicate: 0, // Add actual value mapping
        levage: 0    // Add actual value mapping
      };

      // Add to table
      this.dataSource.data = [...this.dataSource.data, newEntry];
      
      // Reset form
      this.semisForm.reset();
    }
  }
}