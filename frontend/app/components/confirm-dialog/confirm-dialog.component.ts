import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogData } from './confirm-dialog.model';
import { MailService } from '../../mail/mail.service';

const defaultsDialogData: ConfirmDialogData = {
  title: "Confirmation",
  message: "",
  confirmCaption: "Oui",
  cancelCaption: "Non",
};

@Component({
  selector: 'cs-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent implements OnInit {
  public dialogData: ConfirmDialogData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private mailService: MailService
  ) {
    this.dialogData = { ...defaultsDialogData, ...data };


    /* =======================================================
       MAIL - MESSAGE AUTOMATIQUE DANS LES CONFIRMATIONS
       ======================================================= */

    if (!this.dialogData.mailWarningMessage) {

      let mailAction =
        this.dialogData.mailAction;


      const deletionVariants = [
        'material',
        'seed',
        'stock',
        'culture',
        'semis',
        'germination',
        'viability'
      ];


      if (
        !mailAction
        && !this.dialogData.actionDeletion
        && this.dialogData.variant
        && deletionVariants.includes(
          this.dialogData.variant
        )
      ) {
        mailAction = 'delete';
      }


      if (mailAction) {
        this.dialogData.mailWarningMessage =
          this.mailService
            .getConfirmationWarning(
              mailAction
            );
      }

    }
  }


  /* =======================================================
     MAIL - DESTINATAIRES AFFICHÉS DANS LA CONFIRMATION
     ======================================================= */

  public get mailRecipients(): string[] {
    return this.mailService.selectedRecipients;
  }


  ngOnInit(): void {}
}