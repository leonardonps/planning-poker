import { generateRandomNumber } from '../number/random-number';

export const generateId = function (tamanho: number): string {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let id = '';

	for (let i = 0; i < tamanho; i++) {
		id += characters[generateRandomNumber(0, characters.length - 1)];
	}
	return id;
};
