import { Component, inject, OnInit } from '@angular/core';
import { ModalBase } from '../../../shared/modal-base/modal-base';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SessaoService } from '../../../../services/sessao/sessao.service';
import { opcoesEstimativaValidator } from '../../../../utils/validators/opcoesEstimativa';

@Component({
  selector: 'app-modal-opcoes-estimativa',
  imports: [ModalBase, ReactiveFormsModule],
  templateUrl: './modal-opcoes-estimativa.html',
  styleUrl: './modal-opcoes-estimativa.scss'
})
export class ModalOpcoesEstimativa implements OnInit {
  private sessaoService = inject(SessaoService);

  titulo: string = 'Editar opções de estimativa';

  formOpcoesEstimativa!: FormGroup;
  submitted: boolean = false;

  ngOnInit(): void {
    const opcoesEstimativaAtuais = this.sessaoService.opcoesEstimativa()?.toString();
    this.formOpcoesEstimativa = new FormGroup({
      opcoesEstimativa: new FormControl(
        opcoesEstimativaAtuais, 
        {
          validators:[Validators.required, 
          opcoesEstimativaValidator(/^(0|[1-9]\d*)(\.\d)?(, (0|[1-9]\d*)(\.\d)?)*$/)],
          updateOn: 'blur'}
        )
    });
  }

  salvar() {
    this.submitted = true;

    if(this.formOpcoesEstimativa.valid) {
      
    }
  }
}
