import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemisTableComponent } from './germination-table.component';

describe('SemisTableComponent', () => {
  let component: SemisTableComponent;
  let fixture: ComponentFixture<SemisTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SemisTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemisTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
