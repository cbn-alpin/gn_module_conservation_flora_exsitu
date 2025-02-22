import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { MaterialFormService } from './material-form.service';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';


interface Material {
  id: number;
  code_material: string;
  code_parent?: string;
  id_parent: number,
  id_harvest_material?: string;
  id_foot_counting_class?: string;
  id_phenology_1?: string;
  id_phenology_2?: string;
  protocole_note?: string;
  comment?: string;
  code_cultural_bank?: number;
  sample_foot_nb?: number;
  id_method_sample?: string;
  is_soil_sampling: boolean;
}

@Component({
  selector: 'cs-material-form',
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.css'],
})
export class MaterialFormComponent implements OnInit {
  materialForm: FormGroup;
  rec_material_in_progress$: BehaviorSubject<Material[]> = new BehaviorSubject<Material[]>([]);
  idHarvest: number | null = null;
  harvest: any;
  
  constructor(
    private formBuilder: FormBuilder,
    public materialFormService: MaterialFormService,
    private activatedRoute: ActivatedRoute,
    public api: DataService,
    public exsituFormService: ExsituFormService
  ) 
  {}

  ngOnInit(): void {
    // this.idHarvest = Number(this.activatedRoute.snapshot.paramMap.get('id_harvest')); 
    this.idHarvest = this.exsituFormService.idHarvest
    //this.harvest = history.state.harvest;
    this.loadHarvest(this.idHarvest)
    this.initializeMaterialForm()
    if(this.exsituFormService.mode !== 'add')
      this.loadMaterials()
  }

  loadHarvest(id_harvest){
    this.api.getHarvestById(id_harvest).subscribe((harvest) => {
      this.harvest = harvest
    });
  }

    loadMaterials(){
      this.materialFormService.getMaterialsByHarvest(this.exsituFormService.idHarvest)
    }

    private initializeMaterialForm() {
      this.materialForm = this.materialFormService.form
    }

    /**
   *  Supprime les balises HTML d'un string
   **/
  removeHtml(str: string | undefined): string {
    return str ? str.replace(/<[^>]*>/g, '') : ''; // Retourne une chaîne vide si str est undefined
  }


  /**
   *  Return un titre formaté sans balise HTML
   **/
  materialTitle(material) {
    return this.removeHtml(material.code_material);
  }

  editOccurrence(material) {
    this.materialFormService.materials$.next(material);
  }

  inProgressErrorToForm(mat_in_progress) {
    if (mat_in_progress.state !== 'error') {
      return;
    }

    this.editOccurrence(mat_in_progress.data);
    this.materialFormService.removeMaterialInProgress(mat_in_progress.id);
  }

  submetData(){
    let finalForm = this.formatDataFormHarvest();
    this.materialFormService.submitOccurrence(finalForm);
    
    
    // this.api.addMaterial(finalForm, this.exsituFormService.idHarvest).subscribe((material) => {      
    //   //this.addMaterial2(material)
    // });
  }

  private formatDataFormHarvest() {
    const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));
    finalForm.id_phenology_1 = finalForm.id_phenology_1.id_nomenclature;
    finalForm.id_phenology_2 = finalForm.id_phenology_2.id_nomenclature;
    finalForm.id_harvest_material = finalForm.id_harvest_material.id_nomenclature;
    finalForm.id_foot_counting_class = finalForm.id_foot_counting_class.id_nomenclature;
    finalForm.id_method_sample = finalForm.id_method_sample.id_nomenclature;
    console.log('finalForm: ', finalForm);
    

    return finalForm;
  }

  addMaterial2(newMaterial) {
    // const newMaterial = {
    //   id: Date.now(),
    //   code_material: this.materialForm.value.code_material,
    //   code_parent: this.materialForm.value.code_parent,
    //   id_parent: this.materialForm.value.id_parent,
    //   id_harvest_material: this.materialForm.value.id_harvest_material.id_nomenclature,
    //   id_foot_counting_class: this.materialForm.value.id_foot_counting_class.id_nomenclature,
    //   id_phenology_1: this.materialForm.value.id_phenology_1.id_nomenclature,
    //   id_phenology_2: this.materialForm.value.id_phenology_2.id_nomenclature,
    //   comment: this.materialForm.value.comment,
    //   protocole_note: this.materialForm.value.protocole_note,
    //   code_cultural_bank: this.materialForm.value.code_cultural_bank,
    //   sample_foot_nb: this.materialForm.value.sample_foot_nb,
    //   is_soil_sampling: this.materialForm.value.is_soil_sampling
    // };    

    this.materialFormService.materials$.next(this.materialFormService.materials$.getValue().concat(newMaterial));
    this.materialForm.reset();
  }

  editMaterial(material: Material) {
    // Remplir le formulaire avec les valeurs du matériel sélectionné
    this.materialForm.patchValue(material);
  
    // Supprimer ce matériel de la liste
    const updatedMaterials = this.materialFormService.materials$.getValue().filter(m => m.id !== material.id);
    this.materialFormService.materials$.next(updatedMaterials);
  }
  

  deleteMaterial(material: Material) {
    const updatedList = this.materialFormService.materials$.getValue().filter(m => m.id !== material.id);
    this.materialFormService.materials$.next(updatedList);
  }

  resetOccurrenceForm() {
    this.materialFormService.reset();
  }
  
}