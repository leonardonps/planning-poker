import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionResultsModal } from './session-results-modal';

describe('SessionResultsModal', () => {
  let component: SessionResultsModal;
  let fixture: ComponentFixture<SessionResultsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionResultsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionResultsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
