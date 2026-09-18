import {
  Component,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import {
  forkJoin,
  Subscription
} from 'rxjs';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  DialogService
} from '../components/confirm-dialog/confirm-dialog.service';

import {
  GamificationService,
  GamificationStats
} from './gamification.service';

import {
  GamificationAchievement,
  GamificationAchievementService,
  GamificationProgressChange
} from './gamification-achievement.service';

import {
  ExsituFormService
} from '../form/shared/exsitu-form.service';


@Component({
  selector: 'app-gamification',
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.scss'],

  /* =========================================================
     GAMIFICATION - SERVICE DE CONFIRMATION

     Même logique qu'Historique :
     DialogService est fourni directement au composant
     afin qu'il reste disponible lorsque Gamification
     est ouvert depuis le MatDialog global.
     ========================================================= */
  providers: [
    DialogService
  ]
})
export class GamificationComponent implements OnInit, OnDestroy {

  /* =========================================================
     GAMIFICATION - RUBRIQUE D'OUVERTURE

     Même logique que l'initialFilter d'Historique.
     ========================================================= */

  @Input()
  public initialFilter: string = 'all';


  /* =========================================================
     GAMIFICATION - MODE D'AFFICHAGE

     false :
     petit ON/OFF + bouton présent dans les listes.

     true :
     fiche Gamification ouverte dans le MatDialog.
     ========================================================= */

  public isDialog = false;

  public selectedFilter = 'all';


  /* =========================================================
     GAMIFICATION - NIVEAU VISUEL

     1 = très insatisfaisant
     2 = insatisfaisant
     3 = neutre
     4 = satisfaisant
     5 = très satisfaisant
     ========================================================= */

  public gamificationScore = 3;

  public gamificationPercentage = 50;

  public gamificationActionCount = 0;

  public gamificationLoading = false;

  public gamificationError = false;


  /* =========================================================
     GAMIFICATION - PLUS HAUT SUCCÈS DANS LE BOUTON COMPACT
     ========================================================= */

  public inlineSuccessIcon = '🏅';

  public inlineSuccessLabel =
    'Bienvenue / Premier pas';

  public inlineSuccessLoading = false;

  public inlineSuccessError = false;


  /* =========================================================
     GAMIFICATION - CÉLÉBRATION D'UN NOUVEAU SUCCÈS
     ========================================================= */

  public achievement:
    GamificationAchievement | null = null;


  public achievementSuccessIcon = '🏆';

  public achievementSuccessLabel = '';

  public achievementSectionLabel = '';


  /*
   * Confettis créés sans bibliothèque externe.
   */
  public readonly confettiPieces =
    Array.from(
      { length: 44 },
      (_, index) => index
    );


  /*
   * =========================================================
   * GAMIFICATION - SUCCÈS
   *
   * Chaque rubrique possède sa propre progression.
   * =========================================================
   */

  public readonly gamificationSuccesses = [

    {
      threshold: 0,
      icon: '🏅',
      label: 'Bienvenue / Premier pas'
    },

    {
      threshold: 1,
      icon: '🏆',
      label: '1 ajout ou modification'
    },

    {
      threshold: 5,
      icon: '🎯',
      label: '5 ajouts ou modifications'
    },

    {
      threshold: 10,
      icon: '🙂',
      label: '10 ajouts ou modifications'
    },

    {
      threshold: 15,
      icon: '🌍',
      label: '15 ajouts ou modifications'
    },

    {
      threshold: 20,
      icon: '👑',
      label: '20 ajouts ou modifications'
    },

    {
      threshold: 25,
      icon: '🎤',
      label: '25 ajouts ou modifications'
    },

    {
      threshold: 35,
      icon: '🎟️',
      label: '35 ajouts ou modifications'
    },

    {
      threshold: 40,
      icon: '📣',
      label: '40 ajouts ou modifications'
    },

    {
      threshold: 50,
      icon: '💎',
      label: '50 ajouts ou modifications'
    }

  ];


