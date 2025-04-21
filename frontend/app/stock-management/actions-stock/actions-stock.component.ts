import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActionModalComponent } from '../../components/action-modal/action-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';


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
    rowPerPage: number;
    public totalActions: number;
    displayedColumns: string[] = [
        'action_type',
        'quantity',
        'id_humidity_level',
        'humidity_rate',
        'id_humidity_device',
        'actions'
    ]; 

    constructor(
      public dialog: MatDialog,
      private exsituFormService: ExsituFormService,
      private api: DataService
    ) {}

    ngOnInit(): void {
      this.calculateNbRow()
      this.loadActions();
    }

    loadActions(){
      const pageIndex = this.paginator ? this.paginator.pageIndex + 1 : 1;
      const pageSize = this.paginator?.pageSize || this.rowPerPage || 10;
      
      let params = new HttpParams()
                  .set('page', pageIndex)
                  .set('limit', pageSize)
                  .set('placeCode', this.placeCode);   
      this.api.getActions(this.exsituFormService.idMaterial, params).subscribe({
        next: (data) => {     
          console.log(data);
                         
          this.dataSource.data = data['items'];
          this.totalActions = data['total'];            
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des actions', err);
        }
      })
    }

    openActionModal(): void {
      const data = {id_material: this.exsituFormService.idMaterial, placeCode: this.placeCode}      
      const dialogRef = this.dialog.open(ActionModalComponent, {
        width: '70%',
        height: '80%',
        data: { data: data }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.loadActions();
      });
    }

    calculateNbRow() {
      let wH = window.innerHeight;
      let listHeight = wH - 400;
      this.rowPerPage = Math.round(listHeight / 170);
    }

    onPaginateChange(){
      this.loadActions();
    }
}