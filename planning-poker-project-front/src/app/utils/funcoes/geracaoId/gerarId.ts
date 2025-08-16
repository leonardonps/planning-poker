import { gerarNumeroAleatorio } from "./geradorNumeroAleatorio";

export const gerarId = function (tamanho: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let id = '';
    
    for (let i = 0; i < tamanho; i++) {
        id += characters[gerarNumeroAleatorio(0, characters.length-1)]
    }

    return id;
}