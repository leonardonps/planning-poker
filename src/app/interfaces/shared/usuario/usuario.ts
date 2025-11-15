export interface IUsuario {
  id: string;
  nome: string;
  estimativa: number | null;
  observador: boolean;
  sessaoId: string;
  dataCriacao: string | null;
}
