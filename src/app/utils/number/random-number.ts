export const generateRandomNumber = function (
	valorInicial: number,
	valorFinal: number,
): number {
	return (
		Math.floor(Math.random() * (valorFinal - valorInicial)) + valorInicial
	);
};
