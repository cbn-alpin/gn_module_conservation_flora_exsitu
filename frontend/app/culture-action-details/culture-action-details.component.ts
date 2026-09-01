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

import {
  Observable
} from 'rxjs';





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
  actionTypeCode: string | null = null;

  @Input()
  refreshKey = 0;

  @Output()
  hideDetails =
    new EventEmitter<void>();


  public actionDetails: any = null;

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
      (
        changes['actionId'] ||
        changes['actionTypeCode'] ||
        changes['refreshKey']
      ) &&
      this.actionId &&
      this.actionTypeCode
    ) {
      this.loadDetails(this.actionId);
    }
  }


  get normalizedActionTypeCode(): string {

    return String(
      this.actionTypeCode ||
      ''
    )
      .trim()
      .toLowerCase();
  }


  get actionTypeLabel(): string {

    switch (
      this.normalizedActionTypeCode
    ) {

      case 'transp':
        return 'Transplantation';

      case 'obs':
        return 'Observation';

      case 'tracult':
        return 'Traitement';

      case 'prel':
        return 'Prélèvement';

      default:
        return '-';
    }
  }


  get isTransplantation(): boolean {
    return (
      this.normalizedActionTypeCode ===
      'transp'
    );
  }


  get isObservation(): boolean {
    return (
      this.normalizedActionTypeCode ===
      'obs'
    );
  }


  get isTreatment(): boolean {
    return (
      this.normalizedActionTypeCode ===
      'tracult'
    );
  }


  get isSampling(): boolean {
    return (
      this.normalizedActionTypeCode ===
      'prel'
    );
  }


  get substrates(): any[] {

    return Array.isArray(
      this.actionDetails?.substrat
    )
      ? this.actionDetails.substrat
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


  formatSuccess(
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


  onHideDetails(): void {
    this.hideDetails.emit();
  }


  private loadDetails(
    idAction: number
  ): void {

    this.errorMessage = '';
    this.isLoading = true;
    this.actionDetails = null;


    let actionRequest: Observable<any>;


    switch (
      this.normalizedActionTypeCode
    ) {

      case 'transp':
        actionRequest =
          this.cultureService
            .getCultureTransplantation(
              idAction
            );
        break;

      case 'obs':
        actionRequest =
          this.cultureService
            .getCultureObservation(
              idAction
            );
        break;

      case 'tracult':
        actionRequest =
          this.cultureService
            .getCultureTreatment(
              idAction
            );
        break;

      case 'prel':
        actionRequest =
          this.cultureService
            .getCultureSampling(
              idAction
            );
        break;

      default:
        this.errorMessage =
          'Type d’action de culture non pris en charge.';
        this.isLoading = false;
        return;
    }


    actionRequest
      .subscribe({

        next: (actionDetails) => {

          if (this.actionId !== idAction) {
            return;
          }

          this.actionDetails =
            actionDetails;

          this.isLoading = false;

        },

        error: (error) => {

          if (this.actionId !== idAction) {
            return;
          }

          console.error(
            'Erreur lors du chargement des détails de l’action de culture :',
            error
          );

          this.errorMessage =
            'Impossible de charger les détails de cette action de culture.';

          this.isLoading = false;

        }

      });
  }

}