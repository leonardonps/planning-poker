import { AfterViewChecked, AfterViewInit, Component, HostBinding, inject, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { ToastService } from '../shared/toast/toast.service';
import { ModalUsuario } from "./modais/modal-usuario/modal-usuario";


@Component({
  selector: 'app-sessao',
  imports: [ModalUsuario],
  templateUrl: './sessao.html',
  styleUrl: './sessao.scss'
})
export class Sessao implements AfterViewInit, OnDestroy {
  @ViewChild('toast', { read: ViewContainerRef }) sessaoRef!: ViewContainerRef; 
  @HostBinding('class') classname = 'flex-column justify-content-space-between align-items-center';
  
  private toastService = inject(ToastService);
  private sessaoLink = window.location.href;

  usuarios: string[] = ['Amanda', 'Leonardo', 'Matheus', 'Raquel', 'Thamires', 'Maria Eduarda S', 'Pedro', 'Maria Rita', 'Yasmin', 'Renato', 'Romenildo', 'Mateus'];

  opcoesEstimativa: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  opcaoSelecionada: number | null = null;

  ngAfterViewInit() {
    this.toastService.registrarHost(this.sessaoRef);
  }
  
  // ngAfterViewChecked() {
  //   console.log('mudou')
  //   this.toastService.registrarHost(this.sessaoRef);
  // }

  ngOnDestroy() {
    this.toastService.cancelarToast();
  }

  copiarSessaoLink() {
    navigator
      .clipboard
      .writeText(this.sessaoLink)
      .then( _ => this.toastService.exibir({
        mensagem: 'Link copiado para a área de transferência'
      })        
      )
      .catch(err => this.toastService.exibir({
        mensagem: `Falha ao copiar link para a área de transferência: ${err}`
      }));
  }

  selecionarOpcao(value: number) {
    this.opcaoSelecionada = value;
    console.log(this.opcaoSelecionada);
  }

  meioLista(lista: Array<string>) {
    const value = Math.ceil(lista.length/2)
    console.log(value);
    return value;

  }

}
