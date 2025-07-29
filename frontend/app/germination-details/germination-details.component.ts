import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';

interface Germination {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}

@Component({
  selector: 'app-germination-details',
  templateUrl: './germination-details.component.html',
  styleUrls: ['./germination-details.component.scss']
})
export class GerminationDetailsComponent implements OnInit {
  idMaterial!: number;
  idStorage:any;
  idTest!: number;
  selectedAction: any = null;
  labels: any = {};

  germinationForm: FormGroup;
  dataSource = new MatTableDataSource<Germination>([]);
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
    private route: ActivatedRoute,
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
    this.idTest = +(this.route.snapshot.paramMap.get('id_test') || 0);
    this.idMaterial = +(this.route.snapshot.paramMap.get('idMaterial') || 0);

    if (!this.idTest && this.exsituFormService.idTest) {
      this.idTest = this.exsituFormService.idTest;
    }
    if (!this.idMaterial && this.exsituFormService.idMaterial) {
      this.idMaterial = this.exsituFormService.idMaterial;
    }
    if (!this.idStorage && this.exsituFormService.idStorage) {
      this.exsituFormService.id_storage.subscribe((id) => {
        this.idStorage = id;
      });
    }

    console.log("🆔 id_test:", this.idTest);
    console.log("🧪 id_material:", this.idMaterial);

    if (!this.idTest || !this.idMaterial) {
      console.error("❌ idTest ou idMaterial manquant !");
      return;
    }

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