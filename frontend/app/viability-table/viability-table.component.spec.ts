import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViabilityTableComponent } from './viability-table-table.component';

describe('ViabilityTableComponent', () => {
  let component: ViabilityTableComponent;
  let fixture: ComponentFixture<ViabilityTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViabilityTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViabilityTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
