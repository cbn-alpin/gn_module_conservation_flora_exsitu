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
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';
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
  @Input() sowingCode: string = '';
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
    private dialogService: DialogService,
    private toast: CommonService
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
      disableClose: true,
      data: this.idSowing
        ? { id_sowing: this.idSowing, sowingCode: this.sowingCode }
        : { id_test: this.idTest }
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
              disableClose: true,
              data: {
                ...(this.idSowing ? { id_sowing: this.idSowing, sowingCode: this.sowingCode } : { id_test: this.idTest }),
                action: actionFull,
                edit: true,
                code,
                actionTypeLabel: element?.label_action_type || '',
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

  private toBoldText(value: string): string {
    const boldItalicChars: Record<string, string> = {
      A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
      K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
      U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
      a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
      k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
      u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
      0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
    };

    return value.replace(/[A-Za-z0-9]/g, (char) => boldItalicChars[char] || char);
  }

  onDelete(action: Action): void {
    this.dialogService
      .confirmDialog({ message: 'Étes vous certain de vouloir supprimer cette action ?' })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.api.deleteaction(action.id_action).subscribe({
          next: () => {
            const currentSowingCode = this.sowingCode || '';
            const currentActionType = action?.label_action_type || '';
            const actionLabel = `${currentSowingCode} - ${currentActionType}`.trim();

            this.toast.translateToaster(
              'error',
              `Action ${this.toBoldText(actionLabel)} supprimée avec succès`
            );

            this.loadActions();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression de l’action :', err);
          }
        });
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