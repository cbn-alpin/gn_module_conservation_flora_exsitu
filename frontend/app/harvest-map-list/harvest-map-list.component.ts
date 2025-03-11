import { Component, OnInit, ViewChild, Input, AfterViewInit, ElementRef, HostListener  } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { HarvestStoreService } from '../services/store.service';
import { DataService } from '../services/data.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { HttpParams } from '@angular/common/http';
import { ObserversService } from '../services/observers.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { MapService } from '@geonature_common/map/map.service';
import { Subject } from 'rxjs';
import { CommonService } from '@geonature_common/service/common.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'gn-cs-root',
  templateUrl: './harvest-map-list.component.html',
  styleUrls: ['./harvest-map-list.component.css'],
})
export class HarvestMapListComponent implements OnInit, AfterViewInit {
  filterForm: FormGroup;
  harvests: any[] = [];
  @ViewChild('dataTable') dataTable: DatatableComponent;
  dataSource = new MatTableDataSource<any>();  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
  displayedColumns: string[] = [
    'code_material',
    'taxon',            
    'departement',
    'commune',                
    'observateurs',
    'date_start',             
    'actions'
  ];
  
  

  public isCollapseSyntheseNavBar = false;
  public searchBarHidden = false;
  public center;
  public zoom;
  public geojson:any;
  public nbMats: number;
  public totalPages: number = 0;
  rowPerPage: number;
  filters: any = {}; 
  private markerClusterGroup = L.markerClusterGroup(); // Création du groupe de clusters
  dataTableHeight: number;
  highlightedRowId: number | null = null; // Ajoutez cette ligne en haut de votre composant


  constructor(
    public router: Router,
    public storeService: HarvestStoreService,
    public api: DataService,
    public mapListService: MapListService,
    private _ms: MapService,
  ) {}

  ngOnInit() { 
    this.calculateNbRow() 
    this.zoom = this.storeService.cfeConfig.zoom
    this.center = this.storeService.cfeConfig.zoom_center
    this.loadData();
  }  


  @HostListener("window:resize", ["$event"])
  onWindowResize(event) {
    this.calculateDataTableHeight();
  }

  private recalculateDataTableSize(): void {
    if (this.dataTableHeight == undefined) {
      this.calculateDataTableHeight();
    }
  }

  private calculateDataTableHeight(): void {
    const screenHeight: number = document.documentElement.clientHeight;
    if (this.dataTableContainer != undefined) {
      const dataTableTop =
        this.dataTableContainer.nativeElement.getBoundingClientRect().top;        
      const dataTableHeight = screenHeight - dataTableTop - 15;
      this.dataTableHeight = dataTableHeight;
    }
  }

  calculateNbRow() {
    let wH = window.innerHeight;
    let listHeight = wH - 264;
    this.rowPerPage = Math.round(listHeight / 40);   
  }

  zoomToHarvest(harvest: any) {
    if (harvest && harvest.geom) {
      this.center = [harvest.geom.coordinates[1], harvest.geom.coordinates[0]]; // [lat, lng]
      this.zoom = 15;
    }
  }
  

  onEachFeature(data, layer) {
    layer.on('click', () => {
      this.onMapClick(data.id);
    });

    if (data.geometry.type === 'Polygon') {
      layer.setStyle({
        color: 'blue',
        weight: 2,
        fillColor: 'blue',
        fillOpacity: 0.5
      });
    } else if (data.geometry.type === 'Point') {
      layer.setStyle({
        radius: 8,
        fillColor: 'green',
        color: 'red',
        weight: 2
      });
    }
  
    layer.bindPopup(`ID: ${data.properties.id_harvest}`);
  }

  onMapClick(id: number) {    
    this.highlightedRowId = id;

    const index = this.dataSource.data.findIndex((item: any) => item.id_harvest === id);
  
    if (index >= 0) {
      const data = this.dataSource.data;
      const selectedItem = data.splice(index, 1)[0];
      this.dataSource.data = [selectedItem].concat(data);
      this.paginator.firstPage();
    }
 }

  highlightRow(id_harvest: number) {
    this.highlightedRowId = id_harvest;

    const clickedFeature = this.geojson.features.find((item: any) => item.properties.id_harvest === id_harvest);
    
    if (clickedFeature) {
        const geometry = clickedFeature.geometry;
        
        this.centerMapOnGeometry(geometry);
    } else {
        console.warn("Aucune géométrie trouvée pour cet id_harvest :", id_harvest);
    }
  }


