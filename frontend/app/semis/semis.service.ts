import { Injectable } from '@angular/core';
import { DataService } from '../services/data.service';
import { Observable } from 'rxjs';

@Injectable()
export class SemisService {

  constructor(private dataService: DataService) {}

  // Ajouter un semis
  addSowing(idMaterial: number, actionData: any): Observable<any> {
    return this.dataService.addSowing(idMaterial, actionData);
  }

  // Mettre à jour un semis
  updateSowing(idMaterial: number, idSowing: number, actionData: any): Observable<any> {
    return this.dataService.updateSowing(idMaterial, idSowing, actionData);
  }

  // Récupérer les semis associés à un matériel
  getSowingsByMaterial(idMaterial: number): Observable<any[]> {
    return this.dataService.getSowingsByMaterial(idMaterial);
  }
}
