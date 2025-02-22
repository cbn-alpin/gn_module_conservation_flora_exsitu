import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, tap, skip, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { DataService } from '../../services/data.service';


@Injectable()
export class ExsituFormService{
    currentTab: string = 'harvest';
    idHarvest: number = null
    mode:string = 'add'
    harvest: any
    public exsituData: BehaviorSubject<any> = new BehaviorSubject(null);
    public id_harvest: BehaviorSubject<number> = new BehaviorSubject(null);
    public idMaterial: number;
    public editionModeMaterial: BehaviorSubject<boolean> = new BehaviorSubject(false); // boolean to check if its editionMode


    constructor(
        private dataService: DataService
    ){
        //observation de l'URL et recuperation du material si édition id !== null
    this.id_harvest
        .pipe(
        skip(1), // skip initilization value (null)
        tap((id) => {
            if (id == null) {
            this.editionModeMaterial.next(false);
            } else {
            this.editionModeMaterial.next(true);
            }
        }), //reinitialisation du mode edition à faux
        filter((id) => id !== null),
        distinctUntilChanged(),
        switchMap((id) => this.dataService.getHarvestById(id))
        )
        .subscribe(
        (data) => {          
            this.exsituData.next(data);
            this.harvest = data
            if (data.harvest_materials.id_material) {
                this.idMaterial = data.harvest_materials.id_material;
            }
        },
        (error) => {
            console.log('observation de lURL et recuperation du material', error);
            // this._commonService.translateToaster('error', 'Releve.DoesNotExist');
            // this._router.navigate(['occtax/form']);
        }
        );
    }

    addOccurrenceData(occurrence): void {
        let occtaxData = this.exsituData.getValue();
    
        if (!occtaxData.harvest_materials) {
          occtaxData.harvest_materials = [];
        }
        occtaxData.harvest_materials.push(occurrence);
        this.exsituData.next(occtaxData);
    }

    removeOccurrenceData(id_occurrence): void {
        let occtaxData = this.exsituData.getValue();
        if (occtaxData.harvest_materials) {
          for (let i = 0; i < occtaxData.harvest_materials.length; i++) {
            if (
                occtaxData.harvest_materials[i].id_material ===
              id_occurrence
            ) {
                occtaxData.harvest_materials.splice(i, 1);
              break;
            }
          }
        }
        this.exsituData.next(occtaxData);
      }
    
      replaceOccurrenceData(occurrence): void {
        this.removeOccurrenceData(occurrence.id_occurrence_occtax);
        this.addOccurrenceData(occurrence);
      }
    
      replaceExsituData(releve): void {
        let occtaxData = this.exsituData.getValue();
        occtaxData.releve = releve;
        this.exsituData.next(occtaxData);
      }

}