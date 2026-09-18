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

  private enabledSubject =
    new BehaviorSubject<boolean>(true);


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
    this.enabledSubject.next(enabled);
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