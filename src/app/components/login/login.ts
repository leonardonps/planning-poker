import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session/session.service';
import { generateId } from '../../utils/string/id';
import { initialEstimateOptions } from '../../constants/initial-estimate-options';
import { SessionCreate } from '../../interfaces/session';

@Component({
	selector: 'app-login',
	imports: [],
	templateUrl: './login.html',
	styleUrl: './login.scss',
})
export class Login {
	private router = inject(Router);
	private sessionService = inject(SessionService);

	protected disabled = signal(false);

	async createNewSession() {
		this.disabled.set(true);

		try {
			const newSession: SessionCreate = {
				id: generateId(6),
				estimateOptions: initialEstimateOptions,
				averageEstimate: null,
			};

			const createdSession =
				await this.sessionService.createSession(newSession);

			this.router.navigate(['session', createdSession.id]);
		} catch (error) {
			alert(error);
		} finally {
			this.disabled.set(false);
		}
	}
}
