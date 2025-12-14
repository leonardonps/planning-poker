import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { Toast } from '../../components/shared/toast/toast';

export interface ToastConfig {
	text: string;
	duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
	private hostRef: ViewContainerRef | undefined;
	private toastRef: ComponentRef<Toast> | undefined;

	private timeoutId: ReturnType<typeof setTimeout> | null = null;
	private isOpen = false;

	setHost(hostRef: ViewContainerRef) {
		this.hostRef = hostRef;
	}

	show(toastConfig: ToastConfig) {
		if (!this.hostRef || this.isOpen) return;

		this.isOpen = true;
		this.toastRef = this.hostRef.createComponent(Toast);

		this.toastRef.setInput('text', toastConfig.text);

		const duration = toastConfig.duration || 3000;

		this.timeoutId = setTimeout(() => {
			this.toastRef?.destroy();
			this.timeoutId = null;
			this.isOpen = false;
		}, duration);
	}

	hide() {
		if (this.timeoutId) {
			clearInterval(this.timeoutId);
			this.timeoutId = null;
		}

		if (this.toastRef) {
			this.toastRef.destroy();
			this.toastRef = undefined;
		}

		this.isOpen = false;
	}
}
