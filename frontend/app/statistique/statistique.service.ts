import {
  Injectable
} from '@angular/core';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';


@Injectable()
export class StatistiqueService {

  private readonly storageKey =
    'exsitu-statistique-enabled';


  private readonly enabledSubject =
    new BehaviorSubject<boolean>(
      this.getStoredEnabledState()
    );


  public get enabled$(): Observable<boolean> {
    return this.enabledSubject.asObservable();
  }


  public get enabled(): boolean {
    return this.enabledSubject.value;
  }


  public setEnabled(
    enabled: boolean
  ): void {

    this.enabledSubject.next(
      enabled
    );


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


    if (storedValue === null) {
      return true;
    }


    return storedValue === 'true';
  }
}