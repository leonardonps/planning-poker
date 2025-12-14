export interface SessionResult {
	id: string;
	description: string;
	averageEstimate: number;
	sessionId: string;
	generatedBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export type SessionResultCreate = Omit<
	SessionResult,
	'id' | 'createdAt' | 'updatedAt'
>;

export type SessionResultUpdate = Partial<
	Omit<SessionResult, 'id' | 'createdAt' | 'updatedAt'>
>;
