import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class GamificationService {

  private enabledSubject =
    new BehaviorSubject<boolean>(true);


  public get enabled$(): Observable<boolean> {
    return this.enabledSubject.asObservable();
  }


  public get enabled(): boolean {
    return this.enabledSubject.value;
  }


  public setEnabled(enabled: boolean): void {
    this.enabledSubject.next(enabled);
  }

}