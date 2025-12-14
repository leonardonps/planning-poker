import {
	computed,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal,
} from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ToastService } from '../shared/toast.service';
import { Router } from '@angular/router';
import { UserModalService } from './modals/user-modal.service';
import { User } from '../../interfaces/user';
import { SessionNotFoundError } from '../../errors/SessionNotFoundError';
import { ChannelNotFoundError } from '../../errors/ChannelNotFoundError';
import { SessionPresence } from '../../interfaces/session-presence';
import { UserNotFoundError } from '../../errors/UserNotFoundError';
import { truncate } from '../../utils/number/truncate';
import { Session } from '../../interfaces/session';
import { SessionResult } from '../../interfaces/session-results';
import { SupabaseService } from '../shared/supabase.service';
import { LoadingSpinnerService } from '../shared/loading-spinner.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
	private router = inject(Router);

	private supabaseService = inject(SupabaseService);

	private loadingSpinnerService = inject(LoadingSpinnerService);
	private toastService = inject(ToastService);
	private userModalService = inject(UserModalService);

	private sessionChannel: RealtimeChannel | null = null;

	session: WritableSignal<Session | undefined> = signal(undefined);
	users: WritableSignal<User[]> = signal([]);
	presentUsers: Signal<User[]> = computed(() =>
		this.users().filter((user) => this.presentUserIds().includes(user.id)),
	);
	presentUserIds: WritableSignal<string[]> = signal([]);
	user: WritableSignal<User | undefined> = signal(undefined);
	sessionResults: WritableSignal<SessionResult[]> = signal([]);

	getUser(): User {
		const user = this.user();

		if (!user) {
			throw new UserNotFoundError();
		}

		return user;
	}

	getSession(): Session {
		const session = this.session();

		if (!session) {
			throw new SessionNotFoundError(session);
		}

		return session;
	}

	getSessionChannel(): RealtimeChannel {
		const sessionChannel = this.sessionChannel;

		if (!sessionChannel) {
			throw new ChannelNotFoundError();
		}

		return sessionChannel;
	}

	destroySessionChannel() {
		this.sessionChannel?.unsubscribe();
		this.sessionChannel = null;
	}

	calculateSessionAverageEstimate(estimates: number[]): number {
		const initialValue = 0;

		const averageEstimate: number =
			estimates.reduce((sum, estimate) => sum + estimate, initialValue) /
			estimates.length;

		return averageEstimate;
	}

	updatePresentUsers() {
		try {
			const presentUserIds = Object.values(
				this.getSessionChannel().presenceState() as Record<
					string,
					SessionPresence[]
				>,
			)
				.flat()
				.map((presence) => presence.userId);

			this.presentUserIds.set(presentUserIds);
		} catch (error) {
			alert(`Falha ao atualizar usuários presentes: ${error}`);
		}
	}

	async initializeSession(sessionId: string | null, userId: string | null) {
		this.loadingSpinnerService.show();

		try {
			// Verify if the sessionId is from an existent session
			if (!sessionId) {
				throw new SessionNotFoundError(sessionId);
			}

			// Set existent session
			await this.setSession(sessionId);

			// If it's other session, it removes the userId to show again user modal
			if (
				this.session() &&
				this.session()?.id !== sessionStorage.getItem('sessionId')
			) {
				sessionStorage.removeItem('userId');
			}

			sessionStorage.setItem('sessionId', sessionId);

			await this.setUsers(sessionId);

			this.user.set(this.users().find((user) => user.id === userId));

			await this.createSessionChannel(sessionId);

			this.userModalService.open();
		} catch (error) {
			alert(error);
			this.router.navigate(['/']);
			sessionStorage.removeItem('userId');
		} finally {
			this.loadingSpinnerService.hide();
		}
	}

	async createSessionChannel(sessionId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.sessionChannel = this.supabaseService.supabase.channel(
				`session:${sessionId}`,
			);

			this.sessionChannel
				.on(
					'presence',
					{
						event: 'sync',
					},
					() => {
						this.updatePresentUsers();
					},
				)
				.on(
					'postgres_changes',
					{
						event: 'INSERT',
						schema: 'public',
						table: 'user',
						filter: `session_id=eq.${sessionId}`,
					},
					(payload) => {
						const createdUser: User = {
							id: payload.new['id'],
							name: payload.new['name'],
							estimate: payload.new['estimate'],
							isObserver: payload.new['is_observer'],
							sessionId: payload.new['session_id'],
							createdAt: payload.new['created_at'],
							updatedAt: payload.new['updated_at'],
						};

						this.users.update((users) => [...users, createdUser]);
					},
				)
				.on(
					'postgres_changes',
					{
						event: 'UPDATE',
						schema: 'public',
						table: 'user',
						filter: `session_id=eq.${sessionId}`,
					},
					(payload) => {
						this.users.update((users) =>
							users.map((user) =>
								user.id === payload.new['id']
									? {
											...user,
											estimate: payload.new['estimate'],
											observer: payload.new['observer'],
										}
									: user,
							),
						);
					},
				)
				.on(
					'postgres_changes',
					{
						event: 'UPDATE',
						schema: 'public',
						table: 'session',
						filter: `id=eq.${sessionId}`,
					},
					(payload) => {
						const averageEstimate: number | null =
							payload.new['average_estimate'];

						const estimateOptions: string = payload.new['estimate_options'];

						if (averageEstimate === null) {
							this.user.update((user) =>
								user ? { ...user, estimate: null } : user,
							);
						}

						this.session.update((session) =>
							session
								? {
										...session,
										estimateOptions: estimateOptions,
										averageEstimate: averageEstimate,
									}
								: session,
						);
					},
				)
				.subscribe(async (status) => {
					switch (status) {
						case 'SUBSCRIBED':
							try {
								const user = this.user();

								// If the user is already created, it tracks them
								if (user) {
									await this.trackPresence(user);
								}
								resolve();
							} catch (error) {
								alert(error);
							}
							break;
						case 'CHANNEL_ERROR':
						case 'TIMED_OUT':
						case 'CLOSED':
							this.toastService.show({
								text: `Conexão perdida: ${status}`,
								duration: 5000,
							});
							reject();
							break;
					}
				});
		});
	}

	async setSession(id: string) {
		const session: Session = await this.supabaseService.getSession(id);

		this.session.set(session);
	}

	async setUsers(sessionId: string): Promise<void> {
		const users: User[] = await this.supabaseService.getSessionUsers(sessionId);
		this.users.set(users);
	}

	async trackPresence(user: User) {
		try {
			await this.getSessionChannel().track({
				userId: user.id,
				userName: user.name,
				onlineAt: new Date().toISOString(),
			});

			this.toastService.show({
				text: 'Conexão estabelecida',
			});
		} catch (error) {
			alert(error);
		}
	}

	async updateUserEstimate(option: number) {
		try {
			const user = this.getUser();

			const estimate = option === user.estimate ? null : option;

			this.user.update((user) =>
				user ? { ...user, estimate: estimate } : user,
			);
			await this.supabaseService.updateUserEstimate(user.id, estimate);
		} catch (error) {
			alert(error);
		}
	}

	async updateSessionAverageEstimate(estimates: number[]) {
		try {
			const session = this.getSession();

			const averageEstimate = truncate(
				this.calculateSessionAverageEstimate(estimates),
				1,
			);

			await this.supabaseService.updateSessionAverageEstimate(
				session.id,
				averageEstimate,
			);

			await this.supabaseService.insertSessionResults({
				generatedBy: this.getUser().name,
				averageEstimate: averageEstimate,
				sessionId: session.id,
				description: 'Sem descrição',
			});
		} catch (error) {
			alert(error);
		}
	}

	async restartSessionAverageEstimate() {
		try {
			const session = this.getSession();
			await this.supabaseService.updateSessionAverageEstimate(session.id, null);
			await this.supabaseService.updateUserEstimates(session.id, null);
		} catch (error) {
			alert(error);
		}
	}

	async copySessionLink(sessionLink: string) {
		try {
			await navigator.clipboard.writeText(sessionLink);
			this.toastService.show({
				text: 'Link copiado para a área de transferência',
			});
		} catch (error) {
			this.toastService.show({
				text: `Falha ao copiar link para a área de transferência: ${error}`,
			});
		}
	}

	async toggleUserMode(): Promise<void> {
		try {
			let user = this.getUser();

			const isObserver = !user.isObserver;
			const estimate = null;

			user = { ...user, isObserver, estimate };

			this.user.update((user) =>
				user ? { ...user, isObserver: isObserver, estimate: estimate } : user,
			);

			await this.supabaseService.updateUserMode(user.id, isObserver);
			await this.supabaseService.updateUserEstimate(user.id, estimate);
		} catch (error) {
			alert(error);
		}
	}

	async getSessionResults() {
		try {
			const session = this.getSession();

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
		await this.supabaseService.updateSessionResultDescription(
			sessionResultId,
			description,
		);
		this.sessionResults.update((sessionResults) =>
			sessionResults.map((sessionResult) =>
				sessionResult.id === sessionResultId
					? { ...sessionResult, description: description }
					: sessionResult,
			),
		);
	}
}
