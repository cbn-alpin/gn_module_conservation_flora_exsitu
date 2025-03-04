import { Component, OnInit, ViewChild } from '@angular/core';
import 'Leaflet.Deflate';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { HarvestStoreService } from '../services/store.service';
import { DataService } from '../services/data.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { HttpParams } from '@angular/common/http';
import { ObserversService } from '../services/observers.service';


@Component({
  selector: 'gn-cs-root',
  templateUrl: './harvest-map-list.component.html',
  styleUrls: ['./harvest-map-list.component.css'],
})
export class HarvestMapListComponent implements OnInit {
  filterForm: FormGroup;
  harvests: any[] = [];
  @ViewChild('dataTable') dataTable: DatatableComponent;
  public isCollapseSyntheseNavBar = false;
  public searchBarHidden = false;
  public marginButton: number;
  public center;
  public zoom;
  public geojson:any;
  public nbMats: number;
  public totalPages: number = 0;
  rowPerPage: number;
  filters: any = {}; 
  geometryMap = new Map<string, any>();


  constructor(
    public router: Router,
    private dateParser: NgbDateParserFormatter,
    private formBuilder: FormBuilder,
    public storeService: HarvestStoreService,
    public api: DataService,
    public mapListService: MapListService,
    private observersService: ObserversService
  ) {}

  ngOnInit() { 
    this.calculateNbRow() 
    this.initializeZpForm();
    this.zoom = this.storeService.cfeConfig.zoom
    this.center = this.storeService.cfeConfig.zoom_center
    this.loadData()
  }

  calculateNbRow() {
    let wH = window.innerHeight;
    let listHeight = wH - 264;
    this.rowPerPage = Math.round(listHeight / 40);   
  }

  onRowSelect(event) {
    const selectedHarvest = event.selected[0];
    this.mapListService.selectedRow = [selectedHarvest];
  }

  onChangePage(event) {
    this.mapListService.page.pageNumber = event.offset;
    this.loadData();
  }

  onMapClick(harvest: any) {
    this.mapListService.selectedRow = [harvest]; // Sélectionne la ligne correspondante
    
  }

  onEachFeature(feature, layer) {
    layer.on('click', () => {
      this.onMapClick(feature.properties);
    });
  }

  loadData(){
    let params = new HttpParams()
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
        this.geojson = data['items'];    
        console.log(params);
                  
    
        if (this.geojson && 'features' in this.geojson && Array.isArray((this.geojson as any).features)) {
          this.geojson.features.forEach((feature) => {
            if (feature.properties && feature.properties.observateurs) {
              // const formatted = this.formatObservateurs(feature.properties.observateurs);
              // feature.properties.observateursDisplay = formatted.display;
              // feature.properties.observateursTooltip = formatted.tooltip;

              const observerService = new ObserversService();
              observerService.addObservers(feature.properties.observateurs);
              feature.properties.observateursDisplay = observerService.getObserversAbbr();
              feature.properties.observateursTooltip = observerService.getObserversFull();
            }
            if (feature.properties && feature.geometry) {
              this.geometryMap.set(feature.properties.code_material, feature.geometry);
            }
          });
        }

        if(data['items']['features']){          
          this.mapListService.loadTableData(data['items']);
          this.harvests = this.mapListService.tableData;          
          this.totalPages = data['total_pages'];
        }        
      }
    });

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

  private initializeZpForm() {
    this.filterForm = this.formBuilder.group({
      cd_nom: null,
      cd_hab: null,
      date_start: null,
      date_end: null,
      observers: []
    });
  }

  onAddHarvest() {
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/form/harvest`]);
  }

  mooveButton() {
    this.searchBarHidden = !this.searchBarHidden;
  }


  toggleExpandRow(row: any): void {    
    this.dataTable.rowDetail.toggleExpandRow(row);
  }

  onFiltersChanged(newFilters: any) {
    this.filters = newFilters;
    this.loadData();
  }
  
}