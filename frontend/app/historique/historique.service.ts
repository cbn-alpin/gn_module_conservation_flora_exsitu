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

}