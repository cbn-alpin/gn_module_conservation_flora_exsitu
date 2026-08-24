import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogData } from './confirm-dialog.model';

@Injectable()
export class DialogService {
  constructor(private dialog: MatDialog) {}

  confirmDialog(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef: MatDialogRef<ConfirmDialogComponent> =
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          width: '400px',
          disableClose: data.disableClose ?? true,

          autoFocus: false,
          restoreFocus: false,
        });

    return dialogRef.afterClosed();
  }
}