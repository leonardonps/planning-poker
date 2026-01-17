import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
	Session,
	SessionCreate,
	SessionUpdate,
} from '../../interfaces/session';
import { PostgrestBaseError } from '../../errors/PostgrestBaseError';
import { SessionNotFoundError } from '../../errors/SessionNotFoundError';
import { User, UserCreate, UserUpdate } from '../../interfaces/user';
import {
	SessionResult,
	SessionResultCreate,
	SessionResultUpdate,
} from '../../interfaces/session-results';
import { environment } from '../../../environments/environment';
import { toSnakeCase } from '../../utils/string/camel-case-to-snake-case';
import { UpdateSessionAverageEstimateResponse } from '../../interfaces/update-session-average-estimate-response';

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
			version: data.version,
		};
	}

	async updateSession(sessionId: string, updatedSession: SessionUpdate) {
		const updatedSessionSnakeCase = toSnakeCase(updatedSession);

		const { error } = await this.supabase
			.from('session')
			.update(updatedSessionSnakeCase)
			.eq('id', sessionId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar dados da sessão: ',
				error,
			);
		}
	}

	async updateSessionAverageEstimate(
		sessionId: string,
		averageEstimate: number | null,
		currentVersion: number,
	): Promise<void> {
		const { data, error } = await this.supabase
			.rpc('update_session_estimate', {
				p_session_id: sessionId,
				p_average_estimate: averageEstimate,
				p_current_version: currentVersion,
			})
			.single<UpdateSessionAverageEstimateResponse>();

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar estimativa da sessão',
				error,
			);
		}

		if (!data.success) {
			throw new Error(data.error_message ?? 'Erro desconhecido');
		}
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
			version: data.version,
		};

		return sessionData;
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

	async insertUser(user: UserCreate): Promise<User> {
		const userSnakeCase = toSnakeCase(user);
		const { data, error } = await this.supabase
			.from('user')
			.upsert([userSnakeCase])
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

	async updateUser(userId: string, updatedUser: UserUpdate): Promise<void> {
		const updatedUserSnakeCase = toSnakeCase(updatedUser);

		const { error } = await this.supabase
			.from('user')
			.update(updatedUserSnakeCase)
			.eq('id', userId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar dados do usuário:',
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

	async updateSessionResult(
		sessionResultId: string,
		updatedSessionResult: SessionResultUpdate,
	) {
		const updatedSessionResultSnakeCase = toSnakeCase(updatedSessionResult);

		const { error } = await this.supabase
			.from('session_results')
			.update(updatedSessionResultSnakeCase)
			.eq('id', sessionResultId);

		if (error) {
			throw new PostgrestBaseError(
				'Falha ao atualizar dados de uma estimativa',
				error,
			);
		}
	}
}
