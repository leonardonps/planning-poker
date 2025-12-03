import {
  computed,
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { IUsuario } from '../../interfaces/shared/usuario/usuario';
import { ISessao } from '../../interfaces/shared/sessao/sessao';
import { SupabaseService } from '../shared/supabase/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { LoadingSpinnerService } from '../shared/loading-spinner/loading-spinner.service';
import { ToastService } from '../shared/toast/toast.service';
import { truncarNumero } from '../../../utils/funcoes/truncarNumero/truncarNumero';
import { ModalUsuarioService } from './modal-usuario/modal-usuario.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private router = inject(Router);

  private supabaseService = inject(SupabaseService);

  private loadingSpinnerService = inject(LoadingSpinnerService);
  private toastService = inject(ToastService);
  private modalUsuarioService = inject(ModalUsuarioService);

  private canal: RealtimeChannel | null = null;

  sessao: WritableSignal<ISessao | null> = signal(null);
  usuarios: WritableSignal<IUsuario[]> = signal([]);
  usuariosPresentes: Signal<IUsuario[]> = computed(() =>
    this.usuarios().filter((usuario) =>
      this.usuariosPresentesId().includes(usuario.id),
    ),
  );
  usuariosPresentesId: WritableSignal<string[]> = signal([]);
  usuario: WritableSignal<IUsuario | undefined> = signal(undefined);

  destruirCanal(): void {
    this.canal?.unsubscribe();
    this.canal = null;
  }

  copiarSessaoLink(sessaoLink: string): void {
    try {
      navigator.clipboard.writeText(sessaoLink).then(() =>
        this.toastService.exibir({
          mensagem: 'Link copiado para a área de transferência',
        }),
      );
    } catch (error) {
      this.toastService.exibir({
        mensagem: `Falha ao copiar link para a área de transferência: ${error}`,
      });
    }
  }

  calcularMediaEstimativasSessao(estimativasSessao: number[]): number {
    const valorInicial = 0;

    const mediaEstimativasSessao: number =
      estimativasSessao.reduce(
        (somaEstimativas, estimativa) => somaEstimativas + estimativa,
        valorInicial,
      ) / estimativasSessao.length;

    return mediaEstimativasSessao;
  }

  atualizarUsuariosPresentes() {
    if (!this.canal) return alert('Canal não foi encontrado!');

    const usuariosPresentesId = Object.values(this.canal.presenceState())
      .flat()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((presenca: any) => presenca.usuarioId);

    this.usuariosPresentesId.set(usuariosPresentesId);
  }

  async inicializarSessao(sessaoId: string, usuarioId: string | null) {
    try {
      if (this.sessao()?.id !== sessaoId) {
        await this.setSessao(sessaoId);
      }

      if (!this.sessao()) {
        this.router.navigate(['/']);
        usuarioId = null;
        sessionStorage.removeItem('usuarioId');
        this.loadingSpinnerService.fechar();
        return;
      }

      if (
        this.sessao() &&
        this.sessao()?.id !== sessionStorage.getItem('sessaoId')
      ) {
        usuarioId = null;
        sessionStorage.removeItem('usuarioId');
      }

      sessionStorage.setItem('sessaoId', sessaoId);

      await this.setUsuarios(sessaoId);

      this.usuario.set(
        this.usuarios().find((usuario) => usuario.id === usuarioId),
      );

      await this.criarCanalSessao(sessaoId);

      this.loadingSpinnerService.fechar();
      this.modalUsuarioService.abrir();
    } catch (error) {
      alert(`Falha ao inicializar uma sessão: ${error}`);
    }
  }

  async criarCanalSessao(sessaoId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.canal = this.supabaseService.supabase.channel(`sessao:${sessaoId}`, {
        config: {
          broadcast: {
            self: true,
          },
        },
      });

      this.canal
        .on(
          'presence',
          {
            event: 'sync',
          },
          () => {
            this.atualizarUsuariosPresentes();
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'usuario',
            filter: `sessao_id=eq.${sessaoId}`,
          },
          (payload) => {
            const novoUsuario: IUsuario = {
              id: payload.new['id'],
              nome: payload.new['nome'],
              estimativa: payload.new['estimativa'],
              observador: payload.new['observador'],
              sessaoId: payload.new['sessao_id'],
              dataCriacao: payload.new['data_criacao'],
            };

            const usuarios = this.usuarios();

            this.usuarios.set([...usuarios, novoUsuario]);
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'usuario',
            filter: `sessao_id=eq.${sessaoId}`,
          },
          (payload) => {
            const usuariosAtualizados: IUsuario[] = this.usuarios().map(
              (usuario) =>
                usuario.id === payload.new['id']
                  ? ({
                      ...usuario,
                      estimativa: payload.new['estimativa'],
                      observador: payload.new['observador'],
                    } as IUsuario)
                  : (usuario as IUsuario),
            );
            this.usuarios.set(usuariosAtualizados);
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessao',
            filter: `id=eq.${sessaoId}`,
          },
          (payload) => {
            const mediaEstimativasSessao: number | null =
              payload.new['media_estimativas_sessao'];

            const opcoesEstimativa: string = payload.new['opcoes_estimativa'];

            if (mediaEstimativasSessao === null) {
              this.usuario.update(
                (atual) => ({ ...atual, estimativa: null }) as IUsuario,
              );
            }

            let sessao = this.sessao();

            if (sessao)
              sessao = {
                ...sessao,
                opcoesEstimativa: opcoesEstimativa,
                mediaEstimativasSessao: mediaEstimativasSessao,
              };

            this.sessao.set(sessao);
          },
        )
        .subscribe(async (status) => {
          switch (status) {
            case 'SUBSCRIBED':
              try {
                const usuario = this.usuario();
                if (usuario) {
                  await this.rastrearPresenca(usuario);
                }
                resolve();
              } catch (error) {
                alert(error);
              }
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              this.toastService.exibir({
                mensagem: 'Conexão perdida',
                duracao: 5000,
              });
              reject();
              break;
          }
        });
    });
  }

  async setSessao(id: string): Promise<void> {
    const sessao: ISessao | null = await this.supabaseService.buscarSessao(id);

    this.sessao.set(sessao);
  }

  async setUsuarios(sessaoId: string): Promise<void> {
    const usuarios: IUsuario[] =
      await this.supabaseService.buscarUsuariosSessao(sessaoId);
    this.usuarios.set(usuarios);
  }

  async rastrearPresenca(usuario: IUsuario) {
    try {
      if (!this.canal) {
        throw new Error('Canal para o supabase não encontrado');
      }
      await this.canal.track({
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        onlineEm: new Date().toISOString(),
      });
      this.toastService.exibir({
        mensagem: 'Conexão estabelecida',
      });
    } catch (error) {
      alert(error);
    }
  }

  async atualizarEstimativaUsuario(opcao: number) {
    let usuario = this.usuario();

    if (!usuario)
      return alert(
        'Falha ao encontrar o usuário. Por favor, acesse novamente a sessão.',
      );

    const estimativa = opcao === usuario.estimativa ? null : opcao;

    usuario = { ...usuario, estimativa };

    this.usuario.set(usuario);

    await this.supabaseService.atualizarEstimativaUsuario(
      usuario.id,
      estimativa,
    );
  }

  async atualizarMediaEstimativaSessao(estimativas: number[]) {
    try {
      const sessao = this.sessao();

      if (!sessao) {
        throw new Error(
          'Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.',
        );
      }

      const mediaEstimativasSessao =
        this.calcularMediaEstimativasSessao(estimativas);

      await this.supabaseService.atualizarEstimativaSessao(
        sessao.id,
        truncarNumero(mediaEstimativasSessao, 1),
      );
    } catch (error) {
      alert(error);
    }
  }

  async reiniciarEstimativaSessao() {
    const sessao = this.sessao();

    if (!sessao)
      return alert(
        'Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.',
      );

    await this.supabaseService.atualizarEstimativaSessao(sessao.id, null);
    await this.supabaseService.atualizarEstimativasUsuarios(sessao.id, null);
  }

  async mudarModoUsuario(): Promise<void> {
    try {
      let usuario = this.usuario();

      if (!usuario) {
        throw new Error(
          'Falha ao encontrar o usuário. Por favor, acesse novamente a sessão',
        );
      }
      const observador = !this.usuario()?.observador;
      const estimativa = null;

      usuario = { ...usuario, observador, estimativa };
      this.usuario.set(usuario);
      await this.supabaseService.atualizarModoUsuario(usuario.id, observador);
      await this.supabaseService.atualizarEstimativaUsuario(
        usuario.id,
        estimativa,
      );
    } catch (error) {
      alert(error);
    }
  }
}
