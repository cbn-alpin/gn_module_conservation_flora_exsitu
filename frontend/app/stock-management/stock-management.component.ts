import {
  Component,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActionModalComponent } from '../components/action-modal/action-modal.component';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { ConstantsService } from '../services/constants.service';
import { StockManagementService } from './stock-management.service';
import { Router } from '@angular/router';
import { ActionsStockComponent } from './actions-stock/actions-stock.component';

@Component({
  selector: 'cfe-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css'],
})
export class StockManagementComponent implements OnInit {
    public idMaterial;
    totalInitialQuantity: number = 0;
    totalCurrentQuantity: number = 0;

    @ViewChildren(ActionsStockComponent)
    stockActionLists: QueryList<ActionsStockComponent>;


    public stockActionTypeFilter: string | null = null;
    public stockDateFromFilter: Date | null = null;
    public stockDestinationFilter: string | null = null;


    public stockActionTypeFilterOptions: string[] = [];
    public stockDestinationFilterOptions: string[] = [];


    /*
     * Toutes les actions reçues depuis
     * les 4 tableaux de stockage.
     */
    private stockActionsByPlace: {
      [placeCode: string]: any[];
    } = {};


    constructor(
        public dialog: MatDialog,
        private exsituFormService: ExsituFormService,
        public api: DataService,
        public constants: ConstantsService,
        private stockManagementService: StockManagementService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.idMaterial = this.exsituFormService.idMaterial;

        this.stockManagementService.totalInitialQuantity$.subscribe(qty => {
          this.totalInitialQuantity = qty;
        });
      
        this.stockManagementService.totalCurrentQuantity$.subscribe(qty => {
          this.totalCurrentQuantity = qty;
        });
      
        this.getStockSummary();
    }


    /* =========================================================
       FILTRES COMMUNS AUX 4 TABLEAUX DE STOCKAGE
       ========================================================= */


    public onStockActionsLoaded(
      event: {
        placeCode: string;
        actions: any[];
      }
    ): void {

      this.stockActionsByPlace[
        event.placeCode
      ] = event.actions || [];


      /*
       * À chaque rechargement d'un tableau,
       * on recalcule les valeurs disponibles.
       */
      this.updateStockFilterOptions();
    }


    private getAllStockActions(): any[] {

      const allActions: any[] = [];


      Object.keys(
        this.stockActionsByPlace
      ).forEach(
        placeCode => {

          allActions.push(
            ...(
              this.stockActionsByPlace[
                placeCode
              ] || []
            )
          );

        }
      );


      return allActions;
    }


    private getStockActionTypeFilterValue(
      action: any
    ): string {

      const value =
        String(
          action?.action_type_label || ''
        ).trim();


      return value || '-';
    }


    private getStockDestinationFilterValue(
      action: any
    ): string {

      const value =
        String(
          action?.destination || ''
        ).trim();


      /*
       * Destination null / vide
       * devient "-".
       */
      return value || '-';
    }


