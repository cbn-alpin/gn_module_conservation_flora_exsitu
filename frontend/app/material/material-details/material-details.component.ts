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
    private api: DataService
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


  onBack(): void {
    window.history.back();
  }

}