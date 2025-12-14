export interface Session {
	id: string;
	estimateOptions: string;
	averageEstimate: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export type SessionCreate = Omit<Session, 'createdAt' | 'updatedAt'>;