    private getStockDateFilterKey(
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


    /*
     * La Date réduit les options disponibles
     * dans Type d'action et Destination.
     */
    private getStockActionsMatchingDate():
      any[] {

      const selectedDateKey =
        this.getStockDateFilterKey(
          this.stockDateFromFilter
        );


      return this.getAllStockActions()
        .filter(
          action => {

            if (!selectedDateKey) {
              return true;
            }


            const actionDateKey =
              this.getStockDateFilterKey(
                action?.date_start
              );


            return (
              !!actionDateKey &&
              actionDateKey >=
                selectedDateKey
            );

          }
        );
    }


    private sortStockFilterOptions(
      values: string[]
    ): string[] {

      return Array.from(
        new Set(values)
      )
        .sort(
          (a, b) => {

            /*
             * Toujours placer "-"
             * en premier.
             */
            if (a === '-') {
              return -1;
            }

            if (b === '-') {
              return 1;
            }


            return a.localeCompare(
              b,
              'fr'
            );

          }
        );
    }


    /*
     * Type d'action et Destination
     * sont dynamiques entre eux.
     *
     * La date agit également sur
     * leurs options.
     */
    private updateStockFilterOptions():
      void {

      const baseActions =
        this.getStockActionsMatchingDate();


      let selectedActionType =
        this.stockActionTypeFilter;

      let selectedDestination =
        this.stockDestinationFilter;


      let actionTypeOptions:
        string[] = [];

      let destinationOptions:
        string[] = [];


      /*
       * Deux passages permettent
       * également d'annuler une valeur
       * devenue impossible.
       */
      for (
        let pass = 0;
        pass < 2;
        pass++
      ) {

        /*
         * TYPES D'ACTION disponibles
         * selon Destination + Date.
         */
        const actionsForTypes =
          baseActions.filter(
            action =>
              !selectedDestination ||
              this.getStockDestinationFilterValue(
                action
              ) === selectedDestination
          );


        actionTypeOptions =
          this.sortStockFilterOptions(
            actionsForTypes.map(
              action =>
                this.getStockActionTypeFilterValue(
                  action
                )
            )
          );


        if (
          selectedActionType &&
          !actionTypeOptions.includes(
            selectedActionType
          )
        ) {
          selectedActionType = null;
        }


        /*
         * DESTINATIONS disponibles
         * selon Type d'action + Date.
         */
        const actionsForDestinations =
          baseActions.filter(
            action =>
              !selectedActionType ||
              this.getStockActionTypeFilterValue(
                action
              ) === selectedActionType
          );


        destinationOptions =
          this.sortStockFilterOptions(
            actionsForDestinations.map(
              action =>
                this.getStockDestinationFilterValue(
                  action
                )
            )
          );


        if (
          selectedDestination &&
          !destinationOptions.includes(
            selectedDestination
          )
        ) {
          selectedDestination = null;
        }

      }


      this.stockActionTypeFilter =
        selectedActionType;

      this.stockDestinationFilter =
        selectedDestination;


      this.stockActionTypeFilterOptions =
        actionTypeOptions;

      this.stockDestinationFilterOptions =
        destinationOptions;
    }


    public onStockActionTypeFilterChange(
      value: string | null
    ): void {

      this.stockActionTypeFilter =
        value;

      this.updateStockFilterOptions();
    }


    public onStockDateFromFilterChange(
      value: Date | null
    ): void {

      this.stockDateFromFilter =
        value;

      this.updateStockFilterOptions();
    }


    public onStockDestinationFilterChange(
      value: string | null
    ): void {

      this.stockDestinationFilter =
        value;

      this.updateStockFilterOptions();
    }


    public resetStockFilters(): void {

      this.stockActionTypeFilter =
        null;

      this.stockDateFromFilter =
        null;

      this.stockDestinationFilter =
        null;


      this.updateStockFilterOptions();
    }


    openActionModal(): void {
        const dialogRef = this.dialog.open(ActionModalComponent, {
          width: '900px',
          height: '90vh',
          disableClose: true,
          autoFocus: false,
          data: {
            data: {
              id_material: this.exsituFormService.idMaterial
            },
            edit: false
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          this.stockActionLists?.forEach((list) => {
            list.loadActions();
          });

          this.getStockSummary();
        });
    }


    onBackToMaterial(): void {
        const idHarvest = this.exsituFormService.idHarvest;

        if (!idHarvest) {
          console.error(
            'Impossible de revenir au matériel récolté : idHarvest manquant.'
          );

          return;
        }

        this.exsituFormService.currentTab = 'materials';

        this.router.navigate([
          `/conservation_flora_exsitu/form/harvest/${idHarvest}/material-form`
        ]);
    }


    getStockSummary() {
        this.api.getStockSummary(this.idMaterial).subscribe((res) => {
          const init = res['initial_storage'];
          const curr = res['current_quantity'];

          this.stockManagementService.updateInitialQuantity(init);
          this.stockManagementService.updateCurrentQuantity(curr);
        });
    }
}