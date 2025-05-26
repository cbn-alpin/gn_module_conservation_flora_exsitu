import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerminationDetailsComponent } from './germination-details.component';

describe('GerminationDetailsComponent', () => {
  let component: GerminationDetailsComponent;
  let fixture: ComponentFixture<GerminationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GerminationDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GerminationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
