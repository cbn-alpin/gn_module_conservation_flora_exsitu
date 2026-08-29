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


  private toBoldText(value: string): string {
    const boldChars: Record<string, string> = {
      A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉',
      K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓',
      U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
      a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣',
      k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭',
      u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
      0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
    };

    return value.replace(/[A-Za-z0-9]/g, (char) => boldChars[char] || char);
  }


  private formatDateForToaster(value: any): string {
    if (!value) {
      return '-';
    }

    if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
    }

    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
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

              const actionTypeLabel =
                String(this.actionTypeLabel || '-').trim() || '-';

              const dateLabel =
                this.formatDateForToaster(
                  this.storageAction?.date_start
                );

              const storageLocation =
                String(this.placeLabel || '-').trim() || '-';


              this.toast
                .translateToaster(
                  'error',
                  `Action de stockage ${this.toBoldText(actionTypeLabel)} supprimée avec succès\nDate de début : ${this.toBoldText(dateLabel)}\nLieu de stockage associé : ${this.toBoldText(storageLocation)}`
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