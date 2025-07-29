import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ActionComponent } from '../action/action.component';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';

export interface Action {
  id_action: number;
  date_start: string;
  date_end: string;
  label_action_type: string;
  label_actor: string;
}

@Component({
  selector: 'app-action-table',
  templateUrl: './action-table.component.html',
  styleUrls: ['./action-table.component.scss']
})
export class ActionTableComponent implements OnInit, OnChanges {
  @Input() idTest: number;
  @Input() dataSource = new MatTableDataSource<any>();

  @Output() view = new EventEmitter<Action>();
  @Output() edit = new EventEmitter<Action>();
  @Output() delete = new EventEmitter<Action>();
  @Output() rowClicked = new EventEmitter<Action>();

  displayedColumns: string[] = [
    'date_start',
    'label_action_type',
    'label_actor',
    'actions'
  ];

  constructor(
    public router: Router,
    private dialog: MatDialog,
    public exsituFormService: ExsituFormService,
    
    private api: DataService,
  ) {}

  ngOnInit(): void {
    console.log(this.idTest)
    // Chargement initial si idTest est déjà disponible
    if (this.idTest) {
      this.loadActions();
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idTest'] && changes['idTest'].currentValue) {
      this.loadActions(); // <== Appelle bien loadActions ici
    }
  }
  

  /**
   * Recharge les actions liées à un test
   */
  loadActions(): void {
    if (!this.idTest) return; // On garde la vérif
  
    this.api.getActionsByTest(this.exsituFormService.idTest).subscribe({
      next: (actions) => {
        console.log("📦 Actions reçues :", actions);
  
        this.dataSource.data = actions.map(action => ({
          id_action: action.id_action,
          date_start: action.date_start,
          label_action_type: action.label_action_type,  // ⚠️ corrige ici
          label_actor: action.label_actor,              // ⚠️ corrige ici
          meta_create_date: action.meta_create_date
        })).sort((a, b) => {
          const dateA = new Date(a.meta_create_date).getTime();
          const dateB = new Date(b.meta_create_date).getTime();
          return dateB - dateA;
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actions :', err);
        this.dataSource.data = [];
      }
    });
  }
  

  /**
   * Ouvre le formulaire pour ajouter une action
   */
  add(): void {
    const dialogRef = this.dialog.open(ActionComponent, {
      width: '900px',
      height: '90vh',
      data: { id_test: this.idTest }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActions();
      }
    });
  }

  /**
   * Édite une action existante
   */
  onEdit(element: any): void {
    this.api.getActionWithLabels(element.id_action).subscribe({
      next: (actionFull) => {
        this.api.getNomenclatureDetails(actionFull.id_action_type).subscribe({
          next: (nomenclatureDetails) => {
            const code = nomenclatureDetails.cd_nomenclature;
  
            const dialogRef = this.dialog.open(ActionComponent, {
              width: '900px',
              height: '90vh',
              data: {
                id_test: this.idTest,
                action: actionFull,
                edit: true,
                code, 
                hideTypeField: true 
              }
            });
  
            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.loadActions();
              }
            });
          },
          error: (err) => {
            console.error("❌ Erreur lors du chargement du code nomenclature :", err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l’action :', err);
      }
    });
  }
  

  
  onDelete(action: Action): void {
    const confirmed = confirm(`Voulez-vous vraiment supprimer cette action ?`);
    if (!confirmed) return;

    this.api.deleteaction(action.id_action).subscribe({
      next: () => {
        this.loadActions();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression :', err);
      }
    });
  }

  /**
   * Gestion du clic sur une ligne
   */
  onRowClick(action: Action): void {
    this.rowClicked.emit(action);
  }

 
  refresh(): void {
    this.loadActions();
  }

  
  onView(action: Action): void {
    this.view.emit(action);
  }
}
