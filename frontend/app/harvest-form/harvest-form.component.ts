import { Component, OnInit, AfterViewInit, HostListener, OnDestroy } from '@angular/core';

import { leafletDrawOption } from '@geonature_common/map/leaflet-draw.options';
import { ModuleService } from '@geonature/services/module.service';
import { HarvestStoreService } from '../services/store.service';
import { FormGroup, FormBuilder, Validators, ValidatorFn  } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { HarvestFormService } from './harvest-form.service';
import { CommonService } from '@geonature_common/service/common.service';



@Component({
  selector: 'ex-harvest-form',
  templateUrl: './harvest-form.component.html',
  styleUrls: ['./harvest-form.component.css'],
})
export class HarvestFormComponent implements OnInit, OnDestroy {
  public leafletDrawOptions = leafletDrawOption;
  public MAP_FULL_HEIGHT = '86vh';
  public mapHeight = this.MAP_FULL_HEIGHT;
  public markerCoordinates;
  public currentGeoJsonFileLayer;
  harvestForm: FormGroup;
  public center;
  public zoom;
  isChecked:boolean = false;
  cardContentHeight: any;



  constructor(
    public moduleService: ModuleService,
    public storeService: HarvestStoreService,
    private formBuilder: FormBuilder,
    private router: Router,
    private dateParser: NgbDateParserFormatter,
    public api: DataService,
    private exsituFormService: ExsituFormService,
    public harvertFormService: HarvestFormService,
    private _commonService: CommonService
  ) {
    
  }

  ngOnInit() {
    // this.leafletDrawOptions = leafletDrawOption;
    // this.harvestForm.harvestForm = this.harvestForm.initHarvestForm();
    // this.storeService.defaultNomenclature$.pipe(filter((val) => val !== null)).subscribe((val) => {
    //   this.harvestForm.patchDefaultNomenclaureStation(val);
    // });    

    this.harvestForm = this.harvertFormService.harvestForm;
    //this.initializeHarvestForm()
    // this.initializeLeafletDrawOptions()
    this.zoom = this.storeService.cfeConfig.zoom
    this.center = this.storeService.cfeConfig.zoom_center

    this.harvestForm.controls['id_geographical_location'].valueChanges.subscribe(value => {      
      if(value && value.id_nomenclature) {
        const idNomenclature = value.id_nomenclature
        this.harvertFormService.getCodesNomenclature(idNomenclature);
      }
    });
  }

  formatter(item) {
    return item.search_name;
  }

  onChange($event: MatCheckboxChange){
    this.isChecked = $event.checked;
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
    this.harvestForm.reset();    
    this.harvertFormService.harvestForm.reset()
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/`]);
  }

  onSubmit() {
    let finalForm = this.formatDataFormZp();
    console.log(finalForm);
    

    this.api.addHarvest(finalForm).subscribe((harvest) => {
      this._commonService.translateToaster('info', 'Récolte enregistrée');
      this.onFormSaved(harvest.harvest);
    });
    
  }

  private onFormSaved(harvest) {
    this.exsituFormService.currentTab = 'materials'
    this.exsituFormService.idHarvest = harvest.id_harvest
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/form/harvest/${this.exsituFormService.idHarvest}/material-form`]);
  }


  private formatDataFormZp() {
    const finalForm = JSON.parse(JSON.stringify(this.harvestForm.value));

    
    if(finalForm.id_harvest_type)
      finalForm.id_harvest_type = finalForm.id_harvest_type.id_nomenclature;
    if(finalForm.id_exposition)
      finalForm.id_exposition = finalForm.id_exposition.id_nomenclature;
    finalForm.id_geographical_location = finalForm.id_geographical_location.id_nomenclature;

    if(finalForm.cd_hab)
      finalForm.cd_hab = finalForm.cd_hab.cd_hab;
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


  ngOnDestroy(): void {
    this.harvestForm.reset()
  }
}