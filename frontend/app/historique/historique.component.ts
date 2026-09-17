import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent {

  /*
   * =========================================================
   * HISTORIQUE - FILTRE SÉLECTIONNÉ
   *
   * "Tout" est sélectionné par défaut.
   * Une seule catégorie peut être sélectionnée à la fois.
   * =========================================================
   */
  public selectedFilter: string = 'all';


  constructor(
    private dialogRef: MatDialogRef<HistoriqueComponent>
  ) {}


  /*
   * =========================================================
   * HISTORIQUE - SÉLECTION D'UN FILTRE
   * =========================================================
   */
  public selectHistoriqueFilter(filter: string): void {
    this.selectedFilter = filter;
  }


  public onBack(): void {
    this.dialogRef.close();
  }


  public onReset(): void {
    /*
     * HISTORIQUE
     * La logique de réinitialisation sera ajoutée
     * lorsque les champs de la fiche seront créés.
     */
  }


  public onSave(): void {
    /*
     * HISTORIQUE
     * La logique d'enregistrement sera ajoutée
     * lorsque les champs de la fiche seront créés.
     */
  }

}