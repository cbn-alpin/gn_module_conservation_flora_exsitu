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

  // Récupérer les cultures d’un matériel
  getCulturesByMaterial(
    idMaterial: number
  ): Observable<any[]> {
    return this.api.get<any[]>(
      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures`
    );
  }

  // Charger et actualiser la liste des cultures
  loadCultures(idMaterial: number): void {
    this.getCulturesByMaterial(idMaterial).subscribe({
      next: (cultures) => {
        console.log('Liste des cultures :', cultures);

        this.culturesSubject.next(cultures || []);
      },

      error: (err) => {
        console.error(
          'Erreur lors de la récupération des cultures :',
          err
        );
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