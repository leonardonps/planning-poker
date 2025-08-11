export const truncarNumero = function (numero: number, casasDecimais: number): number {
    const proporcaoCasasDecimais = Math.pow(10, casasDecimais);
    const numeroTruncado = (proporcaoCasasDecimais * numero ) / proporcaoCasasDecimais;

    return Math.floor(numeroTruncado);
}