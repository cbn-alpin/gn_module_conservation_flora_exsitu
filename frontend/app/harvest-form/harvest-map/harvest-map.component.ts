import { Component, OnInit, OnDestroy } from '@angular/core';
import { leafletDrawOption } from '@geonature_common/map/leaflet-draw.options';
import { HarvestStoreService } from '../../services/store.service';
import { HarvestFormService } from '../harvest-form.service';
import { HarvestMapService } from './harvest-map.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'ex-harvest-map',
  templateUrl: './harvest-map.component.html',
  styleUrls: ['./harvest-map.component.css'],
})
export class HarvestMapComponent implements OnInit, OnDestroy {
    public currentGeoJsonFileLayer;
    public leafletDrawOptions = leafletDrawOption;
    public MAP_FULL_HEIGHT = '86vh';
    public mapHeight = this.MAP_FULL_HEIGHT;
    public markerCoordinates;
    public center;
    public zoom;
    showMap
    private geoJsonSubscription: Subscription;

    constructor(
        public storeService: HarvestStoreService,
        public harvertFormService: HarvestFormService,
        private mapStateService: HarvestMapService
        
    ){

    }

    ngOnInit(): void {
        this.showMap = this.harvertFormService.showMapField
        this.initializeLeafletDrawOptions();
        this.zoom = this.storeService.cfeConfig.zoom
        this.center = this.storeService.cfeConfig.zoom_center  
        this.mapStateService.updateGeoJsonFileLayer(null);
        //Subs pour savoir s'il faut activer la carte ou pas 
        this.mapStateService.showMap$.subscribe(showMap => {
            this.showMap = showMap;
        });
        //Subs pour récupérer les geom de la donnée si c'est une modification
        this.geoJsonSubscription = this.mapStateService.currentGeoJsonFileLayer$.subscribe(
            geoJson => {
                if(geoJson){
                    this.currentGeoJsonFileLayer = geoJson;
                }
            }
        );     
    }

    private initializeLeafletDrawOptions() {
        this.leafletDrawOptions.draw.rectangle = false;
        this.leafletDrawOptions.draw.marker = false;
        this.leafletDrawOptions.draw.circle = false;
        this.leafletDrawOptions.draw.circlemarker = false;
        this.leafletDrawOptions.draw.polyline = false;
        this.leafletDrawOptions.edit.remove = true;
    }

    addGeoInfo(geojson) {
        this.harvertFormService.harvestForm.patchValue({ geom: geojson.geometry });        
        this.harvertFormService.harvestForm.markAsDirty();
    }
    
    deleteGeoInfo() {
        this.harvertFormService.harvestForm.patchValue({ geom: null });
        this.harvertFormService.harvestForm.markAsDirty();
    }

    ngOnDestroy(): void {
        if (this.geoJsonSubscription) {
          this.geoJsonSubscription.unsubscribe();
        }
    }

}


