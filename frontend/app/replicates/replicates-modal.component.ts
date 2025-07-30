import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-replicates-modal',
  templateUrl: './replicates-modal.component.html',
  styleUrls: ['./replicates-modal.component.scss']
})
export class ReplicatesModalComponent implements OnInit {
  @Input() replicatesForm: FormGroup;
  @Input() replicateLabels: string[] = [];
  @Input() code: string;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Ajout sécurisé des contrôles s'ils sont manquants
    if (this.code === 'svr') {
      if (!this.replicatesForm.get('germes')) {
        this.replicatesForm.addControl('germes', this.fb.array([]));
      }
      if (!this.replicatesForm.get('mortes')) {
        this.replicatesForm.addControl('mortes', this.fb.array([]));
      }
      if (!this.replicatesForm.get('nonGermes')) {
        this.replicatesForm.addControl('nonGermes', this.fb.array([]));
      }
    }

    if (this.code === 'synth') {
      if (!this.replicatesForm.get('total_count_germinated')) {
        this.replicatesForm.addControl('total_count_germinated', this.fb.control(null));
      }
      if (!this.replicatesForm.get('total_count_dead')) {
        this.replicatesForm.addControl('total_count_dead', this.fb.control(null));
      }
      if (!this.replicatesForm.get('total_count_viable')) {
        this.replicatesForm.addControl('total_count_viable', this.fb.control(null));
      }
    }
  }

  // Getters sécurisés
  get germes(): FormArray {
    return this.replicatesForm.get('germes') as FormArray;
  }

  get mortes(): FormArray {
    return this.replicatesForm.get('mortes') as FormArray;
  }

  get nonGermes(): FormArray {
    return this.replicatesForm.get('nonGermes') as FormArray;
  }

  get isLastReplicate(): boolean {
    return this.replicatesForm?.get('last_replicate')?.value === true;
  }
  
}
