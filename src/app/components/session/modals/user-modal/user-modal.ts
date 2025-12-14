import {
	AfterViewInit,
	Component,
	ElementRef,
	inject,
	OnInit,
	ViewChild,
} from '@angular/core';
import { BaseModal } from '../../../shared/base-modal/base-modal';
import {
	FormControl,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { UserModalService } from '../../../../services/session/modals/user-modal.service';
import { SessionNotFoundError } from '../../../../errors/SessionNotFoundError';
import { SessionService } from '../../../../services/session/session.service';
import { generateId } from '../../../../utils/string/id';
import { SupabaseService } from '../../../../services/shared/supabase.service';
import { UserCreate } from '../../../../interfaces/user';

@Component({
	selector: 'app-user-modal',
	imports: [BaseModal, ReactiveFormsModule],
	templateUrl: './user-modal.html',
	styleUrl: './user-modal.scss',
})
export class UserModal implements OnInit, AfterViewInit {
	@ViewChild('userName') userNameRef!: ElementRef;

	private supabaseService = inject(SupabaseService);
	private sessionService = inject(SessionService);
	private userModalService = inject(UserModalService);

	title = 'Novo participante';

	userForm!: FormGroup;

	submitted = false;
	disabled = false;

	ngOnInit(): void {
		this.userForm = new FormGroup({
			name: new FormControl('', [
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(15),
			]),
			isObserver: new FormControl(false),
		});
	}

	ngAfterViewInit(): void {
		this.userNameRef.nativeElement.focus();
	}

	async save(): Promise<void> {
		this.submitted = true;

		if (!this.userForm.valid) {
			return;
		}

		this.disabled = true;

		try {
			const sessionId = this.sessionService.session()?.id;

			if (!sessionId) {
				throw new SessionNotFoundError(sessionId);
			}

			const newUser: UserCreate = {
				id: generateId(8),
				name: this.userForm.controls['name'].value,
				isObserver: this.userForm.controls['isObserver'].value,
				estimate: null,
				sessionId: sessionId,
			};

			const createdUser = await this.supabaseService.insertUser(newUser);

			this.sessionService.user.set(createdUser);

			await this.sessionService.trackPresence(createdUser);

			this.sessionService.updatePresentUsers();

			sessionStorage.setItem('userId', createdUser.id);
			this.userModalService.close();
		} catch (error) {
			alert(error);
		} finally {
			this.disabled = false;
			this.submitted = false;
		}
	}
}
