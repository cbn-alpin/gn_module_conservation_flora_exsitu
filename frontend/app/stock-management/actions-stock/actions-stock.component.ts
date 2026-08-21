import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActionModalComponent } from '../../components/action-modal/action-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';
import { CommonService } from '@geonature_common/service/common.service';
import { DialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { StockManagementService } from '../stock-management.service';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';


@Component({
  selector: 'cfe-actions-stock',
  templateUrl: './actions-stock.component.html',
  styleUrls: ['./actions-stock.component.css'],
})
export class ActionsStockComponent
  implements OnInit, OnChanges {

    @Input() title: string = '';
    @Input() placeCode: string = '';


    /*
     * Les 3 filtres sont fournis
     * par le composant Stockage principal.
     */
    @Input()
    stockActionTypeFilter:
      string | null = null;

    @Input()
    stockDateFromFilter:
      Date | null = null;

    @Input()
    stockDestinationFilter:
      string | null = null;


    /*
     * Chaque tableau renvoie sa liste complète
     * au parent pour construire les options
     * communes aux 4 tableaux.
     */
    @Output()
    actionsLoaded =
      new EventEmitter<{
        placeCode: string;
        actions: any[];
      }>();


    public allActions: any[] = [];


    dataSource =
      new MatTableDataSource<any>();


    private paginatorRef:
      MatPaginator | null = null;


    @ViewChild(MatPaginator)
    set paginator(
      paginator: MatPaginator
    ) {

      if (paginator) {

        this.paginatorRef =
          paginator;

        this.syncPaginator();

      }

    }


    @ViewChild('dataTableContainer')
    dataTableContainer: ElementRef;

    rowPerPage = 5;

    public totalActions: number;

    public activeActionRowId: number | null = null;

    public setActiveActionRow(row: any): void {
      this.activeActionRowId = row.id_storage;
    }

    public clearActiveActionRow(): void {
      this.activeActionRowId = null;
    }

    public isActionRowActive(row: any): boolean {
      return this.activeActionRowId === row.id_storage;
    }

    displayedColumns: string[] = [
        'action_type',
        'quantity',
        'date',
        'destination',
        'actions'
    ]; 

    constructor(
      public dialog: MatDialog,
      private exsituFormService: ExsituFormService,
      private api: DataService,
      private _commonService: CommonService,
      private dialogService: DialogService,
      private stockManagementService: StockManagementService,
      private router: Router,
      private cfg: ConfigService
    ) {}

    ngOnInit(): void {
      this.loadActions();
    }


    ngOnChanges(
      changes: SimpleChanges
    ): void {

      if (
        changes['stockActionTypeFilter'] ||
        changes['stockDateFromFilter'] ||
        changes['stockDestinationFilter']
      ) {
        this.applyActionFilters();
      }

    }


    private syncPaginator(): void {

      if (!this.paginatorRef) {
        return;
      }


      this.dataSource.paginator =
        this.paginatorRef;
    }


    private getActionTypeFilterValue(
      action: any
    ): string {

      const value =
        String(
          action?.action_type_label || ''
        ).trim();


      return value || '-';
    }


    private getDestinationFilterValue(
      action: any
    ): string {

      const value =
        String(
          action?.destination || ''
        ).trim();


      /*
       * Destination vide / null
       * est représentée par "-".
       */
      return value || '-';
    }


    private getDateFilterKey(
      value: any
    ): string {

      if (!value) {
        return '';
      }


      if (typeof value === 'string') {

        const datePart =
          value.split('T')[0];


        if (
          /^\d{4}-\d{2}-\d{2}$/.test(
            datePart
          )
        ) {
          return datePart;
        }

      }


      const date =
        value instanceof Date
          ? value
          : new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return '';
      }


      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, '0');

      const day =
        String(
          date.getDate()
        ).padStart(2, '0');


      return `${year}-${month}-${day}`;
    }


    public applyActionFilters(): void {

      const selectedDateKey =
        this.getDateFilterKey(
          this.stockDateFromFilter
        );


      const filteredActions =
        this.allActions.filter(
          action => {

            const actionType =
              this.getActionTypeFilterValue(
                action
              );

            const destination =
              this.getDestinationFilterValue(
                action
              );

            const actionDateKey =
              this.getDateFilterKey(
                action?.date_start
              );


            const matchesActionType =
              !this.stockActionTypeFilter ||
              actionType ===
                this.stockActionTypeFilter;


            const matchesDate =
              !selectedDateKey ||
              (
                !!actionDateKey &&
                actionDateKey >=
                  selectedDateKey
              );


            const matchesDestination =
              !this.stockDestinationFilter ||
              destination ===
                this.stockDestinationFilter;


            return (
              matchesActionType &&
              matchesDate &&
              matchesDestination
            );

          }
        );


      /*
       * Chaque tableau reçoit uniquement
       * son résultat filtré.
       */
      this.dataSource.data =
        filteredActions;


      /*
       * Chaque tableau garde sa propre
       * pagination et repart à la page 1.
       */
      setTimeout(() => {

        this.syncPaginator();


        if (this.paginatorRef) {
          this.paginatorRef.firstPage();
        }

      });
    }


    loadActions(): void {

      const idMaterial =
        Number(
          this.exsituFormService.idMaterial
        );


      if (
        !idMaterial ||
        !this.placeCode
      ) {

        this.totalActions = 0;

        this.allActions = [];

        this.dataSource.data = [];


        this.actionsLoaded.emit({
          placeCode: this.placeCode,
          actions: []
        });


        return;
      }


      /*
       * 1er appel :
       * connaître le nombre total
       * d'actions de ce lieu.
       */
      const countParams =
        new HttpParams()
          .set('page', 1)
          .set('limit', 1)
          .set(
            'placeCode',
            this.placeCode
          );


      this.api
        .getActions(
          idMaterial,
          countParams
        )
        .subscribe({

          next: (firstData) => {

            const total =
              Number(
                firstData['total'] || 0
              );


            this.totalActions =
              total;


            if (total === 0) {

              this.allActions = [];

              this.dataSource.data = [];


              this.actionsLoaded.emit({
                placeCode: this.placeCode,
                actions: []
              });


              return;
            }


            /*
             * 2e appel :
             * récupération de TOUTES
             * les actions de ce lieu.
             */
            const allParams =
              new HttpParams()
                .set('page', 1)
                .set('limit', total)
                .set(
                  'placeCode',
                  this.placeCode
                );


            this.api
              .getActions(
                idMaterial,
                allParams
              )
              .subscribe({

                next: (data) => {

                  this.allActions =
                    data['items'] || [];


                  this.totalActions =
                    this.allActions.length;


                  /*
                   * Le parent reçoit cette liste
                   * afin de construire les filtres
                   * communs aux 4 tableaux.
                   */
                  this.actionsLoaded.emit({
                    placeCode: this.placeCode,
                    actions: this.allActions
                  });


                  /*
                   * Puis on applique les filtres
                   * actuellement sélectionnés.
                   */
                  this.applyActionFilters();

                },


                error: (err) => {

                  console.error(
                    'Erreur lors de la récupération des actions',
                    err
                  );


                  this.allActions = [];

                  this.dataSource.data = [];


                  this.actionsLoaded.emit({
                    placeCode: this.placeCode,
                    actions: []
                  });

                }

              });

          },


          error: (err) => {

            console.error(
              'Erreur lors de la récupération des actions',
              err
            );


            this.allActions = [];

            this.dataSource.data = [];


            this.actionsLoaded.emit({
              placeCode: this.placeCode,
              actions: []
            });

          }

        });
    }

    goToStockDetails(element: any): void {
      const idStorage =
        Number(element?.id_storage);

      const idMaterial =
        Number(
          element?.id_material ||
          this.exsituFormService.idMaterial
        );

      const idHarvest =
        this.exsituFormService.idHarvest;

      const actionTypeLabel =
        element?.action_type_label || '-';


      if (
        !idStorage ||
        !idMaterial ||
        !idHarvest
      ) {
        console.error(
          'Impossible d’ouvrir les détails du stockage : identifiant manquant.'
        );

        return;
      }


      this.exsituFormService
        .setIdMaterial(idMaterial);

      this.exsituFormService.currentTab =
        'stock-details';


      this.router.navigate(
        [
          `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/stock-details/${idStorage}/${this.placeCode}`
        ],
        {
          state: {
            actionTypeLabel
          }
        }
      );
    }


    openActionModal(action?: any): void {
      const isEdit = !!action;
      const baseData = {
        id_material: this.exsituFormService.idMaterial,
        placeCode: this.placeCode
      };
    
      const data = isEdit ? { ...baseData, ...action } : baseData;
    
      const dialogRef = this.dialog.open(ActionModalComponent, {
        width: '900px',
        height: '90vh',
        disableClose: true,
        autoFocus: false,
        data: { data, edit: isEdit }
      });
          
      dialogRef.afterClosed().subscribe(() => {
        this.loadActions();
        this.onGetStockSummary()
      });
    }

    confirmDeleteAction(data) {
      if (!data?.id_material || !data?.id_storage) return;

      this.dialogService
          .confirmDialog({
            message: '',
            icon: 'store',
            variant: 'stock',
            entityLabel: data.action_type_label,
            entityDate: data.date_start,
            storageLocation: this.title,
            disableClose: false
          })
          .subscribe((yes) => {
            if (yes) {
              this.api.deleteAction(data.id_material, data.id_storage).subscribe({
                next: () => {
                  this._commonService.translateToaster('info', 'Action supprimée avec succès');
                  this.loadActions();
                  this.onGetStockSummary()
                },
                error: (err) => {
                  if (err.status === 403 && err.error?.error) {
                    this._commonService.translateToaster('warning', err.error.error);
                    console.warn("Détail:", err.error.details);
                  } else {
                    this._commonService.translateToaster('warning', 'Erreur lors de la suppression de l\'action');
                  }
                }
              });
            }
          });
    }


    onGetStockSummary(){
      this.api.getStockSummary(this.exsituFormService.idMaterial).subscribe(res => {
        this.stockManagementService.updateInitialQuantity(res['initial_storage']);
        this.stockManagementService.updateCurrentQuantity(res['current_quantity']);
      });
    }    
}