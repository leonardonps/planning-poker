import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { UserModal } from '../../../components/session/modals/user-modal/user-modal';

@Injectable({ providedIn: 'root' })
export class UserModalService {
	private hostRef: ViewContainerRef | undefined;
	private userModalRef: ComponentRef<UserModal> | undefined;
	private isOpen = false;

	setHost(hostRef: ViewContainerRef) {
		this.hostRef = hostRef;
	}

	open() {
		if (!this.hostRef || this.isOpen || sessionStorage.getItem('userId')) {
			return;
		}

		this.userModalRef = this.hostRef.createComponent(UserModal);
		this.isOpen = true;
	}

	close() {
		if (!this.userModalRef) {
			return;
		}

		this.userModalRef.destroy();
		this.userModalRef = undefined;
		this.isOpen = false;
	}
}
