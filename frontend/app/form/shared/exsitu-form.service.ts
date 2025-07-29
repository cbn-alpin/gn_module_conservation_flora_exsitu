import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { filter, tap, skip, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';


@Injectable()
export class ExsituFormService{
    currentTab: string = 'harvest';
    idHarvest: number = null
    mode:string = 'add'
    harvest: any
    materials: any
    idMaterialChange = new BehaviorSubject<number>(null);
    public exsituData: BehaviorSubject<any> = new BehaviorSubject(null);
    public materials$: BehaviorSubject<any> = new BehaviorSubject(null);
    public id_harvest: BehaviorSubject<number> = new BehaviorSubject(null);
    public idMaterial: number;
    public idSeed: number;
    public idTest: number;
    public idTestChange = new BehaviorSubject<number>(null);
    public idStorage: number | null = null;
    public id_storage: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null);
    
    public editionMode: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public params = new HttpParams()
              .set('page', 1)
              .set('limit', 10);

    constructor(
        private dataService: DataService
    ){
        //observation de l'URL et recuperation de la récolte et du material si édition id !== null
        this.id_harvest.pipe(
          skip(1),
          tap((id) => {
            if (id == null) {
              this.editionMode.next(false);
            } else {
              this.editionMode.next(true);
            }
          }),
          filter((id) => id !== null),
          distinctUntilChanged(),
          switchMap((id) => 
            forkJoin({
              harvest: this.dataService.getHarvestById(id),
              materials: this.dataService.getMaterialsByHarvest(id, this.params)
            })
          )
        )
        .subscribe(
          ({ harvest, materials }) => {
            this.exsituData.next(harvest);
            this.harvest = harvest;
            this.materials$.next(materials['materials']);
            this.materials = materials['materials']
          },
          (error) => {
            console.log('Erreur lors de la récupération de la récolte et des matériels', error);
          }
        );
        
      
    }

    setIdMaterial(id: number) {
      this.idMaterial = id;
      this.idMaterialChange.next(id);
    }

    addOccurrenceData(occurrence): void {
        let materials = this.materials$.getValue();
    
        if (!materials) {
          materials = [];
        }
  
        materials.push(occurrence);
        this.materials$.next(materials);        
    }

    removeOccurrenceData(id_occurrence): void {
      let materials = this.materials$.getValue();
  
      if (materials) {
          materials = materials.filter(material => material.id_material !== id_occurrence);
          this.materials$.next(materials);
      }
    }
    
      replaceOccurrenceData(occurrence): void {
        this.removeOccurrenceData(occurrence.id_material);
        this.addOccurrenceData(occurrence);
      }
      setIdTest(id: number): void {
        this.idTest = id;
        this.idTestChange.next(id);
      }
      
    

}