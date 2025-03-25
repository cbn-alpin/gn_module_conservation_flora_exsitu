import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy } from '@angular/core';

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
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'ex-harvest-form',
  templateUrl: './harvest-form.component.html',
  styleUrls: ['./harvest-form.component.css'],
})
export class HarvestFormComponent implements OnInit, OnDestroy, AfterViewChecked  {
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
    public exsituFormService: ExsituFormService,
    public harvertFormService: HarvestFormService,
    private _commonService: CommonService,
    private cdr: ChangeDetectorRef,
  ) {
    
  }

  ngOnInit() {
    this.harvertFormService.hideAllFields()
    if (this.exsituFormService.editionMode.getValue()) { // Si on est en mode ajout
      this.harvertFormService.initForm();  // On recrée le formulaire vide
    }
    this.harvestForm = this.harvertFormService.harvestForm;
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

  cancel(){
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/`]);
  }

  onSubmit() {
    let finalForm = this.formatDataForm();    
    if(!this.exsituFormService.editionMode['_value']){
      this.api.addHarvest(finalForm).subscribe((harvest) => {
        this._commonService.translateToaster('info', 'Récolte enregistrée');
        this.onFormSaved(harvest.harvest);
      });
      console.log(finalForm);
    }
    else{
      console.log(finalForm);
      this.api.updateHarvest(this.exsituFormService.idHarvest, finalForm).subscribe(() => {
        this._commonService.translateToaster('info', 'Récolte modifiée');
        // this.onFormSaved(harvest.harvest);
      });
    }
    
  }

  private onFormSaved(harvest) {
    this.exsituFormService.currentTab = 'materials'
    this.exsituFormService.idHarvest = harvest.id_harvest
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/form/harvest/${this.exsituFormService.idHarvest}/material-form`]);
  }


  private formatDataForm() {
    const finalForm = JSON.parse(JSON.stringify(this.harvestForm.value));

    const isAdditionalDataEmpty = !finalForm.additional_data.slope &&
                                !finalForm.additional_data.weather_comment &&
                                !finalForm.additional_data.program

    if (isAdditionalDataEmpty) {
      delete finalForm.additional_data;
    }  
    
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
    this.harvestForm.reset();
    this.harvertFormService.harvestForm.reset()
    this.harvertFormService.initForm();
  }

  ngAfterViewChecked(): void {
    // Cette méthode sera appelée après chaque détection de changement, ce qui pourrait résoudre votre problème.
    this.cdr.detectChanges();
  }

}