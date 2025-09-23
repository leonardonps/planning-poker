import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Sessao } from './components/sessao/sessao';

export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'sessao/:id',
        component: Sessao
    },
    {
        path: '**',
        redirectTo: ''
    }
];
