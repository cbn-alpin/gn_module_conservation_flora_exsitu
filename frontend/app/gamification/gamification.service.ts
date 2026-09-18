import { Injectable } from '@angular/core';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';

import {
  GamificationComponent
} from './gamification.component';


@Injectable({
  providedIn: 'root'
})
export class GamificationService {

  /* =========================================================
     GAMIFICATION - ÉTAT GLOBAL ON / OFF

     Une seule valeur est utilisée par toutes les rubriques :

     - Matériel récolté
     - Semence
     - Stockage
     - Germination
     - Semis
     - Viabilité
     - Culture

     L'état est également conservé après navigation
     et après actualisation de la page.
     ========================================================= */

  private readonly storageKey =
    'exsitu-gamification-enabled';


  private enabledSubject =
    new BehaviorSubject<boolean>(
      this.getStoredEnabledState()
    );


  constructor(
    private dialog: MatDialog
  ) {}


  public get enabled$(): Observable<boolean> {
    return this.enabledSubject.asObservable();
  }


  public get enabled(): boolean {
    return this.enabledSubject.value;
  }


  public setEnabled(enabled: boolean): void {

    /*
     * Met immédiatement à jour tous les
     * <app-gamification> actuellement présents.
     */
    this.enabledSubject.next(enabled);


    /*
     * Conserve le même état lorsque l'utilisateur
     * change de rubrique ou recharge la page.
     */
    localStorage.setItem(
      this.storageKey,
      String(enabled)
    );

  }


  private getStoredEnabledState(): boolean {

    const storedValue =
      localStorage.getItem(
        this.storageKey
      );


    /*
     * Aucun choix enregistré :
     * Gamification reste ON par défaut.
     */
    if (storedValue === null) {
      return true;
    }


    return storedValue === 'true';

  }


  /* =========================================================
     GAMIFICATION - OUVERTURE DE LA FICHE

     Même logique que HistoriqueService.openHistorique().
     ========================================================= */

  public openGamification(
    initialFilter: string = 'all'
  ): void {

    this.dialog.open(
      GamificationComponent,
      {
        width: '900px',
        height: '90vh',

        disableClose: true,
        autoFocus: false,

        data: {
          dialogMode: true,
          initialFilter: initialFilter
        }
      }
    );

  }

}