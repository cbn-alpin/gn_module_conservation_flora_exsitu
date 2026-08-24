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
import { CommonService } from '@geonature_common/service/common.service';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';


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
  @Input() isGerminationContext = false;
  @Input() isViabilityContext = false;
  @Input() sowingCode: string = '';
  @Input() testCode: string = '';
  @Input() dataSource = new MatTableDataSource<any>();
  @Input() enablePagination = false;
  @Input() sowingReplicateCount: number | null = null;
  @Input() selectedActionId: number | null = null;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  rowPerPage = 5;

  private allSowingActions: any[] = [];

  public sowingActionTypeFilter: string | null = null;
  public sowingActionStartDateFromFilter: Date | null = null;
  public sowingActionStartDateToFilter: Date | null = null;
  public sowingActionSortActive = 'date_start';
  public sowingActionSortDirection: 'asc' | 'desc' = 'desc';
  public sowingActionTypeFilterOptions: string[] = [];

  private readonly sowingActionTypeFilterOrder = [
    'Prétraitement',
    'Scarification',
    'Scarification chimique',
    'Scarification mécanique',
    'Stratification',
    'Traitement',
    'Suivi par réplicats',
    'Suivi réplicats',
    'Synthèse du suivi'
  ];

  @Output() view = new EventEmitter<Action>();
  @Output() edit = new EventEmitter<Action>();
  @Output() delete = new EventEmitter<Action>();
  @Output() rowClicked = new EventEmitter<Action>();
  @Output() actionSaved = new EventEmitter<number>();
  @Output() visibleActionsChanged = new EventEmitter<any[]>();

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

    if (changes['selectedActionId']) {
      this.syncPaginatorWithSelectedAction();
    }
  }

  ngAfterViewInit(): void {
    if (this.enablePagination && this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.syncPaginatorWithSelectedAction();
    }
  }

  loadActions(): void {
    if (this.idSowing) {

      this.api.getActionsBySowing(this.idSowing).subscribe({
        next: (actions) => {
          console.log('📦 Actions du semis reçues :', actions);

          this.allSowingActions = actions.map(action => ({
            id_action: action.id_action,
            date_start: action.date_start,
            label_action_type: action.label_action_type,
            label_scarification_type: action.label_scarification_type,
            label_actor: action.label_actor,
            meta_create_date: action.meta_create_date
          })).sort((a, b) => {
            const dateA = new Date(a.meta_create_date).getTime();
            const dateB = new Date(b.meta_create_date).getTime();
            return dateB - dateA;
          });

          this.updateSowingActionTypeFilterOptions();
          this.applySowingActionFilters();
        },
        error: (err) => {
          console.error(
            'Erreur lors du chargement des actions du semis :',
            err
          );

          this.dataSource.data = [];
        }
      });

      return;
    }

    if (!this.idTest) {
      return;
    }

    this.api.getActionsByTest(this.idTest).subscribe({
      next: (actions) => {
        console.log('📦 Actions du test reçues :', actions);

        const testActions = actions.map(action => ({
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

        if (
          this.isGerminationContext ||
          this.isViabilityContext
        ) {
          this.allSowingActions = testActions;

          this.updateSowingActionTypeFilterOptions();
          this.applySowingActionFilters();

          return;
        }

        this.dataSource.data = testActions;

        if (
          this.enablePagination &&
          this.paginator
        ) {
          this.dataSource.paginator =
            this.paginator;

          this.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error(
          'Erreur lors du chargement des actions :',
          err
        );

        this.dataSource.data = [];
      }
    });
  }

  add(): void {
    const dialogRef = this.dialog.open(ActionComponent, {
      width: '900px',
      height: '90vh',

      panelClass: this.idSowing
        ? 'sowing-action-dialog-panel'
        : this.isViabilityContext
          ? 'viability-action-dialog-panel'
          : this.isGerminationContext
            ? 'germination-action-dialog-panel'
            : undefined,

      disableClose: true,
      autoFocus: false,
      restoreFocus: false,

      data: this.idSowing
        ? {
            id_sowing: this.idSowing,
            sowingCode: this.sowingCode,
            sowingReplicateCount: this.sowingReplicateCount
          }
        : {
            id_test: this.idTest,
            testCode: this.testCode,

            actionContext:
              this.isViabilityContext
                ? 'viability'
                : 'germination'
          }
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
              panelClass: this.idSowing
                ? 'sowing-action-dialog-panel'
                : this.isViabilityContext
                  ? 'viability-action-dialog-panel'
                  : this.isGerminationContext
                    ? 'germination-action-dialog-panel'
                    : undefined,
              disableClose: true,
              autoFocus: false,
              restoreFocus: false,
              data: {
                ...(this.idSowing
                  ? {
                      id_sowing: this.idSowing,
                      sowingCode: this.sowingCode,
                      sowingReplicateCount: this.sowingReplicateCount
                    }
                  : {
                      id_test: this.idTest,
                      testCode: this.testCode,
                      actionContext: this.isViabilityContext
                        ? 'viability'
                        : 'germination'
                    }),

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

                if (this.idSowing) {
                  this.actionSaved.emit(element.id_action);
                }
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

  private formatDateForToaster(value: any): string {
    if (!value) {
      return '-';
    }

    if (typeof value === 'string') {
      const datePart = value.split('T')[0];
      const [year, month, day] = datePart.split('-');

      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  getActionTypeDisplayValue(element: any): string {
    const actionType = element?.label_action_type || '-';

    if (!this.idSowing) {
      return actionType;
    }

    const normalizedActionType = String(actionType).trim().toLowerCase();
    const scarificationType = String(element?.label_scarification_type || '').trim().toLowerCase();

    if (normalizedActionType !== 'scarification') {
      return actionType;
    }

    if (scarificationType.includes('chimique')) {
      return 'Scarification chimique';
    }

    if (scarificationType.includes('mécanique') || scarificationType.includes('mecanique')) {
      return 'Scarification mécanique';
    }

    return actionType;
  }

  private updateSowingActionTypeFilterOptions(actionsForOptions: any[] = this.allSowingActions): void {
    const presentActionTypes = new Set(
      actionsForOptions
        .map((action) => this.getActionTypeDisplayValue(action))
        .filter((label) => !!label && label !== '-')
    );

    const orderedActionTypes = this.sowingActionTypeFilterOrder.filter(
      (label) => presentActionTypes.has(label)
    );

    const additionalActionTypes = Array.from(presentActionTypes)
      .filter((label) => !this.sowingActionTypeFilterOrder.includes(label))
      .sort((a, b) => a.localeCompare(b, 'fr'));

    this.sowingActionTypeFilterOptions = [
      ...orderedActionTypes,
      ...additionalActionTypes
    ];

    if (
      this.sowingActionTypeFilter &&
      !this.sowingActionTypeFilterOptions.includes(this.sowingActionTypeFilter)
    ) {
      this.sowingActionTypeFilter = null;
    }
  }

  private getDateFilterKey(value: any): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      const datePart = value.split('T')[0];

      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getDateFilterTimestamp(value: any): number {
    const dateKey = this.getDateFilterKey(value);

    if (!dateKey) {
      return 0;
    }

    const timestamp = new Date(`${dateKey}T00:00:00`).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private sortSowingActions(actions: any[]): any[] {
    const active = this.sowingActionSortActive;
    const direction = this.sowingActionSortDirection;

    if (!active || !direction) {
      return actions;
    }

    return [...actions].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      if (active === 'date_start') {
        valueA = this.getDateFilterTimestamp(a.date_start);
        valueB = this.getDateFilterTimestamp(b.date_start);
      } else if (active === 'label_action_type') {
        const actionTypeA = this.getActionTypeDisplayValue(a);
        const actionTypeB = this.getActionTypeDisplayValue(b);

        const indexA = this.sowingActionTypeFilterOrder.indexOf(actionTypeA);
        const indexB = this.sowingActionTypeFilterOrder.indexOf(actionTypeB);

        valueA = indexA === -1 ? 999 : indexA;
        valueB = indexB === -1 ? 999 : indexB;
      } else {
        valueA = a[active];
        valueB = b[active];
      }

      let comparison = 0;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else {
        comparison = String(valueA || '').localeCompare(String(valueB || ''), 'fr');
      }

      if (comparison === 0) {
        const createDateA = new Date(a.meta_create_date).getTime();
        const createDateB = new Date(b.meta_create_date).getTime();

        comparison = createDateB - createDateA;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  private syncSowingActionPaginator(totalItems: number): void {
    if (!this.enablePagination || !this.paginator) {
      return;
    }

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.paginator.length = totalItems;
      this.paginator.pageIndex = 0;
      this.paginator.firstPage();
    });
  }

  private syncPaginatorWithSelectedAction(): void {
    if (!this.enablePagination || !this.paginator || !this.selectedActionId) {
      return;
    }

    setTimeout(() => {
      const actionIndex = this.dataSource.data.findIndex(
        (action) => action.id_action === this.selectedActionId
      );

      if (actionIndex < 0) {
        return;
      }

      const pageSize = this.paginator.pageSize || this.rowPerPage;
      const nextPageIndex = Math.floor(actionIndex / pageSize);

      if (this.paginator.pageIndex === nextPageIndex) {
        return;
      }

      const previousPageIndex = this.paginator.pageIndex;

      this.paginator.pageIndex = nextPageIndex;
      this.paginator.length = this.dataSource.data.length;

      const pageEvent: PageEvent = {
        previousPageIndex,
        pageIndex: nextPageIndex,
        pageSize,
        length: this.dataSource.data.length
      };

      this.paginator.page.emit(pageEvent);
    });
  }

  public applySowingActionFilters(): void {
    if (
      !this.idSowing &&
      !this.isGerminationContext &&
      !this.isViabilityContext
    ) {
      return;
    }

    const selectedDateFromKey = this.getDateFilterKey(this.sowingActionStartDateFromFilter);
    const selectedDateToKey = this.getDateFilterKey(this.sowingActionStartDateToFilter);

    const actionsMatchingDateFilters = this.allSowingActions.filter((action) => {
      const actionDateKey = this.getDateFilterKey(action.date_start);

      const matchesDateFrom =
        !selectedDateFromKey ||
        (!!actionDateKey && actionDateKey >= selectedDateFromKey);

      const matchesDateTo =
        !selectedDateToKey ||
        (!!actionDateKey && actionDateKey <= selectedDateToKey);

      return matchesDateFrom && matchesDateTo;
    });

    this.updateSowingActionTypeFilterOptions(actionsMatchingDateFilters);

    const filteredActions = actionsMatchingDateFilters.filter((action) => {
      const actionType = this.getActionTypeDisplayValue(action);

      return (
        !this.sowingActionTypeFilter ||
        actionType === this.sowingActionTypeFilter
      );
    });

    const sortedActions = this.sortSowingActions(filteredActions);

    this.dataSource.data = sortedActions;
    this.visibleActionsChanged.emit(sortedActions);
    this.syncSowingActionPaginator(sortedActions.length);
    this.syncPaginatorWithSelectedAction();
  }

  public onSowingActionTypeFilterChange(value: string | null): void {
    this.sowingActionTypeFilter = value;
    this.applySowingActionFilters();
  }

  public onSowingActionStartDateFromFilterChange(value: Date | null): void {
    this.sowingActionStartDateFromFilter = value;
    this.applySowingActionFilters();
  }

  public onSowingActionStartDateToFilterChange(value: Date | null): void {
    this.sowingActionStartDateToFilter = value;
    this.applySowingActionFilters();
  }

  public onSowingActionTableSortChange(sort: Sort): void {
    this.sowingActionSortActive = sort.active || 'date_start';
    this.sowingActionSortDirection = sort.direction || 'desc';
    this.applySowingActionFilters();
  }

  public resetSowingActionFilters(): void {
    this.sowingActionTypeFilter = null;
    this.sowingActionStartDateFromFilter = null;
    this.sowingActionStartDateToFilter = null;
    this.sowingActionSortActive = 'date_start';
    this.sowingActionSortDirection = 'desc';

    this.updateSowingActionTypeFilterOptions(this.allSowingActions);
    this.applySowingActionFilters();
  }

  public get hasSowingActions(): boolean {

    return (
      this.allSowingActions.length > 0
    );
  }

  onDelete(action: Action): void {

    const actionType =
      this.getActionTypeDisplayValue(action) ||
      action?.label_action_type ||
      '-';


    const dialogContext =
      this.idSowing
        ? {
            icon: 'grain',
            variant: 'semis' as const,
            actionContextLabel: 'de semis'
          }
        : this.isViabilityContext
          ? {
              icon: 'check_circle',
              variant: 'viability' as const,
              actionContextLabel: 'du test de viabilité'
            }
          : this.isGerminationContext
            ? {
                icon: 'wb_sunny',
                variant: 'germination' as const,
                actionContextLabel: 'du test de germination'
              }
            : null;


    const confirmation$ =
      dialogContext
        ? this.dialogService
            .confirmDialog({
              message: '',
              icon: dialogContext.icon,
              variant: dialogContext.variant,
              actionDeletion: true,
              actionContextLabel:
                dialogContext.actionContextLabel,
              entityLabel: actionType,
              entityDate: action?.date_start,
              disableClose: false
            })
        : this.dialogService
            .confirmDialog({
              message:
                'Êtes-vous certain de vouloir supprimer cette action ?',
              disableClose: false
            });


    confirmation$
      .subscribe((yes) => {

        if (!yes) {
          return;
        }


        this.api
          .deleteaction(
            action.id_action
          )
          .subscribe({

            next: () => {

              const currentSowingCode =
                this.sowingCode || '';

              const currentActionType =
                action?.label_action_type || '';

              const actionLabel =
                `${
                  currentSowingCode
                } - ${
                  currentActionType
                }`
                  .trim();


              const dateStart =
                this.formatDateForToaster(
                  action?.date_start
                );


              this.toast.translateToaster(
                'error',
                `Action ${
                  this.toBoldText(
                    actionLabel
                  )
                } supprimée avec succès. Date de début : ${
                  this.toBoldText(
                    dateStart
                  )
                }`
              );


              this.loadActions();
            },

            error: (err) => {

              console.error(
                'Erreur lors de la suppression de l’action :',
                err
              );

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