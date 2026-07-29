import {
  Component,
  Inject
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';


@Component({
  selector: 'app-culture-action',
  templateUrl:
    './culture-action.component.html',
  styleUrls: [
    './culture-action.component.scss'
  ]
})
export class CultureActionComponent {

  constructor(
    public dialogRef:
      MatDialogRef<CultureActionComponent>,

    @Inject(MAT_DIALOG_DATA)
    public dialogData: {
      idCulture: number;
      codeCulture?: string | null;
    }
  ) {}


  onCancel(): void {
    this.dialogRef.close();
  }

}