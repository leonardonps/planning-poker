import { Component, ElementRef, HostBinding, inject, ViewChild,  } from '@angular/core';
import { Router,  } from '@angular/router';
import { gerarId } from '../../utils/funcoes/geracaoId/gerarId';
import { opcoesIniciaisEstimativa } from '../../constantes/opcoesIniciaisEstimativa';
import { ISessao } from '../../interfaces/shared/sessao/sessao';
import { SupabaseService } from '../../services/shared/supabase/supabase.service';
import { SessaoService } from '../../services/sessao/sessao.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  @HostBinding('class') classname = 'flex-column justify-content-center align-items-center';

  private router = inject(Router);
  private sessaoService = inject(SessaoService);

  desabilitado: boolean = false;

  async criarNovaSessao() {
    this.desabilitado = true;

    const novaSessao: ISessao = {
      id: gerarId(6),
      opcoesEstimativa: opcoesIniciaisEstimativa,
      mediaEstimativasSessao: null,
      dataCriacao: null
    };

    const sessao: ISessao | null = await this.sessaoService.criarSessao(novaSessao);

    if (sessao) {
        this.router.navigate(['sessao', sessao.id]);
    }
  }  
}
