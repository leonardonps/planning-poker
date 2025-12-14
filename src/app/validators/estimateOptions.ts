import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function estimateOptionsValidator(regExp: RegExp): ValidatorFn {
	return (control: AbstractControl): ValidationErrors | null => {
		const invalidFormat = !regExp.test(control.value);

		return invalidFormat ? { invalidFormat: { valor: control.value } } : null;
	};
}
