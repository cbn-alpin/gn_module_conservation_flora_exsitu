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
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';

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
export class ActionTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() idTest: number | null = null;
  @Input() idSowing: number | null = null;
  @Input() dataSource = new MatTableDataSource<any>();
  @Input() enablePagination = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  rowPerPage = 5;

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
    private api: DataService,
  ) {}

  ngOnInit(): void {
    if (this.idSowing || this.idTest) {
      this.loadActions();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['idSowing'] && changes['idSowing'].currentValue) ||
      (changes['idTest'] && changes['idTest'].currentValue)
    ) {
      this.loadActions();
    }
  }

  ngAfterViewInit(): void {
    if (this.enablePagination && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  loadActions(): void {
    if (this.idSowing) {
      this.api.getActionsBySowing(this.idSowing).subscribe({
        next: (actions) => {
          console.log('📦 Actions du semis reçues :', actions);

          this.dataSource.data = actions.map(action => ({
            id_action: action.id_action,
            date_start: action.date_start,
            label_action_type: action.label_action_type,
            label_actor: action.label_actor,
            meta_create_date: action.meta_create_date
          })).sort((a, b) => {
            const dateA = new Date(a.meta_create_date).getTime();
            const dateB = new Date(b.meta_create_date).getTime();
            return dateB - dateA;
          });

          if (this.enablePagination && this.paginator) {
            this.dataSource.paginator = this.paginator;
            this.paginator.firstPage();
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des actions du semis :', err);
          this.dataSource.data = [];
        }
      });
      return;
    }

    if (!this.idTest) return;

    this.api.getActionsByTest(this.idTest).subscribe({
      next: (actions) => {
        console.log('📦 Actions du test reçues :', actions);

        this.dataSource.data = actions.map(action => ({
          id_action: action.id_action,
          date_start: action.date_start,
          label_action_type: action.label_action_type,
          label_actor: action.label_actor,
          meta_create_date: action.meta_create_date
        })).sort((a, b) => {
          const dateA = new Date(a.meta_create_date).getTime();
          const dateB = new Date(b.meta_create_date).getTime();
          return dateB - dateA;
        });

        if (this.enablePagination && this.paginator) {
          this.dataSource.paginator = this.paginator;
          this.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actions :', err);
        this.dataSource.data = [];
      }
    });
  }

  add(): void {
    const dialogRef = this.dialog.open(ActionComponent, {
      width: '900px',
      height: '90vh',
      data: this.idSowing ? { id_sowing: this.idSowing } : { id_test: this.idTest }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActions();
      }
    });
  }

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
                ...(this.idSowing ? { id_sowing: this.idSowing } : { id_test: this.idTest }),
                action: actionFull,
                edit: true,
                code,
                id_action: actionFull.id_action,
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
            console.error('❌ Erreur lors du chargement du code nomenclature :', err);
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