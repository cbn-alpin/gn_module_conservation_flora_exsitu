import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModuleService } from '@geonature/services/module.service';
import { Router } from '@angular/router';
import { HarvestStoreService } from '../../services/store.service';
import { ExsituFormService } from './exsitu-form.service';
import { MapService } from '@geonature_common/map/map.service';
import { CommonService } from '@geonature_common/service/common.service';


@Component({
  selector: 'ex-exsitu-form',
  templateUrl: './exsitu-form.component.html',
  styleUrls: ['./exsitu-form.component.css'],
})
export class ExsituFormComponent implements OnInit, AfterViewInit, OnDestroy {
    idHarvest: number | null = null;
    idMaterial: number | null = null;
    public currentModulePath: string
    cardContentHeight: any;
    public urlSub: Subscription;
    harvest: any

    constructor(
        public router: Router,
        public storeService: HarvestStoreService,
        public moduleService: ModuleService,
        public exsituFormService: ExsituFormService,
        private _mapService: MapService,
        private _commonService: CommonService
    ){

    }

    ngOnInit(): void {
        this.moduleService.currentModule$.subscribe((module) => {
          this.currentModulePath = module.module_path.toLowerCase();
        });
         console.log(this.currentModulePath)
        this.urlSub = this.router.events.subscribe(() => {
          this.updateTabAndIdsFromUrl(this.router.url);

        });
        // Initialisation avec l'URL actuelle (utile au rechargement)        
        // this.harvest = this.exsituFormService.harvest

    }

    goToTab(tab: string) {
      console.log(tab)
        if (tab === 'materials' && this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material-form`]);
        } else if (tab === 'harvest' && this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}`]);
        }else if (tab === 'stock' && this.exsituFormService.idHarvest && this.idMaterial) {
          this.router.navigate([
            `${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/stock`
          ]);
        }
        else if (tab === 'semis') {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/semis-table`]);
          
        }
        else if (tab === 'germination-table') {
          console.log("here")
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/germination-table`]);

          // if (!this.exsituFormService.idHarvest) {
          //   this.router.navigate([`${this.currentModulePath}/form/germination-table`]);// Redirection si l'ID de récolte est absent
          // }
        }
        else if (tab === 'viability') {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/viability-table`]);
        }
    }

    updateTabAndIdsFromUrl(url: string) {      
      let urlSegments = url.split('/');
      console.log(urlSegments)
  
      // Vérifie si l'URL contient "harvest"
      if (urlSegments.includes('harvest')) {
        this.exsituFormService.currentTab = 'harvest';
        let index = urlSegments.indexOf('harvest') + 1;        
  
        // Vérifie si un ID de récolte est présent après "harvest"
        if (index < urlSegments.length && !isNaN(Number(urlSegments[index]))) {
          this.exsituFormService.idHarvest = Number(urlSegments[index]);
          ///////
          this.exsituFormService.id_harvest.next(Number(urlSegments[index]));
        } else {
          this.exsituFormService.idHarvest = null;
          //////
          this.exsituFormService.id_harvest.next(null);
        }
      }
  
      // Vérifie si l'URL contient "material-form"
      if (urlSegments.includes('material-form')) {
        this.exsituFormService.currentTab = 'materials';
  
        // Vérifie que l'ID de récolte est bien présent avant
        if (!this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest`]);// Redirection si l'ID de récolte est absent
        }
      }
      if (urlSegments.includes('stock')) {
        this.exsituFormService.currentTab = 'stock';
      
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
      
        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }
      }

      
      if (urlSegments.includes('germination-table')) {
        this.exsituFormService.currentTab = 'germination-table';
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const germinationIndex = urlSegments.indexOf('germination-table') + 1;


        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }

      }
      if (urlSegments.includes('viability-table')) {
        this.exsituFormService.currentTab = 'viability-table';
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const viabilityIndex = urlSegments.indexOf('viability-table') + 1;
        
        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }


      }
      if (urlSegments.includes('semis-table')) {
        this.exsituFormService.currentTab = 'semis-table';
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const semisIndex = urlSegments.indexOf('semis-table') + 1;

        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }


      }
      


    }








    ngAfterViewInit() {
      setTimeout(() => this.calcCardContentHeight(), 10);
    }
  
    @HostListener('window:resize', ['$event'])
    onResize(event) {
      this.calcCardContentHeight();
    }
  
    calcCardContentHeight() {
      let minusHeight = <HTMLScriptElement>(<any>document.querySelector('ex-exsitu-form .tab'))
        ? (<HTMLScriptElement>(<any>document.querySelector('ex-exsitu-form .tab'))).offsetHeight
        : 0;
  
      this.cardContentHeight = this._commonService.calcCardContentHeight(minusHeight + 20);
  
      // resize map after resize container
      if (this._mapService.map) {
        setTimeout(() => {
          this._mapService.map.invalidateSize();
        }, 10);
      }
    }


    ngOnDestroy() {
      
        this.urlSub.unsubscribe();
    }

    
}