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
        Number(
          element?.id_storage
        );


      /*
       * On récupère également les IDs depuis
       * l'URL actuelle en secours.
       *
       * Cela rend l'ouverture robuste même après F5.
       */
      const urlSegments =
        this.router.url
          .split('?')[0]
          .split('/');


      const harvestIndex =
        urlSegments.indexOf(
          'harvest'
        ) + 1;

      const materialIndex =
        urlSegments.indexOf(
          'material'
        ) + 1;


      const idHarvest =
        Number(
          this.exsituFormService.idHarvest ||
          (
            harvestIndex > 0 &&
            harvestIndex < urlSegments.length
              ? urlSegments[harvestIndex]
              : 0
          )
        );


      const idMaterial =
        Number(
          element?.id_material ||
          this.exsituFormService.idMaterial ||
          (
            materialIndex > 0 &&
            materialIndex < urlSegments.length
              ? urlSegments[materialIndex]
              : 0
          )
        );


      const actionTypeLabel =
        element?.action_type_label ||
        '-';


      if (
        !idStorage ||
        !idMaterial ||
        !idHarvest ||
        !this.placeCode
      ) {

        console.error(
          'Impossible d’ouvrir les détails du stockage : identifiant manquant.',
          {
            idStorage,
            idMaterial,
            idHarvest,
            placeCode:
              this.placeCode
          }
        );

        return;
      }


      this.exsituFormService
        .setIdMaterial(
          idMaterial
        );


      /*
       * Même navigation que les pages
       * Germination / Viabilité / Semis.
       */
      this.router.navigate(
        [
          '/conservation_flora_exsitu/form/harvest',
          idHarvest,
          'material',
          idMaterial,
          'stock-details',
          idStorage,
          this.placeCode
        ],
        {
          state: {
            actionTypeLabel,
            storageAction:
              element
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

    private toBoldText(value: string): string {
      const boldChars: Record<string, string> = {
        A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉',
        K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓',
        U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
        a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣',
        k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭',
        u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
        0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
      };

      return value.replace(/[A-Za-z0-9]/g, (char) => boldChars[char] || char);
    }


    private formatDateForToaster(value: any): string {
      if (!value) {
        return '-';
      }

      if (typeof value === 'string') {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

        if (match) {
          return `${match[3]}/${match[2]}/${match[1]}`;
        }
      }

      const date =
        value instanceof Date
          ? value
          : new Date(value);

      if (Number.isNaN(date.getTime())) {
        return '-';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
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
                  const actionTypeLabel =
                    String(data.action_type_label || '-').trim() || '-';

                  const dateLabel =
                    this.formatDateForToaster(data.date_start);

                  const storageLocation =
                    String(this.title || '-').trim() || '-';

                  this._commonService.translateToaster(
                    'error',
                    `Action de stockage ${this.toBoldText(actionTypeLabel)} supprimée avec succès\nDate de début : ${this.toBoldText(dateLabel)}\nLieu de stockage associé : ${this.toBoldText(storageLocation)}`
                  );

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