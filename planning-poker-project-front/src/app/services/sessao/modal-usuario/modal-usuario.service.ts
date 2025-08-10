import { ComponentRef, inject, Injectable, ViewContainerRef } from "@angular/core";
import { ModalUsuario } from "../../../componentes/sessao/modais/modal-usuario/modal-usuario";
import { SessaoService } from "../sessao.service";

@Injectable({ providedIn: 'root'})
export class ModalUsuarioService {

    private sessaoService = inject(SessaoService);

    private hostRef: ViewContainerRef | undefined;
    private modalUsuarioRef: ComponentRef<ModalUsuario> | undefined;
    private modalSendoExibido: boolean = false;

    registrarHost(hostRef: ViewContainerRef) {
        this.hostRef = hostRef;
    }

    abrir() {
        if(!this.hostRef || this.modalSendoExibido || sessionStorage.getItem('usuarioId')) return;

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