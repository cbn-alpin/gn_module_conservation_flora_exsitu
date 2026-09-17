import {
  Component,
  Inject,
  OnInit
} from '@angular/core';

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

    if (this.selectedFilter === 'material') {
      this.loadMaterialHistory();
    }


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
  private loadMaterialHistory(): void {

    if (!this.data || !this.data.idHarvest) {

      this.materialHistoryEvents = [];
      this.materialHistoryError = true;

      return;

    }


    this.materialHistoryLoading = true;
    this.materialHistoryError = false;


    this.historiqueService
      .getMaterialHistory(
        this.data.idHarvest
      )
      .subscribe({

        next: (events) => {

          this.materialHistoryEvents =
            events || [];

          this.materialHistoryLoading =
            false;

        },

        error: () => {

          this.materialHistoryEvents = [];
          this.materialHistoryLoading = false;
          this.materialHistoryError = true;

        }

      });

  }


  /*
   * =========================================================
   * HISTORIQUE - SÉLECTION D'UN FILTRE
   * =========================================================
   */
  public selectHistoriqueFilter(filter: string): void {

    this.selectedFilter = filter;


    /*
     * HISTORIQUE - MATÉRIEL RÉCOLTÉ
     *
     * On recharge les événements lorsque la rubrique
     * Matériel récolté est sélectionnée.
     */
    if (filter === 'material') {
      this.loadMaterialHistory();
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
               * HISTORIQUE - MATÉRIEL RÉCOLTÉ
               *
               * Pour l'instant Matériel récolté est la seule
               * timeline réellement développée.
               */
              if (this.selectedFilter === 'material') {
                this.loadMaterialHistory();
              }


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