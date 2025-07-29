
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExsituFormService } from '../exsitu-form.service';
import { DataService } from '../../../services/data.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';


@Component({
  selector: 'cs-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
    harvest: any;
    codeMaterial: string;
    private subscriptions: Subscription[] = [];
    taxonName: string; 
    taxonTooltip: string;


    constructor(
        public exsituFormService: ExsituFormService,
        public api: DataService
    ){

    }
    ngOnInit(): void {
      this.loadHarvest(this.exsituFormService.idHarvest);
  
      if (this.exsituFormService.idMaterial) {
        this.loadCodeMaterial();
      }
  
      const sub = this.exsituFormService.idMaterialChange.subscribe((idMaterial) => {
        if (idMaterial) {
          this.loadCodeMaterial();
        } else {
          this.codeMaterial = null;
          this.taxonName = null;
          this.taxonTooltip = null;
        }
      });
      this.subscriptions.push(sub);
    }

    loadHarvest(id_harvest){
      this.api.getHarvestInfos(id_harvest).subscribe((harvest) => {
        this.harvest = harvest
        
      });
    }

    loadCodeMaterial() {
      this.exsituFormService.materials$
        .pipe(take(1))
        .subscribe((materials) => {
          const idMat = this.exsituFormService.idMaterial;
          const material = materials.find(m => m.id_material === idMat);
  
          if (!material) {
            console.warn('⚠️ Matériel non trouvé dans materials$ pour id', idMat);
            return;
          }
  
          console.log('✅ Matériel trouvé :', material);
          this.codeMaterial = material.code_material;
  
          if (!material.taxons || material.taxons.length === 0) {
            console.warn('❌ Aucun taxon trouvé dans le matériel.');
            this.taxonName = '—';
            return;
          }
  
          const { taxonsDisplay, taxonsTooltip } = this.transformTaxons(material.taxons);
          this.taxonName = taxonsDisplay;
          this.taxonTooltip = taxonsTooltip;
          console.log('✅ Taxon affiché :', this.taxonName);
        });
    }
    

    transformTaxons(taxons: { cd_nom: number; nom_valide: string }[]): {
      taxonsDisplay: string;
      taxonsTooltip: string;
    } {
      const MAX_NAMES = 1;
  
      if (!taxons || taxons.length === 0) {
        return {
          taxonsDisplay: '',
          taxonsTooltip: ''
        };
      }
  
      const uniqueTaxons = Array.from(new Set(taxons.map((t) => t.nom_valide)));
  
      const taxonsTooltip = uniqueTaxons.join(' ... ').replace(/, ([^,]+)$/, ' & $1') + '.';
      let taxonsDisplay = uniqueTaxons.join('... ');
  
      if (uniqueTaxons.length > MAX_NAMES) {
        const firstTaxon = uniqueTaxons.slice(0, MAX_NAMES);
        taxonsDisplay = `${firstTaxon} (+${uniqueTaxons.length - MAX_NAMES})`;
      }
  
      return {
        taxonsDisplay,
        taxonsTooltip
      };
    }
  
    

    ngOnDestroy() {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}