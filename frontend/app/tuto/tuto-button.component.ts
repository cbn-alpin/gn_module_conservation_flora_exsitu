import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

@Component({
  selector: 'app-tuto-button',
  templateUrl: './tuto-button.component.html',
  styleUrls: ['./tuto-button.component.scss']
})
export class TutoButtonComponent {

  @Output()
  tutoClick = new EventEmitter<void>();


  onTutoClick(): void {
    this.tutoClick.emit();
  }

}