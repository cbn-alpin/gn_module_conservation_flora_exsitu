import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../../services/data.service';
import { map, filter, switchMap, tap, pairwise, retry, catchError } from 'rxjs/operators';
import { Observable, of, forkJoin } from 'rxjs';

import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  UntypedFormArray,
  UntypedFormControl,
  FormArray,
  FormGroup,
  FormControl,
  AbstractControl
} from '@angular/forms';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { HttpParams } from '@angular/common/http';
import { CommonService } from '@geonature_common/service/common.service';  
import { DialogService } from '../../components/confirm-dialog/confirm-dialog.service';

@Injectable()
export class MaterialFormService {
  public form: UntypedFormGroup;
  public occurrence: BehaviorSubject<any> = new BehaviorSubject(null);
  // public materials$: BehaviorSubject<Array<any>> = new BehaviorSubject<Material[]>(this.initialMaterials);
  public materials$: BehaviorSubject<Array<any>> = new BehaviorSubject([]);
  public code_material;

  constructor(
    private dataService: DataService,
    private fb: UntypedFormBuilder,
    private exstiuFormService: ExsituFormService,
    private _commonService: CommonService,
    private dialogService: DialogService
  ) {
    this.initForm();
    this.setObservables();
  }

    initForm(): void {
      this.form = this.fb.group({
        code_material: ['', Validators.required],
        code_parent: null,
        id_harvest: null,
        id_material_type: [null, Validators.required],
        id_material_quality: null,
        id_foot_counting_class: null,
        id_phenology_1: [null, Validators.required],
        id_phenology_2: null,
        remarks: null,
        code_cultural_bank: null,
        sample_foot_count: null,
        is_soil_sampling: false,
        has_hybridation_risk: false,
        id_method_sample: null,
        additional_data: this.fb.group({}),
        taxonInput: new UntypedFormControl(null),
        taxons: this.fb.array([]) 
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
      this.code_material = occurrence.code_material
      const taxonControls = this.form.get('taxons') as FormArray;
      taxonControls.clear();
      this.form.patchValue({
        code_material: occurrence.code_material || '',
        code_parent: occurrence.code_parent || '',
        id_harvest: occurrence.id_harvest || null,
        id_material_type: occurrence.id_material_type || null,
        id_material_quality: occurrence.id_material_quality || null,
        id_foot_counting_class: occurrence.id_foot_counting_class || null,
        id_phenology_1: occurrence.id_phenology_1 || null,
        id_phenology_2: occurrence.id_phenology_2 || null,
        remarks: occurrence.remarks || '',
        code_cultural_bank: occurrence.code_cultural_bank || null,
        sample_foot_count: occurrence.sample_foot_count || null,
        is_soil_sampling: occurrence.is_soil_sampling,
        id_method_sample: occurrence.id_method_sample || null,
        has_hybridation_risk: occurrence.has_hybridation_risk,
        additional_data: occurrence.additional_data
      });
      const taxons = occurrence.taxons || [];
      
      taxons.forEach(taxon => {
        taxonControls.push(this.createTaxonControl(taxon));
      });
    });
  }

  createTaxonControl(taxon: any): FormGroup {
    return this.fb.group({
      parentFormControl: new FormControl(taxon)
    });
  }
  
  getDefaultValues(): any {
    return {
      code_material: '',
      code_parent: '',
      id_harvest: null,
      id_material_type: null,
      id_material_quality: null,
      id_foot_counting_class: null,
      id_phenology_1: null,
      id_phenology_2: null,
      remarks: '',
      code_cultural_bank: null,
      sample_foot_count: null,
      is_soil_sampling: false,
      id_method_sample: null,
      has_hybridation_risk: null,
      additional_data: null
    };
  }

