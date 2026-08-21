import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  DataService
} from '../../services/data.service';


@Component({
  selector: 'app-material-details',
  templateUrl: './material-details.component.html',
  styleUrls: ['./material-details.component.css']
})
export class MaterialDetailsComponent implements OnInit {

  codeMaterial: string = '-';


  constructor(
    private router: Router,
    private api: DataService
  ) {}


  ngOnInit(): void {
    const urlSegments =
      this.router.url.split('/');

    const materialIndex =
      urlSegments.indexOf('material') + 1;

    const idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(urlSegments[materialIndex])
        : 0;


    if (!idMaterial) {
      return;
    }


    this.api
      .getMaterialInfos(idMaterial)
      .subscribe({
        next: (material) => {
          this.codeMaterial =
            material?.code_material || '-';
        },

        error: (error) => {
          console.error(
            'Erreur lors de la récupération du matériel récolté',
            error
          );

          this.codeMaterial = '-';
        }
      });
  }


  onBack(): void {
    window.history.back();
  }

}