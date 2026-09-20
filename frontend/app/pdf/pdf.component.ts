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


  @Output()
  pdfRequested =
    new EventEmitter<string>();


  constructor(
    private dialog: MatDialog,
    private commonService: CommonService
  ) {}


  onPdfRequested(): void {

    const dialogRef =
      this.dialog.open(
        PdfConfirmDialogComponent,
        {
          width: '480px',

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
        (fileName: string | null) => {

          if (!fileName) {
            return;
          }


          this.commonService
            .translateToaster(
              'info',
              `Le PDF « ${fileName} » va être téléchargé.`
            );


          /*
           * Pour l'instant aucun téléchargement.
           *
           * Cet événement sera utilisé plus tard
           * pour brancher la vraie génération PDF.
           */
          this.pdfRequested.emit(
            fileName
          );

        }
      );

  }

}