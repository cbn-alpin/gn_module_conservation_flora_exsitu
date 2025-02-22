
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
import { RootComponent } from './root/root.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
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


export const routingConfiguration: ExtraOptions = {
    paramsInheritanceStrategy: 'always'
  };

@NgModule({
  declarations: [
    MaterialFormComponent,
    MaterialListComponent,
    RootComponent,
    BreadcrumbsComponent,
    ExsituFormComponent,
    HarvestFormComponent,
    HarvestMapListComponent,
    HeaderComponent,
    HarvestFilterComponent,
    HarvestMapComponent,
  ],
  providers: [
    HarvestStoreService, 
    DataService,
    MaterialFormService,
    ExsituFormService,
    MaterialFormService,
    MaterialListService,
    HarvestFormService
  ],
  imports: [
    RouterModule.forChild(routes),
    GN2CommonModule,
    CommonModule,
    MatCheckboxModule
  ],
  bootstrap: []
})
export class GeonatureModule {
    constructor() {}
}