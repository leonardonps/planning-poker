import { Component, HostBinding, inject } from '@angular/core';
import { Router } from '@angular/router';
import { gerarId } from '../../../utils/funcoes/geracaoId/gerarId';
import { opcoesIniciaisEstimativa } from '../../constants/opcoesIniciaisEstimativa';
import { ISessao } from '../../interfaces/shared/sessao/sessao';
import { SupabaseService } from '../../services/shared/supabase/supabase.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  @HostBinding('class') classname =
    'flex-column justify-content-center align-items-center';

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  desabilitado = false;

  async criarNovaSessao() {
    this.desabilitado = true;

    const sessaoId = gerarId(6);

    const novaSessao: ISessao = {
      id: sessaoId,
      opcoesEstimativa: opcoesIniciaisEstimativa,
      mediaEstimativasSessao: null,
      dataCriacao: null,
    };

    await this.supabaseService.inserirSessao(novaSessao);

    const sessaoCriada = await this.supabaseService.buscarSessao(sessaoId);

    if (sessaoCriada) {
      this.router.navigate(['sessao', sessaoId]);
    }
  }
}
