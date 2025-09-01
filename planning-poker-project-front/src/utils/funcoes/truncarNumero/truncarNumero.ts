export const truncarNumero = function (numero: number, casasDecimais: number): number {
    const proporcaoCasasDecimais = Math.pow(10, casasDecimais);
    return Math.floor(proporcaoCasasDecimais * numero) / proporcaoCasasDecimais ;
}