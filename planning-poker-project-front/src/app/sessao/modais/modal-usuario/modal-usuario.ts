import { Component } from '@angular/core';
import { ModalBase } from '../../../shared/modal-base/modal-base';

@Component({
  selector: 'app-modal-usuario',
  imports: [ModalBase],
  templateUrl: './modal-usuario.html',
  styleUrl: './modal-usuario.scss'
})
export class ModalUsuario {
  titulo: string = 'Novo usuário'
}
