import { Injectable, signal, WritableSignal } from "@angular/core";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";
import { ISessao } from "../../interfaces/shared/sessao/sessao";

@Injectable({ providedIn: 'root'})
export class SessaoService {
    opcoesEstimativa: WritableSignal<number[] | null> = signal(null);
    usuarios: WritableSignal<IUsuario[]> = signal([]);
    usuario: WritableSignal<IUsuario | null> = signal(null);
}