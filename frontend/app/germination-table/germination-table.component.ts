import { Component, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { GerminationComponent } from '../germination/germination.component';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';

import {
  DateAdapter
} from '@angular/material/core';

import {
  FrenchDateAdapter
} from '../services/french-date-adapter';

export interface Germination {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}

@Component({
  selector: 'app-germination-table',
  templateUrl: './germination-table.component.html',
  styleUrls: ['./germination-table.component.scss'],

  providers: [
    {
      provide: DateAdapter,
      useClass: FrenchDateAdapter
    }
  ]
})
export class GerminationTableComponent implements OnInit, AfterViewInit {
  idMaterial: number | null = null;
  idStorage: number | null = null;
  codeT: any = 'ger';
  idGermination: any;
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
   * dataSource contiendra uniquement
   * le résultat filtré.
   */
  public allGerminationTests: any[] = [];


  /*
   * Valeurs sélectionnées.
   */
  public germinationCodeFilter = '';

  public germinationStartDateFromFilter:
    Date | null = null;

  public germinationRegimeFilter:
    string | null = null;

  public germinationTreatmentFilter:
    string | null = null;

  public germinationPreTreatmentFilter:
    boolean | null = null;


  /*
   * Options dynamiques.
   */
  public germinationRegimeFilterOptions:
    string[] = [];

  public germinationTreatmentFilterOptions:
    string[] = [];

  public germinationPreTreatmentFilterOptions:
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


  public getGerminationRateDisplay(element: any): string {
    const value = element?.germination_rate;

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '-';
    }

    const rate = Number(value);

    if (Number.isNaN(rate)) {
      return '-';
    }

    const formattedRate = Number.isInteger(rate)
      ? String(rate)
      : rate.toFixed(1).replace('.', ',');

    return `${formattedRate} %`;
  }


  @Output() view = new EventEmitter<Germination>();
  @Output() edit = new EventEmitter<Germination>();
  @Output() delete = new EventEmitter<Germination>();

  displayedColumns: string[] = [
    'code',
    'germination_rate',
    'meta_create_date',
    'seed_initial_count',
    'photo_thermo_regime',
    'treatment',
    'pre_treatment',
    'actions'
  ];

  constructor(
    public router: Router,
    private dialog: MatDialog,
    public exsituFormService: ExsituFormService,
    private api: DataService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private toast: CommonService
  ) {}

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
     FILTRES DE LA LISTE GERMINATION
     ========================================================= */


  private getGerminationRegimeFilterValue(
    test: any
  ): string {

    const value =
      String(
        test?.thermoPhoto || ''
      ).trim();


    /*
     * Le tableau affiche déjà "-"
     * lorsqu'aucun régime n'est renseigné.
     */
    return value || '-';
  }


  private getGerminationTreatmentFilterValue(
    test: any
  ): string {

    const value =
      test?.treatment ||
      test?.treatment_label ||
      '';


    const normalizedValue =
      String(value).trim();


    return normalizedValue
      ? normalizedValue
      : '-';
  }


  private getGerminationPreTreatmentFilterValue(
    test: any
  ): boolean {

    return test?.pre_treatment === true;
  }


  private getGerminationDateFilterKey(
    value: any
  ): string {

    if (!value) {
      return '';
    }


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
   * N° test + Date sont les filtres de base.
   *
   * Ils réduisent aussi les options disponibles
   * pour Régime / Liquide / Prétraitement.
   */
  private getGerminationMatchingBaseFilters():
    any[] {

    const normalizedCode =
      String(
        this.germinationCodeFilter || ''
      )
        .trim()
        .toLowerCase();


    const selectedDateKey =
      this.getGerminationDateFilterKey(
        this.germinationStartDateFromFilter
      );


    return this.allGerminationTests.filter(
      test => {

        const testCode =
          String(
            test?.code || ''
          )
            .trim()
            .toLowerCase();


        const testDateKey =
          this.getGerminationDateFilterKey(
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
   * Régime thermo-photo,
   * Liquide traitement
   * et Prétraitement
   *
   * sont dynamiques entre eux.
   */
  private updateGerminationFilterOptions(
    baseTests: any[]
  ): void {

    let selectedRegime =
      this.germinationRegimeFilter;

    let selectedTreatment =
      this.germinationTreatmentFilter;

    let selectedPreTreatment =
      this.germinationPreTreatmentFilter;


    let regimeOptions:
      string[] = [];

    let treatmentOptions:
      string[] = [];

    let preTreatmentOptions:
      boolean[] = [];


    /*
     * Plusieurs passages permettent de supprimer
     * automatiquement une sélection devenue
     * incompatible avec les autres filtres.
     */
    for (
      let pass = 0;
      pass < 3;
      pass++
    ) {

      /* -------------------------
         RÉGIMES DISPONIBLES
         ------------------------- */

      const testsForRegimes =
        baseTests.filter(
          test => {

            const treatment =
              this.getGerminationTreatmentFilterValue(
                test
              );

            const preTreatment =
              this.getGerminationPreTreatmentFilterValue(
                test
              );


            return (
              (
                !selectedTreatment ||
                treatment ===
                  selectedTreatment
              ) &&
              (
                selectedPreTreatment === null ||
                preTreatment ===
                  selectedPreTreatment
              )
            );

          }
        );


      regimeOptions =
        Array.from(
          new Set(
            testsForRegimes.map(
              test =>
                this.getGerminationRegimeFilterValue(
                  test
                )
            )
          )
        )
          .sort(
            (a, b) => {

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
        selectedRegime &&
        !regimeOptions.includes(
          selectedRegime
        )
      ) {
        selectedRegime = null;
      }


      /* -------------------------
         LIQUIDES DISPONIBLES
         ------------------------- */

      const testsForTreatments =
        baseTests.filter(
          test => {

            const regime =
              this.getGerminationRegimeFilterValue(
                test
              );

            const preTreatment =
              this.getGerminationPreTreatmentFilterValue(
                test
              );


            return (
              (
                !selectedRegime ||
                regime === selectedRegime
              ) &&
              (
                selectedPreTreatment === null ||
                preTreatment ===
                  selectedPreTreatment
              )
            );

          }
        );


      treatmentOptions =
        Array.from(
          new Set(
            testsForTreatments.map(
              test =>
                this.getGerminationTreatmentFilterValue(
                  test
                )
            )
          )
        )
          .sort(
            (a, b) => {

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


      /* -------------------------
         PRÉTRAITEMENTS DISPONIBLES
         ------------------------- */

      const testsForPreTreatment =
        baseTests.filter(
          test => {

            const regime =
              this.getGerminationRegimeFilterValue(
                test
              );

            const treatment =
              this.getGerminationTreatmentFilterValue(
                test
              );


            return (
              (
                !selectedRegime ||
                regime === selectedRegime
              ) &&
              (
                !selectedTreatment ||
                treatment ===
                  selectedTreatment
              )
            );

          }
        );


      preTreatmentOptions =
        Array.from(
          new Set(
            testsForPreTreatment.map(
              test =>
                this.getGerminationPreTreatmentFilterValue(
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


    this.germinationRegimeFilter =
      selectedRegime;

    this.germinationTreatmentFilter =
      selectedTreatment;

    this.germinationPreTreatmentFilter =
      selectedPreTreatment;


    this.germinationRegimeFilterOptions =
      regimeOptions;

    this.germinationTreatmentFilterOptions =
      treatmentOptions;

    this.germinationPreTreatmentFilterOptions =
      preTreatmentOptions;
  }


  public applyGerminationFilters(): void {

    /*
     * 1. N° test + Date.
     */
    const baseTests =
      this.getGerminationMatchingBaseFilters();


    /*
     * 2. Recalcul dynamique des options.
     */
    this.updateGerminationFilterOptions(
      baseTests
    );


    /*
     * 3. Application des trois filtres
     *    dynamiques.
     */
    const filteredTests =
      baseTests.filter(
        test => {

          const regime =
            this.getGerminationRegimeFilterValue(
              test
            );

          const treatment =
            this.getGerminationTreatmentFilterValue(
              test
            );

          const preTreatment =
            this.getGerminationPreTreatmentFilterValue(
              test
            );


          const matchesRegime =
            !this.germinationRegimeFilter ||
            regime ===
              this.germinationRegimeFilter;


          const matchesTreatment =
            !this.germinationTreatmentFilter ||
            treatment ===
              this.germinationTreatmentFilter;


          const matchesPreTreatment =
            this.germinationPreTreatmentFilter ===
              null ||
            preTreatment ===
              this.germinationPreTreatmentFilter;


          return (
            matchesRegime &&
            matchesTreatment &&
            matchesPreTreatment
          );

        }
      );


    this.dataSource.data =
      filteredTests;


    /*
     * La pagination travaille maintenant
     * sur la liste filtrée et revient
     * systématiquement à la page 1.
     */
    setTimeout(() => {

      this.syncPaginator();


      if (this.paginatorRef) {
        this.paginatorRef.firstPage();
      }

    });
  }


  public onGerminationCodeFilterChange(
    value: string
  ): void {

    this.germinationCodeFilter =
      value || '';

    this.applyGerminationFilters();
  }


  public onGerminationStartDateFromFilterChange(
    value: Date | null
  ): void {

    this.germinationStartDateFromFilter =
      value;

    this.applyGerminationFilters();
  }


  public onGerminationRegimeFilterChange(
    value: string | null
  ): void {

    this.germinationRegimeFilter =
      value;

    this.applyGerminationFilters();
  }


  public onGerminationTreatmentFilterChange(
    value: string | null
  ): void {

    this.germinationTreatmentFilter =
      value;

    this.applyGerminationFilters();
  }


  public onGerminationPreTreatmentFilterChange(
    value: boolean | null
  ): void {

    this.germinationPreTreatmentFilter =
      value;

    this.applyGerminationFilters();
  }


  public resetGerminationFilters(): void {

    this.germinationCodeFilter = '';

    this.germinationStartDateFromFilter =
      null;

    this.germinationRegimeFilter =
      null;

    this.germinationTreatmentFilter =
      null;

    this.germinationPreTreatmentFilter =
      null;


    this.applyGerminationFilters();
  }


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.getTestByCode(this.codeT);
      this.loadTests();

      if (params['open'] === 'tdg') {
        setTimeout(() => {
          // ferme toute modale résiduelle au cas où
          this.dialog.closeAll();

          this.dialog.open(GerminationComponent, {
            width: '900px',
            height: '90vh',
            autoFocus: false
          });

          // Nettoyer l’URL pour éviter les réouvertures
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


  getTestByCode(code: any): void {
    this.api.getActionByCode(code).subscribe({
      next: (test) => {
        this.idGermination = test.id_nomenclature;
      },
      error: (err) => {
        console.error("Erreur lors du chargement du code :", err);
      }
    });
  }

  async loadTests(): Promise<void> {
    const id = this.exsituFormService.idMaterial;
    if (!id) {
      console.warn("⚠️ Aucun idMaterial trouvé !");
      return;
    }

    this.api.getTestsByMaterial(id).subscribe({
      next: async (tests) => {
        try {
          const testType = await this.api.getActionByCode(this.codeT).toPromise();
          this.idGermination = testType.id_nomenclature;
        } catch (err) {
          console.error("❌ Erreur lors du chargement du type de test :", err);
          return;
        }

        const filteredTests = tests.filter(t => t.id_test_type === this.idGermination);

        const mappedTests = await Promise.all(filteredTests.map(async (t) => {
          t.thermoPhoto = '';
          t.treatment = '-';

          try {
            const res = await this.api.getTreatmentByTest(t.id_test).toPromise();
            t.treatment = res?.treatment_label ?? '-';
          } catch {}

          try {
            const regime = await this.api.getThermoPhotoRegime(t.id_test).toPromise();
            const { temperature_light, temperature_shadow, hour_count_light, hour_count_shadow } = regime || {};
            if (
              temperature_light != null &&
              temperature_shadow != null &&
              hour_count_light != null &&
              hour_count_shadow != null
            ) {
              t.thermoPhoto = `${temperature_light}°C/${temperature_shadow}°C — ${hour_count_light}hL/${hour_count_shadow}hO`;
            }
          } catch {}

          await this.loadAndUpdateIndicators(t);

          return t;
        }));

        this.allGerminationTests =
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
         * allGerminationTests reste
         * la source complète.
         *
         * dataSource reçoit uniquement
         * le résultat filtré.
         */
        this.applyGerminationFilters();

      },

      error: (err) => {

        console.error(
          "❌ Erreur lors du chargement des tests :",
          err
        );


        this.allGerminationTests = [];

        this.dataSource.data = [];
      }
    });
  }

  async loadAndUpdateIndicators(test: any): Promise<void> {
    try {
      const response = await this.api.getGerminationPercent(test.id_test).toPromise();
      const percent = response?.percent ?? null;

      if (percent !== null) {
        test.germination_rate = percent;

        await this.api.updateTestIndicators(test.id_test, {
          percent,
          delay: null,
          period: null
        }).toPromise();
      }
    } catch (error) {
      console.error(`Erreur lors du calcul ou de la mise à jour du % pour test ${test.id_test}`, error);
    }
  }

  onChangePreTreatment(element: any, value: boolean): void {
    this.api.updateTestPreTreatment(element.id_test, value).subscribe({

      next: () => {

        element.pre_treatment =
          value;


        /*
         * Le prétraitement influence directement
         * les options Régime et Liquide.
         */
        this.applyGerminationFilters();


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
        const dialogRef = this.dialog.open(GerminationComponent, {
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
              `Suppression impossible : le test de germination ${
                this.toBoldText(
                  currentCode
                )
              } contient ${
                this.toBoldText(
                  String(actionCount)
                )
              } ${actionLabel}. Supprimez d'abord les actions liées à ce test de germination.`
            );


            return;
          }


          this.dialogService
            .confirmDialog({
              message: '',
              icon: 'wb_sunny',
              variant: 'germination',
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
                        `Suppression impossible : le test de germination ${
                          this.toBoldText(
                            currentCode
                          )
                        } contient ${
                          this.toBoldText(
                            String(
                              linkedActionCount
                            )
                          )
                        } ${actionLabel}. Supprimez d'abord les actions liées à ce test de germination.`
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
            'Erreur lors de la vérification des actions liées au test de germination :',
            err
          );

        }

      });
  }

  onCulture(element: any): void {

    const idTest =
      element?.id_test;

    const codeTest =
      element?.code || null;

    const idMaterial =
      this.exsituFormService.idMaterial;

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (
      !idTest ||
      !idMaterial ||
      !idHarvest
    ) {

      console.error(
        'Impossible d’ouvrir Culture : identifiant du test, du matériel ou de la récolte manquant.'
      );

      return;
    }


    /*
    * Culture ouverte depuis
    * un Test de germination.
    *
    * id_material = matériel courant
    * id_sowing   = NULL
    * id_test     = test courant
    */
    this.exsituFormService
      .setCultureSourceFromTest(
        idTest,
        codeTest
      );


    this.exsituFormService.currentTab =
      'culture-table';


    this.router.navigate([
      '/conservation_flora_exsitu/form/harvest',
      idHarvest,
      'material',
      idMaterial,
      'test',
      idTest,
      'culture-table'
    ]);
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
      'germination-details',
      idTest
    ]);
  }

  addFicheGermination() {
    const dialogRef = this.dialog.open(GerminationComponent, {
      width: '900px',
      height: '90vh',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        /*
         * On recharge depuis l'API pour que
         * allGerminationTests reste toujours
         * la source complète et fiable.
         */
        this.loadTests();

      }
    });
  }
}