import {
  Injectable
} from '@angular/core';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
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


  private getStoredEnabledState(): boolean {

    const storedValue =
      localStorage.getItem(
        this.storageKey
      );


    /*
     * Absence de valeur :
     * Mail est activé par défaut.
     */
    if (storedValue === null) {
      return true;
    }


    return storedValue === 'true';

  }

}