import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  Observable
} from 'rxjs';

import {
  map
} from 'rxjs/operators';

import {
  ConfigService
} from '../services/config.service';

import {
  HistoriqueComponent
} from './historique.component';

import {
  HistoriqueEvent
} from './historique.models';


@Injectable()
export class HistoriqueService {

  private moduleBaseUrl: string;


  constructor(
    private dialog: MatDialog,
    private api: HttpClient,
    private cfg: ConfigService
  ) {

    this.moduleBaseUrl =
      this.cfg.getModuleBackendUrl();

  }


  public openHistorique(
    initialFilter: string = 'all',
    idHarvest: number | null = null,
    idMaterial: number | null = null
  ): void {

    this.dialog.open(
      HistoriqueComponent,
      {
        width: '900px',
        height: '90vh',

        disableClose: true,
        autoFocus: false,

        data: {
          initialFilter: initialFilter,
          idHarvest: idHarvest,
          idMaterial: idMaterial
        }
      }
    );

  }


  /*
   * =========================================================
   * HISTORIQUE - MATÉRIELS RÉCOLTÉS
   * =========================================================
   */
  public getMaterialHistory(
    idHarvest: number
  ): Observable<HistoriqueEvent[]> {

    return this.api
      .get<{
        events: HistoriqueEvent[]
      }>(
        `${this.moduleBaseUrl}/harvests/${idHarvest}/history/materials`
      )
      .pipe(
        map(
          response =>
            response && response.events
              ? response.events
              : []
        )
      );

  }


  /*
   * =========================================================
   * HISTORIQUE - NETTOYAGE DES ÉLÉMENTS SUPPRIMÉS
   *
   * Fonction commune à toutes les rubriques Historique.
   * "all" nettoie toutes les catégories de la récolte.
   * =========================================================
   */
  public cleanupDeletedHistory(
    idHarvest: number,
    entityType: string
  ): Observable<number> {

    return this.api
      .delete<{
        deleted_entities: number;
        deleted_events: number;
      }>(
        `${this.moduleBaseUrl}/harvests/${idHarvest}/history/cleanup/${entityType}`
      )
      .pipe(
        map(
          response =>
            response && response.deleted_entities
              ? response.deleted_entities
              : 0
        )
      );

  }

}