import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';


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

    constructor() {}

    ngOnInit(): void {
        this.loadStocks();
    }

    loadStocks() {
        // this.stockService.getAllStocks().subscribe((data) => {
        //   this.stocks = data;
        // });
    }

    openStockModal() {
        // Logique ouverture modale pour créer un stock
    }

    openActionModal(stock: any) {
        // Logique ouverture modale pour ajouter une action à ce stock
    }
}