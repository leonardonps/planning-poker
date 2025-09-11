import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from "@angular/core";
import { ModalBase } from "../../../shared/modal-base/modal-base";
import { gerarId } from "../../../../../utils/funcoes/geracaoId/gerarId";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SupabaseService } from "../../../../services/shared/supabase/supabase.service";
import { ModalUsuarioService } from "../../../../services/sessao/modal-usuario/modal-usuario.service";
import { SessaoService } from "../../../../services/sessao/sessao.service";
import { IUsuario } from "../../../../interfaces/shared/usuario/usuario";
import { ISessao } from "../../../../interfaces/shared/sessao/sessao";
import { Router } from "@angular/router";

@Component({
  selector: 'app-modal-usuario',
  imports: [ModalBase, ReactiveFormsModule],
  templateUrl: './modal-usuario.html',
  styleUrl: './modal-usuario.scss'
})
export class ModalUsuario implements OnInit, AfterViewInit {
  @ViewChild('usuarioNome') usuarioNomeRef!: ElementRef; 
  
  private supabaseService = inject(SupabaseService);
  private sessaoService = inject(SessaoService);
  private modalUsuarioService = inject(ModalUsuarioService);

  titulo: string = 'Novo usuário';

  formUsuario!: FormGroup;
  
  submitted: boolean = false;
  desabilitado: boolean = false;


  ngOnInit(): void {
    this.formUsuario = new FormGroup({
      nome: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]),
      observador: new FormControl(false)
    });
  }

  ngAfterViewInit(): void {
    this.usuarioNomeRef.nativeElement.focus();
  }

  async salvar(): Promise<void> {
    this.submitted = true;

    if (this.formUsuario.valid) {
      this.desabilitado = true;
      const sessaoId = this.sessaoService.sessao()?.id;
      const canalId = this.sessaoService.canalId();

      if(!sessaoId) 
        return alert('Falha ao encontrar id da sessão. Crie uma nova sessão');
      

      if(!canalId) 
        return alert('Falha ao encontrar o id do canal da sessão no Supabase. Entre novamente na sessão!');

      const usuarioId = gerarId(8);

      const novoUsuario: IUsuario = {
            id: usuarioId,
            presenceId: canalId,
            nome: this.formUsuario.controls['nome'].value,                
            observador: this.formUsuario.controls['observador'].value,
            estimativa: null,
            sessaoId: sessaoId,
            dataCriacao: null
      }

      await this.supabaseService.inserirUsuario(novoUsuario);

      const usuarioCriado = await this.supabaseService.buscarUsuario(usuarioId);

      if (!usuarioCriado) return alert('Não foi possível criar o usuário. Tente novamente!'); 
      
      this.sessaoService.usuario.set(usuarioCriado);
      sessionStorage.setItem('usuarioId', usuarioCriado.id);

      this.modalUsuarioService.destruirModal();
      this.submitted = false;
      
    }
  }
}
