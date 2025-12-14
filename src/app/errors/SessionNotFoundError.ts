import { BaseError } from './BaseError';

export class SessionNotFoundError extends BaseError {
	constructor(sessionId: string | undefined | null) {
		super(
			sessionId
				? `Sessão ${sessionId} não encontrada`
				: 'Sessão não encontrada',
		);
	}
}
