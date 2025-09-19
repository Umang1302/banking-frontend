import { Routes } from '@angular/router';
import { rootGuard } from './auth-guard/authorization';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./module/home/home').then(m => m.Home),
    canActivate: [rootGuard]
  },
  { path: 'login', loadComponent: () => import('./module/auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./module/auth/register/register').then(m => m.Register) },
  { path: '**', redirectTo: 'login' }
];
