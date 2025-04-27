  
  import { Component, Input, Output, EventEmitter,OnInit } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { Router } from '@angular/router';
import { ViabilityComponent } from '../viability/viability.component';
import { MatDialog } from '@angular/material/dialog';

 
  interface Viability {
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
    @Input() dataSource = new MatTableDataSource<Viability>();
    @Output() view = new EventEmitter<Viability>();
    @Output() edit = new EventEmitter<Viability>();
    @Output() delete = new EventEmitter<Viability>();
  
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
    //   this.router.navigate([`/conservation_flora_exsitu/form/harvest/:id_harvest/material/:idMaterial/semis`]);
    // }

    addFicheViability() {
      const dialogRef = this.dialog.open(ViabilityComponent, {
        width: '900px',
        height: '90vh'
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const newEntry: Viability = {
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