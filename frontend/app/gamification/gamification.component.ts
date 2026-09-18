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
  GamificationService
} from './gamification.service';


@Component({
  selector: 'app-gamification',
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.scss']
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


  constructor(
    private gamificationService: GamificationService,

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
     GAMIFICATION - RETOUR
     ========================================================= */

  public onBack(): void {

    if (this.dialogRef) {
      this.dialogRef.close();
    }

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
     GAMIFICATION - RÉINITIALISER

     Pour cette première étape, aucune donnée métier
     n'est modifiée.

     On replace simplement l'affichage sur "Tout".
     ========================================================= */

  public onReset(): void {

    this.selectedFilter = 'all';

  }

}