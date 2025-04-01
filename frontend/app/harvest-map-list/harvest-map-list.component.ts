import { Component, OnInit, ViewChild, Input, AfterViewInit, ElementRef, HostListener  } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { HarvestStoreService } from '../services/store.service';
import { DataService } from '../services/data.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { HttpParams } from '@angular/common/http';
import { ObserversService } from '../services/observers.service';
import * as L from 'leaflet';
import 'Leaflet.Deflate';
import { MapService } from '@geonature_common/map/map.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { ConfigService } from '../services/config.service';


@Component({
  selector: 'gn-cs-root',
  templateUrl: './harvest-map-list.component.html',
  styleUrls: ['./harvest-map-list.component.css'],
})
export class HarvestMapListComponent implements OnInit, AfterViewInit {
  filterForm: FormGroup;
  harvests: any[] = [];
  dataSource = new MatTableDataSource<any>();  
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
  displayedColumns: string[] = [
    'code_material',
    'taxons',            
    'departement',
    'commune',                
    'date_start',      
    'observateurs',       
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
  highlightedRowId: number | null = null; 
  highlightedRowIndex: number | null = null; 
  private previousLayer: L.Layer | null = null;
  highlightedRowIds: Set<number> = new Set<number>();
  onClickMap: boolean = false;


  constructor(
    public router: Router,
    public storeService: HarvestStoreService,
    public api: DataService,
    public mapListService: MapListService,
    private _ms: MapService,
    private dialogService: DialogService,
    public cfg: ConfigService
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
      const harvest_ids = data.properties.harvest_ids;      
      if (harvest_ids && harvest_ids.length > 0) {
        this.highlightedRowIndex = null
        this.onMapClick(harvest_ids);
      }
    });

    // if (data.geometry.type === 'Polygon') {
    //   layer.setStyle({
    //     color: 'blue',
    //     weight: 2,
    //     fillColor: 'blue',
    //     fillOpacity: 0.5
    //   });
    // } else if (data.geometry.type === 'Point') {
    //   layer.setStyle({
    //     radius: 8,
    //     fillColor: 'green',
    //     color: 'blue',
    //     weight: 2
    //   });
    // }
  
