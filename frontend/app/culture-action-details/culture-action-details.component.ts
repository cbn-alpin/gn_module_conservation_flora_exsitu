import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  CultureService
} from '../culture/culture.service';





@Component({
  selector: 'app-culture-action-details',
  templateUrl:
    './culture-action-details.component.html',
  styleUrls: [
    './culture-action-details.component.scss'
  ]
})
export class CultureActionDetailsComponent
  implements OnInit, OnChanges {

  @Input()
  actionId: number | null = null;

  @Input()
  codeCulture: string | null = null;

  @Input()
  refreshKey = 0;

  @Output()
  hideDetails =
    new EventEmitter<void>();


  public transplantation: any = null;

  public isLoading = true;

  public errorMessage = '';


  constructor(
    private cultureService:
      CultureService
  ) {}


  ngOnInit(): void {
    this.loadDetails();
  }


  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['actionId']?.firstChange &&
      changes['refreshKey']?.firstChange
    ) {
      return;
    }


    if (
      changes['actionId'] ||
      changes['refreshKey']
    ) {
      this.loadDetails();
    }
  }


  get substrates(): any[] {

    return Array.isArray(
      this.transplantation?.substrat
    )
      ? this.transplantation.substrat
      : [];
  }


  onHideDetails(): void {
    this.hideDetails.emit();
  }


  private loadDetails(): void {

    if (!this.actionId) {

      this.isLoading = false;

      this.errorMessage =
        'Identifiant de l’action manquant.';

      return;
    }


    this.isLoading = true;

    this.errorMessage = '';


    this.cultureService
      .getCultureTransplantation(
        this.actionId
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