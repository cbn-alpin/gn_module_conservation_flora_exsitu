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
        private dateParser: NgbDateParserFormatter
    ){
        this.initForm();
        this.setObservables();
    }

    private setObservables() {
      combineLatest([
        this.exsituService.editionMode, // Mode édition
        this.exsituService.exsituData, // Données de la récolte
      ])
        .pipe(
          filter(([isEditing, data]) => isEditing === true && !!data), // Si en édition et que les données existent
          debounceTime(0), 
          tap(([_, data]) =>  this.patchForm(data)) // Mettre à jour le formulaire
        )
        .subscribe();
    }

    initForm(): void {
        this.harvestForm = this.fb.group({
            id_harvest: null,
            cd_hab: [null],
            id_harvest_type: [null, Validators.required],
            date_start: [null, Validators.required],
            date_end: [null],
            place_comment: [null],
            comment: [null],
            observers: [[], Validators.required],
            geom: [null],
            id_dataset: [null, Validators.required],
            location_type: [null],
            location_code_muni: [null],
            location_code_dept: [null],
            surface: [],
            altitude: [],
            id_exposition: [null],
            precision: [],
            id_geographical_location: [null, Validators.required]
        });
        this.harvestForm.reset();
        // this.setupValueChangeListeners();
    }

    geomOrLocationRequired(): ValidatorFn {
        return (form: FormGroup) => {
          const geom = form.get('geom')?.value;
          const locationType = form.get('location_type')?.value;
          const locationCode = form.get('location_code')?.value;
      
          if (geom || (locationType && locationCode)) {
            return null; // Valid
          }
      
          return { geomOrLocationRequired: true }; // Error
        };
    }

    // Un listener pour mettre à jour le validateur
    private setupValueChangeListeners(): void {
        this.harvestForm.get('geom')?.valueChanges.subscribe(() => {
          this.harvestForm.updateValueAndValidity();
        });
    
        this.harvestForm.get('location_type')?.valueChanges.subscribe(() => {
          this.harvestForm.updateValueAndValidity();
        });
    
        this.harvestForm.get('location_code')?.valueChanges.subscribe(() => {
          this.harvestForm.updateValueAndValidity();
        });
    }


    updateFormFields(code_nomenclature: string) {
      const config = this.constants.FIELD_CONFIGS.get(code_nomenclature);      
  
      if (config) {
        this.harvestForm.controls['location_type'].setValue(config.locationType || null);
        
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
      if (!harvest) return;
  
      this.harvestForm.patchValue({
        id_harvest: harvest.id_harvest,
        cd_hab: harvest.cd_hab || '',
        id_harvest_type: harvest.id_harvest_type,
        date_start:  this.parseDate(harvest.date_start),
        date_end: this.parseDate(harvest.date_end),
        place_comment: harvest.place_comment,
        comment: harvest.comment,
        observers: harvest.observers,
        geom: harvest.geom,
        id_dataset: harvest.id_dataset,
        location_type: harvest.location_type,
        location_code_muni: (harvest.location_code && harvest.location_type === 25) ? [harvest.location_code] : '',
        location_code_dept: (harvest.location_code && harvest.location_type === 26) ? [harvest.location_code] : '',
        surface: harvest.surface,
        altitude: harvest.altitude,
        id_exposition: harvest.id_exposition,
        precision: harvest.precision,
        id_geographical_location: harvest.id_geographical_location
      });

      if (harvest.id_geographical_location) {        
        this.getCodesNomenclature(harvest.id_geographical_location);
      }
      if (harvest.geom) {
        this.mapService.updateGeoJsonFileLayer(harvest.geom);
      }        
      
    }


    // Gestion des choix de l'affichage en fonction de la précision géographique choisi
  getCodesNomenclature(idNomenclature: number): void {    
    this.api.getCodesNomenclature(idNomenclature).subscribe({
      next: (response) => {
        if (response && response['code_nomenclature']) {          
          this.updateFormFields(response['code_nomenclature']);
        }
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

    
  parseDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Retourne 'YYYY-MM-DD'
  }

    
}