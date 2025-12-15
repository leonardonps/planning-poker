import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { User } from '../../interfaces/user';
import { UserNotFoundError } from '../../errors/UserNotFoundError';
import { SupabaseService } from '../shared/supabase.service';

@Injectable({ providedIn: 'root' })
export class UserService {
	private supabaseService = inject(SupabaseService);

	user: WritableSignal<User | undefined> = signal(undefined);

	getUser(): User {
		const user = this.user();

		if (!user) {
			throw new UserNotFoundError();
		}

		return user;
	}

	async updateUserEstimate(option: number) {
		try {
			const user = this.getUser();

			const estimate = option === user.estimate ? null : option;

			this.user.update((user) => (user ? { ...user, estimate } : user));

			await this.supabaseService.updateUser(user.id, { estimate });
		} catch (error) {
			alert(error);
		}
	}

	async toggleUserMode(): Promise<void> {
		try {
			const user = this.getUser();

			const isObserver = !user.isObserver;
			const estimate = null;

			this.user.update((user) =>
				user ? { ...user, isObserver, estimate } : user,
			);

			await this.supabaseService.updateUser(user.id, { estimate, isObserver });
		} catch (error) {
			alert(error);
		}
	}
}
