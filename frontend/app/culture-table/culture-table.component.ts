import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { CultureComponent } from '../culture/culture.component';
import { CultureService } from '../culture/culture.service';

import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { CultureTableService } from './culture-table.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';
import {
  Router
} from '@angular/router';

import {
  SemisTableService
} from '../semis-table/semis-table.service';

import {
  DataService
} from '../services/data.service';

import {
  DateAdapter
} from '@angular/material/core';

import {
  FrenchDateAdapter
} from '../services/french-date-adapter';

export interface Culture {
  id_culture: number;
  code_culture: string;

  id_material: number;
  id_sowing: number | null;
  id_test: number | null;
  id_actor: number | null;

  date_start: string;
  date_end: string | null;

  remarks: string | null;
  additional_data: any;

  meta_create_by: number;
  meta_create_date: string;
  meta_update_by: number | null;
  meta_update_date: string | null;

  is_active?: boolean;

  actor_label?: string | null;
  code_sowing?: string | null;
  code_test?: string | null;
  source_type?: 'sowing' | 'test' | null;
  source_code?: string | null;
}

@Component({
  selector: 'app-culture-table',
  templateUrl: './culture-table.component.html',
  styleUrls: ['./culture-table.component.scss'],

  providers: [
    {
      provide: DateAdapter,
      useClass: FrenchDateAdapter
    }
  ]
})

export class CultureTableComponent implements OnInit, AfterViewInit {

  idMaterial: number | null = null;

  dataSource = new MatTableDataSource<Culture>();

  rowPerPage = 5;

  public allCultures: Culture[] = [];

  public cultureCodeFilter = '';

  public cultureSourceTypeFilter:
    string | null = null;

  public cultureSourceFilter:
    string | null = null;

  public cultureStartDateFromFilter:
    Date | null = null;

  public cultureStatusFilter:
    string | null = null;

  public cultureSourceTypeFilterOptions:
    string[] = [];

  public cultureSourceFilterOptions:
    string[] = [];

  public cultureStatusFilterOptions:
    string[] = [];


  private readonly cultureSourceTypeOrder = [
    '-',
    'Semis',
    'Test de germination'
  ];

  private readonly cultureStatusOrder = [
    'Culture active',
    'Culture terminée'
  ];

  displayedColumns: string[] = [
    'code_culture',
    'source_type',
    'source',
    'date_start',
    'date_end',
    'status',
    'actions'
  ];

