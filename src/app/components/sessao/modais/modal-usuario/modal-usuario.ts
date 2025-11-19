import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ModalBase } from '../../../shared/modal-base/modal-base';
import { gerarId } from '../../../../../utils/funcoes/geracaoId/gerarId';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../../../../services/shared/supabase/supabase.service';
import { ModalUsuarioService } from '../../../../services/sessao/modal-usuario/modal-usuario.service';
import { SessaoService } from '../../../../services/sessao/sessao.service';
import { IUsuario } from '../../../../interfaces/shared/usuario/usuario';

@Component({
  selector: 'app-modal-usuario',
  imports: [ModalBase, ReactiveFormsModule],
  templateUrl: './modal-usuario.html',
  styleUrl: './modal-usuario.scss',
})
export class ModalUsuario implements OnInit, AfterViewInit {
  @ViewChild('usuarioNome') usuarioNomeRef!: ElementRef;

  private supabaseService = inject(SupabaseService);
  private sessaoService = inject(SessaoService);
  private modalUsuarioService = inject(ModalUsuarioService);

  titulo = 'Novo usuário';

  formUsuario!: FormGroup;

  submitted = false;
  desabilitado = false;

  ngOnInit(): void {
    this.formUsuario = new FormGroup({
      nome: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(15),
      ]),
      observador: new FormControl(false),
    });
  }

  ngAfterViewInit(): void {
    this.usuarioNomeRef.nativeElement.focus();
  }

  async salvar(): Promise<void> {
    this.submitted = true;

    if (!this.formUsuario.valid) {
      return;
    } 
      
    this.desabilitado = true;

    try {
      const sessaoId = this.sessaoService.sessao()?.id;

      if (!sessaoId) {
        throw new Error('Sessão não encontrada');
      }

      const novoUsuario: IUsuario = {
        id: gerarId(8),
        nome: this.formUsuario.controls['nome'].value,
        observador: this.formUsuario.controls['observador'].value,
        estimativa: null,
        sessaoId: sessaoId,
        dataCriacao: null,
      };

      const usuarioCriado = await this.supabaseService.inserirUsuario(novoUsuario);

      if (!usuarioCriado) {
        throw new Error('Falha ao criar o usuário')
      }

      this.sessaoService.usuario.set(usuarioCriado);
      
      await this.sessaoService.rastrearPresenca(usuarioCriado);

      sessionStorage.setItem('usuarioId', usuarioCriado.id);
      this.modalUsuarioService.destruirModal();
    } catch (error) {
      alert(error);
    } finally {
      this.desabilitado = false;
      this.submitted = false;
    }
  }
}
