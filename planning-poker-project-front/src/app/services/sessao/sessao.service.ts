import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { ISessao } from "../../interfaces/shared/sessao/sessao";
import { SupabaseService } from "../shared/supabase/supabase.service";
import { RealtimeChannel } from "@supabase/supabase-js";
import { LoadingSpinnerService } from "../shared/loading-spinner/loading-spinner.service";
import { ToastService } from "../shared/toast/toast.service";
import { truncarNumero } from "../../../utils/funcoes/truncarNumero/truncarNumero";
import { ModalUsuarioService } from "./modal-usuario/modal-usuario.service";
import { gerarId } from "../../../utils/funcoes/geracaoId/gerarId";
import { gerarNumeroAleatorio } from "../../../utils/funcoes/geracaoId/geradorNumeroAleatorio";

@Injectable({ providedIn: 'root'})
export class SessaoService {
    private supabaseService = inject(SupabaseService);
    private loadingSpinnerService = inject(LoadingSpinnerService);
    private toastService = inject(ToastService);
    private modalUsuarioService = inject(ModalUsuarioService);
    
    private canal: RealtimeChannel | null = null;

    sessao: WritableSignal<ISessao | null> = signal(null);
    usuarios: WritableSignal<IUsuario[]> = signal([]);
    usuario: WritableSignal<IUsuario | null> = signal(null);

    criarCanalSessao(sessaoId: string, usuarioId: string | null, usuarioEstimativa: string | null): void {
        this.canal = this.supabaseService.supabase.channel(`sessao-${sessaoId}`);

        this.canal.on('presence', {
            event: 'sync'
        }, () => {
            const newState = this.canal?.presenceState();
            console.log('sync', newState);
        })
        .on('presence', {
            event: 'join'
        }, ({key, newPresences}) => {
            console.log('join', key, newPresences);
        })
        .on('presence', {
            event: 'leave'
        }, ({key, leftPresences}) => {
            console.log('leave', key, leftPresences)
        })
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'usuario',
            filter: `sessao_id=eq.${sessaoId}`
        },
            (payload) => {
            const novoUsuario: IUsuario = {
                id: payload.new['id'],
                nome: payload.new['nome'],
                estimativa: payload.new['estimativa'],
                observador: payload.new['observador'],
                sessaoId: payload.new['sessao_id'],
                dataCriacao: payload.new['data_criacao']
            }; 

            const usuarios = this.usuarios();
        
            this.usuarios.set([...usuarios, novoUsuario]);
            }
        ).on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'usuario',
            filter: `sessao_id=eq.${sessaoId}`
        },
            (payload) => {
                const usuariosAtualizados: IUsuario[] = this.usuarios().map(usuario => 
                    usuario.id === payload.new['id'] ? {
                    ...usuario,
                    estimativa: payload.new['estimativa']
                    } as IUsuario : usuario as IUsuario
                );                
                this.usuarios.set(usuariosAtualizados);
            }
        ).on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessao',
            filter: `id=eq.${sessaoId}`
        }, (payload) => {
            const mediaEstimativasSessao: number | null = payload.new['media_estimativas_sessao'];

            const opcoesEstimativa: string = payload.new['opcoes_estimativa'];

            if (mediaEstimativasSessao == null) {
                if (sessionStorage.getItem('usuarioEstimativa')) sessionStorage.removeItem('usuarioEstimativa');

                this.usuario.update(atual => ({...atual, estimativa: null} as IUsuario));
            }

            let sessao = this.sessao();

            if (sessao) sessao = {...sessao, opcoesEstimativa: opcoesEstimativa, mediaEstimativasSessao: mediaEstimativasSessao};

            this.sessao.set(sessao);
        }).on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'usuario',
            filter: `sessao_id=eq.${sessaoId}}`
        }, (payload) => {
            const usuarioRemovido = payload.old;
            const usuarios = this.usuarios().filter(usuario => usuario.id !== usuarioRemovido['id']);

            this.usuarios.set(usuarios);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
        
                const presenceTrackStatus = await this.canal?.track({
                    id: gerarId(10)
                });
                console.log(presenceTrackStatus);

                this.inicializarSessao(sessaoId, usuarioId, usuarioEstimativa);
                this.loadingSpinnerService.fechar();
                this.modalUsuarioService.abrir();
            }
        });
    }
    
    destruirCanal(): void {
        this.canal?.unsubscribe();
        this.canal = null;
    }

    inicializarSessao(sessaoId: string, usuarioId: string | null, usuarioEstimativa: string | null) {
        this.setSessao(sessaoId);
        this.setUsuarios(sessaoId);
                
        if (usuarioId) this.setUsuario(usuarioId);
        if (usuarioEstimativa) this.setEstimativaUsuario(+usuarioEstimativa);
    }


    atualizarEstimativaUsuario(opcao: number) {
        const usuario = this.usuario();
    
        if (!usuario) return alert('Falha ao encontrar o usuário. Por favor, acesse novamente a sessão.');

        const opcaoSelecionada = opcao === usuario.estimativa ? null : opcao;

        this.supabaseService.atualizarEstimativaUsuario(usuario.id, opcaoSelecionada);
    
        this.setEstimativaUsuario(opcaoSelecionada);

        if (opcaoSelecionada) 
            sessionStorage.setItem('usuarioEstimativa', opcaoSelecionada.toString());
        else 
            sessionStorage.removeItem('usuarioEstimativa');
    }

    atualizarMediaEstimativaSessao(estimativas: number[]) {
        const sessao = this.sessao();

        if (!sessao) return alert('Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.');

        const mediaEstimativasSessao = this.calcularMediaEstimativasSessao(estimativas);

        this.supabaseService.atualizarEstimativaSessao(sessao.id, truncarNumero(mediaEstimativasSessao, 1));
    }

    reiniciarEstimativaSessao() {
        const sessao = this.sessao();

        if (!sessao) return alert('Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.'); 

        this.supabaseService.atualizarEstimativaSessao(sessao.id, null);
        this.supabaseService.atualizarEstimativasUsuarios(sessao.id, null);
    }

    copiarSessaoLink(sessaoLink: string): void {
        try {
            navigator
                .clipboard
                .writeText(sessaoLink)
                .then(() => this.toastService.exibir({
                    mensagem: 'Link copiado para a área de transferência'
                }) )
        } catch (error) {
            this.toastService.exibir({
                    mensagem: `Falha ao copiar link para a área de transferência: ${error}`
            });
        }
    }
    
    calcularMediaEstimativasSessao(estimativasSessao: number[]): number { 
        const valorInicial: number = 0;
        
        const mediaEstimativasSessao: number = estimativasSessao.reduce((somaEstimativas, estimativa) => somaEstimativas + estimativa, valorInicial)/estimativasSessao.length;
        
        return mediaEstimativasSessao;
    }

    async setSessao(id: string): Promise<void> {
        const sessao: ISessao | null = await this.supabaseService.buscarSessao(id);
        
        this.sessao.set(sessao);
    }

    async setUsuarios(sessaoId: string): Promise<void> {
        const usuarios: IUsuario[] = await this.supabaseService.buscarUsuariosSessao(sessaoId);

        this.usuarios.set(usuarios);
    }

    async setUsuario(id: string): Promise<void> {
        const usuario: IUsuario | null = await this.supabaseService.buscarUsuario(id);
        
        this.usuario.set(usuario);
    }
    
    setEstimativaUsuario(estimativa: number | null): void {
        let usuario = this.usuario();
        
        if (usuario) usuario = {...usuario, estimativa}

        this.usuario.set(usuario);
    }
}