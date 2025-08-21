import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from "@angular/core";
import { ModalBase } from "../../../shared/modal-base/modal-base";
import { gerarId } from "../../../../utils/funcoes/geracaoId/gerarId";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SupabaseService } from "../../../../services/shared/supabase/supabase.service";
import { ModalUsuarioService } from "../../../../services/sessao/modal-usuario/modal-usuario.service";
import { SessaoService } from "../../../../services/sessao/sessao.service";
import { IUsuario } from "../../../../interfaces/shared/usuario/usuario";
import { ISessao } from "../../../../interfaces/shared/sessao/sessao";

@Component({
  selector: 'app-modal-usuario',
  imports: [ModalBase, ReactiveFormsModule],
  templateUrl: './modal-usuario.html',
  styleUrl: './modal-usuario.scss'
})
export class ModalUsuario implements OnInit, AfterViewInit {
  @ViewChild('usuarioNome') usuarioNomeRef!: ElementRef; 
  
  supabaseService = inject(SupabaseService);
  sessaoService = inject(SessaoService);
  modalUsuarioService = inject(ModalUsuarioService);

  titulo: string = 'Novo usuário';
  submitted: boolean = false;
  formUsuario!: FormGroup;

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
      const sessaoId = this.sessaoService.sessao()?.id;

      if(!sessaoId) return alert('Falha ao encontrar id da sessão. Entre novamente na sessão!');

      const novoUsuario: IUsuario = {
            id: gerarId(8),
            nome: this.formUsuario.controls['nome'].value,                
            observador: this.formUsuario.controls['observador'].value,
            estimativa: null,
            sessaoId: sessaoId,
            dataCriacao: null
      }

      const usuario: IUsuario | null = await this.sessaoService.criarUsuario(novoUsuario);

      if (usuario) {
        this.sessaoService.usuario.set(usuario);
        sessionStorage.setItem('usuarioId', usuario.id);
        
        this.modalUsuarioService.destruirModal();
        this.submitted = false;
      }
    }
  }
}
