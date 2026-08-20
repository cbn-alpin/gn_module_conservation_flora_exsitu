import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActionModalComponent } from '../../components/action-modal/action-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';
import { CommonService } from '@geonature_common/service/common.service';
import { DialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { StockManagementService } from '../stock-management.service';


@Component({
  selector: 'cfe-actions-stock',
  templateUrl: './actions-stock.component.html',
  styleUrls: ['./actions-stock.component.css'],
})
export class ActionsStockComponent implements OnInit {
    @Input() title: string = '';
    @Input() placeCode: string = '';
    dataSource = new MatTableDataSource<any>(); 
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
    rowPerPage = 5;
    public totalActions: number;

    public activeActionRowId: number | null = null;

    public setActiveActionRow(row: any): void {
      this.activeActionRowId = row.id_storage;
    }

    public clearActiveActionRow(): void {
      this.activeActionRowId = null;
    }

    public isActionRowActive(row: any): boolean {
      return this.activeActionRowId === row.id_storage;
    }

    displayedColumns: string[] = [
        'action_type',
        'quantity',
        'date',
        'destination',
        'actions'
    ]; 

    constructor(
      public dialog: MatDialog,
      private exsituFormService: ExsituFormService,
      private api: DataService,
       private _commonService: CommonService,
       private dialogService: DialogService,
       private stockManagementService: StockManagementService
    ) {}

    ngOnInit(): void {
      this.loadActions();
    }

    loadActions(){
      const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator?.pageSize || this.rowPerPage;
      
      let params = new HttpParams()
                  .set('page', pageIndex)
                  .set('limit', pageSize)
                  .set('placeCode', this.placeCode);   
      this.api.getActions(this.exsituFormService.idMaterial, params).subscribe({
        next: (data) => {                              
          this.dataSource.data = data['items'];
          this.totalActions = data['total'];            
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des actions', err);
        }
      })
    }

    openActionModal(action?: any): void {
      const isEdit = !!action;
      const baseData = {
        id_material: this.exsituFormService.idMaterial,
        placeCode: this.placeCode
      };
    
      const data = isEdit ? { ...baseData, ...action } : baseData;
    
      const dialogRef = this.dialog.open(ActionModalComponent, {
        width: '900px',
        height: '90vh',
        disableClose: true,
        autoFocus: false,
        data: { data, edit: isEdit }
      });
          
      dialogRef.afterClosed().subscribe(() => {
        this.loadActions();
        this.onGetStockSummary()
      });
    }
    

    onPaginateChange(){
      this.loadActions();
    }

    confirmDeleteAction(data) {
      if (!data?.id_material || !data?.id_storage) return;      
    
      this.dialogService
          .confirmDialog({ message: 'Êtes-vous sûr de vouloir cette action ?' })
          .subscribe((yes) => {
            if (yes) {
              this.api.deleteAction(data.id_material, data.id_storage).subscribe({
                next: () => {
                  this._commonService.translateToaster('info', 'Action supprimée avec succès');
                  this.loadActions();
                  this.onGetStockSummary()
                },
                error: (err) => {
                  if (err.status === 403 && err.error?.error) {
                    this._commonService.translateToaster('warning', err.error.error);
                    console.warn("Détail:", err.error.details);
                  } else {
                    this._commonService.translateToaster('warning', 'Erreur lors de la suppression de l\'action');
                  }
                }
              });
            }
          });
    }


    onGetStockSummary(){
      this.api.getStockSummary(this.exsituFormService.idMaterial).subscribe(res => {
        this.stockManagementService.updateInitialQuantity(res['initial_storage']);
        this.stockManagementService.updateCurrentQuantity(res['current_quantity']);
      });
    }    
}