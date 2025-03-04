import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HarvestMapService  {
    private showMapSubject = new BehaviorSubject<boolean>(false);
    showMap$ = this.showMapSubject.asObservable(); 
    private _currentGeoJsonFileLayerSubject = new BehaviorSubject<any>(null);
    public currentGeoJsonFileLayer$ = this._currentGeoJsonFileLayerSubject.asObservable();

  // Méthode pour mettre à jour le GeoJSON
    updateGeoJsonFileLayer(geoJson: any) {
        this._currentGeoJsonFileLayerSubject.next(geoJson);
    }

    setShowMap(value: boolean) {
        this.showMapSubject.next(value);
    }

    getShowMap() {
        return this.showMapSubject.value;
    }
}
    