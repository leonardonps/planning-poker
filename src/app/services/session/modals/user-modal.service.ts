import { Injectable } from '@angular/core';
import { UserModal } from '../../../components/session/modals/user-modal/user-modal';
import { BaseModal } from './contracts/base-modal.abstract';

@Injectable({ providedIn: 'root' })
export class UserModalService extends BaseModal<UserModal> {
	protected get component() {
		return UserModal;
	}
}
