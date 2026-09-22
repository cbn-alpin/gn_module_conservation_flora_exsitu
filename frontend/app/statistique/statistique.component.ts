import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

import {
  Subscription
} from 'rxjs';

import {
  StatistiqueService
} from './statistique.service';


@Component({
  selector: 'app-statistique',
  templateUrl: './statistique.component.html',
  styleUrls: ['./statistique.component.scss']
})
export class StatistiqueComponent
  implements OnInit, OnDestroy {

  @Input()
  public initialFilter:
    'sowing' |
    'germination' |
    'viability' |
    'culture' =
      'sowing';


  @Output()
  public statistiqueClick =
    new EventEmitter<string>();


  public enabled = true;


  private enabledSubscription:
    Subscription | null =
      null;


  constructor(
    private statistiqueService:
      StatistiqueService
  ) {}


  ngOnInit(): void {

    this.enabled =
      this.statistiqueService.enabled;


    this.enabledSubscription =
      this.statistiqueService
        .enabled$
        .subscribe(
          enabled => {
            this.enabled = enabled;
          }
        );
  }


  ngOnDestroy(): void {

    this.enabledSubscription
      ?.unsubscribe();
  }


  public onToggle(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.statistiqueService
      .setEnabled(
        input.checked
      );
  }


  public openStatistique(): void {

    if (!this.enabled) {
      return;
    }


    this.statistiqueClick.emit(
      this.initialFilter
    );
  }
}