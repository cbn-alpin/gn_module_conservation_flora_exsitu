import {
  Component,
  OnInit
} from '@angular/core';

import {
  MatTableDataSource
} from '@angular/material/table';

import {
  Router
} from '@angular/router';

import {
  CultureService
} from '../culture/culture.service';

import {
  ExsituFormService
} from '../form/shared/exsitu-form.service';

@Component({
  selector: 'app-culture-details',
  templateUrl: './culture-details.component.html',
  styleUrls: ['./culture-details.component.scss']
})
export class CultureDetailsComponent implements OnInit {

  idMaterial = 0;
  idCulture = 0;

  culture: any = null;

  /*
   * La partie Action de Culture sera développée plus tard.
   *
   * On conserve dès maintenant une source de données distincte
   * afin de ne surtout pas réutiliser les actions Semis/Test.
   */
  actionDataSource =
    new MatTableDataSource<any>([]);

  displayedActionColumns: string[] = [
    'date_start',
    'action_type',
    'actor',
    'actions'
  ];

  constructor(
    public router: Router,
    private cultureService: CultureService,
    private exsituFormService: ExsituFormService
  ) {}

  ngOnInit(): void {

    const urlSegments =
      this.router.url.split('/');

    const materialIndex =
      urlSegments.indexOf('material') + 1;

    const cultureIndex =
      urlSegments.indexOf('culture-details') + 1;

    this.idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(urlSegments[materialIndex])
        : 0;

    this.idCulture =
      cultureIndex > 0 &&
      cultureIndex < urlSegments.length
        ? Number(urlSegments[cultureIndex])
        : 0;

    if (
      !this.idMaterial ||
      !this.idCulture
    ) {
      return;
    }

    this.loadCultureDetails();
  }


  loadCultureDetails(): void {

    this.cultureService
      .getCultureById(this.idCulture)
      .subscribe({

        next: (culture) => {

          this.culture = culture;


          /*
          * Culture provenant d'un Semis.
          *
          * On restaure aussi le code du Semis
          * pour l'en-tête.
          */
          if (
            culture?.id_sowing
          ) {

            this.exsituFormService
              .setCultureSourceFromSowing(

                Number(
                  culture.id_sowing
                ),

                culture.source_code ||
                culture.code_sowing ||
                null

              );

            return;
          }

          /*
          * Culture provenant d'un Test
          * de germination.
          *
          * On restaure aussi le code du Test
          * pour l'en-tête.
          */
          if (
            culture?.id_test
          ) {

            this.exsituFormService
              .setCultureSourceFromTest(

                Number(
                  culture.id_test
                ),

                culture.source_code ||
                culture.code_test ||
                null

              );

            return;
          }


          /*
          * Culture créée directement
          * depuis le matériel récolté.
          */
          if (
            !culture?.id_sowing &&
            !culture?.id_test
          ) {

            this.exsituFormService
              .setCultureSourceFromMaterial();

          }

        },

        error: (err) => {
          console.error(
            'Erreur lors du chargement de la culture :',
            err
          );
        }

      });
  }


  getSourceLabel(): string {

    if (!this.culture) {
      return '-';
    }

    /*
    * Culture provenant d'un Semis
    */
    if (
      this.culture.source_type === 'sowing' ||
      this.culture.id_sowing
    ) {

      return (
        this.culture.source_code ||
        this.culture.code_sowing ||
        (
          this.culture.id_sowing
            ? `Semis n°${this.culture.id_sowing}`
            : '-'
        )
      );
    }


    /*
    * Culture provenant d'un Test de germination
    */
    if (
      this.culture.source_type === 'test' ||
      this.culture.id_test
    ) {

      return (
        this.culture.source_code ||
        this.culture.code_test ||
        (
          this.culture.id_test
            ? `Test n°${this.culture.id_test}`
            : '-'
        )
      );
    }


    /*
    * Culture provenant directement
    * du matériel récolté
    */
    return '-';
  }


  getSourceTypeLabel(): string {

    if (!this.culture) {
      return '-';
    }

    /*
    * On utilise en priorité source_type,
    * calculé directement par le backend.
    */
    if (
      this.culture.source_type === 'sowing' ||
      this.culture.id_sowing
    ) {
      return 'Semis';
    }

    if (
      this.culture.source_type === 'test' ||
      this.culture.id_test
    ) {
      return 'Test de germination';
    }

    /*
    * Culture créée directement
    * depuis Matériel récolté
    */
    return '-';
  }


  getStatusLabel(): string {

    if (!this.culture) {
      return '-';
    }

    return (
      this.culture.is_active ||
      !this.culture.date_end
    )
      ? 'Culture active'
      : 'Culture terminée';
  }


  getProgram(): string {

    return (
      this.culture?.additional_data?.program ||
      '-'
    );
  }


  onBack(): void {
    window.history.back();
  }

}