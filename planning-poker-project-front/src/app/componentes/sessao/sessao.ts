import { AfterViewInit, Component, HostBinding, inject, OnDestroy, ViewChild, ViewContainerRef } from "@angular/core";
import { ToastService } from "../../services/shared/toast/toast.service";
import { ActivatedRoute } from "@angular/router";
import { ModalUsuarioService } from "../../services/sessao/modal-usuario/modal-usuario.service";

@Component({
  selector: 'app-sessao',
  imports: [],
  templateUrl: './sessao.html',
  styleUrl: './sessao.scss'
})
export class Sessao implements AfterViewInit, OnDestroy {
  @ViewChild('toast', { read: ViewContainerRef }) toastContainerRef!: ViewContainerRef; 
  @ViewChild('modal', { read: ViewContainerRef }) modalContainerRef!: ViewContainerRef; 
  @HostBinding('class') classname = 'flex-column justify-content-space-between align-items-center';
  
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private modalUsuarioService = inject(ModalUsuarioService);

  private sessaoLink = window.location.href;

  usuarios: string[] = ['Amanda', 'Leonardo', 'Matheus', 'Raquel', 'Thamires', 'Maria Eduarda S', 'Pedro', 'Maria Rita', 'Yasmin', 'Renato', 'Romenildo', 'Mateus'];

  opcoesEstimativa: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  opcaoSelecionada: number | null = null;

  ngOnInit() {
    const sessaoId = this.route.snapshot.paramMap.get('id');

    if (sessaoId) {
      sessionStorage.setItem('sessaoId', sessaoId);
    }
  }

  ngAfterViewInit() {
    this.toastService.registrarHost(this.toastContainerRef);
    this.modalUsuarioService.registrarHost(this.modalContainerRef);
    this.modalUsuarioService.abrir();
  }
  
  // ngAfterViewChecked() {
  //   console.log('mudou')
  //   this.toastService.registrarHost(this.sessaoRef);
  // }

  ngOnDestroy() {
    this.toastService.destruirToast();
    sessionStorage.clear();
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
    if (this.opcaoSelecionada === value) {
      this.opcaoSelecionada = null;
      return;
    }
    this.opcaoSelecionada = value;
    console.log(this.opcaoSelecionada);
  }
}
