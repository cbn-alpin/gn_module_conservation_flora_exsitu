import { Routes } from '@angular/router';

import { MaterialFormComponent } from './material/material-form/material-form.component';
import { ExsituFormComponent } from './form/shared/exsitu-form.component';
import { HarvestMapListComponent } from './harvest-map-list/harvest-map-list.component';
import { HarvestFormComponent } from './harvest-form/harvest-form.component';

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
            }
        ]
    }
]