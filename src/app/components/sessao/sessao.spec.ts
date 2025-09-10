import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sessao } from './sessao';

describe('Sessao', () => {
  let component: Sessao;
  let fixture: ComponentFixture<Sessao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sessao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sessao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
