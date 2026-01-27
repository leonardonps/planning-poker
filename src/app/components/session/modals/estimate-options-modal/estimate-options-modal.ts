import { Component, inject, OnInit, signal } from '@angular/core';
import { BaseModal } from '../../../shared/base-modal/base-modal';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { estimateOptionsValidator } from '../../../../validators/estimateOptions';
import { SessionService } from '../../../../services/session/session.service';
import { EstimateOptionsModalService } from '../../../../services/modals/estimate-options-modal.service';

@Component({
	selector: 'app-estimate-options-modal',
	imports: [BaseModal, ReactiveFormsModule],
	templateUrl: './estimate-options-modal.html',
	styleUrl: './estimate-options-modal.scss',
})
export class EstimateOptionsModal implements OnInit {
	private estimateOptionsModalService = inject(EstimateOptionsModalService);
	private sessionService = inject(SessionService);

	protected title = 'Editar opções de estimativa';

	protected estimateOptionsForm!: FormGroup;

	protected submitted = signal(false);
	protected disabled = signal(false);

	ngOnInit(): void {
		const currentEstimateOptions = this.sessionService
			.session()
			?.estimateOptions.toString();

		this.estimateOptionsForm = new FormGroup({
			estimateOptions: new FormControl(currentEstimateOptions, {
				validators: [
					Validators.required,
					estimateOptionsValidator(
						/^(0|[1-9]\d*)(\.\d)?(, (0|[1-9]\d*)(\.\d)?)*$/,
					),
				],
			}),
		});
	}

	async save() {
		this.submitted.set(true);

		if (!this.estimateOptionsForm.valid) {
			return;
		}

		this.disabled.set(true);

		try {
			const estimateOptions = new Set<number>(
				this.estimateOptionsForm.controls['estimateOptions'].value
					?.split(', ')
					.map(Number),
			);

			const sortedEstimateOptions = Array.from(estimateOptions)
				.sort((a, b) => a - b)
				.join(', ');

			await this.sessionService.updateSessionEstimateOptions(
				sortedEstimateOptions,
			);

			this.estimateOptionsModalService.close();
		} catch (error) {
			alert(error);
		} finally {
			this.submitted.set(false);
			this.disabled.set(false);
		}
	}

	onCloseEstimateOptions() {
		this.estimateOptionsModalService.close();
	}
}
