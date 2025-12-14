import { PostgrestError } from '@supabase/supabase-js';
import { BaseError } from './BaseError';

export class PostgrestBaseError extends BaseError {
	constructor(message: string, postgrestError: PostgrestError) {
		super(`${message} | ${postgrestError.code}`, {
			cause: postgrestError.cause,
			status: postgrestError.code,
		});
	}
}
