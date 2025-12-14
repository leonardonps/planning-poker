import {
	Component,
	ElementRef,
	inject,
	signal,
	ViewChild,
} from '@angular/core';
import { BaseModal } from '../../../shared/base-modal/base-modal';
import { SessionResultsModalService } from '../../../../services/session/modals/session-results-modal.service';
import { SessionService } from '../../../../services/session/session.service';
import { DatePipe } from '@angular/common';
import { ExcelService } from '../../../../services/shared/excel.service';

@Component({
	selector: 'app-session-results-modal',
	imports: [BaseModal, DatePipe],
	templateUrl: './session-results-modal.html',
	styleUrl: './session-results-modal.scss',
})
export class SessionResultsModal {
	@ViewChild('sessionResultsTable') sessionResultsTable!: ElementRef;

	private sessionResultsModalService = inject(SessionResultsModalService);
	private excelService = inject(ExcelService);

	protected sessionService = inject(SessionService);
	protected title = 'Histórico da sessão';

	protected isDeleting = signal<Record<string, boolean>>({});
	protected isUpdating = signal<Record<string, boolean>>({});

	onCloseSessionResults() {
		this.sessionResultsModalService.close();
	}

	onExportSessionResults() {
		this.excelService.exportTable(
			this.sessionResultsTable.nativeElement,
			'teste',
			'teste',
		);
	}

	async onDeleteSessionResult(id: string) {
		this.isDeleting.update((map) => ({ ...map, [id]: true }));

		try {
			await this.sessionService.deleteSessionResult(id);
		} catch (error) {
			alert(error);
		} finally {
			this.isDeleting.update((map) => ({ ...map, [id]: false }));
		}
	}

	async onUpdateDescription(sessionResultId: string, newDescription: string) {
		const currentSessionResult = this.sessionService
			.sessionResults()
			.find((sessionResult) => sessionResult.id === sessionResultId);

		if (
			!currentSessionResult ||
			currentSessionResult.description === newDescription ||
			!newDescription
		) {
			return;
		}

		this.isUpdating.update((map) => ({ ...map, [sessionResultId]: true }));

		try {
			await this.sessionService.updateSessionResultDescription(
				sessionResultId,
				newDescription,
			);
		} catch (error) {
			alert(error);
		} finally {
			this.isUpdating.update((map) => ({ ...map, [sessionResultId]: false }));
		}
	}
}
