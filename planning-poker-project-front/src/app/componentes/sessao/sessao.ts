import { AfterViewInit, Component, computed, HostBinding, inject, OnDestroy, Signal, ViewChild, ViewContainerRef, WritableSignal } from "@angular/core";
import { ToastService } from "../../services/shared/toast/toast.service";
import { ActivatedRoute } from "@angular/router";
import { ModalUsuarioService } from "../../services/sessao/modal-usuario/modal-usuario.service";
import { SessaoService } from "../../services/sessao/sessao.service";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { SupabaseService } from "../../services/shared/supabase/supabase.service";
import { truncarNumero } from "../../../utils/truncarNumero/truncarNumero";

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

  usuarios: Signal<IUsuario[]> = computed(() => this.sessaoService.usuarios().sort((a,b) => a.nome.localeCompare(b.nome)));
  estimativasUsuarios: Signal<number[]> = computed(() => this.usuarios().filter(usuario => usuario.estimativa !== null).map(usuario => +usuario.estimativa!));
  mediaEstimativasSessao: WritableSignal<number | null> = this.sessaoService.mediaEstimativasSessao;

  opcoesEstimativa: WritableSignal<number[] | null> = this.sessaoService.opcoesEstimativa;
  opcaoSelecionada: WritableSignal<number | null> = this.sessaoService.opcaoSelecionada;

  ngOnInit() {
    const sessaoId = this.route.snapshot.paramMap.get('id');
    const usuarioEstimativa = sessionStorage.getItem('usuarioEstimativa');

    if (sessaoId) {
      sessionStorage.setItem('sessaoId', sessaoId);
     
      this.supabaseService.criarCanal(sessaoId);
      
      this.supabaseService.buscarUsuariosSessao(sessaoId);
      this.supabaseService.buscarOpcoesEstimativaSessao(sessaoId);
    }

    if (usuarioEstimativa) this.opcaoSelecionada.set( +usuarioEstimativa);
  }

  ngAfterViewInit() {
    this.toastService.registrarHost(this.toastContainerRef);
    this.modalUsuarioService.registrarHost(this.modalContainerRef);

    this.modalUsuarioService.abrir(); 
  }

  ngOnDestroy() {
    sessionStorage.clear();
    
    this.toastService.destruirToast();
    this.modalUsuarioService.destruirModal();
    
    this.supabaseService.destruirCanal();

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

    this.opcaoSelecionada.set(this.
    opcaoSelecionada() === value ? null : value);

    const opcaoSelecionada: number | null = this.opcaoSelecionada();

    this.supabaseService.atualizarEstimativaUsuario(usuarioId, this.opcaoSelecionada());

    if (opcaoSelecionada) 
      sessionStorage.setItem('usuarioEstimativa', opcaoSelecionada.toString());
    else 
      sessionStorage.removeItem('usuarioEstimativa');
  }

  calcularEstimativaSessao() {
    const sessaoId = sessionStorage.getItem('sessaoId');

    if (!sessaoId) return alert('O id da sessão não está armazenado na sessionStorage');

    const valorInicial: number = 0;
    const mediaEstimativasSessao: number = this.estimativasUsuarios().reduce((somaEstimativas, estimativa) => somaEstimativas + estimativa, valorInicial)/this.estimativasUsuarios().length;

    this.supabaseService.atualizarEstimativaSessao(sessaoId, truncarNumero(mediaEstimativasSessao, 1));
  }

  reiniciarEstimativaSessao() {
    const sessaoId = sessionStorage.getItem('sessaoId');

    if (!sessaoId) return alert('O id da sessão não está armazenado na sessionStorage'); 

    this.supabaseService.atualizarEstimativaSessao(sessaoId, null);
    this.supabaseService.atualizarEstimativasUsuarios(sessaoId, null);
  }

  abrirModalEditarOpcoesEstimativa() {
    console.log('oiii');    
  }
}
