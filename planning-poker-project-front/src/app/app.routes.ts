import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Sessao } from './sessao/sessao';

export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'sessao/:id',
        component: Sessao
    }
];
