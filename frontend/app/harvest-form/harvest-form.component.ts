import { Component, OnInit } from '@angular/core';
import { GeoJSON } from 'leaflet';

import { leafletDrawOption } from '@geonature_common/map/leaflet-draw.options';
import { ModuleService } from '@geonature/services/module.service';
import { HarvestFormService } from '../services/harvest-form-service';
import { HarvestStoreService } from '../services/store.service';
import { filter } from 'rxjs/operators';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../services/data.service';



@Component({
  selector: 'cs-harvest',
  templateUrl: './harvest-form.component.html',
  styleUrls: ['./harvest-form.component.css'],
  providers: [HarvestFormService],
})
export class HarvestFormComponent implements OnInit {
  public leafletDrawOptions = leafletDrawOption;
  public MAP_FULL_HEIGHT = '87vh';
  public mapHeight = this.MAP_FULL_HEIGHT;
  public markerCoordinates;
  public currentGeoJsonFileLayer;
  harvestForm: FormGroup;


  constructor(
    public moduleService: ModuleService,
    public storeService: HarvestStoreService,
    private formBuilder: FormBuilder,
    private router: Router,
    private dateParser: NgbDateParserFormatter,
    public api: DataService,
  ) {
    
  }

  ngOnInit() {
    // this.leafletDrawOptions = leafletDrawOption;
    // this.harvestForm.harvestForm = this.harvestForm.initHarvestForm();
    // this.storeService.defaultNomenclature$.pipe(filter((val) => val !== null)).subscribe((val) => {
    //   this.harvestForm.patchDefaultNomenclaureStation(val);
    // });
    this.initializeHarvestForm()
    this.initializeLeafletDrawOptions()
  }

  formatter(item) {
    return item.search_name;
  }

  private initializeHarvestForm() {
    this.harvestForm = this.formBuilder.group({
      id_harvest: null,
      cd_hab: [null, Validators.required],
      id_harvest_type: [null, Validators.required],
      date_start: [null, Validators.required],
      date_end: [null],
      place_comment: [null],
      comment: [null],
      observers: [[], Validators.required],
      geom: [null, Validators.required],
      id_dataset: [null, Validators.required],
      location_type: [null],
      location_code: [null],
      surface: [20],
      altitude: [30],
      id_exposition: [null],
      precision: [10]
    });
  }

  private initializeLeafletDrawOptions() {
    this.leafletDrawOptions.draw.rectangle = false;
    this.leafletDrawOptions.draw.marker = false;
    this.leafletDrawOptions.draw.circle = false;
    this.leafletDrawOptions.draw.circlemarker = false;
    this.leafletDrawOptions.draw.polyline = false;
    this.leafletDrawOptions.edit.remove = true;
  }

  cancel(){
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/`]);
  }

  addGeoInfo(geojson) {
    this.harvestForm.patchValue({ geom: geojson.geometry });
    console.log(geojson);
    
    this.harvestForm.markAsDirty();
  }

  deleteGeoInfo() {
    this.harvestForm.patchValue({ geom: null });
    this.harvestForm.markAsDirty();
  }

  onSubmit() {
    let finalForm = this.formatDataFormZp();

    this.api.addHarvest(finalForm).subscribe((data) => {
      this.onFormSaved(data);
    });
    
  }

  private onFormSaved(data) {
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}`]);
  }


  private formatDataFormZp() {
    const finalForm = JSON.parse(JSON.stringify(this.harvestForm.value));
    console.log(finalForm);


    finalForm.cd_hab = finalForm.cd_hab.cd_hab;
    finalForm.id_harvest_type = finalForm.id_harvest_type.id_nomenclature;
    finalForm.id_exposition = finalForm.id_exposition.id_nomenclature;

    // Date
    finalForm.date_start = this.dateParser.format(finalForm.date_start);
    finalForm.date_end = this.dateParser.format(finalForm.date_end);

    // Observers
    if (finalForm['observers']) {
      finalForm['observers'] = finalForm['observers'].map((obs) => {
        return obs.id_role;
      });
    } else {
      finalForm['observers'] = [];
    }

    return finalForm;
  }
}