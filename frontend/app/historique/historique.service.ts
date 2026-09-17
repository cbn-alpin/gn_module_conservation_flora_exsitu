import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import {
  HistoriqueComponent
} from './historique.component';


@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {

  constructor(
    private dialog: MatDialog
  ) {}


  public openHistorique(
    initialFilter: string = 'all'
  ): void {

    this.dialog.open(
      HistoriqueComponent,
      {
        /*
         * HISTORIQUE
         * Même dimensions que la fiche
         * "Ajouter une fiche de Matériel récolté".
         */
        width: '900px',
        height: '90vh',

        disableClose: true,
        autoFocus: false,

        /*
         * =====================================================
         * HISTORIQUE - RUBRIQUE À SÉLECTIONNER À L'OUVERTURE
         * =====================================================
         */
        data: {
          initialFilter: initialFilter
        }
      }
    );

  }

}