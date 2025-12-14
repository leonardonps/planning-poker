import { Component, inject, OnInit } from '@angular/core';
import { BaseModal } from '../../../shared/base-modal/base-modal';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { estimateOptionsValidator } from '../../../../validators/estimateOptions';
import { SessionService } from '../../../../services/session/session.service';
import { EstimateOptionsModalService } from '../../../../services/session/modals/estimate-options-modal.service';
import { SupabaseService } from '../../../../services/shared/supabase.service';

@Component({
	selector: 'app-estimate-options-modal',
	imports: [BaseModal, ReactiveFormsModule],
	templateUrl: './estimate-options-modal.html',
	styleUrl: './estimate-options-modal.scss',
})
export class EstimateOptionsModal implements OnInit {
	private estimateOptionsModalService = inject(EstimateOptionsModalService);

	private sessionService = inject(SessionService);
	private supabaseService = inject(SupabaseService);

	protected title = 'Editar opções de estimativa';

	estimateOptionsForm!: FormGroup;
	submitted = false;
	disabled = false;

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
		this.submitted = true;

		if (!this.estimateOptionsForm.valid) {
			return;
		}

		this.disabled = true;

		try {
			const sessionId = this.sessionService.getSession().id;

			const estimateOptions = new Set<number>(
				this.estimateOptionsForm.controls['estimateOptions'].value
					?.split(', ')
					.map(Number),
			);

			const sortedEstimateOptions = Array.from(estimateOptions)
				.sort((a, b) => a - b)
				.join(', ');

			await this.supabaseService.updateSessionEstimateOptions(
				sessionId,
				sortedEstimateOptions,
			);

			await this.supabaseService.updateUserEstimates(sessionId, null);

			this.estimateOptionsModalService.close();
		} catch (error) {
			alert(error);
		} finally {
			this.submitted = false;
			this.disabled = false;
		}
	}
}
