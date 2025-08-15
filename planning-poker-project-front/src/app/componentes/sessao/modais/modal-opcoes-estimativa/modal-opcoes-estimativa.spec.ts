import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalOpcoesEstimativa } from './modal-opcoes-estimativa';

describe('ModalOpcoesEstimativa', () => {
  let component: ModalOpcoesEstimativa;
  let fixture: ComponentFixture<ModalOpcoesEstimativa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalOpcoesEstimativa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalOpcoesEstimativa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
