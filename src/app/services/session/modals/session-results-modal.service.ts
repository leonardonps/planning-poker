import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { SessionResultsModal } from '../../../components/session/modals/session-results-modal/session-results-modal';

@Injectable({ providedIn: 'root' })
export class SessionResultsModalService {
	private hostRef: ViewContainerRef | undefined;
	private sessionResultsModal: ComponentRef<SessionResultsModal> | undefined;
	private isOpen = false;

	setHost(hostRef: ViewContainerRef) {
		this.hostRef = hostRef;
	}

	open() {
		if (!this.hostRef || this.isOpen) {
			return;
		}

		this.sessionResultsModal =
			this.hostRef.createComponent(SessionResultsModal);
		this.isOpen = true;
	}

	close() {
		if (!this.sessionResultsModal) {
			return;
		}

		this.sessionResultsModal.destroy();
		this.sessionResultsModal = undefined;
		this.isOpen = false;
	}
}
