import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-replicates-modal',
  templateUrl: './replicates-modal.component.html',
  styleUrls: ['./replicates-modal.component.scss']
})
export class ReplicatesModalComponent implements OnInit, OnChanges {
  @Input() replicatesForm: FormGroup;
  @Input() replicateLabels: string[] = [];
  @Input() code: string;
  @Input() replicates_for_form: any;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    console.log("⏳ ReplicatesModalComponent initialisé");
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.replicates_for_form &&
      this.code &&
      (changes['replicates_for_form'] || changes['code'])
    ) {
      this.initializeReplicates();
    }
    if (changes['replicates_for_form'] && this.replicates_for_form && this.code === 'synth') {
      this.initializeReplicates(); // ce déclenche bien après que les données soient arrivées
    }
  }

  initializeReplicates(): void {
    if (this.code === 'svr') {
      const germes = this.replicates_for_form?.germes || [];
      const mortes = this.replicates_for_form?.mortes || [];
      const nonGermes = this.replicates_for_form?.nonGermes || [];
      const last = this.replicates_for_form?.last_replicate ?? false;

      this.replicatesForm.setControl('germes', this.fb.array(germes.map(val => this.fb.control(val))));
      this.replicatesForm.setControl('mortes', this.fb.array(mortes.map(val => this.fb.control(val))));
      this.replicatesForm.setControl('nonGermes', this.fb.array(nonGermes.map(val => this.fb.control(val))));

      if (this.replicatesForm.contains('last_replicate')) {
        this.replicatesForm.get('last_replicate')?.setValue(last);
      } else {
        this.replicatesForm.addControl('last_replicate', this.fb.control(last));
      }
    }

    if (this.code === 'synth') {
      // Ajouter les contrôles si non présents
      if (!this.replicatesForm.contains('total_count_germinated')) {
        this.replicatesForm.addControl('total_count_germinated', this.fb.control(null));
      }
      if (!this.replicatesForm.contains('total_count_dead')) {
        this.replicatesForm.addControl('total_count_dead', this.fb.control(null));
      }
      if (!this.replicatesForm.contains('total_count_viable')) {
        this.replicatesForm.addControl('total_count_viable', this.fb.control(null));
      }
    
      // Remplir les valeurs
      this.replicatesForm.patchValue({
        total_count_germinated: this.replicates_for_form?.total_count_germinated ?? null,
        total_count_dead: this.replicates_for_form?.total_count_dead ?? null,
        total_count_viable: this.replicates_for_form?.total_count_viable ?? null,
      });
    }
    
    

    console.log("📦 Code action :", this.code);
    console.log("📥 Données pré-remplies :", this.replicates_for_form);
  }

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