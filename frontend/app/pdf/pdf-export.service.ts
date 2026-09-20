import {
  Injectable
} from '@angular/core';

import {
  jsPDF
} from 'jspdf';

import autoTable
  from 'jspdf-autotable';

import {
  PdfActionContext,
  PdfExportPayload,
  PdfField,
  PdfSection
} from './pdf.models';


type RgbColor =
  [number, number, number];


@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  private readonly margin = 14;

  private readonly footerHeight = 16;

  private readonly pageStartY = 12;


  generate(
    fileName: string,
    payload: PdfExportPayload
  ): void {

    const doc =
      new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });


    const accent =
      this.hexToRgb(
        payload.accentColor
      );


    doc.setProperties({
      title:
        `${
          payload.entityLabel
        } ${
          payload.entityCode
        }`
          .trim(),

      subject:
        `Détails ${
          payload.entityLabel
        }`,

      author:
        'GeoNature - Conservation Flora Ex Situ',

      creator:
        'GeoNature - Conservation Flora Ex Situ'
    });


    this.drawPageAccent(
      doc,
      accent
    );


    let y =
      this.drawHero(
        doc,
        payload,
        accent
      );


    for (
      const section
      of payload.sections || []
    ) {

      y =
        this.drawSection(
          doc,
          section,
          y,
          accent
        );

    }


    if (
      payload.includeActions
    ) {

      this.drawActions(
        doc,

        payload.actions ||
        [],

        payload.actionContext,

        y,

        accent
      );

    }


    this.drawFooters(
      doc,
      accent
    );


    doc.save(
      fileName
    );
  }


  /* =========================================================
     BANDEAU PRINCIPAL
     ========================================================= */

  private drawHero(
    doc: jsPDF,
    payload: PdfExportPayload,
    accent: RgbColor
  ): number {

    const pageWidth =
      doc.internal.pageSize
        .getWidth();


    const contentWidth =
      pageWidth -
      this.margin * 2;


    const top = 12;

    const height = 27;


    const light =
      this.mixWithWhite(
        accent,
        0.90
      );


    doc.setFillColor(
      ...light
    );

    doc.setDrawColor(
      ...accent
    );

    doc.setLineWidth(
      0.45
    );


    doc.roundedRect(
      this.margin,
      top,
      contentWidth,
      height,
      3,
      3,
      'FD'
    );


    /*
     * Barre verticale de la couleur
     * de la partie concernée.
     */
    doc.setFillColor(
      ...accent
    );

    doc.roundedRect(
      this.margin,
      top,
      4,
      height,
      2,
      2,
      'F'
    );


    /*
     * Nom de la partie.
     */
    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      15
    );

    doc.setTextColor(
      ...accent
    );


    doc.text(
      this.normalizeText(
        payload.entityLabel
      ),
      this.margin + 9,
      top + 9
    );


    /*
     * Sous-titre.
     */
    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(
      9
    );

    doc.setTextColor(
      82,
      96,
      106
    );


    doc.text(
      'Vue détaillée des données principales',
      this.margin + 9,
      top + 15
    );


    /*
     * Badge avec le numéro/code.
     */
    const code =
      this.normalizeText(
        payload.entityCode ||
        '-'
      );


    const codeWidth =
      Math.min(
        58,

        Math.max(
          30,
          doc.getTextWidth(
            code
          ) + 12
        )
      );


    const codeX =
      pageWidth -
      this.margin -
      codeWidth -
      5;


    doc.setFillColor(
      255,
      255,
      255
    );

    doc.setDrawColor(
      ...accent
    );

    doc.setLineWidth(
      0.4
    );


    doc.roundedRect(
      codeX,
      top + 7,
      codeWidth,
      11,
      2.5,
      2.5,
      'FD'
    );


    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      9
    );

    doc.setTextColor(
      ...accent
    );


    doc.text(
      code,

      codeX +
      codeWidth / 2,

      top + 14,

      {
        align: 'center',

        maxWidth:
          codeWidth - 5
      }
    );


    return (
      top +
      height +
      8
    );
  }


  /* =========================================================
     SECTION
     ========================================================= */

  private drawSection(
    doc: jsPDF,
    section: PdfSection,
    startY: number,
    accent: RgbColor
  ): number {

    if (
      !section?.fields?.length
    ) {
      return startY;
    }


    let y =
      this.ensureSpace(
        doc,
        startY,
        32,
        accent
      );


    const pageWidth =
      doc.internal.pageSize
        .getWidth();


    const contentWidth =
      pageWidth -
      this.margin * 2;


    const light =
      this.mixWithWhite(
        accent,
        0.92
      );


    /*
     * Titre de section.
     */
    doc.setFillColor(
      ...light
    );


    doc.roundedRect(
      this.margin,
      y,
      contentWidth,
      8,
      2,
      2,
      'F'
    );


    doc.setFillColor(
      ...accent
    );


    doc.roundedRect(
      this.margin,
      y,
      2.3,
      8,
      1,
      1,
      'F'
    );


    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      10
    );

    doc.setTextColor(
      ...accent
    );


    doc.text(
      this.normalizeText(
        section.title
      ),
      this.margin + 6,
      y + 5.3
    );


    y += 11;


    const gap = 4;


    const columnWidth =
      (
        contentWidth -
        gap
      ) / 2;


    let index = 0;


    while (
      index <
      section.fields.length
    ) {

      const first =
        section.fields[
          index
        ];


      /*
       * Champ pleine largeur.
       */
      if (
        first.fullWidth
      ) {

        const height =
          this.getFieldCardHeight(
            doc,
            first,
            contentWidth
          );


        y =
          this.ensureSpace(
            doc,
            y,
            height + 4,
            accent
          );


        this.drawFieldCard(
          doc,

          first,

          this.margin,

          y,

          contentWidth,

          height,

          accent
        );


        y +=
          height + 4;


        index += 1;


        continue;
      }


      /*
       * Deux champs sur la même ligne.
       */
      const second =
        section.fields[
          index + 1
        ];


      const hasSecond =
        !!second &&
        !second.fullWidth;


      const firstHeight =
        this.getFieldCardHeight(
          doc,
          first,
          columnWidth
        );


      const secondHeight =
        hasSecond
          ? this.getFieldCardHeight(
              doc,
              second,
              columnWidth
            )
          : firstHeight;


      const rowHeight =
        Math.max(
          firstHeight,
          secondHeight
        );


      y =
        this.ensureSpace(
          doc,
          y,
          rowHeight + 4,
          accent
        );


      this.drawFieldCard(
        doc,

        first,

        this.margin,

        y,

        columnWidth,

        rowHeight,

        accent
      );


      if (
        hasSecond &&
        second
      ) {

        this.drawFieldCard(
          doc,

          second,

          this.margin +
          columnWidth +
          gap,

          y,

          columnWidth,

          rowHeight,

          accent
        );

      }


      y +=
        rowHeight + 4;


      index +=
        hasSecond
          ? 2
          : 1;
    }


    return y + 2;
  }


  /* =========================================================
     CARTE D'UN CHAMP
     ========================================================= */

  private drawFieldCard(
    doc: jsPDF,
    field: PdfField,
    x: number,
    y: number,
    width: number,
    height: number,
    accent: RgbColor
  ): void {

    const cardAccent =
      this.mixWithWhite(
        accent,
        0.55
      );


    const padding = 5;


    const textWidth =
      width -
      padding * 2;


    /*
     * Fond.
     */
    doc.setFillColor(
      250,
      251,
      252
    );

    doc.setDrawColor(
      221,
      227,
      230
    );

    doc.setLineWidth(
      0.25
    );


    doc.roundedRect(
      x,
      y,
      width,
      height,
      2,
      2,
      'FD'
    );


    /*
     * Petit accent vertical.
     */
    doc.setFillColor(
      ...cardAccent
    );


    doc.roundedRect(
      x,
      y,
      1.5,
      height,
      0.8,
      0.8,
      'F'
    );


    /*
     * Label.
     */
    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(
      7.7
    );

    doc.setTextColor(
      103,
      118,
      127
    );


    const labelLines =
      doc.splitTextToSize(
        this.normalizeText(
          field.label
        ),
        textWidth
      );


    doc.text(
      labelLines,
      x + padding,
      y + 5
    );


    const labelHeight =
      labelLines.length *
      3.2;


    /*
     * Valeur.
     */
    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      9.5
    );

    doc.setTextColor(
      46,
      58,
      64
    );


    const valueLines =
      doc.splitTextToSize(
        this.valueToText(
          field.value
        ),
        textWidth
      );


    doc.text(
      valueLines,
      x + padding,
      y + 8 + labelHeight
    );
  }


  private getFieldCardHeight(
    doc: jsPDF,
    field: PdfField,
    width: number
  ): number {

    const textWidth =
      width - 10;


    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(
      7.7
    );


    const labelLines =
      doc.splitTextToSize(
        this.normalizeText(
          field.label
        ),
        textWidth
      );


    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      9.5
    );


    const valueLines =
      doc.splitTextToSize(
        this.valueToText(
          field.value
        ),
        textWidth
      );


    return Math.max(
      16,

      8 +
      labelLines.length *
      3.2 +
      valueLines.length *
      4.1
    );
  }


  /* =========================================================
     LISTE DES ACTIONS
     ========================================================= */

  private drawActions(
    doc: jsPDF,
    actions: any[],
    context: PdfActionContext,
    startY: number,
    accent: RgbColor
  ): void {

    let y =
      this.ensureSpace(
        doc,
        startY,
        28,
        accent
      );


    const pageWidth =
      doc.internal.pageSize
        .getWidth();


    const contentWidth =
      pageWidth -
      this.margin * 2;


    const light =
      this.mixWithWhite(
        accent,
        0.92
      );


    /*
     * Titre.
     */
    doc.setFillColor(
      ...light
    );


    doc.roundedRect(
      this.margin,
      y,
      contentWidth,
      8,
      2,
      2,
      'F'
    );


    doc.setFillColor(
      ...accent
    );


    doc.roundedRect(
      this.margin,
      y,
      2.3,
      8,
      1,
      1,
      'F'
    );


    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(
      10
    );

    doc.setTextColor(
      ...accent
    );


    doc.text(
      'Liste des actions',
      this.margin + 6,
      y + 5.3
    );


    y += 11;


    /*
     * Aucun résultat après filtre.
     */
    if (
      !actions?.length
    ) {

      doc.setFillColor(
        248,
        250,
        251
      );

      doc.setDrawColor(
        215,
        222,
        226
      );


      doc.roundedRect(
        this.margin,
        y,
        contentWidth,
        15,
        2,
        2,
        'FD'
      );


      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(
        9
      );

      doc.setTextColor(
        100,
        113,
        121
      );


      doc.text(
        'Aucune action à afficher avec les filtres actuellement appliqués.',
        this.margin + 5,
        y + 9
      );


      return;
    }


    const isCulture =
      context ===
      'culture';


    /*
     * Culture possède une date de fin.
     *
     * Semis / Germination / Viabilité :
     * Début + Type + Agent.
     */
    const head =
      isCulture
        ? [[
            'Début',
            'Fin',
            "Type d'action",
            'Agent'
          ]]
        : [[
            'Début',
            "Type d'action",
            'Agent'
          ]];


    const body =
      actions.map(
        action => {

          const start =
            this.formatDate(
              action?.date_start
            );


          const type =
            this.getActionType(
              action,
              context
            );


          const actor =
            this.normalizeText(

              action?.actor_label ||

              action?.label_actor ||

              action?.actor ||

              '-'
            );


          return isCulture
            ? [
                start,

                this.formatDate(
                  action?.date_end
                ),

                type,

                actor
              ]
            : [
                start,
                type,
                actor
              ];

        }
      );


    /*
     * AutoTable gère automatiquement :
     *
     * - le passage sur plusieurs pages ;
     * - la répétition de l'entête ;
     * - les lignes longues ;
     * - l'absence de coupure d'une ligne.
     */
    autoTable(
      doc,
      {
        startY: y,

        head,

        body,

        theme:
          'grid',

        margin: {
          left:
            this.margin,

          right:
            this.margin,

          top:
            this.pageStartY,

          bottom:
            this.footerHeight
        },

        styles: {
          font:
            'helvetica',

          fontSize:
            8.3,

          textColor: [
            54,
            67,
            74
          ],

          cellPadding:
            2.5,

          lineColor: [
            218,
            224,
            228
          ],

          lineWidth:
            0.2,

          overflow:
            'linebreak',

          valign:
            'middle'
        },

        headStyles: {
          fillColor:
            accent,

          textColor: [
            255,
            255,
            255
          ],

          fontStyle:
            'bold',

          halign:
            'left'
        },

        alternateRowStyles: {
          fillColor: [
            248,
            250,
            251
          ]
        },

        rowPageBreak:
          'avoid',

        didDrawPage: () => {

          this.drawPageAccent(
            doc,
            accent
          );

        }
      }
    );
  }


  /* =========================================================
     PAGINATION
     ========================================================= */

  private ensureSpace(
    doc: jsPDF,
    currentY: number,
    requiredHeight: number,
    accent: RgbColor
  ): number {

    const pageHeight =
      doc.internal.pageSize
        .getHeight();


    const usableBottom =
      pageHeight -
      this.footerHeight;


    if (
      currentY +
      requiredHeight <=
      usableBottom
    ) {
      return currentY;
    }


    doc.addPage();


    this.drawPageAccent(
      doc,
      accent
    );


    return this.pageStartY;
  }


  private drawPageAccent(
    doc: jsPDF,
    accent: RgbColor
  ): void {

    const pageWidth =
      doc.internal.pageSize
        .getWidth();


    doc.setFillColor(
      ...accent
    );


    doc.rect(
      0,
      0,
      pageWidth,
      4,
      'F'
    );
  }


  /* =========================================================
     PIED DE PAGE
     ========================================================= */

  private drawFooters(
    doc: jsPDF,
    accent: RgbColor
  ): void {

    const pageCount =
      doc.getNumberOfPages();


    const pageWidth =
      doc.internal.pageSize
        .getWidth();


    const pageHeight =
      doc.internal.pageSize
        .getHeight();


    const generatedAt =
      this.getGeneratedAtLabel();


    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {

      doc.setPage(
        page
      );


      doc.setDrawColor(
        ...this.mixWithWhite(
          accent,
          0.55
        )
      );


      doc.setLineWidth(
        0.3
      );


      doc.line(
        this.margin,

        pageHeight -
        11,

        pageWidth -
        this.margin,

        pageHeight -
        11
      );


      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(
        7.5
      );

      doc.setTextColor(
        105,
        115,
        122
      );


      doc.text(
        'FLORA EX SITU',
        this.margin,
        pageHeight - 6
      );


      doc.text(
        generatedAt,

        pageWidth / 2,

        pageHeight - 6,

        {
          align:
            'center'
        }
      );


      doc.text(
        `Page ${page} / ${pageCount}`,

        pageWidth -
        this.margin,

        pageHeight - 6,

        {
          align:
            'right'
        }
      );

    }
  }


  /* =========================================================
     FORMAT DES VALEURS
     ========================================================= */

  private valueToText(
    value: any
  ): string {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '-';
    }


    if (
      Array.isArray(
        value
      )
    ) {

      return this.normalizeText(
        value.length
          ? value.join(', ')
          : '-'
      );

    }


    if (
      typeof value ===
      'object'
    ) {

      try {

        return this.normalizeText(
          JSON.stringify(
            value
          )
        );

      } catch {

        return '-';

      }

    }


    return this.normalizeText(
      String(
        value
      )
    );
  }


  private formatDate(
    value: any
  ): string {

    if (!value) {
      return '-';
    }


    /*
     * Évite les problèmes de fuseau
     * pour une date YYYY-MM-DD.
     */
    if (
      typeof value ===
      'string'
    ) {

      const datePart =
        value.split('T')[0];


      const match =
        /^(\d{4})-(\d{2})-(\d{2})$/
          .exec(
            datePart
          );


      if (match) {

        return (
          `${match[3]}/` +
          `${match[2]}/` +
          `${match[1]}`
        );

      }

    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return this.valueToText(
        value
      );

    }


    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          '0'
        );


    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          '0'
        );


    return (
      `${day}/` +
      `${month}/` +
      `${date.getFullYear()}`
    );
  }


  /* =========================================================
     TYPE D'ACTION
     ========================================================= */

  private getActionType(
    action: any,
    context: PdfActionContext
  ): string {

    const actionType =
      this.normalizeText(

        action
          ?.action_type_label ||

        action
          ?.label_action_type ||

        '-'
      );


    /*
     * Culture :
     * on conserve le détail du type
     * de transplantation.
     */
    if (
      context ===
      'culture'
    ) {

      const code =
        String(
          action
            ?.code_action_type ||
          ''
        )
          .trim()
          .toLowerCase();


      const transplantationType =
        this.normalizeText(

          action
            ?.transplantation_type_label ||

          ''
        );


      return (
        code === 'transp' &&
        transplantationType
      )
        ? `${
            actionType
          } ${
            transplantationType
          }`
        : actionType;
    }


    /*
     * Semis / Germination / Viabilité :
     * même comportement visuel que
     * ActionTableComponent.
     */
    const normalizedType =
      actionType
        .trim()
        .toLowerCase();


    const scarificationType =
      String(
        action
          ?.label_scarification_type ||
        ''
      )
        .trim()
        .toLowerCase();


    if (
      normalizedType !==
      'scarification'
    ) {
      return actionType;
    }


    if (
      scarificationType
        .includes(
          'chimique'
        )
    ) {
      return 'Scarification chimique';
    }


    if (
      scarificationType
        .includes(
          'mécanique'
        ) ||

      scarificationType
        .includes(
          'mecanique'
        )
    ) {
      return 'Scarification mécanique';
    }


    return actionType;
  }


  private normalizeText(
    value: any
  ): string {

    return String(
      value ??
      ''
    )
      .replace(
        /\u00a0/g,
        ' '
      )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        '"'
      )
      .replace(
        /[–—]/g,
        '-'
      )
      .replace(
        /…/g,
        '...'
      )
      .trim();
  }


  private getGeneratedAtLabel(): string {

    const now =
      new Date();


    const date =
      now.toLocaleDateString(
        'fr-FR'
      );


    const time =
      now.toLocaleTimeString(
        'fr-FR',
        {
          hour:
            '2-digit',

          minute:
            '2-digit'
        }
      );


    return (
      `Généré le ${
        date
      } à ${
        time
      }`
    );
  }


  /* =========================================================
     COULEURS
     ========================================================= */

  private hexToRgb(
    hexColor: string
  ): RgbColor {

    const normalized =
      String(
        hexColor ||
        '#607d8b'
      )
        .replace(
          '#',
          ''
        )
        .trim();


    const fullHex =
      normalized.length === 3
        ? normalized
            .split('')
            .map(
              character =>
                character +
                character
            )
            .join('')
        : normalized;


    if (
      !/^[0-9a-fA-F]{6}$/
        .test(
          fullHex
        )
    ) {

      return [
        96,
        125,
        139
      ];

    }


    return [

      parseInt(
        fullHex.substring(
          0,
          2
        ),
        16
      ),

      parseInt(
        fullHex.substring(
          2,
          4
        ),
        16
      ),

      parseInt(
        fullHex.substring(
          4,
          6
        ),
        16
      )

    ];
  }


  private mixWithWhite(
    color: RgbColor,
    ratio: number
  ): RgbColor {

    const safeRatio =
      Math.min(
        1,

        Math.max(
          0,
          ratio
        )
      );


    return color.map(
      channel =>

        Math.round(

          channel +

          (
            255 -
            channel
          ) *

          safeRatio
        )
    ) as RgbColor;
  }

}