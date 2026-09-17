import {
  Component,
  Inject,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  HistoriqueService
} from './historique.service';

import {
  HistoriqueEvent
} from './historique.models';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  DialogService
} from '../components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss'],

  /*
   * =========================================================
   * HISTORIQUE - SERVICE DE CONFIRMATION
   *
   * DialogService est fourni directement à la fiche
   * Historique afin qu'il soit disponible même lorsque
   * Historique est ouvert depuis le service global MatDialog.
   * =========================================================
   */
  providers: [
    DialogService
  ]
})
export class HistoriqueComponent implements OnInit {

  /*
   * =========================================================
   * HISTORIQUE - FILTRE SÉLECTIONNÉ
   *
   * "Tout" est sélectionné par défaut.
   * Une seule catégorie peut être sélectionnée à la fois.
   * =========================================================
   */
  public selectedFilter: string;


  /*
   * =========================================================
   * HISTORIQUE - MATÉRIELS RÉCOLTÉS
   * =========================================================
   */

  public materialHistoryEvents:
    HistoriqueEvent[] = [];

  public materialHistoryLoading = false;

  public materialHistoryError = false;


  /*
   * =========================================================
   * HISTORIQUE - FILTRES DE LA TIMELINE
   *
   * Ces filtres sont communs à toutes les rubriques :
   *
   * - numéro ;
   * - date à partir de ;
   * - date jusqu'à.
   *
   * Ils agissent uniquement sur les événements affichés
   * et ne modifient aucune donnée en base.
   * =========================================================
   */

  public historyNumberFilter = '';

  public historyDateFromFilter = '';

  public historyDateToFilter = '';


  /*
   * =========================================================
   * HISTORIQUE - DIALOGUE DE SORTIE
   *
   * Empêche l'ouverture de plusieurs fenêtres
   * de confirmation si Retour est cliqué plusieurs fois.
   * =========================================================
   */
  private exitDialogOpen = false;


  /*
   * =========================================================
   * HISTORIQUE - DIALOGUE DE RÉINITIALISATION
   *
   * Empêche l'ouverture de plusieurs confirmations
   * de réinitialisation en même temps.
   * =========================================================
   */
  private resetDialogOpen = false;


  /*
   * =========================================================
   * HISTORIQUE - NETTOYAGE DES ÉLÉMENTS SUPPRIMÉS
   * =========================================================
   */
  private cleanupDialogOpen = false;

  public historyCleanupLoading = false;


  constructor(
    private dialogRef: MatDialogRef<HistoriqueComponent>,
    private dialogService: DialogService,
    private _commonService: CommonService,
    private router: Router,
    /*
     * HISTORIQUE - ACCÈS AUX ÉVÉNEMENTS
     */
    private historiqueService: HistoriqueService,
    /*
     * =========================================================
     * HISTORIQUE - RUBRIQUE D'OUVERTURE
     *
     * La rubrique provient du bouton Historique
     * depuis lequel la fiche a été ouverte.
     * =========================================================
     */
    @Inject(MAT_DIALOG_DATA)
    public data: {
      initialFilter?: string;
      idHarvest?: number | null;
      idMaterial?: number | null;
    }
  ) {

    this.selectedFilter =
      data && data.initialFilter
        ? data.initialFilter
        : 'all';

  }


  /*
   * =========================================================
   * HISTORIQUE - CHARGEMENT INITIAL
   *
   * Si la fiche Historique est ouverte depuis
   * Matériel récolté, l'historique Matériel est chargé
   * immédiatement.
   * =========================================================
   */
  public ngOnInit(): void {

    /*
     * =========================================================
     * HISTORIQUE - CHARGEMENT INITIAL
     *
     * Charge directement la rubrique depuis laquelle
     * la fiche Historique a été ouverte :
     *
     * Tout / Matériel récolté / Semence / Stockage /
     * Germination / Semis / Viabilité / Culture.
     * =========================================================
     */
    this.loadHistory();


    /*
     * =========================================================
     * HISTORIQUE - CLIC EN DEHORS DE LA FICHE
     *
     * Comme pour le bouton Retour, un clic sur le fond
     * extérieur de la fenêtre Historique ne ferme pas
     * directement la fiche.
     *
     * Il déclenche la même confirmation de sortie :
     *
     * - Non : rester dans Historique
     * - Oui : quitter Historique
     * =========================================================
     */
    this.dialogRef
      .backdropClick()
      .subscribe(() => {

        this.onBack();

      });

  }


