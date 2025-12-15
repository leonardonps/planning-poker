import { Injectable } from '@angular/core';
import { EstimateOptionsModal } from '../../components/session/modals/estimate-options-modal/estimate-options-modal';
import { BaseModal } from './contracts/base-modal.abstract';

@Injectable({ providedIn: 'root' })
export class EstimateOptionsModalService extends BaseModal<EstimateOptionsModal> {
	protected override get component() {
		return EstimateOptionsModal;
	}
}
