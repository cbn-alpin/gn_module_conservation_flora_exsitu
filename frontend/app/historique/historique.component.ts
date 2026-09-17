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


  /*
   * =========================================================
   * HISTORIQUE - TITRE DU BLOC HISTORIQUE
   *
   * Le titre change automatiquement en fonction
   * du filtre sélectionné.
   * =========================================================
   */
  public getHistoriqueTitle(): string {

    switch (this.selectedFilter) {

      case 'material':
        return 'Historique du Matériel récolté';

      case 'seed':
        return 'Historique de la Semence';

      case 'storage':
        return 'Historique du Stockage';

      case 'germination':
        return 'Historique du Test de germination';

      case 'sowing':
        return 'Historique du Semis';

      case 'viability':
        return 'Historique du Test de viabilité';

      case 'culture':
        return 'Historique de la Culture';

      case 'all':
      default:
        return 'Historique Totale';

    }

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