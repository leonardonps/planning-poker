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
import { Session } from '../../interfaces/session';
import { SupabaseService } from '../shared/supabase.service';
import { LoadingSpinnerService } from '../shared/loading-spinner.service';
import { UserService } from '../user/user.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
	private router = inject(Router);

	private supabaseService = inject(SupabaseService);

	private loadingSpinnerService = inject(LoadingSpinnerService);
	private toastService = inject(ToastService);
	private userModalService = inject(UserModalService);

	private userService = inject(UserService);

	private sessionChannel: RealtimeChannel | null = null;

	session: WritableSignal<Session | undefined> = signal(undefined);

	users: WritableSignal<User[]> = signal([]);

	presentUsers: Signal<User[]> = computed(() =>
		this.users().filter((user) => this.presentUserIds().includes(user.id)),
	);

	presentUserIds: WritableSignal<string[]> = signal([]);

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

			// Set session users
			await this.setUsers();

			// Set current user
			this.userService.user.set(
				this.users().find((user) => user.id === userId),
			);

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

	createSessionChannel() {
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
					event: 'INSERT',
					schema: 'public',
					table: 'user',
					filter: `session_id=eq.${session.id}`,
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
					filter: `session_id=eq.${session.id}`,
				},
				(payload) => {
					this.users.update((users) =>
						users.map((user) =>
							user.id === payload.new['id']
								? {
										...user,
										estimate: payload.new['estimate'],
										isObserver: payload.new['is_observer'],
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
					filter: `id=eq.${session.id}`,
				},
				(payload) => {
					const averageEstimate: number | null =
						payload.new['average_estimate'];

					const estimateOptions: string = payload.new['estimate_options'];

					if (averageEstimate === null) {
						this.userService.user.update((user) =>
							user ? { ...user, estimate: null } : user,
						);
					}

					this.session.update((session) =>
						session
							? {
									...session,
									estimateOptions,
									averageEstimate,
								}
							: session,
					);
				},
			)
			.subscribe(async (status, err) => {
				console.log(
					`Supabase channel status: ${status} | ${new Date().toISOString()}`,
				);

				if (status !== 'SUBSCRIBED') {
					console.log('Error: ', err);
					return;
				}

				const user = this.userService.user();

				// If the user is already created, it tracks them
				if (user) {
					const presenceState = await this.getSessionChannel().track({
						userId: user.id,
						userName: user.name,
						onlineAt: new Date().toISOString(),
					});
					console.log('Track response: ', presenceState);
				}
			});
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

	async updateSessionAverageEstimate(estimates: number[]) {
		try {
			const session = this.getSession();

			const averageEstimate = truncate(
				this.calculateSessionAverageEstimate(estimates),
				1,
			);

			await this.supabaseService.updateSession(session.id, { averageEstimate });

			await this.supabaseService.insertSessionResults({
				generatedBy: this.userService.getUser().name,
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
			await this.supabaseService.updateSession(session.id, {
				averageEstimate: null,
			});
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
}
