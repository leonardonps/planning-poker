import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimateOptionsModal } from './estimate-options-modal';

describe('EstimateOptionsModal', () => {
  let component: EstimateOptionsModal;
  let fixture: ComponentFixture<EstimateOptionsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimateOptionsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstimateOptionsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
