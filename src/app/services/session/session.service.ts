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
import { UserModalService } from '../modals/user-modal.service';
import { User } from '../../interfaces/user';
import { SessionNotFoundError } from '../../errors/SessionNotFoundError';
import { ChannelNotFoundError } from '../../errors/ChannelNotFoundError';
import { SessionPresence } from '../../interfaces/session-presence';
import { truncate } from '../../utils/number/truncate';
import { Session, SessionCreate } from '../../interfaces/session';
import { SupabaseService } from '../shared/supabase.service';
import { LoadingSpinnerService } from '../shared/loading-spinner.service';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from '../../constants/error-messages';

@Injectable({ providedIn: 'root' })
export class SessionService {
	private router = inject(Router);

	private supabaseService = inject(SupabaseService);

	private loadingSpinnerService = inject(LoadingSpinnerService);
	private toastService = inject(ToastService);
	private userModalService = inject(UserModalService);

	private userService = inject(UserService);

	private sessionChannel: RealtimeChannel | undefined = undefined;

	private userUpdateDebounce: NodeJS.Timeout | undefined = undefined;

	private presentUserIds: WritableSignal<string[]> = signal([]);

	private firstSubscribed = true;

	users: WritableSignal<User[]> = signal([]);

	presentUsers: Signal<User[]> = computed(() =>
		this.users().filter((user) => this.presentUserIds().includes(user.id)),
	);

	session: WritableSignal<Session | undefined> = signal(undefined);

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

	createSessionChannel(): void {
		const session = this.getSession();

		this.sessionChannel = this.supabaseService.supabase.channel(
			`session:${session.id}`,
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
					event: '*',
					schema: 'public',
					table: 'user',
					filter: `session_id=eq.${session.id}`,
				},
				async () => {
					clearTimeout(this.userUpdateDebounce);
					this.userUpdateDebounce = setTimeout(async () => {
						await this.setUsers();
						if (this.userService.user()) {
							// Set current user
							this.userService.user.set(
								this.users().find(
									(user) => user.id === this.userService.user()?.id,
								),
							);
						}
					}, 150);
				},
			)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'session',
					filter: `id=eq.${session.id}`,
				},
				async () => {
					await this.setSession(session.id);
				},
			)
			.subscribe(async (status) => {
				console.log(
					`Supabase channel status: ${status} | ${new Date().toISOString()}`,
				);

				if (status !== 'SUBSCRIBED') {
					return;
				}

				// Recovering the data when it gets reconnected (subscribed again)
				if (!this.firstSubscribed) {
					await this.fetchSessionData(session.id, this.userService.user()?.id);
				}

				// Once it gets false, the app updates the values every subscribed status
				this.firstSubscribed = false;

				// If the user is already created, it tracks them
				const user = this.userService.user();
				if (user) {
					const presenceState = await this.getSessionChannel().track({
						userId: user.id,
						userName: user.name,
						onlineAt: new Date().toISOString(),
					});
					console.log('Track response - Session: ', presenceState);
				}
			});
	}

	refreshSession(): void {
		this.firstSubscribed = true;
		this.session.set(undefined);
		this.users.set([]);
		this.presentUserIds.set([]);

		this.destroySessionChannel();
		this.destroyUserDebounce();
	}

	handleUpdateSessionAverageEstimateErrors(
		error: Error,
		defaultErrorMessage: string,
	): void {
		switch (error.message) {
			case 'CONFLICT_ESTIMATE_ALREADY_UPDATED':
				this.toastService.show({
					text: ERROR_MESSAGES.CONFLICT_ESTIMATE_ALREADY_UPDATED,
				});
				break;
			default:
				this.toastService.show({
					text: defaultErrorMessage,
				});
		}
		console.error(error);
	}

	async createSession(sessionCreate: SessionCreate): Promise<Session> {
		return await this.supabaseService.insertSession(sessionCreate);
	}

	async initializeSession(sessionId: string | null, userId: string | null) {
		this.refreshSession();

		this.loadingSpinnerService.show();

		try {
			// Verify if the sessionId is from an existent session
			if (!sessionId) {
				throw new SessionNotFoundError(sessionId);
			}

			await this.fetchSessionData(sessionId, userId);

			this.createSessionChannel();

			if (!this.userService.user()) {
				this.userModalService.open();
			}
		} catch (error) {
			alert(error);
			this.router.navigate(['/']);
		} finally {
			this.loadingSpinnerService.hide();
		}
	}

	async setSession(id: string) {
		const session: Session = await this.supabaseService.getSession(id);

		this.session.set(session);
	}

	async setUsers(): Promise<void> {
		const session = this.getSession();

		const users: User[] = await this.supabaseService.getSessionUsers(
			session.id,
		);

		this.users.set(users);
	}

	async fetchSessionData(
		sessionId: string,
		userId: string | null | undefined,
	): Promise<void> {
		// Set existent session
		await this.setSession(sessionId);

		// Set session users
		await this.setUsers();

		// Set current user
		this.userService.user.set(this.users().find((user) => user.id === userId));
	}

	async updateSessionAverageEstimate(estimates: number[]) {
		const session = this.getSession();

		const averageEstimate = truncate(
			this.calculateSessionAverageEstimate(estimates),
			1,
		);

		await this.supabaseService.updateSessionAverageEstimate(
			session.id,
			averageEstimate,
			session.version,
		);

		await this.supabaseService.insertSessionResults({
			generatedBy: this.userService.getUser().name,
			averageEstimate: averageEstimate,
			sessionId: session.id,
			description: 'Sem descrição',
		});
	}

	async restartSessionAverageEstimate() {
		const session = this.getSession();
		await this.supabaseService.updateSessionAverageEstimate(
			session.id,
			null,
			session.version,
		);
		await this.supabaseService.updateUserEstimates(session.id, null);
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

	private updatePresentUsers(): void {
		try {
			const presentUserIds = Object.values(
				this.getSessionChannel().presenceState() as Record<
					string,
					SessionPresence[]
				>,
			)
				.flat()
				.map((presence) => presence.userId);

			// This guarantees no duplicated user by presentUserId
			const uniquePresentUserIds = Array.from(new Set(presentUserIds));

			this.presentUserIds.set(uniquePresentUserIds);
		} catch (error) {
			this.toastService.show({
				text: 'Falha ao atualizar usuários presentes!',
			});
			console.error(error);
		}
	}

	private calculateSessionAverageEstimate(estimates: number[]): number {
		const initialValue = 0;

		const averageEstimate: number =
			estimates.reduce((sum, estimate) => sum + estimate, initialValue) /
			estimates.length;

		return averageEstimate;
	}

	private destroySessionChannel(): void {
		this.sessionChannel?.unsubscribe();
		this.sessionChannel = undefined;
	}

	private destroyUserDebounce(): void {
		clearTimeout(this.userUpdateDebounce);
		this.userUpdateDebounce = undefined;
	}
}
