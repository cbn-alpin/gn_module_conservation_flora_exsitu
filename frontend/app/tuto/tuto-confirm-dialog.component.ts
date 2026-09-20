import {
  Component,
  ViewEncapsulation
} from '@angular/core';

import {
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
      MatDialogRef<TutoConfirmDialogComponent>
  ) {}


  confirm(): void {
    this.dialogRef.close(true);
  }


}