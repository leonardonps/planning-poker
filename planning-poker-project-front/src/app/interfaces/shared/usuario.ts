export interface IUsuario {
    id: string,
    nome: string,
    estimativa?: string,
    observador: boolean,
    sessaoId: string
    dataCriacao?: string;
}