export class BaseError extends Error {
	public override cause?: unknown;
	public status?: string;

	constructor(
		message: string,
		options: { cause?: unknown; status?: string } = {},
	) {
		super(message);
		this.name = this.constructor.name;
		this.cause = options.cause;
		this.status = options.status;
		Error.captureStackTrace(this, this.constructor);
	}
}
