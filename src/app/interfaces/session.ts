export interface Session {
	id: string;
	estimateOptions: string;
	averageEstimate: number | null;
	createdAt: Date;
	updatedAt: Date;
	version: number;
}

export type SessionCreate = Omit<
	Session,
	'createdAt' | 'updatedAt' | 'version'
>;

export type SessionUpdate = Partial<
	Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'version'>
>;
