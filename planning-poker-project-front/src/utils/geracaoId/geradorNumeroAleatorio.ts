export const gerarNumeroAleatorio = function (valorInicial: number, valorFinal: number) {
    return Math.floor((Math.random() * (valorFinal - valorInicial))) + valorInicial;
}
