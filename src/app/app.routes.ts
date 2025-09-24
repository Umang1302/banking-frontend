import { Routes } from '@angular/router';
import { rootGuard } from './auth-guard/authorization';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./module/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [rootGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./module/home/home').then(m => m.Home),
    canActivate: [rootGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./module/user-profile/user-profile').then(m => m.UserProfileComponent),
    canActivate: [rootGuard]
  },
  // {
  //   path: 'user-management',
  //   loadComponent: () => import('./module/user-management/user-management').then(m => m.UserManagementComponent),
  //   canActivate: [rootGuard]
  // },
  { path: 'login', loadComponent: () => import('./module/auth/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./module/auth/register/register').then(m => m.Register) },
  { path: '**', redirectTo: '/dashboard' }
];
