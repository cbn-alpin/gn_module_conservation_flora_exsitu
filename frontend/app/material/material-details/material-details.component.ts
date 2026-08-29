import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  HttpParams
} from '@angular/common/http';

import {
  DataService
} from '../../services/data.service';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  DialogService
} from '../../components/confirm-dialog/confirm-dialog.service';

import {
  ExsituFormService
} from '../../form/shared/exsitu-form.service';

import {
  MaterialFormService
} from '../material-form/material-form.service';


@Component({
  selector: 'app-material-details',
  templateUrl: './material-details.component.html',
  styleUrls: ['./material-details.component.css']
})
export class MaterialDetailsComponent implements OnInit {

  idHarvest: number = 0;

  idMaterial: number = 0;


  /*
   * Matériel récolté complet.
   */
  material: any = null;


  /*
   * Numéro affiché dans le bandeau.
   */
  codeMaterial: string = '-';


  /*
   * Taxon(s).
   */
  taxonsLabel: string = '-';


  /*
   * Libellés des nomenclatures.
   */
  materialTypeLabel: string = '-';

  footCountingClassLabel: string = '-';

  methodSampleLabel: string = '-';

  phenology1Label: string = '-';

  phenology2Label: string = '-';


  constructor(
    private router: Router,
    private api: DataService,
    private toast: CommonService,
    private dialogService: DialogService,
    private exsituFormService: ExsituFormService,
    private materialFormService: MaterialFormService
  ) {}


  ngOnInit(): void {

    /*
     * Lecture directe de l'URL pour que
     * la page fonctionne aussi après F5.
     */
    const urlSegments =
      this.router.url
        .split('?')[0]
        .split('/');


    const harvestIndex =
      urlSegments.indexOf(
        'harvest'
      ) + 1;


    const materialIndex =
      urlSegments.indexOf(
        'material'
      ) + 1;


    this.idHarvest =
      harvestIndex > 0 &&
      harvestIndex < urlSegments.length
        ? Number(
            urlSegments[
              harvestIndex
            ]
          )
        : 0;


    this.idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(
            urlSegments[
              materialIndex
            ]
          )
        : 0;


    if (
      !this.idHarvest ||
      !this.idMaterial
    ) {

      console.error(
        'Impossible de charger le détail du matériel récolté : identifiant manquant.'
      );

      return;
    }


    this.loadMaterialDetails();
  }


  /* =========================================================
     CHARGEMENT DU MATÉRIEL RÉCOLTÉ
     ========================================================= */

  private loadMaterialDetails(): void {

    /*
     * Premier appel :
     * connaître le nombre total de matériels
     * de la récolte.
     */
    const countParams =
      new HttpParams()
        .set(
          'page',
          '1'
        )
        .set(
          'limit',
          '1'
        );


    this.api
      .getMaterialsByHarvest(
        this.idHarvest,
        countParams
      )
      .subscribe({

        next: (
          firstResponse: any
        ) => {

          const total =
            Number(
              firstResponse?.total ||
              0
            );


          if (total === 0) {

            console.error(
              'Aucun matériel récolté trouvé.'
            );

            return;
          }


          /*
           * Deuxième appel :
           * récupération de tous les matériels
           * afin de retrouver celui affiché.
           */
          const allParams =
            new HttpParams()
              .set(
                'page',
                '1'
              )
              .set(
                'limit',
                String(total)
              );


          this.api
            .getMaterialsByHarvest(
              this.idHarvest,
              allParams
            )
            .subscribe({

              next: (
                response: any
              ) => {

                const materials =
                  response?.materials ||
                  [];


                const material =
                  materials.find(
                    (item: any) =>
                      Number(
                        item?.id_material
                      ) ===
                      this.idMaterial
                  );


                if (!material) {

                  console.error(
                    'Matériel récolté introuvable.'
                  );

                  return;
                }


                this.material =
                  material;


                this.codeMaterial =
                  material?.code_material ||
                  '-';


                /*
                 * Taxon (nom cité).
                 */
                const taxons =
                  (
                    material?.taxons ||
                    []
                  )
                    .map(
                      (taxon: any) =>
                        taxon?.nom_valide
                    )
                    .filter(
                      (value: any) =>
                        !!value
                    );


                this.taxonsLabel =
                  taxons.length > 0
                    ? taxons.join(', ')
                    : '-';


                /*
                 * Matériel végétal récolté.
                 *
                 * Son libellé est déjà renvoyé
                 * par la liste des matériels.
                 */
                this.materialTypeLabel =
                  material
                    ?.harvest_material_label ||
                  '-';


                /*
                 * Classes d'individus.
                 */
                this.loadNomenclatureLabel(
                  material
                    ?.id_foot_counting_class,
                  (
                    label: string
                  ) => {

                    this.footCountingClassLabel =
                      label;

                  }
                );


                /*
                 * Mode d'échantillonnage.
                 */
                this.loadNomenclatureLabel(
                  material
                    ?.id_method_sample,
                  (
                    label: string
                  ) => {

                    this.methodSampleLabel =
                      label;

                  }
                );


                /*
                 * Phénologie 1.
                 */
                this.loadNomenclatureLabel(
                  material
                    ?.id_phenology_1,
                  (
                    label: string
                  ) => {

                    this.phenology1Label =
                      label;

                  }
                );


                /*
                 * Phénologie 2.
                 */
                this.loadNomenclatureLabel(
                  material
                    ?.id_phenology_2,
                  (
                    label: string
                  ) => {

                    this.phenology2Label =
                      label;

                  }
                );

              },

              error: (
                error
              ) => {

                console.error(
                  'Erreur lors du chargement du matériel récolté',
                  error
                );

              }

            });

        },

        error: (
          error
        ) => {

          console.error(
            'Erreur lors du chargement des matériels récoltés',
            error
          );

        }

      });
  }


