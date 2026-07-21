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
    private cultureService: CultureService
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

    if (this.culture.source_code) {
      return this.culture.source_code;
    }

    if (this.culture.id_sowing) {
      return (
        this.culture.code_sowing ||
        `Semis n°${this.culture.id_sowing}`
      );
    }

    if (this.culture.id_test) {
      return (
        this.culture.code_test ||
        `Test n°${this.culture.id_test}`
      );
    }

    return '-';
  }


  getSourceTypeLabel(): string {

    if (!this.culture) {
      return '-';
    }

    if (this.culture.id_sowing) {
      return 'Semis';
    }

    if (this.culture.id_test) {
      return 'Test de viabilité';
    }

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