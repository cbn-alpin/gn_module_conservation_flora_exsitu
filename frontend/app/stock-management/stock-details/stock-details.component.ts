import {
  Component
} from '@angular/core';


@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css']
})
export class StockDetailsComponent {

  onBack(): void {
    window.history.back();
  }

}