  /* =========================================================
     GAMIFICATION - VUE GLOBALE "TOUT"

     Chaque carte résume le plus haut palier atteint
     dans une rubrique.
     ========================================================= */

  public gamificationGlobalUnlockedCount = 0;

  public gamificationOverviewSections = [

    {
      filter: 'material',
      label: 'Matériel récolté',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    },

    {
      filter: 'seed',
      label: 'Semence',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    },

    {
      filter: 'storage',
      label: 'Stockage',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    },

    {
      filter: 'germination',
      label: 'Test de germination',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    },

    {
      filter: 'sowing',
      label: 'Semis',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    },

    {
      filter: 'viability',
      label: 'Test de viabilité',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    },

    {
      filter: 'culture',
      label: 'Culture',
      actionCount: 0,
      unlockedCount: 0,
      percentage: 0,
      successIcon: '🏅',
      successLabel: 'Bienvenue / Premier pas'
    }

  ];


  @HostBinding('class.gamification-inline-host')
  public get inlineHost(): boolean {
    return !this.isDialog;
  }


  @HostBinding('class.gamification-dialog-host')
  public get dialogHost(): boolean {
    return this.isDialog;
  }


  /* =========================================================
     GAMIFICATION - ACTIVATION GLOBALE
     ========================================================= */

  public enabled = true;

  private enabledSubscription: Subscription | null = null;

  private achievementSubscription:
    Subscription | null = null;

  private progressSubscription:
    Subscription | null = null;


  /* =========================================================
     GAMIFICATION - DIALOGUE DE SORTIE

     Empêche l'ouverture de plusieurs confirmations
     si Retour ou le fond extérieur est cliqué
     plusieurs fois.
     ========================================================= */

  private exitDialogOpen = false;


  /*
   * =========================================================
   * GAMIFICATION - DIALOGUE DE RÉINITIALISATION
   *
   * Même protection que dans Historique.
   * =========================================================
   */

  private resetDialogOpen = false;


  constructor(
    private gamificationService: GamificationService,

    private gamificationAchievementService:
      GamificationAchievementService,

    /*
     * GAMIFICATION
     * Récolte actuellement consultée.
     */
    private exsituFormService: ExsituFormService,

    /*
     * GAMIFICATION
     * Même service de confirmation qu'Historique.
     */
    private dialogService: DialogService,

    /*
     * GAMIFICATION
     * Utilisé pour afficher le message d'information
     * après la fermeture volontaire de la fiche.
     */
    private _commonService: CommonService,

    /*
     * MAT_DIALOG_DATA et MatDialogRef sont optionnels
     * car le composant existe aussi directement
     * dans les 7 listes.
     */
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: {
      dialogMode?: boolean;
      initialFilter?: string;
    } | null,

    @Optional()
    private dialogRef: MatDialogRef<GamificationComponent>
  ) {

    /*
     * GAMIFICATION
     * Si dialogMode est présent, cette instance correspond
     * à la fiche Gamification et non au petit bouton.
     */
    this.isDialog =
      !!(
        this.data &&
        this.data.dialogMode
      );


    /*
     * GAMIFICATION
     * Même principe qu'Historique :
     * la rubrique depuis laquelle on ouvre la fiche
     * devient automatiquement l'onglet sélectionné.
     */
    if (this.isDialog) {

      this.selectedFilter =
        this.data && this.data.initialFilter
          ? this.data.initialFilter
          : 'all';

    }

  }


