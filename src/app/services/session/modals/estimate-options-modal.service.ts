import { ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { EstimateOptionsModal } from '../../../components/session/modals/estimate-options-modal/estimate-options-modal';

@Injectable({ providedIn: 'root' })
export class EstimateOptionsModalService {
	private hostRef: ViewContainerRef | undefined;
	private estimateOptionsModalRef:
		| ComponentRef<EstimateOptionsModal>
		| undefined;
	private isOpen = false;

	setHost(hostRef: ViewContainerRef) {
		this.hostRef = hostRef;
	}

	open() {
		if (!this.hostRef || this.isOpen) {
			return;
		}

		this.estimateOptionsModalRef =
			this.hostRef.createComponent(EstimateOptionsModal);
		this.isOpen = true;
	}

	close() {
		if (!this.estimateOptionsModalRef) {
			return;
		}

		this.estimateOptionsModalRef.destroy();
		this.estimateOptionsModalRef = undefined;
		this.isOpen = false;
	}
}
