  
  import { Component, Input, Output, EventEmitter,OnInit } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { Router } from '@angular/router';
  import { MatDialog } from '@angular/material/dialog';
import { SemisComponent } from '../semis/semis.component';

  export interface Semis {
    numSemis: string;
    numSemence: string;
    dateDebut: Date;
    dateFin: Date;
    replicate: number;
    levage: number;
  }
  
  @Component({
    selector: 'app-semis-table',
    templateUrl: './semis-table.component.html',
    styleUrls: ['./semis-table.component.scss']
  })
  export class SemisTableComponent  implements OnInit  {


    ngOnInit(): void {

      this.dataSource.data = [
        {
          numSemis: 'SEM-001',
          numSemence: 'SEED-001',
          dateDebut: new Date('2024-03-01'),
          dateFin: new Date('2024-03-20'),
          replicate: 5,
          levage:5
        }
       
      ];
  }
  
  constructor(
          public router: Router,
          private dialog: MatDialog
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
    // addFicheSemis(){
    //   this.router.navigate([`/conservation_flora_exsitu/semis`]);
    // }
     addFicheSemis() {
          const dialogRef = this.dialog.open(SemisComponent, {
            width: '900px',
            height: '90vh'
          });
        
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              const newEntry: Semis = {
                numSemis: result.numeroSemis,
                numSemence: result.numeroSemence,
                dateDebut: result.dateDebut,
                dateFin: result.dateFin,
                replicate: 0, // tu peux aussi prendre de result si ton formulaire le fournit
                levage: 0     // idem
              };
        
              this.dataSource.data = [...this.dataSource.data, newEntry];
            }
          });
        }
  
  }