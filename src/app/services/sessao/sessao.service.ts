import { computed, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { ISessao } from "../../interfaces/shared/sessao/sessao";
import { SupabaseService } from "../shared/supabase/supabase.service";
import { RealtimeChannel } from "@supabase/supabase-js";
import { LoadingSpinnerService } from "../shared/loading-spinner/loading-spinner.service";
import { ToastService } from "../shared/toast/toast.service";
import { truncarNumero } from "../../../utils/funcoes/truncarNumero/truncarNumero";
import { ModalUsuarioService } from "./modal-usuario/modal-usuario.service";
import { gerarId } from "../../../utils/funcoes/geracaoId/gerarId";
import { Router } from "@angular/router";

@Injectable({ providedIn: 'root'})
export class SessaoService {
    private router = inject(Router);

    private supabaseService = inject(SupabaseService);

    private loadingSpinnerService = inject(LoadingSpinnerService);
    private toastService = inject(ToastService);
    private modalUsuarioService = inject(ModalUsuarioService);
    
    private canal: RealtimeChannel | null = null;

    sessao: WritableSignal<ISessao | null> = signal(null);
    usuarios: WritableSignal<IUsuario[]> = signal([]);
    usuariosPresentes: Signal<IUsuario[]> = computed(() => this.usuarios().filter(usuario => this.presencesId().includes(usuario.presenceId)));
    presencesId: WritableSignal<string[]> = signal([]);
    usuario: WritableSignal<IUsuario | null> = signal(null);
    canalId: WritableSignal<string> = signal('');
    
    destruirCanal(): void {
        this.canal?.unsubscribe();
        this.canal = null;
    }

    atualizarMediaEstimativaSessao(estimativas: number[]) {
        const sessao = this.sessao();

        if (!sessao) return alert('Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.');

        const mediaEstimativasSessao = this.calcularMediaEstimativasSessao(estimativas);

        this.supabaseService.atualizarEstimativaSessao(sessao.id, truncarNumero(mediaEstimativasSessao, 1));
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

    setEstimativaUsuario(estimativa: number | null): void {
        let usuario = this.usuario();
        
        if (usuario) usuario = {...usuario, estimativa};

        this.usuario.set(usuario);
    }

    atualizarUsuariosPresentes() {
        if(!this.canal) return alert('Canal não foi encontrado!');

        const presencasId = Object.values(this.canal.presenceState()).flat().map(presenca => (presenca as any).id);

        this.presencesId.set(presencasId);
    }

    async inicializarSessao(sessaoId: string, usuarioId: string | null) {
        try {
            this.canalId.set(gerarId(8));

            await this.setSessao(sessaoId);
            
            if (!this.sessao()) {
                this.router.navigate(['/']);
                this.loadingSpinnerService.fechar();
            }
            
            if (this.sessao() && this.sessao()?.id !== sessionStorage.getItem('sessaoId')) {
                usuarioId = null;
                sessionStorage.removeItem('usuarioId');
            }
            
            if (usuarioId) {
                await this.supabaseService.atualizarPresence(usuarioId, this.canalId());

                await this.setUsuario(usuarioId);
            }

            sessionStorage.setItem('sessaoId', sessaoId);
            
            await this.criarCanalSessao(sessaoId);
            
            await this.setUsuarios(sessaoId);  
                    
            this.loadingSpinnerService.fechar();
            this.modalUsuarioService.abrir();    
        } catch (error) {
            alert(`Falha ao inicializar uma sessão: ${error}`);
        }
    }

    async criarCanalSessao(sessaoId: string): Promise<void> {        
        this.canal = this.supabaseService.supabase.channel(`sessao-${sessaoId}`);

        this.canal
            .on('presence', {
                event: 'sync'
            }, () => {
                this.atualizarUsuariosPresentes();
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'usuario',
                filter: `sessao_id=eq.${sessaoId}`
            }, (payload) => {
                const novoUsuario: IUsuario = {
                    id: payload.new['id'],
                    presenceId: payload.new['presence_id'],
                    nome: payload.new['nome'],
                    estimativa: payload.new['estimativa'],
                    observador: payload.new['observador'],
                    sessaoId: payload.new['sessao_id'],
                    dataCriacao: payload.new['data_criacao']
                }; 

                const usuarios = this.usuarios();
            
                this.usuarios.set([...usuarios, novoUsuario]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'usuario',
                filter: `sessao_id=eq.${sessaoId}`
            }, (payload) => {
                const usuariosAtualizados: IUsuario[] = this.usuarios().map(usuario => 
                    usuario.id === payload.new['id'] ? {
                        ...usuario,
                        estimativa: payload.new['estimativa'],
                        presenceId: payload.new['presence_id']
                    } as IUsuario : usuario as IUsuario
                );                
                this.usuarios.set(usuariosAtualizados);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessao',
                filter: `id=eq.${sessaoId}`
            }, (payload) => {
                const mediaEstimativasSessao: number | null = payload.new['media_estimativas_sessao'];
                
                const opcoesEstimativa: string = payload.new['opcoes_estimativa'];

                if (mediaEstimativasSessao === null) {
                    this.usuario.update(atual => ({...atual, estimativa: null} as IUsuario));
                }

                let sessao = this.sessao();

                if (sessao) sessao = {...sessao, opcoesEstimativa: opcoesEstimativa, mediaEstimativasSessao: mediaEstimativasSessao};

                this.sessao.set(sessao);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.canal?.track({
                        id: this.canalId()
                    });
                }
            });
    }

    async atualizarEstimativaUsuario(opcao: number) {
        let usuario = this.usuario();
    
        if (!usuario) return alert('Falha ao encontrar o usuário. Por favor, acesse novamente a sessão.');

        const opcaoSelecionada = opcao === usuario.estimativa ? null : opcao;

        this.setEstimativaUsuario(opcaoSelecionada);

        await this.supabaseService.atualizarEstimativaUsuario(usuario.id, opcaoSelecionada);
    }

    async reiniciarEstimativaSessao() {
        const sessao = this.sessao();

        if (!sessao) return alert('Falha ao encontrar a sessão. Por favor, acesse novamente a sessão.'); 

        await this.supabaseService.atualizarEstimativaSessao(sessao.id, null);
        await this.supabaseService.atualizarEstimativasUsuarios(sessao.id, null);
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
}