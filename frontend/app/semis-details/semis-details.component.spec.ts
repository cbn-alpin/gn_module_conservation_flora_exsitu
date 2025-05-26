import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemisDetailsComponent } from './semis-details.component';

describe('SemisDetailsComponent', () => {
  let component: SemisDetailsComponent;
  let fixture: ComponentFixture<SemisDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SemisDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemisDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


});
