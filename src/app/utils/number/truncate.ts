export const truncate = function (num: number, decimals: number): number {
	const decimalsProportion = Math.pow(10, decimals);
	return Math.floor(decimalsProportion * num) / decimalsProportion;
};
