import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../../services/data.service';
import { map, filter, switchMap, tap, pairwise, retry, catchError } from 'rxjs/operators';
import { Observable, of, forkJoin } from 'rxjs';

import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';

interface Material {
    id: number;
    code_material: string;
    id_parent?: number;
    id_harvest_material?: number;
    id_foot_counting_class?: number;
    id_phenology_1?: number;
    id_phenology_2?: number;
    protocole_note?: string;
    comment?: string;
    code_cultural_bank?: number;
    sample_foot_nb?: number;
    id_method_sample?: number;
    is_soil_sampling: boolean;
  }
  

@Injectable()
export class MaterialFormService {
  public form: UntypedFormGroup;
  public occurrence: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(
    private dataService: DataService,
    private fb: UntypedFormBuilder,
    private exstiuFormService: ExsituFormService
  ) {
    this.initForm();
    this.setObservables();
  }

  initForm(): void {
    this.form = this.fb.group({
        code_material: ['', Validators.required],
        code_parent: [''],
        id_harvest: [null],
        id_harvest_material: [null, Validators.required],
        id_foot_counting_class: [null],
        id_phenology_1: [null, Validators.required],
        id_phenology_2: [null],
        comment: [''],
        protocole_note: [''],
        code_cultural_bank: [],
        sample_foot_nb: [10],
        is_soil_sampling: [false],
        id_method_sample: [null]
    });
  }

  private setObservables() {
    const $_occurrenceSub = this.occurrence.pipe(
      switchMap((occurrence) => {
        // Si une occurrence existe, on la prend, sinon on utilise les valeurs par défaut
        return occurrence ? of(occurrence) : of(this.getDefaultValues());
      }),
      catchError((error) => {
        console.error('Erreur lors du chargement des données:', error);
        // Retourne les valeurs par défaut en cas d'erreur
        return of(this.getDefaultValues());
      })
    );
  
    $_occurrenceSub.subscribe((occurrence) => {
      // Patch le formulaire avec les données de l'occurrence
      this.form.patchValue({
        code_material: occurrence.code_material || '',
        code_parent: occurrence.code_parent || '',
        id_harvest: occurrence.id_harvest || null,
        id_harvest_material: occurrence.id_harvest_material || null,
        id_foot_counting_class: occurrence.id_foot_counting_class || null,
        id_phenology_1: occurrence.id_phenology_1 || null,
        id_phenology_2: occurrence.id_phenology_2 || null,
        comment: occurrence.comment || '',
        protocole_note: occurrence.protocole_note || '',
        code_cultural_bank: occurrence.code_cultural_bank || null,
        sample_foot_nb: occurrence.sample_foot_nb || null,
        is_soil_sampling: occurrence.is_soil_sampling || false,
        id_method_sample: occurrence.id_method_sample || null
      });
    });
  }
  
  getDefaultValues(): any {
    return {
      code_material: '2025_0001',
      code_parent: '2025_0001',
      id_harvest: null,
      id_harvest_material: null,
      id_foot_counting_class: null,
      id_phenology_1: null,
      id_phenology_2: null,
      comment: '',
      protocole_note: '',
      code_cultural_bank: null,
      sample_foot_nb: 10,
      is_soil_sampling: false,
      id_method_sample: null
    };
  }
  
    initialMaterials: Material[] = [
        {
          id: 1,
          code_material: 'MAT001',
          id_parent: null,
          id_harvest_material: 1,
          id_foot_counting_class: 1,
          id_phenology_1: 1,
          id_phenology_2: 1,
          protocole_note: 'P1',
          comment: 'Commentaire initial',
          code_cultural_bank: 1234,
          sample_foot_nb: 10,
          id_method_sample: 1,
          is_soil_sampling: true
        },
        {
          id: 2,
          code_material: 'MAT002',
          id_parent: null,
          id_harvest_material: 1,
          id_foot_counting_class: 1,
          id_phenology_1: 1,
          id_phenology_2: 1,
          protocole_note: 'P2',
          comment: 'Commentaire initial2',
          code_cultural_bank: 1234,
          sample_foot_nb: 10,
          id_method_sample: 1,
          is_soil_sampling: false
        }
    ];
      