  public ngOnInit(): void {

    this.enabled =
      this.gamificationService.enabled;


    this.enabledSubscription =
      this.gamificationService.enabled$
        .subscribe(
          enabled => {

            this.enabled = enabled;


            /*
             * Si Gamification passe OFF pendant
             * une célébration, elle disparaît.
             */
            if (!enabled) {
              this.achievement = null;
            }

          }
        );


    /* =======================================================
       GAMIFICATION - NOUVEAU SUCCÈS

       Cet événement n'existe que si :
       - une création/modification vient de réussir ;
       - cette action atteint exactement un palier ;
       - Gamification était ON à cet instant.
       ======================================================= */

    this.achievementSubscription =
      this.gamificationAchievementService
        .achievement$
        .subscribe(
          achievement => {

            if (
              !achievement
              || !this.enabled
            ) {

              this.achievement = null;

              return;

            }


            const success =
              this.gamificationSuccesses.find(
                item =>
                  item.threshold
                  === achievement.action_count
              );


            if (!success) {
              return;
            }


            this.achievement =
              achievement;


            this.achievementSuccessIcon =
              success.icon;


            this.achievementSuccessLabel =
              success.label;


            this.achievementSectionLabel =
              this.getGamificationSectionLabel(
                achievement.entity_type
              );


            /*
             * Actualise également immédiatement
             * le petit badge rond à côté du ON/OFF.
             */
            if (
              !this.isDialog
              && this.initialFilter
                === achievement.entity_type
            ) {

              this.inlineSuccessIcon =
                success.icon;


              this.inlineSuccessLabel =
                success.label;

            }

          }
        );


    /* =======================================================
       GAMIFICATION - PROGRESSION MODIFIÉE PAR SUPPRESSION

       Aucun message de félicitations n'est déclenché.
       On rafraîchit uniquement le palier et la jauge.
       ======================================================= */

    this.progressSubscription =
      this.gamificationAchievementService
        .progressChanged$
        .subscribe(
          (
            progress:
              GamificationProgressChange
          ) => {

            if (!progress) {
              return;
            }


            if (
              !this.isDialog
              && this.initialFilter
                === progress.entity_type
            ) {

              this.loadInlineGamificationSuccess();

              return;

            }


            if (!this.isDialog) {
              return;
            }


            if (
              this.selectedFilter
              === 'all'
            ) {

              this.loadGamificationOverview();

              return;

            }


            if (
              this.selectedFilter
              === progress.entity_type
            ) {

              this.loadGamificationProgress();

            }

          }
        );


    /*
     * GAMIFICATION - MODE COMPACT
     *
     * Charge le plus haut succès de la rubrique
     * affichée à gauche du bouton Gamification.
     */
    if (!this.isDialog) {
      this.loadInlineGamificationSuccess();
    }


    /*
     * =========================================================
     * GAMIFICATION - CLIC EN DEHORS DE LA FICHE
     *
     * Même comportement qu'Historique.
     *
     * La fiche ne se ferme pas directement.
     * Le clic sur le fond déclenche la même confirmation
     * que le bouton Retour.
     * =========================================================
     */

    if (
      this.isDialog &&
      this.dialogRef
    ) {

      this.dialogRef
        .backdropClick()
        .subscribe(() => {

          this.onBack();

        });

    }


    /*
     * GAMIFICATION
     * Charge automatiquement les statistiques
     * de la rubrique depuis laquelle la fiche
     * a été ouverte.
     *
     * "Tout" reste volontairement inchangé.
     */
    if (this.isDialog) {

      if (this.selectedFilter === 'all') {

        this.loadGamificationOverview();

      } else {

        this.loadGamificationProgress();

      }

    }

  }


