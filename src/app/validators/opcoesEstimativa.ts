import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function opcoesEstimativaValidator(expressaoRegular: RegExp): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
            const formatacaoInvalida = !expressaoRegular.test(control.value);
            
            return formatacaoInvalida ? { formatacaoInvalida: {valor: control.value}} : null;
    };
} 