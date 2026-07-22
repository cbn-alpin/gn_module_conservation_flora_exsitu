import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';

import { ConfigService } from '../services/config.service';

@Injectable()
export class CultureTableService {

  private moduleBaseUrl: string;

  cultures: any;

  dataSource = new MatTableDataSource<any>();

  private culturesSubject = new BehaviorSubject<any[]>([]);

  public cultures$ = this.culturesSubject.asObservable();

  constructor(
    private api: HttpClient,
    private cfg: ConfigService
  ) {
    this.moduleBaseUrl = this.cfg.getModuleBackendUrl();
  }

  // Cultures créées directement depuis le matériel
  getDirectCulturesByMaterial(
    idMaterial: number
  ): Observable<any[]> {

    return this.api.get<any[]>(

      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures?source_type=material`

    );
  }


  // Cultures associées à un Semis précis
  getCulturesBySowing(
    idMaterial: number,
    idSowing: number
  ): Observable<any[]> {

    return this.api.get<any[]>(

      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures?source_type=sowing&id_sowing=${idSowing}`

    );
  }


  // Charger la bonne liste selon le contexte Culture
  loadCultures(
    idMaterial: number,
    sourceType: 'material' | 'sowing' = 'material',
    idSowing: number | null = null
  ): void {

    let request$: Observable<any[]>;


    if (
      sourceType === 'sowing' &&
      idSowing
    ) {

      request$ =
        this.getCulturesBySowing(
          idMaterial,
          idSowing
        );

    } else {

      request$ =
        this.getDirectCulturesByMaterial(
          idMaterial
        );

    }


    request$.subscribe({

      next: (cultures) => {

        console.log(
          'Liste des cultures :',
          cultures
        );

        this.culturesSubject.next(
          cultures || []
        );

      },

      error: (err) => {

        console.error(
          'Erreur lors de la récupération des cultures :',
          err
        );

        this.culturesSubject.next([]);

      }

    });
  }

  // Supprimer une culture
  deleteCulture(
    idMaterial: number,
    idCulture: number
  ): Observable<any> {
    return this.api.delete<any>(
      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures/${idCulture}`
    );
  }
}