import { Component, OnInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { ModuleService } from '@geonature/services/module.service';
import { FormGroup, UntypedFormGroup  } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { HarvestFormService } from './harvest-form.service';
import { CommonService } from '@geonature_common/service/common.service';
import { ChangeDetectorRef } from '@angular/core';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'ex-harvest-form',
  templateUrl: './harvest-form.component.html',
  styleUrls: ['./harvest-form.component.css'],
})
export class HarvestFormComponent implements OnInit, OnDestroy, AfterViewChecked  {
  harvestForm: FormGroup;
  additionalDataForm: UntypedFormGroup
  cardContentHeight: any;

  myFormGroup: UntypedFormGroup;
  formsDefinition
  public habref_url
  public observers_list_code;


  constructor(
    public moduleService: ModuleService,
    private router: Router,
    private dateParser: NgbDateParserFormatter,
    public api: DataService,
    public exsituFormService: ExsituFormService,
    public harvertFormService: HarvestFormService,
    private _commonService: CommonService,
    private cdr: ChangeDetectorRef,
    public cfg: ConfigService
  ) {
    
  }

  ngOnInit() { 
    this.habref_url = this.cfg.getBackendUrl() + '/habref/habitats/autocomplete'
    this.observers_list_code = this.cfg.getObsCode()
    this.formsDefinition = this.cfg.getModuleConfigExsitu()['harvest_form']['additional_data'];    
    this.myFormGroup = new UntypedFormGroup({});
    this.harvertFormService.hideAllFields()
    if (this.exsituFormService.editionMode.getValue()) {
      this.harvertFormService.initForm();
    }
    this.harvestForm = this.harvertFormService.harvestForm;
    this.additionalDataForm = this.harvestForm.get('additional_data') as UntypedFormGroup;

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

  cancel(){
    this.router.navigate([`${this.cfg.getModuleUrl()}/`]);
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
    this.router.navigate([`${this.cfg.getModuleUrl()}/form/harvest/${this.exsituFormService.idHarvest}/material-form`]);
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
    
    finalForm.date_start = this.dateParser.format(finalForm.date_start);
    finalForm.date_end = this.dateParser.format(finalForm.date_end);

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
    this.cdr.detectChanges();
  }

}