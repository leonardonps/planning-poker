import { Component, signal } from '@angular/core';
import { Login } from './login/login';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('planning-poker-project-front');
}
