import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';

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
idMaterial!: number;
  idStorage:any;
  idTest!: number;
  selectedAction: any = null;
  labels: any = {};

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

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private api: DataService,
    private exsituFormService: ExsituFormService
  ) {
    this.germinationForm = this.fb.group({
      code: [''],
      id_test_parent: [''],
      id_material: [''],
      id_actor: [''],
      id_storage: [''],
      id_test_type: [''],
      seed_initial_count: [''],
      replicate_count: [''],
      id_support: [''],
      id_substrate: [''],
      remarks: [''],
      additional_data: this.fb.group({
        program: ['']
      })
    });
  }

  ngOnInit(): void {
    const urlSegments =
      this.router.url
        .split('?')[0]
        .split('/');

    const materialIndex =
      urlSegments.indexOf('material') + 1;

    const testIndex =
      urlSegments.indexOf('viability-details') + 1;


    this.idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(urlSegments[materialIndex])
        : 0;


    this.idTest =
      testIndex > 0 &&
      testIndex < urlSegments.length
        ? Number(urlSegments[testIndex])
        : 0;


    if (
      !this.idTest ||
      !this.idMaterial
    ) {
      console.error(
        'idTest ou idMaterial manquant dans l’URL.'
      );

      return;
    }


    this.exsituFormService
      .setIdMaterial(this.idMaterial);

    this.exsituFormService
      .setIdTest(this.idTest);


    this.loadTestDetails();
  }
 
  loadTestDetails(): void {
    this.api.getTestWithLabels(this.idTest).subscribe({
      next: (test) => {
        console.log(" Test chargé :", test);
        this.patchFormFromTest(test);
        this.dataSource.data = test.actions || [];
      },
      error: (err) => {
        console.error(" Erreur lors du chargement du test :", err);
      }
    });
  }

  patchFormFromTest(test: any): void {
    this.germinationForm.patchValue({
      code: test.code,
      id_test_parent: test.id_test_parent || '',
      id_material: test.material_label,
      id_actor: test.actor_label,
      id_storage: test.storage_label || '',
      id_test_type: test.test_type_label,
      seed_initial_count: test.seed_initial_count,
      replicate_count: test.replicate_count,
      id_support: test.support_label,
      id_substrate: test.substrate_label,
      remarks: test.remarks,
      additional_data: {
        program: test.additional_data?.program || ''
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  onActionSelected(action: any): void {
    const idAction = action.id_action;
  
    // Recharge les données complètes de l'action depuis l'API
    this.api.getActionWithLabels(idAction).subscribe({
      next: (fullAction) => {
        this.selectedAction = fullAction;  // contient tous les champs + labels
      },
      error: (err) => {
        console.error("Erreur chargement de l'action :", err);
      }
    });
  }
  

  onDelete(): void {}
  onView(): void {}
  onEdit(): void {}
  onCancel(): void {}

  onSubmit(): void {
    if (this.germinationForm.valid) {
      const formData = this.germinationForm.value;
      console.log('Formulaire soumis :', formData);
    }
  }
}