  private paginatorRef!: MatPaginator;

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.paginatorRef = paginator;
      this.syncPaginator();
    }
  }

  constructor(
    public router: Router,
    public exsituFormService: ExsituFormService,
    private cultureTableService: CultureTableService,
    private cultureService: CultureService,
    private semisTableService: SemisTableService,
    private dataService: DataService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private toast: CommonService
  ) {}

  ngOnInit(): void {

    this.idMaterial =
      this.exsituFormService.idMaterial;


    /*
    * Après un F5 sur une URL Culture provenant
    * d'un Semis, l'id_sowing est restauré depuis
    * l'URL.
    *
    * On recharge ici uniquement son code
    * pour l'en-tête et la fiche Culture.
    */
    this.restoreSowingCodeFromContext();
    this.restoreTestCodeFromContext();


    this.cultureTableService.cultures$.subscribe(
      (cultures) => {

        this.allCultures =
          cultures || [];

        this.applyCultureFilters();

      }
    );

    this.loadCurrentCultures();
  }

  onBackToSource(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;

    const idMaterial =
      this.idMaterial ||
      this.exsituFormService.idMaterial;

    const sourceType =
      this.exsituFormService
        .cultureSourceType;


    if (!idHarvest) {

      console.error(
        'Impossible de revenir en arrière : idHarvest manquant.'
      );

      return;
    }


    /*
    * Culture ouverte depuis un Semis
    */
    if (
      sourceType === 'sowing' &&
      idMaterial
    ) {

      this.exsituFormService.currentTab =
        'semis-table';

      this.router.navigate([

        `/conservation_flora_exsitu/form/harvest/${idHarvest}/material/${idMaterial}/semis-table`

      ]);

      return;
    }


    /*
    * Culture ouverte depuis
    * un Test de germination
    */
    if (
      sourceType === 'test' &&
      idMaterial
    ) {

      this.exsituFormService.currentTab =
        'germination-table';

      this.router.navigate([

        `/conservation_flora_exsitu/form/harvest/${idHarvest}/material/${idMaterial}/germination-table`

      ]);

      return;
    }


    /*
    * Culture ouverte directement
    * depuis Matériel récolté
    */
    this.exsituFormService.currentTab =
      'materials';

    this.router.navigate([

      `/conservation_flora_exsitu/form/harvest/${idHarvest}/material-form`

    ]);

  }

  ngAfterViewInit(): void {
    this.syncPaginator();
  }

  private syncPaginator(): void {
    if (!this.paginatorRef) {
      return;
    }

    this.dataSource.paginator = this.paginatorRef;
    this.paginatorRef.length = this.dataSource.data.length;
  }

  /* =========================================================
    FILTRES DE LA LISTE DES CULTURES
    ========================================================= */

  private getCultureDateFilterKey(
    value: any
  ): string {

    if (!value) {
      return '';
    }


    /*
    * Date provenant directement de l'API.
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
  * Filtres de base :
  *
  * - N° culture
  * - Date "À partir du"
  *
  * Le Statut est ensuite appliqué séparément
  * afin que ses options restent dynamiques.
  */
  private getCulturesMatchingBaseFilters():
    Culture[] {

    const normalizedCode =
      String(
        this.cultureCodeFilter || ''
      )
        .trim()
        .toLowerCase();


    const selectedDateKey =
      this.getCultureDateFilterKey(
        this.cultureStartDateFromFilter
      );


    return this.allCultures.filter(
      (culture) => {

        const cultureCode =
          String(
            culture?.code_culture || ''
          )
            .trim()
            .toLowerCase();


        const cultureDateKey =
          this.getCultureDateFilterKey(
            culture?.date_start
          );


        const matchesCode =
          !normalizedCode ||
          cultureCode.includes(
            normalizedCode
          );


        const matchesDate =
          !selectedDateKey ||
          (
            !!cultureDateKey &&
            cultureDateKey >=
              selectedDateKey
          );


        return (
          matchesCode &&
          matchesDate
        );

      }
    );
  }

    private getUniqueCultureFilterValues(
    values: string[],
    preferredOrder: string[] = []
  ): string[] {

    const uniqueValues =
      Array.from(
        new Set(
          values.filter(
            value => !!value
          )
        )
      );


    const orderMap =
      new Map(
        preferredOrder.map(
          (value, index) => [
            value,
            index
          ]
        )
      );


    return uniqueValues.sort(
      (a, b) => {

        const indexA =
          orderMap.has(a)
            ? orderMap.get(a)!
            : Number.MAX_SAFE_INTEGER;

        const indexB =
          orderMap.has(b)
            ? orderMap.get(b)!
            : Number.MAX_SAFE_INTEGER;


        if (indexA !== indexB) {
          return indexA - indexB;
        }


        return a.localeCompare(
          b,
          'fr',
          {
            numeric: true,
            sensitivity: 'base'
          }
        );

      }
    );
  }


  /*
  * Rend Type d'origine, Origine et Statut
  * dynamiques entre eux et avec les filtres
  * N° culture et Date.
  */
  private updateCultureSelectFilterOptions(
    baseCultures: Culture[]
  ): void {

    let selectedSourceType =
      this.cultureSourceTypeFilter;

    let selectedSource =
      this.cultureSourceFilter;

    let selectedStatus =
      this.cultureStatusFilter;


    let sourceTypeOptions: string[] = [];
    let sourceOptions: string[] = [];
    let statusOptions: string[] = [];


    /*
    * Trois passages permettent de retirer
    * automatiquement une sélection devenue
    * impossible après modification d'un filtre.
    */
    for (
      let pass = 0;
      pass < 3;
      pass++
    ) {

      const culturesForSourceTypes =
        baseCultures.filter(
          culture => {

            const source =
              this.getSourceLabel(
                culture
              );

            const status =
              this.getStatusLabel(
                culture
              );


            return (
              (
                !selectedSource ||
                source === selectedSource
              ) &&
              (
                !selectedStatus ||
                status === selectedStatus
              )
            );

          }
        );


      sourceTypeOptions =
        this.getUniqueCultureFilterValues(
          culturesForSourceTypes.map(
            culture =>
              this.getSourceTypeLabel(
                culture
              )
          ),
          this.cultureSourceTypeOrder
        );


      if (
        selectedSourceType &&
        !sourceTypeOptions.includes(
          selectedSourceType
        )
      ) {
        selectedSourceType = null;
      }


      const culturesForSources =
        baseCultures.filter(
          culture => {

            const sourceType =
              this.getSourceTypeLabel(
                culture
              );

            const status =
              this.getStatusLabel(
                culture
              );


            return (
              (
                !selectedSourceType ||
                sourceType ===
                  selectedSourceType
              ) &&
              (
                !selectedStatus ||
                status === selectedStatus
              )
            );

          }
        );


      sourceOptions =
        this.getUniqueCultureFilterValues(
          culturesForSources.map(
            culture =>
              this.getSourceLabel(
                culture
              )
          ),
          ['-']
        );


      if (
        selectedSource &&
        !sourceOptions.includes(
          selectedSource
        )
      ) {
        selectedSource = null;
      }


      const culturesForStatuses =
        baseCultures.filter(
          culture => {

            const sourceType =
              this.getSourceTypeLabel(
                culture
              );

            const source =
              this.getSourceLabel(
                culture
              );


            return (
              (
                !selectedSourceType ||
                sourceType ===
                  selectedSourceType
              ) &&
              (
                !selectedSource ||
                source === selectedSource
              )
            );

          }
        );


      statusOptions =
        this.getUniqueCultureFilterValues(
          culturesForStatuses.map(
            culture =>
              this.getStatusLabel(
                culture
              )
          ),
          this.cultureStatusOrder
        );


      if (
        selectedStatus &&
        !statusOptions.includes(
          selectedStatus
        )
      ) {
        selectedStatus = null;
      }

    }


    this.cultureSourceTypeFilter =
      selectedSourceType;

    this.cultureSourceFilter =
      selectedSource;

    this.cultureStatusFilter =
      selectedStatus;

    this.cultureSourceTypeFilterOptions =
      sourceTypeOptions;

    this.cultureSourceFilterOptions =
      sourceOptions;

    this.cultureStatusFilterOptions =
      statusOptions;
  }


  public applyCultureFilters(): void {

    /*
    * 1. N° culture + Date.
    */
    const baseCultures =
      this.getCulturesMatchingBaseFilters();


    /*
    * 2. Options dynamiques :
    *    Type d'origine / Origine / Statut.
    */
    this.updateCultureSelectFilterOptions(
      baseCultures
    );


    /*
    * 3. Application finale des filtres.
    */
    const filteredCultures =
      baseCultures.filter(
        culture => {

          const sourceType =
            this.getSourceTypeLabel(
              culture
            );

          const source =
            this.getSourceLabel(
              culture
            );

          const status =
            this.getStatusLabel(
              culture
            );


          const matchesSourceType =
            !this.cultureSourceTypeFilter ||
            sourceType ===
              this.cultureSourceTypeFilter;


          const matchesSource =
            !this.cultureSourceFilter ||
            source ===
              this.cultureSourceFilter;


          const matchesStatus =
            !this.cultureStatusFilter ||
            status ===
              this.cultureStatusFilter;


          return (
            matchesSourceType &&
            matchesSource &&
            matchesStatus
          );

        }
      );


    this.dataSource.data =
      filteredCultures;


    setTimeout(() => {

      this.syncPaginator();

      if (this.paginatorRef) {
        this.paginatorRef.firstPage();
      }

    });
  }


  public onCultureCodeFilterChange(
    value: string
  ): void {

    this.cultureCodeFilter =
      value || '';

    this.applyCultureFilters();
  }


  public onCultureSourceTypeFilterChange(
    value: string | null
  ): void {

    this.cultureSourceTypeFilter =
      value;

    this.applyCultureFilters();
  }


  public onCultureSourceFilterChange(
    value: string | null
  ): void {

    this.cultureSourceFilter =
      value;

    this.applyCultureFilters();
  }


  public onCultureStartDateFromFilterChange(
    value: Date | null
  ): void {

    this.cultureStartDateFromFilter =
      value;

    this.applyCultureFilters();
  }


  public onCultureStatusFilterChange(
    value: string | null
  ): void {

    this.cultureStatusFilter =
      value;

    this.applyCultureFilters();
  }


  public resetCultureFilters(): void {

    this.cultureCodeFilter = '';

    this.cultureSourceTypeFilter =
      null;

    this.cultureSourceFilter =
      null;

    this.cultureStartDateFromFilter =
      null;

    this.cultureStatusFilter =
      null;

    this.applyCultureFilters();
  }

  private restoreSowingCodeFromContext(): void {

    const sourceType =
      this.exsituFormService
        .cultureSourceType;

    const idSowing =
      this.exsituFormService
        .cultureSourceSowingId;


    /*
    * Rien à restaurer pour une Culture
    * ouverte directement depuis Matériel.
    */
    if (
      sourceType !== 'sowing' ||
      !idSowing ||
      !this.idMaterial
    ) {

      return;
    }


    /*
    * Lors d'une navigation normale depuis Semis,
    * le code est déjà connu.
    */
    if (
      this.exsituFormService
        .cultureSourceSowingCode
    ) {

      return;
    }


    /*
    * Cas F5 :
    * on connaît l'id_sowing grâce à l'URL,
    * on retrouve son code dans les Semis
    * du matériel courant.
    */
    this.semisTableService
      .getSowingsByMaterial(
        this.idMaterial
      )
      .subscribe({

        next: (sowings) => {

          const sowing =
            (sowings || []).find(
              (item: any) =>
                Number(item?.id_sowing) ===
                Number(idSowing)
            );


          this.exsituFormService
            .setCultureSourceFromSowing(
              idSowing,
              sowing?.code || null
            );

        },

        error: (err) => {

          console.error(
            'Impossible de restaurer le code du Semis associé à la Culture :',
            err
          );

        }

      });

  }

  private restoreTestCodeFromContext(): void {

    const sourceType =
      this.exsituFormService
        .cultureSourceType;

    const idTest =
      this.exsituFormService
        .cultureSourceTestId;


    if (
      sourceType !== 'test' ||
      !idTest
    ) {

      return;
    }


    /*
    * Si le code est déjà connu après le clic
    * sur le bouton Culture, inutile de le recharger.
    */
    if (
      this.exsituFormService
        .cultureSourceTestCode
    ) {

      return;
    }


    /*
    * Cas navigation / F5 :
    * l'id_test vient de l'URL.
    * On recharge le Test pour récupérer son code.
    */
    this.dataService
      .getTestWithLabels(
        idTest
      )
      .subscribe({

        next: (test) => {

          this.exsituFormService
            .setCultureSourceFromTest(
              idTest,
              test?.code || null
            );

        },

        error: (err) => {

          console.error(
            'Impossible de restaurer le code du Test de germination associé à la Culture :',
            err
          );

        }

      });

  }

  private loadCurrentCultures(): void {

    if (!this.idMaterial) {
      return;
    }


    /*
     * La liste affichée est toujours la liste
     * complète du matériel récolté.
     *
     * Le contexte Matériel / Semis / Test
     * reste toutefois conservé pour :
     * - la création d'une nouvelle Culture ;
     * - le bouton Retour ;
     * - la navigation vers les détails.
     */
    this.cultureTableService
      .loadCultures(
        this.idMaterial
      );
  }

  addFicheCulture(): void {
    const dialogRef = this.dialog.open(
      CultureComponent,
      {
        width: '900px',
        height: '90vh',
        maxWidth: '95vw',
        maxHeight: '90vh',
        disableClose: true,

        data: {

          sourceType:
            this.exsituFormService
              .cultureSourceType,

          id_sowing:
            this.exsituFormService
              .cultureSourceSowingId,

          code_sowing:
            this.exsituFormService
              .cultureSourceSowingCode,

          id_test:
            this.exsituFormService
              .cultureSourceTestId,

          code_test:
            this.exsituFormService
              .cultureSourceTestCode
        }
      }
    );

    dialogRef.afterClosed().subscribe(
      (result) => {
        if (result && this.idMaterial) {
          this.loadCurrentCultures();
        }
      }
    );
  }

  onDelete(element: Culture): void {
    if (!this.idMaterial || !element?.id_culture) {
      return;
    }

    const cultureCode = element.code_culture || '';

    this.dialogService
      .confirmDialog({
        message: 'Étes vous certain de vouloir supprimer cette culture ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.cultureTableService
          .deleteCulture(
            this.idMaterial!,
            element.id_culture
          )
          .subscribe({
            next: () => {
              this.toast.translateToaster(
                'error',
                cultureCode
                  ? `Culture ${cultureCode} supprimée avec succès`
                  : 'Culture supprimée avec succès'
              );

              this.loadCurrentCultures();
            },

            error: (err) => {
              console.error(
                'Erreur lors de la suppression de la culture :',
                err
              );

              this.toast.translateToaster(
                'error',
                err?.error?.error ||
                  'Erreur lors de la suppression de la culture'
              );
            }
          });
      });
  }

  onEdit(element: Culture): void {
    if (!element?.id_culture) {
      return;
    }

    this.cultureService
      .getCultureById(element.id_culture)
      .subscribe({
        next: (cultureFull) => {

          const dialogRef = this.dialog.open(
            CultureComponent,
            {
              width: '900px',
              height: '90vh',
              maxWidth: '95vw',
              maxHeight: '90vh',
              disableClose: true,

              data: {
                edit: true,
                culture: cultureFull
              }
            }
          );

          dialogRef.afterClosed().subscribe(
            (result) => {
              if (result && this.idMaterial) {
                this.loadCurrentCultures();
              }
            }
          );
        },

        error: (err) => {
          console.error(
            'Erreur lors du chargement de la culture :',
            err
          );
        }
      });
  }

  onDetails(
    element: Culture
  ): void {

    const idCulture =
      element?.id_culture;

    const idMaterial =
      this.exsituFormService.idMaterial;

    const idHarvest =
      this.exsituFormService.idHarvest;

    const idSowing =
      element?.id_sowing;
    
    const idTest =
      element?.id_test;


    if (
      !idCulture ||
      !idMaterial ||
      !idHarvest
    ) {

      console.error(
        'Impossible d’ouvrir les détails de la culture : identifiant manquant.'
      );

      return;
    }


    this.exsituFormService.currentTab =
      'culture-details';


    /*
    * Culture provenant d'un Semis.
    *
    * On conserve obligatoirement le Semis
    * dans l'URL.
    */
    if (idSowing) {

      this.router.navigate([

        '/conservation_flora_exsitu/form/harvest',

        idHarvest,

        'material',

        idMaterial,

        'sowing',

        idSowing,

        'culture-details',

        idCulture

      ]);

      return;

      
    }

    /*
    * Culture provenant d'un Test
    * de germination.
    *
    * On conserve obligatoirement le Test
    * dans l'URL.
    */
    if (idTest) {

      this.router.navigate([

        '/conservation_flora_exsitu/form/harvest',

        idHarvest,

        'material',

        idMaterial,

        'test',

        idTest,

        'culture-details',

        idCulture

      ]);

      return;
    }


    /*
    * Culture créée directement depuis
    * le matériel récolté.
    */
    this.router.navigate([

      '/conservation_flora_exsitu/form/harvest',

      idHarvest,

      'material',

      idMaterial,

      'culture-details',

      idCulture

    ]);

  }


  onRowClick(
    element: Culture
  ): void {

    this.onDetails(element);

  }

  getSourceTypeLabel(
    culture: Culture
  ): string {

    if (
      culture.source_type === 'sowing' ||
      culture.id_sowing
    ) {
      return 'Semis';
    }

    if (
      culture.source_type === 'test' ||
      culture.id_test
    ) {
      return 'Test de germination';
    }

    return '-';
  }



  getSourceLabel(culture: Culture): string {
    if (culture.source_code) {
      return culture.source_code;
    }

    if (culture.id_sowing) {
      return culture.code_sowing || `Semis n°${culture.id_sowing}`;
    }

    if (culture.id_test) {
      return culture.code_test || `Test n°${culture.id_test}`;
    }

    return '-';
  }

  getStatusLabel(culture: Culture): string {
    return culture.is_active || !culture.date_end
      ? 'Culture active'
      : 'Culture terminée';
  }

  isStandardCultureCode(code: any): boolean {
    return (
      typeof code === 'string' &&
      /^C\d{4}_\d{4}$/.test(code)
    );
  }
}