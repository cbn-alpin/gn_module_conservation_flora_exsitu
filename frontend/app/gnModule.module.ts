import { ExtraOptions, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { routes } from './gnModule.routes';
import { GN2CommonModule } from '@geonature_common/GN2Common.module';
import { HarvestStoreService } from './services/store.service';
import { DataService } from './services/data.service';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
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
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DialogService } from './components/confirm-dialog/confirm-dialog.service';
import { ConfigService } from './services/config.service';
import { SeddDescriptionComponent } from './components/seed-description/seed-description.component';
import { StockManagementComponent } from './stock-management/stock-management.component';
import { ActionsStockComponent } from './stock-management/actions-stock/actions-stock.component';
import { ActionModalComponent } from './components/action-modal/action-modal.component';
import { MaterialModalComponent } from './components/material-modal/material-modal.component';
import { StockManagementService } from './stock-management/stock-management.service';
import { SeedDetailsComponent } from './seed-details/seed-details.component';
import { SemisComponent } from './semis/semis.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { SemisTableComponent } from './semis-table/semis-table.component';
import { GerminationComponent } from './germination/germination.component';
import { GerminationTableComponent } from './germination-table/germination-table.component';
import { ViabilityComponent } from './viability/viability.component';
import { ViabilityTableComponent } from './viability-table/viability-table.component';
import { MatMenuModule } from '@angular/material/menu';
import { GerminationDetailsComponent } from './germination-details/germination-details.component';
import { ActionTableComponent } from './action-table/action-table.component';
import { ActionComponent } from './action/action.component';
import { ActionDetailsComponent } from './action-details/action-details.component';
import { SemisDetailsComponent } from './semis-details/semis-details.component';
import { ViabilityDetailsComponent } from './viability-details/viability-details.component';
import { SemisService } from './semis/semis.service';
import { GerminationFormService } from './germination/germination-form.service';
import { SemisTableService } from './semis-table/semis-table.service';
import { ReplicatesModalComponent } from './replicates/replicates-modal.component';
import { FollowupDetailsComponent } from'./FollowupDetailsComponent/followup-details.component';
import { ViabilityFormService } from './viability/viability-form.service';

import { CultureService } from './culture/culture.service';
import { CultureTableComponent } from './culture-table/culture-table.component';
import { CultureTableService } from './culture-table/culture-table.service';
export function getFrenchPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Éléments par page :';
  paginatorIntl.nextPageLabel = 'Page suivante';
  paginatorIntl.previousPageLabel = 'Page précédente';
  paginatorIntl.firstPageLabel = 'Première page';
  paginatorIntl.lastPageLabel = 'Dernière page';

  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 sur ${length}`;
    }

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);

    return `${startIndex + 1} – ${endIndex} sur ${length}`;
  };

  return paginatorIntl;
}

export const routingConfiguration: ExtraOptions = {
    paramsInheritanceStrategy: 'always'
  };
registerLocaleData(localeFr);

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
    SemisComponent ,
    SemisTableComponent,
    GerminationComponent,
    GerminationTableComponent,
    ViabilityComponent,
    ViabilityTableComponent,
    StockManagementComponent,
    ActionsStockComponent,
    ActionModalComponent,
    SeddDescriptionComponent,
    ConfirmDialogComponent,
    MaterialModalComponent,
    SeedDetailsComponent,
    GerminationDetailsComponent,
    ActionTableComponent,
    ActionComponent,
    ActionDetailsComponent,
    SemisDetailsComponent,
    ViabilityDetailsComponent,
    ReplicatesModalComponent,
    FollowupDetailsComponent,
    CultureTableComponent,
  ],
  providers: [
    HarvestStoreService, 
    DataService,
    ExsituFormService,
    MaterialFormService,
    MaterialListService,
    HarvestFormService,
    ConstantsService,
    HarvestMapService,
    ObserversService,
    DialogService,
    ConfigService,
    StockManagementService,
    SemisService,
    GerminationFormService,
    SemisTableService,
    ViabilityFormService,
    CultureService,
    CultureTableService,
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: MatPaginatorIntl, useFactory: getFrenchPaginatorIntl },
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
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatIconModule,
  ],
  entryComponents: [
    ConfirmDialogComponent,
  ],
  bootstrap: []
})
export class GeonatureModule {
    constructor() {}
}