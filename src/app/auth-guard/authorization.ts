import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { Store } from '@ngrx/store';
import { userActions } from '../store/userStore/user.action';

export const rootGuard: CanActivateFn = (route, state) => {
  console.log("rootGuard");
  const router = inject(Router);
  const sessionService = inject(SessionService);
  const store = inject(Store);

  const token = localStorage.getItem('token');
  
  // If accessing login or register pages, allow access
  if (state.url.startsWith('/login') || state.url.startsWith('/register')) {
    return true;
  }

  // If no token, redirect to login
  if (!token) {
    return router.parseUrl('/login');
  }

  // Check if token is expired
  if (sessionService.isTokenExpired()) {
    console.warn('Token expired in guard, logging out');
    // Dispatch session expired action
    store.dispatch(userActions.sessionExpired());
    // Redirect to login with session expired flag
    return router.parseUrl('/login?sessionExpired=true');
  }

  // Token exists and is valid
  return true;
};