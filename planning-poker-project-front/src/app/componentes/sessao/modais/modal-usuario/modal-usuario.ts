import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from "@angular/core";
import { ModalBase } from "../../../shared/modal-base/modal-base";
import { gerarId } from "../../../../../utils/geracaoId/gerarId";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { SupabaseService } from "../../../../services/shared/supabase/supabase.service";
import { ModalUsuarioService } from "../../../../services/sessao/modal-usuario/modal-usuario.service";

@Component({
  selector: 'app-modal-usuario',
  imports: [ModalBase, ReactiveFormsModule],
  templateUrl: './modal-usuario.html',
  styleUrl: './modal-usuario.scss'
})
export class ModalUsuario implements OnInit, AfterViewInit {
  @ViewChild('usuarioNome') usuarioNomeRef!: ElementRef; 
  
  supabaseService = inject(SupabaseService);
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

  salvar(): void {
    this.submitted = true;

    if (this.formUsuario.valid) {
      sessionStorage.setItem('usuarioId', gerarId(8));
      sessionStorage.setItem('usuarioNome', this.formUsuario.controls['nome'].value);
    
      const sessaoId = sessionStorage.getItem('sessaoId');
      const usuario = {
        id: sessionStorage.getItem('usuarioId'),
        nome: sessionStorage.getItem('usuarioNome'),
        observador: this.formUsuario.controls['observador'].value,
        sessaoId: sessaoId
      }

      console.log('modal-usuario');
      this.supabaseService.inserirUsuario(usuario);
    
      this.modalUsuarioService.fechar();
      this.submitted = false;
    }
  }
}
