import { ComponentRef, Injectable, ViewContainerRef } from "@angular/core";
import { Toast } from "../../../components/shared/toast/toast";


export interface ToastConfig {
    mensagem: string;
    duracao?: number;
}

@Injectable(
    { providedIn: 'root'}
)
export class ToastService {
    private hostRef: ViewContainerRef | undefined;
    private toastRef: ComponentRef<Toast> | undefined;

    private timeoutId: any;
    private toastSendoExibido: boolean = false;

    registrarHost(hostRef: ViewContainerRef) {
        this.hostRef = hostRef;
    }

    exibir(toastConfig: ToastConfig) {
        if (!this.hostRef || this.toastSendoExibido) return;

        this.toastSendoExibido = true;
        this.toastRef = this.hostRef.createComponent(Toast);
        this.toastRef.setInput('mensagem', toastConfig.mensagem);

        const duracao = toastConfig.duracao || 3000;

        this.timeoutId = setTimeout(() => {
            this.toastRef?.destroy();
            this.timeoutId = null;
            this.toastSendoExibido = false;
        }, duracao);
    }

    destruirToast() {
        if (this.timeoutId) {
            clearInterval(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.toastRef) {
            this.toastRef.destroy();
            this.toastRef = undefined;
        }

        this.toastSendoExibido = false;
    }
}