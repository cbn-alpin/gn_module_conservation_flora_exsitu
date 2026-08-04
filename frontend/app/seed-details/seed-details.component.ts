import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from '@librairies/rxjs';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import { HarvestStoreService } from '../services/store.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';

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
    mediasFilesTaxhub = [];
    currentIndex = 0;
    seed
    taxhubEditFormUrl: string;
    mediaFiles: Array<{ type: string, title: string, url: string }> = [];
    constructor(
        private cfg: ConfigService,
        private dataService: DataService,
        private exsituService: ExsituFormService,
        private dialogService: DialogService,
        private _commonService: CommonService,
        private router: Router
    ){
        this.taxhubEditFormUrl = this.cfg.getTaxHubFrontendUrl();
    }

    ngOnInit(): void {
        this.loadFullSeedDetails()
        setInterval(() => {
          if (this.mediasFilesTaxhub && this.mediasFilesTaxhub.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.mediasFilesTaxhub.length;
          }
        }, 2000);
    }

    private loadFullSeedDetails() {        
        this.dataService.getFullSeedDetails(this.exsituService.idSeed).subscribe({
          next: (data) => {     
            console.log(data);
                               
            this.taxhubEditFormUrl += `/admin/taxons/edit/?id=${data.cd_ref}`;
            this.seed = data;
            this.attributs = data.taxon_attributs || {};
            this.mediaFiles = data.media_files || []; 
            this.mediasFilesTaxhub = data.media_files_taxhub || [];       
          },
          error: (err) => {
            console.error('Erreur chargement infos complètes :', err);
          }
        });
    }

    onBackToMaterial(): void {
        const idHarvest =
            this.exsituService.idHarvest;

        if (!idHarvest) {
            console.error(
                'Impossible de revenir au matériel récolté : idHarvest manquant.'
            );

            return;
        }

        this.exsituService.currentTab =
            'materials';

        this.router.navigate([
            `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material-form`
        ]);
    }

    lightboxVisible = false;
    lightboxImage: string = '';

    openLightbox(imageUrl: string): void {
        this.lightboxImage = imageUrl;
        this.lightboxVisible = true;
    }

    closeLightbox(): void {
        this.lightboxVisible = false;
        this.lightboxImage = '';
    }

    deleteMedia(id: number): void {
        this.dialogService
          .confirmDialog({ message: 'Voulez-vous vraiment supprimer la photo ?' })
          .subscribe((yes) => {
            if (yes) {
                this.dataService.deleteMedia(id).subscribe({
                    next: () => {
                      this.loadFullSeedDetails();
                      this._commonService.translateToaster('info', 'Photo supprimée avec succès');
                    },
                    error: err => {
                      this._commonService.translateToaster('warning', 'Erreur suppression de la photo');
                    }
                });
            }
          });
      
        
      }
      

}