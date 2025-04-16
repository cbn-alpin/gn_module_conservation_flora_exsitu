import {
    UntypedFormBuilder,
    UntypedFormGroup,
    UntypedFormControl,
    Validators,
    ValidatorFn,
    FormGroup,
} from '@angular/forms';

import { Injectable } from '@angular/core';
import { ConstantsService } from '../services/constants.service';
import { HarvestMapService } from './harvest-map/harvest-map.service';
import { filter, switchMap, tap, debounceTime } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { FormService } from '@geonature_common/form/form.service';
import { DataFormService } from '@geonature_common/form/data-form.service';
import { HarvestStoreService } from '../services/store.service';
import { ConfigService } from '@geonature/services/config.service';

@Injectable()
export class HarvestFormService {
    public showCommuneField: boolean = false;
    public showDepartmentField: boolean = false;
    public showMapField: boolean = false;
    public showResolutionField: boolean = false;
    
    
    public harvestForm: FormGroup;

    constructor(
        private fb: UntypedFormBuilder,
        private constants: ConstantsService,
        private mapService: HarvestMapService,
        private exsituService: ExsituFormService,
        public api: DataService,
        private dateParser: NgbDateParserFormatter,
        private coreFormService: FormService,
        private _dfService: DataFormService,
        public storeService: HarvestStoreService,
        private cfg: ConfigService
    ){
        this.initForm();
        this.setObservables();
    }

    private setObservables() {
      combineLatest([
        this.exsituService.editionMode,
        this.exsituService.exsituData
      ])
        .pipe(
          filter(([isEditing, data]) => isEditing === true && !!data),
          debounceTime(0)
        )
        .subscribe(([_, data]) => this.patchForm(data));
    }
    

    initForm(): void {
        this.harvestForm = this.fb.group({
            id_harvest: null,
            cd_hab: null,
            id_harvest_type: [null, Validators.required],
            date_start: [null, Validators.required],
            date_end: null,
            place_remarks: null,
            remarks: null,
            observers: [[], Validators.required],
            geom: null,
            id_dataset: [this.cfg.CONSERVATION_FLORA_EXSITU.default_dataset, Validators.required],
            id_area_type: [null],
            id_area_muni: [null],
            id_area_dept: [null],
            surface: null,
            altitude: null,
            id_exposition: null,
            slope: null,
            precision: null,
            id_geographical_precision: [null, Validators.required],
            additional_data: this.fb.group({})
        });
        // this.harvestForm.reset();
        // this.setupValueChangeListeners();
        this.harvestForm.setValidators([
          this.coreFormService.dateValidator(
            this.harvestForm.get('date_start'),
            this.harvestForm.get('date_end')
          ),
        ]);

        this.harvestForm.controls['id_geographical_precision'].valueChanges.subscribe(value => {
          if (value && value.id_nomenclature) {
            const idNomenclature = value.id_nomenclature;
            this.getCodesNomenclature(idNomenclature);
          }
        });
    }


    updateFormFields(code_nomenclature: string) {
      this.hideAllFields()
      const config = this.constants.FIELD_CONFIGS.get(code_nomenclature);      
  
      if (config) {
        this.harvestForm.controls['id_area_type'].setValue(config.locationType || null);
        
        // Gestion de l'affichage des champs
        this.showCommuneField = !!config.showCommune;
        this.showDepartmentField = !!config.showDepartment;
        this.showMapField = !!config.showMap;
        this.showResolutionField = !!config.showResolution;

        if (this.showMapField) {
          // Si la carte doit être affichée, on la rend active
          this.mapService.setShowMap(true);
        } else {
          // Si la carte ne doit pas être affichée, on la cache ou la désactive
          this.mapService.setShowMap(false);
        }
  
        if (config.hideAll) {
          this.hideAllFields();
        }
  
        if (config.callFormValid) {
          this.formValid();
        }
      } else {
        this.hideAllFields();
      }
    }

    hideAllFields() {
      this.showCommuneField = false;
      this.showDepartmentField = false;
      this.showMapField = false;
      this.showResolutionField = false;
    }
  
    formValid() {
      // // Validation du formulaire si 'nl' est sélectionné
      // if (this.harvestForm.valid) {
      //   // Effectuer une action lorsque le formulaire est valide
      // }
    }

