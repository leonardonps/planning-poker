import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../enviroments/enviroment';
import { ISessao } from '../../../interfaces/shared/sessao/sessao';
import { IUsuario } from '../../../interfaces/shared/usuario';
import { SessaoService } from '../../sessao/sessao.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;  

  private sessaoService = inject(SessaoService);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.iniciarRealTime();
  }

  async inserirSessao(sessao: ISessao): Promise<ISessao[] | null> {
    const sessaoEncontrada = await this.buscarSessao(sessao.id);

    if (!sessaoEncontrada) {
      return null;
    }
    
    if (sessaoEncontrada && sessaoEncontrada.length > 0) {
      return sessaoEncontrada;
    }

    const { data, error } = await this.supabase.from('sessao').upsert([{id: sessao.id, opcoes_estimativa: sessao.opcoesEstimativa}]).select();

    if (error) {
      alert(`Falha ao inserir sessão: ${error.message}`);
      return null;
    }

    return data;
  }

  async buscarSessao(id: string): Promise<ISessao[] | null> {
    const { data, error} = await this.supabase.from('sessao').select().eq('id', id);

    if (error) {
      alert(`Falha ao buscar por uma sessão: ${error.message}`);
    }

    return data;
  }

  async inserirUsuario(usuario: IUsuario): Promise<void> {   
    const usuarioEncontrado = await this.buscarUsuario(usuario.id);

    if(usuarioEncontrado && usuarioEncontrado.length === 0) {
      const { error } = await this.supabase.from('usuario').insert([{id: usuario.id, nome: usuario.nome, observador: usuario.observador, sessao_id: usuario.sessaoId}]);
  
      if (error) {
        alert(`Falha ao inserir usuario: ${error.message}`);
        return;
      }
    }
    
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
     const { data, error } = await this.supabase.from('sessao').select('opcoes_estimativa').eq('id', sessaoId);

    if (error) {
      alert(`Erro ao buscar por opções de estimativas de uma sessão:${error.message}`)
      return;
    }

    const opcoesEstimativa = data[0].opcoes_estimativa;

    this.sessaoService.opcoesEstimativa.set(opcoesEstimativa.split(',').map(Number));
  }

  async buscarUsuario(id: string): Promise<IUsuario[] | null> {
    const { data, error} = await this.supabase.from('usuario').select().eq('id', id);

    if (error) {
      alert(`Falha ao buscar por um usuario: ${error.message}`);
      return null;
    }

    return data;
  }

  iniciarRealTime() {
    const channel = this.supabase.channel('schema-db-atualizacao').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'usuario'
    },
      (payload) => {
        const novoUsuario: IUsuario = payload.new as IUsuario;
        const usuarios = this.sessaoService.usuarios();

        console.log(novoUsuario);

        this.sessaoService.usuarios.set([...usuarios, novoUsuario])
      }
    ).subscribe();
  }
}