  centerMapOnGeometry(geometry: any) {
    if (!geometry) return;
  
    const coordinates = geometry.coordinates;
  
    if (geometry.type === 'Point') {
      console.log('un point');
      
      this.center = [coordinates[1], coordinates[0]];
      console.log(this.center);
      
      this.zoom = 12; 
    }
    else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      const bounds = this.getPolygonBounds(geometry);
      this.zoomToBounds(bounds);
    }
  }
  
  // Méthode pour calculer les limites d'un polygone
  getPolygonBounds(geometry: any): any {
    const coordinates = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates.flat(1);
    const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
    return latLngs;
  }
  
  zoomToBounds(bounds: any) {
    
  }
  


  loadData() {
    let params = this.prepareParams()
      .set('page', this.mapListService.page.pageNumber + 1)
      .set('limit', this.rowPerPage);
  
    // La création des params du filtre
    Object.keys(this.filters).forEach(key => {
      if (this.filters[key]) {
        if (Array.isArray(this.filters[key])) {
          this.filters[key].forEach(value => {
            params = params.append(key, value.toString());
          });
        } else {
          params = params.set(key, this.filters[key].toString());
        }
      }
    });
  
    this.api.getHarvestAll(params).subscribe({
      next: (data) => {
        this.nbMats = data['total'];
        const harvestItems = data['items'];
  
        // On transforme les données pour ajouter les colonnes manquantes
        const transformedItems = harvestItems.map(item => {
          const observerService = new ObserversService();
          observerService.addObservers(item.observateurs);
          
          return {
            ...item,
            observateursDisplay: observerService.getObserversAbbr(),
            observateursTooltip: observerService.getObserversFull(),
          };
        });
  
        this.dataSource = new MatTableDataSource(transformedItems);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadGeometries()
      },
      error: (err) => console.error(err)
    });
  }
  

  loadGeometries() {
    let params = this.prepareParams();    
    this.api.getHarvestGeometries(params).subscribe({
        next: (data) => {
            this.geojson = data['items'];
            setTimeout(() => {
                this.applyDeflateAndClustering(); // Appliquer la logique sur la carte
            }, 100);
        }
    });
  }

  prepareParams() {
    let params = new HttpParams();

    Object.keys(this.filters).forEach(key => {
        if (this.filters[key]) {
            if (Array.isArray(this.filters[key])) {
                this.filters[key].forEach(value => {
                    params = params.append(key, value.toString());
                });
            } else {
                params = params.set(key, this.filters[key].toString());
            }
        }
    });

    return params;
  }

  formatObservateurs(observateurs: string): { display: string; tooltip: string } {
    const obsArray = observateurs.split(', ').map(obs => obs.trim());
  
    if (obsArray.length === 1) {
      return { display: obsArray[0], tooltip: obsArray[0] };
    }
  
    const principal = obsArray[0]; // Le premier observateur
    const rest = obsArray.slice(1).join(', '); // Les autres observateurs
    const count = obsArray.length - 1; // Nombre d'observateurs restants
  
    return { display: `${principal} +${count}`, tooltip: rest };
  }

  onAddHarvest() {
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/form/harvest`]);
  }

  go() {
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/test`]);
  }

  mooveButton() {
    this.searchBarHidden = !this.searchBarHidden;
  }

  onFiltersChanged(newFilters: any) {
    this.filters = newFilters;
    this.loadData();
  }


  private applyDeflateAndClustering(): void {
      const map = this._ms.map;
      if (!map) {
        return;
      }
      const deflateLayer = L.deflate({ minSize: 50 }).addTo(map);
      this.markerClusterGroup.clearLayers(); // Nettoie les anciens clusters
      map.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON) {  
          layer.eachLayer((featureLayer) => {
            const feature = featureLayer['feature'];
  
            if (feature.geometry.type === "Point") {
              // Si c'est un point, on l'ajoute au clustering
              const coords = feature.geometry.coordinates;
              const marker = L.marker([coords[1], coords[0]]);
              this.markerClusterGroup.addLayer(marker); // Ajoute au groupe de clusters
            } else {
              // Si ce n'est pas un point, on l'ajoute au deflate layer
              deflateLayer.addLayer(featureLayer);
              this.markerClusterGroup.addLayer(featureLayer);
            }
          });
        }
      });
  
      map.addLayer(this.markerClusterGroup); // Ajoute le groupe de clusters à la carte
  }


  ngAfterViewInit() {
    Promise.resolve(null).then(() => this.recalculateDataTableSize());
  }
  
}