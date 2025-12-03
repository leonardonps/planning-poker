import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { gerarId } from '../../../utils/funcoes/geracaoId/gerarId';
import { opcoesIniciaisEstimativa } from '../../constants/opcoesIniciaisEstimativa';
import { ISessao } from '../../interfaces/shared/sessao/sessao';
import { SupabaseService } from '../../services/shared/supabase/supabase.service';
import { SessaoService } from '../../services/sessao/sessao.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private sessaoService = inject(SessaoService);

  desabilitado = false;

  async criarNovaSessao() {
    this.desabilitado = true;

    try {
      const novaSessao: ISessao = {
        id: gerarId(6),
        opcoesEstimativa: opcoesIniciaisEstimativa,
        mediaEstimativasSessao: null,
        dataCriacao: null,
      };

      const sessaoCriada = await this.supabaseService.inserirSessao(novaSessao);

      if (!sessaoCriada) {
        throw new Error('Falha ao criar sessão');
      }

      this.sessaoService.sessao.set(sessaoCriada);
      this.router.navigate(['sessao', sessaoCriada.id]);
    } catch (error) {
      alert(error);
    } finally {
      this.desabilitado = false;
    }
  }
}
