import { ComponentRef, Type, ViewContainerRef } from '@angular/core';

export abstract class BaseModal<C> {
	private hostRef?: ViewContainerRef;
	private modalRef?: ComponentRef<C>;
	private isOpen = false;

	protected abstract get component(): Type<C>;

	setHost(hostRef: ViewContainerRef) {
		this.hostRef = hostRef;
	}

	open() {
		if (!this.hostRef || this.isOpen) {
			return;
		}

		this.modalRef = this.hostRef.createComponent(this.component);
		this.isOpen = true;
	}

	close() {
		if (!this.modalRef) {
			return;
		}

		this.modalRef.destroy();
		this.modalRef = undefined;
		this.isOpen = false;
	}
}
