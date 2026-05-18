import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';

@Component({
  selector: 'app-semis-details',
  templateUrl: './semis-details.component.html',
  styleUrls: ['./semis-details.component.scss']
})
export class SemisDetailsComponent implements OnInit {
  idMaterial!: number;
  idSowing!: number;
  selectedAction: any = null;

  sowingForm: FormGroup;
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private api: DataService,
    private exsituFormService: ExsituFormService
  ) {
    this.sowingForm = this.fb.group({
      code: [''],
      id_material: [''],
      id_storage: [''],
      id_actor: [''],
      start_date: [''],
      end_date: [''],
      id_sowing_method: [''],
      id_watering_method: [''],
      id_location: [''],
      specification_location: [''],
      initial_count: [''],
      replicate_count: [''],
      depth: [''],
      container: [''],
      substrate: [''],
      remarks: [''],
      additional_data: this.fb.group({
        program: ['']
      })
    });
  }

  ngOnInit(): void {
    const urlSegments = this.router.url.split('/');

    const materialIndex = urlSegments.indexOf('material') + 1;
    const semisIndex = urlSegments.indexOf('semis-details') + 1;

    this.idMaterial = materialIndex > 0 && materialIndex < urlSegments.length
      ? Number(urlSegments[materialIndex])
      : 0;

    this.idSowing = semisIndex > 0 && semisIndex < urlSegments.length
      ? Number(urlSegments[semisIndex])
      : 0;

    if (!this.idSowing || !this.idMaterial) {
      return;
    }

    this.loadSowingDetails();
    this.loadSowingActions();
  }

  loadSowingDetails(): void {
    this.api.getSowingsByMaterial(this.idMaterial).subscribe({
      next: (sowings) => {
        const sowing = (sowings || []).find((item: any) => item.id_sowing === this.idSowing);
        if (!sowing) {
          return;
        }

        this.patchFormFromSowing(sowing);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du semis :', err);
        console.log('loadSowingDetails ->', this.idMaterial, this.idSowing);
      }
    });
  }

  loadSowingActions(): void {
    this.api.getActionsBySowing(this.idSowing).subscribe({
      next: (actions) => {
        this.dataSource.data = actions || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actions du semis :', err);
      }
    });
  }

  patchFormFromSowing(sowing: any): void {
    this.sowingForm.patchValue({
      code: sowing.code || '-',
      id_material: sowing.code_material || '-',
      id_storage: sowing.id_storage ?? '-',
      id_actor: sowing.nom_actor && sowing.prenom_actor ? `${sowing.prenom_actor} ${sowing.nom_actor}` : '-',
      start_date: sowing.start_date || '-',
      end_date: sowing.end_date || '-',
      id_sowing_method: sowing.label_sowing || sowing.id_sowing_method || '-',
      id_watering_method: sowing.label_watering || sowing.id_watering_method || '-',
      id_location: sowing.label_location || sowing.id_location || '-',
      specification_location: sowing.specification_location || '-',
      initial_count: sowing.initial_count ?? '-',
      replicate_count: sowing.replicate_count ?? '-',
      depth: sowing.depth ?? '-',
      container: sowing.container?.value || sowing.container || '-',
      substrate: sowing.label_substrate || sowing.substrate?.value || '-',
      remarks: sowing.remarks || '-',
      additional_data: {
        program: sowing.additional_data?.program || '-'
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  onActionSelected(action: any): void {
    const idAction = action.id_action;

    this.api.getActionWithLabels(idAction).subscribe({
      next: (fullAction) => {
        this.selectedAction = fullAction;
      },
      error: (err) => {
        console.error('Erreur chargement de l’action :', err);
      }
    });
  }

  onDelete(): void {}
  onView(): void {}
  onEdit(): void {}
  onCancel(): void {}
}