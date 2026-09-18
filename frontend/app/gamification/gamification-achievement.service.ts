import { Injectable } from '@angular/core';

import {
  BehaviorSubject,
  Observable
} from 'rxjs';


export interface GamificationAchievement {
  entity_type: string;
  action_count: number;
}


@Injectable()
export class GamificationAchievementService {

  /*
   * Même clé que le ON / OFF global
   * de GamificationService.
   */
  private readonly storageKey =
    'exsitu-gamification-enabled';


  /*
   * Le dernier événement valide est gardé quelques secondes
   * pour survivre à une éventuelle navigation juste après
   * l'enregistrement.
   *
   * Un événement obtenu pendant OFF n'arrive JAMAIS ici.
   */
  private achievementSubject =
    new BehaviorSubject<GamificationAchievement | null>(
      null
    );


  private achievementTimer: any = null;


  public get achievement$():
    Observable<GamificationAchievement | null> {

    return this.achievementSubject
      .asObservable();

  }


  /* =========================================================
     GAMIFICATION - RÉCEPTION D'UNE RÉPONSE MÉTIER

     RÈGLE IMPORTANTE :

     Si Gamification est OFF au moment exact où la réponse
     arrive, l'événement est immédiatement jeté.

     Le passage OFF -> ON plus tard ne peut donc jamais
     rejouer ce succès.
     ========================================================= */

  public notifyFromResponse(
    response: any
  ): void {

    const achievement =
      response
      && response.gamification_achievement;


    if (
      !achievement
      || !this.isGamificationEnabled()
    ) {

      return;

    }


    this.clearTimer();


    this.achievementSubject.next({

      entity_type:
        achievement.entity_type,

      action_count:
        Number(
          achievement.action_count
        )

    });


    /*
     * La célébration disparaît automatiquement
     * après 4,5 secondes.
     */
    this.achievementTimer =
      setTimeout(
        () => {

          this.clear();

        },
        4500
      );

  }


  public clear(): void {

    this.clearTimer();

    this.achievementSubject.next(
      null
    );

  }


  private clearTimer(): void {

    if (!this.achievementTimer) {
      return;
    }


    clearTimeout(
      this.achievementTimer
    );


    this.achievementTimer = null;

  }


  private isGamificationEnabled(): boolean {

    /*
     * Absence de valeur = ON par défaut,
     * comme GamificationService.
     */
    return (
      localStorage.getItem(
        this.storageKey
      ) !== 'false'
    );

  }

}