import { Component, OnInit, ViewChild, ElementRef, HostListener  } from '@angular/core';
import { MaterialListService } from './material-list.service';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { MaterialFormService } from '../material-form/material-form.service';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { TaxonModalComponent } from '../../components/modal-taxon/taxon-modal.component';
import { DialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
    selector: 'cs-material-list',
    templateUrl: './material-list.component.html',
    styleUrls: ['./material-list.component.css'],
})
export class MaterialListComponent implements OnInit {
    paginatedMaterials = [];
    itemsPerPage = 3;
    currentPage = 1;
    totalPages = 1;
    sortDirection = 1; // 1 = asc, -1 = desc
    materials: any[] = [];
    public totalMaterials: number;
    pagination = { offset: 0, limit: 10 };
    rowPerPage: number;

    isModalOpen = false;  // Pour afficher ou masquer la modale
    selectedMaterialId: number | null = null;
    taxonName: string = '';
    @ViewChild('dataTable') dataTable: DatatableComponent;
    dataSource = new MatTableDataSource<any>();  
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
    displayedColumns: string[] = [
      'code_material',        
      'harvest_material', 
      'taxons',     
      'actions'
    ];


    constructor(
        public materialListService: MaterialListService,
        public exsituFormService: ExsituFormService,
        private materialFormService: MaterialFormService,
        public dialog: MatDialog,
        private api: DataService,
        public mapListService: MapListService,
        private dialogService: DialogService
        
    ){

    }

    ngOnInit(): void {
        this.calculateNbRow()
        combineLatest([this.exsituFormService.materials$, this.materialFormService.occurrence])
        .pipe(
            filter(([materials, occurrence]) => !!materials),
            map(([materials, occurrence]) => {
              return materials.filter((mat) => occurrence ? mat.id_material !== occurrence.id_material : true);
            })
        )
        .subscribe((filteredMaterials) => {
            const transformedMaterials = filteredMaterials.map(material => {
              const { taxonsDisplay, taxonsTooltip } = this.transformTaxons(material.taxons);
              return {
                ...material,
                taxonsDisplay,
                taxonsTooltip
              };
            });
            this.materialListService.materials$.next(filteredMaterials);
            this.loadMaterials();            
            this.totalMaterials = filteredMaterials.length;
            this.dataSource.data = transformedMaterials
        });
        
    }

    calculateNbRow() {
      let wH = window.innerHeight;
      let listHeight = wH - 400;
      this.rowPerPage = Math.round(listHeight / 70);
       
    }

    onChangePage(event) {
      this.pagination.offset = event.offset;
      this.loadMaterials();
    }


    removeHtml(str: string | undefined): string {
        return str ? str.replace(/<[^>]*>/g, '') : '';
    }
    
    materialTitle(material) {
        return this.removeHtml(material.code_material);
    }

    editOccurrence(occurrence) {
      this.exsituFormService.mode = 'edit'      
      this.materialFormService.occurrence.next(occurrence);
    }

    deleteOccurrence(occurrence) {
      if (occurrence.taxons && occurrence.taxons.length > 0) {
          this.dialogService
          .confirmDialog({ message: 'Ce matériel est lié à un ou plusieurs taxons. Êtes-vous sûr de vouloir le supprimer ?' })
          .subscribe((yes) => {
            if (yes) {
              this.materialFormService.deleteOccurrence(occurrence);
            }
          });
        }else{
          this.dialogService
          .confirmDialog({ message: 'Étes vous certain de vouloir supprimer ce matériel ?' })
          .subscribe((yes) => {
            if (yes) {
              this.materialFormService.deleteOccurrence(occurrence);
            }
          });
        }
        
      }

    calculateTotalPages() {
        this.totalPages = Math.ceil(this.materials.length / this.itemsPerPage);
    }

    onPaginateChange(){
      this.loadMaterials();
    }

    loadMaterials() {
        const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
        const pageSize = this.paginator ? this.paginator.pageSize : 10;
        let params = new HttpParams()
                  .set('page', pageIndex)
                  .set('limit', pageSize);        
        this.api.getMaterialsByHarvest(this.exsituFormService.idHarvest, params).subscribe(response => {
          this.totalMaterials = response['total'];  
          this.dataSource.data = [];
          const transformedMaterials = response['materials'].map(material => {
            const { taxonsDisplay, taxonsTooltip } = this.transformTaxons(material.taxons);
            return {
              ...material,
              taxonsDisplay,
              taxonsTooltip
            };
          });
          this.dataSource.data = transformedMaterials; 
        });
    }

    transformTaxons(taxons: { cd_nom: number; search_name: string }[]): { 
      taxonsDisplay: string, 
      taxonsTooltip: string 
    } {
      const MAX_NAMES = 1;
    
      if (!taxons || taxons.length === 0) {
        return {
          taxonsDisplay: '',
          taxonsTooltip: ''
        };
      }
    
      // Extraire uniquement les `search_name`
      const uniqueTaxons = Array.from(new Set(taxons.map(t => t.search_name)));
    
      // Construire l'affichage des taxons
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
    

    openTaxonModal(materialId: number, code_material: string): void {
      const dialogRef = this.dialog.open(TaxonModalComponent, {
        width: '400px',
        height: '400px',
        data: { id: materialId, code_material: code_material }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          
        }
      });
    }
}
