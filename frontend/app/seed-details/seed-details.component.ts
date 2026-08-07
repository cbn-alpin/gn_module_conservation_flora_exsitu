import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from '@librairies/rxjs';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import { HarvestStoreService } from '../services/store.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';
import { MatDialog } from '@angular/material/dialog';
import { SeddDescriptionComponent } from '../components/seed-description/seed-description.component';

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
        private router: Router,
        public dialog: MatDialog
    ){
        this.taxhubEditFormUrl = this.cfg.getTaxHubFrontendUrl();
    }

    ngOnInit(): void {
        this.loadSeedForCurrentMaterial();

        setInterval(() => {
          if (this.mediasFilesTaxhub && this.mediasFilesTaxhub.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.mediasFilesTaxhub.length;
          }
        }, 2000);
    }

    private loadSeedForCurrentMaterial(): void {
        const idMaterial = this.exsituService.idMaterial;

        if (!idMaterial) {
          this.seed = null;
          this.exsituService.idSeed = null;
          return;
        }

        this.dataService.getSeedByMaterial(idMaterial).subscribe({
          next: (response) => {
            const seed = response?.seed;

            if (!seed?.id_seed) {
              this.seed = null;
              this.exsituService.idSeed = null;
              return;
            }

            this.exsituService.idSeed = seed.id_seed;
            this.loadFullSeedDetails(seed.id_seed, seed);
          },
          error: (err) => {
            if (err?.status === 204) {
              this.seed = null;
              this.exsituService.idSeed = null;
              return;
            }

            console.error('Erreur lors de la récupération de la semence :', err);
          }
        });
    }

    private loadFullSeedDetails(idSeed: number, fallbackSeed: any): void {
        this.seed = fallbackSeed;

        this.dataService.getFullSeedDetails(idSeed).subscribe({
          next: (data) => {
            console.log(data);

            this.taxhubEditFormUrl =
              `${this.cfg.getTaxHubFrontendUrl()}/admin/taxons/edit/?id=${data.cd_ref}`;

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

    onAddOrEditSeed(): void {
        const idMaterial = this.exsituService.idMaterial;

        if (!idMaterial) {
          return;
        }

        this.dataService.getSeedByMaterial(idMaterial).subscribe({
          next: (response) => {
            const existingSeed = response?.seed || null;

            this.openSeedDescriptionModal(
              idMaterial,
              existingSeed ? 'edit' : 'create',
              existingSeed
            );
          },
          error: (err) => {
            if (err?.status === 204) {
              this.openSeedDescriptionModal(
                idMaterial,
                'create',
                null
              );

              return;
            }

            console.error('Erreur lors de la récupération de la semence :', err);
          }
        });
    }

    private openSeedDescriptionModal(
        idMaterial: number,
        mode: 'create' | 'edit',
        seedData: any
    ): void {
        const dialogRef = this.dialog.open(SeddDescriptionComponent, {
          width: '900px',
          height: '90vh',
          disableClose: true,
          autoFocus: false,
          data: {
            id: idMaterial,
            mode: mode,
            seedData: seedData
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          this.loadSeedForCurrentMaterial();
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
                      this.loadSeedForCurrentMaterial();
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