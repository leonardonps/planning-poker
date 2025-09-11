import { Component, inject, OnInit } from '@angular/core';
import { ModalBase } from '../../../shared/modal-base/modal-base';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SessaoService } from '../../../../services/sessao/sessao.service';
import { SupabaseService } from '../../../../services/shared/supabase/supabase.service';
import { ModalOpcoesEstimativaService } from '../../../../services/sessao/modal-opcoes-estimativa/modal-opcoes-estimativa.service';
import { opcoesEstimativaValidator } from '../../../../validators/opcoesEstimativa';

@Component({
  selector: 'app-modal-opcoes-estimativa',
  imports: [ModalBase, ReactiveFormsModule],
  templateUrl: './modal-opcoes-estimativa.html',
  styleUrl: './modal-opcoes-estimativa.scss'
})
export class ModalOpcoesEstimativa implements OnInit {

  private modalOpcoesEstimativaService = inject(ModalOpcoesEstimativaService);
  private sessaoService = inject(SessaoService);
  private supabaseService = inject(SupabaseService);

  titulo: string = 'Editar opções de estimativa';

  formOpcoesEstimativa!: FormGroup;
  submitted: boolean = false;
  desabilitado: boolean = false;

  ngOnInit(): void {
    const opcoesEstimativaAtuais = this.sessaoService.sessao()?.opcoesEstimativa.toString();
    this.formOpcoesEstimativa = new FormGroup({
      opcoesEstimativa: new FormControl(
        opcoesEstimativaAtuais, 
        {
          validators:[Validators.required, 
          opcoesEstimativaValidator(/^(0|[1-9]\d*)(\.\d)?(, (0|[1-9]\d*)(\.\d)?)*$/)],
        })
    });
  }

  salvar() {
    this.submitted = true;

    if(this.formOpcoesEstimativa.valid) {
      this.desabilitado = true;

      const sessaoId = this.sessaoService.sessao()?.id;

      if (!sessaoId) return alert('Falha ao buscar pelo id da sessão');

      const opcoesEstimativas: Set<number> = new Set(this.formOpcoesEstimativa.controls['opcoesEstimativa'].value?.split(', ').map(Number));

      const opcoesEstimativasOrdenadas = Array.from(opcoesEstimativas).sort((a,b) => a - b).join(', ');

      this.supabaseService.atualizarOpcoesEstimativaSessao(sessaoId,opcoesEstimativasOrdenadas);  

      this.supabaseService.atualizarEstimativasUsuarios(sessaoId, null);

      this.modalOpcoesEstimativaService.destruirModal();
    }
  }
}
