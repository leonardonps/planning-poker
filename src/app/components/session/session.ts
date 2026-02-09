import {
	AfterViewInit,
	Component,
	computed,
	inject,
	OnDestroy,
	OnInit,
	signal,
	Signal,
	ViewChild,
	ViewContainerRef,
	WritableSignal,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { ToastService } from '../../services/shared/toast.service';

import { UserModalService } from '../../services/modals/user-modal.service';
import { SessionService } from '../../services/session/session.service';
import { SessionResultsModalService } from '../../services/modals/session-results-modal.service';
import { EstimateOptionsModalService } from '../../services/modals/estimate-options-modal.service';
import { User } from '../../interfaces/user';
import { UserService } from '../../services/user/user.service';
import { SessionResultsService } from '../../services/session-results/session-results.service';
import { ERROR_MESSAGES } from '../../constants/messages/error-messages';
import { ConnectionService } from '../../services/shared/connection.service';

@Component({
	selector: 'app-session',
	imports: [],
	templateUrl: './session.html',
	styleUrl: './session.scss',
})
export class Session implements AfterViewInit, OnInit, OnDestroy {
	@ViewChild('toast', { read: ViewContainerRef })
	toastContainerRef!: ViewContainerRef;
	@ViewChild('modal', { read: ViewContainerRef })
	modalContainerRef!: ViewContainerRef;

	private route = inject(ActivatedRoute);

	private userModalService = inject(UserModalService);
	private estimateOptionsModalService = inject(EstimateOptionsModalService);
	private sessionResultsModalService = inject(SessionResultsModalService);
	private connectionService = inject(ConnectionService);

	private toastService = inject(ToastService);

	protected sessionService = inject(SessionService);
	protected userService = inject(UserService);
	protected sessionResultsService = inject(SessionResultsService);

	private sessionLink = window.location.href;

	protected presentUsers: Signal<User[]> = computed(() =>
		this.sessionService
			.presentUsers()
			.sort((a, b) => a.name.localeCompare(b.name)),
	);

	protected userEstimates: Signal<number[]> = computed(() =>
		this.sessionService
			.presentUsers()
			.map((user) => user.estimate)
			.filter((estimate) => typeof estimate === 'number'),
	);

	protected estimateOptions: Signal<number[] | undefined> = computed(() =>
		this.sessionService.session()?.estimateOptions.split(', ').map(Number),
	);

	protected avegareEstimate: Signal<number | null | undefined> = computed(
		() => this.sessionService.session()?.averageEstimate,
	);

	protected selectedOption: Signal<number | null | undefined> = computed(
		() => this.userService.user()?.estimate,
	);

	protected isObserver: Signal<boolean | undefined> = computed(
		() => this.userService.user()?.isObserver,
	);

	protected isOnline: Signal<boolean> = computed(() =>
		this.connectionService.isOnline(),
	);

	protected settingsMenuOpen: WritableSignal<boolean> = signal(false);

	protected isUpdatingAverageEstimate: WritableSignal<boolean> = signal(false);

	ngOnInit() {
		const sessionId = this.route.snapshot.paramMap.get('id');
		const userId = sessionStorage.getItem('userId');

		this.sessionService.initializeSession(sessionId, userId);
	}

	ngAfterViewInit() {
		this.toastService.setHost(this.toastContainerRef);
		this.userModalService.setHost(this.modalContainerRef);
		this.estimateOptionsModalService.setHost(this.modalContainerRef);
		this.sessionResultsModalService.setHost(this.modalContainerRef);
	}

	ngOnDestroy() {
		sessionStorage.clear();

		this.toastService.hide();
		this.userModalService.close();
		this.estimateOptionsModalService.close();
		this.sessionResultsModalService.close();

		this.sessionService.refreshSessionData();
	}

	async copySessionLink() {
		await this.sessionService.copySessionLink(this.sessionLink);
	}

	async selectEstimate(option: number) {
		await this.userService.updateUserEstimate(option);
	}

	async updateSessionAverageEstimate() {
		this.isUpdatingAverageEstimate.set(true);

		try {
			await this.sessionService.updateSessionAverageEstimate(
				this.userEstimates(),
			);
		} catch (error) {
			this.sessionService.handleUpdateSessionAverageEstimateErrors(
				error as Error,
				ERROR_MESSAGES.UPDATE_AVERAGE_ESTIMATE,
			);
		} finally {
			this.isUpdatingAverageEstimate.set(false);
		}
	}

	async restartSessionAverageEstimate() {
		this.isUpdatingAverageEstimate.set(true);

		try {
			await this.sessionService.restartSessionAverageEstimate();
		} catch (error) {
			this.sessionService.handleUpdateSessionAverageEstimateErrors(
				error as Error,
				ERROR_MESSAGES.RESTART_AVERAGE_ESTIMATE,
			);
		} finally {
			this.isUpdatingAverageEstimate.set(false);
		}
	}

	onOpenEditEstimateOptionsModal() {
		this.estimateOptionsModalService.open();
	}

	async toggleUserMode() {
		await this.userService.toggleUserMode();
	}

	onToggleSettingsMenu() {
		this.settingsMenuOpen.set(!this.settingsMenuOpen());
	}

	async onOpenSessionResultsModal() {
		await this.sessionResultsService.getSessionResults(
			this.sessionService.getSession().id,
		);
		this.sessionResultsModalService.open();
	}
}
