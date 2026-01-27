import {
	computed,
	effect,
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
import { ERROR_MESSAGES } from '../../constants/messages/error-messages';
import { UserService } from '../user/user.service';
import { SessionResultsService } from '../session-results/session-results.service';
import { DEFAULT_VALUES } from '../../constants/default-values';
import { ConnectionService } from '../shared/connection.service';
import { CONNECTION_MESSAGES } from '../../constants/messages/connection-messages';

@Injectable({ providedIn: 'root' })
export class SessionService {
	private router = inject(Router);

	private supabaseService = inject(SupabaseService);

	private connectionService = inject(ConnectionService);
	private loadingSpinnerService = inject(LoadingSpinnerService);
	private toastService = inject(ToastService);
	private userModalService = inject(UserModalService);

	private userService = inject(UserService);
	private sessionResultsService = inject(SessionResultsService);

	private userUpdateDebounce: NodeJS.Timeout | undefined = undefined;

	private sessionChannel: RealtimeChannel | undefined = undefined;
	private presentUserIds: WritableSignal<string[]> = signal([]);

	private isInitialized: WritableSignal<boolean> = signal(false);

	users: WritableSignal<User[]> = signal([]);

	presentUsers: Signal<User[]> = computed(() =>
		this.users().filter((user) => this.presentUserIds().includes(user.id)),
	);

	session: WritableSignal<Session | undefined> = signal(undefined);

	constructor() {
		effect(() => {
			const isOnline = this.connectionService.isOnline();
			const wasOffline = this.connectionService.wasOffline();

			if (isOnline && wasOffline) {
				this.handleReconnection();
			}

			if (!isOnline && !wasOffline) {
				this.handleDisconnection();
			}
		});
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

	refreshSessionData(): void {
		this.isInitialized.set(false);
		this.session.set(undefined);
		this.users.set([]);
		this.presentUserIds.set([]);
		this.userService.user.set(undefined);
		this.userService.userIdSessionStorage.set(null);

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
		// Setting the initial state
		this.loadingSpinnerService.show();
		this.refreshSessionData();

		try {
			// Verifying if the sessionId is from an existent session
			if (!sessionId) {
				throw new SessionNotFoundError(sessionId);
			}

			// Setting the userId from the sessionStorage
			await this.setSession(sessionId);
			this.userService.userIdSessionStorage.set(userId);

			// Setting Supabase channel
			this.createSessionChannel();
			this.setUpSessionChannelListeners();
			this.subscribeSessionChannel();
		} catch (error) {
			alert(error);
			this.loadingSpinnerService.hide();
			this.router.navigate(['/']);
		}
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

		await this.sessionResultsService.insertSessionResult({
			sessionId: this.getSession().id,
			generatedBy: this.userService.getUser().name,
			averageEstimate,
			description: DEFAULT_VALUES.SESSION_RESULT_DESCRIPTION,
		});
	}

	async updateSessionEstimateOptions(estimateOptions: string) {
		await this.supabaseService.updateSession(this.getSession().id, {
			estimateOptions: estimateOptions,
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

	private async setSession(id: string) {
		const session: Session = await this.supabaseService.getSession(id);

		this.session.set(session);
	}

	private async setUsers(): Promise<void> {
		const session = this.getSession();

		const users: User[] = await this.supabaseService.getSessionUsers(
			session.id,
		);

		this.users.set(users);
	}

	private setCurrentUserByUsersSession(): void {
		this.userService.user.set(
			this.users().find(
				(user) => user.id === this.userService.userIdSessionStorage(),
			),
		);
	}

	private createSessionChannel(): void {
		this.sessionChannel = this.supabaseService.supabase.channel(
			`session:${this.getSession()}`,
		);
	}

	private setUpSessionChannelListeners(): void {
		this.getSessionChannel()
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
					filter: `session_id=eq.${this.getSession().id}`,
				},
				async () => {
					clearTimeout(this.userUpdateDebounce);

					this.userUpdateDebounce = setTimeout(async () => {
						await this.setUsers();
						this.setCurrentUserByUsersSession();
					}, 150);
				},
			)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'session',
					filter: `id=eq.${this.getSession().id}`,
				},
				async () => {
					await this.setSession(this.getSession().id);
				},
			);
	}

	private subscribeSessionChannel() {
		this.getSessionChannel().subscribe(async (status) => {
			console.warn(
				`Supabase channel status: ${status} | ${new Date().toISOString()}`,
			);

			// Returning when the status is not SUBSCRIBED; the idea is: every SUBSCRIBED it fetches session data again
			if (status !== 'SUBSCRIBED') {
				return;
			}

			// To avoid setting the session twice (getting it from database) when it's the first time
			if (this.isInitialized()) {
				await this.setSession(this.getSession().id);
			}

			// Setting the session users
			await this.setUsers();
			this.setCurrentUserByUsersSession();

			// Closing the loading after getting the session data
			this.loadingSpinnerService.hide();

			// Verifying the current user:
			const user = this.userService.user();

			if (!user) {
				// Option #1: if there's no user, it opens the modal to create one
				this.userModalService.open();
			} else {
				// Option #2: if there's a user, so it tracks them again
				const presenceState = await this.getSessionChannel().track({
					userId: user.id,
					userName: user.name,
					onlineAt: new Date().toISOString(),
				});
				console.warn('Track response - Session: ', presenceState);
			}

			// Confirming the session has initialized
			this.isInitialized.set(true);
		});
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

	private async handleReconnection() {
		this.toastService.hide();

		this.initializeSession(
			this.getSession().id,
			this.userService.userIdSessionStorage(),
		);

		this.toastService.show({
			text: CONNECTION_MESSAGES.RECONNECTED,
		});

		this.connectionService.wasOffline.set(false);
	}

	private handleDisconnection() {
		this.toastService.hide();
		this.toastService.show({
			text: CONNECTION_MESSAGES.DISCONNECTED,
		});

		this.connectionService.wasOffline.set(true);
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
