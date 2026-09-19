import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import {
  MailService
} from './mail.service';

import {
  CommonService
} from '@geonature_common/service/common.service';

@Component({
  selector: 'app-mail',
  templateUrl: './mail.component.html',
  styleUrls: ['./mail.component.scss']
})
export class MailComponent
  implements OnInit, OnDestroy {

  public enabled = true;

  public emailInput = '';
  public emailError = '';

  public availableRecipients: string[] = [];
  public selectedRecipients: string[] = [];


  private subscriptions =
    new Subscription();


  constructor(
    private mailService: MailService,
    private commonService: CommonService
  ) {}


  public ngOnInit(): void {

    this.enabled =
      this.mailService.enabled;


    this.subscriptions.add(
      this.mailService.enabled$
        .subscribe(
          enabled => {
            this.enabled = enabled;
          }
        )
    );


    this.subscriptions.add(
      this.mailService
        .availableRecipients$
        .subscribe(
          recipients => {

            this.availableRecipients =
              recipients;

          }
        )
    );


    this.subscriptions.add(
      this.mailService
        .selectedRecipients$
        .subscribe(
          recipients => {

            this.selectedRecipients =
              recipients;

          }
        )
    );


    this.mailService
      .loadConfiguration();

  }


  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  public onToggle(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    this.mailService
      .setEnabled(input.checked);

  }


  /* =========================================================
     MAIL - DESTINATAIRES
     ========================================================= */

  public onEmailEnter(event: Event): void {

    event.preventDefault();

    this.addEmail();

  }


  public addEmail(): void {

    const email =
      this.mailService
        .normalizeEmail(
          this.emailInput
        );


    if (!email) {

      this.emailError =
        'Saisissez une adresse e-mail.';

      return;
    }


    if (
      !this.mailService
        .isValidEmail(email)
    ) {

      this.emailError =
        "L'adresse e-mail n'est pas valide.";

      return;
    }


    if (
      this.selectedRecipients.includes(
        email
      )
    ) {

      this.emailError =
        'Cette adresse est déjà sélectionnée.';

      return;
    }


    this.emailError = '';
    this.emailInput = '';


    this.mailService
      .addRecipient(email);

  }


  public isSelected(email: string): boolean {

    return this.selectedRecipients
      .includes(email);

  }


  public toggleRecipient(email: string): void {

    this.emailError = '';

    this.mailService
      .toggleRecipient(email);

  }


  public removeRecipient(
    email: string,
    event: Event
  ): void {

    event.stopPropagation();

    this.emailError = '';

    this.mailService
      .deleteRecipient(email);

  }


  public testMail(): void {

    if (!this.enabled) {

      this.commonService.translateToaster(
        'warning',
        'Activez Mail avant de tester l’envoi.'
      );

      return;
    }


    if (this.selectedRecipients.length === 0) {

      this.commonService.translateToaster(
        'warning',
        'Sélectionnez au moins une adresse e-mail.'
      );

      return;
    }


    console.log(
      '[MAIL] Test d’envoi demandé'
    );


    this.mailService
      .testMail()
      .subscribe({

        next: response => {

          console.log(
            '[MAIL] Réponse du serveur :',
            response
          );

          this.commonService.translateToaster(
            'success',
            'Mail de test envoyé avec succès.'
          );

        },


        error: error => {

          console.error(
            '[MAIL] Erreur du test :',
            error
          );

          const message =
            error?.error?.error
            || 'Erreur lors de l’envoi du mail de test.';


          this.commonService.translateToaster(
            'error',
            message
          );

        }

      });

  }

}