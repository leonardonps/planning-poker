import { AfterViewInit, Component, computed, HostBinding, inject, OnDestroy, Signal, ViewChild, ViewContainerRef, WritableSignal } from "@angular/core";
import { ToastService } from "../../services/shared/toast/toast.service";
import { ActivatedRoute } from "@angular/router";
import { ModalUsuarioService } from "../../services/sessao/modal-usuario/modal-usuario.service";
import { SessaoService } from "../../services/sessao/sessao.service";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { SupabaseService } from "../../services/shared/supabase/supabase.service";

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

  private supabaseService = inject(SupabaseService);
  private sessaoService = inject(SessaoService);
  private modalUsuarioService = inject(ModalUsuarioService);
  private toastService = inject(ToastService);

  private sessaoLink = window.location.href;

  usuarios: WritableSignal<IUsuario[]> = this.sessaoService.usuarios;
  estimativasUsuarios: Signal<number[]> = computed(() => this.usuarios().filter(usuario => usuario.estimativa !== null).map(usuario => +usuario.estimativa!));
  opcoesEstimativa: WritableSignal<number[] | null> = this.sessaoService.opcoesEstimativa;
  opcaoSelecionada: number | null = null;

  ngOnInit() {
    const sessaoId = this.route.snapshot.paramMap.get('id');
    const usuarioEstimativa = sessionStorage.getItem('usuarioEstimativa');

    if (sessaoId) {
      sessionStorage.setItem('sessaoId', sessaoId);

      this.supabaseService.buscarUsuariosSessao(sessaoId);
      this.supabaseService.buscarOpcoesEstimativaSessao(sessaoId);
    }

    if (usuarioEstimativa) this.opcaoSelecionada = +usuarioEstimativa;
  }

  ngAfterViewInit() {
    this.toastService.registrarHost(this.toastContainerRef);
    this.modalUsuarioService.registrarHost(this.modalContainerRef);

    this.modalUsuarioService.abrir(); 
  }

  ngOnDestroy() {
    this.toastService.destruirToast();
    this.modalUsuarioService.destruirModal();
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
    const usuarioId = sessionStorage.getItem('usuarioId');

    if (!usuarioId) return alert('Usuário sem o id armazenado na sessionStorage');

    this.opcaoSelecionada = this.
    opcaoSelecionada === value ? null : value;

    this.supabaseService.atualizarEstimativaUsuario(usuarioId, this.opcaoSelecionada);

    if (this.opcaoSelecionada) 
      sessionStorage.setItem('usuarioEstimativa', this.opcaoSelecionada.toString());
    else 
      sessionStorage.removeItem('usuarioEstimativa');
  }
}
