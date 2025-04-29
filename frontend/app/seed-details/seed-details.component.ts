import { Component, OnInit } from '@angular/core';
import { Observable } from '@librairies/rxjs';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import { HarvestStoreService } from '../services/store.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';

interface ITaxon {
    taxhubRecordId: number;
    taxonCode: number;
}
@Component({
    selector: 'cs-seed-details',
    templateUrl: './seed-details.component.html',
    styleUrls: ['./seed-details.component.css'],
})
export class SeedDetailsComponent implements OnInit {
    taxonInfos$: Observable<{ attributs: { [key: string]: string } }> | null = null;
    attributs = [];
    seed
    taxhubEditFormUrl: string;
    constructor(
        private cfg: ConfigService,
        private dataService: DataService,
        private exsituService: ExsituFormService
    ){
        this.taxhubEditFormUrl = this.cfg.getTaxHubFrontendUrl();
    }

    ngOnInit(): void {
        this.loadFullSeedDetails()
    }

    private loadFullSeedDetails() {
        this.dataService.getFullSeedDetails(this.exsituService.idSeed).subscribe({
          next: (data) => {
            this.taxhubEditFormUrl += `/admin/taxons/edit/?id=${data.cd_ref}`;
            this.seed = data;
            this.attributs = data.taxon_attributs || {};
          },
          error: (err) => {
            console.error('Erreur chargement infos complètes :', err);
          }
        });
    }
}