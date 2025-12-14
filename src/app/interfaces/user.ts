export interface User {
	id: string;
	name: string;
	estimate: number | null;
	isObserver: boolean;
	sessionId: string;
	createdAt: Date;
	updatedAt: Date;
}

export type UserCreate = Omit<User, 'createdAt' | 'updatedAt'>;
