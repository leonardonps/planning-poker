import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { ModalUsuario } from '../../../components/sessao/modais/modal-usuario/modal-usuario';

@Injectable({ providedIn: 'root' })
export class ModalUsuarioService {
  private hostRef: ViewContainerRef | undefined;
  private modalUsuarioRef: ComponentRef<ModalUsuario> | undefined;
  private modalSendoExibido = false;

  registrarHost(hostRef: ViewContainerRef) {
    this.hostRef = hostRef;
  }

  abrir() {
    if (
      !this.hostRef ||
      this.modalSendoExibido ||
      sessionStorage.getItem('usuarioId')
    )
      return;

    this.modalUsuarioRef = this.hostRef.createComponent(ModalUsuario);
    this.modalSendoExibido = true;
  }

  destruirModal() {
    if (this.modalUsuarioRef) {
      this.modalUsuarioRef.destroy();
      this.modalUsuarioRef = undefined;
    }

    this.modalSendoExibido = false;
  }
}
