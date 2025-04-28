
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExsituFormService } from '../exsitu-form.service';
import { DataService } from '../../../services/data.service';


@Component({
  selector: 'cs-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
    harvest: any;
    codeMaterial: string;
    private subscriptions = [];

    constructor(
        public exsituFormService: ExsituFormService,
        public api: DataService
    ){

    }
    ngOnInit(): void {
      this.loadHarvest(this.exsituFormService.idHarvest)
      if (this.exsituFormService.idMaterial) {
        this.loadCodeMaterial();
      }
  
      const sub = this.exsituFormService.idMaterialChange.subscribe(idMaterial => {
        if (idMaterial) {
          this.loadCodeMaterial();
        } else {
          this.codeMaterial = null;
        }
      });
      this.subscriptions.push(sub);
    }

    loadHarvest(id_harvest){
      this.api.getHarvestInfos(id_harvest).subscribe((harvest) => {
        this.harvest = harvest
      });
    }

    loadCodeMaterial(){
      if (this.exsituFormService.idMaterial) {
        this.api.getMaterialInfos(this.exsituFormService.idMaterial).subscribe({
          next: (material) => {
            this.codeMaterial = material.code_material;            
          },
          error: (err) => {
            console.error('Erreur lors de la récupération du matériel:', err);
          }
        });
      }
    }

    ngOnDestroy() {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}