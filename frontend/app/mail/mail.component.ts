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


@Component({
  selector: 'app-mail',
  templateUrl: './mail.component.html',
  styleUrls: ['./mail.component.scss']
})
export class MailComponent implements OnInit, OnDestroy {

  public enabled = true;

  private enabledSubscription:
    Subscription | null = null;


  constructor(
    private mailService: MailService
  ) {}


  public ngOnInit(): void {

    this.enabled =
      this.mailService.enabled;


    /*
     * L'état est commun à tous les futurs boutons Mail.
     */
    this.enabledSubscription =
      this.mailService.enabled$
        .subscribe(
          enabled => {
            this.enabled = enabled;
          }
        );

  }


  public ngOnDestroy(): void {

    if (this.enabledSubscription) {
      this.enabledSubscription.unsubscribe();
    }

  }


  /* =========================================================
     MAIL - ON / OFF
     ========================================================= */

  public onToggle(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    this.mailService
      .setEnabled(input.checked);

  }

}