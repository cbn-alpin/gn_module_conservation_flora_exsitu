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