  /* =========================================================
     LIBELLÉ D'UNE NOMENCLATURE
     ========================================================= */

  private loadNomenclatureLabel(
    idNomenclature: any,
    assignLabel: (
      label: string
    ) => void
  ): void {

    const id =
      Number(
        idNomenclature
      );


    if (!id) {

      assignLabel('-');

      return;
    }


    this.api
      .getNomenclatureDetails(
        id
      )
      .subscribe({

        next: (
          nomenclature: any
        ) => {

          assignLabel(
            nomenclature
              ?.label_default ||
            '-'
          );

        },

        error: () => {

          assignLabel('-');

        }

      });
  }


  /* =========================================================
     OUI / NON
     ========================================================= */

  getBooleanLabel(
    value: any
  ): string {

    if (value === true) {
      return 'Oui';
    }


    if (value === false) {
      return 'Non';
    }


    return '-';
  }


  /* =========================================================
     DONNÉES SUPPLÉMENTAIRES
     ========================================================= */

  getAdditionalDataDisplay(): string {

    const additionalData =
      this.material
        ?.additional_data;


    if (!additionalData) {
      return '-';
    }


    if (
      typeof additionalData !==
      'object'
    ) {

      return String(
        additionalData
      );

    }


    const keys =
      Object.keys(
        additionalData
      );


    if (keys.length === 0) {
      return '-';
    }


    return keys
      .map(
        key => {

          const value =
            additionalData[
              key
            ];


          if (
            value === null ||
            value === undefined ||
            value === ''
          ) {

            return `${key} : -`;

          }


          if (
            typeof value ===
            'object'
          ) {

            return (
              `${key} : ` +
              JSON.stringify(
                value
              )
            );

          }


          return (
            `${key} : ${value}`
          );

        }
      )
      .join('\n');
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
    source: any
  ): void {

    const linkedItems =
      this.getMaterialDeleteDependencies(
        source
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
          this.codeMaterial || ''
        )
      } contient ${linkedContent}. Supprimez d'abord les éléments liés à ce matériel récolté.`
    );
  }


  onDeleteMaterial(): void {

    if (
      !this.idMaterial ||
      !this.material
    ) {
      return;
    }


    const linkedDependencies =
      this.getMaterialDeleteDependencies(
        this.material
      );


    if (linkedDependencies.length > 0) {

      this.showMaterialDeleteBlockedWarning(
        this.material
      );

      return;
    }


    const hasLinkedTaxons =
      this.material?.taxons &&
      this.material.taxons.length > 0;


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'spa',
        variant: 'material',
        entityCode:
          this.codeMaterial || '',
        warningMessage:
          hasLinkedTaxons
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
            this.material
          )
          .subscribe({

            next: () => {

              this.exsituFormService
                .setIdMaterial(
                  null
                );

              this.exsituFormService.currentTab =
                'materials';


              const materialsUrl =
                this.router.url
                  .split('?')[0]
                  .replace(
                    /\/material\/[^/]+\/material-details$/,
                    '/material-form'
                  );


              this.router.navigateByUrl(
                materialsUrl
              );

            },

            error: (err) => {

              if (err?.status === 409) {

                this.showMaterialDeleteBlockedWarning({
                  ...this.material,
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

  onBack(): void {
    window.history.back();
  }

}