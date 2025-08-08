import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../enviroments/enviroment';
import { Usuario } from '../../../interfaces/shared/usuario';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;  

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async inserirSessao(id: any) {
    console.log('antes de inserir sessao', id);

    if (!id) {
      console.log('Não há sessão em sua sessionStorage');
      return;
    }

    const sessaoEncontrada = await this.buscarSessao(id);

    console.log(sessaoEncontrada);

    if (sessaoEncontrada?.length === 0) {
      const { error } = await this.supabase.from('sessao').insert([{id: id}])
  
      if (error) {
        console.log('Erro ao inserir sessão: ', error);
      }
    }
  }

  async buscarSessao(id: string) {
    const { data, error} = await this.supabase.from('sessao').select().eq('id', id);

    if (error) {
      console.log('Error ao buscar por uma sessão: ', error);
    }

    return data;
  }

  async inserirUsuario(usuario: any) {
    this.inserirSessao(usuario.sessaoId);

    if (!usuario.id || !usuario.nome || !usuario.sessaoId) {
      console.log('Usuário está sem id, nome ou sessão em sua sessionStorage');
      return;
    }

    const usuarioEncontrado = await this.buscarUsuario(usuario.id);

    console.log(usuarioEncontrado);
    
    if (usuarioEncontrado?.length === 0) {

      const { error } = await this.supabase.from('usuario').insert([{id: usuario.id, nome: usuario.nome, observador: usuario.observador, sessao_id: usuario.sessaoId}]);
  
      if (error) {
        console.log('Erro ao inserir usuario: ', error);
      }
    }
  }

  async buscarUsuario(id: string) {
    const { data, error} = await this.supabase.from('usuario').select().eq('id', id);

    if (error) {
      console.log('Error ao buscar por um usuario: ', error);
    }

    return data;
  }
}