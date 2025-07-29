import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-followup-details',
  templateUrl: './followup-details.component.html',
})
export class FollowupDetailsComponent implements OnInit {
  @Input() code: string;
  @Input() germinationForm: FormGroup;
  @Input() replicates: any[] = [];

  ngOnInit(): void {}
}

