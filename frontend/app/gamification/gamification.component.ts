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
  Subscription
} from 'rxjs';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  DialogService
} from '../components/confirm-dialog/confirm-dialog.service';

import {
  GamificationService
} from './gamification.service';


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


  /* =========================================================
     GAMIFICATION - DIALOGUE DE SORTIE

     Empêche l'ouverture de plusieurs confirmations
     si Retour ou le fond extérieur est cliqué
     plusieurs fois.
     ========================================================= */

  private exitDialogOpen = false;


  constructor(
    private gamificationService: GamificationService,

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
          }
        );


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

  }


  public ngOnDestroy(): void {

    if (this.enabledSubscription) {
      this.enabledSubscription.unsubscribe();
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

  }


  /* =========================================================
     GAMIFICATION - NIVEAU VISUEL
     ========================================================= */

  public setGamificationScore(
    score: number
  ): void {

    this.gamificationScore = score;

  }


  public onGamificationScoreChange(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    this.gamificationScore =
      Number(input.value);

  }


  /* =========================================================
     GAMIFICATION - RÉINITIALISER
     ========================================================= */

  public onReset(): void {

    this.selectedFilter = 'all';

    this.gamificationScore = 3;

  }

}