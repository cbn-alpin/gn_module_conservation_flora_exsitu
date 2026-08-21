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
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css']
})
export class StockDetailsComponent implements OnInit {

  idMaterial: number = 0;

  idStorage: number = 0;

  placeCode: string = '';

  actionTypeLabel: string = '-';


  constructor(
    private router: Router,
    private api: DataService
  ) {}


  ngOnInit(): void {

    /*
     * On conserve le libellé transmis lors du clic
     * pour l'afficher immédiatement.
     */
    this.actionTypeLabel =
      window.history.state?.actionTypeLabel || '-';


    /*
     * Puis on récupère toutes les informations
     * nécessaires directement depuis l'URL.
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
        ? Number(urlSegments[materialIndex])
        : 0;


    this.idStorage =
      storageIndex > 0 &&
      storageIndex < urlSegments.length
        ? Number(urlSegments[storageIndex])
        : 0;


    this.placeCode =
      placeCodeIndex > 0 &&
      placeCodeIndex < urlSegments.length
        ? urlSegments[placeCodeIndex]
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


    this.loadStorageAction();
  }


  private loadStorageAction(): void {

    const params =
      new HttpParams()
        .set('page', '1')
        .set('limit', '1000')
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
                Number(item?.id_storage) ===
                this.idStorage
            );


          this.actionTypeLabel =
            action?.action_type_label || '-';
        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement de l’action de stockage',
            error
          );

          this.actionTypeLabel = '-';
        }

      });
  }


  onBack(): void {
    window.history.back();
  }

}