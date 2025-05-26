import { Routes } from '@angular/router';

import { MaterialFormComponent } from './material/material-form/material-form.component';
import { ExsituFormComponent } from './form/shared/exsitu-form.component';
import { HarvestMapListComponent } from './harvest-map-list/harvest-map-list.component';
import { HarvestFormComponent } from './harvest-form/harvest-form.component';
import { SemisComponent } from './semis/semis.component';
import { GerminationComponent } from './germination/germination.component';
import { SemisTableComponent } from './semis-table/semis-table.component';
import { GerminationTableComponent } from './germination-table/germination-table.component';
import { ViabilityComponent } from './viability/viability.component';
import { ViabilityTableComponent } from './viability-table/viability-table.component';
import { StockManagementComponent } from './stock-management/stock-management.component';
import { SeedDetailsComponent } from './seed-details/seed-details.component';
import { GerminationDetailsComponent } from './germination-details/germination-details.component';
import { SemisDetailsComponent } from './semis-details/semis-details.component';
import { ViabilityDetailsComponent } from './viability-details/viability-details.component';

export const routes: Routes = [
    {
        path: '',
        component: HarvestMapListComponent,
    },
    
        
    {
        path: 'form',
        component: ExsituFormComponent,
        children: [
            {
                path: 'harvest',
                component: HarvestFormComponent
            },
            {
                path: 'harvest/:id_harvest',
                component: HarvestFormComponent
            },
            {
                path: 'harvest/:id_harvest/material-form',
                component: MaterialFormComponent
            },
            {
                path: 'harvest/:idHarvest/material/:idMaterial/seed-details/:idSeed',
                component: SeedDetailsComponent
            },
            {
                path: 'harvest/:idHarvest/material/:idMaterial/stock',
                component: StockManagementComponent
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/germination',
                component: GerminationComponent,

            },
            
            {
                path: 'harvest/:id_harvest/material/:idMaterial/germination-table',
                component:  GerminationTableComponent,
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/semis',
                component: SemisComponent,
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/semis-table',
                component: SemisTableComponent,
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/viability',
                component: ViabilityComponent,
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/viability-table',
                component: ViabilityTableComponent,
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/germination-details',
                component: GerminationDetailsComponent,
            }, 
            {
                path: 'harvest/:id_harvest/material/:idMaterial/semis-details',
                component: SemisDetailsComponent,
            },
            {
                path: 'harvest/:id_harvest/material/:idMaterial/viability-details',
                component: ViabilityDetailsComponent,
            },
        ]
    }
]