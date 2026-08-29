  
  import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { MatPaginator } from '@angular/material/paginator';
  import { Router } from '@angular/router';
import { ViabilityComponent } from '../viability/viability.component';
import { MatDialog } from '@angular/material/dialog';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';

import { ActivatedRoute } from '@angular/router';

import {
  DateAdapter
} from '@angular/material/core';

import {
  FrenchDateAdapter
} from '../services/french-date-adapter';

  interface Viability {
    numSemis: string;
    numSemence: string;
    dateDebut: Date;
    dateFin: Date;
    replicate: number;
    levage: number;
  }
  @Component({
    selector: 'app-viability-table',
    templateUrl: './viability-table.component.html',
    styleUrls: ['./viability-table.component.scss'],

    providers: [
      {
        provide: DateAdapter,
        useClass: FrenchDateAdapter
      }
    ]
  })
  export class ViabilityTableComponent implements OnInit, AfterViewInit {
   idMaterial: number | null = null;
     idStorage: number | null = null;
     codeT: any= 'via'
     idGermination:any;
     constructor(
       public router: Router,
       private dialog: MatDialog,
       public exsituFormService: ExsituFormService,
       private api: DataService,
       private route: ActivatedRoute,
       private dialogService: DialogService,
       private toast: CommonService
     ) {}
   
     dataSource = new MatTableDataSource<any>();

     private paginatorRef!: MatPaginator;

     @ViewChild(MatPaginator)
     set paginator(paginator: MatPaginator) {
       if (paginator) {
         this.paginatorRef = paginator;
         this.syncPaginator();
       }
     }

     rowPerPage = 5;


     /*
      * Liste complète reçue de l'API.
      *
      * Elle ne doit jamais être remplacée
      * par le résultat filtré.
      */
     public allViabilityTests: any[] = [];


     /*
      * Valeurs sélectionnées dans les filtres.
      */
     public viabilityCodeFilter = '';

     public viabilityStartDateFromFilter:
       Date | null = null;

     public viabilityTreatmentFilter:
       string | null = null;

     public viabilityPreTreatmentFilter:
       boolean | null = null;


     /*
      * Options dynamiques.
      */
     public viabilityTreatmentFilterOptions:
       string[] = [];

     public viabilityPreTreatmentFilterOptions:
       boolean[] = [];


     public activeActionRowId: number | null = null;

     public setActiveActionRow(row: any): void {
       this.activeActionRowId = row.id_test;
     }

     public clearActiveActionRow(): void {
       this.activeActionRowId = null;
     }

     public isActionRowActive(row: any): boolean {
       return this.activeActionRowId === row.id_test;
     }
   
     @Output() view = new EventEmitter<Viability>();
     @Output() edit = new EventEmitter<Viability>();
     @Output() delete = new EventEmitter<Viability>();
   
     displayedColumns: string[] = [
       'code',
       'meta_create_date',
       'seed_initial_count',
      //  'photo_thermo_regime',
       'traitement',
       'pre_treatment',
       'actions'
     ];
   
     private syncPaginator(): void {
       if (!this.paginatorRef) {
         return;
       }

       this.dataSource.paginator =
         this.paginatorRef;
     }

     ngAfterViewInit(): void {
       this.syncPaginator();
     }


     /* =========================================================
        FILTRES DE LA LISTE VIABILITÉ
        ========================================================= */


     private getViabilityTreatmentFilterValue(
       test: any
     ): string {

       const value =
         test?.traitement ||
         test?.treatment_label ||
         '';


       const normalizedValue =
         String(value).trim();


       /*
        * Une valeur vide ou null correspond
        * à l'absence de liquide de traitement.
        *
        * On utilise "-" comme dans le tableau
        * afin de pouvoir également filtrer
        * les tests sans liquide renseigné.
        */
       return normalizedValue
         ? normalizedValue
         : '-';
     }


     private getViabilityPreTreatmentFilterValue(
       test: any
     ): boolean {

       return test?.pre_treatment === true;
     }


     private getViabilityDateFilterKey(
       value: any
     ): string {

       if (!value) {
         return '';
       }


       /*
        * Date directement renvoyée par l'API.
        */
       if (typeof value === 'string') {

         const datePart =
           value.split('T')[0];


         if (
           /^\d{4}-\d{2}-\d{2}$/.test(
             datePart
           )
         ) {
           return datePart;
         }

       }


       const date =
         value instanceof Date
           ? value
           : new Date(value);


       if (
         Number.isNaN(
           date.getTime()
         )
       ) {
         return '';
       }


       const year =
         date.getFullYear();

       const month =
         String(
           date.getMonth() + 1
         ).padStart(2, '0');

       const day =
         String(
           date.getDate()
         ).padStart(2, '0');


       return `${year}-${month}-${day}`;
     }


     /*
      * N° du test + Date constituent les filtres
      * de base.
      *
      * Ils déterminent également quelles valeurs
      * restent possibles dans les listes
      * Liquide traitement / Prétraitement.
      */
     private getViabilityMatchingBaseFilters():
       any[] {

       const normalizedCode =
         String(
           this.viabilityCodeFilter || ''
         )
           .trim()
           .toLowerCase();


       const selectedDateKey =
         this.getViabilityDateFilterKey(
           this.viabilityStartDateFromFilter
         );


       return this.allViabilityTests.filter(
         test => {

           const testCode =
             String(
               test?.code || ''
             )
               .trim()
               .toLowerCase();


           const testDateKey =
             this.getViabilityDateFilterKey(
               test?.meta_create_date
             );


           const matchesCode =
             !normalizedCode ||
             testCode.includes(
               normalizedCode
             );


           const matchesDate =
             !selectedDateKey ||
             (
               !!testDateKey &&
               testDateKey >=
                 selectedDateKey
             );


           return (
             matchesCode &&
             matchesDate
           );

         }
       );
     }


     /*
      * Rend Liquide traitement et Prétraitement
      * dynamiques entre eux.
      *
      * Exemple :
      *
      * Prétraitement = Oui
      *   ->
      * seuls les liquides réellement présents
      * pour les tests ayant un prétraitement
      * restent proposés.
      *
      * Liquide = X
      *   ->
      * seules les valeurs Oui / Non réellement
      * compatibles avec ce liquide restent
      * proposées.
      */
     private updateViabilityFilterOptions(
       baseTests: any[]
     ): void {

       let selectedTreatment =
         this.viabilityTreatmentFilter;

       let selectedPreTreatment =
         this.viabilityPreTreatmentFilter;


       let treatmentOptions:
         string[] = [];

       let preTreatmentOptions:
         boolean[] = [];


       /*
        * Deux passages permettent également
        * d'annuler automatiquement une sélection
        * devenue impossible après modification
        * du N° de test ou de la Date.
        */
       for (
         let pass = 0;
         pass < 2;
         pass++
       ) {

         /*
          * Options de liquide disponibles en tenant
          * compte du prétraitement sélectionné.
          */
         const testsForTreatments =
           baseTests.filter(
             test =>
               selectedPreTreatment === null ||
               this.getViabilityPreTreatmentFilterValue(
                 test
               ) === selectedPreTreatment
           );


         treatmentOptions =
           Array.from(
             new Set(
               testsForTreatments
                 .map(
                   test =>
                     this.getViabilityTreatmentFilterValue(
                       test
                     )
                 )
             )
           )
             .sort(
               (a, b) => {

                 /*
                  * On place toujours "-"
                  * en premier dans la liste.
                  */
                 if (a === '-') {
                   return -1;
                 }

                 if (b === '-') {
                   return 1;
                 }

                 return a.localeCompare(
                   b,
                   'fr'
                 );
               }
             );


         if (
           selectedTreatment &&
           !treatmentOptions.includes(
             selectedTreatment
           )
         ) {
           selectedTreatment = null;
         }


         /*
          * Options Oui / Non disponibles en tenant
          * compte du liquide sélectionné.
          */
         const testsForPreTreatment =
           baseTests.filter(
             test =>
               !selectedTreatment ||
               this.getViabilityTreatmentFilterValue(
                 test
               ) === selectedTreatment
           );


         preTreatmentOptions =
           Array.from(
             new Set(
               testsForPreTreatment.map(
                 test =>
                   this.getViabilityPreTreatmentFilterValue(
                     test
                   )
               )
             )
           )
             .sort(
               (a, b) =>
                 Number(b) -
                 Number(a)
             );


         if (
           selectedPreTreatment !== null &&
           !preTreatmentOptions.includes(
             selectedPreTreatment
           )
         ) {
           selectedPreTreatment = null;
         }

       }


       this.viabilityTreatmentFilter =
         selectedTreatment;

       this.viabilityPreTreatmentFilter =
         selectedPreTreatment;

       this.viabilityTreatmentFilterOptions =
         treatmentOptions;

       this.viabilityPreTreatmentFilterOptions =
         preTreatmentOptions;
     }


     public applyViabilityFilters(): void {

       /*
        * 1. N° test + Date.
        */
       const baseTests =
         this.getViabilityMatchingBaseFilters();


       /*
        * 2. Recalcul dynamique des choix disponibles.
        */
       this.updateViabilityFilterOptions(
         baseTests
       );


       /*
        * 3. Application finale :
        *    Liquide + Prétraitement.
        */
       const filteredTests =
         baseTests.filter(
           test => {

             const treatment =
               this.getViabilityTreatmentFilterValue(
                 test
               );

             const preTreatment =
               this.getViabilityPreTreatmentFilterValue(
                 test
               );


             const matchesTreatment =
               !this.viabilityTreatmentFilter ||
               treatment ===
                 this.viabilityTreatmentFilter;


             const matchesPreTreatment =
               this.viabilityPreTreatmentFilter ===
                 null ||
               preTreatment ===
                 this.viabilityPreTreatmentFilter;


             return (
               matchesTreatment &&
               matchesPreTreatment
             );

           }
         );


       /*
        * Le tableau reçoit uniquement la liste
        * filtrée.
        *
        * MatTableDataSource informe automatiquement
        * le MatPaginator du nouveau nombre de lignes.
        */
       this.dataSource.data =
         filteredTests;


       /*
        * Après n'importe quel changement de filtre,
        * retour systématique à la page 1.
        */
       setTimeout(() => {

         this.syncPaginator();


         if (this.paginatorRef) {
           this.paginatorRef.firstPage();
         }

       });
     }


     public onViabilityCodeFilterChange(
       value: string
     ): void {

       this.viabilityCodeFilter =
         value || '';

       this.applyViabilityFilters();
     }


     public onViabilityStartDateFromFilterChange(
       value: Date | null
     ): void {

       this.viabilityStartDateFromFilter =
         value;

       this.applyViabilityFilters();
     }


     public onViabilityTreatmentFilterChange(
       value: string | null
     ): void {

       this.viabilityTreatmentFilter =
         value;

       this.applyViabilityFilters();
     }


     public onViabilityPreTreatmentFilterChange(
       value: boolean | null
     ): void {

       this.viabilityPreTreatmentFilter =
         value;

       this.applyViabilityFilters();
     }


     public resetViabilityFilters(): void {

       this.viabilityCodeFilter = '';

       this.viabilityStartDateFromFilter =
         null;

       this.viabilityTreatmentFilter =
         null;

       this.viabilityPreTreatmentFilter =
         null;


       this.applyViabilityFilters();
     }


     ngOnInit(): void {
      this.route.queryParams.subscribe(params => {
        this.loadTests();

        if (params['open'] === 'tsv') {
          setTimeout(() => {
            this.dialog.closeAll(); // sécurité

            this.dialog.open(ViabilityComponent, {
              width: '900px',
              height: '90vh',
              autoFocus: false
            });

            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }, 10);
        }
      });
    }

     onBackToMaterial(): void {
       const idHarvest = this.exsituFormService.idHarvest;

       if (!idHarvest) {
         console.error(
           'Impossible de revenir au matériel récolté : idHarvest manquant.'
         );

         return;
       }

       this.exsituFormService.currentTab = 'materials';

       this.router.navigate([
         `/conservation_flora_exsitu/form/harvest/${idHarvest}/material-form`
       ]);
     }


     getTestByCode(code :any): void {
      this.api.getActionByCode(code).subscribe({
        next: (test) => {
          this.idGermination=test.id_nomenclature
          
        },
        error: (err) => {
          console.error("Erreur lors du chargement du code :", err);
        }
      });
    }
     loadTests(): void {
      const id = this.exsituFormService.idMaterial;
      if (!id) {
        console.warn("⚠️ Aucun idMaterial trouvé !");
        return;
      }
    
      this.api.getTestsByMaterial(id).subscribe({
        next: async (tests) => {
          // 1. Charger l'id du type de test 'germination'
          try {
            const testType = await this.api.getActionByCode(this.codeT).toPromise();
            this.idGermination = testType.id_nomenclature;
          } catch (err) {
            console.error("❌ Erreur lors du chargement du type de test :", err);
            return;
          }
    
          // 2. Filtrer les tests selon le type
          const filteredTests = tests.filter(t => t.id_test_type === this.idGermination);
    
          // 3. Mapper les tests avec champs affichage
          const mappedTests = filteredTests.map(t => ({
            ...t,
            thermoPhoto: '',
            traitement: '-'
          }));
    
          // 4. Charger les traitements et régimes
          await Promise.all(
            mappedTests.map(async test => {
              try {
                const res = await this.api.getTreatmentByTest(test.id_test).toPromise();
                test.traitement = res?.treatment_label ?? '-';
              } catch (e) {
                console.warn("⚠️ Erreur traitement pour test", test.id_test, e);
                test.traitement = '-';
              }
    
              try {
                const regime = await this.api.getThermoPhotoRegime(test.id_test).toPromise();
                const { temperature_light, temperature_shadow, hour_count_light, hour_count_shadow } = regime || {};
                if (
                  temperature_light != null &&
                  temperature_shadow != null &&
                  hour_count_light != null &&
                  hour_count_shadow != null
                ) {
                  test.thermoPhoto = `${temperature_light}°C/${temperature_shadow}°C — ${hour_count_light}hL/${hour_count_shadow}hO`;
                } else {
                  test.thermoPhoto = '';
                }
              } catch (e) {
                test.thermoPhoto = '';
              }
            })
          );
    
          this.allViabilityTests =
            mappedTests.sort(
              (a, b) =>
                new Date(
                  b.meta_create_date
                ).getTime() -
                new Date(
                  a.meta_create_date
                ).getTime()
            );


          /*
           * La liste complète reste conservée dans
           * allViabilityTests.
           *
           * dataSource reçoit uniquement le résultat
           * correspondant aux filtres actifs.
           */
          this.applyViabilityFilters();

        },
        error: (err) => {

          console.error(
            "❌ Erreur lors du chargement des tests :",
            err
          );


          this.allViabilityTests = [];

          this.dataSource.data = [];
        }
      });
    }
    
     onChangePreTreatment(element: any, value: boolean): void {
       this.api.updateTestPreTreatment(element.id_test, value).subscribe({
         next: () => {

           element.pre_treatment =
             value;


           /*
            * Le prétraitement fait partie des filtres.
            * On recalcule donc immédiatement la liste,
            * les options dynamiques et la pagination.
            */
           this.applyViabilityFilters();


           console.log(
             "✅ Prétraitement mis à jour :",
             value
           );
         },

         error: (err) => {
           console.error(
             "❌ Erreur lors de la mise à jour du prétraitement :",
             err
           );
         }
       });
     }
   
     onEdit(element: any): void {
       const idTest = element.id_test;
       this.api.getTestWithLabelsById(idTest).subscribe({
         next: (testFull) => {
           const dialogRef = this.dialog.open(ViabilityComponent, {
             width: '900px',
             height: '90vh',
             autoFocus: false,
             data: { test: testFull, edit: true }
           });
   
           dialogRef.afterClosed().subscribe((result) => {
             if (result) {
               this.loadTests();
             }
           });
         },
         error: (err) => {
           console.error('Erreur lors du chargement du test complet :', err);
         }
       });
     }
   
     private toBoldText(value: string): string {
       const boldItalicChars: Record<string, string> = {
         A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
         K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
         U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
         a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
         k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
         u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
         0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
       };

       return value.replace(
         /[A-Za-z0-9]/g,
         (char) =>
           boldItalicChars[char] ||
           char
       );
     }

     onDelete(element: any): void {
       if (!element?.id_test) {
         return;
       }


       const currentCode =
         element?.code || '';


       this.api
         .getActionsByTest(
           element.id_test
         )
         .subscribe({

           next: (actions) => {

             const actionCount =
               actions?.length || 0;


             if (actionCount > 0) {

               const actionLabel =
                 actionCount > 1
                   ? 'actions liées'
                   : 'action liée';


               this.toast.translateToaster(
                 'warning',
                 `Suppression impossible : le test de viabilité ${
                   this.toBoldText(
                     currentCode
                   )
                 } contient ${
                   this.toBoldText(
                     String(actionCount)
                   )
                 } ${actionLabel}. Supprimez d'abord les actions liées à ce test de viabilité.`
               );


               return;
             }


             this.dialogService
               .confirmDialog({
                 message: '',
                 icon: 'check_circle',
                 variant: 'viability',
                 entityCode: currentCode,
                 disableClose: false
               })
               .subscribe((yes) => {

                 if (!yes) {
                   return;
                 }


                 this.api
                   .deleteTest(
                     this.exsituFormService.idMaterial,
                     element.id_test
                   )
                   .subscribe({

                     next: () => {
                       this.toast.translateToaster(
                         'error',
                         `Test de viabilité ${
                           this.toBoldText(currentCode)
                         } supprimé avec succès`
                       );

                       this.loadTests();
                     },

                     error: (err) => {

                       const linkedActionCount =
                         err?.error?.action_count;


                       if (
                         err?.status === 409 &&
                         linkedActionCount
                       ) {

                         const actionLabel =
                           linkedActionCount > 1
                             ? 'actions liées'
                             : 'action liée';


                         this.toast.translateToaster(
                           'warning',
                           `Suppression impossible : le test de viabilité ${
                             this.toBoldText(
                               currentCode
                             )
                           } contient ${
                             this.toBoldText(
                               String(
                                 linkedActionCount
                               )
                             )
                           } ${actionLabel}. Supprimez d'abord les actions liées à ce test de viabilité.`
                         );


                         return;
                       }


                       console.error(
                         'Erreur lors de la suppression :',
                         err
                       );

                     }

                   });

               });

           },

           error: (err) => {

             console.error(
               'Erreur lors de la vérification des actions liées au test de viabilité :',
               err
             );

           }

         });
     }
   
     onDetails(element: any): void {
       this.onRowClick(element);
     }


     onRowClick(row: any): void {
       const idTest = row.id_test;
       const idMaterial = this.exsituFormService.idMaterial;
       const idHarvest = this.exsituFormService.idHarvest;
   
       if (!idTest || !idMaterial || !idHarvest) {
         console.error("❌ ID manquant");
         return;
       }
   
       this.exsituFormService.setIdTest(idTest);
   
       this.router.navigate([
         '/conservation_flora_exsitu/form/harvest',
         idHarvest,
         'material',
         idMaterial,
         'viability-details',
         idTest
       ]);
     }
   
     addFicheGermination() {
       const dialogRef = this.dialog.open(ViabilityComponent, {
         width: '900px',
         height: '90vh',
         autoFocus: false
       });
   
       dialogRef.afterClosed().subscribe(result => {
         if (result) {

           /*
            * On recharge depuis l'API afin que
            * allViabilityTests reste toujours
            * la source de référence.
            */
           this.loadTests();

         }
       });
     }
   }
   