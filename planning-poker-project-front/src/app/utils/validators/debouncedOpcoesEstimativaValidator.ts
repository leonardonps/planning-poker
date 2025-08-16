import { AbstractControl, AsyncValidatorFn, ValidationErrors } from "@angular/forms";
import { map, Observable, timer } from "rxjs";

export function debouncedOpcoesEstimativaValidator(expressaoRegular: RegExp, debounceMs: number = 500): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        return timer(debounceMs).pipe(
            map(() => {
                const formatacaoInvalida = !expressaoRegular.test(control.value);
            
                return formatacaoInvalida ? { formatacaoInvalida: {valor: control.value}} : null;
            })
        );
    }
}