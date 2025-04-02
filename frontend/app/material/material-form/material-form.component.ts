import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MaterialFormService } from './material-form.service';
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
  remarks?: string;
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
  idHarvest: number | null = null;
  harvest: any;
  codeMaterialExists: boolean = false;

  
  constructor(
    public materialFormService: MaterialFormService,
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
      if (this.exsituFormService.mode === 'add' || (this.materialFormService.code_material !== null && value !== this.materialFormService.code_material)) {
        this.checkCodeMaterial(value);
      } else {
        this.codeMaterialExists = false;
      }
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
    console.log('final',finalForm);
     
    this.materialFormService.submitOccurrence(finalForm);

  }

  private formatDataFormHarvest() {
    const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));
    
    if(finalForm.taxons)
      finalForm.taxons = finalForm.taxons.map(taxon => taxon.parentFormControl.cd_nom);
    delete finalForm.taxonInput;
    

    return finalForm;
  }

  

  editMaterial(material: Material) {
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