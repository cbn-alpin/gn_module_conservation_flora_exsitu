import {
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';

import {
  distinctUntilChanged
} from 'rxjs/operators';

import {
  ConfigService
} from '../services/config.service';

import {
  ExsituFormService
} from '../form/shared/exsitu-form.service';


export interface MailConfiguration {
  available_recipients: string[];
  selected_recipients: string[];
}


@Injectable()
export class MailService {

  /* =========================================================
     MAIL - ÉTAT GLOBAL ON / OFF
     ========================================================= */

  private readonly storageKey =
    'exsitu-mail-enabled';


  private enabledSubject =
    new BehaviorSubject<boolean>(
      this.getStoredEnabledState()
    );


  /* =========================================================
     MAIL - DESTINATAIRES COMMUNS
     ========================================================= */

  private moduleBaseUrl: string;

  private loadedHarvestId:
    number | null = null;


  private availableRecipientsSubject =
    new BehaviorSubject<string[]>([]);


  private selectedRecipientsSubject =
    new BehaviorSubject<string[]>([]);


  constructor(
    private api: HttpClient,
    private cfg: ConfigService,
    private exsituFormService: ExsituFormService
  ) {

    this.moduleBaseUrl =
      this.cfg.getModuleBackendUrl();


    /*
     * À chaque changement de récolte,
     * on recharge sa configuration Mail.
     */
    this.exsituFormService
      .id_harvest
      .pipe(
        distinctUntilChanged()
      )
      .subscribe(
        idHarvest => {

          if (!idHarvest) {
            this.resetRecipients();
            return;
          }


          this.loadConfiguration(
            idHarvest
          );

        }
      );

  }


  public get enabled$(): Observable<boolean> {
    return this.enabledSubject.asObservable();
  }


  public get enabled(): boolean {
    return this.enabledSubject.value;
  }


  public setEnabled(enabled: boolean): void {

    this.enabledSubject.next(enabled);

    localStorage.setItem(
      this.storageKey,
      String(enabled)
    );

  }


  public get availableRecipients$():
    Observable<string[]> {

    return this.availableRecipientsSubject
      .asObservable();

  }


  public get selectedRecipients$():
    Observable<string[]> {

    return this.selectedRecipientsSubject
      .asObservable();

  }


  public get availableRecipients(): string[] {
    return this.availableRecipientsSubject.value;
  }


  public get selectedRecipients(): string[] {
    return this.selectedRecipientsSubject.value;
  }


  public get hasSelectedRecipients(): boolean {
    return this.selectedRecipients.length > 0;
  }


  /* =========================================================
     MAIL - CHARGEMENT DEPUIS LA BASE
     ========================================================= */

  public loadConfiguration(
    idHarvest: number =
      this.exsituFormService.idHarvest
  ): void {

    if (!idHarvest) {
      return;
    }


    if (
      this.loadedHarvestId === idHarvest
    ) {
      return;
    }


    this.loadedHarvestId = idHarvest;


    this.api
      .get<MailConfiguration>(
        `${this.moduleBaseUrl}/harvests/${idHarvest}/mail-config`
      )
      .subscribe({

        next: configuration => {
          this.applyConfiguration(
            configuration
          );
        },


        error: () => {
          this.loadedHarvestId = null;
          this.resetRecipients();
        }

      });

  }


  /* =========================================================
     MAIL - GESTION DES ADRESSES
     ========================================================= */

  public normalizeEmail(email: string): string {

    return (email || '')
      .trim()
      .toLowerCase();

  }


  public isValidEmail(email: string): boolean {

    const normalized =
      this.normalizeEmail(email);


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(normalized);

  }


  public addRecipient(email: string): void {

    const normalized =
      this.normalizeEmail(email);


    if (!this.isValidEmail(normalized)) {
      return;
    }


    const available = [
      ...this.availableRecipients
    ];

    const selected = [
      ...this.selectedRecipients
    ];


    if (!available.includes(normalized)) {
      available.push(normalized);
    }


    if (!selected.includes(normalized)) {
      selected.push(normalized);
    }


    this.availableRecipientsSubject.next(
      available
    );

    this.selectedRecipientsSubject.next(
      selected
    );


    this.persistConfiguration();

  }


  public toggleRecipient(email: string): void {

    const normalized =
      this.normalizeEmail(email);


    const selected =
      this.selectedRecipients.includes(
        normalized
      )
        ? this.selectedRecipients.filter(
            item => item !== normalized
          )
        : [
            ...this.selectedRecipients,
            normalized
          ];


    this.selectedRecipientsSubject.next(
      selected
    );


    this.persistConfiguration();

  }


  public deleteRecipient(email: string): void {

    const normalized =
      this.normalizeEmail(email);


    this.availableRecipientsSubject.next(
      this.availableRecipients.filter(
        item => item !== normalized
      )
    );


    this.selectedRecipientsSubject.next(
      this.selectedRecipients.filter(
        item => item !== normalized
      )
    );


    this.persistConfiguration();

  }


  /* =========================================================
     MAIL - MESSAGE DANS LES CONFIRMATIONS
     ========================================================= */

  public getConfirmationWarning(
    action: 'create' | 'update' | 'delete'
  ): string | undefined {

    if (!this.enabled) {
      return undefined;
    }


    const actionLabel = {
      create: "l'ajout",
      update: 'la modification',
      delete: 'la suppression'
    }[action];


    return (
      `Attention : Mail activé. Après ${actionLabel}, ` +
      'un mail vous sera envoyé automatiquement.'
    );

  }


  /* =========================================================
     MAIL - SAUVEGARDE EN BASE
     ========================================================= */

  private persistConfiguration(): void {

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (!idHarvest) {
      return;
    }


    const payload: MailConfiguration = {

      available_recipients:
        this.availableRecipients,

      selected_recipients:
        this.selectedRecipients

    };


    this.api
      .put<MailConfiguration>(
        `${this.moduleBaseUrl}/harvests/${idHarvest}/mail-config`,
        payload
      )
      .subscribe({

        next: configuration => {

          this.applyConfiguration(
            configuration
          );

        },


        error: () => {

          this.loadedHarvestId = null;

          this.loadConfiguration(
            idHarvest
          );

        }

      });

  }


  private applyConfiguration(
    configuration: MailConfiguration
  ): void {

    this.availableRecipientsSubject.next(
      configuration?.available_recipients
      || []
    );


    this.selectedRecipientsSubject.next(
      configuration?.selected_recipients
      || []
    );

  }


  private resetRecipients(): void {

    this.loadedHarvestId = null;

    this.availableRecipientsSubject.next(
      []
    );

    this.selectedRecipientsSubject.next(
      []
    );

  }


  private getStoredEnabledState(): boolean {

    const storedValue =
      localStorage.getItem(
        this.storageKey
      );


    if (storedValue === null) {
      return true;
    }


    return storedValue === 'true';

  }

}
