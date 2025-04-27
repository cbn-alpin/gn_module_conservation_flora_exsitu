  
  import { Component, Input, Output, EventEmitter,OnInit } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { Router } from '@angular/router';

  export interface Semis {
    numSemis: string;
    numSemence: string;
    dateDebut: Date;
    dateFin: Date;
    replicate: number;
    levage: number;
  }
  
  @Component({
    selector: 'app-viability-table',
    templateUrl: './viability-table.component.html',
    styleUrls: ['./viability-table.component.scss']
  })
  export class ViabilityTableComponent  implements OnInit  {


    ngOnInit(): void {
  }
  
  constructor(
          public router: Router
      ){
  
      }
    @Input() dataSource = new MatTableDataSource<Semis>();
    @Output() view = new EventEmitter<Semis>();
    @Output() edit = new EventEmitter<Semis>();
    @Output() delete = new EventEmitter<Semis>();
  
    displayedColumns: string[] = [
      'numSemis',
      'numSemence',
      'dateDebut',
      'dateFin',
      'replicate',
      'levage'
    ];
  
    onView() {
      // this.view.emit(element);
      console.log("view")
    }
  
    onEdit() {
      // this.edit.emit(element);
      console.log("edit")
  
    }
  
    onDelete() {
      // this.delete.emit(element);
      console.log("delete")
  
    }
    addFicheSemis(){
      this.router.navigate([`/conservation_flora_exsitu/form/harvest/:id_harvest/material/:idMaterial/semis`]);
    }
  
  }