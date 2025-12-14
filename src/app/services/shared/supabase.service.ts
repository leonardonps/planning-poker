import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../enviroments/enviroment';
import { Session, SessionCreate } from '../../interfaces/session';
import { PostgrestBaseError } from '../../errors/PostgrestBaseError';
import { SessionNotFoundError } from '../../errors/SessionNotFoundError';
import { User, UserCreate } from '../../interfaces/user';
import {
	SessionResult,
	SessionResultCreate,
} from '../../interfaces/session-results';

@Injectable({
	providedIn: 'root',
})
export class SupabaseService {
	private _supabase: SupabaseClient;

	constructor() {
		this._supabase = createClient(
			environment.supabaseUrl,
			environment.supabaseKey,
			{
				realtime: {
					worker: true,
					heartbeatIntervalMs: 15000,
				},
			},
		);
	}

	get supabase(): SupabaseClient {
		return this._supabase;
	}

	async insertSession(session: SessionCreate): Promise<Session> {
		const { data, error } = await this.supabase
			.from('session')
			.upsert([{ id: session.id, estimate_options: session.estimateOptions }])
			.select()
			.single();

		if (error) {
			throw new PostgrestBaseError('Falha ao criar uma sessão:', error);
		}

		return {
			id: data.id,
			estimateOptions: data.estimate_options,
			averageEstimate: data.average_estimates,
			createdAt: data.created_at,
			updatedAt: data.updated_at,
		};
	}

	async getSession(id: string): Promise<Session> {
		const { data, error } = await this.supabase
			.from('session')
			.select('*')
			.eq('id', id)
			.maybeSingle();

		if (error) {
			throw new PostgrestBaseError(
				`Não foi possível buscar pela sessão: ${id}`,
				error,
			);
		}

		if (!data) {
			throw new SessionNotFoundError(id);
		}
		const sessionData: Session = {
			id: data.id,
			estimateOptions: data.estimate_options,
			averageEstimate: data.average_estimate,
			createdAt: data.created_at,
			updatedAt: data.updated_at,
		};

		return sessionData;
	}

	async insertUser(user: UserCreate): Promise<User> {
		const { data, error } = await this.supabase
			.from('user')
			.upsert([
				{
					id: user.id,
					name: user.name,
					is_observer: user.isObserver,
					session_id: user.sessionId,
				},
			])
			.select()
			.single();

		if (error) {
			throw new PostgrestBaseError('Falha ao criar usuario:', error);
		}

		return {
			id: data.id,
			name: data.name,
			sessionId: data.session_id,
			estimate: data.estimate,
			isObserver: data.is_observer,
			createdAt: data.created_at,
			updatedAt: data.updated_at,
		};
	}

	async getSessionUsers(sessionId: string): Promise<User[]> {
		const { data, error } = await this.supabase
			.from('user')
			.select('*')
			.eq('session_id', sessionId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao buscar pelos usuários da sessão:',
				error,
			);
		}

		return data.map((row) => ({
			id: row.id,
			name: row.name,
			estimate: row.estimate,
			isObserver: row.is_observer,
			sessionId: row.session_id,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));
	}

	async updateUserEstimate(
		userId: string,
		estimate: number | null,
	): Promise<void> {
		const { error } = await this.supabase
			.from('user')
			.update({ estimate: estimate })
			.eq('id', userId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar estimativa do usuário:',
				error,
			);
		}
	}

	async updateUserMode(userId: string, isObserver: boolean): Promise<void> {
		const { error } = await this.supabase
			.from('user')
			.update({ is_observer: isObserver })
			.eq('id', userId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar modo do usuário:',
				error,
			);
		}
	}

	async updateUserEstimates(sessionId: string, estimate: number | null) {
		const { error } = await this.supabase
			.from('user')
			.update({ estimate: estimate })
			.eq('session_id', sessionId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar estimativas dos usuários:',
				error,
			);
		}
	}

	async updateSessionAverageEstimate(
		sessionId: string,
		averageEstimate: number | null,
	) {
		const { error } = await this.supabase
			.from('session')
			.update({ average_estimate: averageEstimate })
			.eq('id', sessionId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar estimativa da sessão:',
				error,
			);
		}
	}

	async updateSessionEstimateOptions(
		sessionId: string,
		estimateOptions: string,
	) {
		const { error } = await this.supabase
			.from('session')
			.update({ estimate_options: estimateOptions })
			.eq('id', sessionId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar opções de estimativas',
				error,
			);
		}
	}

	async insertSessionResults(sessionResult: SessionResultCreate) {
		const { error } = await this.supabase
			.from('session_results')
			.upsert([
				{
					session_id: sessionResult.sessionId,
					average_estimate: sessionResult.averageEstimate,
					generated_by: sessionResult.generatedBy,
					description: sessionResult.description,
				},
			])
			.select()
			.single();

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao registrar estimativa da sessão:',
				error,
			);
		}
	}

	async getSessionResults(sessionId: string): Promise<SessionResult[]> {
		const { data, error } = await this.supabase
			.from('session_results')
			.select('*')
			.eq('session_id', sessionId)
			.order('created_at', { ascending: false });

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao buscar pelo histórico de estimativas da sessão:',
				error,
			);
		}

		return data.map((row) => ({
			id: row.id,
			averageEstimate: row.average_estimate,
			sessionId: row.session_id,
			generatedBy: row.generated_by,
			description: row.description,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));
	}

	async deleteSessionResult(id: string) {
		const { error } = await this.supabase
			.from('session_results')
			.delete()
			.eq('id', id);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao remover estimativa do histórico',
				error,
			);
		}
	}

	async updateSessionResultDescription(
		sessionResultId: string,
		description: string,
	) {
		const { error } = await this.supabase
			.from('session_results')
			.update({ description: description })
			.eq('id', sessionResultId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar descrição da estimativa',
				error,
			);
		}
	}
}
