  
  import { Component, Input, Output, EventEmitter,OnInit } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { Router } from '@angular/router';
  import { MatDialog } from '@angular/material/dialog';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ActionComponent } from '../action/action.component';

  export interface Action {
    type: string;
    numSemence: string;
    dateDebut: Date;
    dateFin: Date;
    replicate: number;
    levage: number;
  }
  
  @Component({
    selector: 'app-action-table',
    templateUrl: './action-table.component.html',
    styleUrls: ['./action-table.component.scss']
  })
  export class ActionTableComponent  implements OnInit  {
    idMaterial: number | null = null;

   

    ngOnInit(): void {
      this.dataSource.data = [
        {
          type: 'SEM-001',
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
          private dialog: MatDialog,
                  public exsituFormService: ExsituFormService,
          
      ){
  
      }
    @Input() dataSource = new MatTableDataSource<Action>();
    @Output() view = new EventEmitter<Action>();
    @Output() edit = new EventEmitter<Action>();
    @Output() delete = new EventEmitter<Action>();
    @Output() rowClicked = new EventEmitter<any>(); // <-- nouveau output

    displayedColumns: string[] = [
      'type',
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
    onRowClick(row: any): void {
      this.rowClicked.emit(row); // <-- émettre l'action cliquée
    }
  
   

    add() {
          const dialogRef = this.dialog.open(ActionComponent, {
            width: '900px',
            height: '90vh'
          });
        
          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              const newEntry: Action = {
                type: result.numeroSemis,
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