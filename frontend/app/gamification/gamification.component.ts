import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import {
  GamificationService
} from './gamification.service';


@Component({
  selector: 'app-gamification',
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.scss']
})
export class GamificationComponent implements OnInit, OnDestroy {

  public enabled = true;

  private enabledSubscription: Subscription | null = null;


  constructor(
    private gamificationService: GamificationService
  ) {}


  public ngOnInit(): void {

    this.enabled =
      this.gamificationService.enabled;

    this.enabledSubscription =
      this.gamificationService.enabled$
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


  public onToggle(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    this.gamificationService
      .setEnabled(input.checked);

  }

}