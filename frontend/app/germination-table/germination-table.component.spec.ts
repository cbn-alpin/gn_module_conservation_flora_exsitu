import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerminationTableComponent } from './germination-table.component';

describe('GerminationTableComponent', () => {
  let component: GerminationTableComponent;
  let fixture: ComponentFixture<GerminationTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GerminationTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GerminationTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