    patchForm(harvest: any): void {  
      console.log('dans patch', harvest);
      
      
      if (!harvest) return;
      const dateStart = harvest.date_start ? this.dateParser.parse(this.formatDate(harvest.date_start)) : null;
      const dateEnd = harvest.date_end ? this.dateParser.parse(this.formatDate(harvest.date_end)) : null;
  
      this.harvestForm.patchValue({
        id_harvest_type: harvest.id_harvest_type,
        date_start:  dateStart,
        date_end: dateEnd,
        place_remarks: harvest.place_remarks || null,
        remarks: harvest.remarks || null,
        // observers: harvest.observers ? harvest.observers.map(observer => `${observer.prenom_role} ${observer.nom_role}`) : [],
        geom: harvest.geom,
        id_dataset: harvest.id_dataset,
        id_area_type: harvest.id_area_type,
        id_area_muni: (harvest.id_area && harvest.id_area_type === 25) ? [harvest.id_area] : null,
        id_area_dept: (harvest.id_area && harvest.id_area_type === 26) ? [harvest.id_area] : null,
        surface: harvest.surface,
        altitude: harvest.altitude,
        id_exposition: harvest.id_exposition,
        slope: harvest.slope,
        precision: harvest.precision,
        id_geographical_precision: harvest.id_geographical_precision,
        additional_data: harvest.additional_data
      });

      if (harvest.observers && harvest.observers.length > 0) {
        // Appeler la méthode loadObservers pour charger et patcher les observateurs
        const observerIds = harvest.observers.map(observer => observer.id_observer);  // On récupère les IDs des observateurs
        this.loadObservers(observerIds);  // Charger et patcher les observateurs dans le formulaire
      }

      if (harvest.cd_hab) {
        const habitatFormValue = harvest.cd_hab;  
        habitatFormValue['search_name'] = habitatFormValue.lb_code + ' - ' + habitatFormValue.lb_hab_fr;
        this.harvestForm.get('cd_hab')?.setValue(habitatFormValue); 
      }

      if (harvest.id_geographical_precision) {        
        this.getCodesNomenclature(harvest.id_geographical_precision.id_nomenclature);
      }
      if (harvest.geom) {
        this.mapService.updateGeoJsonFileLayer(harvest.geom);
      }   
      
    }
  
    loadObservers(observersIds: any[]): void {
      this._dfService.getObserversFromCode(this.storeService.cfeConfig.observers_list_code).subscribe(observersList => {
    
        // Filtrer les observateurs sélectionnés en fonction des IDs stockés
        const selectedObservers = observersList.filter(observer =>
          observersIds.includes(observer.id_role)  // Comparaison avec les IDs des observateurs sélectionnés
        );        
    
        // Mettre à jour le FormControl des observateurs avec les données des observateurs filtrés
        this.harvestForm.controls.observers.setValue(selectedObservers);
      });
    }    


    // Gestion des choix de l'affichage en fonction de la précision géographique choisi
  getCodesNomenclature(idNomenclature: number): void {    
    this.api.getCodesNomenclature(idNomenclature).subscribe({
      next: (codeNomenclature: string) => {
        if (codeNomenclature) {
          this.updateFormFields(codeNomenclature);
          this.updateValidators(codeNomenclature);
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  } 

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }


  updateValidators(code_nomenclature: string): void {
    // Réinitialiser les validateurs
    this.clearValidators(code_nomenclature);

    const config = this.constants.FIELD_CONFIGS.get(code_nomenclature);  
     

    if (config) {
      // Ajouter des validateurs conditionnels
      if (code_nomenclature === this.constants.LOCATION_CODES.COMMUNE) {
        this.harvestForm.controls['id_area_muni'].setValidators([Validators.required]);
      } else if (code_nomenclature === this.constants.LOCATION_CODES.DEPARTMENT) {
        this.harvestForm.controls['id_area_dept'].setValidators([Validators.required]);
      } else if (code_nomenclature === this.constants.LOCATION_CODES.PTP) {
        this.harvestForm.controls['geom'].setValidators([Validators.required]);
      } else if (code_nomenclature === this.constants.LOCATION_CODES.PTAPP) {
        this.harvestForm.controls['geom'].setValidators([Validators.required]);
        this.harvestForm.controls['precision'].setValidators([Validators.required]);
      }
      this.harvestForm.updateValueAndValidity();
    }
  }

  // Méthode pour effacer les validateurs de certains champs
  clearValidators(code_nomenclature: string): void {
    const isEditing = this.exsituService.editionMode.getValue();
  
    if (!isEditing) {
      this.harvestForm.controls['id_area_muni'].setValue(null);
      this.harvestForm.controls['id_area_dept'].setValue(null);
      this.harvestForm.controls['geom'].setValue(null);
      this.harvestForm.controls['precision'].setValue(null);
    } else {
      if (code_nomenclature !== this.constants.LOCATION_CODES.COMMUNE) {
        this.harvestForm.controls['id_area_muni'].setValue(null);
      }
  
      if (code_nomenclature !== this.constants.LOCATION_CODES.DEPARTMENT) {        
        this.harvestForm.controls['id_area_dept'].setValue(null);
      }
  
      if (code_nomenclature !== this.constants.LOCATION_CODES.PTP &&
        code_nomenclature !== this.constants.LOCATION_CODES.PTAPP) {
        this.harvestForm.controls['geom'].setValue(null);
      }
  
      if (code_nomenclature !== this.constants.LOCATION_CODES.PTAPP) {
        this.harvestForm.controls['precision'].setValue(null);
      }
    }
  
    // Supprimer les validateurs
    this.harvestForm.controls['id_area_muni'].clearValidators();
    this.harvestForm.controls['id_area_dept'].clearValidators();
    this.harvestForm.controls['geom'].clearValidators();
    this.harvestForm.controls['precision'].clearValidators();
    this.harvestForm.updateValueAndValidity();
  }

    
}