    getMaterialsByHarvest(id_harvest: number) {
      let params = new HttpParams()
          .set('page', 1)
          .set('limit', 10);
      this.dataService.getMaterialsByHarvest(id_harvest, params).subscribe(
        (materials)=>{          
          this.materials$.next(materials['materials'])
        },
        (error)=>{
          console.log('Erreur lors du chargement des matériels', error);
        }
      )
    }

    reset() {
      this.form.reset();
      this.occurrence.next(null);
    }

    submitOccurrence(data) {
  
      let api: Observable<any>;
  
      if (this.occurrence.getValue() && this.occurrence.getValue().id_material) {
        
        // update
        api = this.dataService
          .updateMaterial(data, this.occurrence.getValue().id_harvest, this.occurrence.getValue().id_material)
          .pipe(
            retry(3),
            tap((occurrence) => {
              this.exstiuFormService.replaceOccurrenceData(occurrence);
            })
          );
      } else {
        //create
        
        api = this.dataService.addMaterial(data, this.exstiuFormService.idHarvest).pipe(
          tap((occurrence) => {
            this.exstiuFormService.addOccurrenceData(occurrence);
            this._commonService.translateToaster('info', 'Matériel ajouté');
            this.form.reset()
            const taxonsArray = this.form.get('taxons') as UntypedFormArray;
            taxonsArray.clear();
          })
        );
      }

      api.subscribe(
        (occurrence) => {
          // console.log('occ1', occurrence);
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
          this._commonService.translateToaster('info', 'Matériel supprimé');
        },
        (error) => {
          console.log(error);
        }
      );
    }

    addTaxon(allowMultiple: boolean = true) {
      const taxonsArray = this.form.get('taxons') as UntypedFormArray;
      const taxonValue = this.form.controls.taxonInput.value;
    
      if (!taxonValue) return;
    
      const isDuplicate = taxonsArray.controls.some(control => {
        const existingTaxon = control.get('parentFormControl')?.value;
        return existingTaxon?.cd_nom === taxonValue.cd_nom;
      });
    
      if (isDuplicate) {
        this._commonService.translateToaster('warning', 'Ce taxon est déjà dans la liste');
        this.form.controls.taxonInput.reset();
        return;
      }
    
      if (!allowMultiple && taxonsArray.length >= 1) {
        this._commonService.translateToaster('warning', 'Un seul taxon est autorisé pour ce type de matériel');
        return;
      }
    
      const taxonGroup = this.fb.group({
        parentFormControl: new UntypedFormControl(taxonValue)
      });
    
      taxonsArray.push(taxonGroup);
      this.form.controls.taxonInput.reset();
    }
    
    

    removeTaxon(index: number, taxon: AbstractControl) {
      
      const taxonsArray = this.form.get('taxons') as UntypedFormArray;
      const value = taxon.get('parentFormControl')?.value;
    
      const id_material = this.occurrence.getValue()?.id_material;
      const cd_nom = value?.cd_nom;
    
      const existingTaxons = this.occurrence.getValue()?.taxons || [];
    
      const isAlreadySaved = existingTaxons.some(t => t.cd_nom === cd_nom);
      this.dialogService
          .confirmDialog({ message: `Supprimer le taxon "${value.search_name}" ?` })
          .subscribe((yes) => {
            if (yes) {
              if (id_material && cd_nom && isAlreadySaved) {
                // Appel API car ce taxon est déjà en BDD
                this.dataService.deleteTaxonAssociation(id_material, cd_nom).subscribe({
                  next: () => {
                    this._commonService.translateToaster('info', 'Taxon supprimé');
                    taxonsArray.removeAt(index);
                  },
                  error: (err) => {
                    console.error('Erreur lors de la suppression du taxon', err);
                    this._commonService.translateToaster('error', 'Erreur lors de la suppression');
                  }
                });
              } else {
                // Taxon pas encore en base → suppression locale
                taxonsArray.removeAt(index);
              }
            }
          });
    }
    
  
    get taxons() {
      return this.form.get('taxons') as UntypedFormArray;
    }
}