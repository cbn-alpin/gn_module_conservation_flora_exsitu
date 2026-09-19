import { Injectable } from '@angular/core';

import {
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';

import {
  Observable,
  of
} from 'rxjs';

import {
  CommonService
} from '@geonature_common/service/common.service';

import {
  ConfirmDialogComponent
} from './confirm-dialog.component';

import {
  ConfirmDialogData
} from './confirm-dialog.model';

import {
  MailService
} from '../../mail/mail.service';


@Injectable()
export class DialogService {

  constructor(
    private dialog: MatDialog,
    private mailService: MailService,
    private commonService: CommonService
  ) {}


  confirmDialog(
    data: ConfirmDialogData
  ): Observable<boolean> {

    /* =======================================================
       MAIL - DESTINATAIRE OBLIGATOIRE SI MAIL EST ON
       ======================================================= */

    const deletionVariants = [
      'material',
      'seed',
      'stock',
      'culture',
      'semis',
      'germination',
      'viability'
    ];


    const isEntityDeletion =
      !data.actionDeletion
      && !!data.variant
      && deletionVariants.includes(
        data.variant
      );


    const concernsMail =
      !!data.mailAction
      || !!data.mailWarningMessage
      || isEntityDeletion;


    if (
      this.mailService.enabled
      && concernsMail
      && !this.mailService.hasSelectedRecipients
    ) {

      this.commonService.translateToaster(
        'warning',
        'Mail activé : sélectionnez au moins une adresse e-mail destinataire.'
      );


      return of(false);
    }


    const dialogRef:
      MatDialogRef<ConfirmDialogComponent> =

      this.dialog.open(
        ConfirmDialogComponent,
        {
          data,
          width: '400px',

          disableClose:
            data.disableClose ?? true,

          autoFocus: false,
          restoreFocus: false,
        }
      );


    return dialogRef.afterClosed();
  }

}