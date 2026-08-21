import {
  Component
} from '@angular/core';


@Component({
  selector: 'app-material-details',
  templateUrl: './material-details.component.html',
  styleUrls: ['./material-details.component.css']
})
export class MaterialDetailsComponent {

  onBack(): void {
    window.history.back();
  }

}