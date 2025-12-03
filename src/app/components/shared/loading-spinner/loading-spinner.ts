import { Component } from '@angular/core';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-loading',
  imports: [Spinner],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss'
})
export class LoadingSpinner {

}
