import { Component } from '@angular/core';
import { ModalBase } from '../../../shared/modal-base/modal-base';

@Component({
  selector: 'app-modal-opcoes-estimativa',
  imports: [ModalBase],
  templateUrl: './modal-opcoes-estimativa.html',
  styleUrl: './modal-opcoes-estimativa.scss'
})
export class ModalOpcoesEstimativa {
  titulo: string = 'Editar opções de estimativa';
}
