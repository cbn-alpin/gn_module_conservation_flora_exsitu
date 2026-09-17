import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss']
})
export class HistoriqueComponent {

  constructor(
    private dialogRef: MatDialogRef<HistoriqueComponent>
  ) {}


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