    public rec_material_in_progress: Array<{ id: number; data: any; state: string }> = [
        {
          id: 1,
          data: {
            id_material: 1,
            uuid_material: '550e8400-e29b-41d4-a716-446655440001',
            code_material: 'MAT-002',
            id_parent: null,
            id_harvest: 102,
            id_harvest_material: 203,
            id_foot_counting_class: 304,
            id_phenology_1: 405,
            id_phenology_2: 506,
            protocole_note: 'Utiliser une méthode alternative',
            comment: 'Observation spéciale requise',
            code_cultural_bank: 67890,
            sample_foot_nb: 15,
            is_soil_sampling: false,
            id_method_sample: 607,
          },
          state: 'in_progress'
        },
        {
          id: 2,
          data: {
            id_material: 2,
            uuid_material: '550e8400-e29b-41d4-a716-446655440000',
            code_material: 'MAT-001',
            id_parent: null,
            id_harvest: 101,
            id_harvest_material: 202,
            id_foot_counting_class: 303,
            id_phenology_1: 404,
            id_phenology_2: 505,
            protocole_note: 'Suivre le protocole standard',
            comment: 'Aucun commentaire',
            code_cultural_bank: 12345,
            sample_foot_nb: 20,
            is_soil_sampling: true,
            id_method_sample: 606,
          },
          state: 'done'
        }
    ];
    // public materials$: BehaviorSubject<Array<any>> = new BehaviorSubject<Material[]>(this.initialMaterials);
    public materials$: BehaviorSubject<Array<any>> = new BehaviorSubject([]);

    getMaterialsByHarvest(id_harvest: number) {
      this.dataService.getMaterialsByHarvest(id_harvest).subscribe(
        (materials)=>{          
          this.materials$.next(materials['materials'])
          console.log(materials['materials']);
        },
        (error)=>{
          console.log('Erreur lors du chargement des matériels', error);
        }
      )
    }


    addMaterialInProgress(temp_id, material) {
        let data = {
          id: temp_id,
          data: material,
          state: 'in_progress',
        };
        this.rec_material_in_progress.push(data);
    }
    
    removeMaterialInProgress(temp_id) {
        for (let i = 0; i < this.rec_material_in_progress.length; i++) {
          if (this.rec_material_in_progress[i].id === temp_id) {
            this.rec_material_in_progress.splice(i, 1);
            break;
          }
        }
    }

    cleanOccurrenceInProgress() {
        this.rec_material_in_progress = [];
    }

    reset() {
      this.form.reset();
      this.occurrence.next(null);
    }

    submitOccurrence(data) {
      // let formValue = Object.assign({}, this.form.value);
      // formValue = JSON.parse(JSON.stringify(this.form.value));
      
  
      let api: Observable<any>;
  
      if (this.occurrence.getValue() && this.occurrence.getValue().id_material) {
        //update
        // api = this.dataService
        //   .updateOccurrence(this.occurrence.getValue().id_occurrence_occtax, this.form.value)
        //   .pipe(
        //     retry(3),
        //     tap((occurrence) => {
        //       this.exstiuFormService.replaceOccurrenceData(occurrence);
        //     })
        //   );
      } else {
        //create
        
        api = this.dataService.addMaterial(data, this.exstiuFormService.idHarvest).pipe(
          tap((occurrence) => {
            this.exstiuFormService.addOccurrenceData(occurrence);
          })
        );
      }

      api.subscribe(
        (occurrence) => {
          console.log('occ1', occurrence);
        },
        (error) => {
          console.log(error);
        }
      );
  
      //vide le formulaire
      this.reset();
    }


    deleteOccurrence(occurrence) {
      this.dataService.deleteMaterial(occurrence.id_material).subscribe(
        (confirm: boolean) => {
          this.exstiuFormService.removeOccurrenceData(occurrence.id_material);
        },
        (error) => {
          console.log(error);
        }
      );
    }
}