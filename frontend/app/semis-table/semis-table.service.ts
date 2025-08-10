import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from '../services/config.service';
import { Observable, of, } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';

import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SemisTableService {
  private moduleBaseUrl: string;
  sowings:any;
  dataSource = new MatTableDataSource<any>();
  private sowingsSubject = new BehaviorSubject<any[]>([]);
  public sowings$ = this.sowingsSubject.asObservable(); // Observable exposé
  constructor(
    private api: HttpClient, 
    private cfg: ConfigService,) {
    this.moduleBaseUrl = this.cfg.getModuleBackendUrl();
  }


  getSowingsByMaterial(id_material: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/materials/${id_material}/sowings`);
  }
  loadSowings(id: any){
    this.getSowingsByMaterial(id).subscribe({
      next: (sowings) => {
        console.log('Liste des semis :', sowings);
        this.sowingsSubject.next(sowings); // ✅ met à jour l'observable
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des semis :', err);
      }
    });
  }

  

}