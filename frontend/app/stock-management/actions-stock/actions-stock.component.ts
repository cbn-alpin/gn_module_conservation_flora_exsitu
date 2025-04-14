import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'cfe-actions-stock',
  templateUrl: './actions-stock.component.html',
  styleUrls: ['./actions-stock.component.css'],
})
export class ActionsStockComponent implements OnInit {
    @Input() title: string = '';
    @Input() placeId!: number;
    dataSource = new MatTableDataSource<any>(); 
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild('dataTableContainer') dataTableContainer: ElementRef;
    displayedColumns: string[] = [
        'date_start', 
        'actor', 
        'action_type',
        'quantity',
        'id_humidity_level',
        'humidity_rate',
        'id_humidity_device',
        'actions'
    ]; 

    actions: any[] = [];

    constructor() {}

    ngOnInit(): void {
            // this.actionService.getActionsByPlace(this.placeId).subscribe((data) => {
            //     this.actions = data;
            // });
    }

}