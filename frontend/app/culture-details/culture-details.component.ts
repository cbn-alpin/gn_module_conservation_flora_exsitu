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

import {
  CommonService
} from '@geonature_common/service/common.service';

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

  selectedCultureAction: any = null;
  noCultureActionMatchesFilters = false;

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
    private dialogService: DialogService,
    private toast: CommonService
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


    const visibleActions =
      this.sortCultureActions(
        filteredActions
      );

    this.actionDataSource.data =
      visibleActions;


    if (!this.selectedCultureAction) {

      this.noCultureActionMatchesFilters =
        false;

    } else if (
      visibleActions.length === 0
    ) {

      this.noCultureActionMatchesFilters =
        true;

    } else {

      this.noCultureActionMatchesFilters =
        false;


      const selectedActionStillVisible =
        visibleActions.some(
          action =>
            action.id_action ===
            this.selectedCultureAction.id_action
        );


      if (!selectedActionStillVisible) {

        this.selectedCultureAction =
          visibleActions[0];

      }

    }


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
          autoFocus: false,
          restoreFocus: false,

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

  onEditCultureAction(
    action: any
  ): void {

    if (
      !this.idCulture ||
      !action?.id_action ||
      action?.code_action_type !== 'transp'
    ) {
      return;
    }


    this.cultureService
      .getCultureTransplantation(
        Number(action.id_action)
      )
      .subscribe({

        next: transplantation => {

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
                autoFocus: false,
                restoreFocus: false,

                data: {
                  idCulture:
                    this.idCulture,

                  codeCulture:
                    this.culture
                      ?.code_culture ||
                    null,

                  idAction:
                    Number(
                      action.id_action
                    ),

                  edit: true,

                  action:
                    transplantation
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

        },

        error: error => {

          console.error(
            'Erreur lors du chargement de l’action de culture à modifier :',
            error
          );

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

    this.noCultureActionMatchesFilters =
      false;

    this.selectedCultureAction =
      action;
  }


  hideSelectedCultureActionDetails(): void {

    if (!this.selectedCultureAction) {
      return;
    }


    const cultureCode =
      this.culture?.code_culture || '';


    const actionType =
      this.selectedCultureAction
        ?.action_type_label ||
      this.selectedCultureAction
        ?.label_action_type ||
      '';


    const actionLabel =
      [
        cultureCode,
        actionType
      ]
        .filter(Boolean)
        .join(' - ');


    const dateStart =
      this.formatDateForToaster(
        this.selectedCultureAction
          ?.date_start
      );


    this.toast.translateToaster(
      'info',
      `Détails de l’action ${this.toBoldText(actionLabel)} masqués.\nDate de début : ${dateStart}`
    );


    this.selectedCultureAction = null;

    this.noCultureActionMatchesFilters =
      false;
  }


  private toBoldText(
    value: string
  ): string {

    const boldItalicChars:
      Record<string, string> = {

      A: '𝑨', B: '𝑩', C: '𝑪',
      D: '𝑫', E: '𝑬', F: '𝑭',
      G: '𝑮', H: '𝑯', I: '𝑰',
      J: '𝑱', K: '𝑲', L: '𝑳',
      M: '𝑴', N: '𝑵', O: '𝑶',
      P: '𝑷', Q: '𝑸', R: '𝑹',
      S: '𝑺', T: '𝑻', U: '𝑼',
      V: '𝑽', W: '𝑾', X: '𝑿',
      Y: '𝒀', Z: '𝒁',

      a: '𝒂', b: '𝒃', c: '𝒄',
      d: '𝒅', e: '𝒆', f: '𝒇',
      g: '𝒈', h: '𝒉', i: '𝒊',
      j: '𝒋', k: '𝒌', l: '𝒍',
      m: '𝒎', n: '𝒏', o: '𝒐',
      p: '𝒑', q: '𝒒', r: '𝒓',
      s: '𝒔', t: '𝒕', u: '𝒖',
      v: '𝒗', w: '𝒘', x: '𝒙',
      y: '𝒚', z: '𝒛',

      0: '𝟎', 1: '𝟏', 2: '𝟐',
      3: '𝟑', 4: '𝟒', 5: '𝟓',
      6: '𝟔', 7: '𝟕', 8: '𝟖',
      9: '𝟗'
    };


    return value.replace(
      /[A-Za-z0-9]/g,
      (char) =>
        boldItalicChars[char] ||
        char
    );
  }


  private formatDateForToaster(
    value: any
  ): string {

    if (!value) {
      return '-';
    }


    if (
      typeof value === 'string'
    ) {

      const datePart =
        value.split('T')[0];

      const [
        year,
        month,
        day
      ] =
        datePart.split('-');


      if (
        year &&
        month &&
        day
      ) {
        return `${day}/${month}/${year}`;
      }

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '-';
    }


    const day =
      String(
        date.getDate()
      )
        .padStart(2, '0');

    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(2, '0');

    const year =
      date.getFullYear();


    return `${day}/${month}/${year}`;
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

              const currentCultureCode =
                this.culture
                  ?.code_culture ||
                '';


              const currentActionType =
                actionType;


              const actionLabel =
                [
                  currentCultureCode,
                  currentActionType
                ]
                  .filter(Boolean)
                  .join(' - ');


              const dateStart =
                this.formatDateForToaster(
                  action?.date_start
                );


              this.toast.translateToaster(
                'error',
                `Action ${
                  this.toBoldText(
                    actionLabel
                  )
                } supprimée avec succès.\nDate de début : ${
                  this.toBoldText(
                    dateStart
                  )
                }`
              );


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


  onDeleteCulture(): void {
    if (
      !this.idMaterial ||
      !this.idCulture ||
      !this.culture
    ) {
      return;
    }


    const cultureCode =
      this.culture?.code_culture || '';


    this.cultureService
      .getCultureActions(
        this.idCulture
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
              `Suppression impossible : la culture ${
                this.toBoldText(
                  cultureCode
                )
              } contient ${
                this.toBoldText(
                  String(actionCount)
                )
              } ${actionLabel}. Supprimez d'abord les actions liées à cette culture.`
            );


            return;
          }


          this.dialogService
            .confirmDialog({
              message:
                'Êtes-vous certain de vouloir supprimer cette culture ?',
              icon: 'local_florist',
              variant: 'culture',
              entityCode: cultureCode,
              disableClose: false
            })
            .subscribe((yes) => {

              if (!yes) {
                return;
              }


              this.api
                .deleteCulture(
                  this.idMaterial,
                  this.idCulture
                )
                .subscribe({

                  next: () => {

                    this.toast.translateToaster(
                      'error',
                      cultureCode
                        ? `Culture ${
                            this.toBoldText(
                              cultureCode
                            )
                          } supprimée avec succès`
                        : 'Culture supprimée avec succès'
                    );


                    this.navigateToCultureTableAfterDelete();

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
                        `Suppression impossible : la culture ${
                          this.toBoldText(
                            cultureCode
                          )
                        } contient ${
                          this.toBoldText(
                            String(
                              linkedActionCount
                            )
                          )
                        } ${actionLabel}. Supprimez d'abord les actions liées à cette culture.`
                      );


                      return;
                    }


                    console.error(
                      'Erreur lors de la suppression de la culture :',
                      err
                    );

                  }

                });

            });

        },

        error: (err) => {

          console.error(
            'Erreur lors de la vérification des actions liées à la culture :',
            err
          );

        }

      });
  }


  private navigateToCultureTableAfterDelete(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (!idHarvest) {
      this.onBack();
      return;
    }


    this.exsituFormService.currentTab =
      'culture-table';


    const idSowing =
      Number(
        this.culture?.id_sowing
      );


    if (idSowing) {

      this.router.navigate([
        '/conservation_flora_exsitu/form/harvest',
        idHarvest,
        'material',
        this.idMaterial,
        'sowing',
        idSowing,
        'culture-table'
      ]);


      return;
    }


    const idTest =
      Number(
        this.culture?.id_test
      );


    if (idTest) {

      this.router.navigate([
        '/conservation_flora_exsitu/form/harvest',
        idHarvest,
        'material',
        this.idMaterial,
        'test',
        idTest,
        'culture-table'
      ]);


      return;
    }


    this.router.navigate([
      '/conservation_flora_exsitu/form/harvest',
      idHarvest,
      'material',
      this.idMaterial,
      'culture-table'
    ]);
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