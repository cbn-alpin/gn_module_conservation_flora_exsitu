import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MaterialFormService } from './material-form.service';
import { DataService } from '../../services/data.service';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';

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
    this.initializeMaterialForm();

    this.materialForm.get('code_material')?.valueChanges.subscribe(value => {
      if (this.exsituFormService.mode === 'add' || (this.materialFormService.code_material !== null && value !== this.materialFormService.code_material)) {
        this.checkCodeMaterial(value);
      } else {
        this.codeMaterialExists = false;
      }
    });
  }

  private initializeMaterialForm() {
    this.materialForm = this.materialFormService.form
  }

  submetData(){
    let finalForm = this.formatDataFormHarvest();        
    this.materialFormService.submitOccurrence(finalForm);
  }

  private formatDataFormHarvest() {
    const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));
    
    if(finalForm.taxons)
      finalForm.taxons = finalForm.taxons.map(taxon => taxon.parentFormControl.cd_nom);
    delete finalForm.taxonInput;
    

    return finalForm;
  }

  resetOccurrenceForm() {
    this.materialFormService.reset();
  }

  checkCodeMaterial(codeMaterial: string): void {
    if (codeMaterial) {
      this.api.checkCodeMaterial(codeMaterial).subscribe(
        response => {
          this.codeMaterialExists = response.exists;
        },
        error => {
          console.error('Erreur lors de la vérification du code material', error);
        }
      );
    }
  }
  
}