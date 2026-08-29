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
  ConstantsService
} from '../../services/constants.service';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  DialogService
} from '../../components/confirm-dialog/confirm-dialog.service';


@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css']
})
export class StockDetailsComponent implements OnInit {

  idMaterial: number = 0;

  idStorage: number = 0;

  placeCode: string = '';


  /*
   * Action complète sélectionnée.
   */
  storageAction: any = null;


  /*
   * Informations d'identification.
   */
  materialCode: string = '-';

  placeLabel: string = '-';

  actionTypeLabel: string = '-';


  /*
   * Libellés des nomenclatures
   * utilisées dans la fiche Stockage.
   */
  dryTypeLabel: string = '-';

  destockTypeLabel: string = '-';

  humidityLevelLabel: string = '-';

  humidityDeviceLabel: string = '-';


  constructor(
    private router: Router,
    private api: DataService,
    private constants: ConstantsService,
    private toast: CommonService,
    private dialogService: DialogService
  ) {}


  ngOnInit(): void {

    /*
     * Lors d'une navigation normale,
     * on récupère immédiatement l'action
     * sélectionnée dans la liste.
     */
    this.storageAction =
      window.history.state?.storageAction ||
      null;


    this.actionTypeLabel =
      this.storageAction?.action_type_label ||
      window.history.state?.actionTypeLabel ||
      '-';


    /*
     * Les données disponibles sont donc
     * affichées immédiatement sans attendre
     * une nouvelle requête API.
     */
    if (this.storageAction) {

      this.loadStorageNomenclatureLabels(
        this.storageAction
      );

    }


    /*
     * Les identifiants sont reconstruits depuis
     * l'URL afin que la page fonctionne également
     * après un rechargement F5.
     */
    const urlSegments =
      this.router.url
        .split('?')[0]
        .split('/');


    const materialIndex =
      urlSegments.indexOf('material') + 1;

    const storageIndex =
      urlSegments.indexOf('stock-details') + 1;

    const placeCodeIndex =
      urlSegments.indexOf('stock-details') + 2;


    this.idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(
            urlSegments[
              materialIndex
            ]
          )
        : 0;


    this.idStorage =
      storageIndex > 0 &&
      storageIndex < urlSegments.length
        ? Number(
            urlSegments[
              storageIndex
            ]
          )
        : 0;


    this.placeCode =
      placeCodeIndex > 0 &&
      placeCodeIndex < urlSegments.length
        ? urlSegments[
            placeCodeIndex
          ]
        : '';


    if (
      !this.idMaterial ||
      !this.idStorage ||
      !this.placeCode
    ) {

      console.error(
        'Informations de stockage manquantes dans l’URL.'
      );

      return;
    }


    this.placeLabel =
      this.getStoragePlaceLabel(
        this.placeCode
      );


    this.loadMaterialCode();

    this.loadStorageAction();
  }


  /* =========================================================
     MATÉRIEL RÉCOLTÉ ASSOCIÉ
     ========================================================= */

  private loadMaterialCode(): void {

    this.api
      .getMaterialInfos(
        this.idMaterial
      )
      .subscribe({

        next: (material: any) => {

          this.materialCode =
            material?.code_material || '-';

        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement du matériel récolté',
            error
          );


          this.materialCode = '-';

        }

      });
  }


  /* =========================================================
     LIEU DE STOCKAGE
     ========================================================= */

  private getStoragePlaceLabel(
    code: string
  ): string {

    if (
      code ===
      this.constants
        .PLACE_CODES
        .PRE_DRYING_ROOM
    ) {
      return 'Salle de pré-séchage';
    }


    if (
      code ===
      this.constants
        .PLACE_CODES
        .DRYING_ROOM
    ) {
      return 'Salle de séchage';
    }


    if (
      code ===
      this.constants
        .PLACE_CODES
        .COLD_ROOM
    ) {
      return 'Chambre froide';
    }


    if (
      code ===
      this.constants
        .PLACE_CODES
        .FREEZER
    ) {
      return 'Congélateur';
    }


    return '-';
  }


  /* =========================================================
     LIBELLÉS DES NOMENCLATURES DU STOCKAGE
     ========================================================= */

  private loadStorageNomenclatureLabels(
    action: any
  ): void {

    this.loadNomenclatureLabel(
      action?.id_dry_type,
      (label: string) => {
        this.dryTypeLabel =
          label;
      }
    );


    this.loadNomenclatureLabel(
      action?.id_destock,
      (label: string) => {
        this.destockTypeLabel =
          label;
      }
    );


    this.loadNomenclatureLabel(
      action?.id_humidity_level,
      (label: string) => {
        this.humidityLevelLabel =
          label;
      }
    );


    this.loadNomenclatureLabel(
      action?.id_humidity_device,
      (label: string) => {
        this.humidityDeviceLabel =
          label;
      }
    );

  }


  /* =========================================================
     ACTION DE STOCKAGE
     ========================================================= */

  private loadStorageAction(): void {

    const params =
      new HttpParams()
        .set(
          'page',
          '1'
        )
        .set(
          'limit',
          '1000'
        )
        .set(
          'placeCode',
          this.placeCode
        );


    this.api
      .getActions(
        this.idMaterial,
        params
      )
      .subscribe({

        next: (response: any) => {

          const actions =
            response?.items || [];


          const action =
            actions.find(
              (item: any) =>
                Number(
                  item?.id_storage
                ) ===
                this.idStorage
            );


          if (!action) {

            console.error(
              'Action de stockage introuvable.'
            );

            this.storageAction =
              null;

            this.actionTypeLabel =
              '-';

            return;
          }


          /*
           * On conserve l'action complète.
           */
          this.storageAction =
            action;


          this.actionTypeLabel =
            action?.action_type_label ||
            '-';


          /*
           * L'API de liste fournit déjà :
           *
           * - Type d'action
           * - Destination
           * - Effectué par
           *
           * Les autres champs de nomenclature
           * sont encore des IDs.
           *
           * On récupère donc leur libellé.
           */
          this.loadStorageNomenclatureLabels(
            action
          );

        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement de l’action de stockage',
            error
          );


          this.storageAction =
            null;

          this.actionTypeLabel =
            '-';

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
     DONNÉES SUPPLÉMENTAIRES
     ========================================================= */

  getAdditionalDataDisplay(): string {

    const additionalData =
      this.storageAction
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


  onDeleteStorage(): void {

    if (
      !this.idMaterial ||
      !this.idStorage
    ) {
      return;
    }


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'store',
        variant: 'stock',
        entityLabel:
          this.actionTypeLabel,
        entityDate:
          this.storageAction?.date_start,
        storageLocation:
          this.placeLabel,
        disableClose: false
      })
      .subscribe((yes) => {

        if (!yes) {
          return;
        }


        this.api
          .deleteAction(
            this.idMaterial,
            this.idStorage
          )
          .subscribe({

            next: () => {

              this.toast
                .translateToaster(
                  'info',
                  'Action supprimée avec succès'
                );


              const stockUrl =
                this.router.url
                  .split('?')[0]
                  .replace(
                    /\/stock-details\/[^/]+\/[^/]+$/,
                    '/stock'
                  );


              this.router.navigateByUrl(
                stockUrl
              );

            },

            error: (err) => {

              if (
                err?.status === 403 &&
                err?.error?.error
              ) {

                this.toast
                  .translateToaster(
                    'warning',
                    err.error.error
                  );


                return;
              }


              this.toast
                .translateToaster(
                  'warning',
                  'Erreur lors de la suppression de l\'action'
                );


              console.error(
                'Erreur lors de la suppression de l’action de stockage :',
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