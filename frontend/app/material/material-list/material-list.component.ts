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
import { MaterialModalComponent } from '../../components/material-modal/material-modal.component';
import { ConstantsService } from '../../services/constants.service';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';


@Component({
    selector: 'cs-material-list',
    templateUrl: './material-list.component.html',
    styleUrls: ['./material-list.component.css'],
})
export class MaterialListComponent implements OnInit {
    public totalMaterials: number;
    pagination = { offset: 0, limit: 10 };
    rowPerPage = 5;
    @ViewChild('dataTable') dataTable: DatatableComponent;
    dataSource = new MatTableDataSource<any>();  
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
    displayedColumns: string[] = [
      'code_material',
      'taxons',        
      'harvest_material',    
      'code_cultural_bank',  
      'code_material_parent',
      'actions'
    ];


    constructor(
        public materialListService: MaterialListService,
        public exsituFormService: ExsituFormService,
        private materialFormService: MaterialFormService,
        public dialog: MatDialog,
        private api: DataService,
        public mapListService: MapListService,
        private dialogService: DialogService,
        public constants: ConstantsService,
        public router: Router,
        public cfg: ConfigService
        
    ){

    }

    ngOnInit(): void {
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

    onBackToHarvest(): void {
      const idHarvest =
        this.exsituFormService.idHarvest;

      if (!idHarvest) {
        console.error(
          'Impossible de revenir à la récolte : idHarvest manquant.'
        );

        return;
      }

      this.exsituFormService.currentTab =
        'harvest';

      this.router.navigate([
        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}`
      ]);
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
      this.exsituFormService.setIdMaterial(occurrence.id_material);
      this.exsituFormService.mode = 'edit'      
      this.materialFormService.occurrence.next(occurrence);
      this.addModalMaterial();
    }

    deleteOccurrence(occurrence) {
      const hasLinkedTaxons =
        occurrence.taxons
        && occurrence.taxons.length > 0;

      this.dialogService
        .confirmDialog({
          message: '',
          icon: 'spa',
          variant: 'material',
          entityCode: this.removeHtml(occurrence.code_material),
          warningMessage: hasLinkedTaxons
            ? 'Ce matériel est lié à un ou plusieurs taxons.'
            : undefined,
          disableClose: false
        })
        .subscribe((yes) => {
          if (yes) {
            this.materialFormService
              .deleteOccurrence(occurrence);
          }
        });
    }

    onPaginateChange(){
      this.loadMaterials();
    }

    loadMaterials() {
        const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
        const pageSize = this.paginator ? this.paginator.pageSize : this.rowPerPage;
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

    transformTaxons(taxons: { cd_nom: number; nom_valide: string }[]): { 
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
    
      // Extraire uniquement les `nom_valide`
      const uniqueTaxons = Array.from(new Set(taxons.map(t => t.nom_valide)));
    
      // Construire l'affichage des taxons
      const taxonsTooltip = uniqueTaxons.join(' ... ').replace(/, ([^,]+)$/, ' & $1') + '.';
      let taxonsDisplay = uniqueTaxons.join('... ');
    
      if (uniqueTaxons.length > MAX_NAMES) {
        const firstTaxon = uniqueTaxons.slice(0, MAX_NAMES);
        taxonsDisplay = `${firstTaxon} (+${uniqueTaxons.length - MAX_NAMES})`;
      }
    
      return {
        taxonsDisplay,
        taxonsTooltip
      };
    }
    
    addModalMaterial(): void {
      const dialogRef = this.dialog.open(MaterialModalComponent, {
        width: '900px',
        height: '90vh',
        disableClose: true,
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          
        }
      });
    }


    goToStock(material: any) {
      const idMaterial = material.id_material
      this.exsituFormService.setIdMaterial(idMaterial);
      this.router.navigate([`${this.cfg.getModuleUrl()}/form/harvest/${this.exsituFormService.idHarvest}/material/${idMaterial}/stock`]);
    }

    selectMaterial(
      material: any
    ): void {

      const idMaterial =
        Number(
          material?.id_material
        );

      if (!idMaterial) {
        return;
      }

      /*
      * Le matériel sélectionné devient
      * le contexte de l'onglet Culture.
      */
      this.exsituFormService
        .setIdMaterial(
          idMaterial
        );

      /*
      * Un accès par l'onglet supérieur Culture
      * correspond toujours à un accès direct
      * depuis le matériel récolté.
      */
      this.exsituFormService
        .setCultureSourceFromMaterial();
    }

    goToCulture(material: any): void {

      const idMaterial =
        material?.id_material;

      const idHarvest =
        this.exsituFormService.idHarvest;


      if (!idMaterial || !idHarvest) {

        console.error(
          'Impossible d’ouvrir Culture : identifiant du matériel ou de la récolte manquant.'
        );

        return;
      }


      this.exsituFormService.setIdMaterial(
        idMaterial
      );


      /*
      * Culture ouverte directement depuis
      * Matériel récolté.
      *
      * Aucun Semis ni Test n'est associé.
      */
      this.exsituFormService
        .setCultureSourceFromMaterial();


      this.exsituFormService.currentTab =
        'culture-table';


      this.router.navigate([

        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/culture-table`

      ]);
    }

    goToSeedDetails(material: any): void {
      const idMaterial = material.id_material
      this.exsituFormService.setIdMaterial(idMaterial);
      this.handleSeedByMaterial(
        idMaterial,
        seed => this.router.navigate([
          `${this.cfg.getModuleUrl()}/form/harvest/${this.exsituFormService.idHarvest}/material/${idMaterial}/seed-details/${seed.id_seed}`
        ]),
        () => console.warn('Pas de seed disponible pour ce material'),
        err => console.error('Erreur lors de la récupération de la seed:', err)
      );
    }    

    private handleSeedByMaterial(
      materialId: number,
      onFound: (seed: any) => void,
      onNotFound: () => void,
      onError?: (err: any) => void
    ): void {
      this.api.getSeedByMaterial(materialId).subscribe({
        next: seed => {
          if (seed && seed.seed) {
            onFound(seed.seed);
          } else {
            onNotFound();
          }
        },
        error: err => {
          if (err.status === 204) {
            onNotFound();
          } else {
            console.error('Erreur lors de la récupération de la seed:', err);
            if (onError) onError(err);
          }
        }
      });
    }
    
}
