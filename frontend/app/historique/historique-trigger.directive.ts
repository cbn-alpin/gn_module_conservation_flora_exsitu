import {
  Directive,
  HostListener,
  Input
} from '@angular/core';

import {
  HistoriqueService
} from './historique.service';


@Directive({
  selector: '[appHistoriqueTrigger]'
})
export class HistoriqueTriggerDirective {

  /*
   * =========================================================
   * HISTORIQUE - FILTRE D'OUVERTURE
   *
   * Chaque bouton Historique indique la rubrique
   * qui doit être sélectionnée à l'ouverture.
   *
   * Si aucune rubrique n'est fournie, "Tout"
   * reste la valeur par défaut.
   * =========================================================
   */
  @Input()
  public appHistoriqueTrigger: string = 'all';


  constructor(
    private historiqueService: HistoriqueService
  ) {}


  @HostListener('click')
  public openHistorique(): void {

    /*
     * HISTORIQUE
     * Tous les boutons ouvrent la même fiche Historique,
     * mais avec leur propre rubrique sélectionnée.
     */
    this.historiqueService.openHistorique(
      this.appHistoriqueTrigger || 'all'
    );

  }

}