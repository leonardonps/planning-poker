import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Session } from './components/session/session';

export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'session/:id',
        component: Session
    },
    {
        path: '**',
        redirectTo: ''
    }
];
