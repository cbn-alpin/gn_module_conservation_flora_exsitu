import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener  } from '@angular/core';
import { MaterialListService } from './material-list.service';
import { combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { MaterialFormService } from '../material-form/material-form.service';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from '../../services/data.service';
import { HttpParams } from '@angular/common/http';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { TaxonModalComponent } from '../../components/modal-taxon/taxon-modal.component';
import { DialogService } from '../../components/confirm-dialog/confirm-dialog.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModalComponent } from '../../components/material-modal/material-modal.component';
import { ConstantsService } from '../../services/constants.service';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { CommonService } from '@geonature_common/service/common.service';


@Component({
    selector: 'cs-material-list',
    templateUrl: './material-list.component.html',
    styleUrls: ['./material-list.component.css'],
})
export class MaterialListComponent implements OnInit, AfterViewInit {
    public totalMaterials: number;
    pagination = { offset: 0, limit: 10 };
    rowPerPage = 5;

    @ViewChild('dataTable')
    dataTable: DatatableComponent;

    dataSource =
      new MatTableDataSource<any>();


    private paginatorRef!: MatPaginator;

    @ViewChild(MatPaginator)
    set paginator(
      paginator: MatPaginator
    ) {

      if (paginator) {

        this.paginatorRef =
          paginator;

        this.syncPaginator();

      }

    }


    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('dataTableContainer')
    dataTableContainer: ElementRef;


    displayedColumns: string[] = [
      'code_material',
      'taxons',
      'harvest_material',
      'code_cultural_bank',
      'code_material_parent',
      'actions'
    ];


    /*
     * Liste complète des matériels
     * de la récolte.
     */
    public allMaterials: any[] = [];


    /*
     * Filtres.
     */
    public materialCodeFilter = '';

    public materialTaxonFilter:
      string | null = null;

    public materialTypeFilter:
      string | null = null;

    public materialCulturalBankFilter:
      string | null = null;

    public materialParentFilter:
      string | null = null;


    /*
     * Options dynamiques.
     */
    public materialTaxonFilterOptions:
      string[] = [];

    public materialTypeFilterOptions:
      string[] = [];

    public materialCulturalBankFilterOptions:
      string[] = [];

    public materialParentFilterOptions:
      string[] = [];


    constructor(
        public materialListService: MaterialListService,
        public exsituFormService: ExsituFormService,
        private materialFormService: MaterialFormService,
        public dialog: MatDialog,
        private api: DataService,
        public mapListService: MapListService,
        private dialogService: DialogService,
        public constants: ConstantsService,
        public router: Router,
        public cfg: ConfigService,
        private toast: CommonService
        
    ){

    }

    ngOnInit(): void {

      combineLatest([
        this.exsituFormService.materials$,
        this.materialFormService.occurrence
      ])
        .pipe(
          filter(
            ([materials]) =>
              !!materials
          )
        )
        .subscribe(() => {

          /*
           * À chaque création,
           * modification ou suppression,
           * on recharge la liste complète.
           */
          this.loadMaterials();

        });

    }


    ngAfterViewInit(): void {
      this.syncPaginator();
    }


    private syncPaginator(): void {

      if (!this.paginatorRef) {
        return;
      }


      this.dataSource.paginator =
        this.paginatorRef;
    }


    /* =========================================================
       FILTRES DES MATÉRIELS RÉCOLTÉS
       ========================================================= */


    private getMaterialSimpleFilterValue(
      value: any
    ): string {

      const normalizedValue =
        this.removeHtml(
          value === null ||
          value === undefined
            ? ''
            : String(value)
        )
          .trim();


      return normalizedValue || '-';
    }


    private getMaterialTaxonFilterValues(
      material: any
    ): string[] {

      const values =
        (material?.taxons || [])
          .map(
            (taxon: any) =>
              String(
                taxon?.nom_valide || ''
              ).trim()
          )
          .filter(
            (value: string) =>
              !!value
          );


      if (values.length === 0) {
        return ['-'];
      }


      return Array.from(
        new Set(values)
      );
    }


    private getMaterialTypeFilterValue(
      material: any
    ): string {

      return this.getMaterialSimpleFilterValue(
        material?.harvest_material_label
      );
    }


    private getMaterialCulturalBankFilterValue(
      material: any
    ): string {

      return this.getMaterialSimpleFilterValue(
        material?.code_cultural_bank
      );
    }


    private getMaterialParentFilterValue(
      material: any
    ): string {

      return this.getMaterialSimpleFilterValue(
        material?.code_parent
      );
    }


    private sortMaterialFilterOptions(
      values: string[]
    ): string[] {

      return Array.from(
        new Set(values)
      )
        .sort(
          (a, b) => {

            /*
             * Les valeurs absentes sont
             * toujours proposées en premier.
             */
            if (a === '-') {
              return -1;
            }

            if (b === '-') {
              return 1;
            }


            return a.localeCompare(
              b,
              'fr'
            );

          }
        );
    }


    /*
     * Le N° récolte est le filtre texte de base.
     *
     * Il réduit également toutes les options
     * disponibles dans les quatre autres filtres.
     */
    private getMaterialMatchingCodeFilter():
      any[] {

      const normalizedCode =
        String(
          this.materialCodeFilter || ''
        )
          .trim()
          .toLowerCase();


      return this.allMaterials.filter(
        material => {

          const materialCode =
            this.removeHtml(
              String(
                material?.code_material || ''
              )
            )
              .trim()
              .toLowerCase();


          return (
            !normalizedCode ||
            materialCode.includes(
              normalizedCode
            )
          );

        }
      );
    }


    /*
     * Vérifie les quatre filtres dynamiques.
     *
     * ignoredFilter permet de calculer
     * les options d'un filtre en tenant compte
     * de tous les autres.
     */
    private materialMatchesDynamicFilters(
      material: any,
      ignoredFilter:
        'taxon' |
        'materialType' |
        'culturalBank' |
        'parent' |
        null = null
    ): boolean {

      const taxons =
        this.getMaterialTaxonFilterValues(
          material
        );

      const materialType =
        this.getMaterialTypeFilterValue(
          material
        );

      const culturalBank =
        this.getMaterialCulturalBankFilterValue(
          material
        );

      const parent =
        this.getMaterialParentFilterValue(
          material
        );


      const matchesTaxon =
        ignoredFilter === 'taxon' ||
        !this.materialTaxonFilter ||
        taxons.includes(
          this.materialTaxonFilter
        );


      const matchesMaterialType =
        ignoredFilter === 'materialType' ||
        !this.materialTypeFilter ||
        materialType ===
          this.materialTypeFilter;


      const matchesCulturalBank =
        ignoredFilter === 'culturalBank' ||
        !this.materialCulturalBankFilter ||
        culturalBank ===
          this.materialCulturalBankFilter;


      const matchesParent =
        ignoredFilter === 'parent' ||
        !this.materialParentFilter ||
        parent ===
          this.materialParentFilter;


      return (
        matchesTaxon &&
        matchesMaterialType &&
        matchesCulturalBank &&
        matchesParent
      );
    }


    private getMaterialFilterOptions(
      baseMaterials: any[],
      filterName:
        'taxon' |
        'materialType' |
        'culturalBank' |
        'parent'
    ): string[] {

      const compatibleMaterials =
        baseMaterials.filter(
          material =>
            this.materialMatchesDynamicFilters(
              material,
              filterName
            )
        );


      const values: string[] = [];


      compatibleMaterials.forEach(
        material => {

          if (filterName === 'taxon') {

            this.getMaterialTaxonFilterValues(
              material
            )
              .forEach(
                value =>
                  values.push(value)
              );

          }


          if (
            filterName ===
            'materialType'
          ) {

            values.push(
              this.getMaterialTypeFilterValue(
                material
              )
            );

          }


          if (
            filterName ===
            'culturalBank'
          ) {

            values.push(
              this.getMaterialCulturalBankFilterValue(
                material
              )
            );

          }


          if (filterName === 'parent') {

            values.push(
              this.getMaterialParentFilterValue(
                material
              )
            );

          }

        }
      );


      return this.sortMaterialFilterOptions(
        values
      );
    }


    /*
     * Recalcule les quatre listes en fonction
     * de tous les autres filtres.
     */
    private updateMaterialFilterOptions(
      baseMaterials: any[]
    ): void {

      const taxonOptions =
        this.getMaterialFilterOptions(
          baseMaterials,
          'taxon'
        );


      const materialTypeOptions =
        this.getMaterialFilterOptions(
          baseMaterials,
          'materialType'
        );


      const culturalBankOptions =
        this.getMaterialFilterOptions(
          baseMaterials,
          'culturalBank'
        );


      const parentOptions =
        this.getMaterialFilterOptions(
          baseMaterials,
          'parent'
        );


      let selectionChanged =
        false;


      /*
       * Une sélection devenue impossible
       * est automatiquement retirée.
       */
      if (
        this.materialTaxonFilter &&
        !taxonOptions.includes(
          this.materialTaxonFilter
        )
      ) {

        this.materialTaxonFilter =
          null;

        selectionChanged =
          true;

      }


      if (
        this.materialTypeFilter &&
        !materialTypeOptions.includes(
          this.materialTypeFilter
        )
      ) {

        this.materialTypeFilter =
          null;

        selectionChanged =
          true;

      }


      if (
        this.materialCulturalBankFilter &&
        !culturalBankOptions.includes(
          this.materialCulturalBankFilter
        )
      ) {

        this.materialCulturalBankFilter =
          null;

        selectionChanged =
          true;

      }


      if (
        this.materialParentFilter &&
        !parentOptions.includes(
          this.materialParentFilter
        )
      ) {

        this.materialParentFilter =
          null;

        selectionChanged =
          true;

      }


      /*
       * Si une sélection a été retirée,
       * on recalcule une dernière fois
       * avec le nouvel état.
       */
      if (selectionChanged) {

        this.updateMaterialFilterOptions(
          baseMaterials
        );

        return;

      }


      this.materialTaxonFilterOptions =
        taxonOptions;

      this.materialTypeFilterOptions =
        materialTypeOptions;

      this.materialCulturalBankFilterOptions =
        culturalBankOptions;

      this.materialParentFilterOptions =
        parentOptions;
    }


    public applyMaterialFilters(): void {

      /*
       * 1. N° récolte.
       */
      const baseMaterials =
        this.getMaterialMatchingCodeFilter();


      /*
       * 2. Mise à jour des options
       *    dynamiques.
       */
      this.updateMaterialFilterOptions(
        baseMaterials
      );


      /*
       * 3. Résultat final.
       */
      const filteredMaterials =
        baseMaterials.filter(
          material =>
            this.materialMatchesDynamicFilters(
              material
            )
        );


      this.dataSource.data =
        filteredMaterials;


      /*
       * La pagination travaille sur
       * le résultat filtré.
       *
       * Chaque changement de filtre
       * revient en page 1.
       */
      setTimeout(() => {

        this.syncPaginator();


        if (this.paginatorRef) {
          this.paginatorRef.firstPage();
        }

      });
    }


    public onMaterialCodeFilterChange(
      value: string
    ): void {

      this.materialCodeFilter =
        value || '';

      this.applyMaterialFilters();
    }


    public onMaterialTaxonFilterChange(
      value: string | null
    ): void {

      this.materialTaxonFilter =
        value;

      this.applyMaterialFilters();
    }


    public onMaterialTypeFilterChange(
      value: string | null
    ): void {

      this.materialTypeFilter =
        value;

      this.applyMaterialFilters();
    }


    public onMaterialCulturalBankFilterChange(
      value: string | null
    ): void {

      this.materialCulturalBankFilter =
        value;

      this.applyMaterialFilters();
    }


    public onMaterialParentFilterChange(
      value: string | null
    ): void {

      this.materialParentFilter =
        value;

      this.applyMaterialFilters();
    }


    public resetMaterialFilters(): void {

      this.materialCodeFilter = '';

      this.materialTaxonFilter =
        null;

      this.materialTypeFilter =
        null;

      this.materialCulturalBankFilter =
        null;

      this.materialParentFilter =
        null;


      this.applyMaterialFilters();
    }


    onBackToHarvest(): void {
      const idHarvest =
        this.exsituFormService.idHarvest;

      if (!idHarvest) {
        console.error(
          'Impossible de revenir à la récolte : idHarvest manquant.'
        );

        return;
      }

      this.exsituFormService.currentTab =
        'harvest';

      this.router.navigate([
        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}`
      ]);
    }

    onChangePage(event) {
      this.pagination.offset = event.offset;
      this.loadMaterials();
    }


    removeHtml(str: string | undefined): string {
        return str ? str.replace(/<[^>]*>/g, '') : '';
    }
    
    materialTitle(material) {
        return this.removeHtml(material.code_material);
    }

    editOccurrence(occurrence) {
      this.exsituFormService.setIdMaterial(occurrence.id_material);
      this.exsituFormService.mode = 'edit'      
      this.materialFormService.occurrence.next(occurrence);
      this.addModalMaterial();
    }

    private toBoldText(value: string): string {
      const boldItalicChars: Record<string, string> = {
        A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
        K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
        U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
        a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
        k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
        u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
        0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
      };

      return value.replace(
        /[A-Za-z0-9]/g,
        (char) =>
          boldItalicChars[char] ||
          char
      );
    }


    private getMaterialDeleteDependencies(
      source: any
    ): string[] {

      const linkedItems: string[] = [];


      const addCount = (
        countValue: any,
        singularLabel: string,
        pluralLabel: string
      ): void => {

        const count =
          Number(
            countValue || 0
          );


        if (count <= 0) {
          return;
        }


        linkedItems.push(
          `${this.toBoldText(
            String(count)
          )} ${
            count > 1
              ? pluralLabel
              : singularLabel
          }`
        );
      };


      if (source?.has_seed_description) {

        linkedItems.push(
          `${this.toBoldText('1')} fiche semence liée`
        );

      }


      addCount(
        source?.storage_count,
        'stockage lié',
        'stockages liés'
      );


      addCount(
        source?.germination_test_count,
        'test de germination lié',
        'tests de germination liés'
      );


      addCount(
        source?.viability_test_count,
        'test de viabilité lié',
        'tests de viabilité liés'
      );


      addCount(
        source?.sowing_count,
        'semis lié',
        'semis liés'
      );


      addCount(
        source?.culture_count,
        'culture liée',
        'cultures liées'
      );


      return linkedItems;
    }


    private showMaterialDeleteBlockedWarning(
      occurrence: any
    ): void {

      const currentCode =
        this.removeHtml(
          occurrence?.code_material
        );


      const linkedItems =
        this.getMaterialDeleteDependencies(
          occurrence
        );


      if (linkedItems.length === 0) {
        return;
      }


      const linkedContent =
        linkedItems.length === 1
          ? linkedItems[0]
          : `${
              linkedItems
                .slice(0, -1)
                .join(', ')
            } et ${
              linkedItems[
                linkedItems.length - 1
              ]
            }`;


      this.toast.translateToaster(
        'warning',
        `Suppression impossible : le matériel récolté ${
          this.toBoldText(
            currentCode
          )
        } contient ${linkedContent}. Supprimez d'abord les éléments liés à ce matériel récolté.`
      );
    }


    deleteOccurrence(occurrence) {

      const linkedDependencies =
        this.getMaterialDeleteDependencies(
          occurrence
        );


      if (linkedDependencies.length > 0) {

        this.showMaterialDeleteBlockedWarning(
          occurrence
        );


        return;
      }


      const hasLinkedTaxons =
        occurrence.taxons
        && occurrence.taxons.length > 0;


      this.dialogService
        .confirmDialog({
          message: '',
          icon: 'spa',
          variant: 'material',
          entityCode: this.removeHtml(occurrence.code_material),
          warningMessage: hasLinkedTaxons
            ? 'Ce matériel est lié à un ou plusieurs taxons.'
            : undefined,
          disableClose: false
        })
        .subscribe((yes) => {

          if (!yes) {
            return;
          }


          this.materialFormService
            .deleteOccurrence(
              occurrence
            )
            .subscribe({

              error: (err) => {

                if (err?.status === 409) {

                  this.showMaterialDeleteBlockedWarning({
                    ...occurrence,
                    ...err?.error
                  });


                  return;
                }


                console.error(
                  'Erreur lors de la suppression du matériel récolté :',
                  err
                );

              }

            });

        });
    }

    onPaginateChange(){
      this.loadMaterials();
    }

    loadMaterials(): void {

      const idHarvest =
        this.exsituFormService.idHarvest;


      if (!idHarvest) {

        this.totalMaterials = 0;

        this.allMaterials = [];

        this.dataSource.data = [];

        return;

      }


      /*
       * Premier appel :
       * récupérer le nombre total de matériels.
       */
      const countParams =
        new HttpParams()
          .set('page', 1)
          .set('limit', 1);


      this.api
        .getMaterialsByHarvest(
          idHarvest,
          countParams
        )
        .subscribe({

          next: (
            firstResponse: any
          ) => {

            const total =
              Number(
                firstResponse?.['total'] || 0
              );


            this.totalMaterials =
              total;


            if (total === 0) {

              this.allMaterials = [];

              this.dataSource.data = [];

              return;

            }


            /*
             * Deuxième appel :
             * récupérer TOUS les matériels
             * pour que les filtres travaillent
             * sur toute la liste.
             */
            const allParams =
              new HttpParams()
                .set('page', 1)
                .set('limit', total);


            this.api
              .getMaterialsByHarvest(
                idHarvest,
                allParams
              )
              .subscribe({

                next: (
                  response: any
                ) => {

                  const transformedMaterials =
                    (
                      response?.['materials'] || []
                    )
                      .map(
                        material => {

                          const {
                            taxonsDisplay,
                            taxonsTooltip
                          } =
                            this.transformTaxons(
                              material.taxons
                            );


                          return {
                            ...material,
                            taxonsDisplay,
                            taxonsTooltip
                          };

                        }
                      );


                  /*
                   * Source complète pour les filtres.
                   */
                  this.allMaterials =
                    transformedMaterials;


                  /*
                   * Le tableau reçoit ensuite
                   * le résultat des filtres.
                   */
                  this.applyMaterialFilters();

                },

                error: (
                  error
                ) => {

                  console.error(
                    'Erreur lors du chargement des matériels récoltés :',
                    error
                  );

                  this.allMaterials = [];

                  this.dataSource.data = [];

                }

              });

          },

          error: (
            error
          ) => {

            console.error(
              'Erreur lors du chargement des matériels récoltés :',
              error
            );

            this.allMaterials = [];

            this.dataSource.data = [];

          }

        });
    }

    transformTaxons(taxons: { cd_nom: number; nom_valide: string }[]): { 
      taxonsDisplay: string, 
      taxonsTooltip: string 
    } {
      const MAX_NAMES = 1;
    
      if (!taxons || taxons.length === 0) {
        return {
          taxonsDisplay: '',
          taxonsTooltip: ''
        };
      }
    
      // Extraire uniquement les `nom_valide`
      const uniqueTaxons = Array.from(new Set(taxons.map(t => t.nom_valide)));
    
      // Construire l'affichage des taxons sans points de suspension
      const taxonsTooltip =
        uniqueTaxons.join(', ') + '.';

      let taxonsDisplay =
        uniqueTaxons.join(', ');
    
      if (uniqueTaxons.length > MAX_NAMES) {
        const firstTaxon =
          uniqueTaxons.slice(0, MAX_NAMES);

        taxonsDisplay =
          `${firstTaxon} (+${uniqueTaxons.length - MAX_NAMES})`;
      }
    
      return {
        taxonsDisplay,
        taxonsTooltip
      };
    }
    
    addModalMaterial(): void {
      const dialogRef = this.dialog.open(MaterialModalComponent, {
        width: '900px',
        height: '90vh',
        disableClose: true,
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          
        }
      });
    }


    goToMaterialDetails(material: any): void {
      const idMaterial =
        Number(material?.id_material);

      const idHarvest =
        this.exsituFormService.idHarvest;


      if (
        !idMaterial ||
        !idHarvest
      ) {
        console.error(
          'Impossible d’ouvrir les détails du matériel récolté : identifiant manquant.'
        );

        return;
      }


      this.exsituFormService
        .setIdMaterial(idMaterial);

      this.exsituFormService.currentTab =
        'material-details';


      this.router.navigate([
        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/material-details`
      ]);
    }


    goToStock(material: any) {
      const idMaterial = material.id_material
      this.exsituFormService.setIdMaterial(idMaterial);
      this.router.navigate([`${this.cfg.getModuleUrl()}/form/harvest/${this.exsituFormService.idHarvest}/material/${idMaterial}/stock`]);
    }

    selectMaterial(
      material: any
    ): void {

      const idMaterial =
        Number(
          material?.id_material
        );

      if (!idMaterial) {
        return;
      }


      /*
      * Le clic sur une ligne sélectionne
      * uniquement le matériel récolté.
      *
      * L'ouverture de la fiche détail reste
      * réservée au bouton Détails/Action.
      */
      this.exsituFormService
        .setIdMaterial(
          idMaterial
        );
    }

    goToCulture(material: any): void {

      const idMaterial =
        material?.id_material;

      const idHarvest =
        this.exsituFormService.idHarvest;


      if (!idMaterial || !idHarvest) {

        console.error(
          'Impossible d’ouvrir Culture : identifiant du matériel ou de la récolte manquant.'
        );

        return;
      }


      this.exsituFormService.setIdMaterial(
        idMaterial
      );


      /*
      * Culture ouverte directement depuis
      * Matériel récolté.
      *
      * Aucun Semis ni Test n'est associé.
      */
      this.exsituFormService
        .setCultureSourceFromMaterial();


      this.exsituFormService.currentTab =
        'culture-table';


      this.router.navigate([

        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/culture-table`

      ]);
    }

    goToSeedDetails(material: any): void {
      const idMaterial =
        Number(
          material?.id_material
        );


      const idHarvest =
        this.exsituFormService.idHarvest;


      if (
        !idMaterial ||
        !idHarvest
      ) {
        return;
      }


      this.exsituFormService
        .setIdMaterial(
          idMaterial
        );


      this.exsituFormService.currentTab =
        'seed';


      /*
       * La page Semence gère les deux cas :
       * - une fiche Semence existe déjà ;
       * - aucune fiche Semence n'existe encore.
       */
      this.router.navigate([
        `${this.cfg.getModuleUrl()}/form/harvest/${idHarvest}/material/${idMaterial}/seed-details`
      ]);
    }
    
}
