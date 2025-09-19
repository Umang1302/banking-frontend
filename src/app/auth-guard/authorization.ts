import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rootGuard: CanActivateFn = (route, state) => {
    console.log("rootGuard");
  const router = inject(Router);

  const token = localStorage.getItem('token');
  if (token) {
    return true;
  } else {
    if (state.url.startsWith('/login') || state.url.startsWith('/register')) {
      return true;
    }
    return router.parseUrl('/login');
  }
};