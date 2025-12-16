import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { SessionService } from '../session/session.service';
import { SupabaseService } from '../shared/supabase.service';
import { SessionResult } from '../../interfaces/session-results';
import { ExcelService } from '../shared/excel.service';

@Injectable({ providedIn: 'root' })
export class SessionResultsService {
	private sessionService = inject(SessionService);
	private supabaseService = inject(SupabaseService);
	private excelService = inject(ExcelService);

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

	exportToExcel() {
		const filteredSessionResults = this.sessionResults().map(
			(sessionResult) => ({
				Descrição: sessionResult.description,
				'Estimativa média': sessionResult.averageEstimate,
				'Gerada por': sessionResult.generatedBy,
				'Data/hora': Intl.DateTimeFormat('pt-BR', {
					dateStyle: 'short',
					timeStyle: 'short',
				}).format(new Date(sessionResult.createdAt)),
			}),
		);

		this.excelService.exportToExcel(
			filteredSessionResults,
			'historico_sessao',
			'historico_sessao',
		);
	}
}