    // layer.bindPopup(`ID: ${data.properties.id_harvest}`);
  }

  onMapClick(harvest_ids: number[]) {   
    this.onClickMap = true
     
    this.highlightedRowIds = new Set(harvest_ids);
    this.filters['selected_ids'] = harvest_ids;
    this.loadData();

    // const index = this.dataSource.data.findIndex((item: any) => item.id_harvest === id);
  
    // if (index >= 0) {
    //   const data = this.dataSource.data;
    //   const selectedItem = data.splice(index, 1)[0];
    //   this.dataSource.data = [selectedItem].concat(data);
    //   this.paginator.firstPage();
    // }
 }

 highlightRow(id_harvest: number, rowIndex: number) {  
    this.highlightedRowIds = new Set<number>();

    this.highlightedRowId = id_harvest;
    this.highlightedRowIndex = rowIndex; 
    const clickedFeature = this.geojson.features.find((item: any) => 
      item.properties.harvest_ids.includes(id_harvest)
    );
    if (clickedFeature) {
        const geometry = clickedFeature.geometry;
        
        if (this.previousLayer && this._ms.map) {
            this._ms.map.removeLayer(this.previousLayer);
        }

        this.previousLayer = this.highlightFeature(clickedFeature);

        this.centerMapOnGeometry(geometry);
    } else {
        console.warn("Aucune géométrie trouvée pour cet id_harvest :", id_harvest);
    }
  }
  


  centerMapOnGeometry(geometry: any) {
      if (!geometry) return;

      const map = this._ms.map;
      if (!map) return;

      const coordinates = geometry.coordinates;

      if (geometry.type === 'Point') {
          const latLng: L.LatLngExpression = [coordinates[1], coordinates[0]];
          map.setView(latLng, 15); 
      } 
      else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
          const bounds = this.getPolygonBounds(geometry);
          map.fitBounds(bounds);
      }
  }

  highlightFeature(feature: any): L.Layer | null {
    const map = this._ms.map;
    if (!map) return null;

    if (feature.geometry.type === 'Point') {
        const latLng: L.LatLngExpression = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        
        const marker = L.circleMarker(latLng, {
            radius: 8,
            color: 'yellow',
            fillColor: 'yellow',
            fillOpacity: 0.8
        }).addTo(map);

        return marker;

    } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const latLngs = this.getPolygonCoordinates(feature.geometry);

        const polygon = L.polygon(latLngs, {
            color: 'yellow',
            fillColor: 'yellow',
            fillOpacity: 0.3,
        }).addTo(map);

        return polygon;
    }
    
    return null;
  }



  getPolygonCoordinates(geometry: any): L.LatLngExpression[] {
    if (geometry.type === 'Polygon') {
        return geometry.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
    } else if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates[0][0].map((coord: any) => [coord[1], coord[0]]);
    }
    return [];
  }


  
  // Méthode pour calculer les limites d'un polygone
  getPolygonBounds(geometry: any): L.LatLngBounds {
      const coordinates = geometry.type === 'Polygon' 
          ? geometry.coordinates[0] 
          : geometry.coordinates.flat(1);

      const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
      return L.latLngBounds(latLngs);
  }

  onPaginateChange() {
    this.filters['selected_ids'] = null;
    this.loadData();
  }
  
  loadData() {
    const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
    const pageSize = this.paginator ? this.paginator.pageSize : 10;
    let params = this.prepareParams()
      .set('page', pageIndex) 
      .set('limit', pageSize);
  
    this.api.getHarvestAll(params).subscribe({
      next: (data) => {
        this.nbMats = data['total'];
        const harvestItems = data['items'];
        this.totalPages = data['total_pages'];
  
        const transformedItems = harvestItems.map(item => {
          const observerService = new ObserversService();
          observerService.addObservers(item.observateurs);
          const taxonResult = this.transformTaxons(item.taxons?.split(', ') || []);
  
          return {
            ...item,
            observateursDisplay: observerService.getObserversAbbr(),
            observateursTooltip: observerService.getObserversFull(),
            taxonsDisplay: taxonResult.taxonsDisplay,
            taxonsTooltip: taxonResult.taxonsTooltip,
          };
        });
  
        this.dataSource.data = transformedItems;   
        if(!this.onClickMap) 
          this.loadGeometries();
        if (this.paginator) {
          this.paginator.pageIndex = pageIndex - 1;
          this.paginator.length = this.nbMats;
        }
      },
      error: (err) => console.error(err)
    });
  }

  deleteHarvest(id_harvest){
    this.dialogService
        .confirmDialog({ message: 'Étes vous certain de vouloir supprimer cette récolte ?' })
        .subscribe((yes) => {
          if (yes) {
            this.api.deleteHarvest(id_harvest).subscribe({
              next: ()=>{
                this.loadData()
              },error: (err)=>{
                console.log(err);
              }
            })
          }
    });
    
  }
  

  loadGeometries() {
    let params = this.prepareParams();    
    this.api.getHarvestGeometries(params).subscribe({
        next: (data) => {                    
            this.geojson = data['items'];
            setTimeout(() => {
                this.applyDeflateAndClustering();
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

  onAddHarvest() {
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/form/harvest`]);
  }

  onEdit(id_harvest: number) {
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/form/harvest`, id_harvest]);
  }

  mooveButton() {
    this.searchBarHidden = !this.searchBarHidden;
  }

  onFiltersChanged(newFilters: any) {
    this.filters = newFilters;
    this.loadData();
  }


  private applyDeflateAndClustering(): void {
    L.Polygon.addInitHook(function() {
        if (this.getBounds().isValid()) {
            this._latlng = this.getBounds().getCenter();
        }
    });
    
    L.Polygon.include({
        getLatLng: function() {
            return this._latlng;
        },
        setLatLng: function() {}
    });
    const map = this._ms.map;
    if (!map) {
        return;
    }

    // const deflateLayer = L.deflate({ minSize: 50 }).addTo(map);
    this.markerClusterGroup.clearLayers();

    const geoJsonLayer = L.geoJSON(this.geojson, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 0,
                opacity: 0,
            });
        },
        onEachFeature: (feature, layer) => {
            if (feature.geometry.type === "Point") {
                this.markerClusterGroup.addLayer(layer);
            } 
            else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                const polygonLayer = layer as L.Polygon;
                this.markerClusterGroup.addLayer(polygonLayer);
                // On ajoute le polygone au groupe de déflation
                // deflateLayer.addLayer(polygonLayer);

                // Vérifie si le polygone est valide et calcule son centre
                // if (polygonLayer.getBounds && polygonLayer.getBounds().isValid()) {
                    // const center = polygonLayer.getBounds().getCenter();

                    // Ajout d'un marqueur au centre du polygone pour participer au clustering
                    // const marker = L.marker(center);
                    // this.markerClusterGroup.addLayer(polygonLayer);
                // }
            }
        }
    });

    map.addLayer(this.markerClusterGroup);
  }

  transformTaxons(taxons: string[]): { taxonsDisplay: string, taxonsTooltip: string } {
    const MAX_NAMES = 1;
  
    if (!taxons || taxons.length === 0) {
      return {
        taxonsDisplay: '',
        taxonsTooltip: ''
      };
    }
  
    const uniqueTaxons = Array.from(new Set(taxons));
  
    const taxonsTooltip = uniqueTaxons.join(', ').replace(/, ([^,]+)$/, ' & $1') + '.';
    let taxonsDisplay = uniqueTaxons.join(', ');
  
    if (uniqueTaxons.length > MAX_NAMES) {
      const firstTaxon = uniqueTaxons.slice(0, MAX_NAMES);
      taxonsDisplay = `${firstTaxon} (+${uniqueTaxons.length - MAX_NAMES})`;
    }
  
    return {
      taxonsDisplay,
      taxonsTooltip
    };
  }


  ngAfterViewInit() {
    Promise.resolve(null).then(() => this.recalculateDataTableSize());
  }
  
}