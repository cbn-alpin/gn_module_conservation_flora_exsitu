import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';

import {
  ConfigService
} from '../services/config.service';

import {
  GamificationComponent
} from './gamification.component';


export interface GamificationStats {
  entity_type: string;
  action_count: number;
}


@Injectable()
export class GamificationService {

  /* =========================================================
     GAMIFICATION - ÉTAT GLOBAL ON / OFF
     ========================================================= */

  private readonly storageKey =
    'exsitu-gamification-enabled';


  private enabledSubject =
    new BehaviorSubject<boolean>(
      this.getStoredEnabledState()
    );


  private moduleBaseUrl: string;


  constructor(
    private dialog: MatDialog,
    private api: HttpClient,
    private cfg: ConfigService
  ) {

    this.moduleBaseUrl =
      this.cfg.getModuleBackendUrl();

  }


  public get enabled$(): Observable<boolean> {
    return this.enabledSubject.asObservable();
  }


  public get enabled(): boolean {
    return this.enabledSubject.value;
  }


  public setEnabled(enabled: boolean): void {

    this.enabledSubject.next(enabled);

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


    if (storedValue === null) {
      return true;
    }


    return storedValue === 'true';

  }


  /* =========================================================
     GAMIFICATION - STATISTIQUES AUTONOMES

     Aucun appel à Historique.

     Chaque rubrique possède son propre compteur.
     ========================================================= */

  public getGamificationStats(
    idHarvest: number,
    entityType: string
  ): Observable<GamificationStats> {

    return this.api
      .get<GamificationStats>(
        `${this.moduleBaseUrl}/harvests/${idHarvest}/gamification/${entityType}`
      );

  }


  /* =========================================================
     GAMIFICATION - OUVERTURE DE LA FICHE
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