import {
  Component,
  Inject,
  ViewEncapsulation
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';


export interface PdfConfirmDialogData {
  entityLabel: string;
  entityCode?: string;
  accentColor: string;
  defaultFileName: string;
}


@Component({
  selector: 'app-pdf-confirm-dialog',
  templateUrl: './pdf-confirm-dialog.component.html',
  styleUrls: ['./pdf-confirm-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PdfConfirmDialogComponent {

  fileName: string;


  constructor(
    public dialogRef: MatDialogRef<PdfConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: PdfConfirmDialogData
  ) {
    this.fileName =
      data.defaultFileName ||
      'details.pdf';
  }


  confirmDownload(): void {
    const normalizedFileName =
      this.normalizeFileName(
        this.fileName
      );

    if (!normalizedFileName) {
      return;
    }

    this.dialogRef.close(
      normalizedFileName
    );
  }


  private normalizeFileName(
    fileName: string
  ): string {
    const cleanFileName =
      (fileName || '')
        .trim()
        .replace(
          /[\\/:*?"<>|]/g,
          '-'
        );

    if (!cleanFileName) {
      return '';
    }

    return cleanFileName
      .toLowerCase()
      .endsWith('.pdf')
        ? cleanFileName
        : `${cleanFileName}.pdf`;
  }

}