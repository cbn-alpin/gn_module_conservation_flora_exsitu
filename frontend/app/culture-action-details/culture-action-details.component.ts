import {
  Component,
  Inject,
  OnInit
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import {
  CultureService
} from '../culture/culture.service';


interface CultureActionDetailsDialogData {
  idAction: number;
  codeCulture?: string | null;
}


@Component({
  selector: 'app-culture-action-details',
  templateUrl:
    './culture-action-details.component.html',
  styleUrls: [
    './culture-action-details.component.scss'
  ]
})
export class CultureActionDetailsComponent
  implements OnInit {

  public transplantation: any = null;

  public isLoading = true;

  public errorMessage = '';


  constructor(
    public dialogRef:
      MatDialogRef<CultureActionDetailsComponent>,

    private cultureService:
      CultureService,

    @Inject(MAT_DIALOG_DATA)
    public dialogData:
      CultureActionDetailsDialogData
  ) {}


  ngOnInit(): void {
    this.loadDetails();
  }


  get substrates(): any[] {

    return Array.isArray(
      this.transplantation?.substrat
    )
      ? this.transplantation.substrat
      : [];
  }


  onClose(): void {
    this.dialogRef.close();
  }


  private loadDetails(): void {

    if (!this.dialogData?.idAction) {

      this.isLoading = false;

      this.errorMessage =
        'Identifiant de l’action manquant.';

      return;
    }


    this.cultureService
      .getCultureTransplantation(
        this.dialogData.idAction
      )
      .subscribe({

        next: (transplantation) => {

          this.transplantation =
            transplantation;

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'Erreur lors du chargement des détails de la transplantation :',
            error
          );

          this.errorMessage =
            'Impossible de charger les détails de cette transplantation.';

          this.isLoading = false;

        }

      });
  }

}