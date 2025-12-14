import { Component, input } from '@angular/core';

@Component({
	selector: 'app-toast',
	imports: [],
	templateUrl: './toast.html',
	styleUrl: './toast.scss',
})
export class Toast {
	text = input<string>();
}
