import { Component, HostBinding, inject,  } from '@angular/core';
import { Router,  } from '@angular/router';
import { gerarId } from '../../utils/geracaoId/gerarId';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  @HostBinding('class') classname = 'flex-column justify-content-center align-items-center';
  private router = inject(Router);

  novaSessao() {
    const sessao: string = gerarId(6);
    sessionStorage.setItem('sessao', sessao);
    this.router.navigate(['sessao', sessao]);
  }  
}
