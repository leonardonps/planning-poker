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
import { UserModalService } from '../../../../services/modals/user-modal.service';
import { SessionService } from '../../../../services/session/session.service';
import { generateId } from '../../../../utils/string/id';
import { UserCreate } from '../../../../interfaces/user';
import { UserService } from '../../../../services/user/user.service';

@Component({
	selector: 'app-user-modal',
	imports: [BaseModal, ReactiveFormsModule],
	templateUrl: './user-modal.html',
	styleUrl: './user-modal.scss',
})
export class UserModal implements OnInit, AfterViewInit {
	@ViewChild('userName') userNameRef!: ElementRef;

	private userService = inject(UserService);
	private sessionService = inject(SessionService);

	private userModalService = inject(UserModalService);

	protected title = 'Novo participante';

	protected userForm!: FormGroup;

	protected submitted = false;
	protected disabled = false;

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
			const session = this.sessionService.getSession();

			const userId = generateId(8);

			const newUser: UserCreate = {
				id: userId,
				name: this.userForm.controls['name'].value,
				isObserver: this.userForm.controls['isObserver'].value,
				estimate: null,
				sessionId: session.id,
			};

			sessionStorage.setItem('userId', userId);
			this.userService.userIdSessionStorage.set(userId);
			const createdUser = await this.userService.createUser(newUser);

			this.userService.user.set(createdUser);

			const presenceState = await this.sessionService
				.getSessionChannel()
				.track({
					userId: createdUser.id,
					userName: createdUser.name,
					onlineAt: new Date().toISOString(),
				});

			console.warn('Track response - User: ', presenceState);

			this.userModalService.close();
		} catch (error) {
			sessionStorage.removeItem('userId');
			this.userService.userIdSessionStorage.set(null);
			this.userService.user.set(undefined);
			alert(error);
		} finally {
			this.disabled = false;
			this.submitted = false;
		}
	}
}
