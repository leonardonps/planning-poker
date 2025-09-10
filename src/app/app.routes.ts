import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Sessao } from './components/sessao/sessao';
import { sessaoGuard } from './guards/sessao.guard';

export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'sessao/:id',
        component: Sessao,
        canActivate:[sessaoGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