  /*
   * =========================================================
   * HISTORIQUE - CHARGEMENT MATÉRIEL RÉCOLTÉ
   * =========================================================
   */
  private loadHistory(): void {

    if (
      !this.data ||
      !this.data.idHarvest
    ) {

      this.materialHistoryEvents = [];

      this.materialHistoryError = true;

      return;

    }


    this.materialHistoryLoading = true;

    this.materialHistoryError = false;


    const requestedFilter =
      this.selectedFilter || 'all';


    this.historiqueService
      .getHistory(
        this.data.idHarvest,
        requestedFilter
      )
      .subscribe({

        next: (events) => {

          if (
            requestedFilter
            !== this.selectedFilter
          ) {
            return;
          }


          this.materialHistoryEvents =
            events || [];


          this.materialHistoryLoading =
            false;

        },


        error: () => {

          if (
            requestedFilter
            !== this.selectedFilter
          ) {
            return;
          }


          this.materialHistoryEvents = [];

          this.materialHistoryLoading =
            false;

          this.materialHistoryError =
            true;

        }

      });

  }


  /*
   * =========================================================
   * HISTORIQUE - FILTRES DE LA TIMELINE
   * =========================================================
   */


  public onHistoryNumberFilter(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.historyNumberFilter =
      input && input.value
        ? input.value.trim()
        : '';

  }


  public onHistoryDateFromFilter(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.historyDateFromFilter =
      input && input.value
        ? input.value
        : '';

  }


  public onHistoryDateToFilter(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.historyDateToFilter =
      input && input.value
        ? input.value
        : '';

  }


  /*
   * HISTORIQUE
   * Indique si au moins un filtre est actif.
   */
  public get hasActiveHistoryFilters(): boolean {

    return !!(
      this.historyNumberFilter ||
      this.historyDateFromFilter ||
      this.historyDateToFilter
    );

  }


  /*
   * HISTORIQUE
   * Réinitialise uniquement les filtres de recherche.
   */
  public resetHistoryFilters(): void {

    this.historyNumberFilter = '';

    this.historyDateFromFilter = '';

    this.historyDateToFilter = '';

  }


