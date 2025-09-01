import { Component, input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-modal-base',
  imports: [],
  templateUrl: './modal-base.html',
  styleUrl: './modal-base.scss'
})
export class ModalBase {
  titulo = input<string>();
}
