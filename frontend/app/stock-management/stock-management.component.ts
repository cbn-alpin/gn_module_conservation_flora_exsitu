import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { StockModalComponent } from '../components/stock-modal/stock-modal.component';


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
    stocks: any[] = [];

    constructor(
        public dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        this.loadStocks();
    }

    loadStocks() {
        // this.stockService.getAllStocks().subscribe((data) => {
        //   this.stocks = data;
        // });
    }

    openActionModal(stock: any) {
        // Logique ouverture modale pour ajouter une action à ce stock
    }

    openStockModal(id_material): void {      
        const dialogRef = this.dialog.open(StockModalComponent, {
            width: '100%',
            height: '80%',
            data: { id: id_material }
        });
        dialogRef.afterClosed().subscribe(() => {
            
        });
    }
}