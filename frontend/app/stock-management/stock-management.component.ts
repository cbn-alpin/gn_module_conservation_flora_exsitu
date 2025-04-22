import { Component, OnInit, ViewChild, ElementRef, } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ActionModalComponent } from '../components/action-modal/action-modal.component';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { ConstantsService } from '../services/constants.service';

@Component({
  selector: 'cfe-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css'],
})
export class StockManagementComponent implements OnInit {
    public idMaterial;
    totalInitialQuantity: number = 0;
    totalCurrentQuantity: number = 0;


    constructor(
        public dialog: MatDialog,
        private exsituFormService: ExsituFormService,
        public api: DataService,
        public constants: ConstantsService
    ) {}

    ngOnInit(): void {
        this.idMaterial = this.exsituFormService.idMaterial;
        this.getStockSummary() 
    }

    getStockSummary() {
        this.api.getStockSummary(this.idMaterial).subscribe((res) => {
          this.totalInitialQuantity = res['initial_storage'];
          this.totalCurrentQuantity = res['current_quantity'];
        });
      }
      
}