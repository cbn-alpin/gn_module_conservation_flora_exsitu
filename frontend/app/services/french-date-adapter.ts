import {
  Inject,
  Injectable,
  Optional
} from '@angular/core';

import {
  MAT_DATE_LOCALE,
  NativeDateAdapter
} from '@angular/material/core';

import {
  Platform
} from '@angular/cdk/platform';


@Injectable()
export class FrenchDateAdapter
  extends NativeDateAdapter {

  constructor(
    @Optional()
    @Inject(MAT_DATE_LOCALE)
    matDateLocale: string,

    platform: Platform
  ) {
    super(
      matDateLocale || 'fr-FR',
      platform
    );
  }


  /**
   * Accepte correctement :
   *
   * 21/07/2026
   * 1/7/2026
   * 2026-07-21
   *
   * Une saisie temporairement incomplète
   * reste invalide jusqu'à ce qu'elle soit
   * de nouveau complète.
   */
  parse(value: any): Date | null {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }


    if (value instanceof Date) {

      return this.isValid(value)
        ? value
        : this.invalid();

    }


    if (typeof value !== 'string') {
      return super.parse(value);
    }


    const text = value.trim();

    if (!text) {
      return null;
    }


    /*
     * Format français :
     * JJ/MM/AAAA
     */
    const frenchMatch =
      text.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );

    if (frenchMatch) {

      const day =
        Number(frenchMatch[1]);

      const month =
        Number(frenchMatch[2]);

      const year =
        Number(frenchMatch[3]);


      return this.createValidDate(
        year,
        month,
        day
      );

    }


    /*
     * Format ISO :
     * AAAA-MM-JJ
     *
     * Conservé pour rester compatible
     * avec les données provenant de l'API.
     */
    const isoMatch =
      text.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      );

    if (isoMatch) {

      const year =
        Number(isoMatch[1]);

      const month =
        Number(isoMatch[2]);

      const day =
        Number(isoMatch[3]);


      return this.createValidDate(
        year,
        month,
        day
      );

    }


    /*
     * Une chaîne non reconnue reste
     * explicitement invalide.
     */
    return this.invalid();
  }


  private createValidDate(
    year: number,
    month: number,
    day: number
  ): Date {

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return this.invalid();
    }


    const date =
      new Date(0);


    date.setFullYear(
      year,
      month - 1,
      day
    );

    date.setHours(
      0,
      0,
      0,
      0
    );


    /*
     * Empêche par exemple :
     *
     * 31/02/2026
     *
     * d'être automatiquement transformé
     * en une date du mois de mars.
     */
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return this.invalid();
    }


    return date;
  }

}