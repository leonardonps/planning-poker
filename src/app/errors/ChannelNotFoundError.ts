import { BaseError } from './BaseError';

export class ChannelNotFoundError extends BaseError {
	constructor() {
		super('Canal para a conexão com Supabase não encontrado');
	}
}
