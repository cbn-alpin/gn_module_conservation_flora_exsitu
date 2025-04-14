
import { ExtraOptions, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { routes } from './gnModule.routes';
import { GN2CommonModule } from '@geonature_common/GN2Common.module';
import { HarvestStoreService } from './services/store.service';
import { DataService } from './services/data.service';
import { CommonModule } from '@angular/common';
import { MaterialFormComponent } from './material/material-form/material-form.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MaterialFormService } from './material/material-form/material-form.service';
import { ExsituFormComponent } from './form/shared/exsitu-form.component';
import { ExsituFormService } from './form/shared/exsitu-form.service';
import { MaterialListComponent } from './material/material-list/material-list.component';
import { HarvestFormComponent } from './harvest-form/harvest-form.component';
import { HarvestMapListComponent } from './harvest-map-list/harvest-map-list.component';
import { MaterialListService } from './material/material-list/material-list.service';
import { HeaderComponent } from './form/shared/header/header.component';
import { HarvestFilterComponent } from './harvest-map-list/filter/harvest-filter.component';
import { HarvestMapComponent } from './harvest-form/harvest-map/harvest-map.component';
import { HarvestFormService } from './harvest-form/harvest-form.service';
import { ConstantsService } from './services/constants.service';
import { HarvestMapService } from './harvest-form/harvest-map/harvest-map.service';
import { ObserversService } from './services/observers.service';
import { TaxonModalComponent } from './components/modal-taxon/taxon-modal.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DialogService } from './components/confirm-dialog/confirm-dialog.service';
import { ConfigService } from './services/config.service';
import { SeddDescriptionComponent } from './components/seed-description/seed-description.component';
import { StockManagementComponent } from './stock-management/stock-management.component';
import { ActionsStockComponent } from './stock-management/actions-stock/actions-stock.component';

export const routingConfiguration: ExtraOptions = {
    paramsInheritanceStrategy: 'always'
  };

@NgModule({
  declarations: [
    MaterialFormComponent,
    MaterialListComponent,
    ExsituFormComponent,
    HarvestFormComponent,
    HarvestMapListComponent,
    HeaderComponent,
    HarvestFilterComponent,
    HarvestMapComponent,
    TaxonModalComponent,
    ConfirmDialogComponent,
    SeddDescriptionComponent,
    StockManagementComponent,
    ActionsStockComponent,
  ],
  providers: [
    HarvestStoreService, 
    DataService,
    MaterialFormService,
    ExsituFormService,
    MaterialFormService,
    MaterialListService,
    HarvestFormService,
    ConstantsService,
    HarvestMapService,
    ObserversService,
    DialogService,
    ConfigService
  ],
  imports: [
    RouterModule.forChild(routes),
    GN2CommonModule,
    CommonModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
  ],
  entryComponents: [
    ConfirmDialogComponent,
  ],
  bootstrap: []
})
export class GeonatureModule {
    constructor() {}
}