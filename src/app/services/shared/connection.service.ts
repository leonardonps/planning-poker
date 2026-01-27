import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class ConnectionService {
	isOnline: WritableSignal<boolean> = signal(navigator.onLine);
	wasOffline: WritableSignal<boolean> = signal(false);

	constructor() {
		window.addEventListener('online', () => this.isOnline.set(true));
		window.addEventListener('offline', () => this.isOnline.set(false));
	}
}
