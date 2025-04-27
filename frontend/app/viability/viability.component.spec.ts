import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerminationComponent } from './viability.component';

describe('GerminationComponent', () => {
  let component: GerminationComponent;
  let fixture: ComponentFixture<GerminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GerminationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GerminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
