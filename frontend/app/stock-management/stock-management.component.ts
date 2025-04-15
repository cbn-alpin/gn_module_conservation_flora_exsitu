import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { StockModalComponent } from '../components/stock-modal/stock-modal.component';
import { ActionModalComponent } from '../components/action-modal/action-modal.component';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';

@Component({
  selector: 'cfe-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css'],
})
export class StockManagementComponent implements OnInit {
    dataSource = new MatTableDataSource<any>(); 
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
    displayedColumns: string[] = [
        'place',        
        'initial_quantity', 
        'current_quantity', 
        'dry_type',
        'actions'
    ]; 
    public idMaterial;

    constructor(
        public dialog: MatDialog,
        private exsituFormService: ExsituFormService,
        public api: DataService
    ) {}

    ngOnInit(): void {
        this.idMaterial = this.exsituFormService.idMaterial
        this.loadStocks();
    }

    loadStocks() {
        this.api.getStorage(this.idMaterial).subscribe(
            (stocks) =>{
                this.dataSource.data = stocks;
            }
        )
    }

    openStockModal(): void {      
        const dialogRef = this.dialog.open(StockModalComponent, {
            width: '70%',
            height: '60%',
            data: { id_material: this.idMaterial  }
        });
        dialogRef.afterClosed().subscribe(() => {
            
        });
    }

    openActionModal(id_storage): void {      
        const dialogRef = this.dialog.open(ActionModalComponent, {
            width: '70%',
            height: '80%',
            data: { id: id_storage }
        });
        dialogRef.afterClosed().subscribe(() => {
            
        });
    }
}