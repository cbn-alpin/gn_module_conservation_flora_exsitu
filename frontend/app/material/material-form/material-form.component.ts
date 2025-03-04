import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { MaterialFormService } from './material-form.service';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { debounceTime, switchMap } from 'rxjs/operators';


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
  codeMaterialExists: boolean = false;

  
  constructor(
    private formBuilder: FormBuilder,
    public materialFormService: MaterialFormService,
    private activatedRoute: ActivatedRoute,
    public api: DataService,
    public exsituFormService: ExsituFormService
  ) 
  {}

  ngOnInit(): void {
    this.idHarvest = this.exsituFormService.idHarvest
    this.loadHarvest(this.idHarvest)
    this.initializeMaterialForm();
    if(this.exsituFormService.mode !== 'add')
      this.loadMaterials()

    this.materialForm.get('code_material')?.valueChanges.subscribe(value => {
      this.checkCodeMaterial(value);
    });
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


  editOccurrence(material) {
    this.materialFormService.materials$.next(material);
  }


  submetData(){
    let finalForm = this.formatDataFormHarvest();
    this.materialFormService.submitOccurrence(finalForm);

  }

  private formatDataFormHarvest() {
    const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));
    finalForm.id_phenology_1 = finalForm.id_phenology_1.id_nomenclature;
    if(finalForm.id_phenology_2)
      finalForm.id_phenology_2 = finalForm.id_phenology_2.id_nomenclature;
    finalForm.id_harvest_material = finalForm.id_harvest_material.id_nomenclature;
    if(finalForm.id_foot_counting_class)
      finalForm.id_foot_counting_class = finalForm.id_foot_counting_class.id_nomenclature;
    if(finalForm.id_method_sample)
      finalForm.id_method_sample = finalForm.id_method_sample.id_nomenclature;
    

    return finalForm;
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

  checkCodeMaterial(codeMaterial: string): void {
    if (codeMaterial) {
      this.api.checkCodeMaterial(codeMaterial).subscribe(
        response => {
          this.codeMaterialExists = response.exists;  // Mettre à jour l'état en fonction de la réponse
        },
        error => {
          console.error('Erreur lors de la vérification du code material', error);
        }
      );
    }
  }
  
}