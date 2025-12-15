import { Injectable } from '@angular/core';
import { SessionResultsModal } from '../../components/session/modals/session-results-modal/session-results-modal';
import { BaseModal } from './contracts/base-modal.abstract';

@Injectable({ providedIn: 'root' })
export class SessionResultsModalService extends BaseModal<SessionResultsModal> {
	protected get component() {
		return SessionResultsModal;
	}
}
