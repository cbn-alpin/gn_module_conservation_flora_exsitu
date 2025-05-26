import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViabilityDetailsComponent } from './viability-details.component';

describe('ViabilityDetailsComponent', () => {
  let component: ViabilityDetailsComponent;
  let fixture: ComponentFixture<ViabilityDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViabilityDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViabilityDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
