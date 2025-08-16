import { Component, HostBinding, inject,  } from '@angular/core';
import { Router,  } from '@angular/router';
import { gerarId } from '../../utils/funcoes/geracaoId/gerarId';
import { opcoesIniciaisEstimativa } from '../../constantes/opcoesIniciaisEstimativa';
import { ISessao } from '../../interfaces/shared/sessao/sessao';
import { SupabaseService } from '../../services/shared/supabase/supabase.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  @HostBinding('class') classname = 'flex-column justify-content-center align-items-center';
  
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  async criarNovaSessao() {
    try {
      const sessao: ISessao | null = await this.supabaseService.inserirSessao({
        id: gerarId(6), 
        opcoesEstimativa: opcoesIniciaisEstimativa
      });

      if (sessao) {
        this.router.navigate(['sessao', sessao.id]);
      }
    } catch(error) {
      alert('Falha ao criar a sessão');
    }
  }
  
}
