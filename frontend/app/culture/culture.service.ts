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

  getSowingsByMaterial(
    idMaterial: number
  ): Observable<any[]> {

    return this.dataService
      .getSowingsByMaterial(
        idMaterial
      );
  }


  getTestsByMaterial(
    idMaterial: number
  ): Observable<any[]> {

    return this.dataService
      .getTestsByMaterial(
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

  createCultureObservation(
    idCulture: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .createCultureObservation(
        idCulture,
        data
      );
  }

  getCultureObservation(
    idAction: number
  ): Observable<any> {

    return this.dataService
      .getCultureObservation(
        idAction
      );
  }

  updateCultureObservation(
    idAction: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .updateCultureObservation(
        idAction,
        data
      );
  }

  createCultureTreatment(
    idCulture: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .createCultureTreatment(
        idCulture,
        data
      );
  }

  getCultureTreatment(
    idAction: number
  ): Observable<any> {

    return this.dataService
      .getCultureTreatment(
        idAction
      );
  }

  updateCultureTreatment(
    idAction: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .updateCultureTreatment(
        idAction,
        data
      );
  }

  createCultureSampling(
    idCulture: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .createCultureSampling(
        idCulture,
        data
      );
  }

  getCultureSampling(
    idAction: number
  ): Observable<any> {

    return this.dataService
      .getCultureSampling(
        idAction
      );
  }

  updateCultureSampling(
    idAction: number,
    data: any
  ): Observable<any> {

    return this.dataService
      .updateCultureSampling(
        idAction,
        data
      );
  }
}
