import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { SessionResultsModal } from '../../../components/session/modals/session-results-modal/session-results-modal';
import { BaseModal } from './contracts/base-modal.abstract';
import { SessionResult } from '../../../interfaces/session-results';
import { SessionService } from '../session.service';
import { SupabaseService } from '../../shared/supabase.service';

@Injectable({ providedIn: 'root' })
export class SessionResultsModalService extends BaseModal<SessionResultsModal> {
	private sessionService = inject(SessionService);
	private supabaseService = inject(SupabaseService);

	protected get component() {
		return SessionResultsModal;
	}

	sessionResults: WritableSignal<SessionResult[]> = signal([]);

	async getSessionResults() {
		try {
			const session = this.sessionService.getSession();

			const sessionResults = await this.supabaseService.getSessionResults(
				session.id,
			);

			this.sessionResults.set(sessionResults);
		} catch (error) {
			alert(error);
		}
	}

	async deleteSessionResult(id: string) {
		await this.supabaseService.deleteSessionResult(id);

		this.sessionResults.update((sessionResults) =>
			sessionResults.filter((sessionResult) => sessionResult.id !== id),
		);
	}

	async updateSessionResultDescription(
		sessionResultId: string,
		description: string,
	) {
		await this.supabaseService.updateSessionResult(sessionResultId, {
			description,
		});

		this.sessionResults.update((sessionResults) =>
			sessionResults.map((sessionResult) =>
				sessionResult.id === sessionResultId
					? { ...sessionResult, description: description }
					: sessionResult,
			),
		);
	}
}
