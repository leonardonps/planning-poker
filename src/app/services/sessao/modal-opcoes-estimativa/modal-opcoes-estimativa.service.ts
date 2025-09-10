import { ComponentRef, Injectable, ViewContainerRef } from "@angular/core";
import { ModalOpcoesEstimativa } from "../../../components/sessao/modais/modal-opcoes-estimativa/modal-opcoes-estimativa";

@Injectable({ providedIn: 'root'}) 
export class ModalOpcoesEstimativaService {
    private hostRef: ViewContainerRef | undefined;
    private modalOpcoesEstimativaRef: ComponentRef<ModalOpcoesEstimativa> | undefined;
    private modalSendoExibido: boolean = false;

    registrarHost(hostRef: ViewContainerRef) {
        this.hostRef = hostRef;
    }

    abrir() {
        if(!this.hostRef || this.modalSendoExibido) return;
        
        this.modalOpcoesEstimativaRef = this.hostRef.createComponent(ModalOpcoesEstimativa);
        this.modalSendoExibido = true;
    }

    destruirModal() {
        if (this.modalOpcoesEstimativaRef) {
            this.modalOpcoesEstimativaRef.destroy();
            this.modalOpcoesEstimativaRef = undefined;
        }

        this.modalSendoExibido = false;
    }
}