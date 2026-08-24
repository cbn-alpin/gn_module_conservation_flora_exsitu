import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';

import {
  MatTableDataSource
} from '@angular/material/table';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  Router
} from '@angular/router';

import {
  CultureService
} from '../culture/culture.service';

import {
  ExsituFormService
} from '../form/shared/exsitu-form.service';

import {
  CultureActionComponent
} from '../culture-action/culture-action.component';

import {
  CultureActionDetailsComponent
} from '../culture-action-details/culture-action-details.component';

import {
  DataService
} from '../services/data.service';

import {
  DialogService
} from '../components/confirm-dialog/confirm-dialog.service';

import {
  MatPaginator
} from '@angular/material/paginator';

import {
  Sort
} from '@angular/material/sort';

@Component({
  selector: 'app-culture-details',
  templateUrl: './culture-details.component.html',
  styleUrls: ['./culture-details.component.scss']
})
export class CultureDetailsComponent
  implements OnInit, AfterViewInit {

  idMaterial = 0;
  idCulture = 0;

  culture: any = null;

  /*
   * Stock utilisé par l'origine de la Culture.
   *
   * - Semis : stock du Semis
   * - Test de germination : stock du Test
   * - Culture directe : aucun stock d'origine
   */
  stockUsedLabel: number | string = '-';

  /*
   * La partie Action de Culture sera développée plus tard.
   *
   * On conserve dès maintenant une source de données distincte
   * afin de ne surtout pas réutiliser les actions Semis/Test.
   */
  actionDataSource =
    new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator)
  actionPaginator!: MatPaginator;

  private allCultureActions: any[] = [];

  public cultureActionTypeFilter:
    string | null = null;

  public cultureActionStartDateFromFilter:
    Date | null = null;

  public cultureActionStartDateToFilter:
    Date | null = null;

  public cultureActionSortActive =
    'date_start';

  public cultureActionSortDirection:
    'asc' | 'desc' = 'desc';

  public cultureActionTypeFilterOptions:
    string[] = [];


  private readonly cultureActionTypeFilterOrder = [
    'Transplantation',
    'Observation',
    'Traitement',
    'Prélèvement'
  ];

  displayedActionColumns: string[] = [
    'date_start',
    'action_type',
    'actor',
    'actions'
  ];

  constructor(
    public router: Router,
    private cultureService: CultureService,
    private exsituFormService: ExsituFormService,
    private dialog: MatDialog,
    private api: DataService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {

    const urlSegments =
      this.router.url.split('/');

    const materialIndex =
      urlSegments.indexOf('material') + 1;

    const cultureIndex =
      urlSegments.indexOf('culture-details') + 1;

    this.idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(urlSegments[materialIndex])
        : 0;

    this.idCulture =
      cultureIndex > 0 &&
      cultureIndex < urlSegments.length
        ? Number(urlSegments[cultureIndex])
        : 0;

    if (
      !this.idMaterial ||
      !this.idCulture
    ) {
      return;
    }

    this.loadCultureDetails();
    this.loadCultureActions();
  }

  ngAfterViewInit(): void {

    this.actionDataSource.paginator =
      this.actionPaginator;
  }


  loadCultureDetails(): void {

    this.cultureService
      .getCultureById(this.idCulture)
      .subscribe({

        next: (culture) => {

          this.culture = culture;


          /*
           * Le Stock utilisé n'est pas porté
           * directement par la Culture.
           *
           * On le récupère depuis son Semis
           * ou son Test de germination d'origine.
           */
          this.loadCultureSourceStock(
            culture
          );


          /*
          * Culture provenant d'un Semis.
          *
          * On restaure aussi le code du Semis
          * pour l'en-tête.
          */
          if (
            culture?.id_sowing
          ) {

            this.exsituFormService
              .setCultureSourceFromSowing(

                Number(
                  culture.id_sowing
                ),

                culture.source_code ||
                culture.code_sowing ||
                null

              );

            return;
          }

          /*
          * Culture provenant d'un Test
          * de germination.
          *
          * On restaure aussi le code du Test
          * pour l'en-tête.
          */
          if (
            culture?.id_test
          ) {

            this.exsituFormService
              .setCultureSourceFromTest(

                Number(
                  culture.id_test
                ),

                culture.source_code ||
                culture.code_test ||
                null

              );

            return;
          }


          /*
          * Culture créée directement
          * depuis le matériel récolté.
          */
          if (
            !culture?.id_sowing &&
            !culture?.id_test
          ) {

            this.exsituFormService
              .setCultureSourceFromMaterial();

          }

        },

        error: (err) => {
          console.error(
            'Erreur lors du chargement de la culture :',
            err
          );
        }

      });
  }


  private loadCultureSourceStock(
    culture: any
  ): void {

    /*
     * Valeur par défaut :
     * Culture créée directement depuis
     * le Matériel récolté.
     */
    this.stockUsedLabel = '-';


    /*
     * =====================================================
     * CULTURE ISSUE D'UN SEMIS
     * =====================================================
     */
    if (culture?.id_sowing) {

      this.cultureService
        .getSowingsByMaterial(
          this.idMaterial
        )
        .subscribe({

          next: (sowings) => {

            const sowing =
              (sowings || []).find(
                (item: any) =>
                  Number(
                    item.id_sowing
                  ) ===
                  Number(
                    culture.id_sowing
                  )
              );


            this.stockUsedLabel =
              sowing?.id_storage ?? '-';

          },

          error: (err) => {

            console.error(
              'Erreur lors du chargement du stock du Semis :',
              err
            );


            this.stockUsedLabel = '-';

          }

        });


      return;
    }


    /*
     * =====================================================
     * CULTURE ISSUE D'UN TEST DE GERMINATION
     * =====================================================
     */
    if (culture?.id_test) {

      this.cultureService
        .getTestsByMaterial(
          this.idMaterial
        )
        .subscribe({

          next: (tests) => {

            const test =
              (tests || []).find(
                (item: any) =>
                  Number(
                    item.id_test
                  ) ===
                  Number(
                    culture.id_test
                  )
              );


            this.stockUsedLabel =
              test?.id_storage ?? '-';

          },

          error: (err) => {

            console.error(
              'Erreur lors du chargement du stock du Test de germination :',
              err
            );


            this.stockUsedLabel = '-';

          }

        });

    }

  }


  loadCultureActions(): void {

    this.cultureService
      .getCultureActions(
        this.idCulture
      )
      .subscribe({

        next: (actions) => {

          /*
          * Le backend retourne :
          * label_action_type
          * label_actor
          *
          * On les adapte aux noms déjà utilisés
          * dans le HTML de Détails Culture.
          */
          this.allCultureActions =
            (actions || []).map(
              (action: any) => ({
                ...action,

                action_type_label:
                  action.label_action_type ||
                  action.action_type_label ||
                  '-',

                actor_label:
                  action.label_actor ||
                  action.actor_label ||
                  '-'
              })
            );


          this.updateCultureActionTypeFilterOptions(
            this.allCultureActions
          );

          this.applyCultureActionFilters();

        },

        error: (err) => {

          console.error(
            'Erreur lors du chargement des actions de la Culture :',
            err
          );

          this.allCultureActions = [];

          this.cultureActionTypeFilterOptions =
            [];

          this.actionDataSource.data = [];

        }

      });
  }

  private getCultureActionDateKey(
    value: any
  ): string {

    if (!value) {
      return '';
    }


    if (typeof value === 'string') {

      const datePart =
        value.split('T')[0];

      if (
        /^\d{4}-\d{2}-\d{2}$/
          .test(datePart)
      ) {
        return datePart;
      }

    }


    const date =
      new Date(value);

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
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}-${day}`;
  }


  private getCultureActionDateTimestamp(
    value: any
  ): number {

    const dateKey =
      this.getCultureActionDateKey(
        value
      );

    if (!dateKey) {
      return 0;
    }


    const timestamp =
      new Date(
        `${dateKey}T00:00:00`
      ).getTime();


    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  }


  private updateCultureActionTypeFilterOptions(
    actionsForOptions:
      any[] = this.allCultureActions
  ): void {

    const presentActionTypes =
      new Set(
        actionsForOptions
          .map(
            action =>
              action.action_type_label ||
              '-'
          )
          .filter(
            label =>
              !!label &&
              label !== '-'
          )
      );


    const orderedActionTypes =
      this.cultureActionTypeFilterOrder
        .filter(
          label =>
            presentActionTypes.has(
              label
            )
        );


    const additionalActionTypes =
      Array.from(
        presentActionTypes
      )
        .filter(
          label =>
            !this
              .cultureActionTypeFilterOrder
              .includes(label)
        )
        .sort(
          (a, b) =>
            a.localeCompare(
              b,
              'fr'
            )
        );


    this.cultureActionTypeFilterOptions = [
      ...orderedActionTypes,
      ...additionalActionTypes
    ];


    if (
      this.cultureActionTypeFilter &&
      !this
        .cultureActionTypeFilterOptions
        .includes(
          this.cultureActionTypeFilter
        )
    ) {
      this.cultureActionTypeFilter =
        null;
    }
  }


  private sortCultureActions(
    actions: any[]
  ): any[] {

    const active =
      this.cultureActionSortActive;

    const direction =
      this.cultureActionSortDirection;


    return [...actions].sort(
      (actionA, actionB) => {

        let valueA: any;
        let valueB: any;


        if (
          active === 'date_start'
        ) {

          valueA =
            this.getCultureActionDateTimestamp(
              actionA.date_start
            );

          valueB =
            this.getCultureActionDateTimestamp(
              actionB.date_start
            );

        } else if (
          active === 'action_type'
        ) {

          const typeA =
            actionA.action_type_label ||
            '';

          const typeB =
            actionB.action_type_label ||
            '';

          const indexA =
            this
              .cultureActionTypeFilterOrder
              .indexOf(typeA);

          const indexB =
            this
              .cultureActionTypeFilterOrder
              .indexOf(typeB);


          valueA =
            indexA === -1
              ? 999
              : indexA;

          valueB =
            indexB === -1
              ? 999
              : indexB;

        } else {

          valueA =
            actionA[active];

          valueB =
            actionB[active];

        }


        let comparison = 0;


        if (
          typeof valueA === 'number' &&
          typeof valueB === 'number'
        ) {

          comparison =
            valueA - valueB;

        } else {

          comparison =
            String(valueA || '')
              .localeCompare(
                String(valueB || ''),
                'fr'
              );

        }


        if (comparison === 0) {

          comparison =
            Number(
              actionA.id_action || 0
            ) -
            Number(
              actionB.id_action || 0
            );

        }


        return direction === 'asc'
          ? comparison
          : -comparison;
      }
    );
  }


  public applyCultureActionFilters(): void {

    const selectedDateFrom =
      this.getCultureActionDateKey(
        this
          .cultureActionStartDateFromFilter
      );

    const selectedDateTo =
      this.getCultureActionDateKey(
        this
          .cultureActionStartDateToFilter
      );


    const actionsMatchingDates =
      this.allCultureActions.filter(
        action => {

          const actionDate =
            this.getCultureActionDateKey(
              action.date_start
            );


          const matchesDateFrom =
            !selectedDateFrom ||
            (
              !!actionDate &&
              actionDate >=
                selectedDateFrom
            );


          const matchesDateTo =
            !selectedDateTo ||
            (
              !!actionDate &&
              actionDate <=
                selectedDateTo
            );


          return (
            matchesDateFrom &&
            matchesDateTo
          );

        }
      );


    this.updateCultureActionTypeFilterOptions(
      actionsMatchingDates
    );


    const filteredActions =
      actionsMatchingDates.filter(
        action => {

          const actionType =
            action.action_type_label ||
            '-';


          return (
            !this.cultureActionTypeFilter ||
            actionType ===
              this.cultureActionTypeFilter
          );

        }
      );


    this.actionDataSource.data =
      this.sortCultureActions(
        filteredActions
      );

    setTimeout(() => {

      if (this.actionPaginator) {

        this.actionDataSource.paginator =
          this.actionPaginator;

        this.actionPaginator.firstPage();
      }

    });
  }


  public onCultureActionTypeFilterChange(
    value: string | null
  ): void {

    this.cultureActionTypeFilter =
      value;

    this.applyCultureActionFilters();
  }


  public onCultureActionStartDateFromFilterChange(
    value: Date | null
  ): void {

    this.cultureActionStartDateFromFilter =
      value;

    this.applyCultureActionFilters();
  }


  public onCultureActionStartDateToFilterChange(
    value: Date | null
  ): void {

    this.cultureActionStartDateToFilter =
      value;

    this.applyCultureActionFilters();
  }


  public onCultureActionSortChange(
    sort: Sort
  ): void {

    this.cultureActionSortActive =
      sort.active ||
      'date_start';

    this.cultureActionSortDirection =
      sort.direction ||
      'desc';

    this.applyCultureActionFilters();
  }


  public resetCultureActionFilters(): void {

    this.cultureActionTypeFilter =
      null;

    this.cultureActionStartDateFromFilter =
      null;

    this.cultureActionStartDateToFilter =
      null;

    this.cultureActionSortActive =
      'date_start';

    this.cultureActionSortDirection =
      'desc';


    this.updateCultureActionTypeFilterOptions(
      this.allCultureActions
    );

    this.applyCultureActionFilters();
  }


  public get hasCultureActions(): boolean {

    return (
      this.allCultureActions.length > 0
    );
  }

  onAddCultureAction(): void {

    if (!this.idCulture) {
      return;
    }

    const dialogRef =
      this.dialog.open(
        CultureActionComponent,
        {
          width: '900px',
          height: '90vh',
          maxWidth: '95vw',
          panelClass:
            'culture-action-dialog-panel',
          disableClose: true,

          data: {
            idCulture: this.idCulture,

            codeCulture:
              this.culture?.code_culture ||
              null
          }
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(result => {

        if (result) {
          this.loadCultureActions();
        }

      });
  }

  onOpenCultureActionDetails(
    action: any
  ): void {

    if (
      !action?.id_action ||
      action?.code_action_type !== 'transp'
    ) {
      return;
    }

    this.dialog.open(
      CultureActionDetailsComponent,
      {
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',

        data: {
          idAction:
            Number(action.id_action),

          codeCulture:
            this.culture?.code_culture ||
            null
        }
      }
    );
  }


  onDeleteCultureAction(
    action: any
  ): void {

    if (!action?.id_action) {
      return;
    }


    const actionType =
      action.action_type_label ||
      action.label_action_type ||
      '-';


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture',
        actionDeletion: true,
        actionContextLabel: 'de culture',
        entityLabel: actionType,
        entityDate: action.date_start,
        disableClose: false
      })
      .subscribe((yes) => {

        if (!yes) {
          return;
        }


        this.api
          .deleteaction(
            action.id_action
          )
          .subscribe({

            next: () => {
              this.loadCultureActions();
            },

            error: (err) => {
              console.error(
                'Erreur lors de la suppression de l’action de Culture :',
                err
              );
            }

          });

      });
  }


  getSourceLabel(): string {

    if (!this.culture) {
      return '-';
    }

    /*
    * Culture provenant d'un Semis
    */
    if (
      this.culture.source_type === 'sowing' ||
      this.culture.id_sowing
    ) {

      return (
        this.culture.source_code ||
        this.culture.code_sowing ||
        (
          this.culture.id_sowing
            ? `Semis n°${this.culture.id_sowing}`
            : '-'
        )
      );
    }


    /*
    * Culture provenant d'un Test de germination
    */
    if (
      this.culture.source_type === 'test' ||
      this.culture.id_test
    ) {

      return (
        this.culture.source_code ||
        this.culture.code_test ||
        (
          this.culture.id_test
            ? `Test n°${this.culture.id_test}`
            : '-'
        )
      );
    }


    /*
    * Culture provenant directement
    * du matériel récolté
    */
    return '-';
  }


  getSourceTypeLabel(): string {

    if (!this.culture) {
      return '-';
    }

    /*
    * On utilise en priorité source_type,
    * calculé directement par le backend.
    */
    if (
      this.culture.source_type === 'sowing' ||
      this.culture.id_sowing
    ) {
      return 'Semis';
    }

    if (
      this.culture.source_type === 'test' ||
      this.culture.id_test
    ) {
      return 'Test de germination';
    }

    /*
    * Culture créée directement
    * depuis Matériel récolté
    */
    return '-';
  }


  getStatusLabel(): string {

    if (!this.culture) {
      return '-';
    }

    return (
      this.culture.is_active ||
      !this.culture.date_end
    )
      ? 'Culture active'
      : 'Culture terminée';
  }


  getProgram(): string {

    return (
      this.culture?.additional_data?.program ||
      '-'
    );
  }


  onBack(): void {
    window.history.back();
  }

}