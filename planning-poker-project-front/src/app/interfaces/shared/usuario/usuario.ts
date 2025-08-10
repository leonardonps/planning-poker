export interface IUsuario {
    id: string,
    nome: string,
    estimativa?: string | null,
    observador: boolean,
    sessaoId: string
    dataCriacao?: string;
}