import { BaseError } from './BaseError';

export class UserNotFoundError extends BaseError {
	constructor() {
		super('Usuário não encontrado');
	}
}
