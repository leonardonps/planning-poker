import {
	AfterViewInit,
	Component,
	computed,
	inject,
	OnDestroy,
	OnInit,
	Signal,
	ViewChild,
	ViewContainerRef,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { ToastService } from '../../services/shared/toast.service';

import { UserModalService } from '../../services/session/modals/user-modal.service';
import { SessionService } from '../../services/session/session.service';
import { SessionResultsModalService } from '../../services/session/modals/session-results-modal.service';
import { EstimateOptionsModalService } from '../../services/session/modals/estimate-options-modal.service';
import { User } from '../../interfaces/user';

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
	private toastService = inject(ToastService);

	protected sessionService = inject(SessionService);

	private sessionLink = window.location.href;

	protected presentUsers: Signal<User[]> = computed(() =>
		this.sessionService
			.presentUsers()
			.sort((a, b) => a.name.localeCompare(b.name)),
	);

	protected userEstimates: Signal<number[]> = computed(() =>
		this.presentUsers()
			.filter((user) => user.estimate !== null)
			.map((user) => user.estimate as number),
	);

	protected estimateOptions: Signal<number[] | undefined> = computed(() =>
		this.sessionService.session()?.estimateOptions.split(', ').map(Number),
	);

	protected avegareEstimate: Signal<number | null | undefined> = computed(
		() => this.sessionService.session()?.averageEstimate,
	);

	protected selectedOptions: Signal<number | null | undefined> = computed(
		() => this.sessionService.user()?.estimate,
	);

	protected settingsMenuOpen = false;

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

		this.sessionService.destroySessionChannel();
	}

	async copySessionLink() {
		await this.sessionService.copySessionLink(this.sessionLink);
	}

	async selectEstimate(option: number) {
		await this.sessionService.updateUserEstimate(option);
	}

	async updateSessionAverageEstimate() {
		await this.sessionService.updateSessionAverageEstimate(
			this.userEstimates(),
		);
	}

	async restartSessionAverageEstimate() {
		await this.sessionService.restartSessionAverageEstimate();
	}

	onOpenEditEstimateOptionsModal() {
		this.estimateOptionsModalService.open();
	}

	async toggleUserMode() {
		await this.sessionService.toggleUserMode();
	}

	toggleSettingsMenu() {
		this.settingsMenuOpen = !this.settingsMenuOpen;
	}

	async onOpenSessionResultsModal() {
		await this.sessionService.getSessionResults();
		this.sessionResultsModalService.open();
	}
}
