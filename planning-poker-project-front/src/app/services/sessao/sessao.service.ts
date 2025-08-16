import { Injectable, signal, WritableSignal } from "@angular/core";
import { IUsuario } from "../../interfaces/shared/usuario/usuario";

@Injectable({ providedIn: 'root'})
export class SessaoService {
    usuarios: WritableSignal<IUsuario[]> = signal([]);
    usuario: WritableSignal<IUsuario | null> = signal(null);
    opcaoSelecionada: WritableSignal<number | null> = signal(null);
    opcoesEstimativa: WritableSignal<number[] | null> = signal(null);
    mediaEstimativasSessao: WritableSignal<number | null> = signal(null);
}