  /*
   * =========================================================
   * HISTORIQUE - DATE LOCALE UTILISÉE POUR LE FILTRAGE
   *
   * event_date arrive depuis l'API en UTC.
   *
   * On utilise ici la date locale du navigateur afin que
   * le filtre corresponde exactement à la date affichée
   * à l'utilisateur dans la timeline.
   * =========================================================
   */
  private getHistoryEventLocalDate(
    eventDate: string
  ): string {

    if (!eventDate) {
      return '';
    }


    const date =
      new Date(eventDate);


    if (isNaN(date.getTime())) {
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
   * =========================================================
   * HISTORIQUE - FILTRAGE GÉNÉRIQUE DES ÉVÉNEMENTS
   *
   * Cette fonction pourra être réutilisée telle quelle pour :
   *
   * - Matériel récolté ;
   * - Semence ;
   * - Stockage ;
   * - Test de germination ;
   * - Semis ;
   * - Test de viabilité ;
   * - Culture ;
   * - Tout.
   *
   * La recherche du numéro tient également compte des
   * anciens numéros lorsqu'un élément a été renommé.
   * =========================================================
   */
  public filterHistoryEvents(
    events: HistoriqueEvent[]
  ): HistoriqueEvent[] {

    if (!events) {
      return [];
    }


    const numberFilter =
      this.historyNumberFilter
        .toLowerCase();


    return events.filter(
      (event) => {

        /*
         * ===============================================
         * FILTRE NUMÉRO
         * ===============================================
         */

        if (numberFilter) {

          const oldChangedCode =
            event.changes &&
            event.changes.entity_code
              ? event.changes.entity_code.old
              : null;


          const newChangedCode =
            event.changes &&
            event.changes.entity_code
              ? event.changes.entity_code.new
              : null;


          const searchableCodes = [
            event.current_entity_code,
            event.entity_code,
            oldChangedCode,
            newChangedCode
          ]
            .filter(
              code =>
                code !== null &&
                code !== undefined
            )
            .map(
              code =>
                String(code).toLowerCase()
            );


          const numberMatches =
            searchableCodes.some(
              code =>
                code.includes(
                  numberFilter
                )
            );


          if (!numberMatches) {
            return false;
          }

        }


        /*
         * ===============================================
         * FILTRES DE DATE
         * ===============================================
         */

        const eventLocalDate =
          this.getHistoryEventLocalDate(
            event.event_date
          );


        if (
          this.historyDateFromFilter &&
          (
            !eventLocalDate ||
            eventLocalDate <
              this.historyDateFromFilter
          )
        ) {
          return false;
        }


        if (
          this.historyDateToFilter &&
          (
            !eventLocalDate ||
            eventLocalDate >
              this.historyDateToFilter
          )
        ) {
          return false;
        }


        return true;

      }
    );

  }


  /*
   * HISTORIQUE - MATÉRIEL RÉCOLTÉ
   *
   * Liste réellement affichée dans la timeline.
   */
  public get filteredMaterialHistoryEvents():
    HistoriqueEvent[] {

    return this.filterHistoryEvents(
      this.materialHistoryEvents
    );

  }


  /*
   * =========================================================
   * HISTORIQUE - MESSAGE AUCUN ÉVÉNEMENT
   *
   * Le message s'adapte automatiquement à la rubrique
   * actuellement sélectionnée.
   * =========================================================
   */
  public getHistoriqueEmptyMessage(): string {

    switch (this.selectedFilter) {

      case 'material':
        return 'Aucun événement Matériel récolté.';

      case 'seed':
        return 'Aucun événement Semence.';

      case 'storage':
        return 'Aucun événement Stockage.';

      case 'germination':
        return 'Aucun événement Test de germination.';

      case 'sowing':
        return 'Aucun événement Semis.';

      case 'viability':
        return 'Aucun événement Test de viabilité.';

      case 'culture':
        return 'Aucun événement Culture.';

      case 'all':
      default:
        return "Aucun événement dans l'Historique total.";

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - PLACEHOLDER DYNAMIQUE DU NUMÉRO
   * =========================================================
   */
  public getHistoryNumberFilterPlaceholder():
    string {

    switch (this.selectedFilter) {

      case 'material':
        return 'N° Matériel récolté';

      case 'seed':
        return 'N° Semence';

      case 'storage':
        return 'N° Stockage';

      case 'germination':
        return 'N° Test de germination';

      case 'sowing':
        return 'N° Semis';

      case 'viability':
        return 'N° Test de viabilité';

      case 'culture':
        return 'N° Culture';

      case 'all':
      default:
        return "N° de l'élément";

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - SÉLECTION D'UN FILTRE
   * =========================================================
   */
  public selectHistoriqueFilter(filter: string): void {

    this.selectedFilter = filter;


    /*
     * =========================================================
     * HISTORIQUE - FILTRES
     *
     * Lorsqu'on change de rubrique, on repart sur une vue
     * complète afin qu'un ancien numéro ou une ancienne date
     * ne masque pas involontairement les nouveaux événements.
     * =========================================================
     */
    this.resetHistoryFilters();


    /*
     * HISTORIQUE - TOUTES LES RUBRIQUES
     */
    this.loadHistory();

  }


  /*
   * =========================================================
   * HISTORIQUE - NOM DE LA CATÉGORIE DE L'ÉLÉMENT
   *
   * Permet d'afficher par exemple :
   *
   * Matériel récolté : N° ...
   * Semence : N° ...
   * Stockage : N° ...
   * Test de germination : N° ...
   * Semis : N° ...
   * Test de viabilité : N° ...
   * Culture : N° ...
   * =========================================================
   */
  public getHistoriqueEntityLabel(
    entityType: string
  ): string {

    switch (entityType) {

      case 'material':
        return 'Matériel récolté';

      case 'seed':
        return 'Semence';

      case 'storage':
        return 'Stockage';

      case 'germination':
        return 'Test de germination';

      case 'sowing':
        return 'Semis';

      case 'viability':
        return 'Test de viabilité';

      case 'culture':
        return 'Culture';

      default:
        return 'Élément';

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - ICÔNE DE LA CATÉGORIE
   *
   * On reprend les icônes déjà utilisées dans les fiches
   * correspondantes du module Ex-situ.
   * =========================================================
   */
  public getHistoriqueEntityIcon(
    entityType: string
  ): string {

    switch (entityType) {

      case 'material':
        return 'spa';

      case 'seed':
        return 'description';

      case 'storage':
        return 'store';

      case 'germination':
        return 'wb_sunny';

      case 'sowing':
        return 'grain';

      case 'viability':
        return 'check_circle';

      case 'culture':
        return 'local_florist';

      default:
        return 'history';

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - TITRE DU BLOC HISTORIQUE
   *
   * Le titre change automatiquement en fonction
   * du filtre sélectionné.
   * =========================================================
   */
  public getHistoriqueTitle(): string {

    switch (this.selectedFilter) {

      case 'material':
        return 'Historique du Matériel récolté';

      case 'seed':
        return 'Historique de la Semence';

      case 'storage':
        return 'Historique du Stockage';

      case 'germination':
        return 'Historique du Test de germination';

      case 'sowing':
        return 'Historique du Semis';

      case 'viability':
        return 'Historique du Test de viabilité';

      case 'culture':
        return 'Historique de la Culture';

      case 'all':
      default:
        return 'Historique Totale';

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - LIBELLÉ DU NETTOYAGE
   * =========================================================
   */
  public getCleanupHistoryLabel(): string {

    switch (this.selectedFilter) {

      case 'material':
        return "l'Historique du";

      case 'seed':
        return "l'Historique de la";

      case 'storage':
        return "l'Historique du";

      case 'germination':
        return "l'Historique du";

      case 'sowing':
        return "l'Historique du";

      case 'viability':
        return "l'Historique du";

      case 'culture':
        return "l'Historique de la";

      case 'all':
      default:
        return "l'Historique";

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - LIBELLÉ COLORÉ DE LA RUBRIQUE
   * =========================================================
   */
  public getCleanupHistoryContextLabel(): string {

    switch (this.selectedFilter) {

      case 'material':
        return 'Matériel récolté';

      case 'seed':
        return 'Semence';

      case 'storage':
        return 'Stockage';

      case 'germination':
        return 'Test de germination';

      case 'sowing':
        return 'Semis';

      case 'viability':
        return 'Test de viabilité';

      case 'culture':
        return 'Culture';

      case 'all':
      default:
        return 'Total';

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - CLASSE COULEUR DE LA RUBRIQUE
   * =========================================================
   */
  public getCleanupHistoryContextClass(): string {

    switch (this.selectedFilter) {

      case 'material':
        return 'historique-context-material';

      case 'seed':
        return 'historique-context-seed';

      case 'storage':
        return 'historique-context-storage';

      case 'germination':
        return 'historique-context-germination';

      case 'sowing':
        return 'historique-context-sowing';

      case 'viability':
        return 'historique-context-viability';

      case 'culture':
        return 'historique-context-culture';

      case 'all':
      default:
        return 'historique-context-all';

    }

  }


  /*
   * =========================================================
   * HISTORIQUE - NETTOYAGE DES ÉLÉMENTS SUPPRIMÉS
   *
   * Le bouton fonctionne dans toutes les rubriques.
   *
   * Il ne supprime que les historiques des entités
   * qui n'existent réellement plus en base.
   * =========================================================
   */
  public onCleanupDeletedHistory(): void {

    if (
      this.cleanupDialogOpen ||
      this.historyCleanupLoading
    ) {
      return;
    }


    const idHarvest =
      this.data && this.data.idHarvest
        ? this.data.idHarvest
        : null;


    if (!idHarvest) {

      this._commonService.translateToaster(
        'error',
        "Impossible de nettoyer l'historique"
      );

      return;
    }


    this.cleanupDialogOpen = true;


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'delete_sweep',
        variant: 'historique-cleanup',
        entityLabel: this.getCleanupHistoryLabel(),
        historyContextLabel: this.getCleanupHistoryContextLabel(),
        historyContextClass: this.getCleanupHistoryContextClass(),
        disableClose: false
      })
      .subscribe((yes) => {

        this.cleanupDialogOpen = false;

        if (!yes) {
          return;
        }


        this.historyCleanupLoading = true;


        this.historiqueService
          .cleanupDeletedHistory(
            idHarvest,
            this.selectedFilter || 'all'
          )
          .subscribe({

            next: (deletedEntities) => {

              this.historyCleanupLoading = false;


              /*
               * HISTORIQUE
               * Recharge la rubrique courante.
               */
              this.loadHistory();


              if (deletedEntities > 0) {

                this._commonService.translateToaster(
                  'success',
                  `${deletedEntities} élément(s) supprimé(s) de l'historique`
                );

              } else {

                this._commonService.translateToaster(
                  'info',
                  "Aucun élément supprimé à nettoyer dans cet historique"
                );

              }

            },

            error: () => {

              this.historyCleanupLoading = false;

              this._commonService.translateToaster(
                'error',
                "Erreur lors du nettoyage de l'historique"
              );

            }

          });

      });

  }

  public openHistoryDetail(
    event: HistoriqueEvent
  ): void {

    if (
      !event ||
      event.event_type === 'suppression'
    ) {
      return;
    }


    const idHarvest =
      event.id_harvest ||
      this.data?.idHarvest ||
      null;

    const idMaterial =
      event.entity_type === 'material'
        ? event.entity_id
        : (
            event.id_material ||
            this.data?.idMaterial ||
            null
          );


    let route: any[] | null = null;


    switch (event.entity_type) {

      case 'material':
        if (idHarvest && event.entity_id) {
          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            event.entity_id,
            'material-details'
          ];
        }
        break;

      case 'seed':
        if (idHarvest && idMaterial && event.entity_id) {
          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            idMaterial,
            'seed-details',
            event.entity_id
          ];
        }
        break;

      case 'storage': {

        const placeCode =
          event.detail_context
            ? event.detail_context.place_code
            : null;


        if (
          idHarvest &&
          idMaterial &&
          event.entity_id &&
          placeCode
        ) {

          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            idMaterial,
            'stock-details',
            event.entity_id,
            placeCode
          ];

        }

        break;
      }

      case 'germination':
        if (idHarvest && idMaterial && event.entity_id) {
          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            idMaterial,
            'germination-details',
            event.entity_id
          ];
        }
        break;

      case 'sowing':
        if (idHarvest && idMaterial && event.entity_id) {
          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            idMaterial,
            'semis-details',
            event.entity_id
          ];
        }
        break;

      case 'viability':
        if (idHarvest && idMaterial && event.entity_id) {
          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            idMaterial,
            'viability-details',
            event.entity_id
          ];
        }
        break;

      case 'culture':
        if (idHarvest && idMaterial && event.entity_id) {
          route = [
            '/conservation_flora_exsitu/form/harvest',
            idHarvest,
            'material',
            idMaterial,
            'culture-details',
            event.entity_id
          ];
        }
        break;

    }


    if (!route) {
      this._commonService.translateToaster(
        'error',
        "Impossible d'ouvrir la fiche détail de cet élément"
      );
      return;
    }


    this.dialogRef.close();

    this.router.navigate(route);

  }

  /*
   * =========================================================
   * HISTORIQUE - CONFIRMATION DU BOUTON RETOUR
   *
   * Le fonctionnement reprend celui des autres fiches :
   * - Non : rester dans Historique
   * - Oui : quitter Historique et afficher un toast info
   * =========================================================
   */
  public onBack(): void {

    if (this.exitDialogOpen) {
      return;
    }

    this.exitDialogOpen = true;

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'history',
        variant: 'historique-exit',
        entityLabel: "la fiche d'Historique",
        disableClose: false
      })
      .subscribe((yes) => {

        this.exitDialogOpen = false;

        if (!yes) {
          return;
        }

        /*
         * HISTORIQUE
         * Message d'information affiché après
         * la fermeture volontaire de la fiche.
         */
        this._commonService.translateToaster(
          'info',
          "Consultation de l'historique terminée"
        );

        this.dialogRef.close();

      });

  }


  /*
   * =========================================================
   * HISTORIQUE - RÉINITIALISATION DE LA CONSULTATION
   *
   * Le bouton Réinitialiser ramène toujours l'utilisateur
   * vers la rubrique depuis laquelle Historique a été ouvert.
   *
   * Exemples :
   *
   * Matériel récolté -> Historique -> Semence -> Réinitialiser
   * => retour sur Matériel récolté.
   *
   * Culture -> Historique -> Stockage -> Réinitialiser
   * => retour sur Culture.
   * =========================================================
   */
  public onReset(): void {

    if (this.resetDialogOpen) {
      return;
    }

    this.resetDialogOpen = true;

    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'history',
        variant: 'historique-reset',
        entityLabel: "la consultation de l'Historique",
        disableClose: false
      })
      .subscribe((yes) => {

        this.resetDialogOpen = false;

        if (!yes) {
          return;
        }

        /*
         * HISTORIQUE
         * Retour à la rubrique d'origine de la fiche.
         */
        this.selectedFilter =
          this.data && this.data.initialFilter
            ? this.data.initialFilter
            : 'all';


        /*
         * HISTORIQUE
         * Le bouton Réinitialiser remet également à zéro
         * les filtres Numéro / À partir de / Jusqu'à.
         */
        this.resetHistoryFilters();


        /*
         * HISTORIQUE
         * Recharge réellement la rubrique d'origine.
         */
        this.loadHistory();

      });

  }


  public onSave(): void {
    /*
     * HISTORIQUE
     * La logique d'enregistrement sera ajoutée
     * lorsque les champs de la fiche seront créés.
     */
  }

}