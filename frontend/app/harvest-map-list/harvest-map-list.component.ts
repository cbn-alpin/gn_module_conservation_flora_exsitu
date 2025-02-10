import { Component, OnInit, ViewChild } from '@angular/core';
import 'Leaflet.Deflate';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { HarvestStoreService } from '../services/store.service';
import { DataService } from '../services/data.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'gn-cs-root',
  templateUrl: './harvest-map-list.component.html',
  styleUrls: ['./harvest-map-list.component.css'],
})
export class HarvestMapListComponent implements OnInit {
  filterForm: FormGroup;
  harvestList: any[] = [];
  @ViewChild('dataTable') dataTable: DatatableComponent;


  constructor(
    public router: Router,
    private dateParser: NgbDateParserFormatter,
    private formBuilder: FormBuilder,
    public storeService: HarvestStoreService,
    public api: DataService,
    public mapListService: MapListService,
  ) {}

  ngOnInit() {
    this.initializeZpForm();
    this.getAllHarvests();
  }

  formatter(item) {
    return item.search_name;
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
    this.router.navigate([`${this.storeService.config['CONSERVATION_FLORA_EXSITU']['MODULE_URL']}/harvest`]);
  }

  getAllHarvests(){
    this.api.getAllHarvest().subscribe({
      next: (data)=>{
        console.log(data);
        this.harvestList = data;
      },error: (err)=>{
        console.log(err);
      }
    })
  }

  toggleExpandRow(row: any): void {    
    this.dataTable.rowDetail.toggleExpandRow(row);
  }
  
}