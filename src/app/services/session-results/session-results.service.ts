import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { SupabaseService } from '../shared/supabase.service';
import { ExcelService } from '../shared/excel.service';
import {
	SessionResult,
	SessionResultCreate,
} from '../../interfaces/session-results';

@Injectable({ providedIn: 'root' })
export class SessionResultsService {
	private supabaseService = inject(SupabaseService);
	private excelService = inject(ExcelService);

	sessionResults: WritableSignal<SessionResult[]> = signal([]);

	async getSessionResults(sessionId: string) {
		try {
			const sessionResults =
				await this.supabaseService.getSessionResults(sessionId);

			this.sessionResults.set(sessionResults);
		} catch (error) {
			alert(error);
		}
	}

	async insertSessionResult(sessionResultCreate: SessionResultCreate) {
		await this.supabaseService.insertSessionResult(sessionResultCreate);
	}

	async updateSessionResultDescription(id: string, description: string) {
		await this.supabaseService.updateSessionResult(id, {
			description,
		});

		this.sessionResults.update((sessionResults) =>
			sessionResults.map((sessionResult) =>
				sessionResult.id === id
					? { ...sessionResult, description: description }
					: sessionResult,
			),
		);
	}

	async deleteSessionResult(id: string) {
		await this.supabaseService.deleteSessionResult(id);

		this.sessionResults.update((sessionResults) =>
			sessionResults.filter((sessionResult) => sessionResult.id !== id),
		);
	}

	exportToExcel() {
		const filteredSessionResults = this.sessionResults().map(
			(sessionResult) => ({
				Descrição: sessionResult.description,
				'Estimativa da equipe': sessionResult.averageEstimate,
				'Quem gerou?': sessionResult.generatedBy,
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
