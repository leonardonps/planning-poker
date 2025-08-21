import { AfterViewInit, Component, computed, HostBinding, inject, OnDestroy, Signal, ViewChild, ViewContainerRef } from "@angular/core";

import { ActivatedRoute } from "@angular/router";

import { SupabaseService } from "../../services/shared/supabase/supabase.service";

import { SessaoService } from "../../services/sessao/sessao.service";
import { ModalUsuarioService } from "../../services/sessao/modal-usuario/modal-usuario.service";
import { ModalOpcoesEstimativaService } from "../../services/sessao/modal-opcoes-estimativa/modal-opcoes-estimativa.service";
import { ToastService } from "../../services/shared/toast/toast.service";

import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { truncarNumero } from "../../utils/funcoes/truncarNumero/truncarNumero";
import { LoadingSpinnerService } from "../../services/shared/loading-spinner/loading-spinner.service";


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
  private modalOpcoesEstimativaService = inject(ModalOpcoesEstimativaService);
  private toastService = inject(ToastService);
  private loadingSpinnerService = inject(LoadingSpinnerService);

  private sessaoLink = window.location.href;

  usuarios: Signal<IUsuario[]> = computed(() =>
    this.sessaoService.usuarios().sort((a, b) => a.nome.localeCompare(b.nome)));

  estimativasUsuarios: Signal<number[]> = computed(() => this.usuarios().filter(usuario => usuario.estimativa !== null).map(usuario => usuario.estimativa as number));
  
  opcoesEstimativa: Signal<number[] | undefined> = computed(() => this.sessaoService.sessao()?.opcoesEstimativa.split(', ').map(Number)); 

  mediaEstimativasSessao: Signal<number | null | undefined> = computed(() => this.sessaoService.sessao()?.mediaEstimativasSessao);
  
  opcaoSelecionada: Signal<number | null | undefined> = computed(() => this.sessaoService.usuario()?.estimativa) 

  ngOnInit() {
    this.loadingSpinnerService.exibir();
    
    const sessaoId = this.route.snapshot.paramMap.get('id');
    const usuarioId = sessionStorage.getItem('usuarioId');
    const usuarioEstimativa = sessionStorage.getItem('usuarioEstimativa');

    if (!sessaoId) return alert(`Não foi possível achar o id da sessão`);

    sessionStorage.setItem('sessaoId', sessaoId);
    
    this.sessaoService.criarCanal(sessaoId);
  
    this.sessaoService.setSessao(sessaoId);
    this.sessaoService.setUsuarios(sessaoId);
    

    if (usuarioId) {
      this.sessaoService.setUsuario(usuarioId);
     
      if (usuarioEstimativa) this.sessaoService.atualizarEstimativaUsuario(+usuarioEstimativa);
    }
  }

  ngAfterViewInit() {
    this.toastService.registrarHost(this.toastContainerRef);
    this.modalUsuarioService.registrarHost(this.modalContainerRef);
    this.modalOpcoesEstimativaService.registrarHost(this.modalContainerRef);

    this.modalUsuarioService.abrir(); 
  }

  ngOnDestroy() {
    sessionStorage.clear();
    
    this.toastService.destruirToast();
    this.modalUsuarioService.destruirModal();
    this.modalOpcoesEstimativaService.destruirModal();
    
    this.sessaoService.destruirCanal();
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
    const usuario = this.sessaoService.usuario();
    
    if (!usuario) return alert('Falha ao encontrar o usuário. Por favor, acesse novamente a sessão.');

    const opcaoSelecionada = value !== usuario.estimativa ? value : null;

    this.sessaoService.atualizarEstimativaUsuario(opcaoSelecionada);

    this.supabaseService.atualizarEstimativaUsuario(usuario.id, opcaoSelecionada);

    if (opcaoSelecionada) 
      sessionStorage.setItem('usuarioEstimativa', opcaoSelecionada.toString());
    else 
      sessionStorage.removeItem('usuarioEstimativa');
  }

  salvarEstimativaSessao() {
    const sessao = this.sessaoService.sessao();

    if (!sessao) return alert('Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.');

    const usuariosEstimativas = this.estimativasUsuarios();

    const mediaEstimativasSessao = this.sessaoService.calcularMediaEstimativasSessao(usuariosEstimativas);

    this.supabaseService.atualizarEstimativaSessao(sessao.id, truncarNumero(mediaEstimativasSessao, 1));
  }

  reiniciarEstimativaSessao() {
    const sessao = this.sessaoService.sessao();

    if (!sessao) return alert('Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.'); 

    this.supabaseService.atualizarEstimativaSessao(sessao.id, null);
    this.supabaseService.atualizarEstimativasUsuarios(sessao.id, null);
  }

  abrirModalEditarOpcoesEstimativa() {
    this.modalOpcoesEstimativaService.abrir();    
  }

}
