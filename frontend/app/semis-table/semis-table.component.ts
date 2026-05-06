  
  import { Component, Input, Output, EventEmitter,OnInit } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { Router } from '@angular/router';
  import { MatDialog } from '@angular/material/dialog';
import { SemisComponent } from '../semis/semis.component';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { SemisService } from '../semis/semis.service';
import { SemisTableService } from './semis-table.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';

  export interface Semis {
    code: any;
    start_date: any;
    end_date: any;
    id_sowing_method: any;
    replicate_count: any;
  }
  
  @Component({
    selector: 'app-semis-table',
    templateUrl: './semis-table.component.html',
    styleUrls: ['./semis-table.component.scss']
  })
  export class SemisTableComponent  implements OnInit  {
    idMaterial: number | null = null;
    sowings:any;
    @Input() dataSource = new MatTableDataSource<Semis>();
    @Output() view = new EventEmitter<Semis>();
    @Output() edit = new EventEmitter<Semis>();
    @Output() delete = new EventEmitter<Semis>();
  
    displayedColumns: string[] = [
      'code',
      'start_date',
      'end_date',
      'id_sowing_method',
      'replicate_count',
      'actions',
    ];

    public activeActionRowId: number | null = null;

    public setActiveActionRow(row: any): void {
      this.activeActionRowId = row.id_sowing;
    }

    public clearActiveActionRow(): void {
      this.activeActionRowId = null;
    }

    public isActionRowActive(row: any): boolean {
      return this.activeActionRowId === row.id_sowing;
    }

    public isStandardSowingCode(code: any): boolean {
      return typeof code === 'string' && /^S\d{4}_\d{4}$/.test(code);
    }
    
  constructor(
          public router: Router,
          private dialog: MatDialog,
          public exsituFormService: ExsituFormService,
          private semisService: SemisTableService,
          private dialogService: DialogService,
      ){
  
      }

    ngOnInit(): void {
      this.idMaterial = this.exsituFormService.idMaterial;
    this.semisService.sowings$.subscribe((sowings) => {
      this.dataSource.data = sowings;
      console.log(this.dataSource.data)
    });

    // ⬇️ Déclenche le chargement côté service
    this.semisService.loadSowings(this.idMaterial);
  }
    
    onView() {
      // this.view.emit(element);
      console.log("view")
    }
  
    onEdit() {
      // this.edit.emit(element);
      console.log("edit")
  
    }
  
    onDelete(element: any) {
      if (!this.idMaterial || !element?.id_sowing) {
        return;
      }

      this.dialogService
        .confirmDialog({ message: 'Étes vous certain de vouloir supprimer ce semis ?' })
        .subscribe((yes) => {
          if (yes) {
            this.semisService.deleteSowing(this.idMaterial!, element.id_sowing).subscribe({
              next: () => {
                this.semisService.loadSowings(this.idMaterial!);
              },
              error: (err) => {
                console.error('Erreur lors de la suppression du semis :', err);
              }
            });
          }
        });
    }

    onRowClick(): void {
      // const id = row.id; // ou row.numSemis si tu veux baser sur numSemis
       console.log('Ligne cliquée, ID:');
       // Par exemple : router.navigate
       this.router.navigate([`/conservation_flora_exsitu/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}/semis-details`]);
     }
     addFicheSemis() {
          const dialogRef = this.dialog.open(SemisComponent, {
            width: '900px',
            height: '90vh'
          });
        
          dialogRef.afterClosed().subscribe(result => {
            if (result && this.idMaterial) {
              this.semisService.loadSowings(this.idMaterial); // SLIM ERROR : recharger la liste après création
            }
          });
        }
  
  }