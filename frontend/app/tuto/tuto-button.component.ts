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
  TutoConfirmDialogComponent
} from './tuto-confirm-dialog.component';


@Component({
  selector: 'app-tuto-button',
  templateUrl: './tuto-button.component.html',
  styleUrls: ['./tuto-button.component.scss']
})
export class TutoButtonComponent {

  @Input()
  sectionName = '';

  @Input()
  sectionColor = '#6a1b9a';


  @Output()
  tutoClick =
    new EventEmitter<void>();


  constructor(
    private dialog: MatDialog
  ) {}


  onTutoClick(): void {

    const dialogRef =
      this.dialog.open(
        TutoConfirmDialogComponent,
        {
          width: '480px',

          panelClass:
            'tuto-confirm-dialog-panel',

          data: {
            sectionName:
              this.sectionName,

            sectionColor:
              this.sectionColor
          },

          disableClose: true,
          autoFocus: false,
          restoreFocus: false
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (
          confirmed:
            boolean
        ) => {

          if (!confirmed) {
            return;
          }

          /*
           * Le vrai tutoriel sera branché
           * sur cet événement plus tard.
           */
          this.tutoClick.emit();

        }
      );

  }

}