import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
  implements OnChanges {

  @Input()
  actionId: number | null = null;

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


  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      (changes['actionId'] || changes['refreshKey']) &&
      this.actionId
    ) {
      this.loadDetails(this.actionId);
    }
  }


  get substrates(): any[] {

    return Array.isArray(
      this.transplantation?.substrat
    )
      ? this.transplantation.substrat
      : [];
  }


  get substratePercentageTotal(): number {

    return this.substrates.reduce(
      (total: number, substrate: any) => {

        const rawPercentage =
          substrate?.percentage;

        if (
          rawPercentage === null ||
          rawPercentage === undefined ||
          rawPercentage === ''
        ) {
          return total;
        }

        const percentage =
          Number(rawPercentage);

        return Number.isFinite(percentage)
          ? total + percentage
          : total;
      },
      0
    );
  }


  formatSubstrateCategory(
    value: any
  ): string {

    if (value === 'principal') {
      return 'Principal';
    }

    if (value === 'secondary') {
      return 'Secondaire';
    }

    return value || '-';
  }


  onHideDetails(): void {
    this.hideDetails.emit();
  }


  private loadDetails(
    idAction: number
  ): void {

    this.errorMessage = '';


    this.cultureService
      .getCultureTransplantation(
        idAction
      )
      .subscribe({

        next: (transplantation) => {

          if (this.actionId !== idAction) {
            return;
          }

          this.transplantation =
            transplantation;

          this.isLoading = false;

        },

        error: (error) => {

          if (this.actionId !== idAction) {
            return;
          }

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