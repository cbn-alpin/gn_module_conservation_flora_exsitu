import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DataService } from '../services/data.service';

@Injectable()
export class CultureService {

  constructor(private dataService: DataService) {}

  // Ajouter une culture
  addCulture(
    idMaterial: number,
    cultureData: any
  ): Observable<any> {
    return this.dataService.addCulture(
      idMaterial,
      cultureData
    );
  }

  // Mettre à jour une culture
  updateCulture(
    idMaterial: number,
    idCulture: number,
    cultureData: any
  ): Observable<any> {
    return this.dataService.updateCulture(
      idMaterial,
      idCulture,
      cultureData
    );
  }

  // Récupérer les cultures associées à un matériel
  getCulturesByMaterial(
    idMaterial: number
  ): Observable<any[]> {
    return this.dataService.getCulturesByMaterial(
      idMaterial
    );
  }

  getCultureById(
    idCulture: number
  ): Observable<any> {
    return this.dataService.getCultureById(
      idCulture
    );
  }

  getCultureActions(
    idCulture: number
  ): Observable<any[]> {

    return this.dataService.getCultureActions(
      idCulture
    );
  }

  createCultureTransplantation(
    idCulture: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .createCultureTransplantation(
        idCulture,
        data
      );
  }

  getCultureTransplantation(
    idAction: number
  ): Observable<any> {

    return this.dataService
      .getCultureTransplantation(
        idAction
      );
  }


  updateCultureTransplantation(
    idAction: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .updateCultureTransplantation(
        idAction,
        data
      );
  }
}
