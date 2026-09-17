import {
  Directive,
  HostListener
} from '@angular/core';

import {
  HistoriqueService
} from './historique.service';


@Directive({
  selector: '[appHistoriqueTrigger]'
})
export class HistoriqueTriggerDirective {

  constructor(
    private historiqueService: HistoriqueService
  ) {}


  @HostListener('click')
  public openHistorique(): void {

    /*
     * HISTORIQUE
     * Tous les boutons possédant
     * appHistoriqueTrigger ouvrent exactement
     * la même fiche Historique.
     */
    this.historiqueService.openHistorique();

  }

}