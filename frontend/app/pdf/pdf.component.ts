import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';


@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrls: ['./pdf.component.scss']
})
export class PdfComponent {

  @Output()
  pdfRequested =
    new EventEmitter<void>();


  onPdfRequested(): void {
    this.pdfRequested.emit();
  }

}