import {
  Component,
  Inject,
  ViewEncapsulation
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import {
  TUTO_IMAGE_DATA_URL
} from './tuto-images';


@Component({
  selector: 'app-tuto-confirm-dialog',
  templateUrl: './tuto-confirm-dialog.component.html',
  styleUrls: ['./tuto-confirm-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TutoConfirmDialogComponent {

  readonly tutoImageDataUrl =
    TUTO_IMAGE_DATA_URL;


  constructor(
    public dialogRef:
      MatDialogRef<TutoConfirmDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: {
      sectionName: string;
      sectionColor: string;
    }
  ) {}


  confirm(): void {
    this.dialogRef.close(true);
  }


}