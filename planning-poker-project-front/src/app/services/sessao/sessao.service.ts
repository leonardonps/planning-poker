import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { ISessao } from "../../interfaces/shared/sessao/sessao";
import { SupabaseService } from "../shared/supabase/supabase.service";
import { RealtimeChannel } from "@supabase/supabase-js";
import { LoadingSpinnerService } from "../shared/loading-spinner/loading-spinner.service";

@Injectable({ providedIn: 'root'})
export class SessaoService {
    private supabaseService = inject(SupabaseService);
    private loadingSpinnerService = inject(LoadingSpinnerService);

    private canal: RealtimeChannel | null = null;

    sessao: WritableSignal<ISessao | null> = signal(null);
    usuarios: WritableSignal<IUsuario[]> = signal([]);
    usuario: WritableSignal<IUsuario | null> = signal(null);

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
        if (usuario) this.usuario.set(usuario);
    }

    atualizarEstimativaUsuario(estimativa: number | null): void {
        let usuario = this.usuario();
        
        if (usuario) usuario = {...usuario, estimativa}

        this.usuario.set(usuario);
    }

    calcularEstimativaSessao(estimativasSessao: number[]): number { 
        const valorInicial: number = 0;
        
        const mediaEstimativasSessao: number = estimativasSessao.reduce((somaEstimativas, estimativa) => somaEstimativas + estimativa, valorInicial)/estimativasSessao.length;
        
        return mediaEstimativasSessao;
    }

    criarCanal(sessaoId: string): void {
        this.canal = this.supabaseService.supabase.channel('changes')
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

            console.log(novoUsuario);
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

            if (mediaEstimativasSessao == null) {
                if (sessionStorage.getItem('usuarioEstimativa')) sessionStorage.removeItem('usuarioEstimativa');

                this.usuario.update(atual => ({...atual, estimativa: null} as IUsuario));
            }

            let sessao = this.sessao();

            if (sessao) sessao = {...sessao, mediaEstimativasSessao: mediaEstimativasSessao};

            this.sessao.set(sessao);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                this.loadingSpinnerService.fechar();
            }
        });
    }

    destruirCanal(): void {
        this.canal?.unsubscribe();
    }
}