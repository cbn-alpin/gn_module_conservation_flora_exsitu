import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModuleService } from '@geonature/services/module.service';
import { Router, ActivatedRoute } from '@angular/router';
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
    idHarvest: string | null = null;
    idMaterial: string | null = null;
    public currentModulePath: string
    cardContentHeight: any;
    public urlSub: Subscription;
    harvest: any

    constructor(
        public router: Router,
        private route: ActivatedRoute,
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

        this.urlSub = this.router.events.subscribe(() => {
          this.updateTabAndIdsFromUrl(this.router.url);
        });
    
        // Initialisation avec l'URL actuelle (utile au rechargement)
        this.updateTabAndIdsFromUrl(this.router.url);        
        this.harvest = this.exsituFormService.harvest
    }

    goToTab(tab: string) {
        if (tab === 'materials' && this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material-form`]);
        } else if (tab === 'harvest' && this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}`]);
        }
    }

    updateTabAndIdsFromUrl(url: string) {
      let urlSegments = url.split('/');
      
  
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
  
      // Vérifie si l'URL contient "seed-form"
      if (urlSegments.includes('seed-form')) {
        this.exsituFormService.currentTab = 'seeds';
  
        let index = urlSegments.indexOf('material') + 1;
  
        // Vérifie si un ID de matériel est présent après "material"
        if (index < urlSegments.length && !isNaN(Number(urlSegments[index]))) {
          this.exsituFormService.idHarvest = Number(urlSegments[index]);
        } else {
          this.exsituFormService.idHarvest = null ;
          this.router.navigate([`${this.currentModulePath}/form/harvest`]);// Redirection si l'ID de récolte est absent
        }
      }
    }

    ngAfterViewInit() {
      setTimeout(() => this.calcCardContentHeight(), 500);
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