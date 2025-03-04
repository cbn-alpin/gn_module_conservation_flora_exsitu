import { Component, OnInit, ViewChild  } from '@angular/core';
import { MaterialListService } from './material-list.service';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { MaterialFormService } from '../material-form/material-form.service';
import { ConfirmationDialog } from '@geonature_common/others/modal-confirmation/confirmation.dialog';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { TaxonModalComponent } from '../../components/modal-taxon/taxon-modal.component';


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
        return str ? str.replace(/<[^>]*>/g, '') : ''; // Retourne une chaîne vide si str est undefined
    }
    
    materialTitle(material) {
        return this.removeHtml(material.code_material);
    }

    editOccurrence(occurrence) {
        this.materialFormService.occurrence.next(occurrence);
    }

    deleteOccurrence(occurrence) {
        //const message = `${this.translate.instant('Delete')} ${this.taxonTitle(occurrence)} ?`;
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          width: '350px',
          position: { top: '5%' },
          data: { message: 'Supprimer le matériel?' },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.materialFormService.deleteOccurrence(occurrence);
          }
        });
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
          console.log(typeof response['materials']);
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
          console.log("Rafraîchir la liste ici...");
          // TODO: Recharger la liste des taxons
        }
      });
    }
}
