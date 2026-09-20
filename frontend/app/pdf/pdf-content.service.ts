import {
  Injectable
} from '@angular/core';

import {
  PdfDetailMode,
  PdfField,
  PdfSection
} from './pdf.models';


@Injectable({
  providedIn: 'root'
})
export class PdfContentService {

  extractSections(
    rootSelector: string,
    mode: PdfDetailMode = 'standard'
  ): PdfSection[] {

    if (!rootSelector) {
      return [];
    }


    const root =
      document.querySelector(
        rootSelector
      ) as HTMLElement | null;


    if (!root) {

      console.warn(
        `[PDF] Zone de détails introuvable : ${rootSelector}`
      );

      return [];
    }


    return mode === 'seed'
      ? this.extractSeedSections(root)
      : this.extractStandardSections(root);
  }


  private extractStandardSections(
    root: HTMLElement
  ): PdfSection[] {

    const sections =
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'div[class]'
        )
      )
        .filter(
          element =>
            this.hasClassEndingWith(
              element,
              '-detail-section'
            )
        );


    return sections
      .map(
        sectionElement => {

          const titleContainer =
            this.findFirstByClassEndingWith(
              sectionElement,
              '-detail-section-title'
            );


          const title =
            this.cleanText(
              titleContainer
                ?.querySelector('span')
                ?.textContent ||

              titleContainer
                ?.textContent ||

              ''
            );


          const fields =
            Array.from(
              sectionElement
                .querySelectorAll<HTMLElement>(
                  'div[class]'
                )
            )
              .filter(
                element =>
                  this.hasClassEndingWith(
                    element,
                    '-detail-item'
                  )
              )
              .map(
                element =>
                  this.extractStandardField(
                    element
                  )
              )
              .filter(
                (
                  field
                ): field is PdfField =>
                  !!field
              );


          return {
            title:
              title ||
              'Informations',

            fields
          };

        }
      )
      .filter(
        section =>
          section.fields.length > 0
      );
  }


  private extractStandardField(
    item: HTMLElement
  ): PdfField | null {

    const labelElement =

      this.findFirstByClassEndingWith(
        item,
        '-detail-label'
      ) ||

      item.querySelector<HTMLElement>(
        '.detail-label'
      );


    const valueElement =

      this.findFirstByClassEndingWith(
        item,
        '-detail-value'
      ) ||

      item.querySelector<HTMLElement>(
        '.detail-value'
      ) ||

      this.findFirstByClassEndingWith(
        item,
        '-detail-long-value'
      ) ||

      item.querySelector<HTMLElement>(
        '.detail-long-value'
      ) ||

      item.querySelector<HTMLElement>(
        '.culture-detail-status'
      );


    const label =
      this.cleanText(
        labelElement?.textContent ||
        ''
      );


    if (!label) {
      return null;
    }


    let value =
      this.cleanText(
        valueElement?.textContent ||
        ''
      );


    if (!value) {

      value =
        this.extractValueWithoutLabel(
          item,
          labelElement
        );

    }


    return {
      label,

      value:
        value ||
        '-',

      fullWidth:
        this.hasClassEndingWith(
          item,
          '-detail-item-full'
        )
    };
  }


  /*
   * Semence possède une structure HTML différente.
   *
   * On récupère seulement les cartes principales :
   *
   * - Caractéristiques morphologiques
   * - Masse et estimation
   * - Médias et informations complémentaires
   *
   * Les photos et les informations TaxHub
   * ne sont volontairement pas intégrées au PDF.
   */
  private extractSeedSections(
    root: HTMLElement
  ): PdfSection[] {

    const cards =
      Array.from(
        root.children
      )
        .filter(
          (
            element
          ): element is HTMLElement =>

            element instanceof HTMLElement &&

            element.classList.contains(
              'seed-details-info-card'
            )
        );


    return cards
      .map(
        card => {

          const title =
            this.cleanText(
              card
                .querySelector<HTMLElement>(
                  '.seed-details-section-title'
                )
                ?.textContent ||
              ''
            );


          const fields =
            Array.from(
              card.querySelectorAll<HTMLElement>(
                '.info-row'
              )
            )
              .map(
                row =>
                  this.extractSeedField(
                    row
                  )
              )
              .filter(
                (
                  field
                ): field is PdfField =>
                  !!field
              );


          return {
            title:
              title ||
              'Informations',

            fields
          };

        }
      )
      .filter(
        section =>
          section.fields.length > 0
      );
  }


  private extractSeedField(
    row: HTMLElement
  ): PdfField | null {

    const strong =
      row.querySelector<HTMLElement>(
        'strong'
      );


    const label =
      this.cleanText(
        strong?.textContent ||
        ''
      )
        .replace(
          /\s*:\s*$/,
          ''
        );


    if (!label) {
      return null;
    }


    const clone =
      row.cloneNode(
        true
      ) as HTMLElement;


    clone
      .querySelector('strong')
      ?.remove();


    const value =
      this.cleanText(
        clone.textContent ||
        ''
      );


    return {
      label,

      value:
        value ||
        '-',

      fullWidth:
        label
          .toLowerCase()
          .includes(
            'remarque'
          ) ||
        value.length > 90
    };
  }


  private extractValueWithoutLabel(
    item: HTMLElement,
    labelElement: HTMLElement | null
  ): string {

    const clone =
      item.cloneNode(
        true
      ) as HTMLElement;


    if (labelElement) {

      for (
        const className
        of Array.from(
          labelElement.classList
        )
      ) {

        const candidate =
          clone.querySelector(
            `.${className}`
          );


        if (candidate) {

          candidate.remove();

          break;
        }

      }

    }


    clone
      .querySelectorAll(
        'mat-icon, button'
      )
      .forEach(
        element =>
          element.remove()
      );


    return this.cleanText(
      clone.textContent ||
      ''
    );
  }


  private findFirstByClassEndingWith(
    root: HTMLElement,
    suffix: string
  ): HTMLElement | null {

    return (
      Array.from(
        root.querySelectorAll<HTMLElement>(
          '[class]'
        )
      )
        .find(
          element =>
            this.hasClassEndingWith(
              element,
              suffix
            )
        ) ||
      null
    );
  }


  private hasClassEndingWith(
    element: HTMLElement,
    suffix: string
  ): boolean {

    return Array.from(
      element.classList
    )
      .some(
        className =>
          className.endsWith(
            suffix
          )
      );
  }


  private cleanText(
    value: string
  ): string {

    return String(
      value ||
      ''
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }

}