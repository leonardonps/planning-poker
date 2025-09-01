import { inject, Injectable } from "@angular/core";
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LoadingSpinner } from "../../../components/shared/loading-spinner/loading-spinner";

@Injectable(
    { providedIn: 'root'}
)
export class LoadingSpinnerService {
    private overlay = inject(Overlay);
    private overlayRef?: OverlayRef;

    exibir() {
        if(!this.overlayRef) {
            this.overlayRef = this.overlay.create();
            this.overlayRef.attach(new ComponentPortal(LoadingSpinner))
        }
    }

    fechar() {
        this.overlayRef?.detach();
        this.overlayRef = undefined;
    }
}