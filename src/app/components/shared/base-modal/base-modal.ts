import { Component, input } from '@angular/core';

@Component({
  selector: 'app-base-modal',
  imports: [],
  templateUrl: './base-modal.html',
  styleUrl: './base-modal.scss'
})
export class BaseModal {
  title = input<string>();
}
