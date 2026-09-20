import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  MatDialog
} from '@angular/material/dialog';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  PdfConfirmDialogComponent
} from './pdf-confirm-dialog.component';

import {
  PdfActionContext,
  PdfDetailMode
} from './pdf.models';

import {
  PdfContentService
} from './pdf-content.service';

import {
  PdfExportService
} from './pdf-export.service';


@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrls: ['./pdf.component.scss']
})
export class PdfComponent {

  @Input()
  entityLabel: string =
    'Élément';

  @Input()
  entityCode: string =
    '';

  @Input()
  accentColor: string =
    '#607d8b';

  @Input()
  defaultFileName: string =
    'details.pdf';


  /*
   * Zone HTML qui contient les informations
   * actuellement affichées à l'utilisateur.
   */
  @Input()
  detailRootSelector: string =
    '';


  /*
   * Semence possède une mise en page
   * différente des autres fiches.
   */
  @Input()
  detailMode: PdfDetailMode =
    'standard';


  /*
   * Liste d'actions facultative.
   */
  @Input()
  includeActions =
    false;

  @Input()
  actions: any[] =
    [];

  @Input()
  actionContext: PdfActionContext =
    'standard';


  @Output()
  pdfRequested =
    new EventEmitter<string>();


  constructor(
    private dialog: MatDialog,
    private commonService: CommonService,
    private pdfContentService: PdfContentService,
    private pdfExportService: PdfExportService
  ) {}


  onPdfRequested(): void {

    const dialogRef =
      this.dialog.open(
        PdfConfirmDialogComponent,
        {
          width: '480px',

          panelClass:
            'pdf-confirm-dialog-panel',

          disableClose: true,
          autoFocus: false,
          restoreFocus: false,

          data: {
            entityLabel:
              this.entityLabel,

            entityCode:
              this.entityCode,

            accentColor:
              this.accentColor,

            defaultFileName:
              this.defaultFileName
          }
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (
          fileName:
            string | null
        ) => {

          if (!fileName) {
            return;
          }


          /*
           * Lecture des informations telles
           * qu'elles sont affichées dans la fiche.
           */
          const sections =
            this.pdfContentService
              .extractSections(
                this.detailRootSelector,
                this.detailMode
              );


          if (
            sections.length === 0
          ) {

            this.commonService
              .translateToaster(
                'warning',
                'Impossible de récupérer les détails à intégrer au PDF.'
              );

            return;
          }


          /*
           * Message demandé avant
           * le téléchargement.
           */
          this.commonService
            .translateToaster(
              'info',
              `Le PDF « ${fileName} » va être téléchargé.`
            );


          /*
           * setTimeout permet au toast
           * de s'afficher avant la génération.
           */
          setTimeout(
            () => {

              try {

                this.pdfExportService
                  .generate(
                    fileName,
                    {
                      entityLabel:
                        this.entityLabel,

                      entityCode:
                        this.entityCode,

                      accentColor:
                        this.accentColor,

                      sections,

                      includeActions:
                        this.includeActions,

                      /*
                       * dataSource.data contient
                       * déjà les actions filtrées.
                       */
                      actions:
                        this.actions ||
                        [],

                      actionContext:
                        this.actionContext
                    }
                  );


                this.pdfRequested.emit(
                  fileName
                );

              } catch (error) {

                console.error(
                  'Erreur lors de la génération du PDF :',
                  error
                );


                this.commonService
                  .translateToaster(
                    'warning',
                    'Impossible de générer le PDF.'
                  );

              }

            },
            0
          );

        }
      );

  }

}