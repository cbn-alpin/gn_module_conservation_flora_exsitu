import { Component, OnInit, ViewChild  } from '@angular/core';
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
    totalMaterials: number = 0;
    pagination = { offset: 0, limit: 10 };
    rowPerPage: number;

    isModalOpen = false;  // Pour afficher ou masquer la modale
    selectedMaterialId: number | null = null;
    taxonName: string = '';


    constructor(
        public materialListService: MaterialListService,
        private exsituFormService: ExsituFormService,
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
            this.materialListService.materials$.next(filteredMaterials);
            this.materials = filteredMaterials.slice();
            this.loadMaterials();            
            this.totalMaterials = filteredMaterials.length;
            this.calculateTotalPages();
            this.updatePagination();   
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
    
    updatePagination() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        this.paginatedMaterials = this.materials.slice(startIndex, startIndex + this.itemsPerPage);
    }

    loadMaterials() {
        let params = new HttpParams()
                  .set('page', this.pagination.offset + 1)
                  .set('limit', this.rowPerPage);        
        this.api.getMaterialsByHarvest(this.exsituFormService.idHarvest, params).subscribe(response => {
          this.materials = response['materials'];
          this.totalMaterials = response['total'];    
        });
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
