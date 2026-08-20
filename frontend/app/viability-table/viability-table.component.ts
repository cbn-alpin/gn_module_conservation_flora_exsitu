  
  import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { MatPaginator } from '@angular/material/paginator';
  import { Router } from '@angular/router';
import { ViabilityComponent } from '../viability/viability.component';
import { MatDialog } from '@angular/material/dialog';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';

import { ActivatedRoute } from '@angular/router';

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
    styleUrls: ['./viability-table.component.scss']
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
       private dialogService: DialogService
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
            treatment: '-'
          }));
    
          // 4. Charger les traitements et régimes
          await Promise.all(
            mappedTests.map(async test => {
              try {
                const res = await this.api.getTreatmentByTest(test.id_test).toPromise();
                test.treatment = res?.treatment_label ?? '-';
              } catch (e) {
                console.warn("⚠️ Erreur traitement pour test", test.id_test, e);
                test.treatment = '-';
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
    
          this.dataSource.data = mappedTests.sort((a, b) =>
            new Date(b.meta_create_date).getTime() - new Date(a.meta_create_date).getTime()
          );
        },
        error: (err) => {
          console.error("❌ Erreur lors du chargement des tests :", err);
          this.dataSource.data = [];
        }
      });
    }
    
     onChangePreTreatment(element: any, value: boolean): void {
       this.api.updateTestPreTreatment(element.id_test, value).subscribe({
         next: () => {
           element.pre_treatment = value;
           console.log("✅ Prétraitement mis à jour :", value);
         },
         error: (err) => {
           console.error("❌ Erreur lors de la mise à jour du prétraitement :", err);
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
   
     onDelete(element: any): void {
       this.dialogService
         .confirmDialog({
           message: '',
           icon: 'check_circle',
           variant: 'viability',
           entityCode: element.code,
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
                 this.loadTests();
               },
               error: (err) => {
                 console.error(
                   'Erreur lors de la suppression :',
                   err
                 );
               }
             });
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
           const newEntry: Viability = {
             numSemis: result.numeroSemis,
             numSemence: result.numeroSemence,
             dateDebut: result.dateDebut,
             dateFin: result.dateFin,
             replicate: 0,
             levage: 0
           };
           this.loadTests();
           this.dataSource.data = [...this.dataSource.data, newEntry];
         }
       });
     }
   }
   