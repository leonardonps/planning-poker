import {
  AfterViewInit,
  Component,
  computed,
  HostBinding,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { SessaoService } from '../../services/sessao/sessao.service';
import { ModalUsuarioService } from '../../services/sessao/modal-usuario/modal-usuario.service';
import { LoadingSpinnerService } from '../../services/shared/loading-spinner/loading-spinner.service';
import { ModalOpcoesEstimativaService } from '../../services/sessao/modal-opcoes-estimativa/modal-opcoes-estimativa.service';
import { ToastService } from '../../services/shared/toast/toast.service';

import { IUsuario } from '../../interfaces/shared/usuario/usuario';

@Component({
  selector: 'app-sessao',
  imports: [],
  templateUrl: './sessao.html',
  styleUrl: './sessao.scss',
})
export class Sessao implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('toast', { read: ViewContainerRef })
  toastContainerRef!: ViewContainerRef;
  @ViewChild('modal', { read: ViewContainerRef })
  modalContainerRef!: ViewContainerRef;
  @HostBinding('class') classname =
    'flex-column justify-content-space-between align-items-center';

  private route = inject(ActivatedRoute);

  private sessaoService = inject(SessaoService);

  private modalUsuarioService = inject(ModalUsuarioService);
  private modalOpcoesEstimativaService = inject(ModalOpcoesEstimativaService);
  private toastService = inject(ToastService);
  private loadingSpinnerService = inject(LoadingSpinnerService);

  private sessaoLink = window.location.href;

  usuariosPresentes: Signal<IUsuario[]> = computed(() =>
    this.sessaoService
      .usuariosPresentes()
      .sort((a, b) => a.nome.localeCompare(b.nome)),
  );

  estimativasUsuarios: Signal<number[]> = computed(() =>
    this.usuariosPresentes()
      .filter((usuario) => usuario.estimativa !== null)
      .map((usuario) => usuario.estimativa as number),
  );

  opcoesEstimativa: Signal<number[] | undefined> = computed(() =>
    this.sessaoService.sessao()?.opcoesEstimativa.split(', ').map(Number),
  );

  mediaEstimativasSessao: Signal<number | null | undefined> = computed(
    () => this.sessaoService.sessao()?.mediaEstimativasSessao,
  );

  opcaoSelecionada: Signal<number | null | undefined> = computed(
    () => this.sessaoService.usuario()?.estimativa,
  );

  ngOnInit() {
    this.loadingSpinnerService.exibir();

    const sessaoId = this.route.snapshot.paramMap.get('id');
    const usuarioId = sessionStorage.getItem('usuarioId');

    if (!sessaoId) return alert(`Não foi possível achar o id da sessão`);

    this.sessaoService.inicializarSessao(sessaoId, usuarioId);
  }

  ngAfterViewInit() {
    this.toastService.registrarHost(this.toastContainerRef);
    this.modalUsuarioService.registrarHost(this.modalContainerRef);
    this.modalOpcoesEstimativaService.registrarHost(this.modalContainerRef);
  }

  ngOnDestroy() {
    sessionStorage.clear();

    this.toastService.destruirToast();
    this.modalUsuarioService.destruirModal();
    this.modalOpcoesEstimativaService.destruirModal();

    this.sessaoService.destruirCanal();
  }

  copiarSessaoLink() {
    this.sessaoService.copiarSessaoLink(this.sessaoLink);
  }

  selecionarEstimativa(opcao: number) {
    this.sessaoService.atualizarEstimativaUsuario(opcao);
  }

  calcularEstimativaSessao() {
    const estimativasUsuarios = this.estimativasUsuarios();

    this.sessaoService.atualizarMediaEstimativaSessao(estimativasUsuarios);
  }

  reiniciarEstimativaSessao() {
    this.sessaoService.reiniciarEstimativaSessao();
  }

  abrirModalEditarOpcoesEstimativa() {
    this.modalOpcoesEstimativaService.abrir();
  }
}