  public ngOnDestroy(): void {

    if (this.enabledSubscription) {
      this.enabledSubscription.unsubscribe();
    }


    if (this.achievementSubscription) {
      this.achievementSubscription.unsubscribe();
    }


    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }

  }


  /* =========================================================
     GAMIFICATION - ON / OFF
     ========================================================= */

  public onToggle(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    this.gamificationService
      .setEnabled(input.checked);


    /*
     * OFF :
     * on détruit immédiatement toute célébration courante.
     *
     * Un succès éventuellement obtenu pendant OFF
     * ne sera jamais rejoué plus tard.
     */
    if (!input.checked) {

      this.gamificationAchievementService
        .clear();

      return;

    }


    /*
     * ON :
     * on rafraîchit seulement le logo du meilleur succès.
     *
     * IMPORTANT :
     * ceci ne génère aucune célébration rétroactive.
     */
    if (!this.isDialog) {
      this.loadInlineGamificationSuccess();
    }

  }


  public closeAchievementCelebration(): void {

    this.gamificationAchievementService
      .clear();

  }


  /* =========================================================
     GAMIFICATION - PLUS HAUT SUCCÈS DU MODE COMPACT

     Chaque rubrique charge uniquement son propre compteur.
     ========================================================= */

  private loadInlineGamificationSuccess(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (
      !idHarvest
      || !this.initialFilter
      || this.initialFilter === 'all'
    ) {

      this.inlineSuccessLoading = false;
      return;

    }


    this.inlineSuccessLoading = true;
    this.inlineSuccessError = false;


    this.gamificationService
      .getGamificationStats(
        idHarvest,
        this.initialFilter
      )
      .subscribe({

        next: (stats: GamificationStats) => {

          const actionCount =
            Math.max(
              0,
              Number(
                stats
                && stats.action_count
              ) || 0
            );


          const highestSuccess =
            this.getHighestGamificationSuccess(
              actionCount
            );


          this.inlineSuccessIcon =
            highestSuccess.icon;

          this.inlineSuccessLabel =
            highestSuccess.label;

          this.inlineSuccessLoading = false;

        },


        error: () => {

          this.inlineSuccessLoading = false;
          this.inlineSuccessError = true;

        }

      });

  }


  /* =========================================================
     GAMIFICATION - OUVERTURE DE LA FICHE
     ========================================================= */

  public openGamification(): void {

    if (
      !this.enabled ||
      this.isDialog
    ) {
      return;
    }


    this.gamificationService.openGamification(
      this.initialFilter || 'all'
    );

  }


  /* =========================================================
     GAMIFICATION - CONFIRMATION DU BOUTON RETOUR

     Même fonctionnement qu'Historique :

     - Non : rester dans Gamification
     - Oui : quitter Gamification
       et afficher un toast d'information

     Cette méthode est également appelée lorsque
     l'utilisateur clique en dehors de la fiche.
     ========================================================= */

  public onBack(): void {

    if (
      !this.isDialog ||
      !this.dialogRef
    ) {
      return;
    }


    if (this.exitDialogOpen) {
      return;
    }


    this.exitDialogOpen = true;


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'star',
        variant: 'gamification-exit',
        entityLabel: 'la fiche de Gamification',
        disableClose: false
      })
      .subscribe((yes) => {

        this.exitDialogOpen = false;


        if (!yes) {
          return;
        }


        /*
         * GAMIFICATION
         * Message d'information affiché après
         * la fermeture volontaire de la fiche.
         */
        this._commonService.translateToaster(
          'info',
          'Consultation de la gamification terminée'
        );


        this.dialogRef.close();

      });

  }


  /* =========================================================
     GAMIFICATION - BARRE D'ONGLETS
     ========================================================= */

  public selectGamificationFilter(
    filter: string
  ): void {

    this.selectedFilter = filter;


    /*
     * "Tout" affiche maintenant la progression
     * globale des 7 rubriques.
     */
    if (filter === 'all') {

      this.loadGamificationOverview();

      return;

    }


    /*
     * Chaque rubrique recharge uniquement
     * ses propres statistiques.
     */
    this.loadGamificationProgress();

  }


  /* =========================================================
     GAMIFICATION - NIVEAU VISUEL

     Dans les rubriques métier, cette valeur est calculée
     automatiquement à partir des succès.

     "Tout" garde pour le moment le comportement existant.
     ========================================================= */

  public setGamificationScore(
    score: number
  ): void {

    if (this.selectedFilter !== 'all') {
      return;
    }


    this.gamificationScore = score;

    this.gamificationPercentage =
      (score - 1) * 25;

  }


  public onGamificationScoreChange(
    event: Event
  ): void {

    if (this.selectedFilter !== 'all') {
      return;
    }


    const input =
      event.target as HTMLInputElement;


    this.gamificationPercentage =
      Number(input.value);


    this.gamificationScore =
      this.getGamificationScoreFromPercentage(
        this.gamificationPercentage
      );

  }


  /* =========================================================
     GAMIFICATION - CHARGEMENT DE LA PROGRESSION

     IMPORTANT :

     Chaque rubrique est indépendante.

     Une création Matériel récolté n'ajoute aucun point
     à Semence, Stockage, Germination, Semis,
     Viabilité ou Culture.

     Création     = +1
     Modification = +1
     Suppression  =  0
     ========================================================= */

  private loadGamificationProgress(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (
      !idHarvest ||
      this.selectedFilter === 'all'
    ) {
      return;
    }


    /*
     * On mémorise la rubrique demandée pour éviter
     * qu'une réponse HTTP tardive d'un ancien onglet
     * remplace les données du nouvel onglet.
     */
    const requestedFilter =
      this.selectedFilter;


    this.gamificationLoading = true;
    this.gamificationError = false;


    this.gamificationService
      .getGamificationStats(
        idHarvest,
        requestedFilter
      )
      .subscribe({

        next: (stats: GamificationStats) => {

          if (
            requestedFilter
            !== this.selectedFilter
          ) {
            return;
          }


          this.applyGamificationActionCount(
            stats && stats.action_count
              ? stats.action_count
              : 0
          );


          this.gamificationLoading = false;

        },


        error: () => {

          if (
            requestedFilter
            !== this.selectedFilter
          ) {
            return;
          }


          this.gamificationActionCount = 0;
          this.gamificationPercentage = 0;
          this.gamificationScore = 1;

          this.gamificationLoading = false;
          this.gamificationError = true;

        }

      });

  }


  /* =========================================================
     GAMIFICATION - COMPTAGE

     Le backend fournit directement le compteur autonome
     de la rubrique sélectionnée.

     Matériel, Semence, Stockage, Germination,
     Semis, Viabilité et Culture restent indépendants.
     ========================================================= */

  private applyGamificationActionCount(
    actionCount: number
  ): void {

    this.gamificationActionCount =
      Math.max(
        0,
        Number(actionCount) || 0
      );


    /*
     * Bienvenue = état initial.
     *
     * Les 9 vrais succès sont :
     * 1 / 5 / 10 / 15 / 20 / 25 / 35 / 40 / 50.
     */
    const successThresholds = [
      1,
      5,
      10,
      15,
      20,
      25,
      35,
      40,
      50
    ];


    const unlockedSuccesses =
      successThresholds.filter(
        threshold =>
          this.gamificationActionCount
          >= threshold
      ).length;


    /*
     * Pourcentage basé sur les succès réellement
     * débloqués.
     *
     * 0 succès = 0 %
     * 9 succès = 100 %
     */
    this.gamificationPercentage =
      Math.round(
        (
          unlockedSuccesses
          / successThresholds.length
        )
        * 100
      );


    this.gamificationScore =
      this.getGamificationScoreFromPercentage(
        this.gamificationPercentage
      );

  }


  /* =========================================================
     GAMIFICATION - VISAGE SELON LE POURCENTAGE
     ========================================================= */

  private getGamificationScoreFromPercentage(
    percentage: number
  ): number {

    if (percentage <= 20) {
      return 1;
    }


    if (percentage <= 40) {
      return 2;
    }


    if (percentage <= 60) {
      return 3;
    }


    if (percentage <= 80) {
      return 4;
    }


    return 5;

  }


  /* =========================================================
     GAMIFICATION - VUE GLOBALE "TOUT"

     9 succès réels par rubrique x 7 rubriques = 63 points.

     La jauge générale représente le nombre total
     de paliers débloqués sur ces 63 points possibles.
     ========================================================= */

  private loadGamificationOverview(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (!idHarvest) {
      return;
    }


    const requestedFilter = 'all';


    this.gamificationLoading = true;
    this.gamificationError = false;


    const requests =
      this.gamificationOverviewSections
        .map(
          section =>
            this.gamificationService
              .getGamificationStats(
                idHarvest,
                section.filter
              )
        );


    forkJoin(requests)
      .subscribe({

        next: (statsList: GamificationStats[]) => {

          if (
            this.selectedFilter
            !== requestedFilter
          ) {
            return;
          }


          let totalUnlocked = 0;
          let totalActions = 0;


          this.gamificationOverviewSections =
            this.gamificationOverviewSections
              .map(
                (section, index) => {

                  const stats =
                    statsList[index];


                  const actionCount =
                    Math.max(
                      0,
                      Number(
                        stats
                        && stats.action_count
                      ) || 0
                    );


                  const unlockedCount =
                    this.getGamificationUnlockedCount(
                      actionCount
                    );


                  const highestSuccess =
                    this.getHighestGamificationSuccess(
                      actionCount
                    );


                  totalUnlocked +=
                    unlockedCount;

                  totalActions +=
                    actionCount;


                  return {
                    ...section,
                    actionCount: actionCount,
                    unlockedCount: unlockedCount,
                    percentage: Math.round(
                      (unlockedCount / 9)
                      * 100
                    ),
                    successIcon:
                      highestSuccess.icon,
                    successLabel:
                      highestSuccess.label
                  };

                }
              );


          this.gamificationGlobalUnlockedCount =
            totalUnlocked;

          this.gamificationActionCount =
            totalActions;

          /*
           * 7 rubriques x 9 succès = 63.
           */
          this.gamificationPercentage =
            Math.round(
              (totalUnlocked / 63)
              * 100
            );


          this.gamificationScore =
            this.getGamificationScoreFromPercentage(
              this.gamificationPercentage
            );


          this.gamificationLoading = false;

        },


        error: () => {

          if (
            this.selectedFilter
            !== requestedFilter
          ) {
            return;
          }


          this.gamificationGlobalUnlockedCount = 0;
          this.gamificationActionCount = 0;
          this.gamificationPercentage = 0;
          this.gamificationScore = 1;

          this.gamificationLoading = false;
          this.gamificationError = true;

        }

      });

  }


  /* =========================================================
     GAMIFICATION - NOMBRE DE SUCCÈS DÉBLOQUÉS
     ========================================================= */

  private getGamificationUnlockedCount(
    actionCount: number
  ): number {

    return this.gamificationSuccesses
      .filter(
        success =>
          success.threshold > 0
          && actionCount >= success.threshold
      )
      .length;

  }


  /* =========================================================
     GAMIFICATION - PLUS HAUT PALIER ATTEINT
     ========================================================= */

  private getHighestGamificationSuccess(
    actionCount: number
  ) {

    let highestSuccess =
      this.gamificationSuccesses[0];


    this.gamificationSuccesses
      .forEach(
        success => {

          if (
            actionCount
            >= success.threshold
          ) {

            highestSuccess = success;

          }

        }
      );


    return highestSuccess;

  }


  /* =========================================================
     GAMIFICATION - SUCCÈS DÉBLOQUÉ
     ========================================================= */

  public isGamificationSuccessUnlocked(
    threshold: number
  ): boolean {

    return (
      threshold === 0
      || this.gamificationActionCount
        >= threshold
    );

  }


  /* =========================================================
     GAMIFICATION - PROCHAIN SUCCÈS

     Un seul succès est affiché comme
     "En progression".
     ========================================================= */

  public isGamificationNextSuccess(
    threshold: number
  ): boolean {

    if (
      threshold === 0
      || this.gamificationActionCount
        >= threshold
    ) {
      return false;
    }


    const nextThreshold =
      this.gamificationSuccesses
        .map(
          success =>
            success.threshold
        )
        .find(
          successThreshold =>
            successThreshold
            > this.gamificationActionCount
        );


    return threshold === nextThreshold;

  }


  /* =========================================================
     GAMIFICATION - TITRE DE LA VUE SÉLECTIONNÉE

     Même principe que getHistoriqueTitle().
     ========================================================= */

  public getGamificationTitle(): string {

    switch (this.selectedFilter) {

      case 'material':
        return 'Gamification de Matériel récolté';

      case 'seed':
        return 'Gamification de Semence';

      case 'storage':
        return 'Gamification de Stockage';

      case 'germination':
        return 'Gamification de Test de germination';

      case 'sowing':
        return 'Gamification de Semis';

      case 'viability':
        return 'Gamification de Test de viabilité';

      case 'culture':
        return 'Gamification de Culture';

      case 'all':
      default:
        return 'Gamification générale';

    }

  }


  /* =========================================================
     GAMIFICATION - MESSAGE ÉTAT VIDE

     Même logique que l'état vide d'Historique.
     ========================================================= */

  public getGamificationEmptyMessage(): string {

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
        return 'Aucun événement dans la Gamification totale.';

    }

  }


  /* =========================================================
     GAMIFICATION - LIBELLÉ D'UNE RUBRIQUE
     ========================================================= */

  private getGamificationSectionLabel(
    filter: string
  ): string {

    switch (filter) {

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
        return 'Tout';

    }

  }


  /* =========================================================
     GAMIFICATION - COULEUR D'UNE RUBRIQUE
     ========================================================= */

  private getGamificationSectionClass(
    filter: string
  ): string {

    switch (filter) {

      case 'material':
        return 'gamification-context-material';

      case 'seed':
        return 'gamification-context-seed';

      case 'storage':
        return 'gamification-context-storage';

      case 'germination':
        return 'gamification-context-germination';

      case 'sowing':
        return 'gamification-context-sowing';

      case 'viability':
        return 'gamification-context-viability';

      case 'culture':
        return 'gamification-context-culture';

      case 'all':
      default:
        return 'gamification-context-all';

    }

  }


  /* =========================================================
     GAMIFICATION - RÉINITIALISER

     Même logique qu'Historique.

     La fiche revient toujours à la rubrique depuis
     laquelle Gamification a été ouverte.

     Exemple :
     Matériel récolté -> Gamification -> Semence
     -> Réinitialiser
     => retour sur Matériel récolté.
     ========================================================= */

  public onReset(): void {

    if (this.resetDialogOpen) {
      return;
    }


    const initialFilter =
      this.data && this.data.initialFilter
        ? this.data.initialFilter
        : 'all';


    this.resetDialogOpen = true;


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'autorenew',
        variant: 'gamification-reset',

        gamificationCurrentLabel:
          this.getGamificationSectionLabel(
            this.selectedFilter
          ),

        gamificationCurrentClass:
          this.getGamificationSectionClass(
            this.selectedFilter
          ),

        gamificationTargetLabel:
          this.getGamificationSectionLabel(
            initialFilter
          ),

        gamificationTargetClass:
          this.getGamificationSectionClass(
            initialFilter
          ),

        disableClose: false
      })
      .subscribe((yes) => {

        this.resetDialogOpen = false;


        if (!yes) {
          return;
        }


        /*
         * Retour à la rubrique depuis laquelle
         * Gamification a été ouverte.
         */
        this.selectedFilter = initialFilter;


        const idHarvest =
          this.exsituFormService.idHarvest;


        if (!idHarvest) {
          return;
        }


        /*
         * Réinitialiser refait maintenant réellement
         * le calcul Gamification de la rubrique cible.
         *
         * Le backend vérifie les éléments encore présents,
         * retire les contributions devenues orphelines et
         * conserve les modifications déjà suivies pour les
         * éléments qui existent toujours.
         */
        this.gamificationLoading = true;
        this.gamificationError = false;


        this.gamificationService
          .resetGamificationStats(
            idHarvest,
            initialFilter
          )
          .subscribe({

            next: () => {

              this.gamificationLoading = false;


              /*
               * Une fois le recalcul terminé,
               * on recharge immédiatement l'affichage.
               */
              if (initialFilter === 'all') {

                this.loadGamificationOverview();

              } else {

                this.loadGamificationProgress();

              }


              this._commonService.translateToaster(
                'info',
                'Calcul de la gamification vérifié et réinitialisé'
              );

            },


            error: () => {

              this.gamificationLoading = false;
              this.gamificationError = true;


              this._commonService.translateToaster(
                'error',
                'Impossible de recalculer la gamification'
              );

            }

          });

      });

  }

}