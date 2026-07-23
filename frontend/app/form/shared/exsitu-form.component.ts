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
    idSeed: number | null = null;
    public currentModulePath: string
    cardContentHeight: any;
    public urlSub: Subscription;
    harvest: any;
    idStorage: number | null = null;



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
          this.forceTabFromOpenFlag(this.router.url); 


        });
        this.updateTabAndIdsFromUrl(this.router.url);
        this.forceTabFromOpenFlag(this.router.url);

        this.exsituFormService.id_storage.subscribe(id => {
          this.idStorage = id;
        });
    
        // Initialisation avec l'URL actuelle (utile au rechargement)        
        // this.harvest = this.exsituFormService.harvest

    }

    goToTab(tab: string) {
      console.log('onglet cliqué :', tab);
      this.exsituFormService.currentTab = tab;
      console.log('currentTab après affectation :', this.exsituFormService.currentTab);
    
      console.log(tab)
        if (tab === 'materials' && this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material-form`]);
        } else if (tab === 'harvest' && this.exsituFormService.idHarvest) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}`]);
        }else if (tab === 'seed' && this.exsituFormService.idHarvest && this.idMaterial) {
          this.router.navigate([
            `${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/seed-details/${this.exsituFormService.idSeed}`
          ]);
        }else if (tab === 'stock' && this.exsituFormService.idHarvest && this.idMaterial) {
          this.router.navigate([
            `${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/stock`
          ]);
        }
        else if (tab === 'semis-table' && this.exsituFormService.idHarvest && this.idMaterial) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/semis-table`]);
        }
        else if (tab === 'germination-table' && this.exsituFormService.idHarvest && this.idMaterial) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/germination-table`]);
        }
        else if (tab === 'viability-table' && this.exsituFormService.idHarvest && this.idMaterial) {
          this.router.navigate([`${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/viability-table`]);
        }
        else if (
          tab === 'culture-table' &&
          this.exsituFormService.idHarvest &&
          this.idMaterial
        ) {

          /*
          * Culture associée à un Semis précis.
          */
          if (
            this.exsituFormService
              .cultureSourceType === 'sowing' &&
            this.exsituFormService
              .cultureSourceSowingId
          ) {

            this.router.navigate([

              `${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/sowing/${this.exsituFormService.cultureSourceSowingId}/culture-table`

            ]);

            return;
          }


          /*
          * Culture directe du matériel récolté.
          */
          this.exsituFormService
            .setCultureSourceFromMaterial();


          this.router.navigate([

            `${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/culture-table`

          ]);

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
          this.exsituFormService.id_harvest.next(Number(urlSegments[index]));
        } else {
          this.exsituFormService.idHarvest = null;
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

      if (urlSegments.includes('seed-details')) {
        this.exsituFormService.currentTab = 'seed';
      
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const seedIndex = urlSegments.indexOf('seed-details') + 1;
      
        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }

        if (materialIndex < urlSegments.length) {
          this.idSeed = Number(urlSegments[seedIndex]);
          this.exsituFormService.idSeed = Number(urlSegments[seedIndex]);
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
      if (urlSegments.includes('culture-table')) {

        this.exsituFormService.currentTab =
          'culture-table';


        const harvestIndex =
          urlSegments.indexOf('harvest') + 1;

        const materialIndex =
          urlSegments.indexOf('material') + 1;


        if (
          harvestIndex <
          urlSegments.length
        ) {

          this.exsituFormService.idHarvest =
            Number(
              urlSegments[harvestIndex]
            );
        }


        if (
          materialIndex <
          urlSegments.length
        ) {

          this.idMaterial =
            Number(
              urlSegments[materialIndex]
            );

          this.exsituFormService.setIdMaterial(
            this.idMaterial
          );
        }


        /*
        * Cas 1 :
        * /material/A1/culture-table
        *
        * => A1 | NULL | NULL
        *
        * Attention :
        * une URL contenant "test" ne doit surtout
        * pas être considérée comme une Culture
        * directe du matériel.
        */
        if (
          !urlSegments.includes('sowing') &&
          !urlSegments.includes('test')
        ) {

          this.exsituFormService
            .setCultureSourceFromMaterial();

        }


        /*
        * Cas 2 :
        * /material/A1/sowing/S1/culture-table
        *
        * => A1 | S1 | NULL
        */
        if (
          urlSegments.includes('sowing')
        ) {

          const sowingIndex =
            urlSegments.indexOf('sowing') + 1;

          const idSowing =
            Number(
              urlSegments[sowingIndex]
            );


          if (
            sowingIndex <
              urlSegments.length &&
            !isNaN(idSowing) &&
            idSowing > 0
          ) {

            this.exsituFormService
              .setCultureSourceFromSowing(
                idSowing,
                null
              );

          }

        }

        /*
        * Cas 3 :
        * /material/A1/test/T1/culture-table
        *
        * => A1 | NULL | T1
        */
        if (
          urlSegments.includes('test')
        ) {

          const testIndex =
            urlSegments.indexOf('test') + 1;

          const idTest =
            Number(
              urlSegments[testIndex]
            );


          if (
            testIndex <
              urlSegments.length &&
            !isNaN(idTest) &&
            idTest > 0
          ) {

            this.exsituFormService
              .setCultureSourceFromTest(
                idTest,
                null
              );

          }

        }

      }

      if (
        urlSegments.includes(
          'culture-details'
        )
      ) {

        this.exsituFormService.currentTab =
          'culture-details';


        const harvestIndex =
          urlSegments.indexOf(
            'harvest'
          ) + 1;

        const materialIndex =
          urlSegments.indexOf(
            'material'
          ) + 1;


        if (
          harvestIndex <
          urlSegments.length
        ) {

          this.exsituFormService.idHarvest =
            Number(
              urlSegments[
                harvestIndex
              ]
            );

        }


        if (
          materialIndex <
          urlSegments.length
        ) {

          this.idMaterial =
            Number(
              urlSegments[
                materialIndex
              ]
            );

          this.exsituFormService.setIdMaterial(
            this.idMaterial
          );

        }


        /*
        * Culture créée directement
        * depuis le matériel récolté.
        */
        if (
          !urlSegments.includes('sowing') &&
          !urlSegments.includes('test')
        ) {

          this.exsituFormService
            .setCultureSourceFromMaterial();

        }


        /*
        * Culture provenant d'un Semis.
        */
        if (
          urlSegments.includes('sowing')
        ) {

          const sowingIndex =
            urlSegments.indexOf('sowing') + 1;

          const idSowing =
            Number(
              urlSegments[
                sowingIndex
              ]
            );


          if (
            sowingIndex <
              urlSegments.length &&
            !isNaN(idSowing) &&
            idSowing > 0
          ) {

            this.exsituFormService
              .setCultureSourceFromSowing(
                idSowing,
                null
              );

          }

        }

        /*
        * Culture provenant d'un Test
        * de germination.
        *
        * /material/A1/test/T1/culture-details/C1
        */
        if (
          urlSegments.includes('test')
        ) {

          const testIndex =
            urlSegments.indexOf('test') + 1;

          const idTest =
            Number(
              urlSegments[
                testIndex
              ]
            );


          if (
            testIndex <
              urlSegments.length &&
            !isNaN(idTest) &&
            idTest > 0
          ) {

            this.exsituFormService
              .setCultureSourceFromTest(
                idTest,
                null
              );

          }

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
      if (urlSegments.includes('germination-details')) {
        this.exsituFormService.currentTab = 'germination-details';
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const semisIndex = urlSegments.indexOf('germination-details') + 1;

        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }
      }

      if (urlSegments.includes('semis-details')) {
        this.exsituFormService.currentTab = 'semis-details';
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const semisIndex = urlSegments.indexOf('semis-details') + 1;

        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }
      }

      if (urlSegments.includes('viability-details')) {
        this.exsituFormService.currentTab = 'viability-details';
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const semisIndex = urlSegments.indexOf('viability-details') + 1;

        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }
      }
      if (urlSegments.includes('storage')) {
        this.exsituFormService.currentTab = 'stock';
      
        const harvestIndex = urlSegments.indexOf('harvest') + 1;
        const materialIndex = urlSegments.indexOf('material') + 1;
        const storageIndex = urlSegments.indexOf('storage') + 1;
      
        if (harvestIndex < urlSegments.length) {
          this.exsituFormService.idHarvest = Number(urlSegments[harvestIndex]);
        }
      
        if (materialIndex < urlSegments.length) {
          this.idMaterial = Number(urlSegments[materialIndex]);
          this.exsituFormService.idMaterial = Number(urlSegments[materialIndex]);
        }
      
        if (storageIndex < urlSegments.length) {
          this.idStorage = Number(urlSegments[storageIndex]);
          this.exsituFormService.idStorage = Number(urlSegments[storageIndex]);
          this.exsituFormService.id_storage.next(Number(urlSegments[storageIndex]));
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

    private forceTabFromOpenFlag(url: string) {
      try {
        // On veut lire le query param 'open' depuis l'URL actuelle
        // Exemple: .../germination-table?open=tdg
        const dummyBase = 'http://local'; // requis par URL() pour parser correctement
        const u = new URL(url, dummyBase);
        const openFlag = u.searchParams.get('open'); // 'tdg' | 'tsv' | 'semis' | null

        if (!openFlag) return;

        // On bascule l’onglet SANS toucher aux autres logiques existantes
        if (openFlag === 'tdg') {
          // on ne renomme PAS tes onglets : on utilise ceux que tu as déjà
          this.exsituFormService.currentTab = 'germination-table';
        } else if (openFlag === 'tsv') {
          this.exsituFormService.currentTab = 'viability-table';
        } else if (openFlag === 'semis') {
          this.exsituFormService.currentTab = 'semis-table';
        }

        // petit délai pour laisser le DOM/routeur se stabiliser
        setTimeout(() => {
          // si tu as un BehaviorSubject pour notifier l’UI, décommente :
          // this.exsituFormService.current_tab?.next?.(this.exsituFormService.currentTab);
          this.calcCardContentHeight(); // optionnel : recalc layout si utile
        }, 0);
      } catch {
        // pas bloquant
      }
    }

    
}