import { inject, Injectable } from '@angular/core';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../enviroments/enviroment';
import { ISessao } from '../../../interfaces/shared/sessao/sessao';
import { IUsuario } from '../../../interfaces/shared/usuario/usuario';
import { SessaoService } from '../../sessao/sessao.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  
  private sessaoService = inject(SessaoService);
  
  private supabase: SupabaseClient;  
  private canal: RealtimeChannel | null= null;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async inserirSessao(sessao: ISessao): Promise<ISessao | null> {
    const sessaoEncontrada = await this.buscarSessao(sessao.id);
    
    if (sessaoEncontrada) return sessaoEncontrada;
    
    const { data, error } = await this.supabase.from('sessao').upsert([{id: sessao.id, opcoes_estimativa: sessao.opcoesEstimativa}]).select().single();

    if (error) {
      alert(`Falha ao inserir sessão: ${error.message}`);
      return null;
    }

    return data;
  }

  async buscarSessao(id: string): Promise<ISessao | null> {
    const { data, error} = await this.supabase.from('sessao').select().eq('id', id).maybeSingle();

    if (error) {
      alert(`Falha ao buscar por uma sessão: ${error.message}`);
    }

    return data;
  }

  async inserirUsuario(usuario: IUsuario): Promise<IUsuario | null> {   
    const usuarioEncontrado = await this.buscarUsuario(usuario.id);

    if (usuarioEncontrado) return usuarioEncontrado;
    
    const { data, error } = await this.supabase.from('usuario').insert([{id: usuario.id, nome: usuario.nome, observador: usuario.observador, sessao_id: usuario.sessaoId}]).select().single();
  
    if (error) {
      alert(`Falha ao inserir usuario: ${error.message}`);
      return null;
    }
    
    return data;
  }
  
  async buscarUsuario(id: string): Promise<IUsuario | null> {
    const { data, error} = await this.supabase.from('usuario').select().eq('id', id).maybeSingle();

    if (error) {
      alert(`Falha ao buscar por um usuario: ${error.message}`);
      return null;
    }

    return data;
  }

  async buscarUsuariosSessao(sessaoId: string): Promise<void> {
    const { data, error } = await this.supabase.from('usuario').select().eq('sessao_id', sessaoId);

    if (error) {
      alert(`Erro ao buscar por usuários de uma sessão:${error.message}`)
      return;
    }

    this.sessaoService.usuarios.set(data);
  }

  async buscarOpcoesEstimativaSessao(sessaoId: string): Promise<void> {
     const { data, error } = await this.supabase.from('sessao').select('opcoes_estimativa').eq('id', sessaoId).single();

    if (error) {
      alert(`Falha ao buscar por opções de estimativas de uma sessão:${error.message}`)
      return;
    }

    const opcoesEstimativa = data.opcoes_estimativa;

    this.sessaoService.opcoesEstimativa.set(opcoesEstimativa.split(', ').map(Number));
  }

  async atualizarEstimativaUsuario(usuarioId: string, estimativa: number | null): Promise<void> {
    const { error } = await this.supabase.from('usuario').update({estimativa: estimativa}).eq('id', usuarioId);

    if (error) {
      alert(`Falha ao atualizar estimativa do usuário: ${error.message}`);
    }
  }

  async atualizarEstimativasUsuarios(sessaoId: string, estimativa: number | null) {
      const { error } = await this.supabase.from('usuario').update({estimativa: estimativa}).eq('sessao_id', sessaoId);

      if (error) {
        alert(`Falha ao atualizar estimativas dos usuários: ${error.message}`);
      }
  }

  async atualizarEstimativaSessao(sessaoId: string, estimativa: number | null): Promise<void> {
    const { error } = await this.supabase.from('sessao').update({media_estimativas_sessao: estimativa}).eq('id', sessaoId);

    if (error) {
      alert(`Falha ao atualizar estimativa da sessão: ${error}`);
    }
  }

  criarCanal(sessaoId: string): void {
    console.log('criando canais');

    this.canal = this.supabase.channel('changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'usuario',
        filter: `sessao_id=eq.${sessaoId}`
      },
        (payload) => {
          const novoUsuario: IUsuario = payload.new as IUsuario;
          const usuarios = this.sessaoService.usuarios();

          this.sessaoService.usuarios.set([...usuarios, novoUsuario]);
        }
      ).on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'usuario',
        filter: `sessao_id=eq.${sessaoId}`
      },
        (payload) => {
          const usuariosAtualizados: IUsuario[] = this.sessaoService.usuarios().map(usuario => 
            usuario.id === payload.new['id'] ? {
              ...usuario,
              estimativa: payload.new['estimativa']
            } as IUsuario : usuario as IUsuario
          );
          
          this.sessaoService.usuarios.set(usuariosAtualizados);
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

          this.sessaoService.opcaoSelecionada.set(null);
        }

        this.sessaoService.mediaEstimativasSessao.set(mediaEstimativasSessao);
      })
    .subscribe();
  }

  destruirCanal(): void {
    this.canal?.unsubscribe();
  }
}