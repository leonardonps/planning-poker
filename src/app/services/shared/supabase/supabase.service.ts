import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../enviroments/enviroment';
import { ISessao } from '../../../interfaces/shared/sessao/sessao';
import { IUsuario } from '../../../interfaces/shared/usuario/usuario';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private _supabase: SupabaseClient;

  constructor() {
    this._supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey, {
        realtime: {
          worker: true,
          heartbeatIntervalMs: 15000
        }
      }
    );
  }

  get supabase(): SupabaseClient {
    return this._supabase;
  }

  async inserirSessao(sessao: ISessao): Promise<void> {
    const { error } = await this.supabase
      .from('sessao')
      .upsert([{ id: sessao.id, opcoes_estimativa: sessao.opcoesEstimativa }])
      .select()
      .single();

    if (error) {
      alert(`Falha ao inserir sessão: ${error.message}`);
    }
  }

  async buscarSessao(id: string): Promise<ISessao | null> {
    const { data, error } = await this.supabase
      .from('sessao')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      alert(`Falha ao buscar por uma sessão: ${error.message}`);
      return null;
    }

    if (!data) return null;

    const sessaoDados: ISessao = {
      id: data.id,
      opcoesEstimativa: data.opcoes_estimativa,
      mediaEstimativasSessao: data.media_estimativas_sessao,
      dataCriacao: data.data_criacao,
    };

    return sessaoDados;
  }

  async inserirUsuario(usuario: IUsuario): Promise<void> {
    const { error } = await this.supabase
      .from('usuario')
      .upsert([
        {
          id: usuario.id,
          nome: usuario.nome,
          observador: usuario.observador,
          sessao_id: usuario.sessaoId,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(`Falha ao inserir usuario: ${error.message}`);
    }
  }

  async buscarUsuario(id: string): Promise<IUsuario | null> {
    const { data, error } = await this.supabase
      .from('usuario')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      alert(`Falha ao buscar por um usuario: ${error.message}`);
      return null;
    }

    if (!data) return null;

    const usuarioDados: IUsuario = {
      id: data.id,
      nome: data.nome,
      estimativa: data.estimativa,
      observador: data.observador,
      sessaoId: data.sessao_id,
      dataCriacao: data.data_criacao,
    };

    return usuarioDados;
  }

  async buscarUsuariosSessao(sessaoId: string): Promise<IUsuario[]> {
    const { data, error } = await this.supabase
      .from('usuario')
      .select('*')
      .eq('sessao_id', sessaoId);

    if (error) {
      alert(`Erro ao buscar por usuários de uma sessão:${error.message}`);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      nome: row.nome,
      estimativa: row.estimativa,
      observador: row.observador,
      sessaoId: row.sessao_id,
      dataCriacao: row.data_criacao,
    }));
  }

  async atualizarEstimativaUsuario(
    usuarioId: string,
    estimativa: number | null,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('usuario')
      .update({ estimativa: estimativa })
      .eq('id', usuarioId);

    if (error) {
      alert(`Falha ao atualizar estimativa do usuário: ${error.message}`);
    }
  }

  async atualizarPresence(usuarioId: string, presence: string): Promise<void> {
    const { error } = await this.supabase
      .from('usuario')
      .update({ presence_id: presence })
      .eq('id', usuarioId);

    if (error) {
      alert(`Falha ao atualizar estimativa do usuário: ${error.message}`);
    }
  }

  async atualizarEstimativasUsuarios(
    sessaoId: string,
    estimativa: number | null,
  ) {
    const { error } = await this.supabase
      .from('usuario')
      .update({ estimativa: estimativa })
      .eq('sessao_id', sessaoId);

    if (error) {
      alert(`Falha ao atualizar estimativas dos usuários: ${error.message}`);
    }
  }

  async atualizarEstimativaSessao(
    sessaoId: string,
    estimativa: number | null,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('sessao')
      .update({ media_estimativas_sessao: estimativa })
      .eq('id', sessaoId);

    if (error) {
      alert(`Falha ao atualizar estimativa da sessão: ${error}`);
    }
  }

  async atualizarOpcoesEstimativaSessao(
    sessaoId: string,
    opcoesEstimativa: string,
  ) {
    const { error } = await this.supabase
      .from('sessao')
      .update({ opcoes_estimativa: opcoesEstimativa })
      .eq('id', sessaoId);

    if (error)
      alert(`Falha ao atualizar opções de estimativa da sessão: ${error}`);
  }

  async removerUsuarioSessao(usuarioId: string) {
    const { error } = await this.supabase
      .from('usuario')
      .delete()
      .eq('id', usuarioId);

    if (error)
      alert(`Falha ao atualizar opções de estimativa da sessão: ${error}`);
  }
}
