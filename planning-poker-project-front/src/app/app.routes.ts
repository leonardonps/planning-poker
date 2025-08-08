import { Routes } from '@angular/router';
import { Login } from './componentes/login/login';
import { Sessao } from './componentes/sessao/sessao';

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
