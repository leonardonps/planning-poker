import { Injectable, signal, WritableSignal } from "@angular/core";
import { IUsuario } from "../../interfaces/shared/usuario";

@Injectable({ providedIn: 'root'})
export class SessaoService {
    opcoesEstimativa: WritableSignal<number[]> = signal([]);
    usuarios: WritableSignal<IUsuario[]> = signal([]);
}